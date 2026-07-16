/**
 * Input sanitization utilities for production safety.
 * Strips disallowed HTML/script constructs and validates file formats.
 */

const DISALLOWED_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi,
  /<link\b[^>]*>/gi,
  /<meta\b[^>]*>/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /on\w+[\s\t]*=/gi,
];

/**
 * Strips dangerous HTML/XSS patterns from a string and truncates to 5000 chars.
 *
 * @param input - The string to sanitize. Null/undefined returns empty string.
 * @returns The cleaned and truncated string.
 */
export function sanitizeString(input: string | null | undefined): string {
  if (input == null) return '';
  let cleaned = String(input).trim();
  DISALLOWED_PATTERNS.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, '');
  });
  return cleaned.slice(0, 5000);
}

/**
 * Sanitizes a filename to prevent path traversal and invalid characters.
 * Replaces unsafe characters with underscores, collapses consecutive underscores,
 * and truncates to 255 characters.
 *
 * @param name - The raw filename.
 * @returns The safe filename.
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 255);
}

/**
 * Sanitizes a currency value to a non-negative number with 2 decimal places.
 *
 * @param amount - The raw amount (number, string, null, or undefined).
 * @returns The sanitized number (0 if invalid).
 */
export function sanitizeCurrency(amount: number | string | null | undefined): number {
  if (amount == null) return 0;
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100) / 100);
}

/**
 * Validates that a string is a date in YYYY-MM-DD format.
 *
 * @param date - The date string to validate.
 * @returns True if the format matches YYYY-MM-DD.
 */
export function isValidDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/**
 * Cross-platform base64 decode returning a Uint8Array.
 * Works in both browser (atob) and Node.js (Buffer) environments.
 */
function base64ToBytes(b64: string): Uint8Array {
  if (typeof atob !== 'undefined') {
    const binaryStr = atob(b64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

/**
 * Validates that a base64-encoded image has valid magic bytes and reasonable size.
 * Checks: size limit (~15MB), base64 format, and magic bytes for JPEG/PNG/WebP/GIF.
 *
 * @param data - The base64 image string (with or without data URI prefix).
 * @returns An object with `valid: true` on success, or `valid: false` with an `error` message.
 */
export function sanitizeBase64Image(data: string): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'string') {
    return { valid: false, error: 'Invalid image data' };
  }
  const maxLen = 15 * 1024 * 1024 * 1.34;
  if (data.length > maxLen) {
    return { valid: false, error: 'Image too large — maximum 15 MB' };
  }

  const dataUriMatch = data.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i);
  const rawBase64 = dataUriMatch ? data.slice(dataUriMatch[0].length) : data;

  if (!rawBase64.match(/^[A-Za-z0-9+/=\s]+$/)) {
    return { valid: false, error: 'Invalid image format — expected base64' };
  }

  try {
    const firstChunk = rawBase64.slice(0, 24);
    const bytes = base64ToBytes(firstChunk);

    const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8;
    const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    const isWebP = bytes.length >= 12 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    const isGIF = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;

    if (!isJPEG && !isPNG && !isWebP && !isGIF) {
      return { valid: false, error: 'Unsupported file type. Only JPEG, PNG, WebP, and GIF are allowed.' };
    }
  } catch {
    return { valid: false, error: 'Could not validate image format' };
  }

  return { valid: true };
}
