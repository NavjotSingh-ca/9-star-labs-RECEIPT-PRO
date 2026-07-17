/**
 * Features Settings — Page to toggle individual features on/off AND control
 * which roles can access each feature. Owner-only for role management.
 * For my (Owner) account: all features always visible for testing.
 */
'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Save } from 'lucide-react';
import { useFeatures, useToggleFeature, useSetFeatureRoles } from '@/lib/features/hooks';
import { CORE_FEATURE_KEYS, getFeaturesByCategory } from '@/lib/features/registry';
import type { FeatureKey } from '@/lib/features/registry';
import { getDefaultRolesForKey, ALL_ROLES } from '@/lib/services/features';
import type { UserRole } from '@/lib/types';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useQuery } from '@tanstack/react-query';

const CATEGORY_LABELS: Record<string, string> = {
  tracking: 'Tracking',
  finance: 'Finance',
  oversight: 'Oversight',
  productivity: 'Productivity',
  integrations: 'Integrations',
  insights: 'Insights',
};

/** Color-coded role badges using theme-aware tokens */
const ROLE_COLORS: Record<string, string> = {
  Owner: 'bg-champagne/20 text-champagne border-champagne/30',
  Admin: 'bg-info/20 text-info border-info/30',
  Employee: 'bg-success/20 text-success border-success/30',
  Accountant: 'bg-warning/20 text-warning border-warning/30',
  Auditor: 'bg-text-muted/20 text-text-muted border-text-muted/30',
};

