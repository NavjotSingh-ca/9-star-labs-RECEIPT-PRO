'use client';

import { useMemo } from 'react';

export const passwordRequirements = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function usePasswordStrength(password: string) {
  return useMemo(() => {
    if (!password) return { score: 0, label: '', color: '', width: '0%' };
    const passed = passwordRequirements.filter((r) => r.test(password)).length;
    if (passed <= 1) return { score: passed, label: 'Weak', color: 'bg-danger', width: '25%' };
    if (passed === 2) return { score: passed, label: 'Fair', color: 'bg-warning', width: '50%' };
    if (passed === 3) return { score: passed, label: 'Good', color: 'bg-champagne-dim', width: '75%' };
    return { score: passed, label: 'Strong', color: 'bg-emerald-light', width: '100%' };
  }, [password]);
}
