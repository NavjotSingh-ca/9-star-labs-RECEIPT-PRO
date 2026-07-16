'use client';

import { Suspense } from 'react';
import { Loader2, ReceiptText } from 'lucide-react';
import dynamic from 'next/dynamic';
import { APP_NAME } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import LandingPage from '@/components/LandingPage';
import AuthScreen from '@/components/AuthScreen';

const AppShell = dynamic(() => import('@/components/AppShell'), {
  ssr: false,
  loading: () => <FullPageLoader />,
});

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian" role="status" aria-live="polite" aria-label="Loading application">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-champagne/15 accent-glow">
          <ReceiptText className="h-8 w-8 text-champagne" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-champagne" />
        <p className="text-sm font-medium text-text-secondary">Loading {APP_NAME}…</p>
        <div className="mt-8 animate-in fade-in duration-1000" style={{ animationDelay: '5s' }}>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-text-muted hover:text-champagne underline underline-offset-4"
          >
            Taking too long? Click to retry
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, role, orgId, authLoading, hasMounted, showAuth, setShowAuth, handleSignOut } = useAuth();

  if (authLoading || !hasMounted) return <FullPageLoader />;
  if (!user) {
    if (showAuth) return <AuthScreen onBackToLanding={() => setShowAuth(false)} />;
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  return (
    <AppShell
      user={user}
      role={role}
      orgId={orgId}
      handleSignOut={handleSignOut}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <AppContent />
    </Suspense>
  );
}
