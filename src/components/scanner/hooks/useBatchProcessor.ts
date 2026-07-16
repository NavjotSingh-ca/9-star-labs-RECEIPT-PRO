'use client';

import { useState, useCallback } from 'react';

export const BATCH_LIMIT = 20;

interface BatchProcessorResult {
  isBatchProcessing: boolean;
  batchQueue: File[];
  batchTotal: number;
  batchProgress: number;
  queuedCount: number;
  queueBatch: (files: File[]) => void;
  clearBatch: () => void;
  resetBatchState: () => void;
  advanceBatch: (remaining: File[], total: number) => void;
  setIsBatchProcessing: (v: boolean) => void;
  setBatchTotal: (n: number) => void;
  setBatchProgress: (n: number) => void;
  setBatchQueue: (files: File[]) => void;
}

export function useBatchProcessor(): BatchProcessorResult {
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchQueue, setBatchQueue] = useState<File[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchProgress, setBatchProgress] = useState(0);

  const queuedCount = batchQueue.length;

  const queueBatch = useCallback((files: File[]) => {
    const capped = files.slice(0, BATCH_LIMIT);
    setBatchQueue(capped);
    setBatchTotal(capped.length);
    setBatchProgress(0);
    setIsBatchProcessing(capped.length > 0);
  }, []);

  const clearBatch = useCallback(() => {
    setBatchQueue([]);
    setBatchTotal(0);
    setBatchProgress(0);
    setIsBatchProcessing(false);
  }, []);

  const resetBatchState = useCallback(() => {
    setBatchQueue([]);
    setBatchTotal(0);
    setBatchProgress(0);
    setIsBatchProcessing(false);
  }, []);

  const advanceBatch = useCallback((remaining: File[], total: number) => {
    setBatchQueue(remaining);
    setBatchProgress(total - remaining.length);
  }, []);

  return {
    isBatchProcessing,
    batchQueue,
    batchTotal,
    batchProgress,
    queuedCount,
    queueBatch,
    clearBatch,
    resetBatchState,
    advanceBatch,
    setIsBatchProcessing,
    setBatchTotal,
    setBatchProgress,
    setBatchQueue,
  };
}