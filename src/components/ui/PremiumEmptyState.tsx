'use client';

import { motion } from 'framer-motion';
import {
  ReceiptText,
  Scan,
  SearchX,
  SlidersHorizontal,
  AlertCircle,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const easeOut = [0.25, 0.1, 0.25, 1] as const;

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

export type EmptyStateVariant = 'firstRun' | 'noResults' | 'filteredOut' | 'error';

interface VariantContent {
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  ctaIcon: ReactNode;
  showFeatures: boolean;
  showForwardEmail: boolean;
}

const variantMap: Record<EmptyStateVariant, VariantContent> = {
  firstRun: {
    icon: <ReceiptText className="h-10 w-10 text-champagne" />,
    title: 'Your financial picture starts here',
    description:
      'Scan your first receipt to unlock spending insights, tax-ready reports, and CRA-compliant audit trails — all in one place.',
    ctaLabel: 'Scan your first receipt',
    ctaIcon: <Scan className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />,
    showFeatures: true,
    showForwardEmail: true,
  },
  noResults: {
    icon: <SearchX className="h-10 w-10 text-champagne" />,
    title: 'No results found',
    description:
      'Try adjusting your search terms or date range. You can also browse recent receipts or scan a new one.',
    ctaLabel: 'Clear search',
    ctaIcon: <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />,
    showFeatures: false,
    showForwardEmail: false,
  },
  filteredOut: {
    icon: <SlidersHorizontal className="h-10 w-10 text-champagne" />,
    title: 'No matching receipts',
    description:
      'The active filters are too narrow. Try broadening your date range, category, or status selection.',
    ctaLabel: 'Clear all filters',
    ctaIcon: <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />,
    showFeatures: false,
    showForwardEmail: false,
  },
  error: {
    icon: <AlertCircle className="h-10 w-10 text-danger" />,
    title: 'Something went wrong',
    description:
      'We couldn\'t load your receipts right now. This is usually temporary — try again or check your connection.',
    ctaLabel: 'Try again',
    ctaIcon: <RefreshCw className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />,
    showFeatures: false,
    showForwardEmail: false,
  },
};

interface PremiumEmptyStateProps {
  variant?: EmptyStateVariant;
  onScan?: () => void;
  onForwardEmail?: () => void;
  onClearFilters?: () => void;
  onRetry?: () => void;
  onClearSearch?: () => void;
  forwardingEmail?: boolean;
}

/**
 * Premium empty state with four distinct variants per UX playbook §25.
 * Each variant has its own icon, copy, and primary action.
 * - firstRun: no data yet — encourages scanning with feature preview
 * - noResults: search returned nothing — offers to clear search
 * - filteredOut: filters too narrow — offers to clear filters
 * - error: something broke — offers retry
 */
export function PremiumEmptyState({
  variant = 'firstRun',
  onScan,
  onForwardEmail,
  onClearFilters,
  onRetry,
  onClearSearch,
  forwardingEmail,
}: PremiumEmptyStateProps) {
  const content = variantMap[variant];

  const handlePrimaryAction = () => {
    switch (variant) {
      case 'firstRun':
        onScan?.();
        break;
      case 'noResults':
        onClearSearch?.();
        break;
      case 'filteredOut':
        onClearFilters?.();
        break;
      case 'error':
        onRetry?.();
        break;
    }
  };

  const showPrimary = variant === 'firstRun' ? !!onScan : true;

  return (
    <motion.div
      className="relative flex min-h-[60vh] flex-col items-center justify-center gap-8 overflow-hidden px-4"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {/* Ambient glow */}
      <motion.div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background:
            variant === 'error'
              ? 'rgba(239,68,68,0.05)'
              : 'var(--champagne-glow, #bea98e / 0.05)',
        }}
      />

      {/* Decorative icon ring */}
      <motion.div className="relative" variants={item}>
        <div
          className="absolute -inset-4 rounded-full opacity-30"
          style={{
            background:
              'radial-gradient(circle, var(--champagne-glow, #bea98e / 0.15), transparent 70%)',
            filter: 'blur(12px)',
          }}
        />
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg ring-1',
            variant === 'error' ? 'ring-danger/15' : 'ring-champagne/10',
          )}
          style={{
            background:
              variant === 'error'
                ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))'
                : 'linear-gradient(135deg, var(--champagne, #bea98e / 0.2), var(--champagne, #bea98e / 0.05))',
          }}
        >
          {content.icon}
        </div>
      </motion.div>

      {/* Headline */}
      <motion.div className="flex max-w-md flex-col items-center gap-3 text-center" variants={item}>
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary,#f5f5f4)]">
          {content.title}
        </h2>
        <p className="text-sm leading-relaxed text-[var(--text-secondary,#a1a1aa)]">
          {content.description}
        </p>
      </motion.div>

      {/* Primary CTA */}
      <motion.div variants={item} className="flex flex-col items-center gap-4">
        {showPrimary && (
          <button
            onClick={handlePrimaryAction}
            className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold text-black shadow-lg transition-all duration-300 hover:shadow-xl active:scale-[0.97]"
            style={{
              background:
                variant === 'error'
                  ? 'linear-gradient(135deg, #ef4444, #ef4444cc)'
                  : 'linear-gradient(135deg, var(--champagne), var(--champagne-dim, #8b7355))',
              boxShadow:
                variant === 'error'
                  ? '0 4px 24px -4px rgba(239,68,68,0.25)'
                  : '0 4px 24px -4px rgba(190,169,142,0.25)',
            }}
          >
            {content.ctaIcon}
            {content.ctaLabel}
          </button>
        )}
        {content.showForwardEmail && onForwardEmail && (
          <button
            onClick={onForwardEmail}
            disabled={forwardingEmail}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted,#71717a)] underline underline-offset-4 decoration-white/10 transition-colors duration-200 hover:text-[var(--text-secondary,#a1a1aa)] hover:decoration-white/30"
          >
            {forwardingEmail ? 'Loading...' : 'Or forward receipts from your email'}
          </button>
        )}
      </motion.div>

      {/* Feature highlights — first-run only */}
      {content.showFeatures && (
        <motion.div className="mt-4 grid gap-4 sm:grid-cols-3" variants={item}>
          {[
            { label: 'Smart Receipt OCR', desc: 'Auto-extracts vendor, date & amount' },
            { label: 'Tax-Ready Reports', desc: 'T2125 & T777 summaries for CRA' },
            { label: 'Audit-Ready Vault', desc: '6-year retention with full trail' },
          ].map((f) => (
            <div
              key={f.label}
              className="flex flex-col gap-1 rounded-xl border border-[var(--glass-border,#27272a)] bg-[var(--surface,#18181b)] px-4 py-3 text-left transition-colors duration-200 hover:border-champagne/20"
            >
              <span className="text-sm font-semibold text-[var(--text-primary,#f5f5f4)]">
                {f.label}
              </span>
              <span className="text-xs leading-relaxed text-[var(--text-secondary,#a1a1aa)]">
                {f.desc}
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
