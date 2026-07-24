'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import LandingPage from '@/components/LandingPage';
import AuthScreen from '@/components/AuthScreen';
import { PremiumSpinner } from '@/components/ui/PremiumSpinner';

const AppShell = dynamic(() => import('@/components/AppShell'), {
  ssr: false,
  loading: () => <PremiumSpinner />,
});

function FullPageLoader() {
  return <PremiumSpinner />;
}

function AppContent() {
  const { user, role, orgId, authLoading, showAuth, setShowAuth, handleSignOut } = useAuth();

  if (authLoading) return <FullPageLoader />;
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
