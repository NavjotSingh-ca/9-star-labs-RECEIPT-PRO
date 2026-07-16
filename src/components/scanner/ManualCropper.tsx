'use client';

import { useEffect, useMemo, useRef, useState, useCallback, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, RotateCcw, X, Maximize2, Lock, Unlock, Move } from 'lucide-react';

import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { CropRect, ManualCropperProps } from './types';

// ─── Constants ──────────────────────────────────────────────────
const MIN_CROP_SIZE = 60;
const HANDLE_SIZE = 18; // px — larger for touch targets
const HANDLE_HIT_AREA = 24; // px — invisible touch target
const NUDGE_STEP = 2; // px per arrow key press
const NUDGE_STEP_LARGE = 10; // px with Shift+arrow

type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 'tm' | 'bm' | 'ml' | 'mr';

interface DragState {
  mode: 'new' | 'move' | 'resize' | null;
  startX: number;
  startY: number;
  originCrop: CropRect | null;
  handle: ResizeHandle | null;
  aspectRatio: number | null;
}

const HANDLES: { key: ResizeHandle; x: number; y: number; cursor: string }[] = [
  { key: 'tl', x: 0, y: 0, cursor: 'nwse-resize' },
  { key: 'tr', x: 1, y: 0, cursor: 'nesw-resize' },
  { key: 'bl', x: 0, y: 1, cursor: 'nesw-resize' },
  { key: 'br', x: 1, y: 1, cursor: 'nwse-resize' },
  { key: 'tm', x: 0.5, y: 0, cursor: 'ns-resize' },
  { key: 'bm', x: 0.5, y: 1, cursor: 'ns-resize' },
  { key: 'ml', x: 0, y: 0.5, cursor: 'ew-resize' },
  { key: 'mr', x: 1, y: 0.5, cursor: 'ew-resize' },
];

// ─── Helpers ────────────────────────────────────────────────────

/** Clamp a value between min and max */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(val, max));
}

/** Given a crop rect and optional aspect ratio, return a rect that respects both */
function clampRect(next: CropRect, bounds: { w: number; h: number }, aspectRatio: number | null): CropRect {
  let { x, y, width, height } = next;

  // Apply aspect ratio constraint from center of the crop
  if (aspectRatio) {
    const newRatio = width / height;
    if (Math.abs(newRatio - aspectRatio) > 0.001) {
      // Prioritize width
      if (width / height > aspectRatio) {
        width = height * aspectRatio;
      } else {
        height = width / aspectRatio;
      }
    }
  }

  // Clamp size
  width = clamp(width, MIN_CROP_SIZE, bounds.w);
  height = clamp(height, MIN_CROP_SIZE, bounds.h);

  // Clamp position — ensure rect stays within bounds after size clamp
  x = clamp(x, 0, bounds.w - width);
  y = clamp(y, 0, bounds.h - height);

  return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
}

/** Convert a crop rect to CSS position values */
function cropToStyle(rect: CropRect) {
  return {
    left: rect.x,
    top: rect.y,
    width: rect.width,
    height: rect.height,
  };
}

// ─── Component ──────────────────────────────────────────────────

