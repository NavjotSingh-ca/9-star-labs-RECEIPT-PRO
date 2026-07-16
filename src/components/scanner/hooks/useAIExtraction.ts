'use client';

import { useCallback, useRef, useState } from 'react';
import { scanReceipt, ScannedReceiptData } from '@/app/actions/scan-receipt';
import { logError } from '@/lib/logger';

interface UseAIExtractionOptions {
  onExtractionComplete: (data: ScannedReceiptData) => void;
  onExtractionError: (error: string) => void;
  onExtractionProgress?: (stage: string, progress: number) => void;
}

/**
 * Handles AI-powered receipt extraction (Google Generative AI).
 * Extracted from useScannerState for separation of concerns.
 */
export function useAIExtraction({
  onExtractionComplete,
  onExtractionError,
  onExtractionProgress,
}: UseAIExtractionOptions) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStage, setExtractionStage] = useState<string>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);
  const isExtractingRef = useRef(isExtracting);
  isExtractingRef.current = isExtracting;

  const extractFromImage = useCallback(
    async (imageDataUrl: string) => {
      if (isExtractingRef.current) return;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setIsExtracting(true);
      setExtractionStage('uploading');

      try {
        onExtractionProgress?.('uploading', 10);

        const result = await scanReceipt(imageDataUrl);

        onExtractionProgress?.('processing', 50);

        if (!result.success) {
          const error = result.error || 'AI extraction failed';
          throw new Error(error);
        }

        onExtractionProgress?.('parsing', 80);

        const extractedData = result.data;
        onExtractionProgress?.('complete', 100);
        onExtractionComplete(extractedData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'AI extraction failed';
        logError(err, { action: 'ai_extraction' });
        onExtractionError(errorMessage);
      } finally {
        setIsExtracting(false);
        setExtractionStage('idle');
      }
},
    [onExtractionComplete, onExtractionError, onExtractionProgress]
  );

  const cancelExtraction = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsExtracting(false);
    setExtractionStage('idle');
  }, []);

  return {
    isExtracting,
    extractionStage,
    extractFromImage,
    cancelExtraction,
  };
}