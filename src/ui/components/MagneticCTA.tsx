'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/ui/utils/cn';

interface MagneticCTAProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  disabled?: boolean;
}

export function MagneticCTA({
  children,
  onClick,
  href,
  variant = 'primary',
  className = '',
  icon: Icon,
  disabled = false,
}: MagneticCTAProps) {
  const reduce = useReducedMotion();
  const [isHovered, setIsHovered] = React.useState(false);

  const baseStyles = cn(
    'relative inline-flex items-center justify-center gap-2.5',
    'rounded-full px-8 py-3.5 text-sm font-bold',
    'transition-all duration-300 ease-[0.32,0.72,0,1]',
    'focus:outline-none focus:ring-2 focus:ring-champagne/40 focus:ring-offset-2 focus:ring-offset-obsidian',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    className,
  );

  const variantStyles: Record<string, string> = {
    primary: cn(
      'bg-champagne text-obsidian',
      'shadow-xl shadow-champagne/20',
      'hover:bg-champagne-dim hover:shadow-champagne/30 hover:-translate-y-0.5',
      'active:scale-[0.98]',
    ),
    secondary: cn(
      'border border-glass-border bg-white/[0.03] text-text-primary',
      'backdrop-blur-sm',
      'hover:bg-white/[0.06] hover:border-champagne/20 hover:-translate-y-0.5',
      'active:scale-[0.98]',
    ),
    ghost: cn(
      'bg-transparent text-text-primary hover:text-champagne',
      'hover:bg-champagne/5 hover:-translate-y-0.5',
      'active:scale-[0.98]',
    ),
  };

  const sharedClassName = cn(baseStyles, variantStyles[variant] || variantStyles.primary);

  const handleClick = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
  ) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.();
  };

  const handleMouseEnter = () => !reduce && setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const iconElement = Icon ? (
    <motion.span
      className={cn(
        'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
        'bg-black/5 dark:bg-white/10',
        'transition-transform duration-300 ease-[0.32,0.72,0,1]',
      )}
      animate={isHovered && !reduce ? { x: 4, scale: 1.1 } : { x: 0, scale: 1 }}
      transition={{ ease: [0.32, 0.72, 0, 1] }}
    >
      <Icon className="h-4 w-4" />
    </motion.span>
  ) : null;

  if (href) {
    return (
      <a
        href={href}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={sharedClassName}
        aria-disabled={disabled}
      >
        <span className="relative z-10">{children}</span>
        {iconElement}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      className={sharedClassName}
      aria-disabled={disabled}
    >
      <span className="relative z-10">{children}</span>
      {iconElement}
    </button>
  );
}

export default MagneticCTA;