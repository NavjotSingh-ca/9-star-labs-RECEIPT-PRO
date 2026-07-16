'use client';

import { motion } from 'framer-motion';
import { AlertCircle, ShieldAlert, Database, WifiOff } from 'lucide-react';

import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ErrorModalProps {
  message: string;
  onDismiss: () => void;
}

/** Derive human-readable title and description from a database error message */
function parseDbError(message: string): { title: string; description: string; Icon: typeof AlertCircle } {
  const lower = message.toLowerCase();

  if (lower.includes('unique constraint') || lower.includes('duplicate')) {
    return {
      title: 'Duplicate Entry',
      description: 'This record already exists. Check if it was already scanned or entered.',
      Icon: ShieldAlert,
    };
  }

  if (lower.includes('foreign key') || lower.includes('referential')) {
    return {
      title: 'Reference Error',
      description: 'A related record (e.g. vendor or category) could not be found. Please verify the linked data.',
      Icon: Database,
    };
  }

  if (lower.includes('connection') || lower.includes('timeout') || lower.includes('network')) {
    return {
      title: 'Connection Lost',
      description: 'The database connection was interrupted. Please try again.',
      Icon: WifiOff,
    };
  }

  // Default
  return {
    title: 'Save Error',
    description: 'The server rejected this entry. The details below may help resolve the issue.',
    Icon: AlertCircle,
  };
}

/**
 * Accessible error modal that parses database errors into human-readable messages.
 * Uses focus trap, escape-to-dismiss, and proper ARIA dialog semantics.
 */
export default function ErrorModal({ message, onDismiss }: ErrorModalProps) {
  const trapRef = useFocusTrap(true);
  const { title, description, Icon } = parseDbError(message);
  const titleId = 'error-modal-title';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      {/* z-[130] > DuplicateModal's z-[110] — ErrorModal must always layer above */}
      <motion.div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-[3rem] border border-danger/30 bg-surface p-8 shadow-2xl"
        onKeyDown={(e) => { if (e.key === 'Escape') onDismiss(); }}
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-danger/10 text-danger">
          <Icon className="h-8 w-8" aria-hidden="true" />
        </div>
        <h3 id={titleId} className="text-xl font-bold text-text-primary">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
        <div className="mt-6 rounded-[3rem] bg-danger/[0.05] p-4 font-mono text-xs text-danger border border-danger/10 overflow-x-auto break-words">
          {message}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-8 w-full rounded-[2rem] bg-surface-raised py-4 text-sm font-bold text-text-primary transition hover:bg-surface-hover"
        >
          Dismiss & Correct
        </button>
      </motion.div>
    </motion.div>
  );
}
