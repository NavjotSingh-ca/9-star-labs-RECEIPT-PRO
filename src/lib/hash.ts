/**
 * Generates a SHA-256 hex digest of a string.
 *
 * @param dataString - The input string to hash.
 * @returns The 64-character lowercase hex digest.
 * @throws {Error} If the Web Crypto API is unavailable (e.g. insecure context).
 */
export async function generateSHA256(dataString: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a deterministic SHA-256 hash for duplicate detection.
 * Inputs are normalized (lowercase, trimmed, single spaces) so that minor
 * formatting differences produce the same hash.
 *
 * @param vendor - The vendor name.
 * @param date - The transaction date string (YYYY-MM-DD).
 * @param total - The total amount.
 * @returns The 64-character hex hash.
 */
export async function generateDuplicateHash(
  vendor: string,
  date: string,
  total: string | number,
): Promise<string> {
  const normalized = [
    vendor.toLowerCase().trim().replace(/\s+/g, ' '),
    date.trim(),
    Number(total).toFixed(2),
  ].join('|');

  return generateSHA256(normalized);
}

/**
 * Generates a SHA-256 integrity hash for a file buffer (image, PDF, etc.).
 *
 * @param fileBuffer - The file contents as an ArrayBuffer or other BufferSource.
 * @returns The 64-character hex digest.
 * @throws {Error} If the buffer is empty or the hash is invalid.
 */
export async function generateIntegrityHash(fileBuffer: BufferSource): Promise<string> {
  if (fileBuffer instanceof ArrayBuffer && fileBuffer.byteLength === 0) {
    throw new Error('Cannot generate hash from empty buffer');
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashString = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  if (!hashString || hashString.length !== 64) {
    throw new Error('Invalid hash generated');
  }

  return hashString;
}

/**
 * Generates a Merkle-chain audit event hash.
 * Hash = SHA-256(`[previousHash]-[canonicalEventData]`).
 *
 * @param previousHash - The hash of the previous event in the chain (64 hex chars).
 * @param eventData - The event payload. Keys are sorted for deterministic serialization.
 * @returns The 64-character hex digest.
 * @throws {Error} If previousHash is invalid or eventData is empty.
 */
export async function generateAuditEventHash(
  previousHash: string,
  eventData: Record<string, unknown>
): Promise<string> {
  const canonicalData = JSON.stringify(eventData, Object.keys(eventData).sort());

  if (!previousHash || previousHash.length !== 64) {
    throw new Error('Invalid previous hash for audit chain');
  }

  if (!canonicalData || canonicalData.length === 0) {
    throw new Error('Invalid event data for audit chain');
  }

  return generateSHA256(`[${previousHash}]-[${canonicalData}]`);
}

/**
 * Validates that a string is a valid 64-character SHA-256 hex digest.
 *
 * @param hash - The hash string to validate.
 * @returns True if the hash matches the SHA-256 format.
 */
export function verifyHashFormat(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}
