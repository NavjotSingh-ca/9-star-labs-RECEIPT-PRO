'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

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

function getFeatureIcon(name: string) {
  const icons: Record<string, React.ReactNode> = {
    Camera: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2m0 0h.01M17 21a2 2 0 01-2-2m4 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m4 0h.01M17 7h.01" /></svg>,
    BarChart3: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    ShieldCheck: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Users: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  };
  return icons[name] || icons.Camera;
}

export function FeatureHighlights() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {highlights.map((feat, index) => (
            <motion.div
              key={feat.icon}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="text-left"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-champagne/10 text-champagne transition-all duration-300 hover:bg-champagne/20 hover:scale-105">
                {getFeatureIcon(feat.icon)}
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2 transition-colors hover:text-champagne">{feat.title}</h3>
              <p className="text-sm text-text-muted/80 leading-relaxed mb-2">{feat.description}</p>
              <div className="text-xs font-semibold text-champagne">{feat.benefit}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeatureHighlights;