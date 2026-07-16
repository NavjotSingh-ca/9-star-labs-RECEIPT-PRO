'use client';

import { useEffect, useRef, useCallback } from 'react';

interface TouchGesturesOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchZoom?: (scale: number) => void;
  threshold?: number;
  preventScroll?: boolean;
}

export function useTouchGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinchZoom,
  threshold = 50,
  preventScroll = false,
}: TouchGesturesOptions) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    } else if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      initialPinchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (preventScroll && event.cancelable) {
        event.preventDefault();
      }

      if (event.touches.length === 2 && initialPinchDistanceRef.current !== null && onPinchZoom) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        const scale = currentDistance / initialPinchDistanceRef.current!;
        onPinchZoom(scale);
      }
    },
    [preventScroll, onPinchZoom]
  );

  const handleTouchEnd = useCallback(
    (_event: TouchEvent) => {
      if (!touchStartRef.current || !lastTouchRef.current) return;

      const start = touchStartRef.current;
      const end = lastTouchRef.current;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const duration = end.time - start.time;
      const velocity = distance / duration;

      // Minimum distance and velocity for a swipe
      if (distance > threshold && velocity > 0.3) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        // Left swipe: -135 to -45 degrees
        if (angle <= -135 || angle >= 135) {
          onSwipeLeft?.();
        }
        // Right swipe: -45 to 45 degrees
        else if (angle >= -45 && angle <= 45) {
          onSwipeRight?.();
        }
        // Up swipe: 45 to 135 degrees
        else if (angle >= 45 && angle <= 135) {
          onSwipeDown?.(); // Note: dy is negative for up swipe
        }
        // Down swipe: -135 to -45 degrees (inverted because screen coords)
        else {
          onSwipeUp?.();
        }
      }

      touchStartRef.current = null;
      lastTouchRef.current = null;
      initialPinchDistanceRef.current = null;
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]
  );

  useEffect(() => {
    const element = document.body;
    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd);
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventScroll]);
}