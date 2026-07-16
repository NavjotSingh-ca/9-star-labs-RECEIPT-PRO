'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { Loader2, Save, AlertCircle, CheckCircle2, Link2, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OrgSettingsForm {
  business_name: string;
  business_number: string;
  address: string;
  province: string;
  gst_registrant: boolean;
  high_value_threshold: number;
  require_approval_above: number;
  slack_webhook_url: string;
}

const defaultSettings: OrgSettingsForm = {
  business_name: '',
  business_number: '',
  address: '',
  province: 'AB',
  gst_registrant: true,
  high_value_threshold: 500.0,
  require_approval_above: 500.0,
  slack_webhook_url: '',
};

interface OrgSettingsRow {
  business_name?: string;
  business_number?: string;
  address?: string;
  province?: string;
  gst_registrant?: boolean;
  high_value_threshold?: number;
  require_approval_above?: number;
  slack_webhook_url?: string;
  qbo_realm_id?: string;
  qbo_refresh_token?: string;
  qbo_connected_at?: string;
}

async function loadOrgSettings(): Promise<{ orgId: string; data: OrgSettingsRow | null }> {
  const orgId = await getOrgIdString();
  if (!orgId) throw new Error('No organization found.');

  const { data, error } = await supabase
    .from('organization_settings')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return { orgId, data: data as OrgSettingsRow | null };
}

/**
 * Organization settings form — manages business info, CRA business number,
 * reimbursement thresholds, approval policies, accounting integrations,
 * and webhook configuration. Handles loading, error, success, and QBO auth states.
 */
