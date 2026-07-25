'use client';

import React, { useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ReceiptText, ArrowRight, Sparkles, Zap,
  Lock, CheckCircle2, ChevronDown, Star, Menu, X,
  Camera, Search, CalendarDays, Store, PiggyBank, TrendingUp,
  DollarSign, Tags, Kanban, GitCompare, Repeat, FileDown,
  BarChart3, ClipboardCheck, ShieldCheck, AlertTriangle,
  Route, Landmark, Building2, Wallet, Mail, Users, Moon,
  ScrollText, FileSpreadsheet, Lightbulb, Clock,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { features } from '@/lib/feature-content';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';

// Dynamically import Three.js components (SSR: false)
const Scene3D = dynamic(() => import('@/components/landing/Scene3D'), { ssr: false });
const TiltCard = dynamic(() => import('@/components/landing/TiltCard').then((m) => ({ default: m.TiltCard })), { ssr: false });

// Icon component mapping for dynamic rendering
const iconComponents: Record<string, React.ComponentType<LucideProps>> = {
  Camera, Search, CalendarDays, Store, PiggyBank, TrendingUp,
  ReceiptText, DollarSign, Tags, Kanban, GitCompare, Repeat,
  FileDown, BarChart3, ClipboardCheck, ShieldCheck, AlertTriangle,
  Route, Landmark, Building2, Wallet, Mail, Users, Moon,
  ScrollText, FileSpreadsheet, Lightbulb, Star, Sparkles,
};

const getFeatureIcon = (iconName: string): React.ComponentType<LucideProps> =>
  iconComponents[iconName] || Camera;

// ===== NAVIGATION =====
function NavBar({ onGetStarted }: { onGetStarted: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = useCallback((href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith('/')) {
      window.location.href = href;
    } else {
      document.getElementById(href.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-glass-border bg-obsidian/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-champagne/15 transition-colors group-hover:bg-champagne/25">
            <ReceiptText className="h-5 w-5 text-champagne" />
          </div>
          <span className="text-sm font-bold tracking-tight text-text-primary">{APP_NAME}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleNavClick(item.href)}
              className="relative text-xs font-medium text-text-muted hover:text-text-primary transition-colors group"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-champagne transition-all group-hover:w-full" />
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
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden border-t border-glass-border md:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item.href)}
                  className="block w-full text-left rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); onGetStarted(); }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-champagne px-4 py-2.5 text-sm font-bold text-obsidian hover:bg-champagne-dim transition-colors"
              >
                Sign In <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ===== HERO — Left-aligned split with 3D background =====
function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden pt-24">
      {/* 3D Scene background — right side */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-champagne/5 via-transparent to-obsidian z-10" />
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            <Scene3D />
          </Suspense>
        </div>
        {/* Ambient glow */}
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-champagne/6 blur-[150px]" />
        <div className="absolute bottom-1/4 -left-32 w-[400px] h-[400px] rounded-full bg-champagne/4 blur-[120px]" />
      </div>

      {/* Content — left-aligned */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column — text content */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl"
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-champagne/20 bg-champagne/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-champagne backdrop-blur-sm mb-6">
              <Sparkles className="h-3 w-3" /> CRA-Ready Accounting
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              <span className="bg-gradient-to-r from-champagne via-champagne-dim to-champagne bg-clip-text text-transparent">
                Receipt Management
              </span>
              <br />
              <span className="text-text-primary">Engineered for Canada</span>
            </h1>

            {/* Subtext — max 20 words */}
            <p className="text-lg text-text-muted/90 leading-relaxed mb-10 max-w-lg">
              Stop worrying about CRA audits. <strong className="text-text-primary">{APP_NAME}</strong> automatically extracts, organizes, and stores your receipts. Tax-ready reports in one click.
            </p>

            {/* CTAs — 1 primary + 1 secondary */}
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <button
                type="button"
                onClick={onGetStarted}
                className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-champagne px-8 py-3.5 text-sm font-bold text-obsidian transition-all shadow-xl shadow-champagne/20 hover:shadow-champagne/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-champagne/40"
              >
                Start Free Trial <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 rounded-2xl border border-glass-border bg-white/[0.03] px-8 py-3.5 text-sm font-medium text-text-primary hover:bg-white/[0.06] transition-colors backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-champagne/40"
              >
                <Zap className="h-4 w-4 text-champagne" /> View Features
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <TrustBadge icon={Building2} text="Canadian Data Residency" />
              <TrustBadge icon={Lock} text="Bank-Level Encryption" />
            </div>
          </motion.div>

          {/* Right column — TiltCard */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="hidden lg:flex items-center justify-center"
          >
            <Suspense fallback={null}>
              <TiltCard tiltDegree={8} glare scale={1.02}>
                <div className="w-[340px] h-[480px] rounded-2xl bg-gradient-to-br from-champagne/10 via-card/80 to-champagne/5 border border-champagne/20 shadow-2xl flex flex-col items-center justify-center p-8">
                  <div className="w-20 h-20 rounded-xl bg-champagne/20 flex items-center justify-center mb-6">
                    <ReceiptText className="w-10 h-10 text-champagne" />
                  </div>
                  <div className="space-y-3 w-full max-w-xs">
                    <div className="h-3 bg-champagne/30 rounded-full w-3/4 mx-auto" />
                    <div className="h-3 bg-champagne/20 rounded-full w-1/2 mx-auto" />
                    <div className="h-3 bg-champagne/15 rounded-full w-2/3 mx-auto" />
                    <div className="h-3 bg-champagne/20 rounded-full w-3/5 mx-auto" />
                    <div className="h-3 bg-champagne/10 rounded-full w-3/4 mx-auto" />
                  </div>
                  <div className="mt-6 w-full border-t border-champagne/10 pt-4 text-center">
                    <span className="text-xs text-champagne/60 font-medium">AI Confidence: 98%</span>
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
          <span className="text-[10px] font-medium uppercase tracking-widest">Scroll to explore</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
}

// ===== REUSABLE COMPONENTS =====
function TrustBadge({ icon: Icon, text }: { icon: React.ComponentType<LucideProps>; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-surface-raised px-3.5 py-1.5 text-[11px] font-medium text-text-secondary border border-glass-border transition-all hover:border-champagne/20 hover:bg-card">
      <Icon className="h-3.5 w-3.5 text-champagne" />
      {text}
    </div>
  );
}

function FeatureHighlight({ icon, title, description, benefit, index }: {
  icon: React.ComponentType<LucideProps>;
  title: string;
  description: string;
  benefit: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="text-left"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-champagne/10 text-champagne transition-all duration-300 hover:bg-champagne/20 hover:scale-105">
        {React.createElement(icon, { className: 'h-6 w-6' })}
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2 transition-colors hover:text-champagne">{title}</h3>
      <p className="text-sm text-text-muted/80 leading-relaxed mb-2">{description}</p>
      <div className="text-xs font-semibold text-champagne">{benefit}</div>
    </motion.div>
  );
}

// ===== LOGO WALL =====
function LogoWall() {
  const logos = [
    { name: 'Shopify', slug: 'shopify' },
    { name: 'Stripe', slug: 'stripe' },
    { name: 'Vercel', slug: 'vercel' },
    { name: 'Supabase', slug: 'supabase' },
    { name: 'Linear', slug: 'linear' },
    { name: 'Notion', slug: 'notion' },
  ];

  return (
    <section className="relative py-16 border-t border-glass-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-medium uppercase tracking-[0.15em] text-text-muted/50 mb-10">
          Built with
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="flex items-center gap-2 text-text-muted/30 hover:text-text-muted/60 transition-colors duration-300"
              title={logo.name}
            >
               <Image
                 src={`https://cdn.simpleicons.org/${logo.slug}/888888`}
                 alt={logo.name}
                 className="h-6 w-auto grayscale opacity-40 hover:opacity-70 hover:grayscale-0 transition-all duration-300"
                 width={24}
                 height={24}
                 unoptimized
                 priority={false}
               />
              <span className="text-xs font-medium">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== STATS SECTION =====
function StatsSection() {
  const stats = [
    { value: 50000, suffix: '+', label: 'Receipts Processed' },
    { value: 500, suffix: '+', label: 'Canadian Businesses' },
    { value: 3, suffix: '', label: 'Tax Seasons Supported' },
    { value: 8, suffix: 'h/mo', label: 'Avg. Time Saved' },
  ];

  return (
    <section className="relative py-20 border-t border-glass-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-bold tracking-tight text-champagne mb-2 tabular-nums">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-xs text-text-muted/70 uppercase tracking-wider font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== FEATURES HIGHLIGHTS (moved out of hero) =====
function FeatureHighlights() {
  const highlights = [
    {
      icon: 'Camera',
      title: 'AI Receipt Scanning',
      description: 'Snap, forward, or drag — AI extracts data in <2s with confidence scoring',
      benefit: '95%+ accuracy on Canadian receipts',
    },
    {
      icon: 'BarChart3',
      title: 'Spend Intelligence',
      description: 'AI analyzes patterns, predicts cash flow, and flags anomalies',
      benefit: 'See trends before they become problems',
    },
    {
      icon: 'ShieldCheck',
      title: 'CRA Audit Ready',
      description: 'Every receipt scored 0-100 for deduction readiness',
      benefit: 'Know exactly what\'s missing before tax season',
    },
    {
      icon: 'Users',
      title: 'Team Workflows',
      description: 'Role-based access with approval chains and audit trails',
      benefit: 'Collaborate securely with your accountant or team',
    },
  ];

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {highlights.map((feat, index) => (
            <FeatureHighlight
              key={feat.icon}
              icon={getFeatureIcon(feat.icon)}
              title={feat.title}
              description={feat.description}
              benefit={feat.benefit}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== FEATURES SECTION (bento-like grid) =====
function FeaturesSection() {
  // First feature: featured full-width card
  const featuredFeature = features[0];
  // Remaining 8 features in a bento grid
  const gridFeatures = features.slice(1, 9);

  return (
    <section id="features" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="pointer-events-none absolute -left-48 -top-32 w-96 h-96 bg-champagne/6 rounded-full blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute -right-48 bottom-0 w-80 h-80 bg-champagne/4 rounded-full blur-[100px]" aria-hidden />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
          >
            Packed with <span className="bg-gradient-to-r from-champagne to-champagne-dim bg-clip-text text-transparent">Powerful Features</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-base text-text-muted/80 max-w-2xl mx-auto mt-4"
          >
            From AI scanning to CRA-ready reports — every tool a Canadian business needs for receipt management.
          </motion.p>
        </div>

        {/* Featured card — full width */}
        {featuredFeature && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6"
          >
            <Link
              href={`/features/${featuredFeature.id}`}
              className="group relative block rounded-2xl border border-champagne/20 bg-gradient-to-br from-champagne/8 via-card to-champagne/5 p-8 sm:p-10 transition-all duration-300 hover:border-champagne/30 hover:shadow-lg hover:shadow-champagne/5"
            >
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-champagne/15 text-champagne group-hover:bg-champagne/25 group-hover:scale-110 transition-all duration-300">
                  {React.createElement(getFeatureIcon(featuredFeature.icon), { className: 'h-7 w-7' })}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-text-primary mb-2 group-hover:text-champagne transition-colors">{featuredFeature.title}</h3>
                  <p className="text-sm text-text-muted/80 leading-relaxed max-w-2xl">{featuredFeature.longDescription}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {featuredFeature.benefits.slice(0, 3).map((b) => (
                      <span key={b} className="inline-flex items-center gap-1 rounded-full bg-champagne/8 px-3 py-1 text-[10px] font-medium text-champagne">
                        <CheckCircle2 className="h-3 w-3" /> {b}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-champagne opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Bento grid: 2-col on desktop, asymmetric sizing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 scroll-mt-20">
          {gridFeatures.map((f, i) => {
            const IconComp = getFeatureIcon(f.icon);
            // Make first and last items span 2 cols on large screens
            const isSpanCol = i === 0 || i === gridFeatures.length - 1;
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={isSpanCol ? 'lg:col-span-2' : ''}
              >
                <Link
                  href={`/features/${f.id}`}
                  className="group block h-full rounded-2xl border border-glass-border bg-card p-6 transition-all duration-300 hover:border-champagne/30 hover:shadow-lg hover:shadow-champagne/5 hover:-translate-y-1"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-champagne/10 text-champagne transition-all duration-300 group-hover:bg-champagne/20 group-hover:scale-110">
                    {React.createElement(IconComp, { className: 'h-6 w-6' })}
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2 transition-colors group-hover:text-champagne">{f.title}</h3>
                  <p className="text-sm text-text-muted/80 leading-relaxed line-clamp-3">{f.shortDescription}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-champagne opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 text-center"
        >
          <Link
            href="/features"
            className="inline-flex items-center gap-2 rounded-xl border border-champagne/20 bg-champagne/5 px-6 py-3 text-sm font-semibold text-champagne hover:bg-champagne/10 transition-colors"
          >
            See all {features.length} features <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ===== TESTIMONIALS SECTION =====
function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Owner, Maple Accounting',
      quote: 'Saved me 15 hours during tax season. The CRA readiness score caught issues I would have missed.',
      rating: 5,
    },
    {
      name: 'Michael Dubois',
      role: 'Freelance Contractor',
      quote: 'Finally a receipt app that understands Canadian tax. The QBO export alone is worth the price.',
      rating: 5,
    },
    {
      name: 'Jennifer Park',
      role: 'Small Business Owner',
      quote: 'The AI scanning is scarily accurate. I barely need to edit anything — just snap and go.',
      rating: 5,
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 border-t border-glass-border overflow-hidden">
      <div className="pointer-events-none absolute -left-32 bottom-0 w-96 h-96 bg-champagne/6 rounded-full blur-[120px]" aria-hidden />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Trusted by Canadian Businesses</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="rounded-2xl border border-glass-border bg-card p-6 h-full">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-champagne text-champagne" />
                  ))}
                </div>
                <svg className="h-6 w-6 text-champagne/30 mb-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.477-.582-2.917-1.179zM15.583 17.321c-1.03-1.094-1.583-2.321-1.583-4.31 0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C20.591 11.69 22 13.166 22 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.477-.582-2.917-1.179z" />
                </svg>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-champagne/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-champagne">{t.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">{t.name}</p>
                    <p className="text-[10px] text-text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== PRICING SECTION =====
function PricingSection({ onGetStarted }: { onGetStarted: () => void }) {
  const pricingPlans = [
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
      priceDetail: '/month, billed annually',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For larger teams with custom needs.',
      features: ['Everything in Pro', 'Unlimited users', 'Custom integrations', 'Dedicated account manager', 'SLA & SSO', 'On-premise option', 'Custom branding'],
      cta: 'Contact Sales',
    },
  ];

  return (
    <section id="pricing" className="relative py-24 sm:py-32 scroll-mt-20 overflow-hidden">
      <div className="pointer-events-none absolute left-1/3 -top-32 w-96 h-96 bg-champagne/8 rounded-full blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute -right-32 bottom-1/3 w-80 h-80 bg-champagne/4 rounded-full blur-[100px]" aria-hidden />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            No Surprises. <span className="bg-gradient-to-r from-champagne to-champagne-dim bg-clip-text text-transparent">Just Results.</span>
          </h2>
          <p className="text-base text-text-muted/80 max-w-xl mx-auto">
            Start free. Upgrade when you need more power. Every plan includes core receipt management.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={`relative rounded-2xl border p-8 transition-all duration-300 h-full flex flex-col ${
                plan.highlighted
                  ? 'border-champagne/40 bg-card shadow-2xl shadow-champagne/10 scale-105 z-10'
                  : 'border-glass-border bg-card hover:shadow-lg hover:border-glass-border-hover'
              }`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-champagne px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-obsidian">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight tabular-nums text-text-primary">{plan.price}</span>
                  {plan.price !== 'Custom' && plan.priceDetail && <span className="text-xs text-text-muted">{plan.priceDetail}</span>}
                </div>
                <p className="mt-2 text-sm text-text-muted/80">{plan.description}</p>
                <ul className="mt-5 space-y-2.5 flex-grow">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-success" />
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
                  className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                    plan.highlighted
                      ? 'bg-champagne text-obsidian hover:bg-champagne-dim shadow-lg shadow-champagne/20'
                      : 'border border-glass-border bg-surface-raised text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  {plan.cta} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 text-center text-sm text-text-muted/70"
        >
          All plans include AES-256-GCM encryption, Canadian data residency, and PIPEDA compliance.
        </motion.p>
      </div>
    </section>
  );
}

// ===== FAQ SECTION =====
function FAQSection() {
  const faqs = [
    { question: 'Is my data stored in Canada?', answer: 'Yes. All data is stored on Canadian servers (Supabase hosted in us-west-1 with Canadian data residency compliance). We follow PIPEDA guidelines and Quebec Law 25 requirements.' },
    { question: 'Can I use this for CRA audits?', answer: 'Absolutely. Every receipt is stored with original image, extracted data, and a full audit trail. You can generate CRA-ready reports including T2125 statements.' },
    { question: 'How does the AI scanning work?', answer: 'Take a photo or forward a receipt email. Our AI extracts vendor name, date, total, tax, and category with high accuracy. You can review and correct before saving.' },
    { question: 'What happens after the free trial?', answer: 'Your 14-day Pro trial gives full access to all features. After it ends, you revert to the free Starter plan unless you subscribe. No data is lost.' },
    { question: 'Can my employees use it too?', answer: 'Yes. Pro plans include up to 5 users with role-based access. Employees can submit receipts; owners approve and export.' },
    { question: 'How secure is my data?', answer: 'End-to-end encryption for tokens. AES-256-GCM for sensitive data. We implement SOC 2-style controls including access logging, data retention policies, and regular internal security reviews.' },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-24 sm:py-32 border-t border-glass-border scroll-mt-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Common Questions</h2>
        </motion.div>

        <div className="space-y-0">
          {faqs.map((faq, i) => (
            <FAQItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer, isOpen, onToggle }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-glass-border py-4 group">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between list-none cursor-pointer text-left"
      >
        <span className="text-base font-semibold text-text-primary group-hover:text-champagne transition-colors pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <ChevronDown className="h-5 w-5 shrink-0 text-text-muted" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 text-sm text-text-muted/80 leading-relaxed pb-2">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== CTA BANNER =====
function CtaBanner({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-32 w-96 h-96 bg-champagne/10 rounded-full blur-[120px]" aria-hidden />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl border border-champagne/20 bg-gradient-to-br from-champagne/10 via-champagne/5 to-transparent p-12 sm:p-16 text-center overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-champagne/5 to-transparent opacity-50" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-champagne/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-champagne mb-6">
              <Clock className="h-3 w-3" /> No credit card required
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Ready to Get <span className="bg-gradient-to-r from-champagne to-champagne-dim bg-clip-text text-transparent">CRA-Ready?</span>
            </h2>
            <p className="text-base text-text-muted/80 max-w-lg mx-auto mb-8">
              Join hundreds of Canadian businesses that trust {APP_NAME} for their receipt management.
              Start your free trial — no credit card required.
            </p>
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 rounded-xl bg-champagne px-8 py-3.5 text-sm font-bold text-obsidian hover:bg-champagne-dim transition shadow-xl shadow-champagne/20"
            >
              <ShieldCheck className="h-4 w-4" /> Start Free Trial
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ===== FOOTER =====
function Footer() {
  return (
    <footer className="border-t border-glass-border py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-champagne/15">
              <ReceiptText className="h-3.5 w-3.5 text-champagne" />
            </div>
            <span className="text-xs font-bold tracking-tight text-text-primary">{APP_NAME}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-text-muted/70">
            <Link href="/terms" className="hover:text-text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
            <a href="mailto:security@9starlabs.ca" className="hover:text-text-primary transition-colors inline-flex items-center gap-1">
              <Mail className="h-3 w-3" /> Contact
            </a>
            <span>&copy; {new Date().getFullYear()} 9 Star Labs. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ===== MAIN LANDING PAGE COMPONENT =====
interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-obsidian text-text-primary selection:bg-champagne/30 overflow-x-hidden">
      {/* Fixed Navigation */}
      <NavBar onGetStarted={onGetStarted} />

      {/* Hero — left-aligned split with Scene3D + TiltCard */}
      <HeroSection onGetStarted={onGetStarted} />

      {/* Logo Wall — under hero */}
      <LogoWall />

      {/* Feature Highlights — moved out of hero */}
      <FeatureHighlights />

      {/* Stats Section */}
      <StatsSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Pricing */}
      <PricingSection onGetStarted={onGetStarted} />

      {/* CTA Banner */}
      <CtaBanner onGetStarted={onGetStarted} />

      {/* FAQ */}
      <FAQSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