export default function ManualCropper({ imageSrc, fileName, onCancel, onApply }: ManualCropperProps) {
  const trapRef = useFocusTrap(true);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState>({ mode: null, startX: 0, startY: 0, originCrop: null, handle: null, aspectRatio: null });

  const [natural, setNatural] = useState({ w: 100, h: 100 }); // natural image dimensions
  const [display, setDisplay] = useState({ w: 0, h: 0 });     // displayed image dimensions
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [dragMode, setDragMode] = useState<DragState['mode']>(null);
  const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle | null>(null);
  const [aspectLocked, setAspectLocked] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Compute aspect ratio from natural dimensions
  const aspectRatio = useMemo(() => {
    if (!aspectLocked) return null;
    return natural.w / natural.h;
  }, [aspectLocked, natural.w, natural.h]);

  // ─── Image load handler ────────────────────────────────────
  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });

    // Get displayed dimensions from the rendered image
    const rect = img.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDisplay({ w: rect.width, h: rect.height });
    }

    // Initial crop: center 70% of the image
    const cw = Math.round(rect.width * 0.7);
    const ch = Math.round(rect.height * 0.7);
    setCrop({
      x: Math.round((rect.width - cw) / 2),
      y: Math.round((rect.height - ch) / 2),
      width: cw,
      height: ch,
    });

    setIsReady(true);
  }, []);

  // Reset on new image — use startTransition to batch state updates
  useEffect(() => {
    startTransition(() => {
      setIsReady(false);
      setCrop(null);
      setAspectLocked(false);
      setDragMode(null);
      setHoveredHandle(null);
      setNatural({ w: 100, h: 100 });
      setDisplay({ w: 0, h: 0 });
    });
  }, [imageSrc]);

  // ─── Display bounds ────────────────────────────────────────
  // Source of truth: display state set from handleImageLoad.
  // Never access containerRef during render (React Compiler restriction).
  const bounds = useMemo(() => {
    if (display.w > 0 && display.h > 0) return display;
    return { w: 400, h: 300 };
  }, [display]);

  // ─── Clamp with current aspect ratio ───────────────────────
  const clamped = useCallback(
    (next: CropRect) => clampRect(next, bounds, aspectRatio),
    [bounds, aspectRatio]
  );

  // ─── Pointer helpers ───────────────────────────────────────
  const getPoint = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    []
  );

  const isInsideCrop = useCallback(
    (px: number, py: number, rect: CropRect, margin = 16): boolean =>
      px >= rect.x - margin &&
      px <= rect.x + rect.width + margin &&
      py >= rect.y - margin &&
      py <= rect.y + rect.height + margin,
    []
  );

  const getHandleAt = useCallback(
    (px: number, py: number, rect: CropRect): ResizeHandle | null => {
      const halfHit = HANDLE_HIT_AREA / 2;
      for (const h of HANDLES) {
        const hx = rect.x + h.x * rect.width;
        const hy = rect.y + h.y * rect.height;
        if (Math.abs(px - hx) <= halfHit && Math.abs(py - hy) <= halfHit) return h.key;
      }
      return null;
    },
    []
  );

  // ─── Pointer event handlers ────────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!containerRef.current || !crop) return;
      const pt = getPoint(e.clientX, e.clientY);
      if (!pt) return;

      // Check resize handles first
      const handleKey = getHandleAt(pt.x, pt.y, crop);
      if (handleKey) {
        dragRef.current = {
          mode: 'resize',
          startX: pt.x,
          startY: pt.y,
          originCrop: { ...crop },
          handle: handleKey,
          aspectRatio,
        };
        setDragMode('resize');
        containerRef.current.setPointerCapture(e.pointerId);
        return;
      }

      // Move mode if inside crop
      if (isInsideCrop(pt.x, pt.y, crop)) {
        dragRef.current = {
          mode: 'move',
          startX: pt.x,
          startY: pt.y,
          originCrop: { ...crop },
          handle: null,
          aspectRatio,
        };
        setDragMode('move');
        containerRef.current.setPointerCapture(e.pointerId);
        return;
      }

      // New crop
      const size = Math.max(bounds.w * 0.35, MIN_CROP_SIZE);
      const starter = clamped({
        x: pt.x - size / 2,
        y: pt.y - size / 2,
        width: size,
        height: size,
      });
      setCrop(starter);
      dragRef.current = {
        mode: 'new',
        startX: pt.x,
        startY: pt.y,
        originCrop: starter,
        handle: null,
        aspectRatio,
      };
      setDragMode('new');
      containerRef.current.setPointerCapture(e.pointerId);
    },
    [getPoint, getHandleAt, isInsideCrop, crop, bounds, clamped, aspectRatio]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pt = getPoint(e.clientX, e.clientY);
      if (!pt) return;

      // Hover detection (when not dragging)
      if (!dragRef.current.mode && crop) {
        const h = getHandleAt(pt.x, pt.y, crop);
        setHoveredHandle(h);
        return;
      }

      const { mode, startX, startY, originCrop, handle } = dragRef.current;
      if (!mode || !originCrop) return;

      const dx = pt.x - startX;
      const dy = pt.y - startY;

      if (mode === 'new') {
        // Create crop from drag start to current point
        const next: CropRect = {
          x: Math.min(startX, pt.x),
          y: Math.min(startY, pt.y),
          width: Math.abs(dx),
          height: Math.abs(dy),
        };
        setCrop(clamped(next));
        return;
      }

      if (mode === 'move') {
        setCrop(
          clamped({
            x: originCrop.x + dx,
            y: originCrop.y + dy,
            width: originCrop.width,
            height: originCrop.height,
          })
        );
        return;
      }

      if (mode === 'resize' && handle) {
        let { x, y, width, height } = originCrop;

        // Horizontal — left side handles
        if (handle.includes('l')) {
          const newWidth = originCrop.width - dx;
          if (newWidth >= MIN_CROP_SIZE) {
            x = originCrop.x + dx;
            width = newWidth;
          }
        }
        // Horizontal — right side handles
        if (handle.includes('r')) {
          const newWidth = originCrop.width + dx;
          if (newWidth >= MIN_CROP_SIZE) {
            width = newWidth;
          }
        }

        // Vertical — top side handles
        if (handle.includes('t')) {
          const newHeight = originCrop.height - dy;
          if (newHeight >= MIN_CROP_SIZE) {
            y = originCrop.y + dy;
            height = newHeight;
          }
        }
        // Vertical — bottom side handles
        if (handle.includes('b')) {
          const newHeight = originCrop.height + dy;
          if (newHeight >= MIN_CROP_SIZE) {
            height = newHeight;
          }
        }

        setCrop(clamped({ x, y, width, height }));

        // Update origin for smooth continuous resize
        dragRef.current.startX = pt.x;
        dragRef.current.startY = pt.y;
        dragRef.current.originCrop = { x, y, width, height };
      }
    },
    [getPoint, getHandleAt, crop, clamped]
  );

  const stopDragging = useCallback((e?: React.PointerEvent<HTMLDivElement>) => {
    if (e && containerRef.current?.hasPointerCapture(e.pointerId)) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
    dragRef.current.mode = null;
    setDragMode(null);
  }, []);

  // ─── Keyboard nudge ────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!crop) return;
      const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (!arrows.includes(e.key)) return;
      e.preventDefault();

      const step = e.shiftKey ? NUDGE_STEP_LARGE : NUDGE_STEP;
      let dx = 0; let dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;

      setCrop(clamped({ x: crop.x + dx, y: crop.y + dy, width: crop.width, height: crop.height }));
    },
    [crop, clamped]
  );

  // ─── Apply crop ────────────────────────────────────────────
  const applyCrop = useCallback(async () => {
    if (!crop || !imgRef.current) return;
    const img = imgRef.current;
    const scaleX = img.naturalWidth / bounds.w;
    const scaleY = img.naturalHeight / bounds.h;
    const sx = Math.round(crop.x * scaleX);
    const sy = Math.round(crop.y * scaleY);
    const sw = Math.round(crop.width * scaleX);
    const sh = Math.round(crop.height * scaleY);

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, sw);
    canvas.height = Math.max(1, sh);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    onApply(canvas.toDataURL('image/jpeg', 0.92));
  }, [crop, bounds, onApply]);

  // ─── Reset crop ────────────────────────────────────────────
  const resetCrop = useCallback(() => {
    const cw = Math.round(bounds.w * 0.7);
    const ch = Math.round(bounds.h * 0.7);
    setCrop({
      x: Math.round((bounds.w - cw) / 2),
      y: Math.round((bounds.h - ch) / 2),
      width: cw,
      height: ch,
    });
  }, [bounds]);

  // ─── Cursor style ──────────────────────────────────────────
  const cursorStyle = useMemo(() => {
    if (dragMode === 'resize' && hoveredHandle) {
      return HANDLES.find(h => h.key === hoveredHandle)?.cursor ?? 'default';
    }
    if (dragMode === 'move') return 'grabbing';
    if (crop && hoveredHandle) {
      return HANDLES.find(h => h.key === hoveredHandle)?.cursor ?? 'default';
    }
    if (!crop) return 'crosshair';
    return 'default';
  }, [dragMode, hoveredHandle, crop]);

  // ─── Crop dimensions display ───────────────────────────────
  const dimsText = useMemo(() => {
    if (!crop) return '';
    const scaleX = natural.w / bounds.w;
    const scaleY = natural.h / bounds.h;
    const actualW = Math.round(crop.width * scaleX);
    const actualH = Math.round(crop.height * scaleY);
    return `${crop.width}×${crop.height} · ${actualW}×${actualH}px`;
  }, [crop, natural, bounds]);

  return (
    <motion.div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-label="Crop receipt image"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-xl overflow-hidden select-none"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* ── Header ── */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 200, damping: 20 }}
        className="flex-none border-b border-white/[0.06] bg-black/60 backdrop-blur-2xl px-5 py-4 z-20"
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-base font-bold tracking-tight text-white">Crop Receipt</h3>
            <p className="mt-0.5 truncate text-[11px] text-white/40">{fileName}</p>
          </div>
          <motion.button
            type="button"
            onClick={onCancel}
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.9 }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/50 transition-colors"
            aria-label="Close crop tool"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* ── Image Area ── */}
      <div
        className="relative flex-1 flex flex-col items-center justify-center overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Empty state before image loads */}
        {!isReady && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 text-white/20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="h-8 w-8 rounded-full border-2 border-white/10 border-t-champagne/50"
            />
            <p className="text-xs text-white/20">Loading image...</p>
          </motion.div>
        )}

        <motion.div
          ref={containerRef}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={isReady ? { scale: 1, opacity: 1 } : {}}
          transition={{ delay: 0.1, type: 'spring', stiffness: 150, damping: 18 }}
          className="relative max-h-[65dvh] max-w-[95vw] overflow-hidden touch-none"
          style={{ cursor: cursorStyle }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        >
          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element -- dynamic blob URL */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Receipt to crop"
            className="block max-h-[65dvh] max-w-full h-auto w-auto"
            onLoad={handleImageLoad}
            draggable={false}
            style={{ willChange: 'transform' }}
          />

          {/* Dark overlay panels — outside crop */}
          <AnimatePresence>
            {crop && isReady && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Top */}
                <div className="absolute inset-x-0 top-0 bg-black/60 pointer-events-none" style={{ height: crop.y }} />
                {/* Left middle */}
                <div className="absolute pointer-events-none bg-black/60" style={{ top: crop.y, left: 0, width: crop.x, height: crop.height }} />
                {/* Right middle */}
                <div className="absolute pointer-events-none bg-black/60" style={{ top: crop.y, right: 0, width: `calc(100% - ${crop.x + crop.width}px)`, height: crop.height }} />
                {/* Bottom */}
                <div className="absolute pointer-events-none bg-black/60" style={{ top: crop.y + crop.height, left: 0, width: '100%', bottom: 0 }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Crop border + grid + handles */}
          <AnimatePresence>
            {crop && isReady && (
              <motion.div
                key="crop-overlay"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute inset-0 pointer-events-none"
              >
                {/* Rule-of-thirds grid */}
                <div style={cropToStyle(crop)} className="absolute">
                  <div className="absolute inset-0">
                    {/* Vertical lines */}
                    <div className="absolute left-[33.33%] top-0 bottom-0 w-px bg-white/15" />
                    <div className="absolute left-[66.66%] top-0 bottom-0 w-px bg-white/15" />
                    {/* Horizontal lines */}
                    <div className="absolute top-[33.33%] left-0 right-0 h-px bg-white/15" />
                    <div className="absolute top-[66.66%] left-0 right-0 h-px bg-white/15" />
                  </div>
                  {/* Border — champagne with glow */}
                  <div className="absolute inset-0 rounded-[2px]" style={{
                    border: '2px solid rgba(190, 169, 142, 0.8)',
                    boxShadow: '0 0 24px -4px rgba(190, 169, 142, 0.15), inset 0 0 24px -4px rgba(190, 169, 142, 0.05)',
                  }} />
                </div>

                {/* Resize handles */}
                {HANDLES.map(h => {
                  const cx = crop.x + h.x * crop.width;
                  const cy = crop.y + h.y * crop.height;
                  const isHovered = hoveredHandle === h.key;
                  return (
                    <motion.div
                      key={h.key}
                      animate={{
                        scale: isHovered || dragMode === 'resize' ? 1.3 : 1,
                        backgroundColor: isHovered || dragMode === 'resize'
                          ? 'rgba(190, 169, 142, 0.6)'
                          : 'rgba(255, 255, 255, 0.95)',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="absolute rounded-full shadow-lg pointer-events-none z-10"
                      style={{
                        left: cx - HANDLE_SIZE / 2,
                        top: cy - HANDLE_SIZE / 2,
                        width: HANDLE_SIZE,
                        height: HANDLE_SIZE,
                        border: '2px solid rgba(190, 169, 142, 0.8)',
                      }}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Empty state hint */}
        <AnimatePresence>
          {!crop && isReady && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
            >
              <p className="flex items-center gap-2 text-xs text-white/30 bg-black/70 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/[0.04]">
                <Move className="h-3 w-3" />
                Tap and drag to select the receipt area
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer toolbar ── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.08, type: 'spring', stiffness: 200, damping: 20 }}
        className="flex-none border-t border-white/[0.06] bg-black/60 backdrop-blur-2xl px-4 py-3 pb-safe-bottom z-20"
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          {/* Left: Reset + Aspect Lock */}
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={resetCrop}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.12)' }}
              whileTap={{ scale: 0.95 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/50 transition-colors hover:text-white"
              title="Reset crop"
              aria-label="Reset crop"
            >
              <RotateCcw className="h-4 w-4" />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setAspectLocked(!aspectLocked)}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.12)' }}
              whileTap={{ scale: 0.95 }}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] transition-colors ${
                aspectLocked ? 'text-champagne border-champagne/30' : 'text-white/50 hover:text-white'
              }`}
              title={aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
              aria-label={aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
            >
              {aspectLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </motion.button>
          </div>

          {/* Center: Dimensions + keyboard hint */}
          {crop && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="hidden sm:flex items-center gap-3"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <Maximize2 className="h-3 w-3 text-white/30" aria-hidden="true" />
                <span className="font-mono text-[11px] text-white/40 tabular-nums">{dimsText}</span>
              </div>
              <span className="text-[10px] text-white/20 hidden md:inline">
                Arrow keys to nudge · Shift+arrow for 10px
              </span>
            </motion.div>
          )}

          {/* Right: Cancel + Apply */}
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={onCancel}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.12)' }}
              whileTap={{ scale: 0.98 }}
              className="flex h-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-xs font-medium text-white/50 transition-colors hover:text-white"
            >
              Cancel
            </motion.button>

            <motion.button
              type="button"
              onClick={applyCrop}
              disabled={!crop}
              whileHover={crop ? { scale: 1.02 } : {}}
              whileTap={crop ? { scale: 0.98 } : {}}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-champagne to-champagne-dim px-5 text-xs font-bold text-black transition-all disabled:cursor-not-allowed disabled:opacity-30 shadow-lg shadow-champagne/20 hover:shadow-champagne/30"
            >
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">Apply</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
