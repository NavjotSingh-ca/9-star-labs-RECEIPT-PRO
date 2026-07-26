'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { features } from '@/lib/feature-content';
import { FeatureCard } from './FeatureCard';

const featuredFeature = features[0];
const gridFeatures = features.slice(1, 9);

export function FeaturesSection() {
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
            <FeatureCard
              featured={true}
              icon={featuredFeature.icon}
              title={featuredFeature.title}
              description={featuredFeature.longDescription}
              benefits={featuredFeature.benefits}
              link={`/features/${featuredFeature.id}`}
              linkText="Learn more"
            />
          </motion.div>
        )}

        {/* Bento grid: 2-col on desktop, asymmetric sizing */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 scroll-mt-20"
        >
          {gridFeatures.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className={i === 0 || i === gridFeatures.length - 1 ? 'lg:col-span-2' : ''}
            >
              <FeatureCard
                icon={f.icon}
                title={f.title}
                description={f.shortDescription}
                benefits={f.benefits}
                link={`/features/${f.id}`}
                linkText="Learn more"
              />
            </motion.div>
          ))}
        </motion.div>

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
            See all {features.length} features
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4-4 4" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default FeaturesSection;