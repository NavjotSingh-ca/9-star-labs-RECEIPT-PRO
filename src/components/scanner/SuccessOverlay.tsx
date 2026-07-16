'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface SuccessOverlayProps {
  visible: boolean;
}

/**
 * Full-screen success overlay shown briefly after a receipt is saved.
 * Announces success to screen readers via a live region.
 */
export default function SuccessOverlay({ visible }: SuccessOverlayProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-success/20">
          <CheckCircle2 className="h-14 w-14 text-emerald-light" aria-hidden="true" />
        </div>
        <p className="text-lg font-bold text-white">Receipt Saved!</p>
      </div>
    </motion.div>
  );
}
