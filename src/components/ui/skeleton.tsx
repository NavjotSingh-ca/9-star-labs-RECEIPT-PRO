'use client';

import { Skeleton as DesignSkeleton } from '@design/primitives';

/**
 * Skeleton — Thin wrapper delegating to @design/primitives/Skeleton.
 * The old API was simple: just className + div props.
 * The new one adds variant, width, height, lines. We pass through.
 */

function Skeleton({ className, style, ...props }: React.ComponentProps<'div'>) {
  return <DesignSkeleton variant="rectangular" className={className} style={style} {...props} />;
}

export { Skeleton };