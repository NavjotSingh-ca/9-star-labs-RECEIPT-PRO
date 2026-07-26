import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createVariants(
  base: string,
  variants: Record<string, Record<string, string>>,
  compoundVariants: Array<{ class: string; variant?: Record<string, string | string[]>; [key: string]: unknown }> = [],
  defaultVariants: Record<string, string | boolean> = {}
) {
  return (props: Record<string, unknown> = {}) => {
    let className = base;

    // Apply variant classes
    Object.entries(variants).forEach(([key, variantMap]) => {
      const propValue = props[key];
      if (propValue && variantMap[propValue as string]) {
        className += ` ${variantMap[propValue as string]}`;
      } else if (defaultVariants[key] && variantMap[defaultVariants[key] as string]) {
        className += ` ${variantMap[defaultVariants[key] as string]}`;
      }
    });

    // Apply compound variants
    compoundVariants.forEach((cv) => {
      const matches = Object.entries(cv).every(([key, value]) => {
        if (key === 'class') return true;
        const propValue = props[key];
        if (!propValue) return false;
        if (Array.isArray(value)) {
          return value.includes(propValue);
        }
        return propValue === value;
      });
      if (matches) {
        className += ` ${cv.class}`;
      }
    });

    return className;
  };
}

export type VariantProps<T> = T extends (props: infer P) => string ? P : never;

// Deep merge for theme customization
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = target[key];
    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      (result as Record<string, unknown>)[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      );
    } else if (sourceValue !== undefined) {
      (result as Record<string, unknown>)[key] = sourceValue;
    }
  });
  return result;
}

// CSS variable helper
export function cssVar(name: string, fallback?: string): string {
  return `var(--${name}${fallback ? `, ${fallback}` : ''})`;
}

// Format currency (CAD)
export function formatCurrency(amount: number, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

// Format number with commas
export function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

// Truncate text
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}…`;
}

// Generate unique ID
export function generateId(prefix = ''): string {
  return `${prefix}${Math.random().toString(36).substring(2, 11)}`;
}

// Debounce
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

// Throttle
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  };
}

// Clamp
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Lerp
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

// Map range
export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
}