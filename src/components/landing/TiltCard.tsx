'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltDegree?: number;
  glare?: boolean;
  scale?: number;
}

export function TiltCard({
  children,
  className,
  tiltDegree = 10,
  glare = true,
  scale = 1.02,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, scale: 1 });
  const rafRef = useRef<number | undefined>(undefined);

  // Spring animation state
  const springX = useRef(0);
  const springY = useRef(0);
  const springScale = useRef(1);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isTouch) return;
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Target rotation
    const targetRotateY = (x - 0.5) * tiltDegree;
    const targetRotateX = (0.5 - y) * tiltDegree;

    springX.current = targetRotateY;
    springY.current = targetRotateX;

    // Glare position
    if (glare) {
      setGlarePos({ x: x * 100, y: y * 100, opacity: 1 });
    }
  }, [isTouch, tiltDegree, glare]);

  const handlePointerLeave = useCallback(() => {
    springX.current = 0;
    springY.current = 0;
    springScale.current = 1;
    if (glare) {
      setGlarePos((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [glare]);

  const handlePointerEnter = useCallback(() => {
    springScale.current = scale;
  }, [scale]);

  // Spring animation loop
  useEffect(() => {
    const currentX = 0;
    let currentY = 0;
    let currentScale = 1;

    function animate() {
      // Spring physics (critical damping)
      const stiffness = 200;
      const mass = 0.9;

      // Y spring
      const forceY = (springY.current - currentY) * stiffness;
      currentY += forceY / mass * 0.016;

      // Scale spring
      const forceScale = (springScale.current - currentScale) * 300;
      currentScale += forceScale / mass * 0.016;

      // Apply if moving
      if (Math.abs(currentX) > 0.01 || Math.abs(currentY) > 0.01 || Math.abs(currentScale - 1) > 0.01) {
        setTransform({ rotateX: currentY, rotateY: currentX, scale: currentScale });
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn('group relative rounded-2xl', className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
      style={{
        transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {glare && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            background: `radial-gradient(ellipse at ${glarePos.x}% ${glarePos.y}%, rgba(190,169,142,${glarePos.opacity * 0.15}) 0%, transparent 70%)`,
            transition: 'opacity 300ms ease-out',
            opacity: glarePos.opacity,
          }}
        />
      )}
      <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>
    </div>
  );
}

export default TiltCard;