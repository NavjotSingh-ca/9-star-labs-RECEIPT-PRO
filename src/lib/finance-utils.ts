/* ─── Finance Utilities — Telos Labs v8.0 ─── */
/* Dinero.js v2 with proper currency objects and toDecimal API */

import { dinero, add, equal, toDecimal, CAD } from 'dinero.js';

/**
 * Safely converts a float dollar amount to integer cents, avoiding floating-point edge cases.
 * Uses Number.EPSILON to handle values like 1.005 where x*100 produces 100.4999 instead of 100.5.
 */
function floatToCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100);
}

/**
 * Safely converts a float dollar amount into a Dinero v2 object (integer cents).
 * Uses the proper CAD currency object (not a string).
 */
export function toDinero(amount: number | string | null | undefined) {
  if (amount === null || amount === undefined || amount === '') {
    return dinero({ amount: 0, currency: CAD });
  }
  const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(parsed)) return dinero({ amount: 0, currency: CAD });

  // C9: Use safe float-to-cents conversion
  return dinero({ amount: floatToCents(parsed), currency: CAD });
}

/**
 * Validates subtotal + taxes === total with precision using Dinero v2 equal().
 */
export function isMathMismatch(subtotal: number, gst: number, pst: number, total: number): boolean {
  const dSub = toDinero(subtotal);
  const dGst = toDinero(gst);
  const dPst = toDinero(pst);
  const dTotal = toDinero(total);

  const expectedTotal = add(dSub, add(dGst, dPst));

  return !equal(expectedTotal, dTotal);
}

/**
 * Formats a raw database dollar float to local currency string.
 * Uses Dinero v2 toDecimal() + Intl.NumberFormat (toFormat was removed in v2).
 */
export function formatDineroIntl(amount: number | string | null | undefined, _currency = 'CAD'): string {
  const d = toDinero(amount);
  const formatter = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 2,
  });
  const decimalValue = toDecimal(d, ({ value }) => parseFloat(value));
  return formatter.format(decimalValue);
}
