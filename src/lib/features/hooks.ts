/**
 * Feature Hooks — React hooks for consuming feature flags on the client.
 * Supports role-based access control: Owner always sees everything,
 * other roles are filtered by allowed_roles config.
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FeatureKey } from './registry';
import { CORE_FEATURE_KEYS, getRequiredDependencies } from './registry';
import type { FeaturesMap } from '@/lib/services/features';
import type { UserRole } from '@/lib/types';

const FEATURES_QUERY_KEY = ['org-features'];

/**
 * Fetch feature flags from the API.
 * The API now returns role-filtered features based on the session user's role.
 */
async function fetchFeatures(): Promise<FeaturesMap> {
  const res = await fetch('/api/features');
  if (!res.ok) throw new Error('Failed to fetch features');
  const data = await res.json();
  return data.features as FeaturesMap;
}

/**
 * Hook: returns the current org's feature flags, filtered by the user's role.
 * Owner always gets all features enabled (bypass in API).
 */
export function useFeatures() {
  const { data, isLoading, error, refetch } = useQuery<FeaturesMap>({
    queryKey: FEATURES_QUERY_KEY,
    queryFn: fetchFeatures,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return {
    features: data ?? getDefaultAllEnabled(),
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook: check if a specific feature is enabled for the current user.
 * Automatically uses the API response which already applies role filtering.
 * Core features always return true.
 */
export function useFeatureGate(featureKey: FeatureKey): boolean {
  const { features } = useFeatures();
  return useCheckFeature(features, featureKey);
}

/**
 * Pure function to check a feature against a features map.
 * Core features are always on. Checks dependencies too.
 */
export function useCheckFeature(features: FeaturesMap, featureKey: FeatureKey): boolean {
  if (CORE_FEATURE_KEYS.includes(featureKey)) return true;
  if (!features[featureKey]) return false;
  const deps = getRequiredDependencies(featureKey);
  return deps.every((dep) => features[dep]);
}

/**
 * Hook: toggle a single feature on/off.
 */
export function useToggleFeature(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      featureKey,
      enabled,
    }: {
      featureKey: FeatureKey;
      enabled: boolean;
    }) => {
      const res = await fetch('/api/features', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, featureKey, enabled }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error ?? 'Failed to toggle feature');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEATURES_QUERY_KEY });
    },
  });
}

/**
 * Hook: update allowed_roles for a feature (Owner-only).
 */
export function useSetFeatureRoles(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      featureKey,
      allowedRoles,
    }: {
      featureKey: FeatureKey;
      allowedRoles: UserRole[];
    }) => {
      const res = await fetch('/api/features/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, featureKey, allowedRoles }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error ?? 'Failed to update feature roles');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEATURES_QUERY_KEY });
    },
  });
}

/**
 * Hook: bulk-set features (used during onboarding).
 */
export function useBulkSetFeatures(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<FeaturesMap>) => {
      const res = await fetch('/api/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, features: updates }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error ?? 'Failed to update features');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEATURES_QUERY_KEY });
    },
  });
}

/** Get a map where all features are enabled */
function getDefaultAllEnabled(): FeaturesMap {
  const result = {} as FeaturesMap;
  for (const key of CORE_FEATURE_KEYS) {
    result[key] = true;
  }
  const nonCore: FeatureKey[] = [
    'mileage', 'time_tracking', 'export', 'banking', 'approvals', 'payables',
    'projects', 'audit', 'alerts', 'reports', 'budgets', 'tax', 'cashflow',
    'multi_currency', 'vendors', 'integrations', 'tags', 'batch_ops', 'search',
    'calendar', 'timeline', 'kanban', 'insights', 'readiness', 'notifications', 'sharing',
  ];
  for (const key of nonCore) {
    result[key] = true;
  }
  return result;
}
