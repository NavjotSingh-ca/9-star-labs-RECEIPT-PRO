'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap } from 'lucide-react';

/**
 * PremiumHero - Animated hero section with premium feel
 * Includes gradient backgrounds and micro-interactions
 */
export default function PremiumHero() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32" aria-label="Hero section">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-champagne/5 via-transparent to-emerald-light/5" />
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--champagne)_0%,_transparent_50%)] bg-[size:1000px] bg-center"
        />
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-surface px-4 py-2 mb-6">
            <Shield className="h-4 w-4 text-emerald-light" aria-hidden="true" />
            <span className="text-xs font-semibold text-text-secondary">SOC 2 Type II Ready</span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-text-primary lg:text-6xl">
            Receipt Management Made <span className="text-champagne">Intelligent</span>
          </h1>

          <p className="mt-6 text-lg text-text-secondary max-w-2xl">
            AI-powered expense tracking built for Canadian businesses. CRA-compliant, audit-ready,
            and designed to save you hours every month.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-champagne px-6 py-3.5 text-base font-bold text-obsidian transition hover:bg-champagne-dim shadow-lg shadow-champagne/20 focus:outline-none focus:ring-2 focus:ring-champagne/40"
              aria-label="Start free trial"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-glass-border bg-surface px-6 py-3.5 text-base font-medium text-text-primary transition hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-champagne/40"
              aria-label="Watch demo"
            >
              <Zap className="h-5 w-5 text-warning" aria-hidden="true" />
              Watch Demo
            </button>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 grid grid-cols-3 gap-8 border-t border-glass-border pt-8"
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-champagne">168</p>
              <p className="text-xs text-text-muted">Tests Passing</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-champagne">23+</p>
              <p className="text-xs text-text-muted">Features Built</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-champagne">50+</p>
              <p className="text-xs text-text-muted">Improvements Added</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}