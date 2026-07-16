'use client';

import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface BlurWarningProps {
  blurScore: number | null;
  onRetake: () => void;
  onUseAnyway: () => void;
}

/**
 * Warns the user when a captured image has a low blur score (likely blurry).
 * Offers two actions: retake the photo or proceed with the blurry image.
 */
export default function BlurWarning({ blurScore, onRetake, onUseAnyway }: BlurWarningProps) {
  const score = blurScore !== null ? Math.round(blurScore) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-[2rem] border border-warning/30 bg-warning/[0.06] p-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm font-bold text-warning">Image Quality Warning</p>
          <p className="mt-1 text-xs text-warning/80">
            This image appears blurry{score !== null ? ` (score: ${score})` : ''}. CRA requires legible receipts for ITC claims. Retake for best results.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onRetake}
              className="rounded-[2rem] bg-warning/15 px-3 py-1.5 text-xs font-bold text-warning transition hover:bg-warning/25"
              aria-label="Retake the receipt photo"
            >
              Retake Photo
            </button>
            <button
              type="button"
              onClick={onUseAnyway}
              className="rounded-[2rem] bg-surface-raised px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:text-text-primary"
              aria-label="Use the blurry image anyway"
            >
              Use Anyway
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
