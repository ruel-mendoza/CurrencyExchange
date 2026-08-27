export interface ConversionResponse {
  original_amount: number;
  from_currency: string;
  to_currency: string;
  converted_amount: number;
  rate: number;
  source: 'Live API' | 'Cache' | 'Playwright Scraped' | string;
  last_updated?: string;
}

export interface CurrencyInfo {
  code: string;
  name: string;
}

export interface CurrenciesResponse {
  currencies: CurrencyInfo[];
  popular: string[];
  last_updated?: string;
  source: string;
}

export interface ConversionState {
  amount: number | string;
  fromCurrency: string;
  toCurrency: string;
}
