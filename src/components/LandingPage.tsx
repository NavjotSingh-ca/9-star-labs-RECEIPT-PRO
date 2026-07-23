'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ReceiptText, ArrowRight, Sparkles, Zap,
  Lock, CheckCircle2, ChevronDown, Quote, Star, Menu, X,
  Camera, Search, CalendarDays, Store, PiggyBank, TrendingUp,
  DollarSign, Tags, Kanban, GitCompare, Repeat, FileDown,
  BarChart3, ClipboardCheck, ShieldCheck, AlertTriangle,
  Route, Landmark, Building2, Wallet, Mail, Users, Moon,
  ScrollText, FileSpreadsheet, Lightbulb, Clock,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { features } from '@/lib/feature-content';

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

// ===== HERO SECTION WITH 3D VISUALIZATION =====
function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  // Feature highlights for the hero - focusing on autonomous capabilities
  const autonomousFeatures = [
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
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* 3D Background Elements */}
      <div className="pointer-events-none absolute inset-0" onMouseMove={handleMouseMove} aria-hidden="true">
        {/* Animated gradient orbs - parallax on mouse move */}
        <div
          className="absolute top-1/4 left-1/4 w-[96px] h-[96px] rounded-full bg-champagne/8 blur-[120px] animate-pulse-soft transition-transform duration-5000"
          style={{
            transform: `translate(${(mousePosition.x - 0.5) * 100}px, ${(mousePosition.y - 0.5) * 100}px)`,
          }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-[80px] h-[80px] rounded-full bg-champagne/6 blur-[100px] animate-pulse-soft transition-transform duration-6000"
          style={{
            animationDelay: '1s',
            transform: `translate(${(0.5 - mousePosition.x) * 80}px, ${(mousePosition.y - 0.5) * 60}px)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-champagne/5 via-transparent to-obsidian" />
      </div>

      {/* 3D Receipt visualization */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Multiple floating cards for depth */}
          <div className="absolute w-[320px] h-[480px] rounded-2xl overflow-hidden shadow-2xl animate-float3d"
               style={{ transform: 'rotateY(-20deg) translateX(-40px)', opacity: '0.3' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-champagne/10 to-card/60 rounded-xl border border-champagne/15" />
          </div>
          <div className="absolute w-[320px] h-[480px] rounded-2xl overflow-hidden shadow-2xl animate-float3d"
               style={{ animationDelay: '0.5s', opacity: '0.5' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-champagne/15 via-card to-champagne/5 rounded-xl border border-champagne/25 shadow-2xl">
              <div className="relative h-full flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 rounded-xl bg-champagne/20 flex items-center justify-center mb-6">
                  <ReceiptText className="w-10 h-10 text-champagne" />
                </div>
                <div className="space-y-3 w-full max-w-xs">
                  <div className="h-2.5 bg-champagne/30 rounded-full w-3/4 mx-auto" />
                  <div className="h-2.5 bg-champagne/20 rounded-full w-1/2 mx-auto" />
                  <div className="h-2.5 bg-champagne/15 rounded-full w-2/3 mx-auto" />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute w-[320px] h-[480px] rounded-2xl overflow-hidden shadow-2xl animate-float3d"
               style={{ transform: 'rotateY(20deg) translateX(40px)', animationDelay: '1s', opacity: '0.3' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-champagne/8 to-card/50 rounded-xl border border-champagne/10" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <TrustBadge icon={Building2} text="Canadian Data Residency" />
          <TrustBadge icon={Lock} text="Bank-Level Encryption" />
        </div>

        <div className="text-center">
          {/* Category badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-champagne/20 bg-champagne/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-champagne backdrop-blur-sm mb-6 animate-in fade-in slide-up-from-bottom-4 duration-700">
            <Sparkles className="h-3 w-3" /> CRA-Ready Accounting
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] max-w-5xl mx-auto mb-6 animate-in fade-in slide-up-from-bottom-4 duration-700 delay-100">
            <span className="bg-gradient-to-r from-champagne via-champagne-dim to-champagne bg-clip-text text-transparent">
              Receipt Management
            </span>
            <br />
            <span className="text-text-primary">Engineered for Canada</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-text-muted/90 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-up-from-bottom-4 duration-700 delay-200">
            Stop worrying about CRA audits. <strong>{APP_NAME}</strong> automatically extracts, organizes, and
            stores your receipts with AI. Generate tax-ready reports, track budgets, and
            keep your business compliant — all in one place.
          </p>

          {/* Feature highlights with hover effects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-in fade-in slide-up-from-bottom-4 duration-700 delay-300">
            {autonomousFeatures.map((feat, index) => (
              <FeatureHighlight
                key={feat.icon}
                icon={getFeatureIcon(feat.icon)}
                title={feat.title}
                description={feat.description}
                benefit={feat.benefit}
                delay={index * 100}
              />
            ))}
          </div>

          {/* Call to action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-in fade-in slide-up-from-bottom-4 duration-700 delay-400">
            <button
              type="button"
              onClick={onGetStarted}
              className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-champagne px-8 py-3.5 text-sm font-bold text-obsidian transition-all shadow-xl shadow-champagne/20 hover:shadow-champagne/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-champagne/40 antigravity-btn"
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
          </div>

          {/* Stats with animated counters */}
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
            <StatItem value={50000} suffix="+" label="Receipts Processed" delay={500} />
            <StatItem value={500} suffix="+" label="Canadian Businesses" delay={600} />
            <StatItem value={3} label="Tax Seasons Supported" delay={700} />
            <StatItem value={8} suffix="h/mo" label="Avg. Time Saved" delay={800} />
          </div>

          {/* Scroll indicator */}
          <div className="mt-16 flex flex-col items-center gap-2 text-text-muted/40 animate-in fade-in duration-1000 delay-900">
            <span className="text-[10px] font-medium uppercase tracking-widest">Scroll to explore</span>
            <ChevronDown className="h-5 w-5 animate-bounce" />
          </div>
        </div>
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

function FeatureHighlight({ icon, title, description, benefit, delay }: {
  icon: React.ComponentType<LucideProps>;
  title: string;
  description: string;
  benefit: string;
  delay?: number;
}) {
  return (
    <div
      className={`text-center animate-in fade-in slide-up-from-bottom-4 duration-500 ${delay ? `delay-${delay}ms` : ''}`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-champagne/10 text-champagne transition-all duration-300 hover:bg-champagne/20 hover:scale-105">
        {React.createElement(icon, { className: 'h-6 w-6' })}
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2 transition-colors hover:text-champagne">{title}</h3>
      <p className="text-sm text-text-muted/80 leading-relaxed">{description}</p>
      <div className="mt-2 text-xs font-semibold text-champagne">{benefit}</div>
    </div>
  );
}

function StatItem({ value, suffix = '', label, delay = 0 }: { value: number; suffix?: string; label: string; delay?: number }) {
  return (
    <div className={`text-center animate-in fade-in zoom-in duration-500 delay-${delay}ms`}>
      <div className="text-4xl sm:text-5xl font-bold tracking-tight text-champagne mb-2">
        <AnimatedCounter value={value} suffix={suffix} />
      </div>
      <p className="text-xs text-text-muted/70 uppercase tracking-wider font-medium">{label}</p>
    </div>
  );
}

function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const frameRef = React.useRef(0);

  React.useEffect(() => {
    const duration = 2000;
    const steps = 60;

    const timer = setInterval(() => {
      frameRef.current += 1;
      const progress = Math.min(frameRef.current / steps, 1);
      setDisplayValue(Math.floor(value * progress));
      if (progress >= 1) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <>{prefix}{displayValue}{suffix}</>;
}

// ===== FEATURES SECTION =====
function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Animated background elements */}
      <div className="pointer-events-none absolute -left-48 -top-32 w-96 h-96 bg-champagne/6 rounded-full blur-[120px] antigravity-float" aria-hidden />
      <div className="pointer-events-none absolute -right-48 bottom-0 w-80 h-80 bg-champagne/4 rounded-full blur-[100px] antigravity-float-slow" aria-hidden />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16 animate-in fade-in slide-up-from-bottom-4 duration-700">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-champagne mb-4">Everything You Need</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Packed with <span className="bg-gradient-to-r from-champagne to-champagne-dim bg-clip-text text-transparent">Powerful Features</span>
          </h2>
          <p className="text-base text-text-muted/80 max-w-2xl mx-auto">
            From AI scanning to CRA-ready reports — every tool a Canadian business needs for receipt management.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 scroll-mt-20">
          {features.slice(0, 9).map((f, i) => {
            const IconComp = getFeatureIcon(f.icon);
            return (
              <Link
                key={f.id}
                href={`/features/${f.id}`}
                className="group block rounded-2xl border border-glass-border bg-card p-6 transition-all duration-300 hover:border-champagne/30 hover:shadow-lg hover:shadow-champagne/5 hover:-translate-y-1 animate-in fade-in slide-up-from-bottom-4 duration-500 antigravity-card"
                style={{ animationDelay: `${i * 50}ms` }}
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
            );
          })}
        </div>

        <div className="mt-12 text-center animate-in fade-in slide-up-from-bottom-4 duration-700 delay-200">
          <Link
            href="/features"
            className="inline-flex items-center gap-2 rounded-xl border border-champagne/20 bg-champagne/5 px-6 py-3 text-sm font-semibold text-champagne hover:bg-champagne/10 transition"
          >
            See all {features.length} features <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
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
        <div className="text-center mb-12 animate-in fade-in slide-up-from-bottom-4 duration-700">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-champagne mb-4">What Users Say</p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Trusted by Canadian Businesses</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <div key={t.name} className={`animate-in fade-in slide-up-from-bottom-4 duration-500 delay-${i * 100}ms`}>
              <div className="rounded-2xl border border-glass-border bg-card p-6 h-full antigravity-card">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-champagne text-champagne" />
                  ))}
                </div>
                <Quote className="h-6 w-6 text-champagne/30 mb-2" />
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
            </div>
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
        <div className="text-center mb-16 animate-in fade-in slide-up-from-bottom-4 duration-700">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-champagne mb-4">Simple Pricing</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            No Surprises. <span className="bg-gradient-to-r from-champagne to-champagne-dim bg-clip-text text-transparent">Just Results.</span>
          </h2>
          <p className="text-base text-text-muted/80 max-w-xl mx-auto">
            Start free. Upgrade when you need more power. Every plan includes core receipt management.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
          {pricingPlans.map((plan) => (
            <div key={plan.name} className={`animate-in fade-in slide-up-from-bottom-4 duration-500 ${plan.highlighted ? 'delay-100' : ''}`}>
              <div className={`relative rounded-2xl border p-8 transition-all duration-300 h-full flex flex-col antigravity-card ${
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
                      ? 'bg-champagne text-obsidian hover:bg-champagne-dim shadow-lg shadow-champagne/20 antigravity-btn'
                      : 'border border-glass-border bg-surface-raised text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  {plan.cta} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-text-muted/70 animate-in fade-in duration-500 delay-200">
          All plans include AES-256-GCM encryption, Canadian data residency, and PIPEDA compliance.
        </p>
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

  return (
    <section id="faq" className="relative py-24 sm:py-32 border-t border-glass-border scroll-mt-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center mb-12 animate-in fade-in slide-up-from-bottom-4 duration-700">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-champagne mb-4">FAQ</p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Common Questions</h2>
        </div>

        <div className="space-y-0">
          {faqs.map((faq, i) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} delay={i * 50} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer, delay }: { question: string; answer: string; delay?: number }) {
  return (
    <details className="border-b border-glass-border py-4 group animate-in fade-in slide-up-from-bottom-2 duration-300" style={{ animationDelay: `${delay}ms` }}>
      <summary className="flex items-center justify-between list-none cursor-pointer">
        <span className="text-base font-semibold text-text-primary group-hover:text-champagne transition-colors pr-4">{question}</span>
        <ChevronDown className="h-5 w-5 shrink-0 text-text-muted transition-all duration-300 open:rotate-180 open:text-champagne" />
      </summary>
      <div className="mt-2 text-sm text-text-muted/80 leading-relaxed">{answer}</div>
    </details>
  );
}

// ===== CTA BANNER =====
function CtaBanner({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-32 w-96 h-96 bg-champagne/10 rounded-full blur-[120px]" aria-hidden />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 relative">
        <div className="relative rounded-3xl border border-champagne/20 bg-gradient-to-br from-champagne/10 via-champagne/5 to-transparent p-12 sm:p-16 text-center overflow-hidden animate-in fade-in slide-up-from-bottom-4 duration-700">
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
              className="inline-flex items-center gap-2 rounded-xl bg-champagne px-8 py-3.5 text-sm font-bold text-obsidian hover:bg-champagne-dim transition shadow-xl shadow-champagne/20 antigravity-btn"
            >
              <ShieldCheck className="h-4 w-4" /> Start Free Trial
            </button>
          </div>
        </div>
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
            <Link href="/terms" className="hover:text-text-primary transition">Terms</Link>
            <Link href="/privacy" className="hover:text-text-primary transition">Privacy</Link>
            <a href="mailto:security@9starlabs.ca" className="hover:text-text-primary transition inline-flex items-center gap-1">
              <Mail className="h-3 w-3" /> Contact
            </a>
            <span>© {new Date().getFullYear()} 9 Star Labs. All rights reserved.</span>
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = useCallback((href: string) => {
    if (href.startsWith('/')) {
      window.location.href = href;
    } else {
      document.getElementById(href.replace('#', ''))?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-obsidian text-text-primary selection:bg-champagne/30 overflow-x-hidden">
      {/* Fixed Navigation */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-glass-border bg-obsidian/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-champagne/15 transition-colors group-hover:bg-champagne/25">
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
                className="text-xs font-medium text-text-muted hover:text-text-primary transition relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-champagne transition-all group-hover:w-full" />
              </button>
            ))}
            <button
              type="button"
              onClick={onGetStarted}
              className="rounded-xl bg-champagne px-5 py-2.5 text-xs font-bold text-obsidian hover:bg-champagne-dim transition shadow-lg shadow-champagne/10 antigravity-btn"
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

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="overflow-hidden border-t border-glass-border md:hidden animate-in fade-in slide-down-from-top-4 duration-300">
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
          </div>
        )}
      </header>

      {/* Hero Section */}
      <HeroSection onGetStarted={onGetStarted} />

      {/* Features Section */}
      <FeaturesSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Pricing Section */}
      <PricingSection onGetStarted={onGetStarted} />

      {/* CTA Banner */}
      <CtaBanner onGetStarted={onGetStarted} />

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
