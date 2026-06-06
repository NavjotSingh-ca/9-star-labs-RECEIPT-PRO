'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [error, setError] = useState('');

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
          // Exchange the auth code for a session if present
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

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
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
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (min 8 characters)"
          className="w-full rounded-[2rem] border border-glass-border bg-surface-raised px-4 py-3 text-sm text-text-primary placeholder:text-text-muted mb-4 outline-none focus:border-champagne/40 focus:ring-2 focus:ring-champagne/15"
        />
        <button
          onClick={handlePasswordReset}
          disabled={loading}
          className="w-full rounded-[2rem] bg-champagne hover:bg-champagne-dim py-3 text-sm font-bold text-obsidian transition disabled:opacity-50"
        >
          {loading ? <span role="status" aria-live="polite">Updating...</span> : 'Update Password'}
        </button>
      </div>
    </div>
  );
}
