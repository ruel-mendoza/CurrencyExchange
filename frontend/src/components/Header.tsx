import React from 'react';
import { Coins, Globe2, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="text-center space-y-4 max-w-2xl mx-auto pt-6 pb-2">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-emerald-400 text-xs font-semibold backdrop-blur-md shadow-inner">
        <Globe2 className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span>FastAPI + Vite React Currency Suite</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-3">
          <span className="p-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Coins className="w-8 h-8" />
          </span>
          Currency Exchange
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
          Convert world currencies with up-to-date market rates, automated 1-hour caching, and instant conversion computation.
        </p>
      </div>

      <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Local Caching Layer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>160+ Currencies Supported</span>
        </div>
      </div>
    </header>
  );
};

