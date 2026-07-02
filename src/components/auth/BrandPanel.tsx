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
    <div className="relative hidden lg:flex w-1/2 min-h-screen flex-col justify-between p-12 xl:p-16 overflow-hidden">
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Radial glow at bottom */}
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-champagne/5 blur-[120px] pointer-events-none" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 flex items-center gap-3"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-champagne/15 ring-1 ring-champagne/20 ring-inset shadow-[0_0_25px_-6px_rgba(190,169,142,0.2)]">
          <ReceiptText className="h-6 w-6 text-champagne" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">{APP_NAME}</h1>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-champagne/70">CRA-ready records</p>
        </div>
      </motion.div>

      {/* Hero content */}
      <div className="relative z-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="space-y-4"
        >
          <h2 className="text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.08]">
            Receipt intelligence
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-champagne via-champagne-dim to-champagne/60">
              built for Canada
            </span>
          </h2>
          <p className="text-base xl:text-lg text-text-secondary/70 max-w-md leading-relaxed">
            Enterprise-grade receipt capture with SHA-256 integrity, CRA compliance scoring, and structured audit
            exports for Canadian businesses and their accountants.
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
          className="grid gap-2.5"
        >
          {brandFeatures.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.12, ease: 'easeOut' }}
              className="group relative flex items-center gap-3.5 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:border-champagne/15 hover:bg-white/[0.04] hover:shadow-[0_0_30px_-8px_rgba(190,169,142,0.15)]"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-champagne/0 via-champagne/[0.02] to-champagne/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-champagne/10 text-champagne transition-all duration-300 group-hover:bg-champagne/15 group-hover:shadow-[0_0_15px_-4px_rgba(190,169,142,0.2)]">
                <f.icon className="h-4 w-4" />
              </div>
              <div className="relative z-10">
                <p className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors duration-200">{f.label}</p>
                <p className="text-xs text-text-muted/70 group-hover:text-text-muted transition-colors duration-200">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="relative z-10 text-xs text-zinc-600"
      >
        &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </motion.p>
    </div>
  );
}
