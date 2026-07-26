'use client';

import { useState } from 'react';
import { cn } from '@/ui/utils/cn';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits?: readonly string[];
  link?: string;
  linkText?: string;
  featured?: boolean;
  className?: string;
  onClick?: () => void;
}

export function FeatureCard({
  icon,
  title,
  description,
  benefits = [],
  link,
  linkText = 'Learn more',
  featured = false,
  className,
  onClick,
}: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const cardContent = (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-champagne/10 text-champagne transition-all duration-300 group-hover:bg-champagne/20 group-hover:scale-105">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2 transition-colors hover:text-champagne">{title}</h3>
      <p className="text-sm text-text-muted/80 leading-relaxed mb-4 flex-1">{description}</p>
      {benefits.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {benefits.map((benefit, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-champagne/8 px-3 py-1 text-[10px] font-medium text-champagne">
              <span className="h-1.5 w-1.5 rounded-full bg-champagne" />
              {benefit}
            </span>
          ))}
        </div>
      )}
      {(link || onClick) && (
        <div className="mt-auto pt-4 border-t border-glass-border">
          <button
            onClick={onClick}
            className="group inline-flex items-center gap-1 text-xs font-semibold text-champagne opacity-0 group-hover:opacity-100 transition-all duration-200 hover:text-champagne-dim"
            aria-label={`Learn more about ${title}`}
          >
            {linkText}
            <motion.span
              className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-200"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4-4 4" />
              </svg>
            </motion.span>
          </button>
        </div>
      )}
    </div>
  );

  if (featured) {
    return (
      <motion.article
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -8, scale: 1.02, boxShadow: '0 20px 40px -10px rgba(190,169,142,0.15)' }}
        className={cn(
          'group relative rounded-2xl border p-6 sm:p-8 transition-all duration-500 ease-[0.32,0.72,0,1]',
          'border-champagne/20 bg-gradient-to-br from-champagne/8 via-card to-champagne/5 shadow-xl shadow-champagne/5',
          'hover:border-champagne/30 hover:shadow-champagne/10',
          className
        )}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-champagne/5 via-transparent to-transparent opacity-0"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 300 }}
        />
        <div className="relative z-10">{cardContent}</div>
      </motion.article>
    );
  }

  return (
    <motion.article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4, scale: 1.01, boxShadow: '0 12px 24px -8px rgba(190,169,142,0.1)' }}
      className={cn(
        'group relative rounded-2xl border bg-card p-6 transition-all duration-300 ease-[0.32,0.72,0,1]',
        'border-glass-border hover:border-champagne/30 hover:shadow-lg hover:shadow-champagne/5',
        className
      )}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div className="relative z-10">{cardContent}</div>
    </motion.article>
  );
}

export default FeatureCard;