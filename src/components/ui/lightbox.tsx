'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { lockScroll, unlockScroll } from '@/lib/scroll-lock';

interface LightboxImage {
  src: string;
  alt: string;
}

interface LightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  const goNext = useCallback(() => {
    setCurrent((c) => (c + 1 >= images.length ? 0 : c + 1));
    setLoaded(false);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrent((c) => (c - 1 < 0 ? images.length - 1 : c - 1));
    setLoaded(false);
  }, [images.length]);

  // Keyboard
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  // Body scroll lock (stack-safe)
  useEffect(() => {
    lockScroll();
    return () => unlockScroll();
  }, []);

  // Focus trap: move focus into lightbox on mount
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Touch swipe
  function handleTouchStart(e: React.TouchEvent) {
    touchStartRef.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartRef.current;
    if (Math.abs(diff) > 60) {
      if (diff > 0) goPrev();
      else goNext();
    }
    touchStartRef.current = null;
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  if (!images.length) return null;

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="group fixed inset-0 z-[60] flex items-center justify-center bg-black/95 outline-none"
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery viewer"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-3 top-3 z-20 flex size-11 items-center justify-center rounded-full bg-black/40 text-white/80 transition-all hover:bg-white/15 hover:text-white hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:right-5 sm:top-5 sm:size-12"
        aria-label="Close gallery"
      >
        <X className="size-6" aria-hidden="true" />
      </button>

      {/* Previous */}
      <button
        onClick={goPrev}
        className="absolute left-1 top-1/2 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white/60 transition-all hover:opacity-100 hover:bg-black/50 hover:text-white hover:scale-110 active:scale-95 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 sm:left-3 sm:size-14 sm:opacity-20 md:opacity-40"
        aria-label="Previous image"
      >
        <ChevronLeft className="size-7" aria-hidden="true" />
      </button>

      {/* Image */}
      <div
        key={current}
        className="relative flex h-full w-full items-center justify-center p-2 sm:p-4 md:p-8"
      >
        <div className={`relative h-full w-full max-h-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <Image
            src={images[current].src}
            alt={images[current].alt}
            fill
            className="object-contain"
            priority
            sizes="100vw"
            onLoad={() => setLoaded(true)}
          />
        </div>
      </div>

      {/* Next */}
      <button
        onClick={goNext}
        className="absolute right-1 top-1/2 z-20 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white/60 transition-all hover:opacity-100 hover:bg-black/50 hover:text-white hover:scale-110 active:scale-95 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 sm:right-3 sm:size-14 sm:opacity-20 md:opacity-40"
        aria-label="Next image"
      >
        <ChevronRight className="size-7" aria-hidden="true" />
      </button>

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur sm:bottom-6">
        {current + 1} / {images.length}
      </div>
    </div>
  );
}
