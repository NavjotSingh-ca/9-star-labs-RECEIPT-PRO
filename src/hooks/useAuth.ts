'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/logger';
import { getUserRole } from '@/lib/services/roles';
import { bootstrapOrgAction } from '@/app/actions/bootstrap-org';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import type { UserRole } from '@/lib/types';

export interface AuthState {
  user: User | null;
  role: UserRole;
  orgId: string | null;
  authLoading: boolean;
}

export interface AuthActions {
  handleSignOut: () => Promise<void>;
  setShowAuth: (show: boolean) => void;
}

export function useAuth(): AuthState & AuthActions & { showAuth: boolean } {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('Owner');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    let active = true;
    let authResolved = false;

    function resolveAuth() {
      if (authResolved) return;
      authResolved = true;
      setAuthLoading(false);
    }

    async function resolveUser(currentUser: User) {
      setUser(currentUser);
      try {
        const [roleResult, { data: orgIdResult }] = await Promise.all([
          getUserRole(currentUser.id),
          supabase.rpc('get_user_org'),
        ]);

        if (!active) return;
        let finalRole = roleResult;

        if (!orgIdResult) {
          const result = await bootstrapOrgAction(currentUser.id);
          if (!result.ok) {
            logError(result.error, { action: 'bootstrap_org_failed' });
            toast.error('Organization setup failed. Some features may be limited.');
          } else {
            finalRole = await getUserRole(currentUser.id);
          }
        }

        if (active) {
          setRole(finalRole);
          if (orgIdResult) {
            setOrgId(orgIdResult);
          } else {
            const { data: newOrgId } = await supabase.rpc('get_user_org');
            if (newOrgId) setOrgId(newOrgId);
          }
          resolveAuth();
        }
      } catch (err) {
        if (active) {
          logError(err, { action: 'auth_resolution_failed' });
          toast.error('Unable to verify your role. Some features may be limited.');
          setRole('Employee');
          resolveAuth();
        }
      }
    }

    // Wrap in try-catch for Proxy throws
    try {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!active) return;
        if (user) resolveUser(user);
        else resolveAuth();
      }).catch(() => { if (active) resolveAuth(); });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        if (session?.user) resolveUser(session.user);
        else {
          setUser(null);
          resolveAuth();
        }
      });

      const safetyTimeout = setTimeout(() => resolveAuth(), 5000);

      return () => {
        active = false;
        subscription?.unsubscribe();
        clearTimeout(safetyTimeout);
      };
    } catch (err) {
      if (active) {
        logError(err, { action: 'auth_effect_failed' });
        resolveAuth();
      }
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    user, role, orgId, authLoading,
    showAuth, setShowAuth,
    handleSignOut,
  };
}
