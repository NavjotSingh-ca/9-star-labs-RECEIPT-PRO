'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Owner, Maple Accounting',
    quote: 'Saved me 15 hours during tax season. The CRA readiness score caught issues I would have missed.',
    rating: 5,
  },
  {
    name: 'Michael Dubois',
    role: 'Freelance Contractor',
    quote: 'Finally a receipt app that understands Canadian tax. The QBO export alone is worth the price.',
    rating: 5,
  },
  {
    name: 'Jennifer Park',
    role: 'Small Business Owner',
    quote: 'The AI scanning is scarily accurate. I barely need to edit anything — just snap and go.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-24 sm:py-32 border-t border-glass-border overflow-hidden">
      <div className="pointer-events-none absolute -left-32 bottom-0 w-96 h-96 bg-champagne/6 rounded-full blur-[120px]" aria-hidden />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Trusted by Canadian Businesses</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="rounded-2xl border border-glass-border bg-card p-6 h-full">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-champagne text-champagne" />
                  ))}
                </div>
                <svg className="h-6 w-6 text-champagne/30 mb-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.477-.582-2.917-1.179zM15.583 17.321c-1.03-1.094-1.583-2.321-1.583-4.31 0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C20.591 11.69 22 13.166 22 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.477-.582-2.917-1.179z" />
                </svg>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-champagne/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-champagne">{t.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">{t.name}</p>
                    <p className="text-[10px] text-text-muted">{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;