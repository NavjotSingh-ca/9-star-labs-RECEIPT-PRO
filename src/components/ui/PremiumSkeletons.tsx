'use client';

import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-4">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-8 w-64 rounded-full" />
        </div>
        <Skeleton className="h-10 w-40 rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Skeleton className="h-40 w-full rounded-[2.5rem]" />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 w-full lg:col-span-2 rounded-[2.5rem]" />
        <Skeleton className="h-80 w-full rounded-[2.5rem]" />
      </div>
    </div>
  );
}

export function ReceiptTableSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64 rounded-2xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
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
            <Skeleton className="h-20 w-full rounded-2xl" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
