'use client';

import React from 'react';
import { CheckCircle2, XCircle, Trash2, FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { motion, AnimatePresence } from 'framer-motion';

interface BulkActionsBarProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onExport: () => void;
  isLoading?: boolean;
  onClear: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onApprove,
  onReject,
  onDelete,
  onExport,
  isLoading,
  onClear
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4"
        >
          <div className="bg-sidebar-surface/90 backdrop-blur-md border border-glass-border shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4 text-sidebar-text">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-champagne text-sidebar-bg flex items-center justify-center font-bold text-sm">
                {selectedCount}
              </div>
              <div>
                <p className="text-sm font-bold">Items selected</p>
                <button 
                  onClick={onClear}
                  className="text-xs text-champagne hover:underline font-medium"
                >
                  Deselect all
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onApprove}
                disabled={isLoading}
                className="bg-emerald-success/10 border-emerald-success/30 text-emerald-light hover:bg-emerald-success/20 h-9 rounded-xl"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                disabled={isLoading}
                className="bg-danger/10 border-danger/30 text-danger hover:bg-danger/20 h-9 rounded-xl"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onExport}
                disabled={isLoading}
                className="bg-surface-raised border-glass-border h-9 rounded-xl"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </Button>
              <div className="w-px h-6 bg-glass-border mx-1" />
              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                disabled={isLoading}
                className="text-text-muted hover:text-danger hover:bg-danger/10 h-9 w-9 p-0 rounded-xl"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