function OrgSettings() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<OrgSettingsForm>(defaultSettings);
  const [qboConnecting, setQboConnecting] = useState(false);

  const { data, isLoading: loading } = useQuery({
    queryKey: ['org_settings'],
    queryFn: loadOrgSettings,
    staleTime: 60_000,
    retry: 2,
  });

  const orgId = data?.orgId;
  const settingsRow = data?.data;
  const qboConnected = !!(settingsRow?.qbo_realm_id && settingsRow?.qbo_refresh_token);
  const qboConnectedAt = settingsRow?.qbo_connected_at ?? null;

  // Populate form from loaded data
  useEffect(() => {
    if (!settingsRow) return;
    setSettings({
      business_name: settingsRow.business_name || '',
      business_number: settingsRow.business_number || '',
      address: settingsRow.address || '',
      province: settingsRow.province || 'AB',
      gst_registrant: settingsRow.gst_registrant ?? true,
      high_value_threshold: settingsRow.high_value_threshold ?? 500.0,
      require_approval_above: settingsRow.require_approval_above ?? 500.0,
      slack_webhook_url: settingsRow.slack_webhook_url || '',
    });
  }, [settingsRow]);

  // Check for QBO callback params once loaded
  useEffect(() => {
    if (!loading && searchParams.get('qbo_success')) {
      setSuccess('QuickBooks Online connected successfully!');
      queryClient.invalidateQueries({ queryKey: ['org_settings'] });
    } else if (!loading && searchParams.get('qbo_error')) {
      setError(`QBO connection failed: ${searchParams.get('qbo_error')}`);
    }
  }, [loading, searchParams, queryClient]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization found.');
      const { error: saveError } = await supabase
        .from('organization_settings')
        .upsert({
          org_id: orgId,
          ...settings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'org_id' });
      if (saveError) throw saveError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org_settings'] });
      setSuccess('Organization settings saved successfully.');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: Error) => {
      const msg = process.env.NODE_ENV === 'development' ? err.message : 'Failed to save organization settings.';
      setError(msg);
    },
  });

  const handleQboConnect = async () => {
    if (qboConnected) return;
    setQboConnecting(true);
    setError('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Not authenticated');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/qbo/auth', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'QBO auth failed');

      window.location.href = body.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'QBO connection failed');
      setQboConnecting(false);
    }
  };

  const saving = saveMutation.isPending;

  return (
    <ErrorBoundary componentName="OrgSettings">
    <>
    <div className="mb-6">
      <h1 className="text-xl font-bold tracking-tight text-text-primary">Organization Settings</h1>
      <p className="mt-1 text-sm text-text-secondary">Manage global policies and configuration</p>
    </div>

        <Card className="w-full shadow-sm overflow-hidden bg-card border border-glass-border">
          <CardContent className="p-6">

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20" role="alert">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-success/10 px-4 py-3 text-sm text-emerald-light dark:text-emerald-light border border-emerald-success/20" role="status" aria-live="polite">
              <CheckCircle2 className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12" role="status" aria-live="polite" aria-label="Loading organization settings"><Loader2 className="h-8 w-8 animate-spin text-champagne" /></div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              
              {/* Business Info */}
              <div>
                <h3 className="text-lg font-bold tracking-tight mb-4">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="org-business-name" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Business Name</label>
                    <Input
                      id="org-business-name"
                      type="text"
                      value={settings.business_name}
                      onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                      className="rounded-xl bg-background"
                    />
                  </div>
                  <div>
                    <label htmlFor="org-business-number" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">CRA Business Number (GST/BN)</label>
                    <Input
                      id="org-business-number"
                      type="text"
                      value={settings.business_number}
                      onChange={(e) => setSettings({ ...settings, business_number: e.target.value })}
                      className="rounded-xl bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Thresholds & Policies */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-bold tracking-tight mb-4" id="thresholds-heading">Reimbursement & Approval Policies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="require-approval-above" className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Require Approval Above ($)</label>
                    <Input
                      id="require-approval-above"
                      type="number"
                      value={settings.require_approval_above}
                      onChange={(e) => setSettings({ ...settings, require_approval_above: parseFloat(e.target.value) || 0 })}
                      className="rounded-xl bg-background"
                      aria-describedby="approval-threshold-desc"
                    />
                    <p id="approval-threshold-desc" className="mt-1.5 text-xs text-text-muted">Receipts below this amount are auto-approved.</p>
                  </div>
                  <div>
                    <label htmlFor="high-value-threshold" className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">High Value Flag Threshold ($)</label>
                    <Input
                      id="high-value-threshold"
                      type="number"
                      value={settings.high_value_threshold}
                      onChange={(e) => setSettings({ ...settings, high_value_threshold: parseFloat(e.target.value) || 0 })}
                      className="rounded-xl bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Integrations */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-bold tracking-tight mb-4">Accounting Integrations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center justify-between rounded-xl border bg-surface-raised p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-xl bg-card p-1">
                        <Image src="https://upload.wikimedia.org/wikipedia/commons/2/23/QuickBooks_Logo.svg" alt="QuickBooks Online logo" width={40} height={40} className="h-full w-full object-contain" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-primary">QuickBooks Online</p>
                        <p className={`text-[10px] uppercase tracking-wider font-bold ${qboConnected ? 'text-emerald-success' : 'text-text-muted'}`}>
                          {qboConnected ? `Connected ${qboConnectedAt ? `• ${new Date(qboConnectedAt).toLocaleDateString('en-CA')}` : ''}` : 'Not Connected'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={qboConnected ? "outline" : "default"}
                      size="sm"
                      onClick={handleQboConnect}
                      disabled={qboConnecting}
                      className="rounded-lg font-bold"
                    >
                      {qboConnecting ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : qboConnected ? (
                        <>
                          <Link2 className="h-3.5 w-3.5 inline mr-1" />
                          Connected
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border bg-surface-raised p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-xl bg-[#00b7e2] p-1">
                        <Image src="https://upload.wikimedia.org/wikipedia/commons/9/9f/Xero_software_logo.svg" alt="Xero logo" width={40} height={40} className="h-full w-full object-contain" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-primary">Xero</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Not Connected</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="rounded-lg font-bold opacity-50 cursor-not-allowed"
                    >
                      Connect
                      <span className="ml-2 text-[10px] bg-warning/10 text-warning dark:text-warning px-2 py-0.5 rounded-md">Coming Soon</span>
                    </Button>
                  </div>
                </div>

                <h3 className="text-lg font-bold tracking-tight mb-4">Webhooks</h3>
                <div>
                  <label htmlFor="slack-webhook-url" className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">Slack/Teams Webhook URL (Audit Alerts)</label>
                  <Input
                    id="slack-webhook-url"
                    type="url"
                    value={settings.slack_webhook_url}
                    onChange={(e) => setSettings({ ...settings, slack_webhook_url: e.target.value })}
                    className="rounded-xl bg-background"
                    placeholder="https://hooks.slack.com/services/..."
                    aria-describedby="webhook-desc"
                  />
                  <p id="webhook-desc" className="mt-1.5 text-xs text-text-muted">Receive audit alerts via Slack or Microsoft Teams webhook.</p>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t flex justify-end">
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saving}
                  size="lg"
                  className="rounded-xl font-bold"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Configuration
                </Button>
              </div>

            </motion.div>
          )}
        </CardContent>
        </Card>
    </>
    </ErrorBoundary>
  );
}

/**
 * Org settings page entry — wraps the OrgSettings form in Suspense
 * for nuqs/useSearchParams hydration.
 */
export default function OrgSettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-champagne" /></div>}>
      <OrgSettings />
    </Suspense>
  );
}
