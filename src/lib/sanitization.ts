/**
 * Input sanitization utilities for production safety
 */

const DISALLOWED_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
];

export function sanitizeString(input: string | null | undefined): string {
  if (input == null) return '';
  let cleaned = String(input).trim();
  DISALLOWED_PATTERNS.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, '');
  });
  return cleaned.slice(0, 5000);
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 255);
}

export function sanitizeCurrency(amount: number | string | null | undefined): number {
  if (amount == null) return 0;
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100) / 100);
}

export function isValidDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function sanitizeBase64Image(data: string): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'string') {
    return { valid: false, error: 'Invalid image data' };
  }
  const maxLen = 15 * 1024 * 1024 * 1.34; // ~15MB base64
  if (data.length > maxLen) {
    return { valid: false, error: 'Image too large' };
  }
  if (!data.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i) && !data.match(/^[A-Za-z0-9+/=]+$/)) {
    return { valid: false, error: 'Invalid image format' };
  }
  return { valid: true };
}
