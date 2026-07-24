'use client'

import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { fadeUp } from '@/lib/animations';

/**
 * Generic skeleton for feature pages that matches the design system's layout
 * - PageHeader with title and subtitle
 * - 2-column grid of cards matching the expected content shape
 * - Supports variants for fade-up animation
 */
export function FeaturePageSkeleton({
  numberOfCards = 2,
  showFullWidthCard = false,
}: {
  numberOfCards?: number;
  showFullWidthCard?: boolean;
}) {
  // Generate skeleton cards
  const cards = Array.from({ length: numberOfCards }, (_, i) => (
    <motion.div
      key={i}
      variants={fadeUp}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: fadeUp }}
      className="rounded-[2.5rem] border bg-surface p-6 space-y-4"
      role="status"
      aria-live="polite"
    >
      <Skeleton className="h-6 w-1/2 rounded-[2rem]" />
      <Skeleton className="h-24 w-full rounded-[2rem]" />
      <Skeleton className="h-10 w-1/3 rounded-[2rem]" />
    </motion.div>
  ));

  // Generate skeleton cards that take full width
  const fullWidthCards = Array.from({ length: 2 }, (_, i) => (
    <motion.div
      key={`fw-${i}`}
      variants={fadeUp}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: fadeUp }}
      className="rounded-[2.5rem] border bg-surface p-6 space-y-4"
      role="status"
      aria-live="polite"
    >
      <Skeleton className="h-6 w-1/2 rounded-[2rem]" />
      <Skeleton className="h-24 w-full rounded-[2rem]" />
      <Skeleton className="h-10 w-1/3 rounded-[2rem]" />
    </motion.div>
  ));

  // Generate static skeletons for charts
  const chartSkeletons = [
    <div key="1" className="rounded-[2.5rem] border bg-surface">{' '}</div>,
    <div key="2" className="rounded-[2.5md] border bg-surface p-2">{' '}</div>,
    <div key="3" className="rounded-[2.5rem] border bg-surface p-2">{' '}</div>
  ];

  return (
    <div className="space-y-5">
      {/* Header section */}
      {/* Placeholder for PageHeader - will be replaced with actual header in page component */}
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-4">
        {/* Cards */}
        {cards}
        
        {/* Full width cards */}
        {showFullWidthCard && fullWidthCards}
        
        {/* Chart skeletons */}
        {chartSkeletons}
      </div>
    </div>
  );
}