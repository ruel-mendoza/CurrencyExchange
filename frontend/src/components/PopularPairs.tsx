import React, { useEffect, useState } from 'react';
import { convertCurrency } from '../services/api';
import { ArrowRight, Sparkles } from 'lucide-react';

interface PairItem {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  rate?: number;
  loading?: boolean;
}

const POPULAR_PAIRS: PairItem[] = [
  { from: 'USD', to: 'EUR', fromName: 'USD', toName: 'EUR' },
  { from: 'USD', to: 'GBP', fromName: 'USD', toName: 'GBP' },
  { from: 'USD', to: 'JPY', fromName: 'USD', toName: 'JPY' },
  { from: 'USD', to: 'CAD', fromName: 'USD', toName: 'CAD' },
  { from: 'USD', to: 'PHP', fromName: 'USD', toName: 'PHP' },
  { from: 'EUR', to: 'GBP', fromName: 'EUR', toName: 'GBP' },
];

export const PopularPairs: React.FC = () => {
  const [pairs, setPairs] = useState<PairItem[]>(
    POPULAR_PAIRS.map(p => ({ ...p, loading: true }))
  );

  useEffect(() => {
    async function loadRates() {
      const updated = await Promise.all(
        POPULAR_PAIRS.map(async (pair) => {
          try {
            const data = await convertCurrency(1, pair.from, pair.to);
            return { ...pair, rate: data.rate, loading: false };
          } catch {
            return { ...pair, loading: false };
          }
        })
      );
      setPairs(updated);
    }
    loadRates();
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto pt-4">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-300">Popular Conversions (1 Unit Base)</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {pairs.map((pair) => (
          <div
            key={`${pair.from}-${pair.to}`}
            className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all hover:bg-slate-850"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>{pair.from}</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="text-slate-300 font-medium">{pair.to}</span>
            </div>
            <div className="text-base font-bold text-slate-100">
              {pair.loading ? (
                <div className="h-5 w-16 bg-slate-800 animate-pulse rounded"></div>
              ) : pair.rate ? (
                pair.rate.toLocaleString(undefined, { maximumFractionDigits: 4 })
              ) : (
                '—'
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

