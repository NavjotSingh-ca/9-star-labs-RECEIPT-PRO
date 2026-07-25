/**
 * Optimistic UI Hooks — React Query mutations with instant updates
 * Provides rollback on error, conflict resolution, and cache sync.
 */

'use client';

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

interface OptimisticOptions<TData, TVariables, TContext> {
  /** Query key to invalidate after mutation */
  queryKey?: string[];
  /** Function to get the previous data for rollback */
  getPreviousData?: () => TData | undefined;
  /** Function to apply optimistic update to cache */
  onMutate?: (variables: TVariables) => Promise<TContext | void>;
  /** Called on error - rollback to previous data */
  onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void;
  /** Called on success - confirm or sync */
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
  /** Called after either success or error */
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables, context: TContext | undefined) => void;
  /** Custom mutation key for tracking */
  mutationKey?: string[];
}

/**
 * Enhanced useMutation with optimistic updates
 */
export function useOptimisticMutation<
  TData = unknown,
  TVariables = void,
  TError extends Error = Error,
  TContext = unknown
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: OptimisticOptions<TData, TVariables, TContext> = {}
): UseMutationResult<TData, TError, TVariables, TContext> {
  const queryClient = useQueryClient();
  const { queryKey, getPreviousData, onMutate, onError, onSuccess, onSettled, mutationKey } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    mutationKey,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      if (queryKey) {
        await queryClient.cancelQueries({ queryKey });
      }

      // Snapshot previous data
      const previousData = queryKey ? queryClient.getQueryData<TData>(queryKey) : getPreviousData?.();

      // Optimistically update
      if (queryKey && previousData !== undefined) {
        queryClient.setQueryData(queryKey, (old: TData) => {
          // Default: just keep previous data, let onMutate handle the update
          return old;
        });
      }

      // Call custom onMutate
      const context = await onMutate?.(variables);
      
      return { previousData, ...context } as TContext;
    },
    onError: (error: Error, variables: TVariables, context: TContext | undefined) => {
      // Rollback to previous data
      if (queryKey && context && 'previousData' in (context as Record<string, unknown>)) {
        queryClient.setQueryData(queryKey, (context as unknown as { previousData: TData }).previousData);
      }
      onError?.(error as TError, variables, context);
    },
    onSuccess: (data, variables, context) => {
      // Update with server data
      if (queryKey) {
        queryClient.setQueryData(queryKey, data);
      }
      onSuccess?.(data, variables, context);
    },
    onSettled: (data: TData | undefined, error: Error | null, variables: TVariables, context: TContext | undefined) => {
      // Invalidate to refetch fresh data
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey });
      }
      onSettled?.(data, error, variables, context);
    },
  });
}

/**
 * Hook for optimistic list updates (add/remove/update items)
 */
export function useOptimisticList<TItem extends { id: string }>(
  queryKey: string[],
  options: {
    add?: (newItem: TItem) => TItem;
    update?: (existing: TItem, changes: Partial<TItem>) => TItem;
    remove?: (id: string) => void;
  } = {}
) {
  const queryClient = useQueryClient();
  const { add, update } = options;

  const optimisticAdd = useCallback((newItem: TItem) => {
    queryClient.setQueryData<TItem[]>(queryKey, (old = []) => {
      if (old.some(item => item.id === newItem.id)) return old;
      return add ? [...old, add(newItem)] : [...old, newItem];
    });
  }, [queryClient, queryKey, add]);

  const optimisticUpdate = useCallback((id: string, changes: Partial<TItem>) => {
    queryClient.setQueryData<TItem[]>(queryKey, (old = []) => 
      old.map(item => item.id === id ? (update ? update(item, changes) : { ...item, ...changes }) : item)
    );
  }, [queryClient, queryKey, update]);

  const optimisticRemove = useCallback((id: string) => {
    queryClient.setQueryData<TItem[]>(queryKey, (old = []) => 
      old.filter(item => item.id !== id)
    );
  }, [queryClient, queryKey]);

  return { optimisticAdd, optimisticUpdate, optimisticRemove };
}

/**
 * Hook for optimistic toggle (boolean fields)
 */
