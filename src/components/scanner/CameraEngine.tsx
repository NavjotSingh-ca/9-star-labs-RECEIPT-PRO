'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCcw } from 'lucide-react';

import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { CameraEngineProps } from './types';

export default function CameraEngine({ onCapture, onClose }: CameraEngineProps) {
  const trapRef = useFocusTrap(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        setIsStarting(true);
        setError(null);

        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Camera not supported on this device or browser. Use the upload option instead.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            aspectRatio: { ideal: 4 / 3 }
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {
              setError('Video playback failed. Your browser may not support this camera format.');
            });
          };
        }
        setStream(stream);
        streamRef.current = stream;

        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as { torch?: boolean };
        if (capabilities.torch) {
          setHasFlash(true);
        }
      } catch (err) {
        const msg = err instanceof DOMException
          ? err.name === 'NotAllowedError'
            ? 'Camera permission denied. Allow camera access in your browser settings and try again.'
            : err.name === 'NotFoundError'
              ? 'No camera found on this device. Use the upload option instead.'
              : err.name === 'NotReadableError'
                ? 'Camera is busy. Close other apps using the camera and try again.'
                : err.name === 'OverconstrainedError'
                  ? 'Camera resolution not supported. Try a different device.'
                  : `Camera error: ${err.message}`
          : 'Camera access denied. Check permissions or use upload instead.';
        setError(msg);
      } finally {
        setIsStarting(false);
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleFlash = async () => {
    if (!stream || !hasFlash) return;

    try {
      const track = stream.getVideoTracks()[0];
      const nextFlashState = !isFlashOn;
      interface ExtendedMediaTrackConstraintSet extends MediaTrackConstraintSet {
        torch?: boolean;
      }
      await track.applyConstraints({
        advanced: [{ torch: nextFlashState } as ExtendedMediaTrackConstraintSet]
      });
      setIsFlashOn(nextFlashState);
    } catch {
      // Flash toggle failed — non-critical, just keep current state
    }
  };

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Canvas rendering not supported. Try using the gallery upload option.');
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.95);
    });

    if (blob) {
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      await onCapture(file);
    } else {
      setError('Failed to capture image. Your browser may not support JPEG encoding. Try uploading a photo instead.');
    }
  };

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 bg-black z-[300] flex flex-col"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose?.(); }}
    >
      {/* Header with close button */}
      <div className="bg-black text-white p-4 flex justify-between items-center border-b border-white/10">
        <h2 className="text-lg font-semibold">Take Photo</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-2xl leading-none text-text-muted hover:text-text-primary transition"
          aria-label="Close camera"
        >
          ✕
        </button>
      </div>

      {/* Camera Area */}
      <div className="flex-1 flex flex-col items-center justify-center bg-black overflow-hidden relative" role="region" aria-label="Camera viewfinder">
        {isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 z-10" role="status" aria-live="polite" aria-label="Initializing camera">
            <RefreshCcw className="h-10 w-10 animate-spin mb-4" />
            <p className="text-sm font-medium">Initializing Lens...</p>
          </div>
        )}

        {error ? (
          <div className="p-8 text-center text-white z-10" role="alert">
            <p className="text-danger mb-4">{error}</p>
            <button
              type="button"
              aria-label="Go back"
              onClick={onClose}
              className="px-6 py-2 rounded-[2rem] bg-white/10 hover:bg-white/20 transition"
            >
              Go Back
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            autoPlay
            muted
          />
        )}
      </div>

      {/* Controls - at bottom */}
      <div className="bg-black text-white p-8 flex gap-4 justify-center flex-wrap border-t border-white/10">
        <div className="flex gap-4 w-full max-w-md">
          {hasFlash && (
            <button
              type="button"
              onClick={toggleFlash}
              className={`px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all ${
                isFlashOn ? 'bg-warning text-obsidian' : 'bg-surface-raised text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`}
            >
              {isFlashOn ? 'Flash On' : 'Flash Off'}
            </button>
          )}
          <button
            type="button"
            onClick={takePhoto}
            disabled={isStarting || !!error}
            className="bg-champagne hover:bg-champagne-dim text-obsidian px-8 py-3 rounded-full flex-1 text-sm font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
          >
            Capture
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-surface-raised hover:bg-surface-hover text-text-secondary px-8 py-3 rounded-full flex-1 text-sm font-bold uppercase tracking-widest transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
