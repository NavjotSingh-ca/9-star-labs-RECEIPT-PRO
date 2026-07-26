'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Check, Sparkles, Share2, ChevronUp,
  Camera, CalendarDays, Store, PiggyBank, TrendingUp,
  ReceiptText, DollarSign, Tags, Kanban, GitCompare, Repeat,
  FileDown, BarChart3, ClipboardCheck, ShieldCheck, AlertTriangle,
  Route, Landmark, Building2, Wallet, Mail, Users, Moon,
  ScrollText, FileSpreadsheet, Lightbulb, Star,
} from 'lucide-react';
import { features, getFeatureBySlug } from '@/lib/feature-content';
import type { LucideProps } from 'lucide-react';

// Icon components for dynamic rendering (same as LandingPage)
const iconComponents: Record<string, React.ComponentType<LucideProps>> = {
  Camera, CalendarDays, Store, PiggyBank, TrendingUp,
  ReceiptText, DollarSign, Tags, Kanban, GitCompare, Repeat,
  FileDown, BarChart3, ClipboardCheck, ShieldCheck, AlertTriangle,
  Route, Landmark, Building2, Wallet, Mail, Users, Moon,
  ScrollText, FileSpreadsheet, Lightbulb, Star,
};

function getFeatureIcon(iconName: string): React.ComponentType<LucideProps> {
  return iconComponents[iconName] || Camera;
}

export default function FeatureDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  const feature = useMemo(() => getFeatureBySlug(slug), [slug]);
  const related = useMemo(
    () => feature?.relatedFeatures.map((id) => features.find((f) => f.id === id)).filter(Boolean) || [],
    [feature],
  );

  const [, setVisibleSections] = useState<Set<string>>(new Set());

  // IntersectionObserver for section reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.1 }
    );

    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (!feature) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Feature Not Found</h1>
          <p className="text-sm text-text-muted mb-6">The feature you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/features"
            className="inline-flex items-center gap-2 rounded-xl bg-champagne px-4 py-2 text-sm font-bold text-obsidian"
          >
            <ArrowLeft className="h-4 w-4" /> All Features
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-champagne text-text-secondary selection:bg-champagne/30">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-glass-border bg-obsidian/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/features" className="flex items-center gap-2 text-xs text-text-muted hover:text-text-primary transition">
            <ArrowLeft className="h-3.5 w-3.5" /> All Features
          </Link>
          <Link href="/" className="text-xs text-text-muted hover:text-text-primary transition">
            Home
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Hero */}
          <div id="hero" className="mb-16 animate-in fade-in slide-up-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 rounded-full bg-champagne/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-champagne mb-6 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" /> Feature
            </div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                {feature.title}
              </h1>
              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${feature.title} - Leduc Receipt Pro`,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
                className="flex items-center gap-2 rounded-lg border border-glass-border bg-card px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover transition"
                title="Share this feature"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            </div>
            <p className="text-base sm:text-lg text-text-muted/80 leading-relaxed max-w-3xl">
              {feature.longDescription}
            </p>
          </div>

          {/* Benefits */}
          <div id="benefits" data-reveal className="mb-16 rounded-2xl border border-champagne/15 bg-champagne/[0.02] p-6 sm:p-8 animate-in fade-in slide-up-from-bottom-4 duration-700">
            <h2 className="text-sm font-bold uppercase tracking-widest text-champagne mb-4 flex items-center gap-2">
              <Check className="h-4 w-4" /> Key Benefits
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {feature.benefits.map((b, i) => (
                <div key={b} className="flex items-start gap-2.5 animate-in fade-in slide-up-from-bottom-2 duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-success/20">
                    <Check className="h-3 w-3 text-emerald-success" />
                  </div>
                  <span className="text-sm text-text-secondary">{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detail sections */}
          <div className="space-y-24">
            {feature.sections.map((section, idx) => (
              <div key={section.title} id={`section-${idx}`} data-reveal className="relative animate-in fade-in slide-up-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="absolute -left-8 top-0 hidden sm:block">
                  <span className="text-[80px] font-black text-champagne/[0.04] leading-none select-none">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="relative">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="mt-2 h-8 w-[3px] shrink-0 rounded-full bg-champagne/60 animate-in fade-in slide-up-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 100 + 50}ms` }} />
                    <div>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-text-primary">
                        {section.title}
                      </h2>
                    </div>
                  </div>
                  <p className="text-sm text-text-muted/80 leading-relaxed ml-7">{section.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Related Features */}
          {related.length > 0 && (
            <div id="related" data-reveal className="mt-20 pt-12 border-t border-glass-border animate-in fade-in slide-up-from-bottom-4 duration-700">
              <h2 className="text-lg font-bold tracking-tight text-text-primary mb-6">Related Features</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {related.map((rf) =>
                  rf ? (
                    <Link
                      key={rf.id}
                      href={`/features/${rf.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-glass-border bg-card p-4 transition-all hover:border-champagne/30 hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-champagne/10 text-champagne group-hover:bg-champagne/20 transition-colors">
                        {React.createElement(getFeatureIcon(rf.icon), { className: 'h-4 w-4' })}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-text-primary group-hover:text-champagne transition-colors truncate">
                          {rf.title}
                        </p>
                        <p className="text-[10px] text-text-muted/60 truncate">{rf.shortDescription}</p>
                      </div>
                      <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-champagne opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                    </Link>
                  ) : null,
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          <div id="cta" data-reveal className="mt-20 text-center animate-in fade-in slide-up-from-bottom-4 duration-700">
            <div className="rounded-3xl border border-champagne/20 bg-gradient-to-br from-champagne/8 to-transparent p-8 sm:p-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                Ready to try {feature.title}?
              </h2>
              <p className="text-sm text-text-muted/80 max-w-lg mx-auto mb-6">
                Start your free trial today — no credit card required. Full access to all features for 14 days.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-champagne px-6 py-3 text-sm font-bold text-obsidian hover:bg-champagne-dim transition shadow-lg shadow-champagne/20"
              >
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-glass-border/50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 flex items-center justify-between">
          <Link href="/features" className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition group">
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" /> All Features
          </Link>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-champagne transition group"
          >
            <ChevronUp className="h-3 w-3 group-hover:-translate-y-0.5 transition-transform" /><span className="group-hover:text-champagne">Back to top</span>
          </button>
        </div>
      </footer>
    </div>
  );
}