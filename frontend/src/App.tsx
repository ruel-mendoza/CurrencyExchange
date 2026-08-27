import React from 'react';
import { Header } from './components/Header';
import { CurrencyCard } from './components/CurrencyCard';
import { PopularPairs } from './components/PopularPairs';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto w-full space-y-8">
        <Header />
        
        <main className="space-y-6">
          <CurrencyCard />
          <PopularPairs />
        </main>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-500 py-6 mt-8 border-t border-slate-800/60 max-w-4xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          FastAPI + Vite React Currency Suite • Free API Powered by open.er-api.com
        </p>
        <p className="text-slate-600">
          Cache policy: Local JSON cache refreshed every 60 minutes
        </p>
      </footer>
    </div>
  );
};

export default App;

