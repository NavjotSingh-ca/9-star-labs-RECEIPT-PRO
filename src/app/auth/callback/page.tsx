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
    // Check if this is a password reset
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');

    if (type === 'recovery' || hash.includes('type=recovery')) {
      setIsReset(true);
    } else {
      // Regular auth callback — redirect to home
      router.replace('/');
    }
  }, [router]);

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setError(error.message);
    } else {
      router.replace('/');
    }
    setLoading(false);
  };

  if (!isReset) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Set New Password</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (min 6 characters)"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm mb-4 outline-none focus:border-blue-500"
        />
        <button
          onClick={handlePasswordReset}
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}
