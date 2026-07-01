'use client';

import { FeatureLocked } from '@/components/FeatureLocked';

import type { ReceiptRow } from '@/lib/types';

interface ExportProps {
  receipts: ReceiptRow[];
}

export default function Export(_props: ExportProps) {
  return <FeatureLocked name="Export (BUGGY)" />;
}
