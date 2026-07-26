'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { MagneticCTA } from '@/ui/components/MagneticCTA';

const pricingPlans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'For solo entrepreneurs testing the waters.',
    features: ['Up to 50 receipts/month', 'AI receipt scanning', 'Basic search & filters', 'CSV export', 'Email support'],
    cta: 'Get Started Free',
  },
  {
    name: 'Pro',
    price: '$19',
    description: 'For growing businesses that need serious tools.',
    features: ['Unlimited receipts', 'AI scanning + email forwarding', 'Budget management & forecasts', 'Kanban workflow & approvals', 'QBO / Xero export', 'CRA readiness score', 'Multi-user (up to 5)', 'Priority email support'],
    highlighted: true,
    cta: 'Start 14-Day Free Trial',
    priceDetail: '/month, billed annually',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For larger teams with custom needs.',
    features: ['Everything in Pro', 'Unlimited users', 'Custom integrations', 'Dedicated account manager', 'SLA & SSO', 'On-premise option', 'Custom branding'],
    cta: 'Contact Sales',
  },
];

export function PricingSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section id="pricing" className="relative py-24 sm:py-32 scroll-mt-20 overflow-hidden">
      <div className="pointer-events-none absolute left-1/3 -top-32 w-96 h-96 bg-champagne/8 rounded-full blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute -right-32 bottom-1/3 w-80 h-80 bg-champagne/4 rounded-full blur-[100px]" aria-hidden />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            No Surprises. <span className="bg-gradient-to-r from-champagne to-champagne-dim bg-clip-text text-transparent">Just Results.</span>
          </h2>
          <p className="text-base text-text-muted/80 max-w-xl mx-auto">
            Start free. Upgrade when you need more power. Every plan includes core receipt management.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={`relative rounded-2xl border p-8 transition-all duration-300 h-full flex flex-col ${plan.highlighted
                ? 'border-champagne/40 bg-card shadow-2xl shadow-champagne/10 scale-105 z-10'
                : 'border-glass-border bg-card hover:shadow-lg hover:border-glass-border-hover'
              }`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-champagne px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-obsidian">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight tabular-nums text-text-primary">{plan.price}</span>
                  {plan.price !== 'Custom' && plan.priceDetail && <span className="text-xs text-text-muted">{plan.priceDetail}</span>}
                </div>
                <p className="mt-2 text-sm text-text-muted/80">{plan.description}</p>
                <ul className="mt-5 space-y-2.5 flex-grow">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <MagneticCTA
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                  icon={ArrowRight}
                  onClick={() => {
                    if (plan.name === 'Enterprise') {
                      window.open('mailto:sales@9starlabs.ca?subject=Enterprise%20Plan%20Inquiry', '_blank');
                    } else {
                      onGetStarted();
                    }
                  }}
                  className="mt-6 w-full"
                >
                  {plan.cta}
                </MagneticCTA>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 text-center text-sm text-text-muted/70"
        >
          All plans include AES-256-GCM encryption, Canadian data residency, and PIPEDA compliance.
        </motion.p>
      </div>
    </section>
  );
}

export default PricingSection;