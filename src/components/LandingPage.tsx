'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ReceiptText, Camera, ArrowRight, Check, Menu, X,
  ChevronDown, Sparkles, Zap, ShieldCheck, Clock,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { slideDown } from '@/lib/animations';
import { features } from '@/lib/feature-content';
import { TiltCard } from '@/components/landing/TiltCard';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import SmoothScroll from '@/components/SmoothScroll';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Dynamically import the 3D scene — it uses Three.js canvas (SSR skip)
const Scene3D = dynamic(
  () => import('@/components/landing/Scene3D').then((m) => m.default),
  { ssr: false, loading: () => <div className="h-[320px] sm:h-[420px]" /> },
);

const featureList = features as typeof features;

// Interface for the component props
interface LandingPageProps {
  onGetStarted: () => void;
}

// ─── Entrance Variants ──────────────────────────────────────────

import type { Variants } from 'framer-motion';

const heroEntrance: Variants = {
  hidden: { opacity: 0, y: 60, scale: 0.95 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 60, damping: 28, mass: 1.2 },
  },
};

const fadeUpSection: Variants = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 80, damping: 26, mass: 1 },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 100, damping: 24, mass: 0.9, duration: 0.8 },
  },
};

// ─── Sub-Components ─────────────────────────────────────────────

function NavDots() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-4 top-1/4 h-2 w-2 rounded-full bg-champagne/30 landing-float-3d" />
      <div className="absolute right-[20%] top-[15%] h-1.5 w-1.5 rounded-full bg-champagne/20 landing-orbit" />
      <div className="absolute left-[30%] bottom-[20%] h-1 w-1 rounded-full bg-champagne/40 landing-orbit-reverse" />
    </div>
  );
}

