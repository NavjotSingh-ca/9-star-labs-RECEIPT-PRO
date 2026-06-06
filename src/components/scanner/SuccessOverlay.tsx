'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface SuccessOverlayProps {
  visible: boolean;
}

export default function SuccessOverlay({ visible }: SuccessOverlayProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
    >
      <div className="scan-success-overlay flex flex-col items-center gap-2">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-success/20">
          <CheckCircle2 className="h-14 w-14 text-emerald-light" />
        </div>
        <p className="text-lg font-bold text-white">Receipt Saved!</p>
      </div>
    </motion.div>
  );
}
