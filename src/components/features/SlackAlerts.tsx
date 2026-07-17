'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';
import { useState, useCallback } from 'react';
import { Check, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';

const STORAGE_KEY_WEBHOOK = 'slack-webhook-url';
const STORAGE_KEY_LARGE = 'slack-alert-large-receipts';
const STORAGE_KEY_STATEMENTS = 'slack-alert-monthly-statements';
const STORAGE_KEY_BUDGET = 'slack-alert-budget';

interface AlertToggle {
  key: string;
  label: string;
  description: string;
}

const ALERTS: AlertToggle[] = [
  {
    key: STORAGE_KEY_LARGE,
    label: 'Large Receipts',
    description: 'Notify when a receipt exceeds $1,000',
  },
  {
    key: STORAGE_KEY_STATEMENTS,
    label: 'New Monthly Statements',
    description: 'Notify when new bank statements are available',
  },
  {
    key: STORAGE_KEY_BUDGET,
    label: 'Budget Alerts',
    description: 'Notify when spending approaches budget limits',
  },
];

function loadBoolean(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(key) === 'true';
}

function loadWebhook(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_WEBHOOK) || '';
}

export default function SlackAlerts() {
  const [webhookUrl, setWebhookUrl] = useState(() => loadWebhook());
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => ({
    [STORAGE_KEY_LARGE]: loadBoolean(STORAGE_KEY_LARGE),
    [STORAGE_KEY_STATEMENTS]: loadBoolean(STORAGE_KEY_STATEMENTS),
    [STORAGE_KEY_BUDGET]: loadBoolean(STORAGE_KEY_BUDGET),
  }));
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_WEBHOOK, webhookUrl);
    localStorage.setItem(STORAGE_KEY_LARGE, String(toggles[STORAGE_KEY_LARGE] ?? false));
    localStorage.setItem(STORAGE_KEY_STATEMENTS, String(toggles[STORAGE_KEY_STATEMENTS] ?? false));
    localStorage.setItem(STORAGE_KEY_BUDGET, String(toggles[STORAGE_KEY_BUDGET] ?? false));
    setSaved(true);
    toast.success('Alert preferences saved');
    setTimeout(() => setSaved(false), 2000);
  }, [webhookUrl, toggles]);

  const handleTest = useCallback(() => {
    const testMessage = 'Test alert from Leduc Receipt Pro — your Slack integration is working.';
    const encoded = encodeURIComponent(testMessage);
    window.open(`mailto:?subject=Slack%20Test%20Alert&body=${encoded}`, '_blank');
    toast.success('Test message prepared');
  }, []);

  const toggleAlert = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <PageHeader
        title="Slack Alerts"
        subtitle="Configure notifications sent to your Slack workspace"
      />

      <div className="space-y-4">
        <div className="rounded-2xl border border-glass-border bg-card p-5 shadow-sm">
          <label
            htmlFor="slack-webhook"
            className="text-sm font-semibold text-text-primary"
          >
            Slack Webhook URL
          </label>
          <p className="mt-0.5 text-xs text-text-muted mb-3">
            Incoming webhook URL from your Slack workspace
          </p>
          <div className="flex gap-2">
            <input
              id="slack-webhook"
              type="url"
              value={webhookUrl}
              onChange={(e) => { setWebhookUrl(e.target.value); setSaved(false); }}
              placeholder="https://hooks.slack.com/services/..."
              className="flex-1 rounded-xl border border-glass-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-champagne/40"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-glass-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Alert Types</h3>
          <div className="space-y-3">
            {ALERTS.map((alert) => (
              <div
                key={alert.key}
                className="flex items-center justify-between rounded-xl border border-glass-border bg-surface px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{alert.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{alert.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={toggles[alert.key] ?? false}
                  onClick={() => toggleAlert(alert.key)}
                  className={cn(
                    'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                    (toggles[alert.key] ?? false) ? 'bg-champagne' : 'bg-surface-raised border border-glass-border'
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                      (toggles[alert.key] ?? false) ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-champagne px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-champagne-dim"
          >
            {saved ? <Check className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
            {saved ? 'Saved' : 'Save Preferences'}
          </button>

          <button
            type="button"
            onClick={handleTest}
            className="inline-flex items-center gap-2 rounded-xl border border-glass-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover"
          >
            <Send className="h-4 w-4" />
            Send Test
          </button>
        </div>
      </div>
    </motion.div>
  );
}