function FloatingOrb({ className, size = 300 }: { className?: string; size?: number }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-[120px] ${className || ''}`}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

function GlowBorder({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group">
      <div className="absolute -inset-[1px] rounded-[inherit] bg-gradient-to-r from-champagne/0 via-champagne/20 to-champagne/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />
      {children}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 80], ['rgba(12,12,12,0)', 'rgba(12,12,12,0.95)']);
  const headerBorder = useTransform(scrollY, [0, 80], ['rgba(0,0,0,0)', 'rgba(255,255,255,0.06)']);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.92]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  const heroBlur = useTransform(scrollY, [0, 300], ['blur(0px)', 'blur(4px)']);

  const stats = useMemo(() => [
    { label: 'Receipts Processed', value: 50000, suffix: '+', prefix: '' },
    { label: 'Canadian Businesses', value: 500, suffix: '+', prefix: '' },
    { label: 'Tax Seasons Supported', value: 3, suffix: '', prefix: '' },
    { label: 'Avg. Time Saved', value: 8, suffix: 'h/mo', prefix: '' },
  ], []);

  const pricingPlans = useMemo(() => [
    {
      name: 'Starter',
      price: 'Free',
      description: 'For solo entrepreneurs testing the waters.',
      features: ['Up to 50 receipts/month', 'AI receipt scanning', 'Basic search & filters', 'CSV export', 'Email support'],
      cta: 'Get Started Free',
    },
    {
      name: 'Pro',
      price: '$19',
      description: 'For growing businesses that need serious tools.',
      features: ['Unlimited receipts', 'AI scanning + email forwarding', 'Budget management & forecasts', 'Kanban workflow & approvals', 'QBO / Xero export', 'CRA readiness score', 'Multi-user (up to 5)', 'Priority email support'],
      highlighted: true,
      cta: 'Start 14-Day Free Trial',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For larger teams with custom needs.',
      features: ['Everything in Pro', 'Unlimited users', 'Custom integrations', 'Dedicated account manager', 'SLA & SSO', 'On-premise option', 'Custom branding'],
      cta: 'Contact Sales',
    },
  ], []);

  const faqs = useMemo(() => [
    { question: 'Is my data stored in Canada?', answer: 'Yes. All data is stored on Canadian servers (Supabase hosted in us-west-1 with Canadian data residency compliance). We follow PIPEDA guidelines and Quebec Law 25 requirements.' },
    { question: 'Can I use this for CRA audits?', answer: 'Absolutely. Every receipt is stored with original image, extracted data, and a full audit trail. You can generate CRA-ready reports including T2125 statements.' },
    { question: 'How does the AI scanning work?', answer: 'Take a photo or forward a receipt email. Our AI extracts vendor name, date, total, tax, and category with high accuracy. You can review and edit before saving.' },
    { question: 'What happens after the free trial?', answer: 'Your 14-day Pro trial gives full access to all features. After it ends, you revert to the free Starter plan unless you subscribe. No data is lost.' },
    { question: 'Can my employees use it too?', answer: 'Yes. Pro plans include up to 5 users with role-based access. Employees can submit receipts; owners approve and export.' },
    { question: 'How secure is my data?', answer: 'End-to-end encryption for tokens. AES-256-GCM for sensitive data. SOC 2 compliant infrastructure. Regular security audits.' },
  ], []);

  const navItems = [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = useCallback((href: string) => {
    if (href.startsWith('/')) {
      window.location.href = href;
    } else {
      const id = href.replace('#', '');
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // ─── GSAP cinematic parallax effects ───────────────────────
  const heroRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run GSAP on desktop — mobile doesn't need heavy parallax
    if (typeof window === 'undefined' || window.innerWidth < 768) return;

    const ctx = gsap.context(() => {
      // Hero parallax: the 3D scene moves slower than scroll
      if (heroRef.current) {
        gsap.to(heroRef.current.querySelector('[data-parallax="hero"]'), {
          yPercent: 15,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.5,
          },
        });
      }

      // Pricing section parallax glow
      if (pricingRef.current) {
        gsap.fromTo(
          pricingRef.current.querySelector('[data-parallax="glow"]'),
          { opacity: 0.3 },
          {
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: pricingRef.current,
              start: 'top bottom',
              end: 'top center',
              scrub: 1,
            },
          },
        );
      }

      // CTA section scale-in
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          { scale: 0.92, opacity: 0.7 },
          {
            scale: 1,
            opacity: 1,
            duration: 1.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: ctaRef.current,
              start: 'top 80%',
            },
          },
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <SmoothScroll>
    <div className="min-h-screen bg-obsidian text-text-primary selection:bg-champagne/30 overflow-x-hidden">
      {/* ─── Fixed Nav ─── */}
      <motion.header
        style={{ backgroundColor: headerBg, borderColor: headerBorder }}
        className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-champagne/15 group-hover:bg-champagne/25 transition-colors">
              <ReceiptText className="h-5 w-5 text-champagne" />
            </div>
            <span className="text-sm font-bold tracking-tight">{APP_NAME}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavClick(item.href)}
                className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-champagne/60 transition-all group-hover:w-full" />
              </button>
            ))}
            <button
              type="button"
              onClick={onGetStarted}
              className="rounded-xl bg-champagne px-5 py-2.5 text-xs font-bold text-obsidian hover:bg-champagne-dim transition shadow-lg shadow-champagne/10"
            >
              Sign In
            </button>
          </nav>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-glass-border md:hidden"
            >
              <div className="space-y-1 px-4 py-3">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => { setMobileMenuOpen(false); handleNavClick(item.href); }}
                    className="block w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-hover hover:text-text-primary transition"
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); onGetStarted(); }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-champagne px-4 py-2.5 text-sm font-bold text-obsidian hover:bg-champagne-dim transition"
                >
                  Sign In <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Background ambience */}
        <FloatingOrb className="-left-32 -top-32 bg-champagne/10" size={600} />
        <FloatingOrb className="-right-48 top-1/3 bg-champagne/6" size={500} />
        <FloatingOrb className="left-1/3 bottom-0 bg-champagne/5" size={400} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-champagne/5 via-transparent to-obsidian" />

        {/* 3D Scene background layer */}
        <motion.div
          className="absolute inset-0 z-0"
          data-parallax="hero"
          style={{ scale: heroScale, opacity: heroOpacity, filter: heroBlur }}
        >
          <Scene3D />
        </motion.div>

        {/* Content overlay */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={slideDown} initial="hidden" animate="show" className="mb-8 inline-flex items-center gap-2 rounded-full border border-champagne/20 bg-champagne/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-champagne backdrop-blur-sm">
            <Sparkles className="h-3 w-3" /> CRA-Ready Accounting
          </motion.div>

          <motion.h1
            variants={heroEntrance}
            initial="hidden"
            animate="show"
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] max-w-5xl mx-auto"
          >
            Receipt Management{' '}
            <span className="bg-gradient-to-r from-champagne via-champagne-dim to-champagne bg-clip-text text-transparent">
              Engineered for Canada
            </span>
          </motion.h1>

          <motion.p
            variants={heroEntrance}
            initial="hidden"
            animate="show"
            className="mx-auto mt-6 max-w-2xl text-sm sm:text-base text-text-muted/90 leading-relaxed"
          >
            Stop worrying about CRA audits. {APP_NAME} automatically extracts, organizes, and
            stores your receipts with AI. Generate tax-ready reports, track budgets, and
            keep your business compliant — all in one place.
          </motion.p>

          <motion.div
            variants={heroEntrance}
            initial="hidden"
            animate="show"
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              type="button"
              onClick={onGetStarted}
              className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-champagne px-8 py-3.5 text-sm font-bold text-obsidian hover:bg-champagne-dim transition-all shadow-xl shadow-champagne/20 hover:shadow-champagne/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-champagne/40 landing-shimmer"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Free Trial <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 rounded-2xl border border-glass-border bg-white/[0.03] px-8 py-3.5 text-sm font-medium text-text-primary hover:bg-white/[0.06] transition backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-champagne/40"
            >
              <Zap className="h-4 w-4 text-champagne" /> View Features
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mt-16 sm:mt-20 mx-auto max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-8"
          >
            {stats.map((s) => (
              <motion.div key={s.label} variants={staggerItem} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-champagne">
                  <AnimatedCounter value={s.value} suffix={s.suffix} prefix={s.prefix} />
                </p>
                <p className="mt-1.5 text-xs text-text-muted/80">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-16 flex flex-col items-center gap-2 text-text-muted/40"
          >
            <span className="text-[10px] font-medium uppercase tracking-widest">Scroll to explore</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="relative py-24 sm:py-32 scroll-mt-20">
        <NavDots />
        <FloatingOrb className="-left-24 top-1/4 bg-champagne/5" size={400} />
        <FloatingOrb className="-right-24 bottom-1/4 bg-champagne/4" size={350} />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={fadeUpSection}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-champagne mb-4">
              <Sparkles className="h-3 w-3" /> Everything You Need
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Packed with{' '}
              <span className="bg-gradient-to-r from-champagne to-champagne-dim bg-clip-text text-transparent">
               Powerful Features
              </span>
            </h2>
            <p className="mt-4 text-sm text-text-muted/80 max-w-2xl mx-auto">
              From AI scanning to CRA-ready reports — every tool a Canadian business needs for receipt management.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {featureList.slice(0, 12).map((f) => (
              <motion.div key={f.id} variants={staggerItem}>
                <TiltCard tiltDegree={6} glare={false} scale={1.02}>
                  <Link
                    href={`/features/${f.id}`}
                    className="block group relative rounded-2xl border border-glass-border bg-card p-5 h-full transition-all duration-300 hover:border-champagne/30 hover:shadow-lg hover:shadow-champagne/5"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-champagne/10 text-champagne group-hover:bg-champagne/20 group-hover:scale-110 transition-all duration-300">
                      <Camera className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-text-primary mb-1.5 group-hover:text-champagne transition-colors">{f.title}</h3>
                    <p className="text-xs text-text-muted/80 leading-relaxed line-clamp-2">{f.shortDescription}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-champagne opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                      Learn more <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUpSection}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-10 text-center"
          >
            <Link
              href="/features"
              className="group inline-flex items-center gap-2 rounded-2xl border border-champagne/20 bg-champagne/5 px-6 py-3 text-sm font-semibold text-champagne hover:bg-champagne/10 transition-all hover:shadow-lg hover:shadow-champagne/5"
            >
              See all {featureList.length} features
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="relative py-24 sm:py-32 scroll-mt-20 overflow-hidden">
        <FloatingOrb className="left-1/3 -top-32 bg-champagne/8" size={500} />
        <FloatingOrb className="-right-32 bottom-1/3 bg-champagne/4" size={400} />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={fadeUpSection}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-champagne mb-4">Simple Pricing</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              No Surprises.{' '}
              <span className="bg-gradient-to-r from-champagne to-champagne-dim bg-clip-text text-transparent">
                Just Results.
              </span>
            </h2>
            <p className="mt-4 text-sm text-text-muted/80 max-w-xl mx-auto">
              Start free. Upgrade when you need more power. Every plan includes core receipt management.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-start max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={staggerItem}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
              >
                <GlowBorder>
                  <div
                    className={`relative rounded-2xl border p-6 sm:p-8 transition-all duration-300 ${
                      plan.highlighted
                        ? 'border-champagne/40 bg-card shadow-2xl shadow-champagne/10 scale-[1.02] sm:scale-105 z-10'
                        : 'border-glass-border bg-card hover:shadow-lg hover:border-glass-border-hover'
                    }`}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-champagne px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-obsidian">
                        Most Popular
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight tabular-nums text-text-primary">{plan.price}</span>
                      {plan.price !== 'Custom' && <span className="text-xs text-text-muted">/month</span>}
                    </div>
                    <p className="mt-2 text-xs text-text-muted/80">{plan.description}</p>
                    <ul className="mt-5 space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-success" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => {
                        if (plan.name === 'Enterprise') {
                          window.open('mailto:sales@9starlabs.ca?subject=Enterprise%20Plan%20Inquiry', '_blank');
                        } else {
                          onGetStarted();
                        }
                      }}
                      className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
                        plan.highlighted
                          ? 'bg-champagne text-obsidian hover:bg-champagne-dim shadow-lg shadow-champagne/20'
                          : 'border border-glass-border bg-surface-raised text-text-primary hover:bg-surface-hover'
                      }`}
                    >
                      {plan.cta} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </GlowBorder>
              </motion.div>
            ))}
          </div>

          <motion.p
            variants={fadeUpSection}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-10 text-center text-xs text-text-muted/70"
          >
            All plans include AES-256-GCM encryption, Canadian data residency, and PIPEDA compliance.
            <br />
            Need a custom plan?{' '}
            <button type="button" onClick={onGetStarted} className="text-champagne hover:underline font-medium">
              Contact us
            </button>
            .
          </motion.p>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <FloatingOrb className="left-1/2 -translate-x-1/2 -top-32 bg-champagne/10" size={600} />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 relative z-10">
          <motion.div
            variants={fadeUpSection}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="relative rounded-3xl border border-champagne/20 bg-gradient-to-br from-champagne/10 via-champagne/5 to-transparent p-10 sm:p-16 text-center overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-champagne/5 to-transparent landing-shimmer opacity-50" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-champagne/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-champagne mb-6">
                <Clock className="h-3 w-3" /> No credit card required
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Ready to Get{' '}
                <span className="bg-gradient-to-r from-champagne to-champagne-dim bg-clip-text text-transparent">
                  CRA-Ready?
                </span>
              </h2>
              <p className="mt-4 text-sm text-text-muted/80 max-w-lg mx-auto">
                Join hundreds of Canadian businesses that trust {APP_NAME} for their receipt management.
                Start your free trial — no credit card required.
              </p>
              <button
                type="button"
                onClick={onGetStarted}
                className="mt-8 group inline-flex items-center gap-2 rounded-2xl bg-champagne px-8 py-3.5 text-sm font-bold text-obsidian hover:bg-champagne-dim transition-all shadow-xl shadow-champagne/20 hover:shadow-champagne/30 hover:-translate-y-0.5"
              >
                <ShieldCheck className="h-4 w-4" />
                Start Free Trial <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="relative py-24 sm:py-32 border-t border-glass-border scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <motion.div
            variants={fadeUpSection}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-champagne mb-4">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Common Questions</h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="space-y-0"
          >
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-glass-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-champagne/15">
                <ReceiptText className="h-3.5 w-3.5 text-champagne" />
              </div>
              <span className="text-xs font-bold tracking-tight text-text-primary">{APP_NAME}</span>
            </div>
            <div className="flex items-center gap-5 text-xs text-text-muted/70">
              <Link href="/terms" className="hover:text-text-primary transition">Terms</Link>
              <Link href="/privacy" className="hover:text-text-primary transition">Privacy</Link>
              <a href="mailto:security@9starlabs.ca" className="hover:text-text-primary transition">Contact</a>
              <span>© {new Date().getFullYear()} 9 Star Labs. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </SmoothScroll>
  );
}

// ─── FAQ Item ───────────────────────────────────────────────────

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div variants={staggerItem} className="border-b border-glass-border py-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left group"
      >
        <span className="text-sm font-semibold text-text-primary group-hover:text-champagne transition-colors">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-text-muted transition-all duration-300 ${
            open ? 'rotate-180 text-champagne' : ''
          }`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="mt-2 text-xs text-text-muted/80 leading-relaxed overflow-hidden"
          >
            {answer}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
