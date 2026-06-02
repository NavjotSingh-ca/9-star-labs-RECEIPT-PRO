'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  from?: number;
  to: number;
  format?: (value: number) => string;
  className?: string;
  delay?: number;
}

export default function AnimatedCounter({
  from = 0,
  to,
  format,
  className = '',
  delay = 0,
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

  return <motion.span ref={ref} className={className}>{displayValue}</motion.span>;
}
