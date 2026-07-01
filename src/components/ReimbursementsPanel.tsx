'use client';

import { FeatureLocked } from '@/components/FeatureLocked';

import type { UserRole } from '@/lib/types';

interface ReimbursementsPanelProps {
  role: UserRole;
}

export default function ReimbursementsPanel(_props: ReimbursementsPanelProps) {
  return <FeatureLocked name="ReimbursementsPanel (UNSTABLE)" />;
}
