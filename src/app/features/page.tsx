'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, ArrowRight, ArrowLeft, Sparkles,
  Camera, CalendarDays, Store, PiggyBank, TrendingUp, ReceiptText,
  DollarSign, Tags, Kanban, GitCompare, Repeat, FileDown, BarChart3,
  ClipboardCheck, ShieldCheck, AlertTriangle, Route, Landmark, Building2,
  Wallet, Mail, Users, Moon, ScrollText, FileSpreadsheet, Lightbulb, Star,
} from 'lucide-react';
import { features } from '@/lib/feature-content';
import type { LucideProps } from 'lucide-react';

// Icon component mapping matching LandingPage's pattern
const iconComponents: Record<string, React.ComponentType<LucideProps>> = {
  Camera, Search, CalendarDays, Store, PiggyBank, TrendingUp,
  ReceiptText, DollarSign, Tags, Kanban, GitCompare, Repeat,
  FileDown, BarChart3, ClipboardCheck, ShieldCheck, AlertTriangle,
  Route, Landmark, Building2, Wallet, Mail, Users, Moon,
  ScrollText, FileSpreadsheet, Lightbulb, Star,
};

function getFeatureIcon(iconName: string): React.ComponentType<LucideProps> {
  return iconComponents[iconName] || Search;
}

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

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="min-h-screen bg-champagne text-text-primary selection:bg-champagne/30">
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
            className="text-xs font-medium text-text-muted hover:text-text-primary transition"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <main className="pt-20 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center mb-12 animate-in fade-in slide-up-from-bottom-4 duration-700">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Every Tool You Need to{' '}
              <span className="bg-gradient-to-r from-champagne to-champagne-dim bg-clip-text text-transparent">
                Master Your Receipts
              </span>
            </h1>
            <p className="mt-4 text-sm text-text-muted/80 max-w-2xl mx-auto">
              {features.length} powerful features designed for Canadian businesses. From AI-powered scanning
              to CRA-ready tax reports — all in one platform.
            </p>
          </div>

          {/* Search + Filters */}
          <div className="max-w-2xl mx-auto mb-10 space-y-4 animate-in fade-in slide-up-from-bottom-4 duration-700 delay-100">
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

          {/* Feature Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((f, i) => {
              const IconComp = getFeatureIcon(f.icon);
              return (
                <Link
                  key={f.id}
                  href={`/features/${f.id}`}
                  className="group block relative rounded-2xl border border-glass-border bg-card p-5 h-full transition-all duration-500 hover:border-champagne/30 hover:shadow-xl hover:shadow-champagne/5 hover:-translate-y-1 animate-in fade-in slide-up-from-bottom-4 duration-500"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-champagne/10 text-champagne group-hover:bg-champagne/20 group-hover:scale-110 transition-all duration-400">
                    {React.createElement(IconComp, { className: 'h-5 w-5' })}
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
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 animate-in fade-in duration-500">
              <p className="text-sm text-text-muted">No features match your search. Try a different filter.</p>
            </div>
          )}

          {filtered.length > 0 && activeCategory === 'All' && !searchQuery && (
            <p className="mt-8 text-center text-xs text-text-muted/50 animate-in fade-in duration-500 delay-300">
              Showing all {features.length} features. Use the filters above to browse by category.
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-glass-border py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="text-xs text-text-muted hover:text-text-primary transition group flex items-center gap-1">
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Home
          </Link>
          <span className="text-xs text-text-muted/50">© {new Date().getFullYear()} 9 Star Labs</span>
        </div>
      </footer>
    </div>
  );
}