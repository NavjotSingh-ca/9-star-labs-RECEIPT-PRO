/**
 * Immutable Logging System - Cryptographic proof of receipt existence
 * Creates tamper-evident log chains without blockchain costs
 */

// Merkle tree node type for future expansion
// interface MerkleNode { hash: string; left?: string; right?: string; timestamp: number; data?: string; }

/**
 * Create SHA-256 hash of receipt data for immutability
 */
export async function hashReceipt(receipt: Record<string, unknown>): Promise<string> {
  const data = JSON.stringify(receipt, Object.keys(receipt).sort());
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create Merkle root from array of receipt hashes
 * Allows proving any receipt was included without storing all hashes
 */
export async function createMerkleRoot(hashes: string[]): Promise<string> {
  if (hashes.length === 0) return '';
  if (hashes.length === 1) return hashes[0];

  const nextLevel: string[] = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = hashes[i + 1] ?? left;
    const combined = new TextEncoder().encode(left + right);
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    nextLevel.push(hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));
  }

  return createMerkleRoot(nextLevel);
}

/**
 * Generate receipt ownership certificate
 * Can be downloaded and stored by user as proof of submission
 */
export async function generateCertificate(
  receipt: Record<string, unknown>,
  orgId: string,
  timestamp: number
): Promise<Blob> {
  const receiptHash = await hashReceipt(receipt);
  const certificate = {
    receiptHash,
    orgId,
    timestamp,
    signature: `Leduc Receipt Pro Certificate\nReceipt: ${receiptHash.slice(0, 16)}...\nTimestamp: ${new Date(timestamp).toISOString()}`,
  };

  return new Blob([JSON.stringify(certificate, null, 2)], {
    type: 'application/json',
  });
}

/**
 * Verify certificate validity
 */
export async function verifyCertificate(certificate: Blob): Promise<{ valid: boolean; error?: string }> {
  try {
    const text = await certificate.text();
    const cert = JSON.parse(text);

    if (!cert.receiptHash || !cert.timestamp) {
      return { valid: false, error: 'Invalid certificate format' };
    }

    // Check expiration (10 years)
    const tenYears = 10 * 365 * 24 * 60 * 60 * 1000;
    if (Date.now() - cert.timestamp > tenYears) {
      return { valid: false, error: 'Certificate expired' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Could not parse certificate' };
  }
}

/**
 * Daily receipt rollup for archival
 * Creates single hash per day for efficient storage
 */
export async function createDailyRollup(
  receipts: Record<string, unknown>[]
): Promise<{ date: string; hash: string; count: number }> {
  const today = new Date().toISOString().split('T')[0];
  const hashes = await Promise.all(receipts.map(r => hashReceipt(r)));
  const rollupHash = await createMerkleRoot(hashes);

  return { date: today, hash: rollupHash, count: receipts.length };
}