'use client';

import { useState } from 'react';

export const BATCH_LIMIT = 50;

export function useBatchProcessor() {
  const [batchQueue, setBatchQueue] = useState<File[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchProgress, setBatchProgress] = useState(0);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  function resetBatchState() {
    setIsBatchProcessing(false);
    setBatchQueue([]);
    setBatchTotal(0);
    setBatchProgress(0);
  }

  function advanceBatch(remaining: File[], total: number) {
    setBatchQueue(remaining);
    setBatchProgress(total - remaining.length);
  }

  return {
    batchQueue,
    setBatchQueue,
    batchTotal,
    setBatchTotal,
    batchProgress,
    setBatchProgress,
    isBatchProcessing,
    setIsBatchProcessing,
    resetBatchState,
    advanceBatch,
    BATCH_LIMIT,
  };
}
