'use client';

import { useRef } from 'react';
import type { ReactNode, CSSProperties } from 'react';

interface TiltCardProps {
  children: ReactNode;
  tiltDegree?: number;
  glare?: boolean;
  scale?: number;
  className?: string;
  style?: CSSProperties;
}

export function TiltCard({
  children,
  tiltDegree: _tiltDegree = 7,
  glare = false,
  scale: _scale = 1,
  className = '',
  style,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      {children}
      {glare && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(190,169,142,0.15) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default TiltCard;