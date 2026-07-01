// LOCKED: NON-CORE
'use client';

export function useAnalytics() {
  const noop = (..._args: unknown[]) => {};

  return {
    capture: noop,
    trackReceiptScan: noop,
    trackBulkAction: noop,
    trackFeatureUsed: noop,
    identifyUser: noop,
  };
}
