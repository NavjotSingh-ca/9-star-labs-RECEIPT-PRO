'use client';

import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface ErrorModalProps {
  message: string;
  onDismiss: () => void;
}

export default function ErrorModal({ message, onDismiss }: ErrorModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-[3rem] border border-red-500/30 bg-surface p-8 shadow-2xl"
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/10 text-red-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-text-primary">Database Integrity Error</h3>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          The vault rejected this entry. This usually happens if a required field is malformed or a connection was interrupted.
        </p>
        <div className="mt-6 rounded-[3rem] bg-red-500/[0.05] p-4 font-mono text-xs text-red-400 border border-red-500/10 overflow-x-auto">
          {message}
        </div>
        <button
          onClick={onDismiss}
          className="mt-8 w-full rounded-[2rem] bg-surface-raised py-4 text-sm font-bold text-text-primary transition hover:bg-surface-hover"
        >
          Dismiss & Correct
        </button>
      </motion.div>
    </motion.div>
  );
}
