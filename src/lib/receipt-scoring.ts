export interface BreakdownEntry {
  weight: number
  passed: boolean
  suggestion?: string
}
export interface ScoreResult {
  score: number
  breakdown: Record<string, BreakdownEntry>
}

interface ReceiptForScoring {
  business_number?: string | null
  line_items?: Array<{
    tax_rate?: number
    [key: string]: unknown
  }> | null
  tax_breakdown?: {
    rates?: unknown[]
  } | Array<unknown> | null
  transaction_date?: string | null
  image_quality_score?: number | null
  imageQualityScore?: number | null
  subtotal?: number | null
  tax_amount?: number | null
  pst_amount?: number | null
  total_amount?: number | null
}

export function calculateCompletenessScore(receipt: ReceiptForScoring): ScoreResult {
  const criteria: Record<string, BreakdownEntry> = {
    business_number: {
      weight: 20,
      passed: Boolean(receipt.business_number?.trim?.()),
    },
    line_items: {
      weight: 20,
      passed: Array.isArray(receipt.line_items) && receipt.line_items.length > 0,
    },
    tax_breakdown: {
      weight: 20,
      passed: Boolean(
        (typeof receipt?.tax_breakdown === 'object' && receipt.tax_breakdown !== null && 'rates' in receipt.tax_breakdown && Array.isArray(receipt.tax_breakdown.rates) && receipt.tax_breakdown.rates.length > 0) ||
        (Array.isArray(receipt?.tax_breakdown) && receipt?.tax_breakdown.length > 0) ||
        (Array.isArray(receipt?.line_items) &&
          receipt?.line_items.some((li) => typeof li?.tax_rate === 'number' && li.tax_rate > 0)
        )
      ),
    },
    receipt_date: {
      weight: 10,
      passed: Boolean(
        /^\d{4}-\d{2}-\d{2}$/.test(receipt.transaction_date ?? '') &&
        !Number.isNaN(new Date(receipt.transaction_date ?? '').getTime())
      ),
    },
    image_quality: {
      weight: 15,
      passed: (() => {
        const iq = Number(receipt.image_quality_score ?? receipt.imageQualityScore ?? 0)
        return iq >= 50 || (iq >= 0.5 && iq <= 1)
      })(),
    },
    math_balance: {
      weight: 15,
      passed: (() => {
        const sub = Number(receipt.subtotal ?? 0)
        const tax = Number(receipt.tax_amount ?? 0) + Number(receipt.pst_amount ?? 0)
        const total = Number(receipt.total_amount ?? 0)
        const sum = sub + tax
        return Math.abs(sum - total) <= 0.02
      })(),
    },
  }

  let totalScore = 0
  for (const key of Object.keys(criteria))
    if (criteria[key].passed) totalScore += criteria[key].weight

  return { score: totalScore, breakdown: criteria }
}