export function useOptimisticToggle<TItem extends { id: string }>(
  queryKey: string[],
  field: keyof TItem,
  getNewValue: (current: boolean) => boolean = (v) => !v
) {
  const queryClient = useQueryClient();

  return useCallback((id: string) => {
    queryClient.setQueryData<TItem[]>(queryKey, (old = []) =>
      old.map(item => item.id === id 
        ? { ...item, [field]: getNewValue(item[field] as boolean) } 
        : item
      )
    );
  }, [queryClient, queryKey, field, getNewValue]);
}

/**
 * Hook for optimistic reorder (drag and drop)
 */
export function useOptimisticReorder<TItem extends { id: string }>(
  queryKey: string[]
) {
  const queryClient = useQueryClient();

  return useCallback((fromIndex: number, toIndex: number) => {
    queryClient.setQueryData<TItem[]>(queryKey, (old = []) => {
      const newItems = [...old];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      return newItems;
    });
  }, [queryClient, queryKey]);
}

/**
 * Hook for batch optimistic updates
 */
export function useOptimisticBatch<TItem extends { id: string }>(
  queryKey: string[]
) {
  const queryClient = useQueryClient();

  const batchUpdate = useCallback((updates: Array<{ id: string; changes: Partial<TItem> }>) => {
    queryClient.setQueryData<TItem[]>(queryKey, (old = []) => {
      const newItems = [...old];
      const itemMap = new Map(newItems.map(item => [item.id, item]));
      
      updates.forEach(({ id, changes }) => {
        const existing = itemMap.get(id);
        if (existing) {
          itemMap.set(id, { ...existing, ...changes });
        }
      });
      
      return Array.from(itemMap.values());
    });
  }, [queryClient, queryKey]);

  const batchRemove = useCallback((ids: string[]) => {
    queryClient.setQueryData<TItem[]>(queryKey, (old = []) => 
      old.filter(item => !ids.includes(item.id))
    );
  }, [queryClient, queryKey]);

  const batchAdd = useCallback((items: TItem[]) => {
    queryClient.setQueryData<TItem[]>(queryKey, (old = []) => {
      const existingIds = new Set(old.map(i => i.id));
      const newItems = items.filter(item => !existingIds.has(item.id));
      return [...old, ...newItems];
    });
  }, [queryClient, queryKey]);

  return { batchUpdate, batchRemove, batchAdd };
}

/**
 * Conflict resolution for concurrent edits
 */
export interface ConflictResolution<TData> {
  serverData: TData;
  localData: TData;
  baseData: TData;
}

export function resolveConflict<TData extends Record<string, unknown>>(
  conflict: ConflictResolution<TData>,
  strategy: 'server-wins' | 'local-wins' | 'merge' | 'manual' = 'server-wins'
): TData {
  const { serverData, localData, baseData } = conflict;
  
  switch (strategy) {
    case 'server-wins':
      return serverData;
    case 'local-wins':
      return localData;
    case 'merge':
      // Three-way merge: prefer local changes, fallback to server
      const merged = { ...serverData };
      Object.keys(localData).forEach(key => {
        if (localData[key as keyof TData] !== baseData[key as keyof TData]) {
          (merged as Record<string, unknown>)[key] = (localData as Record<string, unknown>)[key];
        }
      });
      return merged;
    case 'manual':
      // Return both for UI to handle
      return { ...serverData, _conflict: { local: localData, base: baseData } } as unknown as TData;
    default:
      return serverData;
  }
}

/**
 * Hook to handle conflict resolution UI
 */
export function useConflictResolver<TData>() {
  const [conflicts, setConflicts] = useState<ConflictResolution<TData>[]>([]);

  const addConflict = useCallback((conflict: ConflictResolution<TData>) => {
    setConflicts(prev => [...prev, conflict]);
  }, []);

  const resolveConflict = useCallback((index: number, resolution: TData) => {
    setConflicts(prev => {
      const newConflicts = [...prev];
      newConflicts[index] = { ...newConflicts[index], serverData: resolution };
      return newConflicts;
    });
  }, []);

  const removeConflict = useCallback((index: number) => {
    setConflicts(prev => prev.filter((_, i) => i !== index));
  }, []);

  return { conflicts, addConflict, resolveConflict, removeConflict };
}