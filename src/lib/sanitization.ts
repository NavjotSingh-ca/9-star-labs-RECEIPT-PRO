/**
 * Input sanitization utilities for production safety
 * LOW-10: Improved patterns with additional dangerous vectors
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
  // LOW-10: Match on* event handlers with possible whitespace/tab bypass
  /on\w+[\s\t]*=/gi,
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

// MED-8: Validate file type via magic bytes, not just MIME header
export function sanitizeBase64Image(data: string): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'string') {
    return { valid: false, error: 'Invalid image data' };
  }
  const maxLen = 15 * 1024 * 1024 * 1.34; // ~15MB base64
  if (data.length > maxLen) {
    return { valid: false, error: 'Image too large' };
  }

  // Check data URI prefix first
  const dataUriMatch = data.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,/i);
  const rawBase64 = dataUriMatch ? data.slice(dataUriMatch[0].length) : data;

  // Validate it looks like base64
  if (!rawBase64.match(/^[A-Za-z0-9+/=\s]+$/)) {
    return { valid: false, error: 'Invalid image format' };
  }

  // MED-8: Check magic bytes of the decoded content
  try {
    // Decode first 16 bytes to check magic bytes
    const firstChunk = rawBase64.slice(0, 24); // 24 base64 chars = 18 bytes
    const binaryStr = atob(firstChunk);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

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
