/**
 * FeatureGate — Conditionally renders children based on whether a feature is enabled
 * AND the current user's role has access to it.
 * Core features always render. Owner always has full access.
 */
'use client';

import type { ReactNode } from 'react';
import type { FeatureKey } from '@/lib/features/registry';
import { CORE_FEATURE_KEYS } from '@/lib/features/registry';
import { useFeatures } from '@/lib/features/hooks';

interface FeatureGateProps {
  /** The feature key to check */
  feature: FeatureKey;
  /** Content to render when the feature is enabled */
  children: ReactNode;
  /** Optional fallback to render when the feature is disabled (default: null) */
  fallback?: ReactNode | null;
  /** Optional skeleton to show while features are loading (default: null) */
  loading?: ReactNode | null;
}

/**
 * Wraps content that should only render if the specified feature is enabled
 * AND the user's role has access. The API already filters features by role,
 * so we just check the features map.
 */
export function FeatureGate({ feature, children, fallback = null, loading = null }: FeatureGateProps) {
  const { features, isLoading } = useFeatures();

  if (isLoading) return <>{loading}</>;
  if (CORE_FEATURE_KEYS.includes(feature)) return <>{children}</>;

  const isEnabled = features[feature] ?? true;
  if (!isEnabled) return <>{fallback}</>;

  return <>{children}</>;
}
