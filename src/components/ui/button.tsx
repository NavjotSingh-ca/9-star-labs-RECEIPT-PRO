'use client';

import { Button as DesignButton, type ButtonProps as DesignButtonProps } from '@design/primitives';
import { cn } from '@design/utils';

/**
 * Button — Thin wrapper delegating to @design/primitives/Button.
 * Maps old CVA variant/size names to new design variants.
 */

const variantMap: Record<string, DesignButtonProps['variant']> = {
  default: 'primary',
  secondary: 'secondary',
  outline: 'outline',
  ghost: 'ghost',
  destructive: 'danger',
  link: 'ghost',
};

const sizeMap: Record<string, DesignButtonProps['size']> = {
  default: 'md',
  xs: 'sm',
  sm: 'sm',
  lg: 'lg',
  icon: 'icon',
  'icon-xs': 'icon',
  'icon-sm': 'icon',
  'icon-lg': 'icon',
};

function Button({
  className,
  variant = 'default',
  size = 'default',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  children,
  type = 'button',
  ...props
}: React.ComponentProps<'button'> & {
  variant?: keyof typeof variantMap;
  size?: keyof typeof sizeMap;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}) {
  const mappedVariant = variantMap[variant] ?? 'primary';
  const mappedSize = sizeMap[size] ?? 'md';

  return (
    <DesignButton
      variant={mappedVariant}
      size={mappedSize}
      loading={loading}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      fullWidth={fullWidth}
      disabled={disabled}
      className={cn(fullWidth && 'w-full', className)}
      type={type}
      {...props}
    >
      {children}
    </DesignButton>
  );
}

// Re-export Button for compatibility (buttonVariants is no-op for legacy imports)
export { Button };
export const buttonVariants = () => '';