'use client';

import { Layers, Loader2, AlertCircle } from 'lucide-react';

interface BatchOverlayProps {
  progress: number;
  total: number;
  error?: string | null;
  failedItems?: number;
}

export default function BatchOverlay({ progress, total, error, failedItems = 0 }: BatchOverlayProps) {
  const percentage = (Math.max(1, progress) / total) * 100;
  const hasError = error || failedItems > 0;

  return (
    <div className={`mb-4 overflow-hidden rounded-[3rem] border bg-obsidian shadow-[0_0_20px_rgba(190,169,142,0.1)] ${
      hasError ? 'border-danger/30' : 'border-[#dfcaaa]/30'
    }`} role="status" aria-live="polite">
      <div className="relative px-5 py-3">
        <div className="flex items-center gap-3 relative z-10">
          {hasError ? (
            <AlertCircle className="h-5 w-5 text-danger" />
          ) : (
            <Layers className="h-5 w-5 animate-pulse text-champagne" />
          )}
          <div className="flex-1">
            <p className={`text-sm font-bold ${hasError ? 'text-danger' : 'text-champagne'}`}>
              {hasError ? 'Processing Issues Detected' : 'GALAXY Extraction Engine Active'}
            </p>
            <p className={`text-xs ${hasError ? 'text-danger/80' : 'text-champagne/80'}`}>
              {error || `Processing ${progress} of ${total}...`}
              {failedItems > 0 && ` (${failedItems} failed)`}
            </p>
          </div>
          {!hasError && <Loader2 className="h-4 w-4 animate-spin text-champagne" />}
        </div>
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-700 ease-in-out ${
            hasError ? 'bg-danger/10' : 'bg-champagne/10'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
