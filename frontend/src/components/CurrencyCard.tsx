import React, { useState, useEffect } from 'react';
import { ArrowUpDown, RefreshCw, Copy, Check, TrendingUp, Sparkles, Bot, Zap } from 'lucide-react';
import { ConversionResponse, CurrencyInfo } from '../types/currency';
import { convertCurrency, convertCurrencyScraped, fetchCurrencies } from '../services/api';
import { SourceBadge } from './SourceBadge';
import { ErrorAlert } from './ErrorAlert';

const DEFAULT_POPULAR = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'PHP'];

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000];

export const CurrencyCard: React.FC = () => {
  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  
  // Scraping mode vs standard API/Cache mode
  const [mode, setMode] = useState<'standard' | 'scraped'>('standard');

  const [availableCurrencies, setAvailableCurrencies] = useState<CurrencyInfo[]>([]);
  const [popularCurrencies, setPopularCurrencies] = useState<string[]>(DEFAULT_POPULAR);
  
  const [result, setResult] = useState<ConversionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  // Load available currencies on mount
  useEffect(() => {
    async function loadCurrencies() {
      try {
        const data = await fetchCurrencies();
        if (data && data.currencies && data.currencies.length > 0) {
          setAvailableCurrencies(data.currencies);
          if (data.popular && data.popular.length > 0) {
            setPopularCurrencies(data.popular);
          }
        }
      } catch (err) {
        console.warn('Could not load full currency list, fallback to defaults:', err);
      }
    }
    loadCurrencies();
  }, []);

  // Perform initial conversion on mount
  useEffect(() => {
    handleConvert();
  }, []);

  const handleConvert = async (
    customAmount?: string,
    customFrom?: string,
    customTo?: string,
    customMode?: 'standard' | 'scraped'
  ) => {
    const amtStr = customAmount !== undefined ? customAmount : amount;
    const fromCurr = customFrom !== undefined ? customFrom : fromCurrency;
    const toCurr = customTo !== undefined ? customTo : toCurrency;
    const currentMode = customMode !== undefined ? customMode : mode;

    const numAmount = parseFloat(amtStr);
    if (isNaN(numAmount) || numAmount < 0) {
      setError('Please enter a valid non-negative amount.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let data: ConversionResponse;
      if (currentMode === 'scraped') {
        data = await convertCurrencyScraped(numAmount, fromCurr, toCurr);
      } else {
        data = await convertCurrency(numAmount, fromCurr, toCurr);
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during currency conversion.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setIsSwapping(true);
    const newFrom = toCurrency;
    const newTo = fromCurrency;
    setFromCurrency(newFrom);
    setToCurrency(newTo);
    handleConvert(amount, newFrom, newTo);
    setTimeout(() => setIsSwapping(false), 300);
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
    handleConvert(val.toString(), fromCurrency, toCurrency);
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `${result.original_amount} ${result.from_currency} = ${result.converted_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${result.to_currency} (Rate: ${result.rate})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build combined list of currencies for select
  const currencyOptions = availableCurrencies.length > 0 
    ? availableCurrencies 
    : popularCurrencies.map(code => ({ code, name: code }));

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/20 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-6">
          {/* Header info / live status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Exchange Calculator</h2>
                <p className="text-xs text-slate-400">Real-time rates with Playwright fallback</p>
              </div>
            </div>

            {result && (
              <SourceBadge source={result.source} lastUpdated={result.last_updated} />
            )}
          </div>

          {/* Mode Selector Toggle */}
          <div className="bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMode('standard');
                handleConvert(amount, fromCurrency, toCurrency, 'standard');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'standard'
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Standard (API + 1h Cache)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('scraped');
                handleConvert(amount, fromCurrency, toCurrency, 'scraped');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'scraped'
                  ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40 shadow-md shadow-purple-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span>Playwright Headless Scraper</span>
            </button>
          </div>

          {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Amount to Convert
            </label>
            <div className="relative rounded-2xl bg-slate-800/60 border border-slate-700/60 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConvert()}
                placeholder="0.00"
                className="w-full bg-transparent px-4 py-3.5 text-2xl font-bold text-white placeholder-slate-500 focus:outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                {fromCurrency}
              </span>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Quick:
              </span>
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    amount === val.toString()
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-medium'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>

          {/* Currency Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-3">
            {/* From Currency */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                From Currency
              </label>
              <div className="relative">
                <select
                  value={fromCurrency}
                  onChange={(e) => {
                    setFromCurrency(e.target.value);
                    handleConvert(amount, e.target.value, toCurrency);
                  }}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl px-4 py-3.5 text-base font-semibold text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                >
                  <optgroup label="Popular Currencies">
                    {popularCurrencies.map((code) => {
                      const curr = availableCurrencies.find(c => c.code === code);
                      return (
                        <option key={`pop-from-${code}`} value={code}>
                          {curr ? curr.name : code}
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label="All Currencies">
                    {currencyOptions.map((curr) => (
                      <option key={`from-${curr.code}`} value={curr.code}>
                        {curr.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center sm:pt-6">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap currencies"
                className={`p-3 rounded-2xl bg-slate-800 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-all duration-200 shadow-md ${
                  isSwapping ? 'rotate-180 scale-95' : ''
                }`}
                aria-label="Swap currencies"
              >
                <ArrowUpDown className="w-5 h-5" />
              </button>
            </div>

            {/* To Currency */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                To Currency
              </label>
              <div className="relative">
                <select
                  value={toCurrency}
                  onChange={(e) => {
                    setToCurrency(e.target.value);
                    handleConvert(amount, fromCurrency, e.target.value);
                  }}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl px-4 py-3.5 text-base font-semibold text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                >
                  <optgroup label="Popular Currencies">
                    {popularCurrencies.map((code) => {
                      const curr = availableCurrencies.find(c => c.code === code);
                      return (
                        <option key={`pop-to-${code}`} value={code}>
                          {curr ? curr.name : code}
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label="All Currencies">
                    {currencyOptions.map((curr) => (
                      <option key={`to-${curr.code}`} value={curr.code}>
                        {curr.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={() => handleConvert()}
            disabled={loading}
            className={`w-full font-bold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg ${
              mode === 'scraped'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-purple-500/25'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>
                  {mode === 'scraped'
                    ? 'Launching Playwright Chromium & Scraping...'
                    : 'Fetching Latest Rates...'}
                </span>
              </>
            ) : (
              <>
                {mode === 'scraped' ? <Bot className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                <span>
                  {mode === 'scraped' ? 'Scrape Exchange Rate with Playwright' : 'Convert Currency'}
                </span>
              </>
            )}
          </button>

          {/* Result Card */}
          {result && (
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 space-y-3 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">
                    {result.original_amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}{' '}
                    <span className="text-slate-300 font-semibold">{result.from_currency}</span> =
                  </p>
                  <p className={`text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text mt-1 ${
                    result.source === 'Playwright Scraped'
                      ? 'bg-gradient-to-r from-purple-400 to-indigo-300'
                      : 'bg-gradient-to-r from-emerald-400 to-teal-300'
                  }`}>
                    {result.converted_amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}{' '}
                    <span className="text-xl font-semibold text-slate-300">
                      {result.to_currency}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy result"
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors border border-slate-700/50"
                  aria-label="Copy result"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Rates breakdown & Inverse */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-1.5">
                <div>
                  <span>1 {result.from_currency} = </span>
                  <span className="text-slate-200 font-medium">{result.rate} {result.to_currency}</span>
                </div>
                {result.rate > 0 && (
                  <div>
                    <span>1 {result.to_currency} = </span>
                    <span className="text-slate-200 font-medium">
                      {(1 / result.rate).toFixed(6)} {result.from_currency}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
