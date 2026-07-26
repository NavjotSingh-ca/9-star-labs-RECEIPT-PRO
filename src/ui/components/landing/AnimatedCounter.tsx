'use client';

import * as React from 'react';
import { cn } from '@/ui/utils/cn';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  decimals?: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  className,
  decimals = 0,
}: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [displayValue, setDisplayValue] = React.useState(0);
  const animRef = React.useRef<number | undefined>(undefined);

  // IntersectionObserver for scroll-triggered animation
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: '-80px', threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animate the counter value
  React.useEffect(() => {
    if (!isVisible) return;

    const duration = 1200;
    const start = performance.now();
    const startValue = displayValue;

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = startValue + (value - startValue) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current !== undefined) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [isVisible, value, decimals, displayValue]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix && <span>{prefix}</span>}
      <span>{displayValue.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
      <span>{suffix}</span>
    </span>
  );
}

export default AnimatedCounter;