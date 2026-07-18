'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Loader2, KeyRound, AlertCircle, CheckCircle2, ShieldOff } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MFAFactor {
  id: string;
  status: 'verified' | 'unverified';
  friendly_name?: string;
  factor_type: 'totp';
}

/**
 * Security settings page — manages multi-factor authentication (TOTP).
 * Supports enrollment with QR code display, verification, and unenrollment
 * with challenge verification. Handles loading, error, and success states.
 */
export default function SecuritySettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [unenrollTarget, setUnenrollTarget] = useState<string | null>(null);
  const [unenrollChallengeId, setUnenrollChallengeId] = useState<string | null>(null);
  const [unenrollCode, setUnenrollCode] = useState('');
  const [unenrolling, setUnenrolling] = useState(false);

  useEffect(() => {
    loadFactors();
  }, []);

  async function loadFactors() {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors((data.totp || []) as MFAFactor[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function startEnrollment() {
    setIsEnrolling(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setQrCode(data.totp.qr_code);
      setFactorId(data.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async function verifyEnrollment() {
    if (!verifyCode) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode,
      });
      if (verify.error) throw verify.error;

      setSuccess('MFA successfully enabled! You will now be prompted for a code when signing in.');
      setIsEnrolling(false);
      setQrCode('');
      setVerifyCode('');
      await loadFactors();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function startUnenrollChallenge(id: string) {
    setError('');
    setUnenrollCode('');
    setUnenrolling(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: id });
      if (challenge.error) throw challenge.error;
      setUnenrollChallengeId(challenge.data.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start verification challenge.');
      setUnenrolling(false);
    }
  }

  async function verifyAndUnenroll() {
    if (!unenrollTarget || !unenrollChallengeId || unenrollCode.length !== 6) return;
    setError('');
    setUnenrolling(true);
    try {
      const verify = await supabase.auth.mfa.verify({
        factorId: unenrollTarget,
        challengeId: unenrollChallengeId,
        code: unenrollCode,
      });
      if (verify.error) throw verify.error;

      const { error } = await supabase.auth.mfa.unenroll({ factorId: unenrollTarget });
      if (error) throw error;

      setSuccess('MFA factor removed.');
      await loadFactors();
      setUnenrollTarget(null);
      setUnenrollChallengeId(null);
      setUnenrollCode('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUnenrolling(false);
    }
  }

  function cancelUnenroll() {
    setUnenrollTarget(null);
    setUnenrollChallengeId(null);
    setUnenrollCode('');
    setUnenrolling(false);
  }

  return (
    <ErrorBoundary componentName="SecuritySettings">
    <>
      <div className="mb-6 animate-in fade-in slide-up-from-bottom-4 duration-700">
        <h1 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <ShieldOff className="h-5 w-5 text-champagne" /> Security Settings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">Manage Multi-Factor Authentication (MFA)</p>
      </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger border border-danger/20 animate-in fade-in slide-up-from-bottom-2 duration-500" role="alert">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-success/10 px-4 py-3 text-sm text-emerald-light border border-emerald-success/20 animate-in fade-in slide-up-from-bottom-2 duration-500" role="status" aria-live="polite">
              <CheckCircle2 className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          {loading && !isEnrolling ? (
            <div className="flex justify-center py-8 animate-in fade-in duration-500" role="status" aria-live="polite">
              <Loader2 className="h-8 w-8 animate-spin text-champagne" />
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-up-from-bottom-4 duration-700">
              
              <div className="rounded-2xl border border-glass-border bg-surface-raised p-6">
                <h2 className="text-lg font-semibold tracking-tight text-text-primary mb-4">Authenticator App (TOTP)</h2>
                
                {factors.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-emerald-light font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> MFA is currently enabled.
                    </p>
                    {factors.map(f => (
                      <div key={f.id} className="flex items-center justify-between rounded-[2rem] bg-surface-raised p-4 border border-glass-border">
                        <div className="flex items-center gap-3">
                          <KeyRound className="h-5 w-5 text-text-muted" />
                          <div>
                            <p className="text-sm font-medium text-text-primary">Device registered</p>
                            <p className="text-xs text-text-muted">ID: {f.id.split('-')[0]}...</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setUnenrollTarget(f.id)}
                          className="rounded-[2rem] bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/20 focus-visible:outline-2 focus-visible:outline-champagne focus-visible:outline-offset-2"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {!isEnrolling ? (
                      <div>
                        <p className="text-sm text-text-secondary mb-4">Add an additional layer of security to your account by requiring a code from an authenticator app (like Google Authenticator or 1Password).</p>
                        <button
                          onClick={startEnrollment}
                          className="rounded-[2rem] bg-champagne px-4 py-2 text-sm font-bold text-black transition hover:bg-champagne/90 focus-visible:outline-2 focus-visible:outline-champagne focus-visible:outline-offset-2"
                        >
                          Enable Authenticator
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <p className="text-sm text-text-secondary">Scan this QR code with your authenticator app.</p>
                        
                        <div className="flex justify-center rounded-[2rem] bg-card p-4 max-w-[200px] mx-auto border border-glass-border">
                          <Image src={qrCode} alt="Scan this QR code with your authenticator app" width={200} height={200} className="w-full h-auto" />
                        </div>

                        <div>
                          <label htmlFor="verify-totp-code" className="block text-xs font-semibold uppercase text-text-muted mb-2">Verification Code</label>
                          <input
                            id="verify-totp-code"
                            type="text"
                            inputMode="numeric"
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full rounded-[2rem] border border-glass-border bg-surface-hover px-4 py-3 text-center text-lg tracking-[0.5em] text-text-primary outline-none focus:border-champagne/40"
                            placeholder="000000"
                            maxLength={6}
                            autoComplete="one-time-code"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={verifyEnrollment}
                            disabled={loading || verifyCode.length !== 6}
                            className="flex-1 flex justify-center items-center gap-2 rounded-[2rem] bg-emerald-success px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-success/80 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-champagne focus-visible:outline-offset-2"
                          >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Verify and Enable
                          </button>
                          <button
                            onClick={() => { setIsEnrolling(false); setQrCode(''); }}
                            className="rounded-[2rem] border border-glass-border px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-raised transition focus-visible:outline-2 focus-visible:outline-champagne focus-visible:outline-offset-2"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}
      <AlertDialog open={!!unenrollTarget} onOpenChange={(open) => { if (!open) cancelUnenroll(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable MFA</AlertDialogTitle>
            <AlertDialogDescription>
              {!unenrollChallengeId
                ? 'Are you sure you want to disable Multi-Factor Authentication?'
                : 'Enter the 6-digit code from your authenticator app to confirm.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {!unenrollChallengeId ? (
            <AlertDialogFooter>
              <AlertDialogCancel
                render={<button className="rounded-[2rem] border border-glass-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised" />}
              />
              <AlertDialogAction
                disabled={unenrolling}
                render={<button className="rounded-[2rem] bg-danger px-4 py-2 text-sm font-bold text-white hover:bg-danger/80 disabled:opacity-50" />}
                onClick={() => unenrollTarget && startUnenrollChallenge(unenrollTarget)}
              >
                {unenrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : <ShieldOff className="h-4 w-4 mr-2 inline" />}
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          ) : (
            <div className="space-y-4 px-1">
              <label htmlFor="unenroll-totp-code" className="sr-only">Enter authenticator code to confirm disable</label>
              <input
                id="unenroll-totp-code"
                type="text"
                inputMode="numeric"
                value={unenrollCode}
                onChange={(e) => setUnenrollCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full rounded-[2rem] border border-glass-border bg-surface-hover px-4 py-3 text-center text-lg tracking-[0.5em] text-text-primary outline-none focus:border-champagne/40"
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
              />
              <AlertDialogFooter>
                <AlertDialogCancel
                  render={<button className="rounded-[2rem] border border-glass-border px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised" />}
                />
                <AlertDialogAction
                  disabled={unenrolling || unenrollCode.length !== 6}
                  render={<button className="rounded-[2rem] bg-danger px-4 py-2 text-sm font-bold text-white hover:bg-danger/80 disabled:opacity-50" />}
                  onClick={verifyAndUnenroll}
                >
                  {unenrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : <ShieldOff className="h-4 w-4 mr-2 inline" />}
                  Verify & Disable
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
    </ErrorBoundary>
  );
}
