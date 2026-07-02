'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  /* ─── Display size: explicit JS-calculated dimensions ─── */
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  /* ─── Crop state ─── */
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle | null>(null);

  const dragState = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    originCrop: CropRect | null;
    handle: ResizeHandle | null;
  }>({ mode: null, startX: 0, startY: 0, originCrop: null, handle: null });

  useEffect(() => { setCrop(null); setReady(false); }, [imageSrc]);

  /* ─── Calculate display dimensions ─── */
  const calcDisplaySize = useCallback(() => {
    const img = imageRef.current;
    const containerEl = containerRef.current;
    if (!img || !containerEl) return;

    const containerRect = containerEl.getBoundingClientRect();
    const pad = 8; // p-2 = 8px
    const maxW = containerRect.width - pad * 2;
    const maxH = containerRect.height - pad * 2;
    if (maxW <= 0 || maxH <= 0) return;

    const aspect = img.naturalWidth / img.naturalHeight;
    let w = img.naturalWidth;
    let h = img.naturalHeight;

    // Scale down proportionally to fit container
    if (h > maxH) { h = maxH; w = h * aspect; }
    if (w > maxW) { w = maxW; h = w / aspect; }

    setDisplaySize({ width: Math.round(w), height: Math.round(h) });
    setReady(true);
  }, []);

  /* ─── Recalc on image load and on resize ─── */
  const onImgLoad = useCallback(() => {
    calcDisplaySize();
  }, [calcDisplaySize]);

  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;
    const ro = new ResizeObserver(() => {
      if (imageRef.current) calcDisplaySize();
    });
    ro.observe(containerEl);
    return () => ro.disconnect();
  }, [calcDisplaySize]);

  /* ─── Get pointer coordinates relative to the IMAGE element ─── */
  const getPoint = useCallback((clientX: number, clientY: number) => {
    const imgRect = imageRef.current?.getBoundingClientRect();
    if (!imgRect) return null;
    return { x: clientX - imgRect.left, y: clientY - imgRect.top };
  }, []);

  /* ─── Clamp crop within image display bounds ─── */
  const clampRect = useCallback((next: CropRect): CropRect => {
    const { width: bw, height: bh } = displaySize;
    if (bw <= 0 || bh <= 0) return next;
    const width = Math.max(MIN_CROP, Math.min(next.width, bw));
    const height = Math.max(MIN_CROP, Math.min(next.height, bh));
    const x = Math.max(0, Math.min(next.x, bw - width));
    const y = Math.max(0, Math.min(next.y, bh - height));
    return { x, y, width, height };
  }, [displaySize]);

  /* ─── Hit-test helpers ─── */
  const isInsideCrop = useCallback((px: number, py: number, cropRect: CropRect): boolean => {
    const margin = 20;
    return px >= cropRect.x - margin && px <= cropRect.x + cropRect.width + margin &&
           py >= cropRect.y - margin && py <= cropRect.y + cropRect.height + margin;
  }, []);

  const getHandleAt = useCallback((px: number, py: number, cropRect: CropRect): ResizeHandle | null => {
    const size = 10;
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

    if (crop) {
      const handleKey = getHandleAt(point.x, point.y, crop);
      if (handleKey) {
        dragState.current = { mode: 'resize', startX: point.x, startY: point.y, originCrop: crop, handle: handleKey };
        overlayRef.current.setPointerCapture(event.pointerId);
        return;
      }
    }

    const canMove = crop && isInsideCrop(point.x, point.y, crop);
    if (canMove) {
      dragState.current = { mode: 'move', startX: point.x, startY: point.y, originCrop: crop, handle: null };
      overlayRef.current.setPointerCapture(event.pointerId);
      return;
    }

    const starter = clampRect({
      x: point.x,
      y: point.y,
      width: Math.max(displaySize.width * 0.4, MIN_CROP),
      height: Math.max(displaySize.height * 0.4, MIN_CROP),
    });
    setCrop(starter);
    dragState.current = { mode: 'new', startX: point.x, startY: point.y, originCrop: starter, handle: null };
    overlayRef.current.setPointerCapture(event.pointerId);
  }, [getPoint, crop, clampRect, isInsideCrop, getHandleAt, displaySize]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const { mode, startX, startY, originCrop, handle } = dragState.current;
    const point = getPoint(event.clientX, event.clientY);
    if (!point || !mode) return;

    if (!mode && crop) {
      setHoveredHandle(getHandleAt(point.x, point.y, crop));
    }

    if (mode === 'new') {
      setCrop(clampRect({
        x: Math.min(startX, point.x),
        y: Math.min(startY, point.y),
        width: Math.abs(point.x - startX),
        height: Math.abs(point.y - startY),
      }));
      return;
    }

    if (mode === 'move' && originCrop) {
      setCrop(clampRect({
        x: originCrop.x + (point.x - startX),
        y: originCrop.y + (point.y - startY),
        width: originCrop.width,
        height: originCrop.height,
      }));
      return;
    }

    if (mode === 'resize' && originCrop && handle) {
      const dx = point.x - startX;
      const dy = point.y - startY;
      let { x, y, width, height } = originCrop;

      if (handle.includes('l')) { x += dx; width -= dx; }
      if (handle.includes('r')) { width += dx; }
      if (handle.includes('t')) { y += dy; height -= dy; }
      if (handle.includes('b')) { height += dy; }

      setCrop(clampRect({ x, y, width, height }));
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
  }, []);

  /* ─── Apply crop ─── */
  const applyCrop = useCallback(async () => {
    if (!crop || !imageRef.current || displaySize.width <= 0) return;
    const img = imageRef.current;
    const scaleX = img.naturalWidth / displaySize.width;
    const scaleY = img.naturalHeight / displaySize.height;
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
  }, [crop, displaySize, onApply]);

  /* ─── Cursor style ─── */
  const cursorStyle = useMemo(() => {
    const m = dragState.current.mode;
    if (m === 'resize' && hoveredHandle) {
      return HANDLES.find(h => h.key === hoveredHandle)?.cursor ?? 'default';
    }
    if (m === 'move') return 'grabbing';
    if (crop && hoveredHandle) {
      return HANDLES.find(h => h.key === hoveredHandle)?.cursor ?? 'default';
    }
    return crop ? 'default' : 'crosshair';
  }, [hoveredHandle, crop]);

  /* ─── Image centre offset for overlay elements ─── */
  const imgOffset = useMemo(() => ({
    left: displaySize.width > 0 ? -(displaySize.width / 2) : 0,
    top: displaySize.height > 0 ? -(displaySize.height / 2) : 0,
  }), [displaySize]);

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-[200] h-[100dvh] w-screen flex flex-col bg-black overflow-hidden select-none"
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel?.(); }}
    >
      {/* ── Header ── */}
      <div className="flex-none border-b border-white/[0.06] bg-black/80 backdrop-blur-xl px-5 py-4 z-10">
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

      {/* ── Image area — overlay fills flex-1, image sized via JS ── */}
      <div
        ref={containerRef}
        className="relative flex-1 flex items-center justify-center bg-black overflow-hidden p-2"
        style={{ cursor: cursorStyle }}
      >
        <div
          ref={overlayRef}
          className="relative"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        >
          {/* Image rendered at explicit JS-calculated size — no CSS sizing circularity */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop source"
            className="block"
            style={
              displaySize.width > 0
                ? { width: displaySize.width, height: displaySize.height }
                : { maxWidth: '100%', maxHeight: '75dvh', width: 'auto', height: 'auto' }
            }
            onLoad={onImgLoad}
            draggable={false}
          />

          {/* ── Overlay elements positioned relative to the image ── */}
          {crop && ready && (
            <div
              className="absolute left-1/2 top-1/2 pointer-events-none"
              style={{
                marginLeft: imgOffset.left,
                marginTop: imgOffset.top,
                width: displaySize.width,
                height: displaySize.height,
              }}
            >
              {/* Dark panels (4 sides) */}
              <div className="absolute inset-x-0 top-0 bg-black/60 pointer-events-none" style={{ height: `${crop.y}px` }} />
              <div className="absolute bg-black/60 pointer-events-none" style={{ top: `${crop.y}px`, left: '0', width: `${crop.x}px`, height: `${crop.height}px` }} />
              <div className="absolute bg-black/60 pointer-events-none" style={{ top: `${crop.y}px`, right: '0', width: `calc(100% - ${crop.x + crop.width}px)`, height: `${crop.height}px` }} />
              <div className="absolute bg-black/60 pointer-events-none" style={{ top: `${crop.y + crop.height}px`, left: '0', width: '100%', bottom: '0' }} />

              {/* Rule-of-thirds grid */}
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

              {/* Resize handles (8) */}
              {HANDLES.map((handle) => (
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
          )}
        </div>
      </div>

      {/* ── Empty state hint ── */}
      {!crop && ready && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
          <p className="text-xs text-white/30 bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm">
            Tap and drag to select the receipt area
          </p>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex-none border-t border-white/[0.06] bg-black/80 backdrop-blur-xl px-4 py-3 pb-safe-bottom z-10">
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
              disabled={!crop || !ready}
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
