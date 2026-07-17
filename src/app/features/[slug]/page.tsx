'use client';

import { useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowLeft, ArrowRight, Check, Sparkles, Zap,
} from 'lucide-react';
import { features, getFeatureBySlug } from '@/lib/feature-content';
import SmoothScroll from '@/components/SmoothScroll';

gsap.registerPlugin(ScrollTrigger);

export default function FeatureDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  const feature = useMemo(() => getFeatureBySlug(slug), [slug]);
  const related = useMemo(
    () => feature?.relatedFeatures.map((id) => features.find((f) => f.id === id)).filter(Boolean) || [],
    [feature],
  );

  // Parallax scroll
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroParallax = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // GSAP section reveals
  const sectionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sectionsRef.current) return;
    const ctx = gsap.context(() => {
      const items = sectionsRef.current?.querySelectorAll('[data-reveal]');
      items?.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el as HTMLElement,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          },
        );
      });
    }, sectionsRef);
    return () => ctx.revert();
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
    <SmoothScroll>
    <div className="min-h-screen bg-obsidian text-text-primary selection:bg-champagne/30">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-glass-border bg-obsidian/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/features"
            className="flex items-center gap-2 text-xs text-text-muted hover:text-champagne transition-all group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" /> All Features
          </Link>
          <Link
            href="/"
            className="text-xs text-text-muted hover:text-champagne transition"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Cinematic Hero */}
      <section ref={heroRef} className="relative min-h-[50vh] flex items-center overflow-hidden pt-20">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-champagne/[0.03] via-transparent to-obsidian" />
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-radial from-champagne/[0.02] to-transparent"
          style={{ y: heroParallax, opacity: heroOpacity }}
        />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-champagne/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-champagne mb-6 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" /> Feature
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]"
          >
            {feature.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="mx-auto mt-6 max-w-3xl text-sm sm:text-base text-text-muted/90 leading-relaxed"
          >
            {feature.longDescription}
          </motion.p>
        </div>
      </section>

      {/* Benefits Strip */}
      <section className="border-y border-glass-border/50 py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {feature.benefits.map((b, i) => (
              <motion.div
                key={b}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="flex items-start gap-2.5"
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-success/20">
                  <Check className="h-3 w-3 text-emerald-success" />
                </div>
                <span className="text-xs sm:text-sm text-text-secondary">{b}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detail Sections */}
      <section ref={sectionsRef} className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="space-y-24">
            {feature.sections.map((section, idx) => (
              <div
                key={section.title}
                data-reveal
                className="relative"
              >
                {/* Section number */}
                <div className="absolute -left-8 top-0 hidden sm:block">
                  <span className="text-[80px] font-black text-champagne/[0.04] leading-none select-none">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="relative">
                  {/* Section heading with accent bar */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="mt-2 h-8 w-[3px] shrink-0 rounded-full bg-champagne/60" />
                    <div>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-text-primary">
                        {section.title}
                      </h2>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-text-muted/80 leading-relaxed ml-7">
                    {section.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Features */}
      {related.length > 0 && (
        <section className="border-t border-glass-border/50 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-lg font-bold tracking-tight text-center mb-8">
                Explore Related Features
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {related.map((rf) =>
                  rf ? (
                    <Link
                      key={rf.id}
                      href={`/features/${rf.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-glass-border bg-card p-4 transition-all duration-300 hover:border-champagne/30 hover:shadow-lg hover:shadow-champagne/5 hover:-translate-y-0.5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-champagne/10 text-champagne group-hover:bg-champagne/20 transition-colors">
                        <Zap className="h-4 w-4" />
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
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative rounded-3xl border border-champagne/20 bg-gradient-to-br from-champagne/10 via-champagne/5 to-transparent p-8 sm:p-14 text-center overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-champagne/5 to-transparent opacity-50" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
                Ready to try{' '}
                <span className="bg-gradient-to-r from-champagne to-champagne-dim bg-clip-text text-transparent">
                  {feature.title}
                </span>
                ?
              </h2>
              <p className="text-sm text-text-muted/80 max-w-lg mx-auto mb-6">
                Start your free trial today — no credit card required. Full access to all features for 14 days.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-champagne px-6 py-3 text-sm font-bold text-obsidian hover:bg-champagne-dim transition-all shadow-xl shadow-champagne/20 hover:shadow-champagne/30 hover:-translate-y-0.5"
              >
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-glass-border/50 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex items-center justify-between">
          <Link
            href="/features"
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-champagne transition group"
          >
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" /> All Features
          </Link>
          <span className="text-xs text-text-muted/50">
            {' '}9 Star Labs
          </span>
        </div>
      </footer>
    </div>
    </SmoothScroll>
  );
}
