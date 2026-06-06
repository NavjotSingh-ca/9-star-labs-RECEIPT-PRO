'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Save, AlertCircle, CheckCircle2, Link2, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function OrgSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [settings, setSettings] = useState({
    business_name: '',
    business_number: '',
    address: '',
    province: 'AB',
    gst_registrant: true,
    high_value_threshold: 500.0,
    require_approval_above: 500.0,
    slack_webhook_url: '',
  });

  const [qboConnected, setQboConnected] = useState(false);
  const [qboConnectedAt, setQboConnectedAt] = useState<string | null>(null);
  const [qboConnecting, setQboConnecting] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data: orgData } = await supabase.rpc('get_user_org');
      const orgId = orgData as unknown as string;
      if (!orgId) {
        setError('No organization found.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('org_id', orgId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
      
      if (data) {
        setSettings({
          business_name: data.business_name || '',
          business_number: data.business_number || '',
          address: data.address || '',
          province: data.province || 'AB',
          gst_registrant: data.gst_registrant ?? true,
          high_value_threshold: data.high_value_threshold ?? 500.0,
          require_approval_above: data.require_approval_above ?? 500.0,
          slack_webhook_url: data.slack_webhook_url || '',
        });
        setQboConnected(!!data.qbo_realm_id && !!data.qbo_refresh_token);
        setQboConnectedAt(data.qbo_connected_at);
      }

      // Check for QBO callback params
      if (searchParams.get('qbo_success')) {
        setSuccess('QuickBooks Online connected successfully!');
      } else if (searchParams.get('qbo_error')) {
        setError(`QBO connection failed: ${searchParams.get('qbo_error')}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleQboConnect() {
    if (qboConnected) return; // Already connected
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
  }

  async function saveSettings() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data: orgData } = await supabase.rpc('get_user_org');
      const orgId = orgData as unknown as string;

      const { error } = await supabase
        .from('organization_settings')
        .upsert({
          org_id: orgId,
          ...settings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'org_id' });

      if (error) throw error;
      setSuccess('Organization settings saved successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  return (
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
            <div className="space-y-8">
              
              {/* Business Info */}
              <div>
                <h3 className="text-lg font-bold mb-4">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Business Name</label>
                    <Input
                      type="text"
                      value={settings.business_name}
                      onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                      className="rounded-xl bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">CRA Business Number (GST/BN)</label>
                    <Input
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
                <h3 className="text-lg font-bold mb-4">Reimbursement & Approval Policies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Require Approval Above ($)</label>
                    <Input
                      type="number"
                      value={settings.require_approval_above}
                      onChange={(e) => setSettings({ ...settings, require_approval_above: parseFloat(e.target.value) || 0 })}
                      className="rounded-xl bg-background"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">Receipts below this amount are auto-approved.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">High Value Flag Threshold ($)</label>
                    <Input
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
                <h3 className="text-lg font-bold mb-4">Accounting Integrations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-xl bg-white p-1">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/23/QuickBooks_Logo.svg" alt="QBO" className="h-full w-full object-contain" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">QuickBooks Online</p>
                        <p className={`text-[10px] uppercase tracking-wider font-bold ${qboConnected ? 'text-emerald-success' : 'text-muted-foreground'}`}>
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

                  <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-xl bg-[#00b7e2] p-1">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/9/9f/Xero_software_logo.svg" alt="Xero" className="h-full w-full object-contain" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Xero</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Not Connected</p>
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

                <h3 className="text-lg font-bold mb-4">Webhooks</h3>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Slack/Teams Webhook URL (Audit Alerts)</label>
                  <Input
                    type="url"
                    value={settings.slack_webhook_url}
                    onChange={(e) => setSettings({ ...settings, slack_webhook_url: e.target.value })}
                    className="rounded-xl bg-background"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t flex justify-end">
                <Button
                  onClick={saveSettings}
                  disabled={saving}
                  size="lg"
                  className="rounded-xl font-bold"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Configuration
                </Button>
              </div>

            </div>
          )}
        </CardContent>
        </Card>
    </>
  );
}

export default function OrgSettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-champagne" /></div>}>
      <OrgSettings />
    </Suspense>
  );
}
