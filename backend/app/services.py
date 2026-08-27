import os
import re
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Tuple, Any, Optional
import httpx
from fastapi import HTTPException
from playwright.async_api import async_playwright

# Directory for caching
BASE_DIR = Path(__file__).resolve().parent.parent
CACHE_FILE = BASE_DIR / ".cache.json"
CACHE_TTL_SECONDS = 3600  # 1 hour

API_URL = "https://open.er-api.com/v6/latest/USD"

# Well-known currency names dictionary
CURRENCY_NAMES = {
    "USD": "US Dollar",
    "EUR": "Euro",
    "GBP": "British Pound",
    "JPY": "Japanese Yen",
    "CAD": "Canadian Dollar",
    "PHP": "Philippine Peso",
    "AUD": "Australian Dollar",
    "CHF": "Swiss Franc",
    "CNY": "Chinese Yuan",
    "INR": "Indian Rupee",
    "SGD": "Singapore Dollar",
    "NZD": "New Zealand Dollar",
    "HKD": "Hong Kong Dollar",
    "KRW": "South Korean Won",
    "MXN": "Mexican Peso",
    "BRL": "Brazilian Real",
    "ZAR": "South African Rand",
    "SEK": "Swedish Krona",
    "NOK": "Norwegian Krone",
    "THB": "Thai Baht",
    "MYR": "Malaysian Ringgit",
    "IDR": "Indonesian Rupiah",
    "AED": "UAE Dirham",
    "SAR": "Saudi Riyal",
    "TRY": "Turkish Lira",
    "PLN": "Polish Zloty",
    "DKK": "Danish Krone",
    "CZK": "Czech Koruna",
    "HUF": "Hungarian Forint",
    "ILS": "Israeli New Shekel",
}

POPULAR_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "PHP"]


def load_cache() -> Optional[Dict[str, Any]]:
    """Loads cache from .cache.json if valid and not expired."""
    if not CACHE_FILE.exists():
        return None
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            cache_data = json.load(f)
            cached_at = cache_data.get("cached_at", 0)
            if time.time() - cached_at < CACHE_TTL_SECONDS:
                return cache_data
    except Exception as e:
        print(f"Warning: Failed to read cache: {e}")
    return None


def save_cache(data: Dict[str, Any]) -> None:
    """Saves API response to .cache.json."""
    try:
        cache_data = {
            "cached_at": time.time(),
            "cached_at_iso": datetime.now(timezone.utc).isoformat(),
            "data": data
        }
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache_data, f, indent=2)
    except Exception as e:
        print(f"Warning: Failed to save cache: {e}")


async def get_exchange_rates() -> Tuple[Dict[str, float], str, Optional[str]]:
    """
    Fetches exchange rates either from local cache or live API.
    Returns (rates_dict, source, last_updated_iso).
    """
    # 1. Check local cache
    cache = load_cache()
    if cache is not None and "data" in cache and "rates" in cache["data"]:
        rates = cache["data"]["rates"]
        cached_iso = cache.get("cached_at_iso")
        return rates, "Cache", cached_iso

    # 2. Fetch live data from open.er-api.com
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(API_URL)
            response.raise_for_status()
            data = response.json()

            if data.get("result") != "success" or "rates" not in data:
                raise ValueError("Invalid response payload from exchange rate API")

            # Save to cache
            save_cache(data)
            now_iso = datetime.now(timezone.utc).isoformat()
            return data["rates"], "Live API", now_iso

    except Exception as exc:
        # If live API fails, attempt to use stale cache if available
        if CACHE_FILE.exists():
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    stale_cache = json.load(f)
                    if "data" in stale_cache and "rates" in stale_cache["data"]:
                        return stale_cache["data"]["rates"], "Cache (Stale)", stale_cache.get("cached_at_iso")
            except Exception:
                pass
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch exchange rates from provider: {str(exc)}"
        )