function FeaturesSettingsContent() {
  const { features, isLoading } = useFeatures();
  const categories = getFeaturesByCategory();

  const { data: orgId } = useQuery({
    queryKey: ['currentOrgId'],
    queryFn: async () => {
      const res = await fetch('/api/features/org');
      if (!res.ok) throw new Error('Failed to get org');
      const data = await res.json();
      return data.orgId as string;
    },
  });

  // Fetch raw features data including allowed_roles
  const { data: rawFeatures } = useQuery({
    queryKey: ['rawOrgFeatures', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await fetch(`/api/features/raw?orgId=${orgId}`);
      if (!res.ok) throw new Error('Failed to fetch raw features');
      const data = await res.json();
      return data.features as Array<{ feature_key: string; enabled: boolean; allowed_roles: string[] }>;
    },
    enabled: !!orgId,
  });

  const toggleMutation = useToggleFeature(orgId ?? '');
  const rolesMutation = useSetFeatureRoles(orgId ?? '');
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());

  // Track role changes locally before saving
  const [roleEdits, setRoleEdits] = useState<Record<string, UserRole[]>>({});

  const rawMap = useMemo(() => {
    if (!rawFeatures) return {};
    const map: Record<string, { enabled: boolean; allowed_roles: string[] }> = {};
    for (const f of rawFeatures) {
      map[f.feature_key] = { enabled: f.enabled, allowed_roles: f.allowed_roles };
    }
    return map;
  }, [rawFeatures]);

  function getCurrentRoles(featureKey: FeatureKey): UserRole[] {
    if (roleEdits[featureKey]) return roleEdits[featureKey];
    if (rawMap[featureKey]) return rawMap[featureKey].allowed_roles as UserRole[];
    return getDefaultRolesForKey(featureKey);
  }

  function toggleRole(featureKey: FeatureKey, role: UserRole) {
    setRoleEdits((prev) => {
      const current = getCurrentRoles(featureKey);
      const next = current.includes(role)
        ? current.filter((r) => r !== role)
        : [...current, role];
      return { ...prev, [featureKey]: next };
    });
  }

  async function saveRoles(featureKey: FeatureKey) {
    const updatedRoles = roleEdits[featureKey];
    if (!updatedRoles || !orgId) return;
    await rolesMutation.mutateAsync({ featureKey: featureKey as FeatureKey, allowedRoles: updatedRoles });
    setRoleEdits((prev) => {
      const next = { ...prev };
      delete next[featureKey];
      return next;
    });
  }

  async function handleToggle(featureKey: FeatureKey, currentEnabled: boolean) {
    if (!orgId) return;
    setPendingToggles((prev) => new Set(prev).add(featureKey));
    try {
      await toggleMutation.mutateAsync({ featureKey, enabled: !currentEnabled });
    } catch {
      // Handled by mutation
    } finally {
      setPendingToggles((prev) => {
        const next = new Set(prev);
        next.delete(featureKey);
        return next;
      });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-glass-border bg-surface p-6">
            <div className="mb-4 skeleton skeleton-lg" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="skeleton skeleton-card" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div className="rounded-2xl border border-glass-border bg-card p-6">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Feature Configuration</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Enable or disable features and control which roles can access each one.
          Core features (marked with *) are always on. Owner always has full access regardless of settings.
        </p>
      </div>

      {/* Category groups */}
      {Object.entries(categories).map(([category, categoryFeatures]) => {
        if (category === 'core') return null;
        const enabledCount = categoryFeatures.filter((f) => features[f.key]).length;

        return (
          <div key={category} className="rounded-2xl border border-glass-border bg-card overflow-hidden">
            <div className="border-b border-glass-border px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                  {CATEGORY_LABELS[category] ?? category}
                </h3>
                <span className="text-xs font-medium text-text-muted">
                  {enabledCount}/{categoryFeatures.length} enabled
                </span>
              </div>
            </div>
            <div className="divide-y divide-glass-border">
              {categoryFeatures.map((feature) => {
                const isCore = CORE_FEATURE_KEYS.includes(feature.key);
                const isEnabled = features[feature.key] ?? true;
                const isPending = pendingToggles.has(feature.key);
                const currentRoles = getCurrentRoles(feature.key);
                const hasRoleEdit = feature.key in roleEdits;

                return (
                  <div key={feature.key} className="px-6 py-4 space-y-3">
                    {/* Row 1: toggle + info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          isEnabled ? 'bg-champagne/20 text-champagne' : 'bg-surface-hover text-text-muted'
                        }`}>
                          <feature.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {feature.label}
                            {isCore && (
                              <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-champagne">
                                Always on
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-text-muted truncate">{feature.description}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isEnabled}
                        disabled={isCore || isPending || !orgId}
                        onClick={() => handleToggle(feature.key, isEnabled)}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-champagne ${
                          isEnabled ? 'bg-champagne' : 'bg-glass-border'
                        } ${(isCore || isPending || !orgId) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        aria-label={`Toggle ${feature.label}`}
                      >
                        <motion.span
                          animate={{ x: isEnabled ? 20 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
                        />
                      </button>
                    </div>

                    {/* Row 2: role permissions */}
                    <div className="flex items-center gap-2 pl-11">
                      <Shield className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_ROLES.filter((r) => r !== 'Owner').map((role) => {
                          const isSelected = currentRoles.includes(role);
                          return (
                            <button
                              key={role}
                              type="button"
                              onClick={() => toggleRole(feature.key, role)}
                              disabled={isCore}
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition ${
                                isSelected
                                  ? (ROLE_COLORS[role] ?? 'bg-champagne/20 text-champagne border-champagne/30')
                                  : 'border-glass-border text-text-muted hover:border-text-muted'
                              } ${isCore ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                              aria-label={`${role}: ${isSelected ? 'allowed' : 'not allowed'}`}
                              title={isSelected ? `Remove ${role}` : `Allow ${role}`}
                            >
                              {role}
                            </button>
                          );
                        })}
                        {/* Owner badge — always shown */}
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-champagne/30 bg-champagne/20 text-champagne opacity-70">
                          Owner
                        </span>
                      </div>
                      {hasRoleEdit && (
                        <button
                          type="button"
                          onClick={() => saveRoles(feature.key)}
                          disabled={rolesMutation.isPending}
                          className="flex items-center gap-1 text-[10px] font-semibold text-champagne hover:underline shrink-0"
                        >
                          <Save className="h-3 w-3" />
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Features</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Choose which features are available and who can access them
        </p>
      </div>
      <ErrorBoundary componentName="FeaturesSettings">
        <FeaturesSettingsContent />
      </ErrorBoundary>
    </div>
  );
}
