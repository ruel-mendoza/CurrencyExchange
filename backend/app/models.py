from typing import List, Optional
from pydantic import BaseModel, Field

class ConversionResponse(BaseModel):
    original_amount: float = Field(..., description="The original amount to convert")
    from_currency: str = Field(..., description="Source currency code (3 letters)", json_schema_extra={"example": "USD"})
    to_currency: str = Field(..., description="Target currency code (3 letters)", json_schema_extra={"example": "EUR"})
    converted_amount: float = Field(..., description="Calculated converted amount")
    rate: float = Field(..., description="Exchange rate applied (1 unit of from_currency in to_currency)")
    source: str = Field(..., description="Source of the exchange rate data: 'Live API', 'Cache', or 'Playwright Scraped'")
    last_updated: Optional[str] = Field(None, description="ISO timestamp of when the rates were fetched/cached")

class CurrencyInfo(BaseModel):
    code: str
    name: str

class CurrenciesResponse(BaseModel):
    currencies: List[CurrencyInfo]
    popular: List[str]
    last_updated: Optional[str] = None
    source: str
