'use client';

import React, { useState, useCallback, Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ReceiptText, ArrowRight, Sparkles, Zap,
  Lock, CheckCircle2, ChevronDown, Star, Menu, X,
  Camera, Search, CalendarDays, Store, PiggyBank, TrendingUp,
  DollarSign, Tags, Kanban, GitCompare, Repeat, FileDown,
  BarChart3, ClipboardCheck, ShieldCheck, AlertTriangle,
  Route, Landmark, Building2, Wallet, Mail, Users, Moon,
  ScrollText, FileSpreadsheet, Lightbulb, Clock,
  Building, Shield, Globe, Zap as ZapIcon,
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
  Building, Shield, Globe, ZapIcon,
};

const getFeatureIcon = (iconName: string): React.ComponentType<LucideProps> =>
  iconComponents[iconName] || Camera;

// ===== CUSTOM EASING (Fluid spring) =====
const FLUID_EASE = [0.32, 0.72, 0, 1] as const;
const FLUID_EASE_OUT = [0.16, 1, 0.3, 1] as const;

// ===== SCROLL REVEAL HOOK =====
function useScrollReveal(threshold = 0.1, rootMargin = '-80px') {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const reduce = useReducedMotion();
  const visibleRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) {
      if (!visibleRef.current) {
        visibleRef.current = true;
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => setIsVisible(true), 0);
      }
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!visibleRef.current) {
            visibleRef.current = true;
            setIsVisible(true);
          }
          observer.unobserve(el);
        }
      },
      { rootMargin, threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduce, rootMargin, threshold]);

  return { ref, isVisible, reduce };
}

// ===== STAGGERED REVEAL WRAPPER =====
function StaggeredReveal({
  children,
  delay = 0,
  className = '',
  threshold = 0.1,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  threshold?: number;
}) {
  const { ref, isVisible, reduce } = useScrollReveal(threshold);

  if (reduce) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 32, scale: 0.98 }}
      animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 32, scale: 0.98 }}
      transition={{ duration: 0.9, delay, ease: FLUID_EASE }}
    >
      {children}
    </motion.div>
  );
}

// ===== DOUBLE-BEZEL CARD (Doppelrand) =====
interface DoubleBezelCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: string;
  outerRadius?: string;
  innerRadius?: string;
}

function DoubleBezelCard({
  children,
  className = '',
  hover = false,
  padding = 'p-6 sm:p-8',
  outerRadius = 'rounded-[2rem]',
  innerRadius = 'rounded-[calc(2rem-0.375rem)]',
}: DoubleBezelCardProps) {
  return (
    <div className={`relative ${outerRadius} ${className}`}>
      {/* Outer Shell */}
      <div
        className={`
          absolute inset-0 ${outerRadius}
          bg-black/5 dark:bg-white/5
          border border-white/10 dark:border-black/10
          p-1.5
          pointer-events-none
          ${hover ? 'transition-all duration-500 ease-[0.32,0.72,0,1] group-hover:border-champagne/30 group-hover:bg-champagne/5' : ''}
        `}
        aria-hidden="true"
      />
      {/* Inner Core */}
      <div className={`
        relative ${innerRadius} ${padding} z-10
        bg-card dark:bg-zinc-950
        border border-glass-border dark:border-zinc-800
        shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]
        ${hover ? 'transition-all duration-500 ease-[0.32,0.72,0,1] group-hover:shadow-[0_20px_40px_-10px_rgba(190,169,142,0.15)]' : ''}
      `}>
        {children}
      </div>
    </div>
  );
}

// ===== BUTTON-IN-BUTTON CTA (Magnetic Island) =====
interface MagneticCTAProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  icon?: React.ComponentType<LucideProps>;
  disabled?: boolean;
}

