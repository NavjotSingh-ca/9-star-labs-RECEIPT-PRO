/**
 * FeatureWizard — Onboarding flow for new users to choose which features they want.
 * Shows feature categories with toggle switches. "I want everything" defaults all on.
 * For existing users (like me), all features are enabled by default and this is skippable.
 */
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Sparkles, Route, Landmark, BarChart3, Repeat, Lightbulb, ListChecks } from 'lucide-react';
import type { FeatureKey } from '@/lib/features/registry';
import { FEATURES, CORE_FEATURE_KEYS, getFeaturesByCategory } from '@/lib/features/registry';
import type { FeaturesMap } from '@/lib/services/features';
import { useBulkSetFeatures } from '@/lib/features/hooks';

interface FeatureWizardProps {
  orgId: string;
  onComplete: () => void;
  onSkip: () => void;
}

/** Category display metadata */
const CATEGORY_META: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
  core: { label: 'Core', description: 'Essential features always enabled', icon: <Sparkles className="h-4 w-4" /> },
  tracking: { label: 'Tracking', description: 'Track mileage and hours', icon: <Route className="h-4 w-4" /> },
  finance: { label: 'Finance', description: 'Banking, budgets, tax tools', icon: <Landmark className="h-4 w-4" /> },
  oversight: { label: 'Oversight', description: 'Approvals, audits, reports', icon: <BarChart3 className="h-4 w-4" /> },
  productivity: { label: 'Productivity', description: 'Search, tags, calendar, kanban', icon: <ListChecks className="h-4 w-4" /> },
  integrations: { label: 'Integrations', description: 'QBO, Xero, email forwarding', icon: <Repeat className="h-4 w-4" /> },
  insights: { label: 'Insights', description: 'Spending analysis & readiness', icon: <Lightbulb className="h-4 w-4" /> },
};

export default function FeatureWizard({ orgId, onComplete, onSkip }: FeatureWizardProps) {
  const [selected, setSelected] = useState<Set<FeatureKey>>(() => {
    // Default: all features enabled (existing user behavior)
    const all = new Set<FeatureKey>(FEATURES.map((f) => f.key));
    return all;
  });
  const [currentStep, setCurrentStep] = useState(0);
  const bulkMutation = useBulkSetFeatures(orgId);

  const categories = useMemo(() => {
    const byCategory = getFeaturesByCategory();
    return Object.entries(byCategory).map(([cat, features]) => ({
      category: cat,
      ...CATEGORY_META[cat] ?? { label: cat, description: '', icon: null },
      features,
      enabledCount: features.filter((f) => selected.has(f.key)).length,
    }));
  }, [selected]);

  const nonCoreFeatures = useMemo(
    () => FEATURES.filter((f) => !CORE_FEATURE_KEYS.includes(f.key)),
    [],
  );

  const allNonCoreSelected = nonCoreFeatures.every((f) => selected.has(f.key));
  const totalSteps = categories.length;
  const currentCategory = categories[currentStep];

  function toggleFeature(key: FeatureKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(FEATURES.map((f) => f.key)));
  }

  function deselectAll() {
    setSelected(new Set(CORE_FEATURE_KEYS));
  }

  async function handleFinish() {
    // Build the updates map
    const updates: Partial<FeaturesMap> = {};
    for (const feature of FEATURES) {
      updates[feature.key] = selected.has(feature.key);
    }
    try {
      await bulkMutation.mutateAsync(updates);
      onComplete();
    } catch {
      // If mutation fails, still continue — features default to all-enabled anyway
      onComplete();
    }
  }

  const steps = categories.map((c) => c.label);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-obsidian/80 backdrop-blur-sm"
      role="dialog"
      aria-label="Feature setup wizard"
      aria-modal="true"
    >
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-glass-border bg-card shadow-2xl">
        {/* Header */}
        <div className="border-b border-glass-border px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Welcome! Configure Your Workspace</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Choose the features you need. You can always change these later in Settings.
              </p>
            </div>
            <button
              onClick={onSkip}
              className="text-xs font-medium text-text-muted hover:text-foreground underline underline-offset-2 transition"
              type="button"
            >
              Skip — use everything
            </button>
          </div>

          {/* Step progress */}
          <div className="mt-4 flex gap-1.5">
            {steps.map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    i <= currentStep ? 'bg-champagne' : 'bg-glass-border'
                  }`}
                />
                <p className={`mt-1 text-[10px] font-medium ${i === currentStep ? 'text-champagne' : 'text-text-muted'}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCategory?.category}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
            >
              <div className="mb-3 flex items-center gap-2">
                {currentCategory?.icon}
                <h3 className="text-sm font-semibold text-foreground">{currentCategory?.label}</h3>
                <p className="text-xs text-text-muted">{currentCategory?.description}</p>
              </div>

              <div className="space-y-2">
                {currentCategory?.features.map((feature) => {
                  const Icon = feature.icon;
                  const isCore = CORE_FEATURE_KEYS.includes(feature.key);
                  const isOn = selected.has(feature.key);

                  return (
                    <div
                      key={feature.key}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                        isOn
                          ? 'border-champagne/30 bg-champagne/5'
                          : 'border-glass-border bg-surface-raised/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          isOn ? 'bg-champagne/20 text-champagne' : 'bg-surface-hover text-text-muted'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {feature.label}
                            {isCore && (
                              <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-champagne">
                                Always on
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-text-muted">{feature.description}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isOn}
                        disabled={isCore}
                        onClick={() => !isCore && toggleFeature(feature.key)}
                        className={`relative h-6 w-11 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-champagne ${
                          isOn ? 'bg-champagne' : 'bg-glass-border'
                        } ${isCore ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        aria-label={`Toggle ${feature.label}`}
                      >
                        <span
                          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            isOn ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-glass-border px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              disabled={allNonCoreSelected}
              className="text-xs font-medium text-text-muted hover:text-foreground transition disabled:opacity-40 disabled:cursor-not-allowed"
              type="button"
            >
              Select all
            </button>
            <span className="text-text-muted/40">·</span>
            <button
              onClick={deselectAll}
              disabled={!allNonCoreSelected && selected.size === CORE_FEATURE_KEYS.length}
              className="text-xs font-medium text-text-muted hover:text-foreground transition disabled:opacity-40 disabled:cursor-not-allowed"
              type="button"
            >
              Minimal
            </button>
            <span className="ml-2 text-[10px] text-text-muted">
              {selected.size - CORE_FEATURE_KEYS.length} extra feature{(selected.size - CORE_FEATURE_KEYS.length) !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            {currentStep < totalSteps - 1 ? (
              <button
                onClick={() => setCurrentStep((s) => Math.min(s + 1, totalSteps - 1))}
                className="flex items-center gap-1.5 rounded-lg bg-champagne px-4 py-2 text-sm font-semibold text-black shadow-button hover:brightness-110 transition"
                type="button"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={bulkMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-champagne px-5 py-2 text-sm font-semibold text-black shadow-button hover:brightness-110 transition disabled:opacity-50"
                type="button"
              >
                <Check className="h-4 w-4" />
                {bulkMutation.isPending ? 'Saving…' : 'Get Started'}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
