'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/ui/utils/cn';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

interface FAQSectionProps {
  className?: string;
}

const faqs = [
  { question: 'Is my data stored in Canada?', answer: 'Yes. All data is stored on Canadian servers (Supabase hosted in us-west-1 with Canadian data residency compliance). We follow PIPEDA guidelines and Quebec Law 25 requirements.' },
  { question: 'Can I use this for CRA audits?', answer: 'Absolutely. Every receipt is stored with original image, extracted data, and a full audit trail. You can generate CRA-ready reports including T2125 statements, expense summaries, and mileage logs for tax filing.' },
  { question: 'How does the AI scanning work?', answer: 'Take a photo or forward a receipt email. Our AI extracts vendor name, date, total, tax, and category with high accuracy. You can review and correct before saving.' },
  { question: 'What happens after the free trial?', answer: 'Your 14-day Pro trial gives full access to all features. After it ends, you revert to the free Starter plan unless you subscribe. No data is lost.' },
  { question: 'Can my employees use it too?', answer: 'Yes. Pro plans include up to 5 users with role-based access. Employees submit receipts, managers review, owners approve. Custom roles available on Enterprise plan.' },
  { question: 'How secure is my data?', answer: 'End-to-end encryption for tokens. AES-256-GCM for sensitive data. We implement SOC 2-style controls including access logging, data retention policies, and regular internal security reviews.' },
];

export function FAQSection({ className }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <section id="faq" className={cn('relative py-24 sm:py-32 border-t border-glass-border scroll-mt-20', className)}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Common Questions</h2>
        </motion.div>

        <div className="space-y-0">
          {faqs.map((faq, i) => (
            <FAQItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer, isOpen, onToggle }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-glass-border py-4 group">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between list-none cursor-pointer text-left"
      >
        <span className="text-base font-semibold text-text-primary group-hover:text-champagne transition-colors pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <ChevronDown className="h-5 w-5 shrink-0 text-text-muted" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 text-sm text-text-muted/80 leading-relaxed pb-2">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FAQSection;