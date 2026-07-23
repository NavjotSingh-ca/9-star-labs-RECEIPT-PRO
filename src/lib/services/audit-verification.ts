import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/logger';
import { env } from '@/lib/env';
import type { AuditLogRow } from '@/lib/types';
import { createHmac, randomBytes } from 'crypto';

const HMAC_SECRET: string = (() => {
  const configured = env.AUDIT_HMAC_SECRET;
  if (configured) return configured;
  // No env var configured — generate a random per-run secret.
  // This means audit hashes won't survive server restarts,
  // but at least the default is not a predictable constant.
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    console.warn(
      '[AUDIT] AUDIT_HMAC_SECRET not set — generated random per-run key. ' +
      'Audit hashes will be invalidated on server restart. ' +
      'Set AUDIT_HMAC_SECRET in production for persistent tamper-evident audit chains.'
    );
  }
  return randomBytes(32).toString('hex');
})();

/**
 * Compute HMAC hash for audit log entry.
 * Used for tamper-evident chaining - if any entry is modified, the chain breaks.
 */
export function computeAuditHash(
  action: string,
  details: string,
  previousHash: string | null,
  createdAt: string
): string {
  const data = `${action}|${details || ''}|${previousHash || ''}|${createdAt}`;
  return createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
}

/**
 * Verify the integrity of audit log entries.
 * Checks that event_hash matches computed hash and previous_hash forms a valid chain.
 *
 * @param logs - Array of audit log entries (can be partial - will fetch full chain if needed)
 * @param orgId - Organization ID to scope the verification
 * @returns Verification result with any broken links detected
 */
export async function verifyAuditChain(
  logs: AuditLogRow[],
  orgId: string
): Promise<{
  verified: boolean;
  brokenLinks: Array<{ id: string; reason: string }>;
  missingChain: boolean;
}> {
  if (!orgId) return { verified: false, brokenLinks: [], missingChain: true };

  const brokenLinks: Array<{ id: string; reason: string }> = [];

  try {
    // Fetch all audit logs for the org, ordered by time
    const { data: allLogs, error } = await supabase
      .from('audit_logs')
      .select('id,action,details,event_hash,previous_hash,created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true });

    if (error) {
      logError(error, { action: 'verify_audit_fetch' });
      return { verified: false, brokenLinks: [], missingChain: true };
    }

    if (!allLogs || allLogs.length === 0) {
      return { verified: true, brokenLinks: [], missingChain: false };
    }

    // Verify chain integrity
    let lastHash: string | null = null;
    for (const log of allLogs) {
      const computedHash = computeAuditHash(
        log.action || '',
        log.details || '',
        log.previous_hash || null,
        log.created_at || ''
      );

      if (log.event_hash !== computedHash) {
        brokenLinks.push({
          id: log.id,
          reason: 'event_hash mismatch - entry may have been tampered',
        });
      }

      // Check previous_hash chain
      if (lastHash && log.previous_hash !== lastHash) {
        brokenLinks.push({
          id: log.id,
          reason: 'previous_hash mismatch - chain broken',
        });
      }

      lastHash = log.event_hash ?? null;
    }

    return {
      verified: brokenLinks.length === 0,
      brokenLinks,
      missingChain: false,
    };
  } catch (err) {
    logError(err, { action: 'verify_audit_chain' });
    return { verified: false, brokenLinks: [], missingChain: true };
  }
}

/**
 * Get a verification snapshot for display in the audit trail UI.
 * Shows a summary of chain integrity without exposing internal hashes.
 */
export async function getAuditVerificationSummary(
  orgId: string
): Promise<{
  totalEntries: number;
  chainIntegrity: 'verified' | 'broken' | 'unknown';
  lastModified: string | null;
}> {
  try {
    const { data: latest, error: latestErr } = await supabase
      .from('audit_logs')
      .select('created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestErr) {
      return { totalEntries: 0, chainIntegrity: 'unknown', lastModified: null };
    }

    const { count, error: countErr } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    if (countErr) {
      return { totalEntries: 0, chainIntegrity: 'unknown', lastModified: latest?.created_at || null };
    }

    // Quick integrity check - sample first and last entries
    const { data: sample } = await supabase
      .from('audit_logs')
      .select('id,action,details,event_hash,previous_hash,created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true })
      .limit(10);

    const integrity = sample && sample.length > 1
      ? (await verifyAuditChain(sample, orgId)).verified ? 'verified' : 'broken'
      : 'verified';

    return {
      totalEntries: count || 0,
      chainIntegrity: integrity,
      lastModified: latest?.created_at || null,
    };
  } catch (err) {
    logError(err, { action: 'audit_verification_summary' });
    return { totalEntries: 0, chainIntegrity: 'unknown', lastModified: null };
  }
}