/**
 * Smart Categorization Service - AI-powered learning system that improves
 * category predictions based on user corrections and spending patterns.
 */

import type { ReceiptRow } from '@/lib/types';

export interface CategoryPattern {
  vendorPattern: string;
  category: string;
  confidence: number;
  lastCorrected: string;
}

export interface CategorizationSuggestion {
  category: string;
  confidence: number;
  source: 'learned' | 'default' | 'trend';
  reason?: string;
}

const STORAGE_KEY = 'category-patterns';
const MAX_PATTERNS = 500;

/**
 * Get learned category patterns from localStorage
 */
export function getLearnedPatterns(): CategoryPattern[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save a category correction to improve future predictions
 */
export function learnFromCorrection(
  vendorName: string,
  correctedCategory: string,
): void {
  if (!vendorName) return;

  const patterns = getLearnedPatterns();
  const normalizedVendor = vendorName.toLowerCase().trim();

  // Find existing pattern or create new one
  const existingIndex = patterns.findIndex(p =>
    p.vendorPattern.includes(normalizedVendor) ||
    normalizedVendor.includes(p.vendorPattern)
  );

  if (existingIndex >= 0) {
    // Boost confidence for existing pattern
    patterns[existingIndex].confidence = Math.min(0.99, patterns[existingIndex].confidence + 0.1);
    patterns[existingIndex].lastCorrected = new Date().toISOString();
    patterns[existingIndex].category = correctedCategory;
  } else {
    // Add new pattern
    patterns.push({
      vendorPattern: normalizedVendor,
      category: correctedCategory,
      confidence: 0.85,
      lastCorrected: new Date().toISOString(),
    });
  }

  // Prune old patterns
  if (patterns.length > MAX_PATTERNS) {
    patterns.sort((a, b) => b.confidence - a.confidence);
    patterns.length = MAX_PATTERNS;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
}

/**
 * Get category suggestion for a receipt
 */
export function getCategorySuggestion(
  receipt: Pick<ReceiptRow, 'vendor_name' | 'total_amount' | 'transaction_date'>,
): CategorizationSuggestion {
  const patterns = getLearnedPatterns();

  // Check learned patterns first
  if (receipt.vendor_name) {
    const vendorLower = receipt.vendor_name.toLowerCase().trim();
    const learnedMatch = patterns.find(p =>
      vendorLower.includes(p.vendorPattern) ||
      p.vendorPattern.includes(vendorLower)
    );

    if (learnedMatch && learnedMatch.confidence > 0.7) {
      return {
        category: learnedMatch.category,
        confidence: learnedMatch.confidence,
        source: 'learned',
        reason: `Based on ${learnedMatch.vendorPattern} pattern`,
      };
    }
  }

  // Default fallback with trend awareness
  const defaultCategory = getDefaultCategory(receipt.vendor_name);
  return {
    category: defaultCategory,
    confidence: 0.65,
    source: 'default',
  };
}

/**
 * Get default category based on vendor name patterns
 */
function getDefaultCategory(vendorName?: string): string {
  if (!vendorName) return 'Uncategorized';

  const vendor = vendorName.toLowerCase();

  // Restaurant patterns
  if (/restaurant|cafe|cafe|diner|burger|pizza|taco|bar|pub|food/.test(vendor)) {
    return 'Meals & Entertainment';
  }

  // Gas/Auto patterns
  if (/gas|petro|shell|esso|honda|toyota|ford|chevrolet|car|auto|repair|tire/.test(vendor)) {
    return 'Vehicle';
  }

  // Office supply patterns
  if (/office|staples|furniture|desk|chair|supply|paper|ink/.test(vendor)) {
    return 'Office';
  }

  // Travel patterns
  if (/hotel|airline|uber|lyft|taxi|travel|flight|airways/.test(vendor)) {
    return 'Travel';
  }

  // Professional services
  if (/legal|accountant|consult|design|marketing|software|saas/.test(vendor)) {
    return 'Professional Services';
  }

  return 'Uncategorized';
}

/**
 * Get category suggestions with trend analysis
 */
export function getTrendBasedSuggestions(
  receipts: ReceiptRow[],
): Map<string, number> {
  const categoryCounts = new Map<string, number>();

  receipts.forEach(r => {
    const cat = r.category || 'Uncategorized';
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  });

  return categoryCounts;
}