'use client';

import { motion } from 'framer-motion';
import { Loader2, RefreshCw, ScanLine } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
  imageSrc: string;
  originalFileName: string;
  processingAI: boolean;
  hasAnalyzed: boolean;
  canProcess: boolean;
  formContainerRef: React.RefObject<HTMLDivElement | null>;
  fileName: string;
  onCrop: () => void;
  onReset: () => void;
  onProcessAI: () => void;
  formContent: React.ReactNode;
}

export default function ImagePreview({
  imageSrc,
  originalFileName,
  processingAI,
  hasAnalyzed,
  canProcess,
  fileName,
  onCrop,
  onReset,
  onProcessAI,
  formContent,
}: ImagePreviewProps) {
  return (
    <div className={hasAnalyzed ? 'grid gap-6 lg:grid-cols-2' : 'mx-auto flex max-w-2xl flex-col gap-6'}>
      <div className="space-y-4">
        <Card className="overflow-hidden shadow-md border bg-card">
          <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Digital Capture</p>
              <p className="mt-0.5 text-sm font-semibold truncate max-w-[150px] sm:max-w-none">
                {originalFileName || fileName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onCrop} className="text-xs font-bold">
                Crop
              </Button>
              <Button variant="outline" size="icon" onClick={onReset} className="h-9 w-9 text-muted-foreground hover:text-destructive" aria-label="Reset image">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative bg-black group overflow-hidden">
            <img
              src={imageSrc}
              alt="Captured receipt"
              className="max-h-[60vh] w-full object-contain transition-transform duration-700 group-hover:scale-[1.02] sm:max-h-[70vh]"
            />
            {processingAI && (
              <>
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="absolute left-0 right-0 h-1 bg-emerald-light shadow-[0_0_20px_rgba(16,185,129,0.8)] z-20"
                />
                <div className="absolute inset-0 bg-emerald-success/10 animate-pulse z-10 pointer-events-none" />
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </div>
        </Card>

        {!hasAnalyzed && (
          <Button
            type="button"
            onClick={onProcessAI}
            disabled={!canProcess}
            size="lg"
            className="w-full h-14 text-sm font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {processingAI ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ScanLine className="mr-2 h-5 w-5" />}
            {processingAI ? 'AI Analysis in Progress...' : 'Start AI Analysis'}
          </Button>
        )}
      </div>

      {hasAnalyzed && formContent}
    </div>
  );
}
