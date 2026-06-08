'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePasswordStrength, passwordRequirements } from '@/hooks/usePasswordStrength';

export default function AuthCallback() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [error, setError] = useState('');
  const strength = usePasswordStrength(newPassword);

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        const hash = window.location.hash;
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type');

        if (type === 'recovery' || hash.includes('type=recovery')) {
          if (mounted) setIsReset(true);
        } else {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (mounted) router.replace('/');
          if (error && mounted) {
            console.error('[AuthCallback] Session exchange failed:', error.message);
            router.replace('/?error=auth');
          }
        }
      } catch (e) {
        console.error('[AuthCallback] Unexpected error:', e);
        if (mounted) router.replace('/?error=auth');
      }
    }

    handleCallback();
    return () => { mounted = false; };
  }, [router]);

  const allMet = passwordRequirements.every((r) => r.test(newPassword));

  const handlePasswordReset = async () => {
    if (!allMet) {
      setError('Password must meet all requirements below.');
      return;
    }
    if (newPassword.length > 128) {
      setError('Password is too long.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setError(error.message);
      } else {
        router.replace('/');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  if (!isReset) return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite" aria-label="Processing authentication">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian p-4">
      <div className="w-full max-w-md rounded-[3rem] border border-glass-border bg-surface p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Set New Password</h1>
        {error && <p className="text-danger text-sm mb-4" role="alert">{error}</p>}
        <div className="relative mb-4">
          <input
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-[2rem] border border-glass-border bg-surface-raised px-4 py-3 pr-12 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-champagne/40 focus:ring-2 focus:ring-champagne/15"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {newPassword && (
          <div className="space-y-2 pb-4">
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div className={cn('h-full rounded-full transition-all duration-300', strength.color)} style={{ width: strength.width }} />
            </div>
            <p className={cn('text-[11px] font-medium', strength.score <= 1 ? 'text-danger' : strength.score === 2 ? 'text-warning' : strength.score === 3 ? 'text-champagne-dim' : 'text-emerald-light')}>
              {strength.label}
            </p>
            <div className="grid grid-cols-2 gap-1">
              {passwordRequirements.map((req) => {
                const met = req.test(newPassword);
                return (
                  <div key={req.label} className="flex items-center gap-1.5">
                    {met ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-light shrink-0" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-white/20 shrink-0" />
                    )}
                    <span className={cn('text-[11px]', met ? 'text-text-secondary' : 'text-text-muted')}>
                      {req.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={handlePasswordReset}
          disabled={loading || !allMet}
          className="w-full rounded-[2rem] bg-champagne hover:bg-champagne-dim py-3 text-sm font-bold text-obsidian transition disabled:opacity-50"
        >
          {loading ? <span role="status" aria-live="polite">Updating...</span> : 'Update Password'}
        </button>
      </div>
    </div>
  );
}
