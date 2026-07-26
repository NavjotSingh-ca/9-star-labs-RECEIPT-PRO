'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/ui/primitives/Button';
import { Clock, ShieldCheck } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

export function CTASection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-32 w-96 h-96 bg-champagne/10 rounded-full blur-[120px]" aria-hidden />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl border border-champagne/20 bg-gradient-to-br from-champagne/10 via-champagne/5 to-transparent p-12 sm:p-16 text-center overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-champagne/5 to-transparent opacity-50" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-champagne/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-champagne mb-6">
              <Clock className="h-3 w-3" /> No credit card required
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Ready to Get <span className="bg-gradient-to-r from-champagne to-champagne-dim bg-clip-text text-transparent">CRA-Ready?</span>
            </h2>
            <p className="text-base text-text-muted/80 max-w-lg mx-auto mb-8">
              Join hundreds of Canadian businesses that trust {APP_NAME} for their receipt management.
              Start your free trial — no credit card required.
            </p>
            <Button
              size="lg"
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 rounded-xl bg-champagne px-8 py-3.5 text-sm font-bold text-obsidian hover:bg-champagne-dim transition shadow-xl shadow-champagne/20"
            >
              <ShieldCheck className="h-4 w-4" /> Start Free Trial
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default CTASection;