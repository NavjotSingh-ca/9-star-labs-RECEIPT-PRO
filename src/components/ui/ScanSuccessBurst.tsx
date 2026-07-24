'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  delay: number;
  color: string;
}

interface ScanSuccessBurstProps {
  /** When true, triggers the burst animation */
  trigger: boolean;
  /** Fires when the animation completes */
  onComplete?: () => void;
  /** Duration of the full animation in ms */
  duration?: number;
  /** Number of particles (8-32) */
  particleCount?: number;
}

const PARTICLE_COLORS = [
  'var(--champagne)',
  'var(--champagne-dim, #8b7355)',
  'var(--emerald-success, #22c55e)',
  'var(--champagne)',
  '#fef3c7',
];

/**
 * Premium particle burst + checkmark animation for scan success feedback.
 * Renders 16-32 particles that explode outward with gravity, rotation, and fade,
 * followed by a centered checkmark. Auto-dismisses after `duration` ms.
 *
 * Usage: `<ScanSuccessBurst trigger={scanSuccess} onComplete={() => setScanSuccess(false)} />`
 * Render absolutely positioned over any surface.
 */
export function ScanSuccessBurst({
  trigger,
  onComplete,
  duration = 1800,
  particleCount = 16,
}: ScanSuccessBurstProps) {
  const [show, setShow] = useState(false);
  const particlesRef = useRef<Particle[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = Math.min(Math.max(particleCount, 8), 32);

  const generateParticles = useCallback(
    (): Particle[] =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 240,
        y: (Math.random() - 0.5) * 240 - 40,
        rotation: Math.random() * 720 - 360,
        scale: 0.3 + Math.random() * 0.7,
        delay: Math.random() * 0.15,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      })),
    [count],
  );

  useEffect(() => {
    if (!trigger) return;

    particlesRef.current = generateParticles();
    setShow(true);

    timerRef.current = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [trigger, duration, onComplete, generateParticles]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          aria-hidden
        >
          {/* Particle burst ring */}
          <div className="relative flex items-center justify-center">
            {particlesRef.current.map((p) => (
              <motion.div
                key={p.id}
                className="absolute h-2 w-2 rounded-full"
                style={{ backgroundColor: p.color }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  opacity: [1, 0.8, 0],
                  scale: [0, p.scale, 0],
                  rotate: p.rotation,
                }}
                transition={{
                  duration: duration / 1000,
                  delay: p.delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
            ))}

            {/* Center checkmark */}
            <motion.div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background:
                  'linear-gradient(135deg, var(--champagne), var(--champagne-dim, #8b7355))',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.15, 1], opacity: [0, 1, 1] }}
              transition={{
                duration: 0.4,
                delay: 0.1,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <Check className="h-8 w-8 text-black" strokeWidth={3} />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
