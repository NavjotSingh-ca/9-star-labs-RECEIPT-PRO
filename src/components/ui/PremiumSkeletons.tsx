'use client';

import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-4">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-[2rem]" />
          <Skeleton className="h-8 w-64 rounded-[2rem]" />
        </div>
        <Skeleton className="h-10 w-40 rounded-[3rem]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Skeleton className="h-40 w-full rounded-[3rem]" />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 w-full lg:col-span-2 rounded-[3rem]" />
        <Skeleton className="h-80 w-full rounded-[2.5rem]" />
      </div>
    </div>
  );
}

export function ReceiptTableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64 rounded-[2rem]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-[2rem]" />
          <Skeleton className="h-10 w-10 rounded-[2rem]" />
        </div>
      </div>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Skeleton className="h-20 w-full rounded-[2rem]" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-[2.5rem] border bg-card p-6 space-y-4">
      <Skeleton className="h-6 w-1/2 rounded-[2rem]" />
      <Skeleton className="h-24 w-full rounded-[2rem]" />
      <Skeleton className="h-10 w-1/3 rounded-[2rem]" />
    </div>
  );
}

export function ScannerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-[3rem] border bg-card p-8 text-center space-y-6">
        <Skeleton className="mx-auto h-20 w-20 rounded-[3rem]" />
        <div className="space-y-2">
          <Skeleton className="mx-auto h-6 w-48 rounded-[2rem]" />
          <Skeleton className="mx-auto h-4 w-64 rounded-[2rem]" />
        </div>
        <div className="flex justify-center gap-4">
          <Skeleton className="h-12 w-32 rounded-[3rem]" />
          <Skeleton className="h-12 w-32 rounded-[3rem]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-32 w-full rounded-[2.5rem]" />
        <Skeleton className="h-32 w-full rounded-[2.5rem]" />
      </div>
    </div>
  );
}
