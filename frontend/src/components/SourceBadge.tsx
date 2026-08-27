import React from 'react';
import { Database, Zap, Bot, Clock } from 'lucide-react';

interface SourceBadgeProps {
  source: 'Live API' | 'Cache' | 'Playwright Scraped' | string;
  lastUpdated?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source, lastUpdated }) => {
  const isLive = source === 'Live API';
  const isScraped = source === 'Playwright Scraped';

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
          isScraped
            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
            : isLive
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
        }`}
        title={
          isScraped
            ? 'Rates scraped dynamically via headless Playwright Chromium'
            : isLive
            ? 'Rates freshly fetched from Open Exchange Rates API'
            : 'Rates served from local fast cache (< 1 hr old)'
        }
      >
        {isScraped ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <Bot className="w-3.5 h-3.5" />
            <span>Playwright Scraped</span>
          </>
        ) : isLive ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Zap className="w-3.5 h-3.5" />
            <span>Live API</span>
          </>
        ) : (
          <>
            <Database className="w-3.5 h-3.5" />
            <span>Local Cache</span>
          </>
        )}
      </div>

      {formattedTime && (
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-500" />
          {formattedTime}
        </span>
      )}
    </div>
  );
};
