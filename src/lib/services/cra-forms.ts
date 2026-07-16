import type { ReceiptRow } from '@/lib/types';

/** Supported CRA tax forms */
export type CRAFormType = 'T2125' | 'T777' | 'T1068' | 'T2036' | 'T2125-Q';

/** Quebec Law 25 compliance metadata */
export interface QuebecLaw25Metadata {
  french_description: string;
  french_vendor_name: string;
  french_notes: string;
  requires_bn_validation: boolean;
}

/**
 * Extended CRA form data with Quebec Law 25 compliance support.
 */
export interface ExtendedCRAFormData {
  receiptCount: number;
  dateRange: { from: string; to: string };
  totalBusinessExpenses: number;
  totalGSTPaid: number;
  totalPSTPaid: number;
  mileageTotalDeduction: number;
  mileageTotalKm: number;
  expensesByCategory: Array<{ category: string; total: number; gst: number; pst: number; receiptCount: number }>;
  mileageByVehicle: Array<{ vehicleNickname: string; km: number; amount: number }>;
  topVendors: Array<{ vendor_name: string; business_number: string; total: number; receiptCount: number }>;
  receipts: ReceiptRow[];
  // Quebec Law 25 French compliance
  quebecCompliant?: boolean;
  missingFrenchTranslation?: boolean;
  quebecMetadata?: Record<string, QuebecLaw25Metadata>;
}

/**
 * Calculate GST/HST rates by province for accurate ITC claims.
 * Returns the applicable GST/HST rate for a given province.
 */
export function getProvincialTaxRate(province?: string): number {
  const rates: Record<string, number> = {
    AB: 0,      // No PST
    BC: 0.07,   // 7% PST
    MB: 0.07,   // 7% PST
    SK: 0.06,   // 6% PST
    ON: 0.08,   // 8% HST
    QC: 0.09975, // 9.975% HST (2025-2026)
    NS: 0.10,   // 10% HST
    NB: 0.10,   // 10% HST
    NL: 0.10,   // 10% HST
    PE: 0.10,   // 10% HST
    NT: 0,      // No PST
    NU: 0,      // No PST
    YT: 0,      // No PST
  };
  return rates[province || ''] || 0;
}

/**
 * Calculate GST/HST recoverable for a receipt based on vendor province.
 */
export function calculateGSTRecoverable(receipt: ReceiptRow): { gst: number; hst: number; pst: number } {
  const province = receipt.vendor_address?.split(', ').pop()?.toUpperCase() || '';
  const pstRate = getProvincialTaxRate(province);

  // GST is always 5% recoverable on business expenses
  const gst = Number(receipt.tax_amount || 0) * 0.5;

  // For provinces with HST, the calculation is different
  const hst = ['ON', 'QC', 'NS', 'NB', 'NL', 'PE'].includes(province)
    ? Number(receipt.tax_amount || 0) * (pstRate / (pstRate + 0.05)) * 0.05 / pstRate
    : 0;

  // PST recoverable varies by province
  const pst = Number(receipt.pst_amount || 0);

  return { gst, hst, pst };
}

/**
 * Check Quebec Law 25 compliance for French language requirements.
 * Organizations in Quebec must have French descriptions for audit purposes.
 */
export function checkQuebecCompliance(receipts: ReceiptRow[]): { compliant: number; nonCompliant: ReceiptRow[] } {
  const quebecReceipts = receipts.filter(r =>
    r.vendor_address?.toUpperCase().includes('QC') ||
    r.vendor_address?.toUpperCase().includes('QUEBEC') ||
    r.business_number?.toUpperCase()?.startsWith('1234567890') // Quebec business registry pattern
  );

  const compliant = quebecReceipts.filter(r =>
    r.notes?.toUpperCase().includes('FR') || false
  ).length;

  const nonCompliant = quebecReceipts.filter(r => !r.notes?.toUpperCase().includes('FR'));

  return { compliant, nonCompliant };
}

/**
 * Generate T1068 (Employee GST/HST Credit) supporting data.
 * Shows how business expenses reduce eligible credit amounts.
 */
export function generateT1068Support(
  receipts: ReceiptRow[],
  netBusinessIncome: number,
  employmentExpenses: number
): {
  netBusinessIncome: number;
  employmentExpensesDeducted: number;
  suggestedCreditReduction: number;
} {
  // Simplified calculation - actual CRA formula is more complex
  const suggestedCreditReduction = Math.min(Math.abs(netBusinessIncome) * 0.025, 500);

  return {
    netBusinessIncome,
    employmentExpensesDeducted: employmentExpenses,
    suggestedCreditReduction,
  };
}

/**
 * Generate T2036 (Provincial Tax Credits) supporting data.
 * Required for Quebec residents to claim provincial tax credits.
 */
export function generateT2036Support(
  receipts: ReceiptRow[],
  _province: string = 'QC'
): {
  medicalExpenses: number;
  charitableDonations: number;
  educationAmounts: number;
  totalCredits: number;
} {
  const medical = receipts
    .filter(r => r.category?.toLowerCase().includes('medical') || r.category?.toLowerCase().includes('sante'))
    .reduce((sum, r) => sum + Number(r.total_amount || 0), 0);

  const charitable = receipts
    .filter(r => r.category?.toLowerCase().includes('charity') || r.category?.toLowerCase().includes('charitable'))
    .reduce((sum, r) => sum + Number(r.total_amount || 0), 0);

  const education = receipts
    .filter(r => r.category?.toLowerCase().includes('education') || r.category?.toLowerCase().includes('formation'))
    .reduce((sum, r) => sum + Number(r.total_amount || 0), 0);

  return {
    medicalExpenses: medical,
    charitableDonations: charitable,
    educationAmounts: education,
    totalCredits: medical + charitable + education,
  };
}