'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  /** Starting value (default 0) */
  from?: number;
  /** Target value to animate to */
  to: number;
  /** Optional formatter for the displayed value */
  format?: (value: number) => string;
  /** Additional CSS class names */
  className?: string;
  /** Delay in ms before animation starts */
  delay?: number;
  /** Aria live politeness for screen readers (default: 'polite') */
  ariaLive?: 'polite' | 'assertive' | 'off';
}

export default function AnimatedCounter({
  from = 0,
  to,
  format,
  className = '',
  delay = 0,
  ariaLive = 'polite',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(from);
  const spring = useSpring(motionValue, { damping: 25, stiffness: 120 });
  const displayValue = useTransform(spring, (latest) => {
    if (format) return format(latest);
    if (Number.isInteger(to)) return Math.round(latest).toLocaleString();
    return latest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      motionValue.set(to);
    }, delay);
    return () => clearTimeout(timeout);
  }, [to, delay, motionValue]);

  return <motion.span ref={ref} className={className} aria-live={ariaLive} aria-atomic="true">{displayValue}</motion.span>;
}
