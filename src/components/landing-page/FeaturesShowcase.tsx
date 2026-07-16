'use client';

import React from 'react';
import { Shield, Brain, Bot, BarChart3, Lock, Smartphone } from 'lucide-react';
import AnimatedFeatureCard from '@/components/ui/AnimatedFeatureCard';
import StaggeredGrid from '@/components/ui/StaggeredGrid';

/**
 * FeaturesShowcase - Premium feature showcase with staggered animations
 */
export default function FeaturesShowcase() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Scanning',
      description: 'Gemini 2.5 Flash extracts data with 99% accuracy. Save hours of manual entry.',
      highlight: true,
    },
    {
      icon: Shield,
      title: 'CRA-Ready Compliance',
      description: 'SOC 2 Type II architecture with 7-year retention. Your data is audit-proof.',
    },
    {
      icon: Bot,
      title: 'Automagic Matching',
      description: 'Bank reconciliation suggests matches. Multi-currency support built-in.',
    },
    {
      icon: BarChart3,
      title: 'Tax Optimization',
      description: 'Discover hidden deductions. Quarterly breakdowns and predictions.',
    },
    {
      icon: Lock,
      title: 'Military-Grade Security',
      description: 'AES-256-GCM encryption. SHA-256 immutable logs for every action.',
    },
    {
      icon: Smartphone,
      title: 'PWA Offline Mode',
      description: 'Works offline, syncs when online. Mobile-first design.',
    },
    {
      icon: Shield,
      title: 'Fraud Prevention',
      description: 'AI detects suspicious patterns. Protect your business from losses.',
    },
    {
      icon: BarChart3,
      title: 'Spending Insights',
      description: 'Predictive analytics show where money goes. Budget alerts prevent overruns.',
    },
  ];

  return (
    <section className="py-24 lg:py-32" aria-label="Features">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-text-primary lg:text-4xl">
            Built for Modern Business
          </h2>
          <p className="mt-4 text-text-secondary">
            Every feature solves a real Canadian business pain point.
          </p>
        </div>

        <StaggeredGrid className="mt-12 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <AnimatedFeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              highlight={feature.highlight}
              delay={i * 0.1}
            />
          ))}
        </StaggeredGrid>
      </div>
    </section>
  );
}