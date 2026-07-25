'use client';

import { Badge as DesignBadge, type BadgeProps as DesignBadgeProps } from '@design/primitives';

/**
 * Badge — Thin wrapper delegating to @design/primitives/Badge.
 * Maps old variant names to new design variants.
 */

const variantMap: Record<string, DesignBadgeProps['variant']> = {
  default: 'default',
  secondary: 'default',
  destructive: 'danger',
  outline: 'outline',
  ghost: 'default',
  link: 'champagne',
};

function Badge({
  className,
  variant = 'default',
  render,
  children,
  ...props
}: React.ComponentProps<'span'> & { variant?: keyof typeof variantMap; render?: React.ReactNode }) {
  const mappedVariant = variantMap[variant] ?? 'default';

  return (
    <DesignBadge variant={mappedVariant} className={className || ''} {...props}>
      {render ?? children}
    </DesignBadge>
  );
}

// Re-export Badge for compatibility (badgeVariants is no longer used)
export { Badge };
export const badgeVariants = () => ''; // No-op for any legacy imports