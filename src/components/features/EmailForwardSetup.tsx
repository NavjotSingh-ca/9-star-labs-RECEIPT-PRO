'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase, getOrgIdString } from '@/lib/supabase';
import PageHeader from '@/components/layout/PageHeader';
import { Loader2, AlertCircle, Copy, Check, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function EmailForwardSetup() {
  const [copied, setCopied] = useState(false);

  const { data: orgId, isLoading, error } = useQuery({
    queryKey: ['org-id'],
    queryFn: () => getOrgIdString(),
  });

  const slug = orgId ? orgId.replace(/-/g, '').slice(0, 8) : '••••••••';
  const emailAddress = `receipts-${slug}@receipts.yourapp.com`;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(emailAddress);
      setCopied(true);
      toast.success('Email address copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Email Receipt Forwarding"
        subtitle="Automatically import receipts by forwarding them to your unique email address"
      />

      {isLoading && (
        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-champagne" /></div>
      )}
      {error && (
        <div className="rounded-[2rem] bg-danger/10 p-4 text-sm text-danger border border-danger/20"><AlertCircle className="inline h-4 w-4 mr-2" />{error.message}</div>
      )}

      {!isLoading && !error && orgId && (
        <>
          {/* Your Email Address */}
          <div className="rounded-2xl border border-glass-border bg-surface p-5">
            <h3 className="text-sm font-bold text-text-primary mb-3">Your Unique Email Address</h3>
            <div className="flex items-center gap-2 bg-surface-raised rounded-xl px-4 py-3 border border-glass-border">
              <Mail className="h-5 w-5 text-champagne flex-shrink-0" />
              <code className="flex-1 text-sm font-mono text-text-primary">{emailAddress}</code>
              <button
                type="button"
                onClick={copyEmail}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-obsidian hover:bg-accent-dim transition"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Setup Steps */}
          <div className="rounded-2xl border border-glass-border bg-surface p-5">
            <h3 className="text-sm font-bold text-text-primary mb-4">Setup Instructions</h3>
            <div className="space-y-4">
              {[
                { num: 1, title: 'Open your email settings', desc: 'Go to your email provider (Gmail, Outlook, etc.) and open Settings → Forwarding.' },
                { num: 2, title: 'Create a forwarding rule', desc: 'Add a rule that forwards receipts or invoices to the email address above.' },
                { num: 3, title: 'Send a receipt to test', desc: 'Forward an actual receipt email to verify everything works. It will appear in your receipts within minutes.' },
              ].map((step) => (
                <div key={step.num} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                    {step.num}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{step.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Button */}
          <div className="rounded-2xl border border-glass-border bg-surface p-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Test Your Setup</h3>
              <p className="text-xs text-text-muted mt-0.5">Forward a receipt to your unique address to confirm it works</p>
            </div>
            <button
              type="button"
              onClick={() => toast.success('Forward a receipt email to test your setup. Check back in a few minutes.')}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-obsidian hover:bg-accent-dim transition"
            >
              Test Setup
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {!isLoading && !error && !orgId && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center">
          <Mail className="h-10 w-10 text-text-muted/40" />
          <p className="text-sm text-text-muted">Unable to load your organization details.</p>
        </div>
      )}
    </div>
  );
}
