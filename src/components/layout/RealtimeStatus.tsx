'use client';

import { cn } from '@/lib/utils';

interface RealtimeStatusProps {
  /** Whether the realtime channel is currently subscribed. */
  connected: boolean;
  /** When true, also render the "Live" label next to the dot. */
  showLabel?: boolean;
  /** Optional className for the wrapper. */
  className?: string;
}

/**
 * Compact live-sync indicator. Shows a green pulsing dot when the realtime
 * channel is subscribed and an amber static dot when disconnected. The pulse
 * animation is disabled under prefers-reduced-motion via the `motion-reduce`
 * variant. Decorative — the accessible name is on the wrapper.
 */
export default function RealtimeStatus({ connected, showLabel = false, className }: RealtimeStatusProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      role="status"
      aria-label={connected ? 'Live sync connected' : 'Live sync disconnected'}
      title={connected ? 'Live sync connected' : 'Live sync disconnected'}
    >
      <span className="relative flex h-2 w-2">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
        )}
        <span
          className={cn(
            'relative inline-flex h-2 w-2 rounded-full',
            connected ? 'bg-emerald-400' : 'bg-amber-400',
          )}
        />
      </span>
      {showLabel && (
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-text-muted">
          {connected ? 'Live' : 'Offline'}
        </span>
      )}
    </span>
  );
}
