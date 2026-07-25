'use client';

import { Skeleton, SkeletonCard } from '@design/primitives';
import { motion } from 'framer-motion';
import { springSnap } from '@/lib/animations';

/** Full dashboard loading state with skeleton cards and chart placeholders */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-4">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-4 w-32" />
          <Skeleton variant="text" className="h-8 w-64" />
        </div>
        <Skeleton variant="text" className="h-10 w-40" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, ...springSnap }}
          >
            <SkeletonCard />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton variant="card" className="h-80 w-full lg:col-span-2" />
        <Skeleton variant="card" className="h-80 w-full" />
      </div>
    </div>
  );
}

/** Loading state for the receipt table (search bar + 6 rows) */
export function ReceiptTableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="h-10 w-64" />
        <div className="flex gap-2">
          <Skeleton variant="circular" className="h-10 w-10" />
          <Skeleton variant="circular" className="h-10 w-10" />
        </div>
      </div>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, ...springSnap }}
          >
            <Skeleton variant="card" className="h-20 w-full" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** Single card skeleton for grid layouts */
export function CardSkeleton() {
  return <SkeletonCard />;
}

/** Scanner page loading state with camera and form placeholders */
export function ScannerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-[3rem] border bg-surface p-8 text-center space-y-6">
        <Skeleton variant="circular" className="mx-auto h-20 w-20" />
        <div className="space-y-2">
          <Skeleton variant="text" className="mx-auto h-6 w-48" />
          <Skeleton variant="text" className="mx-auto h-4 w-64" />
        </div>
        <div className="flex justify-center gap-4">
          <Skeleton variant="text" className="h-12 w-32" />
          <Skeleton variant="text" className="h-12 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton variant="card" className="h-32 w-full" />
        <Skeleton variant="card" className="h-32 w-full" />
      </div>
    </div>
  );
}