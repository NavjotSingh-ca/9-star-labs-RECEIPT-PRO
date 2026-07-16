'use client';

import React, { useState } from 'react';
import { Share2, Copy, Shield } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import type { ReceiptRow } from '@/lib/types';
import { supabase, getOrgIdString } from '@/lib/supabase';

interface ReceiptSharingPanelProps {
  receipt: ReceiptRow;
}

/**
 * ReceiptSharingPanel - Secure receipt sharing with time-limited links
 * Zero-cost collaboration features for teams
 */
export default function ReceiptSharingPanel({ receipt }: ReceiptSharingPanelProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState(7); // days

  const shareMutation = useMutation({
    mutationFn: async () => {
      const orgId = await getOrgIdString();
      if (!orgId) throw new Error('No organization');

      const expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase.rpc('create_receipt_share_link', {
        p_receipt_id: receipt.id,
        p_org_id: orgId,
        p_expires_at: expiresAt,
      });

      if (error) throw error;
      return (data as { url?: string }).url;
    },
    onSuccess: url => setShareUrl(url ?? null),
  });

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <div className="space-y-4" role="region" aria-label="Share receipt">
      {/* Expiration Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-text-primary" htmlFor="expires-in">
          Link expires in:
        </label>
        <select
          id="expires-in"
          value={expiresIn}
          onChange={e => setExpiresIn(Number(e.target.value))}
          className="rounded-lg border border-glass-border bg-surface px-2 py-1 text-sm"
        >
          <option value={1}>1 day</option>
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
        </select>
      </div>

      {/* Generate Button */}
      <button
        type="button"
        onClick={() => shareMutation.mutate()}
        disabled={shareMutation.isPending}
        className="inline-flex items-center gap-2 rounded-xl bg-champagne px-4 py-2 text-sm font-bold text-obsidian transition hover:bg-champagne-dim disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-champagne/40"
        aria-label="Generate shareable link"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Generate Secure Link
      </button>

      {/* Generated Link */}
      {shareUrl && (
        <div className="rounded-xl border border-glass-border bg-surface p-4">
          <p className="text-xs text-text-muted mb-2">Share this link:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 rounded-lg border border-glass-border bg-card px-3 py-2 text-sm"
              aria-label="Shareable link"
            />
            <button
              type="button"
              onClick={copyToClipboard}
              className="rounded-lg border border-glass-border bg-surface p-2 transition hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-champagne/40"
              aria-label="Copy link to clipboard"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Security Info */}
          <div className="mt-3 flex items-start gap-2 text-xs text-text-muted">
            <Shield className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              Link is view-only, expires {expiresIn} days, and tracks all access in audit logs
            </p>
          </div>
        </div>
      )}
    </div>
  );
}