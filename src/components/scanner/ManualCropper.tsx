'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';

import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { CropRect, ManualCropperProps } from './types';

type DragMode = 'new' | 'move' | 'resize' | null;
type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 'tm' | 'bm' | 'ml' | 'mr';

const MIN_CROP = 40;

/* ─── Resize handle positions (8-direction) ─── */
const HANDLES: { key: ResizeHandle; x: number; y: number; cursor: string }[] = [
  { key: 'tl', x: 0, y: 0, cursor: 'nw-resize' },
  { key: 'tr', x: 1, y: 0, cursor: 'ne-resize' },
  { key: 'bl', x: 0, y: 1, cursor: 'sw-resize' },
  { key: 'br', x: 1, y: 1, cursor: 'se-resize' },
  { key: 'tm', x: 0.5, y: 0, cursor: 'n-resize' },
  { key: 'bm', x: 0.5, y: 1, cursor: 's-resize' },
  { key: 'ml', x: 0, y: 0.5, cursor: 'w-resize' },
  { key: 'mr', x: 1, y: 0.5, cursor: 'e-resize' },
];

export default function ManualCropper({ imageSrc, fileName, onCancel, onApply }: ManualCropperProps) {
  const trapRef = useFocusTrap(true);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [imageBounds, setImageBounds] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);

  const dragState = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    originCrop: CropRect | null;
    handle: ResizeHandle | null;
  }>({ mode: null, startX: 0, startY: 0, originCrop: null, handle: null });

  // Reset crop when image source changes
  // Safe: only runs when imageSrc prop changes, not on every render
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setCrop(null); }, [imageSrc]);

  /* ─── Bounds syncing ─── */
  const syncBounds = useCallback(() => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    setImageBounds({ width: rect.width, height: rect.height });
  }, []);

  const getCropBounds = useCallback((): { width: number; height: number } => {
    const rect = imageRef.current?.getBoundingClientRect();
    return rect && rect.width > 0 ? { width: rect.width, height: rect.height } : imageBounds;
  }, [imageBounds]);

  /* ─── Clamp crop within image bounds ─── */
  const clampRect = useCallback((next: CropRect): CropRect => {
    const bounds = getCropBounds();
    const width = Math.max(MIN_CROP, Math.min(next.width, bounds.width));
    const height = Math.max(MIN_CROP, Math.min(next.height, bounds.height));
    const x = Math.max(0, Math.min(next.x, bounds.width - width));
    const y = Math.max(0, Math.min(next.y, bounds.height - height));
    return { x, y, width, height };
  }, [getCropBounds]);

  /* ─── Pointer helpers ─── */
  const getOverlayRect = useCallback(() => overlayRef.current?.getBoundingClientRect() ?? null, []);

  const getPoint = useCallback((clientX: number, clientY: number) => {
    const rect = getOverlayRect();
    if (!rect) return null;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, [getOverlayRect]);

  const isInsideCrop = useCallback((px: number, py: number, cropRect: CropRect): boolean => {
    const margin = 20; // hit area outside the crop to feel generous
    return px >= cropRect.x - margin && px <= cropRect.x + cropRect.width + margin &&
           py >= cropRect.y - margin && py <= cropRect.y + cropRect.height + margin;
  }, []);

  const getHandleAt = useCallback((px: number, py: number, cropRect: CropRect): ResizeHandle | null => {
    const size = 10; // handle activation radius
    for (const handle of HANDLES) {
      const hx = cropRect.x + handle.x * cropRect.width;
      const hy = cropRect.y + handle.y * cropRect.height;
      if (Math.abs(px - hx) <= size && Math.abs(py - hy) <= size) {
        return handle.key;
      }
    }
    return null;
  }, []);

  /* ─── Pointer event handlers ─── */
  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;
    const point = getPoint(event.clientX, event.clientY);
    if (!point) return;

    const bounds = getCropBounds();

    // Check if touching a handle first
    if (crop) {
      const handleKey = getHandleAt(point.x, point.y, crop);
      if (handleKey) {
        dragState.current = { mode: 'resize', startX: point.x, startY: point.y, originCrop: crop, handle: handleKey };
        setDragMode('resize');
        overlayRef.current.setPointerCapture(event.pointerId);
        return;
      }
    }

    // Check if inside existing crop (move mode)
    const canMove = crop && isInsideCrop(point.x, point.y, crop);
    if (canMove) {
      dragState.current = { mode: 'move', startX: point.x, startY: point.y, originCrop: crop, handle: null };
      setDragMode('move');
      overlayRef.current.setPointerCapture(event.pointerId);
      return;
    }

    // New crop
    const starter = clampRect({
      x: point.x,
      y: point.y,
      width: Math.max(bounds.width * 0.4, MIN_CROP),
      height: Math.max(bounds.height * 0.4, MIN_CROP),
    });
    setCrop(starter);
    dragState.current = { mode: 'new', startX: point.x, startY: point.y, originCrop: starter, handle: null };
    setDragMode('new');
    overlayRef.current.setPointerCapture(event.pointerId);
  }, [getPoint, getCropBounds, crop, clampRect, isInsideCrop, getHandleAt]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const { mode, startX, startY, originCrop, handle } = dragState.current;
    const point = getPoint(event.clientX, event.clientY);
    if (!point || !mode) return;

    // Show handle cursor when hovering over one
    if (!mode && crop) {
      const h = getHandleAt(point.x, point.y, crop);
      setHoveredHandle(h);
    }

    if (mode === 'new') {
      const next: CropRect = {
        x: Math.min(startX, point.x),
        y: Math.min(startY, point.y),
        width: Math.abs(point.x - startX),
        height: Math.abs(point.y - startY),
      };
      setCrop(clampRect(next));
      return;
    }

    if (mode === 'move' && originCrop) {
      const next: CropRect = {
        x: originCrop.x + (point.x - startX),
        y: originCrop.y + (point.y - startY),
        width: originCrop.width,
        height: originCrop.height,
      };
      setCrop(clampRect(next));
      return;
    }

    if (mode === 'resize' && originCrop && handle) {
      const dx = point.x - startX;
      const dy = point.y - startY;
      let { x, y, width, height } = originCrop;

      // Horizontal resize
      if (handle.includes('l')) { x += dx; width -= dx; }
      if (handle.includes('r')) { width += dx; }

      // Vertical resize
      if (handle.includes('t')) { y += dy; height -= dy; }
      if (handle.includes('b')) { height += dy; }

      setCrop(clampRect({ x, y, width, height }));

      // Update start position for smooth continuous resize
      dragState.current.startX = point.x;
      dragState.current.startY = point.y;
      dragState.current.originCrop = { x, y, width, height };
    }
  }, [getPoint, clampRect, crop, getHandleAt]);

  const stopDragging = useCallback((event?: React.PointerEvent<HTMLDivElement>) => {
    if (event && overlayRef.current?.hasPointerCapture(event.pointerId)) {
      overlayRef.current.releasePointerCapture(event.pointerId);
    }
    dragState.current.mode = null;
    setDragMode(null);
  }, []);

  /* ─── Apply crop ─── */
  const applyCrop = useCallback(async () => {
    if (!crop || !imageRef.current) return;
    const img = imageRef.current;
    const scaleX = img.naturalWidth / imageBounds.width;
    const scaleY = img.naturalHeight / imageBounds.height;
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
  }, [crop, imageBounds, onApply]);

  // Compute cursor style from drag state (not ref, to avoid React Compiler warnings)
  const cursorStyle = useMemo(() => {
    if (dragMode === 'resize' && hoveredHandle) {
      const h = HANDLES.find(h => h.key === hoveredHandle);
      if (h) return h.cursor;
    }
    if (dragMode === 'move') return 'grabbing';
    if (crop && hoveredHandle) {
      const h = HANDLES.find(h => h.key === hoveredHandle);
      if (h) return h.cursor;
    }
    return crop ? 'default' : 'crosshair';
  }, [dragMode, hoveredHandle, crop]);

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-[200] h-[100dvh] w-screen flex flex-col bg-black overflow-hidden select-none"
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel?.(); }}
    >
      {/* ── Header ── */}
      <div className="flex-none border-b border-white/[0.06] bg-black/80 backdrop-blur-xl px-5 py-4 z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white">Adjust Crop</h3>
            <p className="mt-0.5 truncate text-xs text-white/40">{fileName}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Close crop tool"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Image area ── */}
      <div
        className="relative flex-1 flex flex-col items-center justify-center p-6 bg-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={overlayRef}
          className="relative max-h-full max-w-full overflow-hidden touch-none"
          style={{ cursor: cursorStyle }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop source"
            className="block max-h-[60dvh] max-w-full h-auto w-auto"
            onLoad={syncBounds}
            draggable={false}
          />

          {/* ── Dark overlay OUTSIDE crop only (4 panels) ── */}
          {crop && (
            <>
              {/* Top panel */}
              <div className="absolute inset-x-0 top-0 bg-black/60 pointer-events-none" style={{ height: `${crop.y}px` }} />
              {/* Left middle panel */}
              <div className="absolute bg-black/60 pointer-events-none" style={{ top: `${crop.y}px`, left: '0', width: `${crop.x}px`, height: `${crop.height}px` }} />
              {/* Right middle panel */}
              <div className="absolute bg-black/60 pointer-events-none" style={{ top: `${crop.y}px`, right: '0', width: `calc(100% - ${crop.x + crop.width}px)`, height: `${crop.height}px` }} />
              {/* Bottom panel */}
              <div className="absolute bg-black/60 pointer-events-none" style={{ top: `${crop.y + crop.height}px`, left: '0', width: '100%', bottom: '0' }} />
            </>
          )}

          {/* ── Rule-of-thirds grid inside crop ── */}
          {crop && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${crop.x}px`,
                top: `${crop.y}px`,
                width: `${crop.width}px`,
                height: `${crop.height}px`,
              }}
            >
              <div className="absolute inset-0">
                <div className="absolute left-[33.33%] top-0 bottom-0 w-px bg-white/20" />
                <div className="absolute left-[66.66%] top-0 bottom-0 w-px bg-white/20" />
                <div className="absolute top-[33.33%] left-0 right-0 h-px bg-white/20" />
                <div className="absolute top-[66.66%] left-0 right-0 h-px bg-white/20" />
              </div>
              <div className="absolute inset-0 border-2 border-champagne/80 rounded-[1px]" />
            </div>
          )}

          {/* ── Resize handles ── */}
          {crop && HANDLES.map((handle) => (
            <div
              key={handle.key}
              className="absolute w-4 h-4 bg-white border-2 border-champagne rounded-sm pointer-events-none"
              style={{
                left: `${crop.x + handle.x * crop.width - 8}px`,
                top: `${crop.y + handle.y * crop.height - 8}px`,
                cursor: handle.cursor,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Empty state hint ── */}
      {!crop && imageBounds.width > 0 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
          <p className="text-xs text-white/30 bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm">
            Tap and drag to select the receipt area
          </p>
        </div>
      )}

      {/* ── Footer ── */}
      <div
        className="flex-none border-t border-white/[0.06] bg-black/80 backdrop-blur-xl px-4 py-3 pb-safe-bottom z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCrop(null)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/50 transition hover:bg-white/10 hover:text-white"
            title="Reset Crop"
            aria-label="Reset crop"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex h-11 flex-1 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-sm font-medium text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={applyCrop}
              disabled={!crop}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-champagne to-champagne-dim px-5 text-sm font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30 shadow-[0_0_20px_-6px_rgba(190,169,142,0.3)]"
            >
              <Check className="h-4 w-4" />
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
