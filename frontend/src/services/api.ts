import { ConversionResponse, CurrenciesResponse } from '../types/currency';

// When running with Vite proxy or Nginx in Docker, relative URLs work out of the box
const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : '';

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<ConversionResponse> {
  const url = `${API_BASE_URL}/api/convert?amount=${encodeURIComponent(amount)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  
  const res = await fetch(url);
  
  if (!res.ok) {
    let errorDetail = `Conversion request failed with status ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson && errorJson.detail) {
        errorDetail = typeof errorJson.detail === 'string' 
          ? errorJson.detail 
          : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export async function convertCurrencyScraped(
  amount: number,
  from: string,
  to: string
): Promise<ConversionResponse> {
  const url = `${API_BASE_URL}/api/convert-scraped?amount=${encodeURIComponent(amount)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  
  const res = await fetch(url);
  
  if (!res.ok) {
    let errorDetail = `Playwright scraping request failed with status ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson && errorJson.detail) {
        errorDetail = typeof errorJson.detail === 'string' 
          ? errorJson.detail 
          : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export async function fetchCurrencies(): Promise<CurrenciesResponse> {
  const res = await fetch(`${API_BASE_URL}/api/currencies`);
  
  if (!res.ok) {
    let errorDetail = `Failed to fetch currencies list (${res.status})`;
    try {
      const errorJson = await res.json();
      if (errorJson && errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      // Ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}
