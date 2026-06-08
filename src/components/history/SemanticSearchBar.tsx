'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SemanticSearchBarProps {
  semanticMode: boolean;
  semanticLoading: boolean;
  onToggle: () => void;
  onSearch: (query: string) => void;
  onClear: () => void;
}

export function SemanticSearchBar({ semanticMode, semanticLoading, onToggle, onSearch, onClear }: SemanticSearchBarProps) {
  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={onToggle}
          variant={semanticMode ? 'default' : 'outline'}
          className="font-bold transition-all"
        >
          <BrainCircuit className="mr-2 h-4 w-4" />
          AI Search
        </Button>
      </div>

      <AnimatePresence>
        {semanticMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-2"
          >
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BrainCircuit className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">Semantic Audit Engine Active</p>
                  <input
                    type="text"
                    placeholder="Describe what you're looking for (e.g. 'Fuel receipts over $100 from last March')"
                    aria-label="AI semantic search query"
                    className="mt-2 w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSearch(e.currentTarget.value);
                    }}
                  />
                  {semanticLoading && (
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-primary font-bold uppercase tracking-widest animate-pulse" role="status" aria-live="polite">
                      Analyzing patterns...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
