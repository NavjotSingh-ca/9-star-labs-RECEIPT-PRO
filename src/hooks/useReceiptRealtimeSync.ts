import { useEffect, useRef } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { logError } from '@/lib/logger';
import type { ReceiptRow } from '@/lib/types';

interface ReceiptPage {
  receipts: ReceiptRow[];
  totalCount: number;
}

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

/**
 * Subscribes to real-time postgres changes on the `receipts` table for the
 * current user's org. Optimistically updates React Query caches to reflect
 * inserts, updates, and deletes without a manual refetch.
 *
 * @param role  - The current user's role (used as part of the cache key).
 * @param userId - The current user's ID; the subscription is skipped when falsy.
 */
export function useReceiptRealtimeSync(role: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    (async () => {
      try {
        const orgId = await getOrgIdString();
        if (!active || !orgId) return;

        const flatKey = ['receipts', role, userId] as const;
        const paginatedPrefix = ['receipts_paginated'] as const;
        const dashKey = ['dashboard_summary'] as const;

        channelRef.current = supabase
          .channel(`receipts:${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'receipts', filter: `org_id=eq.${orgId}` },
            (payload: RealtimePayload) => {
              const { eventType } = payload;

              if (eventType === 'INSERT') {
                const newReceipt = payload.new as unknown as ReceiptRow;

                queryClient.setQueryData<ReceiptRow[]>(flatKey, (old) =>
                  old ? [newReceipt, ...old] : undefined,
                );

                queryClient.setQueriesData<InfiniteData<ReceiptPage>>(
                  { queryKey: paginatedPrefix },
                  (old) => {
                    if (!old?.pages?.length) return old;
                    const [first, ...rest] = old.pages;
                    return {
                      ...old,
                      pages: [
                        {
                          ...first,
                          receipts: [newReceipt, ...first.receipts],
                          totalCount: first.totalCount + 1,
                        },
                        ...rest,
                      ],
                    };
                  },
                );

                queryClient.setQueryData<{ totalReceipts?: number }>(dashKey, (old) =>
                  old
                    ? { ...old, totalReceipts: (old.totalReceipts ?? 0) + 1 }
                    : old,
                );
              } else if (eventType === 'UPDATE') {
                const updated = payload.new as unknown as ReceiptRow;

                queryClient.setQueryData<ReceiptRow[]>(flatKey, (old) =>
                  old?.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
                );

                queryClient.setQueriesData<InfiniteData<ReceiptPage>>(
                  { queryKey: paginatedPrefix },
                  (old) =>
                    old
                      ? {
                          ...old,
                          pages: old.pages.map((page) => ({
                            ...page,
                            receipts: page.receipts.map((r) =>
                              r.id === updated.id ? { ...r, ...updated } : r,
                            ),
                          })),
                        }
                      : old,
                );
              } else if (eventType === 'DELETE') {
                const deletedId = payload.old.id as string;

                queryClient.setQueryData<ReceiptRow[]>(flatKey, (old) =>
                  old?.filter((r) => r.id !== deletedId),
                );

                queryClient.setQueriesData<InfiniteData<ReceiptPage>>(
                  { queryKey: paginatedPrefix },
                  (old) =>
                    old
                      ? {
                          ...old,
                          pages: old.pages.map((page) => ({
                            ...page,
                            receipts: page.receipts.filter((r) => r.id !== deletedId),
                            totalCount: page.totalCount - 1,
                          })),
                        }
                      : old,
                );

                queryClient.setQueryData<{ totalReceipts?: number }>(dashKey, (old) =>
                  old
                    ? { ...old, totalReceipts: Math.max(0, (old.totalReceipts ?? 1) - 1) }
                    : old,
                );
              }
            },
          )
          .subscribe();
      } catch (err) {
        logError(err, { action: 'realtime_sync_init' });
      }
    })();

    return () => {
      active = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient, role, userId]);
}
