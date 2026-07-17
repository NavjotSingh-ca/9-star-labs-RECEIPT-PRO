'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Search, ArrowRight, ArrowLeft, Sparkles,
} from 'lucide-react';
import { features } from '@/lib/feature-content';
import { fadeUp } from '@/lib/animations';
import SmoothScroll from '@/components/SmoothScroll';

gsap.registerPlugin(ScrollTrigger);

const CATEGORIES = [
  'All',
  'Scanning & Import',
  'Organization & Search',
  'Financial Management',
  'Tax & Compliance',
  'Team & Workflow',
  'Export & Integration',
] as const;

const featureCategory: Record<string, string> = {
  'ai-receipt-scanning': 'Scanning & Import',
  'email-forwarding': 'Scanning & Import',
  'smart-search': 'Organization & Search',
  'receipt-calendar': 'Organization & Search',
  'tags-labels': 'Organization & Search',
  'vendor-analytics': 'Financial Management',
  'budget-management': 'Financial Management',
  'cash-flow-forecast': 'Financial Management',
  'spending-insights': 'Financial Management',
  'multi-currency': 'Financial Management',
  'payables-dashboard': 'Financial Management',
  'project-costing': 'Financial Management',
  'tax-dashboard': 'Tax & Compliance',
  'cra-readiness-score': 'Tax & Compliance',
  'cra-reports': 'Tax & Compliance',
  'mileage-tracking': 'Tax & Compliance',
  'spend-anomalies': 'Tax & Compliance',
  'audit-trail': 'Tax & Compliance',
  'kanban-workflow': 'Team & Workflow',
  'team-approvals': 'Team & Workflow',
  'receipt-comparison': 'Team & Workflow',
  'bank-reconciliation': 'Team & Workflow',
  'dark-mode': 'Team & Workflow',
  'bulk-export': 'Export & Integration',
  'qbo-xero-export': 'Export & Integration',
  'ai-insights': 'Financial Management',
  'custom-reports': 'Export & Integration',
  'recurring-detector': 'Financial Management',
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.12 },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 24, mass: 0.9 } },
};

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect(() => {
    const cards = document.querySelectorAll('[data-feature-card]');
    if (!cards.length) return;
    const ctx = gsap.context(() => {
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 30, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card as HTMLElement,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            },
          },
        );
      });
    });
    return () => ctx.revert();
  }, [activeCategory, searchQuery]);

  const filtered = useMemo(() => {
    return features.filter((f) => {
      const matchesCategory = activeCategory === 'All' || featureCategory[f.id] === activeCategory;
      const matchesSearch = !searchQuery ||
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <SmoothScroll>
    <div className="min-h-screen bg-obsidian text-text-primary selection:bg-champagne/30">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-glass-border bg-obsidian/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-champagne/15 group-hover:bg-champagne/25 transition-colors">
              <Sparkles className="h-4 w-4 text-champagne" />
            </div>
            <span className="text-sm font-bold tracking-tight">All Features</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-text-muted hover:text-champagne transition"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Cinematic Hero */}
      <section ref={heroRef} className="relative min-h-[40vh] flex items-center overflow-hidden pt-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-champagne/[0.03] via-transparent to-obsidian" />
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-radial from-champagne/[0.02] to-transparent"
          style={{ opacity: heroOpacity }}
        />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-champagne/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-champagne mb-6 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" /> {features.length} Features
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
          >
            Every Tool You Need to{' '}
            <span className="bg-gradient-to-r from-champagne to-champagne-dim bg-clip-text text-transparent">
              Master Your Receipts
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-4 text-sm text-text-muted/80 max-w-2xl mx-auto"
          >
            From AI-powered scanning to CRA-ready tax reports — 28 powerful features designed for Canadian businesses.
          </motion.p>
        </div>
      </section>

      {/* Search + Filters */}
      <section className="border-b border-glass-border/50 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search features..."
                className="w-full rounded-2xl border border-glass-border bg-surface pl-11 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-champagne/40 focus:border-champagne/40 transition"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-champagne text-obsidian shadow-lg shadow-champagne/20'
                      : 'bg-surface text-text-muted hover:bg-surface-raised hover:text-text-primary border border-glass-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {filtered.map((f) => (
              <motion.div key={f.id} variants={staggerItem}>
                <Link
                  href={`/features/${f.id}`}
                  data-feature-card
                  className="group block relative rounded-2xl border border-glass-border bg-card p-5 h-full transition-all duration-500 hover:border-champagne/30 hover:shadow-xl hover:shadow-champagne/5 hover:-translate-y-1"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-champagne/10 text-champagne group-hover:bg-champagne/20 group-hover:scale-110 transition-all duration-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-text-primary mb-1.5 group-hover:text-champagne transition-colors duration-300">
                    {f.title}
                  </h3>
                  <p className="text-xs text-text-muted/80 leading-relaxed line-clamp-2">
                    {f.shortDescription}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-champagne opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 inline-flex items-center gap-0.5">
                      Learn more <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    {featureCategory[f.id] && (
                      <span className="ml-auto text-[9px] text-text-muted/40 uppercase tracking-wider">
                        {featureCategory[f.id]}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {filtered.length === 0 && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="text-center py-16"
            >
              <p className="text-sm text-text-muted">No features match your search. Try a different filter.</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-glass-border/50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="text-xs text-text-muted hover:text-champagne transition group flex items-center gap-1">
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Home
          </Link>
          <span className="text-xs text-text-muted/50"> 9 Star Labs</span>
        </div>
      </footer>
    </div>
    </SmoothScroll>
  );
}
