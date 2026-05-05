'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, FileUp, Loader2, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EliteUploadProps {
  onFileSelect: (file: File) => void;
  onCameraClick: () => void;
  isProcessing?: boolean;
}

export function EliteUpload({ onFileSelect, onCameraClick, isProcessing }: EliteUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'], 'application/pdf': ['.pdf'] },
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  return (
    <div className="w-full space-y-6">
      <div 
        {...getRootProps()} 
        className={cn(
          "relative group cursor-pointer rounded-[3rem] border-2 border-dashed transition-all duration-500 overflow-hidden",
          isDragActive 
            ? "border-champagne bg-champagne/5 scale-[1.02]" 
            : "border-glass-border bg-surface/50 hover:border-champagne/40 hover:bg-surface-raised"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <motion.div 
            animate={isDragActive ? { y: -10, scale: 1.1 } : { y: 0, scale: 1 }}
            className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-champagne/10 text-champagne shadow-inner mb-6"
          >
            <UploadCloud className={cn("h-10 w-10 transition-all", isDragActive ? "animate-pulse" : "")} />
          </motion.div>

          <h3 className="text-xl font-bold text-text-primary tracking-tight">Drop your receipts here</h3>
          <p className="mt-2 text-sm text-text-secondary max-w-xs">
            Drag and drop images or PDFs, or click to browse your digital records.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <Button 
              variant="outline" 
              className="rounded-full border-glass-border px-6 py-6 font-bold hover:bg-surface-raised hover:text-text-primary"
            >
              <FileUp className="mr-2 h-4 w-4" />
              Browse Files
            </Button>
          </div>
        </div>

        {/* Animated Background Pulse */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-champagne/5 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      <div className="relative flex items-center gap-4">
        <div className="h-px flex-1 bg-glass-border" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Or capture live</span>
        <div className="h-px flex-1 bg-glass-border" />
      </div>

      <Button 
        onClick={onCameraClick}
        className="w-full rounded-[2rem] bg-champagne h-16 text-lg font-black text-obsidian shadow-xl shadow-champagne/20 hover:bg-champagne-dim transition-all active:scale-[0.98]"
      >
        <Camera className="mr-3 h-6 w-6" />
        Open Smart Camera
      </Button>

      {isProcessing && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 rounded-2xl bg-surface-raised p-4 border border-glass-border"
        >
          <Loader2 className="h-5 w-5 animate-spin text-champagne" />
          <p className="text-sm font-bold text-text-primary">Gemini AI is reading your receipt...</p>
        </motion.div>
      )}
    </div>
  );
}
