export async function generateSHA256(dataString: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function generateDuplicateHash(
  vendor: string,
  date: string,
  total: string | number,
): Promise<string> {
  // Normalize inputs for consistent hashing
  const normalized = [
    vendor.toLowerCase().trim().replace(/\s+/g, ' '),
    date.trim(),
    // Ensure 0.01 precision for total in hash
    Number(total).toFixed(2),
  ].join('|');

  return generateSHA256(normalized);
}

export async function generateIntegrityHash(fileBuffer: BufferSource): Promise<string> {
  // Verify buffer is not empty
  if (fileBuffer instanceof ArrayBuffer && fileBuffer.byteLength === 0) {
    throw new Error('Cannot generate hash from empty buffer');
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashString = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Verify hash is not empty
  if (!hashString || hashString.length !== 64) {
    throw new Error('Invalid hash generated');
  }

  return hashString;
}

export async function generateAuditEventHash(
  previousHash: string,
  eventData: Record<string, unknown>
): Promise<string> {
  // Merkle-chain logic: Hash(Previous_Hash || Stringified_Event)
  // Sort keys for deterministic stringification
  const canonicalData = JSON.stringify(eventData, Object.keys(eventData).sort());

  // Verify inputs are valid
  if (!previousHash || previousHash.length !== 64) {
    throw new Error('Invalid previous hash for audit chain');
  }

  if (!canonicalData || canonicalData.length === 0) {
    throw new Error('Invalid event data for audit chain');
  }

  return generateSHA256(`[${previousHash}]-[${canonicalData}]`);
}

export function verifyHashFormat(hash: string): boolean {
  // SHA-256 hashes should be 64 hexadecimal characters
  return /^[a-f0-9]{64}$/i.test(hash);
}