function MagneticCTA({
  children,
  onClick,
  href,
  variant = 'primary',
  className = '',
  icon: Icon = ArrowRight,
  disabled = false,
}: MagneticCTAProps) {
  const reduce = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  const baseStyles = `
    relative inline-flex items-center justify-center gap-2.5
    rounded-full px-8 py-3.5 text-sm font-bold
    transition-all duration-300 ease-[0.32,0.72,0,1]
    focus:outline-none focus:ring-2 focus:ring-champagne/40 focus:ring-offset-2 focus:ring-offset-obsidian
    disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `;

  const variantStyles = {
    primary: `
      bg-champagne text-obsidian
      shadow-xl shadow-champagne/20
      hover:bg-champagne-dim hover:shadow-champagne/30 hover:-translate-y-0.5
      active:scale-[0.98]
    `,
    secondary: `
      border border-glass-border bg-white/[0.03] text-text-primary
      backdrop-blur-sm
      hover:bg-white/[0.06] hover:border-champagne/20 hover:-translate-y-0.5
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent text-text-primary hover:text-champagne
      hover:bg-champagne/5 hover:-translate-y-0.5
      active:scale-[0.98]
    `,
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.();
  };

  if (href) {
    return (
      <Link
        href={href}
        onClick={handleClick}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group ${baseStyles} ${variantStyles[variant]}`}
        aria-disabled={disabled}
      >
        <span className="relative z-10">{children}</span>
        {Icon && (
          <motion.span
            className={`
              relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full
              bg-black/5 dark:bg-white/10
              transition-transform duration-300 ease-[0.32,0.72,0,1]
            `}
            animate={isHovered && !reduce ? { x: 4, scale: 1.1 } : { x: 0, scale: 1 }}
            transition={{ ease: FLUID_EASE }}
          >
            <Icon className="h-4 w-4" />
          </motion.span>
        )}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      className={`group ${baseStyles} ${variantStyles[variant]}`}
      aria-disabled={disabled}
    >
      <span className="relative z-10">{children}</span>
      {Icon && (
        <motion.span
          className={`
            relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full
            bg-black/5 dark:bg-white/10
            transition-transform duration-300 ease-[0.32,0.72,0,1]
          `}
          animate={isHovered && !reduce ? { x: 4, scale: 1.1 } : { x: 0, scale: 1 }}
          transition={{ ease: FLUID_EASE }}
        >
          <Icon className="h-4 w-4" />
        </motion.span>
      )}
    </button>
  );
}

// ===== TRUST BADGE =====
function TrustBadge({ icon: Icon, text }: { icon: React.ComponentType<LucideProps>; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-surface-raised px-3.5 py-1.5 text-[11px] font-medium text-text-secondary border border-glass-border transition-all hover:border-champagne/20 hover:bg-card">
      <Icon className="h-3.5 w-3.5 text-champagne" />
      {text}
    </div>
  );
}

// ===== NAVIGATION =====
function NavBar({ onGetStarted }: { onGetStarted: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reduce = useReducedMotion();

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
      document.getElementById(href.replace('#', ''))?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    }
  }, [reduce]);

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
          <MagneticCTA variant="primary" icon={ArrowRight} onClick={onGetStarted} className="ml-4">
            Sign In
          </MagneticCTA>
        </nav>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover md:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.3, ease: FLUID_EASE }}
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
              <MagneticCTA variant="primary" icon={ArrowRight} onClick={() => { setMobileMenuOpen(false); onGetStarted(); }} className="mt-2 w-full">
                Sign In
              </MagneticCTA>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ===== HERO — Left-aligned Editorial Split with 3D background =====
function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  const reduce = useReducedMotion();
  const { ref, isVisible } = useScrollReveal(0.1, '-100px');

  return (
    <section
      ref={ref}
      className="relative min-h-[100dvh] flex items-center overflow-hidden pt-24"
      aria-labelledby="hero-heading"
    >
      {/* 3D Scene background — right side */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-champagne/5 via-transparent to-obsidian z-10" />
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            <Scene3D />
          </Suspense>
        </div>
        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-champagne/6 blur-[150px]" />
        <div className="absolute bottom-1/4 -left-32 w-[400px] h-[400px] rounded-full bg-champagne/4 blur-[120px]" />
      </div>

      {/* Content — left-aligned */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column — text content */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={isVisible && !reduce ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduce ? 0 : 0.9, ease: FLUID_EASE }}
            className="max-w-xl"
          >
            {/* Eyebrow — only ONE on page */}
            <div className="inline-flex items-center gap-2 rounded-full border border-champagne/20 bg-champagne/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-champagne backdrop-blur-sm mb-6">
              <Sparkles className="h-3 w-3" /> CRA-Ready Accounting
            </div>

            {/* Headline — max 2 lines */}
            <h1
              id="hero-heading"
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
            >
              <span className="bg-gradient-to-r from-champagne via-champagne-dim to-champagne bg-clip-text text-transparent">
                Receipt Management
              </span>
              <br />
              <span className="text-text-primary">Engineered for Canada</span>
            </h1>

            {/* Subtext — max 20 words */}
            <p className="text-lg text-text-muted/90 leading-relaxed mb-10 max-w-lg">
              Stop worrying about CRA audits. <strong className="text-text-primary">{APP_NAME}</strong> extracts, organizes, and stores receipts automatically. Tax-ready reports in one click.
            </p>

            {/* CTAs — 1 primary + 1 secondary */}
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <MagneticCTA variant="primary" icon={ArrowRight} onClick={onGetStarted}>
                Start Free Trial
              </MagneticCTA>
              <MagneticCTA variant="secondary" icon={Zap} href="/features">
                View Features
              </MagneticCTA>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <TrustBadge icon={Building2} text="Canadian Data Residency" />
              <TrustBadge icon={Lock} text="Bank-Level Encryption" />
            </div>
          </motion.div>

          {/* Right column — TiltCard with 3D receipt */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, translateY: 20 }}
            animate={isVisible && !reduce ? { opacity: 1, scale: 1, translateY: 0 } : { opacity: 1, scale: 1, translateY: 0 }}
            transition={{ duration: reduce ? 0 : 1, ease: FLUID_EASE, delay: 0.2 }}
            className="hidden lg:flex items-center justify-center"
          >
            <Suspense fallback={null}>
              <TiltCard tiltDegree={8} glare scale={1.02}>
                <DoubleBezelCard padding="p-8" outerRadius="rounded-2xl" innerRadius="rounded-[calc(2rem-0.375rem)]" className="w-[340px] h-[480px] flex flex-col items-center justify-center">
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
                </DoubleBezelCard>
              </TiltCard>
            </Suspense>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isVisible && !reduce ? { opacity: 1 } : { opacity: 1 }}
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
        <p className="text-center text-xs font-medium uppercase tracking-[0.15em] text-text-muted mb-10">
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

// ===== FEATURE HIGHLIGHTS =====
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
            <StaggeredReveal key={feat.icon} delay={index * 0.08} className="text-left">
              <DoubleBezelCard padding="p-6" hover className="h-full group">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-champagne/10 text-champagne transition-all duration-500 group-hover:bg-champagne/20 group-hover:scale-105">
                  {React.createElement(getFeatureIcon(feat.icon), { className: 'h-6 w-6' })}
                </div>
                <h2 className="text-lg font-bold text-text-primary mb-2 transition-colors group-hover:text-champagne">{feat.title}</h2>
                <p className="text-sm text-text-muted/80 leading-relaxed mb-2">{feat.description}</p>
                <div className="text-xs font-semibold text-champagne">{feat.benefit}</div>
              </DoubleBezelCard>
            </StaggeredReveal>
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
            <StaggeredReveal key={stat.label} delay={0.1} className="text-center">
              <DoubleBezelCard padding="p-4 sm:p-6" className="text-center">
                <div className="text-4xl sm:text-5xl font-bold tracking-tight text-champagne mb-2 tabular-nums">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-xs text-text-muted/70 uppercase tracking-wider font-medium">{stat.label}</p>
              </DoubleBezelCard>
            </StaggeredReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== FEATURES SECTION (Asymmetrical Bento Grid) =====
function FeaturesSection() {
  const featuredFeature = features[0];
  const gridFeatures = features.slice(1, 9);

  return (
    <section id="features" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -left-48 -top-32 w-96 h-96 bg-champagne/6 rounded-full blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute -right-48 bottom-0 w-80 h-80 bg-champagne/4 rounded-full blur-[100px]" aria-hidden />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <StaggeredReveal className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: FLUID_EASE_OUT }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
          >
            Packed with <span className="bg-gradient-to-r from-champagne to-champagne-dim bg-clip-text text-transparent">Powerful Features</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: FLUID_EASE_OUT }}
            className="text-base text-text-muted/80 max-w-2xl mx-auto mt-4"
          >
            From AI scanning to CRA-ready reports — every tool a Canadian business needs for receipt management.
          </motion.p>
        </StaggeredReveal>

        {/* Featured card — full width */}
        {featuredFeature && (
          <StaggeredReveal className="mb-6">
            <Link
              href={`/features/${featuredFeature.id}`}
              className="group block"
            >
              <DoubleBezelCard padding="p-8 sm:p-10" hover outerRadius="rounded-2xl" innerRadius="rounded-[calc(2rem-0.375rem)]">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-champagne/15 text-champagne group-hover:bg-champagne/25 group-hover:scale-110 transition-all duration-500">
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
              </DoubleBezelCard>
            </Link>
          </StaggeredReveal>
        )}

        {/* Bento grid: asymmetric sizing */}
        <StaggeredReveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 scroll-mt-20">
          {gridFeatures.map((f, i) => {
            const IconComp = getFeatureIcon(f.icon);
            const isSpanCol = i === 0 || i === gridFeatures.length - 1;
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: i * 0.05, ease: FLUID_EASE }}
                className={isSpanCol ? 'lg:col-span-2' : ''}
              >
                <Link
                  href={`/features/${f.id}`}
                  className="group block h-full"
                >
                  <DoubleBezelCard padding="p-6" hover outerRadius="rounded-2xl" innerRadius="rounded-[calc(2rem-0.375rem)]" className="h-full">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-champagne/10 text-champagne transition-all duration-500 group-hover:bg-champagne/20 group-hover:scale-110">
                      {React.createElement(IconComp, { className: 'h-6 w-6' })}
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-2 transition-colors group-hover:text-champagne">{f.title}</h3>
                    <p className="text-sm text-text-muted/80 leading-relaxed line-clamp-3">{f.shortDescription}</p>
                    <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-champagne opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                      Learn more <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </DoubleBezelCard>
                </Link>
              </motion.div>
            );
          })}
        </StaggeredReveal>

        <StaggeredReveal delay={0.3} className="mt-12 text-center">
          <MagneticCTA variant="secondary" icon={ArrowRight} href="/features" className="inline-flex">
            See all {features.length} features
          </MagneticCTA>
        </StaggeredReveal>
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
        <StaggeredReveal className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Trusted by Canadian Businesses</h2>
        </StaggeredReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <StaggeredReveal key={t.name} delay={i * 0.1}>
              <DoubleBezelCard padding="p-6" hover outerRadius="rounded-2xl" innerRadius="rounded-[calc(2rem-0.375rem)]" className="h-full">
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
              </DoubleBezelCard>
            </StaggeredReveal>
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
        <StaggeredReveal className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            No Surprises. <span className="bg-gradient-to-r from-champagne to-champagne-dim bg-clip-text text-transparent">Just Results.</span>
          </h2>
          <p className="text-base text-text-muted/80 max-w-xl mx-auto">
            Start free. Upgrade when you need more power. Every plan includes core receipt management.
          </p>
        </StaggeredReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
          {pricingPlans.map((plan, i) => (
            <StaggeredReveal key={plan.name} delay={i * 0.1}>
              <DoubleBezelCard
                padding="p-8"
                hover
                outerRadius="rounded-2xl"
                innerRadius="rounded-[calc(2rem-0.375rem)]"
                className={`relative h-full flex flex-col ${plan.highlighted ? 'scale-105 z-10' : ''}`}
              >
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
                <MagneticCTA
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                  icon={ArrowRight}
                  onClick={() => {
                    if (plan.name === 'Enterprise') {
                      window.open('mailto:sales@9starlabs.ca?subject=Enterprise%20Plan%20Inquiry', '_blank');
                    } else {
                      onGetStarted();
                    }
                  }}
                  className="mt-6 w-full"
                >
                  {plan.cta}
                </MagneticCTA>
              </DoubleBezelCard>
            </StaggeredReveal>
          ))}
        </div>

        <StaggeredReveal delay={0.3} className="mt-10 text-center">
          <p className="text-sm text-text-muted/70">
            All plans include AES-256-GCM encryption, Canadian data residency, and PIPEDA compliance.
          </p>
        </StaggeredReveal>
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
        <StaggeredReveal className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Common Questions</h2>
        </StaggeredReveal>

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
    <DoubleBezelCard padding="py-4" className="group">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between list-none cursor-pointer text-left"
      >
        <span className="text-base font-semibold text-text-primary group-hover:text-champagne transition-colors pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: FLUID_EASE_OUT }}
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
            transition={{ duration: 0.3, ease: FLUID_EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="mt-2 text-sm text-text-muted/80 leading-relaxed pb-2">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </DoubleBezelCard>
  );
}

// ===== CTA BANNER =====
function CtaBanner({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-32 w-96 h-96 bg-champagne/10 rounded-full blur-[120px]" aria-hidden />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 relative">
        <StaggeredReveal className="relative">
          <DoubleBezelCard
            padding="p-12 sm:p-16"
            outerRadius="rounded-3xl"
            innerRadius="rounded-[calc(3rem-0.375rem)]"
            className="text-center overflow-hidden border-champagne/20 bg-gradient-to-br from-champagne/10 via-champagne/5 to-transparent"
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
              <MagneticCTA variant="primary" icon={ShieldCheck} onClick={onGetStarted}>
                Start Free Trial
              </MagneticCTA>
            </div>
          </DoubleBezelCard>
        </StaggeredReveal>
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
    <div className="min-h-screen bg-champagne text-text-primary selection:bg-champagne/30 overflow-x-hidden">
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