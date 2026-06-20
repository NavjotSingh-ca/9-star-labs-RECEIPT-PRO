'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';

import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { CropRect, ManualCropperProps } from './types';

type DragMode = 'new' | 'move' | null;

export default function ManualCropper({ imageSrc, fileName, onCancel, onApply }: ManualCropperProps) {
  const trapRef = useFocusTrap(true);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [imageBounds, setImageBounds] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<CropRect | null>(null);

  const dragState = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    originCrop: CropRect | null;
  }>({
    mode: null,
    startX: 0,
    startY: 0,
    originCrop: null,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCrop(null);
  }, [imageSrc]);

  function syncBounds() {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    setImageBounds({ width: rect.width, height: rect.height });
  }

  function getOverlayRect() {
    return overlayRef.current?.getBoundingClientRect() ?? null;
  }

  function getCropBounds(): { width: number; height: number } {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return imageBounds;
    return { width: rect.width, height: rect.height };
  }

  function clampRect(next: CropRect): CropRect {
    const bounds = getCropBounds();
    const width = Math.max(30, Math.min(next.width, bounds.width));
    const height = Math.max(30, Math.min(next.height, bounds.height));
    const x = Math.max(0, Math.min(next.x, bounds.width - width));
    const y = Math.max(0, Math.min(next.y, bounds.height - height));
    return { x, y, width, height };
  }

  function getPoint(clientX: number, clientY: number) {
    const rect = getOverlayRect();
    if (!rect) return null;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!overlayRef.current) return;
    const point = getPoint(event.clientX, event.clientY);
    if (!point) return;

    const bounds = getCropBounds();
    const isInsideExisting =
      crop &&
      point.x >= crop.x && point.x <= crop.x + crop.width &&
      point.y >= crop.y && point.y <= crop.y + crop.height;

    dragState.current = {
      mode: isInsideExisting ? 'move' : 'new',
      startX: point.x,
      startY: point.y,
      originCrop: crop,
    };

    if (!isInsideExisting) {
      const starter = clampRect({
        x: point.x,
        y: point.y,
        width: Math.max(bounds.width * 0.4, 60),
        height: Math.max(bounds.height * 0.4, 60),
      });
      setCrop(starter);
    }

    overlayRef.current.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const mode = dragState.current.mode;
    if (!mode) return;
    const point = getPoint(event.clientX, event.clientY);
    if (!point) return;

    if (mode === 'new') {
      const s = dragState.current;
      const next: CropRect = {
        x: Math.min(s.startX, point.x),
        y: Math.min(s.startY, point.y),
        width: Math.abs(point.x - s.startX),
        height: Math.abs(point.y - s.startY),
      };
      setCrop(clampRect(next));
      return;
    }

    if (mode === 'move') {
      const origin = dragState.current.originCrop;
      if (!origin) return;
      const next: CropRect = {
        x: origin.x + (point.x - dragState.current.startX),
        y: origin.y + (point.y - dragState.current.startY),
        width: origin.width,
        height: origin.height,
      };
      setCrop(clampRect(next));
    }
  }

  function stopDragging(event?: React.PointerEvent<HTMLDivElement>) {
    if (event && overlayRef.current?.hasPointerCapture(event.pointerId)) {
      overlayRef.current.releasePointerCapture(event.pointerId);
    }
    dragState.current.mode = null;
  }

  async function applyCrop() {
    if (!crop || !imageRef.current) return;

    const img = imageRef.current;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const scaleX = naturalWidth / imageBounds.width;
    const scaleY = naturalHeight / imageBounds.height;

    const sourceX = Math.round(crop.x * scaleX);
    const sourceY = Math.round(crop.y * scaleY);
    const sourceWidth = Math.round(crop.width * scaleX);
    const sourceHeight = Math.round(crop.height * scaleY);

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, sourceWidth);
    canvas.height = Math.max(1, sourceHeight);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onApply(croppedDataUrl);
  }

  const cropStyle = useMemo(() => {
    if (!crop) return undefined;
    return {
      left: `${crop.x}px`,
      top: `${crop.y}px`,
      width: `${crop.width}px`,
      height: `${crop.height}px`,
    };
  }, [crop]);

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-[200] h-[100dvh] w-screen flex flex-col bg-black overflow-hidden select-none"
      onClick={onCancel}
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel?.(); }}
    >
      {/* Header (Fixed) */}
      <div className="flex-none border-b border-glass-border bg-surface px-5 py-4 z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-text-primary">Crop</h3>
            <p className="mt-0.5 truncate text-xs text-text-muted">{fileName}</p>
          </div>
          <button 
            type="button"
            onClick={onCancel} 
            className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised text-text-muted transition hover:bg-surface-hover hover:text-text-primary shadow-sm"
            aria-label="Close crop tool"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main Image Area (Perfect Centering) */}
      <div 
        className="relative flex-1 flex flex-col items-center justify-center p-4 bg-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={overlayRef}
          className="relative inline-flex max-h-full max-w-full overflow-hidden rounded-xl border border-glass-border/30 bg-black touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerLeave={stopDragging}
        >
          <Image
            ref={imageRef}
            src={imageSrc}
            alt="Crop source"
            width={800}
            height={600}
            className="max-h-[80vh] max-w-full h-auto w-auto select-none opacity-90"
            onLoad={syncBounds}
          />

          <div className="pointer-events-none absolute inset-0 bg-black/60" />

          {crop && (
            <div
              className="pointer-events-none absolute border-2 border-champagne shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
              style={cropStyle}
            />
          )}
        </div>
        
        {!crop && (
          <p className="mt-4 text-xs text-text-muted/50">
            Tap and drag to select the receipt area
          </p>
        )}
      </div>

      {/* Footer */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[210] border-t border-glass-border bg-black px-4 py-3 pb-safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCrop(null)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-glass-border bg-surface text-text-secondary transition hover:bg-surface-hover"
            title="Reset Crop"
            aria-label="Reset crop"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex h-11 flex-1 items-center justify-center rounded-lg border border-glass-border bg-surface text-sm font-medium text-text-muted transition hover:bg-surface-hover"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={applyCrop}
              disabled={!crop}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-success px-5 text-sm font-semibold text-white transition hover:bg-emerald-success/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="h-4 w-4" />
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}