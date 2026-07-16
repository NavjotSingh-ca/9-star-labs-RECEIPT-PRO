import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  initOfflineDB,
  getSyncQueueSize,
  getPreferences,
  savePreferences,
  processSyncQueue,
} from '@/lib/services/offline-db';

/**
 * useOfflineMode - Comprehensive offline state management
 * Tracks connectivity, sync status, and provides offline-first operations
 */
export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  // Initialize on mount
  useEffect(() => {
    initOfflineDB();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Use ref to track initial state
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get sync queue size
  const { data: pendingCount } = useQuery({
    queryKey: ['offline-sync-count'],
    queryFn: getSyncQueueSize,
    refetchInterval: isOnline ? 30000 : false,
  });

  // Manual sync trigger
  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      const result = await processSyncQueue(async item => {
        // In production, this would make actual API calls
        console.log('Sync item:', item);
      });

      // Refresh data after sync
      await queryClient.invalidateQueries({ queryKey: ['receipts'] });
      await queryClient.refetchQueries({ queryKey: ['offline-sync-count'] });

      return result;
    },
    onSettled: () => {
      setIsSyncing(false);
    },
  });

  // Get current preferences
  const { data: preferences } = useQuery({
    queryKey: ['offline-preferences'],
    queryFn: getPreferences,
    staleTime: Infinity,
  });

  // Update preferences
  const updatePreferences = useCallback(
    async (updates: Partial<Parameters<typeof savePreferences>[0]>) => {
      await savePreferences(updates);
      queryClient.invalidateQueries({ queryKey: ['offline-preferences'] });
    },
    [queryClient]
  );

  return {
    isOnline,
    isSyncing,
    pendingCount: pendingCount ?? 0,
    sync: syncMutation.mutate,
    preferences,
    updatePreferences,
  };
}