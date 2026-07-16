'use client';

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  table: string;
}

interface RealtimeContextType {
  subscribeToReceipts: (callback: (payload: RealtimePayload) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user?.orgId) return;

    channelRef.current = supabase
      .channel(`org-receipts:${user.orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receipts',
          filter: `org_id=eq.${user.orgId}`,
        },
        (_payload) => {
          // The actual handler will be set via subscribeToReceipts
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [user?.orgId]);

  const subscribeToReceipts = (callback: (payload: RealtimePayload) => void) => {
    if (!user?.orgId) return () => {};

    const channel = supabase
      .channel(`org-receipts-handler:${user.orgId}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receipts',
          filter: `org_id=eq.${user.orgId}`,
        },
        callback
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  return (
    <RealtimeContext.Provider value={{ subscribeToReceipts }}>
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