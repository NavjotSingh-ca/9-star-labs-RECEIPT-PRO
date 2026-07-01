'use client';

import { FeatureLocked } from '@/components/FeatureLocked';

import type { ReceiptRow } from '@/lib/types';

interface BankReconciliationProps {
  receipts: ReceiptRow[];
}

export type BankRow = {
  id: string;
  date: string;
  description: string;
  amount: number;
  matched_receipt_id?: string | null;
  is_reconciled?: boolean;
};

export default function BankReconciliation(_props: BankReconciliationProps) {
  return <FeatureLocked name="BankReconciliation (BUGGY)" />;
}
