'use client';

import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface BlurWarningProps {
  blurScore: number | null;
  onRetake: () => void;
  onUseAnyway: () => void;
}

export default function BlurWarning({ blurScore, onRetake, onUseAnyway }: BlurWarningProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-[2rem] border border-warning/30 bg-warning/[0.06] p-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
        <div className="flex-1">
          <p className="text-sm font-bold text-warning">Image Quality Warning</p>
          <p className="mt-1 text-xs text-warning/80">
            This image appears blurry (score: {Math.round(blurScore ?? 0)}). CRA requires legible receipts for ITC claims. Retake for best results.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onRetake}
              className="rounded-[2rem] bg-warning/15 px-3 py-1.5 text-xs font-bold text-warning transition hover:bg-warning/25"
            >
              Retake Photo
            </button>
            <button
              type="button"
              onClick={onUseAnyway}
              className="rounded-[2rem] bg-surface-raised px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:text-text-primary"
            >
              Use Anyway
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
