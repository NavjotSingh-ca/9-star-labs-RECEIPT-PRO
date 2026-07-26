'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Lock,
  ChevronDown,
  ArrowRight,
  Building2,
  ReceiptText,
} from 'lucide-react';
import { Button } from '@/ui/primitives/Button';
import { TiltCard } from '@/components/landing/TiltCard';
import { Scene3D } from '@/components/landing/Scene3D';
import { APP_NAME } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/*  Trust badge                                                       */
/* ------------------------------------------------------------------ */
function TrustBadge({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  text: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-surface-raised px-3.5 py-1.5 text-[11px] font-medium text-text-secondary transition-all hover:border-champagne/20 hover:bg-card">
      <Icon className="h-3.5 w-3.5 text-champagne" />
      {text}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero section                                                      */
/* ------------------------------------------------------------------ */
export function HeroSection({
  onGetStarted,
}: {
  onGetStarted: () => void;
}) {
  return (
    <section
      className="relative flex min-h-[100dvh] items-center overflow-hidden pt-24"
      aria-labelledby="hero-heading"
    >
      {/* 3D Scene background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-champagne/5 via-transparent to-obsidian" />
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            <Scene3D />
          </Suspense>
        </div>
        {/* Ambient glow */}
        <div className="absolute right-[-128px] top-1/4 h-[500px] w-[500px] rounded-full bg-champagne/6 blur-[150px]" />
        <div className="absolute bottom-1/4 left-[-128px] h-[400px] w-[400px] rounded-full bg-champagne/4 blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left column — text content */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl"
          >
            {/* Eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-champagne/20 bg-champagne/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-champagne backdrop-blur-sm">
              <Sparkles className="h-3 w-3" /> CRA-Ready Accounting
            </div>

            {/* Headline */}
            <h1
              id="hero-heading"
              className="mb-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
            >
              <span className="bg-gradient-to-r from-champagne via-champagne-dim to-champagne bg-clip-text text-transparent">
                Receipt Management
              </span>
              <br />
              <span className="text-text-primary">Engineered for Canada</span>
            </h1>

            {/* Subtext */}
            <p className="mb-10 max-w-lg text-lg leading-relaxed text-text-muted/90">
              Stop worrying about CRA audits.{' '}
              <strong className="text-text-primary">{APP_NAME}</strong>{' '}
              automatically extracts, organizes, and stores your receipts.
              Tax-ready reports in one click.
            </p>

            {/* CTAs */}
            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-champagne px-8 py-3.5 text-sm font-bold text-obsidian shadow-xl shadow-champagne/20 transition-all hover:-translate-y-0.5 hover:shadow-champagne/30 focus:outline-none focus:ring-2 focus:ring-champagne/40"
              >
                Start Free Trial{' '}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => (window.location.href = '/features')}
                className="inline-flex items-center gap-2 rounded-2xl border border-glass-border bg-white/[0.03] px-8 py-3.5 text-sm font-medium text-text-primary backdrop-blur-sm transition-colors hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-champagne/40"
              >
                <Zap className="h-4 w-4 text-champagne" /> View Features
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <TrustBadge icon={Building2} text="Canadian Data Residency" />
              <TrustBadge icon={Lock} text="Bank-Level Encryption" />
            </div>
          </motion.div>

          {/* Right column — TiltCard with 3D receipt */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.2,
            }}
            className="hidden items-center justify-center lg:flex"
          >
            <Suspense fallback={null}>
              <TiltCard tiltDegree={8} glare scale={1.02}>
                <div className="flex h-[480px] w-[340px] flex-col items-center justify-center rounded-2xl border border-champagne/20 bg-gradient-to-br from-champagne/10 via-card/80 to-champagne/5 p-8 shadow-2xl">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-champagne/20">
                    <ReceiptText className="h-10 w-10 text-champagne" />
                  </div>
                  <div className="w-full max-w-xs space-y-3">
                    <div className="mx-auto h-3 w-3/4 rounded-full bg-champagne/30" />
                    <div className="mx-auto h-3 w-1/2 rounded-full bg-champagne/20" />
                    <div className="mx-auto h-3 w-2/3 rounded-full bg-champagne/15" />
                    <div className="mx-auto h-3 w-3/5 rounded-full bg-champagne/20" />
                    <div className="mx-auto h-3 w-3/4 rounded-full bg-champagne/10" />
                  </div>
                  <div className="mt-6 w-full border-t border-champagne/10 pt-4 text-center">
                    <span className="text-xs font-medium text-champagne/60">
                      AI Confidence: 98%
                    </span>
                  </div>
                </div>
              </TiltCard>
            </Suspense>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-20 flex flex-col items-center gap-2 text-text-muted/40"
        >
          <span className="text-[10px] font-medium uppercase tracking-widest">
            Scroll to explore
          </span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
}

export default HeroSection;