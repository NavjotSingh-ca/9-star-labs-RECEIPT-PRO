'use client';

import { Card as DesignCard, CardHeader as DesignCardHeader, CardTitle as DesignCardTitle, CardDescription as DesignCardDescription, CardContent as DesignCardContent, CardFooter as DesignCardFooter } from '@design/primitives';
import { cn } from '@design/utils';

/**
 * Card — Thin wrapper delegating to @design/primitives/Card.
 * Preserves old API with size prop.
 */

function Card({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return (
    <DesignCard
      variant="default"
      padding={size === 'sm' ? 'sm' : 'md'}
      className={cn(className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <DesignCardHeader className={cn('mb-4', className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return <DesignCardTitle className={cn('text-lg font-semibold text-text-primary', className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <DesignCardDescription className={cn('mt-1 text-sm text-text-muted', className)} {...props} />;
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  // Not directly supported in new Card, just render div
  return <div className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <DesignCardContent className={cn('pt-0', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <DesignCardFooter className={cn('mt-4 flex items-center gap-2', className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };