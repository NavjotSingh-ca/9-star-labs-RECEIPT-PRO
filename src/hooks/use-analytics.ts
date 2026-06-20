'use client';

import posthog from 'posthog-js';
import { useCallback } from 'react';

/**
 * Custom hook for typed PostHog analytics.
 * Ensures consistent event naming and property structures.
 */
export function useAnalytics() {
  const capture = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    if (typeof window !== 'undefined') {
      posthog.capture(eventName, properties as Record<string, unknown>);
    }
  }, []);

  const trackReceiptScan = useCallback((status: 'success' | 'failure', data?: {
    vendor?: string;
    amount?: number;
    source?: string;
    confidence?: number;
    error?: string;
  }) => {
    capture('receipt_scanned', {
      status,
      ...data
    });
  }, [capture]);

  const trackBulkAction = useCallback((action: 'approve' | 'reject' | 'delete', count: number) => {
    capture('bulk_action_executed', {
      action,
      count
    });
  }, [capture]);

  const trackFeatureUsed = useCallback((featureName: string, properties?: Record<string, unknown>) => {
    capture('feature_used', {
      feature: featureName,
      ...properties
    });
  }, [capture]);

  const identifyUser = useCallback((userId: string, properties?: Record<string, unknown>) => {
    if (typeof window !== 'undefined') {
      posthog.identify(userId, properties as Record<string, unknown>);
    }
  }, []);

  return {
    capture,
    trackReceiptScan,
    trackBulkAction,
    trackFeatureUsed,
    identifyUser
  };
}
