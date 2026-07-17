'use client';

import { useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { slideDown } from '@/lib/animations';
import {
  ReceiptText,
  Camera,
  Search,
  CalendarDays,
  Store,
  PiggyBank,
  TrendingUp,
  DollarSign,
  Tags,
  Kanban,
  GitCompare,
  Repeat,
  FileDown,
  FileSpreadsheet,
  Mail,
  ClipboardCheck,
  Lightbulb,
  ShieldCheck,
  ArrowRight,
  Check,
  Star,
  Menu,
  X,
  ChevronDown,
  BarChart3,
  Landmark,
  Users,
  ScrollText,
  AlertTriangle,
  Route,
  Building2,
  Wallet,
  Moon,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

interface LandingPageProps {
  onGetStarted: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' as const },
  transition: { duration: 0.6, ease: 'easeOut' as const },
};

const staggerVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};
const staggerTransition = { duration: 0.4, ease: 'easeOut' as const };

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      variants={staggerVariants}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      transition={staggerTransition}
      onClick={() => {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${title} — Learn more`}
      className="group relative rounded-2xl border border-glass-border bg-card p-6 transition-all duration-200 hover:shadow-lg hover:border-champagne/30 hover:-translate-y-0.5 cursor-pointer"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-champagne/10 text-champagne group-hover:bg-champagne/15 transition-colors">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-text-primary mb-1.5">{title}</h3>
      <p className="text-xs text-text-muted leading-relaxed">{description}</p>
      <p className="mt-3 text-[10px] font-semibold text-champagne opacity-0 group-hover:opacity-100 transition-opacity">
        Learn more →
      </p>
    </motion.div>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  highlighted,
  cta,
  onGetStarted,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  onGetStarted: () => void;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-6 sm:p-8 transition-all duration-200 ${
        highlighted
          ? 'border-champagne/40 bg-card shadow-lg shadow-champagne/5 scale-[1.02] sm:scale-105 z-10'
          : 'border-glass-border bg-card hover:shadow-md'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-champagne px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-obsidian">
          Most Popular
        </div>
      )}
      <h3 className="text-lg font-bold text-text-primary">{name}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight tabular-nums text-text-primary">{price}</span>
        {price !== 'Custom' && <span className="text-xs text-text-muted">/month</span>}
      </div>
      <p className="mt-2 text-xs text-text-muted">{description}</p>
      <ul className="mt-5 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-text-secondary">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-success" />
            {f}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onGetStarted}
        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
          highlighted
            ? 'bg-champagne text-obsidian hover:bg-champagne-dim'
            : 'border border-glass-border bg-surface-raised text-text-primary hover:bg-surface-hover'
        }`}
      >
        {cta}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-glass-border py-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-text-primary">{question}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 text-xs text-text-muted leading-relaxed overflow-hidden"
          >
            {answer}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * LandingPage — Marketing homepage with hero, features grid, pricing cards, FAQ accordion, and footer.
 * Parallax header scroll effect, mobile hamburger menu, animated scroll-triggered sections.
 */
export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 80], ['rgba(12,12,12,0)', 'rgba(12,12,12,0.95)']);
  const headerBorder = useTransform(scrollY, [0, 80], ['rgba(0,0,0,0)', 'rgba(255,255,255,0.06)']);

  const features = [
    { icon: <Camera className="h-5 w-5" />, title: 'AI Receipt Scanning', description: 'Snap a photo or forward an email. AI extracts vendor, date, amount, and tax automatically.' },
    { icon: <Search className="h-5 w-5" />, title: 'Smart Search', description: 'Search by text, date range, amount, category, or merchant. Filters persist across sessions.' },
    { icon: <CalendarDays className="h-5 w-5" />, title: 'Receipt Calendar', description: 'See your spending on a calendar. Click any day to view receipts.' },
    { icon: <Store className="h-5 w-5" />, title: 'Vendor Analytics', description: 'Top vendors by spend with trend sparklines. Know where your money goes.' },
    { icon: <PiggyBank className="h-5 w-5" />, title: 'Budget Management', description: 'Set per-category budgets. Visual progress rings. Overspend alerts.' },
    { icon: <TrendingUp className="h-5 w-5" />, title: 'Cash Flow Forecast', description: '90-day spend projection based on moving averages. Plan ahead with confidence.' },
    { icon: <ReceiptText className="h-5 w-5" />, title: 'Tax Dashboard', description: 'YTD GST/PST summary, quarterly estimates, and deduction readiness checker.' },
    { icon: <DollarSign className="h-5 w-5" />, title: 'Multi-Currency', description: 'Handle USD, EUR, and more. Live exchange rates, auto-convert to CAD.' },
    { icon: <Tags className="h-5 w-5" />, title: 'Tags & Labels', description: 'Color-coded tags. Filter by tag. Bulk tag edit for organization.' },
    { icon: <Kanban className="h-5 w-5" />, title: 'Kanban Workflow', description: 'Drag-and-drop approval board. Move receipts through pending → approved → rejected.' },
    { icon: <GitCompare className="h-5 w-5" />, title: 'Receipt Comparison', description: 'Compare two receipts side-by-side. Highlights differences automatically.' },
    { icon: <Repeat className="h-5 w-5" />, title: 'Recurring Detector', description: 'Auto-detect recurring expenses by vendor and amount. Never miss a subscription.' },
    { icon: <FileDown className="h-5 w-5" />, title: 'Bulk Export', description: 'Export to CSV, PDF, ZIP. QBO and Xero formats supported.' },
    { icon: <BarChart3 className="h-5 w-5" />, title: 'Spending Insights', description: 'AI-style observations: busiest spend days, top categories, trends.' },
    { icon: <ClipboardCheck className="h-5 w-5" />, title: 'CRA Readiness Score', description: '0–100 score based on receipt completeness. Know exactly what\'s missing before tax season.' },
    { icon: <ShieldCheck className="h-5 w-5" />, title: 'Audit Trail', description: 'Every action logged. Full audit history for compliance, with paginated search.' },
    { icon: <AlertTriangle className="h-5 w-5" />, title: 'Spend Anomalies', description: 'AI detects unusual spending patterns. Get alerted before small issues become big problems.' },
    { icon: <Route className="h-5 w-5" />, title: 'Mileage Tracking', description: 'Log business trips, calculate CRA mileage rates, export for tax filings.' },
    { icon: <Landmark className="h-5 w-5" />, title: 'Bank Reconciliation', description: 'Auto-match bank transactions to receipts. Spot missing receipts instantly.' },
    { icon: <Building2 className="h-5 w-5" />, title: 'Project Costing', description: 'Assign receipts to projects. See profitability per project in real-time.' },
    { icon: <Wallet className="h-5 w-5" />, title: 'Payables Dashboard', description: 'Track outstanding payments. Color-coded aging: green → amber → red.' },
    { icon: <Mail className="h-5 w-5" />, title: 'Email Forwarding', description: 'Get a unique email address. Forward receipts → they auto-import.' },
    { icon: <Users className="h-5 w-5" />, title: 'Team Approvals', description: 'Multi-user with role-based access. Owners review, employees submit.' },
    { icon: <Moon className="h-5 w-5" />, title: 'Dark Mode', description: 'Light and dark themes, system-aware. Sync preference across devices.' },
    { icon: <ScrollText className="h-5 w-5" />, title: 'CRA-Ready Reports', description: 'Generate T2125 statements, expense summaries, and mileage logs for tax filing.' },
    { icon: <FileSpreadsheet className="h-5 w-5" />, title: 'QBO & Xero Export', description: 'One-click CSV export formatted for QuickBooks Online and Xero.' },
    { icon: <Lightbulb className="h-5 w-5" />, title: 'AI Insights', description: 'AI-generated observations about your spending patterns and trends.' },
    { icon: <Star className="h-5 w-5" />, title: 'Custom Reports', description: 'Build custom reports with date ranges, categories, and metrics. Schedule email delivery.' },
  ];

  const visibleFeatures = showAllFeatures ? features : features.filter(f =>
    ['AI Receipt Scanning', 'CRA Readiness Score', 'Audit Trail',
     'Budget Management', 'Team Approvals', 'Mileage Tracking',
     'Bank Reconciliation', 'Smart Search', 'Multi-Currency',
     'Custom Reports', 'QBO & Xero Export', 'Dark Mode'].includes(f.title)
  );

  function handlePricingClick(planName: string) {
    if (planName === 'Enterprise') {
      window.open('mailto:sales@9starlabs.ca?subject=Enterprise%20Plan%20Inquiry', '_blank');
    } else {
      onGetStarted();
    }
  }

  const pricingPlans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'For solo entrepreneurs testing the waters.',
      features: [
        'Up to 50 receipts/month',
        'AI receipt scanning',
        'Basic search & filters',
        'CSV export',
        'Email support',
      ],
      cta: 'Get Started Free',
    },
    {
      name: 'Pro',
      price: '$19',
      description: 'For growing businesses that need serious tools.',
      features: [
        'Unlimited receipts',
        'AI scanning + email forwarding',
        'Budget management & forecasts',
        'Kanban workflow & approvals',
        'QBO / Xero export',
        'CRA readiness score',
        'Multi-user (up to 5)',
        'Priority email support',
      ],
      highlighted: true,
      cta: 'Start 14-Day Free Trial',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For larger teams with custom needs.',
      features: [
        'Everything in Pro',
        'Unlimited users',
        'Custom integrations',
        'Dedicated account manager',
        'SLA & SSO',
        'On-premise option',
        'Custom branding',
      ],
      cta: 'Contact Sales',
    },
  ];

  const stats = [
    { label: 'Receipts Processed', value: '50K+' },
    { label: 'Canadian Businesses', value: '500+' },
    { label: 'Tax Seasons Supported', value: '3' },
    { label: 'Average Time Saved', value: '8h/mo' },
  ];

  const faqs = [
    { question: 'Is my data stored in Canada?', answer: 'Yes. All data is stored on Canadian servers (Supabase hosted in us-west-1 with Canadian data residency compliance). We follow PIPEDA guidelines and Quebec Law 25 requirements.' },
    { question: 'Can I use this for CRA audits?', answer: 'Absolutely. Every receipt is stored with original image, extracted data, and a full audit trail. You can generate CRA-ready reports including T2125 statements.' },
    { question: 'How does the AI scanning work?', answer: 'Take a photo or forward a receipt email. Our AI extracts vendor name, date, total, tax, and category with high accuracy. You can review and edit before saving.' },
    { question: 'What happens after the free trial?', answer: 'Your 14-day Pro trial gives full access to all features. After it ends, you revert to the free Starter plan unless you subscribe. No data is lost.' },
    { question: 'Can my employees use it too?', answer: 'Yes. Pro plans include up to 5 users with role-based access. Employees can submit receipts; owners approve and export.' },
    { question: 'Do you support multi-currency?', answer: 'Yes. Process receipts in USD, EUR, GBP, and more. We auto-convert to CAD using daily exchange rates.' },
    { question: 'How secure is my data?', answer: 'End-to-end encryption for tokens. AES-256-GCM for sensitive data. SOC 2 compliant infrastructure. Regular security audits.' },
  ];

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <div className="min-h-screen bg-obsidian text-text-primary selection:bg-champagne/30">
      {/* Fixed Header */}
      <motion.header
        style={{ backgroundColor: headerBg, borderColor: headerBorder }}
        className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-champagne/15">
              <ReceiptText className="h-5 w-5 text-champagne" />
            </div>
            <span className="text-sm font-bold tracking-tight">{APP_NAME}</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  const el = document.getElementById(item.href.replace('#', ''));
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={onGetStarted}
              className="rounded-xl bg-champagne px-4 py-2 text-xs font-bold text-obsidian hover:bg-champagne-dim transition"
            >
              Sign In
            </button>
          </nav>

          {/* Mobile hamburger */}
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
                    onClick={() => {
                      setMobileMenuOpen(false);
                      const el = document.getElementById(item.href.replace('#', ''));
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
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

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-36 sm:pb-28">
        {/* Ambient gradients */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-champagne/8 via-champagne/3 to-transparent" />
        <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-champagne/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 top-64 h-[300px] w-[300px] rounded-full bg-champagne/5 blur-[100px]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 text-center">
          {/* Top badge */}
          <motion.div
            variants={slideDown}
            initial="hidden"
            animate="show"
            className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-champagne/20 bg-champagne/5 px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-champagne"
          >
            <Star className="h-3 w-3" /> CRA-Ready Accounting
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
          >
            Receipt Management{' '}
            <span className="bg-gradient-to-r from-champagne to-champagne-dim bg-clip-text text-transparent">
              for Canadian Business
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-sm sm:text-base text-text-muted leading-relaxed"
          >
            Stop worrying about CRA audits. {APP_NAME} automatically extracts, organizes, and
            stores your receipts with AI. Generate tax-ready reports, track budgets, and
            keep your business compliant — all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 rounded-xl bg-champagne px-6 py-3 text-sm font-bold text-obsidian hover:bg-champagne-dim transition shadow-lg shadow-champagne/20 focus:outline-none focus:ring-2 focus:ring-champagne/40"
              aria-label="Start free trial - no credit card required"
            >
              Start Free Trial <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-glass-border bg-surface px-6 py-3 text-sm font-medium text-text-primary hover:bg-surface-hover transition focus:outline-none focus:ring-2 focus:ring-champagne/40"
            >
              View Features <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-champagne">{s.value}</p>
                <p className="mt-1 text-xs text-text-muted">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 sm:py-28 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-champagne mb-3">Everything You Need</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Packed with Features</h2>
            <p className="mt-3 text-sm text-text-muted max-w-xl mx-auto">
              From AI scanning to CRA-ready reports — every tool a Canadian business needs for receipt management.
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {visibleFeatures.map((f) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} />
            ))}
          </motion.div>
          {!showAllFeatures && features.length > 12 && (
            <motion.div {...fadeUp} className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setShowAllFeatures(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-champagne hover:text-champagne-dim transition"
              >
                Show all {features.length} features <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 sm:py-28 bg-gradient-to-b from-transparent via-champagne/[0.02] to-transparent scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-champagne mb-3">Simple Pricing</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">No Surprises. Just Results.</h2>
            <p className="mt-3 text-sm text-text-muted max-w-xl mx-auto">
              Start free. Upgrade when you need more power. Every plan includes core receipt management.
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-start max-w-4xl mx-auto">
            {pricingPlans.map((plan) => (
              <motion.div key={plan.name} variants={staggerVariants} initial="initial" whileInView="animate" viewport={{ once: true }} transition={staggerTransition}>
                <PricingCard {...plan} onGetStarted={() => handlePricingClick(plan.name)} />
              </motion.div>
            ))}
          </motion.div>

          <motion.p {...fadeUp} className="mt-10 text-center text-xs text-text-muted">
            All plans include AES-256-GCM encryption, Canadian data residency, and PIPEDA compliance.
            <br />
            Need a custom plan? <button type="button" onClick={onGetStarted} className="text-champagne hover:underline font-medium">Contact us</button>.
          </motion.p>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.div {...fadeUp}>
            <div className="rounded-3xl border border-champagne/20 bg-gradient-to-br from-champagne/8 to-transparent p-8 sm:p-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Ready to Get CRA-Ready?
              </h2>
              <p className="mt-3 text-sm text-text-muted max-w-lg mx-auto">
                Join hundreds of Canadian businesses that trust {APP_NAME} for their receipt management.
                Start your free trial — no credit card required.
              </p>
              <button
                type="button"
                onClick={onGetStarted}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-champagne px-6 py-3 text-sm font-bold text-obsidian hover:bg-champagne-dim transition shadow-lg shadow-champagne/20"
              >
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 sm:py-28 border-t border-glass-border scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-champagne mb-3">FAQ</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Common Questions</h2>
          </motion.div>

          <motion.div {...fadeUp} className="space-y-0">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-glass-border py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-champagne/15">
                <ReceiptText className="h-3.5 w-3.5 text-champagne" />
              </div>
              <span className="text-xs font-bold tracking-tight text-text-primary">{APP_NAME}</span>
            </div>
            <div className="flex items-center gap-5 text-xs text-text-muted">
              <a href="/terms" className="hover:text-text-primary transition">Terms</a>
              <a href="/privacy" className="hover:text-text-primary transition">Privacy</a>
              <a href="mailto:security@9starlabs.ca" className="hover:text-text-primary transition">Contact</a>
              <span>© {new Date().getFullYear()} 9 Star Labs. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
