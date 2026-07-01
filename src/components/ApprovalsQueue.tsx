'use client';

import { FeatureLocked } from '@/components/FeatureLocked';

import type { UserRole } from '@/lib/types';

interface ApprovalsQueueProps {
  role: UserRole;
}

export default function ApprovalsQueue(_props: ApprovalsQueueProps) {
  return <FeatureLocked name="ApprovalsQueue (UNSTABLE)" />;
}
