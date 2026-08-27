import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services import convert_currency, convert_currency_scraped, get_exchange_rates

client = TestClient(app)


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "ok"


def test_currencies_list():
    """Test retrieving supported currencies and popular list."""
    response = client.get("/api/currencies")
    assert response.status_code == 200
    data = response.json()
    assert "currencies" in data
    assert "popular" in data
    assert len(data["currencies"]) > 100
    assert "USD" in data["popular"]
    assert "EUR" in data["popular"]
    assert "PHP" in data["popular"]


def test_standard_conversion():
    """Test standard conversion endpoint via API/Cache."""
    response = client.get("/api/convert?amount=100&from=USD&to=EUR")
    assert response.status_code == 200
    data = response.json()
    assert data["original_amount"] == 100
    assert data["from_currency"] == "USD"
    assert data["to_currency"] == "EUR"
    assert data["converted_amount"] > 0
    assert data["rate"] > 0
    assert data["source"] in ["Live API", "Cache", "Playwright Scraped"]


def test_invalid_currency():
    """Test conversion with an unsupported currency code returns 400."""
    response = client.get("/api/convert?amount=100&from=INVALID&to=EUR")
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data


def test_negative_amount_validation():
    """Test negative amount returns validation error (422)."""
    response = client.get("/api/convert?amount=-50&from=USD&to=EUR")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_scraped_conversion_service():
    """Test the Playwright scraper service directly."""
    result = await convert_currency_scraped(amount=100, from_curr="USD", to_curr="EUR")
    assert result["original_amount"] == 100
    assert result["from_currency"] == "USD"
    assert result["to_currency"] == "EUR"
    assert result["converted_amount"] > 0
    assert result["rate"] > 0
    assert result["source"] == "Playwright Scraped"


def test_scraped_conversion_endpoint():
    """Test /api/convert-scraped endpoint."""
    response = client.get("/api/convert-scraped?amount=100&from=USD&to=EUR")
    assert response.status_code == 200
    data = response.json()
    assert data["original_amount"] == 100
    assert data["from_currency"] == "USD"
    assert data["to_currency"] == "EUR"
    assert data["converted_amount"] > 0
    assert data["rate"] > 0
    assert data["source"] == "Playwright Scraped"


def test_playwright_page_e2e(page):
    """
    Playwright page fixture test verifying headless browser navigation
    and DOM execution against external financial rate endpoint.
    """
    page.goto("https://open.er-api.com/v6/latest/USD")
    body_text = page.inner_text("body")
    assert "rates" in body_text
    assert "USD" in body_text

