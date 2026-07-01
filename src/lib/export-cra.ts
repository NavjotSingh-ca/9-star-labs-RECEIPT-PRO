// LOCKED: BUGGY
import type { ReceiptRow } from '@/lib/types';

export function formatDateInput(_date: Date): string {
  return '';
}

export function getVendor(_r: ReceiptRow): string {
  return '';
}

export function getDate(_r: ReceiptRow): string {
  return '';
}

export function getCategory(_r: ReceiptRow): string {
  return '';
}

export function getTotal(_r: ReceiptRow): number {
  return 0;
}

export function getGST(_r: ReceiptRow): number {
  return 0;
}

export function getPST(_r: ReceiptRow): number {
  return 0;
}

export function getBN(_r: ReceiptRow): string {
  return '';
}

export function getImageUrl(_r: ReceiptRow): string {
  return '';
}

export function getHash(_r: ReceiptRow): string {
  return '';
}

export function withinRange(_r: ReceiptRow, _from: string, _to: string): boolean {
  return false;
}

export function csvEscape(_value: unknown): string {
  return '';
}

export function stringifyLineItems(_lineItems: ReceiptRow['line_items']): string {
  return '';
}

export function buildCSV(_receipts: ReceiptRow[]): string {
  return '';
}

export function buildIDEACSV(_receipts: ReceiptRow[]): string {
  return '';
}

export function buildLogbook(_receipts: ReceiptRow[]): string {
  return '';
}