async def scrape_currency_rate(from_curr: str, to_curr: str) -> float:
    """
    Uses Playwright headless Chromium to scrape exchange rates directly from Google Finance
    or alternative provider.
    """
    from_curr = from_curr.strip().upper()
    to_curr = to_curr.strip().upper()

    if from_curr == to_curr:
        return 1.0

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage"
            ]
        )
        page = await browser.new_page()

        # Strategy 1: Google Finance
        try:
            google_url = f"https://www.google.com/finance/quote/{from_curr}-{to_curr}"
            await page.goto(google_url, wait_until="domcontentloaded", timeout=12000)
            
            # Wait for rate element
            el = await page.wait_for_selector(".YMlKec.fxKbKc, div.fxKbKc, [data-last-price]", timeout=5000)
            if el:
                text = await el.inner_text()
                clean_text = re.sub(r"[^\d.]", "", text)
                if clean_text:
                    rate = float(clean_text)
                    await browser.close()
                    return rate
        except Exception as e:
            print(f"Google Finance scrape attempt for {from_curr}->{to_curr}: {e}")

        # Strategy 2: Alternate live scraping via Playwright browser page
        try:
            api_page_url = f"https://open.er-api.com/v6/latest/{from_curr}"
            await page.goto(api_page_url, wait_until="domcontentloaded", timeout=10000)
            content = await page.content()
            
            # Extract JSON from page body
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                if "rates" in data and to_curr in data["rates"]:
                    rate = float(data["rates"][to_curr])
                    await browser.close()
                    return rate
        except Exception as e:
            print(f"Fallback Playwright scrape error: {e}")

        await browser.close()
        raise HTTPException(
            status_code=502,
            detail=f"Playwright scraper failed to retrieve exchange rate for {from_curr} -> {to_curr}"
        )


async def convert_currency_scraped(
    amount: float,
    from_curr: str,
    to_curr: str
) -> Dict[str, Any]:
    """
    Performs currency conversion directly via Playwright headless browser scraping.
    """
    if amount < 0:
        raise HTTPException(status_code=400, detail="Amount must be a non-negative number")

    from_curr = from_curr.strip().upper()
    to_curr = to_curr.strip().upper()

    rate = await scrape_currency_rate(from_curr, to_curr)
    converted_amount = round(amount * rate, 4)
    now_iso = datetime.now(timezone.utc).isoformat()

    return {
        "original_amount": amount,
        "from_currency": from_curr,
        "to_currency": to_curr,
        "converted_amount": converted_amount,
        "rate": round(rate, 6),
        "source": "Playwright Scraped",
        "last_updated": now_iso
    }


async def convert_currency(
    amount: float,
    from_curr: str,
    to_curr: str
) -> Dict[str, Any]:
    """
    Performs conversion between two currencies using API/Cache with dynamic Playwright fallback.
    """
    if amount < 0:
        raise HTTPException(status_code=400, detail="Amount must be a non-negative number")

    from_curr = from_curr.strip().upper()
    to_curr = to_curr.strip().upper()

    try:
        rates, source, last_updated = await get_exchange_rates()

        if from_curr not in rates:
            raise HTTPException(status_code=400, detail=f"Unsupported currency code: '{from_curr}'")
        if to_curr not in rates:
            raise HTTPException(status_code=400, detail=f"Unsupported currency code: '{to_curr}'")

        from_usd_rate = rates[from_curr]
        to_usd_rate = rates[to_curr]

        rate = to_usd_rate / from_usd_rate
        converted_amount = round(amount * rate, 4)

        return {
            "original_amount": amount,
            "from_currency": from_curr,
            "to_currency": to_curr,
            "converted_amount": converted_amount,
            "rate": round(rate, 6),
            "source": "Cache" if "Cache" in source else "Live API",
            "last_updated": last_updated
        }
    except Exception as primary_error:
        # Dynamic fallback to Playwright scraper if primary API/cache failed
        print(f"Primary conversion failed ({primary_error}). Attempting dynamic Playwright fallback...")
        try:
            return await convert_currency_scraped(amount, from_curr, to_curr)
        except Exception:
            raise primary_error


async def list_available_currencies() -> Dict[str, Any]:
    """
    Lists available currency codes with human-readable names.
    """
    rates, source, last_updated = await get_exchange_rates()
    currencies = []
    for code in sorted(rates.keys()):
        name = CURRENCY_NAMES.get(code, code)
        currencies.append({"code": code, "name": f"{code} - {name}" if name != code else code})

    return {
        "currencies": currencies,
        "popular": POPULAR_CURRENCIES,
        "last_updated": last_updated,
        "source": "Cache" if "Cache" in source else "Live API"
    }
