'use client';

import { motion } from 'framer-motion';
import { ReceiptText, ShieldCheck, Fingerprint, TrendingUp } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

const brandFeatures = [
  { icon: ShieldCheck, label: 'SHA-256 Integrity', desc: 'Tamper-evident audit chain' },
  { icon: Fingerprint, label: 'AI-Powered', desc: 'Smart categorization & fraud detection' },
  { icon: TrendingUp, label: 'CRA-Ready', desc: 'One-click compliance exports' },
];

export default function BrandPanel() {
  return (
    <div className="hidden lg:flex w-1/2 min-h-screen flex-col justify-between p-12 xl:p-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-champagne/15 shadow-[0_0_20px_-4px_rgba(190,169,142,0.2)]">
          <ReceiptText className="h-6 w-6 text-champagne" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">{APP_NAME}</h1>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-champagne">CRA-ready records</p>
        </div>
      </motion.div>

      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Receipt intelligence
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-champagne to-champagne-dim">
              built for Canada
            </span>
          </h2>
          <p className="text-lg text-text-secondary max-w-md leading-relaxed">
            Enterprise-grade receipt capture with SHA-256 integrity, CRA compliance scoring, and structured audit
            exports for Canadian businesses and their accountants.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid gap-3"
        >
          {brandFeatures.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 backdrop-blur-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-champagne/10 text-champagne">
                <f.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{f.label}</p>
                <p className="text-xs text-text-muted">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="text-xs text-text-muted"
      >
        &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </motion.p>
    </div>
  );
}
