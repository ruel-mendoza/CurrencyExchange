# Full-Stack Currency Converter (FastAPI + Vite + Playwright + Docker)

A full-stack currency exchange application built with **Python FastAPI**, **React + TypeScript + Vite + Tailwind CSS**, **Playwright Headless Web Scraping**, and **Multi-Container Docker Orchestration**.

---

## Key Features

- **Real-Time Exchange Rates**: Fetches live rates directly from [Open Exchange Rates API](https://open.er-api.com/v6/latest/USD).
- **1-Hour Smart Local JSON Caching**: Caches rates locally in `backend/.cache.json` for 3600 seconds to optimize performance, minimize external API hits, and ensure fast response times.
- **Playwright Headless Browser Scraping**:
  - Live scraping via headless Chromium browser (`playwright`).
  - Endpoint: `GET /api/convert-scraped?amount={amount}&from={from}&to={to}`
  - Dynamic fallback strategy: if primary API fails, FastAPI automatically triggers the Playwright scraper.
- **Multi-Container Docker Architecture**:
  - **Backend**: Python 3.13 / Playwright Ubuntu container with Chromium pre-installed (`mcr.microsoft.com/playwright/python:v1.45.0-jammy`) and live code mounting.
  - **Frontend**: Multi-stage Dockerfile (`node:20-alpine` build + `nginx:alpine` production server with reverse proxy).
  - **Orchestration**: `docker-compose.yml` orchestrating both containers on a dedicated network.
- **Interactive UI**:
  - Currency conversion calculator with amount input & quick amount chips ($10, $50, $100, $500, $1,000).
  - Mode selector toggle: **Standard (API + 1h Cache)** vs **Playwright Headless Scraper**.
  - Visual badges: `"Live API"`, `"Local Cache"`, and `"Playwright Scraped"` with timestamps.
  - Interactive currency swap button with smooth animation.
  - One-click copy result button.
  - Popular conversion pairs matrix widget showing current exchange rates.
  - Graceful error alerts.

---

## Project Structure

```
SupplierHub/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app, CORS, API endpoints (/api/convert, /api/convert-scraped, /api/currencies)
│   │   ├── services.py        # Rate fetching, Playwright headless scraping, caching, fallback logic
│   │   └── models.py          # Pydantic validation schemas
│   ├── .cache.json            # Local JSON cache (generated dynamically)
│   ├── Dockerfile             # Containerized with Playwright & Chromium
│   ├── requirements.txt       # fastapi, uvicorn, httpx, pydantic, playwright
│   └── run.py                 # Backend runner
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CurrencyCard.tsx   # Conversion form, mode toggle, result card
│   │   │   ├── ErrorAlert.tsx     # Alert banner
│   │   │   ├── Header.tsx         # App banner and branding
│   │   │   ├── PopularPairs.tsx   # Popular currency rate widgets
│   │   │   └── SourceBadge.tsx    # "Live API", "Cache", "Playwright Scraped" indicators
│   │   ├── services/
│   │   │   └── api.ts             # API client (standard + scraped conversion methods)
│   │   ├── types/
│   │   │   └── currency.ts        # TypeScript models
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css              # Tailwind CSS styles
│   ├── Dockerfile             # Multi-stage build (Node -> Nginx)
│   ├── nginx.conf             # SPA routing & reverse proxy (/api/ -> http://backend:8000/)
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml         # Multi-container orchestration
├── run_dev.bat                # Windows Batch launcher (starts both locally)
├── run_dev.ps1                # PowerShell launcher (starts both locally)
└── README.md
```

---

## Running with Docker Compose

Launch the entire multi-container stack with a single command:

```bash
docker compose up --build
```

- **Frontend Application (Nginx)**: `http://localhost:5173`
- **Backend API (FastAPI + Playwright)**: `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`)

To run in the background:
```bash
docker compose up -d --build
```

To stop containers:
```bash
docker compose down
```

---

## Running Locally (Without Docker)

### 1. Launch with Script (Windows)
Double-click `run_dev.bat` or execute in PowerShell:
```powershell
./run_dev.ps1
```

### 2. Manual Startup

#### Backend
```bash
cd backend
python -m pip install -r requirements.txt
python -m playwright install chromium
python run.py
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## API Endpoints

### 1. `GET /api/convert`
Standard currency conversion using cached or live API rates, with dynamic Playwright fallback.
- Query parameters: `amount`, `from`, `to`

**Sample Response:**
```json
{
  "original_amount": 100.0,
  "from_currency": "USD",
  "to_currency": "EUR",
  "converted_amount": 85.7811,
  "rate": 0.857811,
  "source": "Cache",
  "last_updated": "2026-08-27T11:16:01.004476+00:00"
}
```

### 2. `GET /api/convert-scraped`
Directly scrapes rates via headless Chromium using Playwright.
- Query parameters: `amount`, `from`, `to`

**Sample Response:**
```json
{
  "original_amount": 100.0,
  "from_currency": "USD",
  "to_currency": "EUR",
  "converted_amount": 85.7811,
  "rate": 0.857811,
  "source": "Playwright Scraped",
  "last_updated": "2026-08-27T12:03:11.299225+00:00"
}
```

### 3. `GET /api/currencies`
Returns all 160+ supported world currencies, popular currencies, and data source.
