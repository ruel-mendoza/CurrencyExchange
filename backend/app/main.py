from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app.models import ConversionResponse, CurrenciesResponse
from app.services import convert_currency, convert_currency_scraped, list_available_currencies

app = FastAPI(
    title="Currency Converter API (with Playwright Scraper)",
    description="FastAPI backend providing exchange rates with local 1-hour JSON caching and Playwright headless web scraping.",
    version="1.1.0"
)

# Configure CORS for Vite frontend / Nginx proxy
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost",
    "http://127.0.0.1",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "Currency Converter API (Docker + Playwright)"}


@app.get("/api/currencies", response_model=CurrenciesResponse, tags=["Currencies"])
async def get_currencies():
    """
    Get list of supported currencies, popular picks, and data source.
    """
    return await list_available_currencies()


@app.get("/api/convert", response_model=ConversionResponse, tags=["Conversion"])
async def convert(
    amount: float = Query(..., description="Amount to convert", ge=0),
    from_curr: str = Query(..., alias="from", description="Base currency code (e.g. USD)"),
    to_curr: str = Query(..., alias="to", description="Target currency code (e.g. EUR)")
):
    """
    Convert an amount using cached or live exchange rates, with dynamic Playwright fallback.
    """
    return await convert_currency(amount=amount, from_curr=from_curr, to_curr=to_curr)


@app.get("/api/convert-scraped", response_model=ConversionResponse, tags=["Playwright Scraping"])
async def convert_scraped(
    amount: float = Query(..., description="Amount to convert", ge=0),
    from_curr: str = Query(..., alias="from", description="Base currency code (e.g. USD)"),
    to_curr: str = Query(..., alias="to", description="Target currency code (e.g. EUR)")
):
    """
    Directly scrape real-time exchange rates using a headless Playwright Chromium instance.
    """
    return await convert_currency_scraped(amount=amount, from_curr=from_curr, to_curr=to_curr)
