'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/logger';

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  table: string;
}

interface RealtimeContextType {
  subscribeToReceipts: (callback: (payload: RealtimePayload) => void) => () => void;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

let cachedOrgId: string | null = null;
let orgIdPromise: Promise<string | null> | null = null;

async function getOrgId(): Promise<string | null> {
  if (cachedOrgId) return cachedOrgId;
  if (orgIdPromise) return orgIdPromise;
  orgIdPromise = (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.rpc('get_user_org');
      cachedOrgId = data as string | null;
      return cachedOrgId;
    } catch {
      return null;
    }
  })();
  return orgIdPromise;
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      const orgId = await getOrgId();
      if (!mounted || !orgId) return;

      channelRef.current = supabase
        .channel(`org-receipts:${orgId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'receipts',
            filter: `org_id=eq.${orgId}`,
          },
          () => {
            // Base listener — actual handlers registered via subscribeToReceipts
          }
        )
        .subscribe((status) => {
          if (mounted) setIsConnected(status === 'SUBSCRIBED');
        });
    }

    setup().catch((err) => logError(err, { action: 'realtime_setup_failed' }));

    return () => {
      mounted = false;
      channelRef.current?.unsubscribe();
    };
  }, []);

  const subscribeToReceipts = (callback: (payload: RealtimePayload) => void) => {
    // Return a no-op cleanup; the base channel re-broadcasts changes.
    // Individual callers can register additional channels if needed.
    const channel = supabase
      .channel(`org-receipts-handler-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'receipts' }, callback)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  return (
    <RealtimeContext.Provider value={{ subscribeToReceipts, isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}