import { useEffect } from 'react';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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

export function useReceiptRealtimeSync(role: string, userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const flatKey = ['receipts', role, userId] as const;
    const paginatedPrefix = ['receipts_paginated'] as const;
    const dashKey = ['dashboard_summary'] as const;

    const channel = supabase
      .channel(`receipts:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'receipts' },
        (payload: RealtimePayload) => {
          const { eventType } = payload;

          if (eventType === 'INSERT') {
            const newReceipt = payload.new as unknown as ReceiptRow;

            queryClient.setQueryData<ReceiptRow[]>(flatKey, (old) =>
              old ? [newReceipt, ...old] : undefined
            );

            queryClient.setQueriesData<InfiniteData<ReceiptPage>>(
              { queryKey: paginatedPrefix },
              (old) => {
                if (!old?.pages?.length) return old;
                const [first, ...rest] = old.pages;
                return {
                  ...old,
                  pages: [
                    { ...first, receipts: [newReceipt, ...first.receipts], totalCount: first.totalCount + 1 },
                    ...rest,
                  ],
                };
              }
            );

            queryClient.invalidateQueries({ queryKey: dashKey });
          }

          else if (eventType === 'UPDATE') {
            const updated = payload.new as unknown as ReceiptRow;

            queryClient.setQueryData<ReceiptRow[]>(flatKey, (old) =>
              old?.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
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
                          r.id === updated.id ? { ...r, ...updated } : r
                        ),
                      })),
                    }
                  : old
            );
          }

          else if (eventType === 'DELETE') {
            const deletedId = payload.old.id as string;

            queryClient.setQueryData<ReceiptRow[]>(flatKey, (old) =>
              old?.filter((r) => r.id !== deletedId)
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
                  : old
            );

            queryClient.invalidateQueries({ queryKey: dashKey });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, role, userId]);
}
