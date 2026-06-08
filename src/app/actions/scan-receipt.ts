'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { env } from '@/lib/env';
import { logError, logInfo, logWarn } from '@/lib/logger';

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// CRIT-5: Input validation schema — now enforced at function entry
const scanReceiptInputSchema = z.object({
  base64Image: z.string().max(6_000_000, 'Image too large. Maximum 4MB after encoding.'),
  captureSource: z.enum(['camera', 'upload', 'screenshot', 'email_screenshot']).default('camera')
});

export interface ReceiptLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_amount: number;
  line_total: number;
}

export interface ScannedReceiptData {
  vendor_name: string;
  vendor_address: string;
  business_number: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  pst_amount: number;
  card_last_four: string;
  transaction_date: string;
  transaction_time: string;
  payment_method: string;
  payment_reference: string;
  category: string;
  notes: string;
  confidence_score: number;
  cra_readiness_score: number;
  thermal_warning: boolean;
  document_type: 'receipt' | 'invoice' | 'statement' | 'unknown';
  duplicate_warning: boolean;
  duplicate_hash: string;
  math_mismatch_warning: boolean;
  missing_bn_warning: boolean;
  fraud_suspicion: boolean;
  fraud_reason: string;
  currency: string;
  line_items: ReceiptLineItem[];
}

interface ScanSuccess {
  success: true;
  data: ScannedReceiptData;
}

interface ScanFailure {
  success: false;
  error: string;
}

export type ScanReceiptResult = ScanSuccess | ScanFailure;

const CURRENT_YEAR = new Date().getFullYear();

/* ─── Alberta Construction Taxonomy ─── */
const VALID_CATEGORIES = [
  'Job Materials',
  'Subcontractors',
  'Site Fuel',
  'Equipment Rental',
  'Small Tools',
  'Vehicle Maintenance',
  'Travel/Lodging',
  'Office/Admin',
] as const;

type ValidCategory = (typeof VALID_CATEGORIES)[number];

const SMART_PURPOSE: Record<ValidCategory, string> = {
  'Job Materials': 'Materials purchased for a specific job or project',
  'Subcontractors': 'Payment to subcontractor for contracted work on a project',
  'Site Fuel': 'Fuel purchased for equipment or vehicles',
  'Equipment Rental': 'Equipment rental for project operations',
  'Small Tools': 'Small tools and consumables purchased for field operations',
  'Vehicle Maintenance': 'Vehicle maintenance and repair for company fleet',
  'Travel/Lodging': 'Business travel and lodging expense',
  'Office/Admin': 'Office and administrative expense supporting business operations',
};

const PROVINCE_TAX: Record<string, { gst: number; pst: number }> = {
  AB: { gst: 0.05, pst: 0.0 },
  BC: { gst: 0.05, pst: 0.07 },
  MB: { gst: 0.05, pst: 0.07 },
  SK: { gst: 0.05, pst: 0.06 },
  ON: { gst: 0.05, pst: 0.08 },
  QC: { gst: 0.05, pst: 0.09975 },
  NS: { gst: 0.05, pst: 0.1 },
  NB: { gst: 0.05, pst: 0.1 },
  NL: { gst: 0.05, pst: 0.1 },
  PE: { gst: 0.05, pst: 0.1 },
  NT: { gst: 0.05, pst: 0.0 },
  NU: { gst: 0.05, pst: 0.0 },
  YT: { gst: 0.05, pst: 0.0 },
};

function buildPrompt(captureSource: string = 'camera'): string {
  let contextPrompt = '';
  if (captureSource === 'email_screenshot') {
    contextPrompt = `
CONTEXT: This is a DIGITAL EMAIL SCREENSHOT.
- Prioritize extracting digital invoice numbers, order IDs, and vendor contact emails.
- Extract the vendor name exactly as it appears in the header or "From" field.
- Digital receipts often have clearer metadata than paper ones.`;
  }

  return `You are an elite Canadian receipt API with built-in fraud and anomaly detection. 
Analyze this document image and return a single JSON object matching this exact schema:
{
  "vendor_name": "string",
  "vendor_address": "full address including city, province, postal code",
  "vendor_tax_number": "GST/BN number e.g. 123456789RT0001, or empty string",
  "total_amount": 0.00,
  "subtotal": 0.00,
  "tax_amount": 0.00,
  "pst_amount": 0.00,
  "transaction_date": "YYYY-MM-DD",
  "transaction_time": "HH:MM",
  "payment_method": "Visa | Mastercard | Amex | Debit | Cash | E-Transfer | Cheque | Unknown",
  "card_last_four": "last 4 digits if visible",
  "category": "${VALID_CATEGORIES.join(' | ')}",
  "currency": "CAD | USD | other",
  "confidence_score": 0 (confidence 0-100),
  "thermal_warning": false (true if receipt is faded/thermal),
  "fraud_suspicion": false (true if out of policy, weird vendor, impossible math, or AI fake),
  "fraud_reason": "string (explain why if fraud_suspicion is true, else empty)",
  "document_type": "Receipt | Invoice | Estimate | Statement",
  "line_items": [
    {
      "description": "string",
      "quantity": 1,
      "unit_price": 0.00,
      "tax_amount": 0.00,
      "line_total": 0.00
    }
  ]
}

${contextPrompt}

Rules:
- Extract EVERY line item visible.
- If tax amounts are physically printed wrong or subtotal+tax != total, flag it.
- For Alberta vendors (no PST), set pst_amount to 0.
- If you suspect this is an AI-generated fake receipt (perfect fonts, metadata anomalies), set fraud_suspicion=true.
- Dates must be YYYY-MM-DD. Assume ${CURRENT_YEAR} if ambiguous.
- RETURN ONLY THE JSON OBJECT. No markdown, no fences.`;
}

function preparePayload(raw: string): { data: string; mimeType: string } {
  // Support both images AND PDFs
  const dataUri = raw.match(/^data:((?:image\/(?:jpeg|jpg|png|webp|gif))|(?:application\/pdf));base64,([\s\S]+)$/i);
  if (dataUri) {
    const mime = dataUri[1].toLowerCase().replace('image/jpg', 'image/jpeg');
    return { mimeType: mime, data: dataUri[2].replace(/\s/g, '') };
  }
  return { mimeType: 'image/jpeg', data: raw.replace(/\s/g, '') };
}

function parseSafely(raw: string): Record<string, unknown> {
  const cleanFences = raw.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(cleanFences); } catch { /* continue */ }

  const start = cleanFences.indexOf('{');
  const end = cleanFences.lastIndexOf('}');
  
  if (start !== -1 && end > start) {
    let extracted = cleanFences.slice(start, end + 1);
    try { return JSON.parse(extracted); } catch { /* continue */ }
    extracted = extracted.replace(/,\s*([}\]])/g, '$1');
    try { return JSON.parse(extracted); } catch { /* continue */ }
    extracted = extracted.replace(/\r?\n|\r/g, ' ');
    try { return JSON.parse(extracted); } catch { /* throw below */ }
  }
  throw new Error(`[Debug: failed to parse JSON]`);
}

function toNum(v: unknown): number {
  const n = parseFloat(typeof v === 'string' ? v.replace(/[^0-9.-]/g, '') : String(v ?? ''));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

function toStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function normalizeDate(raw: string): string {
  const s = raw.trim();
  if (!s) return todayISO();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Try common Canadian formats (MM/DD/YYYY or DD/MM/YYYY)
  const mdy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (mdy) {
    const [, m, d, y] = mdy;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }

  const longDate = new Date(s);
  if (!isNaN(longDate.getTime())) return longDate.toISOString().split('T')[0];

  return todayISO();
}

function computeCRAScoreForSave(data: {
  vendor_name: string;
  vendor_tax_number: string;
  transaction_date: string;
  total_amount: number;
  tax_amount: number;
  category: string;
}): number {
  let score = 0;
  if (data.vendor_name && data.vendor_name !== 'Unknown Vendor') score += 20;
  if (data.vendor_tax_number && data.vendor_tax_number.length >= 9) score += 25;
  if (data.transaction_date && /^\d{4}-\d{2}-\d{2}$/.test(data.transaction_date)) score += 20;
  if (data.total_amount > 0) score += 15;
  if (data.tax_amount > 0) score += 10;
  if (data.category && data.category !== '') score += 10;
  return Math.min(100, score);
}

/** Detect province from vendor address and validate tax rates */
function validateProvinceTax(
  vendor_address: string,
  subtotal: number,
  tax_amount: number,
  pst_amount: number
): { province: string | null; tax_warning: string | null } {
  const addr = vendor_address.toUpperCase();
  const provinceMatch = addr.match(
    /\b(AB|BC|MB|SK|ON|QC|NS|NB|NL|PE|NT|NU|YT)\b/
  );
  if (!provinceMatch || subtotal <= 0) return { province: null, tax_warning: null };

  const prov = provinceMatch[1];
  const expected = PROVINCE_TAX[prov];
  if (!expected) return { province: prov, tax_warning: null };

  const expectedGST = Math.round(subtotal * expected.gst * 100) / 100;
  const expectedPST = Math.round(subtotal * expected.pst * 100) / 100;

  const warnings: string[] = [];
  if (Math.abs(tax_amount - expectedGST) > 0.10 && tax_amount > 0) {
    warnings.push(`GST expected ~$${expectedGST.toFixed(2)} for ${prov}, got $${tax_amount.toFixed(2)}`);
  }
  if (expected.pst > 0 && Math.abs(pst_amount - expectedPST) > 0.10) {
    warnings.push(`PST expected ~$${expectedPST.toFixed(2)} for ${prov}, got $${pst_amount.toFixed(2)}`);
  }
  if (expected.pst === 0 && pst_amount > 0) {
    warnings.push(`${prov} has no PST but $${pst_amount.toFixed(2)} PST was detected`);
  }

  return {
    province: prov,
    tax_warning: warnings.length > 0 ? warnings.join('; ') : null,
  };
}

// LOW-9: Retry helper for Gemini API calls with exponential backoff
async function withGeminiRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      // Only retry on transient errors (5xx, timeout, rate limit)
      const isRetryable = err instanceof Error && (
        err.message.includes('503') ||
        err.message.includes('429') ||
        err.message.includes('500') ||
        err.message.includes('ECONNRESET')
      );
      if (!isRetryable || attempt === maxRetries) throw err;
      // Exponential backoff: 1s, 2s
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw lastError;
}

/** Run a second Gemini pass to self-correct math, dates, and BN format */
async function selfCorrectExtraction(
  genAI: GoogleGenerativeAI,
  firstPass: Record<string, unknown>
): Promise<Record<string, unknown>> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.05, responseMimeType: 'application/json' },
    });

    const validationPrompt = `You previously extracted this receipt data:
${JSON.stringify(firstPass)}

Verify these rules and return ONLY a corrected JSON object:
1) subtotal + tax_amount + pst_amount should equal total_amount (within $0.05). If not, adjust the amounts to be internally consistent.
2) transaction_date must be a valid ISO date (YYYY-MM-DD). If invalid, set to today.
3) If vendor_tax_number exists, verify it loosely matches pattern digits followed by RT and 4 digits. If clearly wrong, set to empty string.
4) If any field looks hallucinated or impossible (negative amounts, future dates beyond 30 days, vendor_name that is gibberish), set it to null.
5) Ensure confidence_score reflects your actual confidence (0-100) after corrections.

Return the corrected JSON only. Keep the same schema.`;

    // HIGH-7: Add timeout to self-correction pass
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const result = await model.generateContent([validationPrompt], { signal: controller.signal } as any);
      const corrected = parseSafely(result.response.text());
      return corrected;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    // AI self-correction failed — return original Gemini output
    logWarn('AI self-correction failed — using original results');
    return firstPass;
  }
}



export async function scanReceipt(base64Image: string, captureSource: string = 'camera'): Promise<ScanReceiptResult> {
  // CRIT-5: Validate inputs using the schema before anything else
  const parsed = scanReceiptInputSchema.safeParse({ base64Image, captureSource });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { base64Image: validImage, captureSource: validSource } = parsed.data;

  if (!env.GOOGLE_AI_KEY) return { success: false, error: 'AI service not configured.' };

  // MED-3: Create a single Supabase client and reuse it
  const cookieStore = await cookies();
  const supabaseClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });

  const { data: authData } = await supabaseClient.auth.getUser();
  if (!authData?.user) {
    return { success: false, error: 'Authentication required.' };
  }
  const userId = authData.user.id;

  // ─── HIGH-8: Rate Limiting by scan attempts, not saved receipts ───
  // CRIT-4: Fail-closed — if rate limit check fails, block the scan
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60_000).toISOString();
    const { count: minuteCount } = await supabaseClient
      .from('scan_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('attempted_at', oneMinuteAgo);
    if ((minuteCount ?? 0) >= 3) {
      return { success: false, error: 'Rate limit reached: max 3 scans per minute. Please wait.' };
    }

    const oneHourAgo = new Date(now.getTime() - 3_600_000).toISOString();
    const { count: hourCount } = await supabaseClient
      .from('scan_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('attempted_at', oneHourAgo);
    if ((hourCount ?? 0) >= 10) {
      return { success: false, error: 'Rate limit reached: max 10 scans per hour. Please wait.' };
    }
  } catch (err) {
    // CRIT-4: Fail-closed — block if rate limit check fails
    // Fallback: try counting receipts if scan_attempts table doesn't exist yet
    try {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60_000).toISOString();
      const { count: minuteFallback } = await supabaseClient
        .from('receipts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', oneMinuteAgo);
      if ((minuteFallback ?? 0) >= 3) {
        return { success: false, error: 'Rate limit reached: max 3 scans per minute. Please wait.' };
      }

      const oneHourAgo = new Date(now.getTime() - 3_600_000).toISOString();
      const { count: hourFallback } = await supabaseClient
        .from('receipts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', oneHourAgo);
      if ((hourFallback ?? 0) >= 10) {
        return { success: false, error: 'Rate limit reached: max 10 scans per hour. Please wait.' };
      }
    } catch {
      logError(err, { action: 'rate_limit_check' });
      return { success: false, error: 'Service temporarily unavailable. Please try again.' };
    }
  }

  // ─── Plan Enforcement: check receipt limits ───
  // CRIT-4: Fail-closed
  try {
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('org_id')
      .eq('user_id', userId)
      .single();
    const orgId = roleData?.org_id;
    if (orgId) {
      const { data: subData } = await supabaseClient
        .from('subscriptions')
        .select('plan, receipt_limit, status')
        .eq('org_id', orgId)
        .single();
      const plan: string = subData?.plan || 'free';
      const receiptLimit = typeof subData?.receipt_limit === 'number' ? subData.receipt_limit : 25;
      if (plan === 'free' || receiptLimit !== 999999) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
        const { count: monthCount } = await supabaseClient
          .from('receipts')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .eq('is_deleted', false)
          .gte('created_at', monthStart)
          .lt('created_at', monthEnd);
        if ((monthCount ?? 0) >= receiptLimit) {
          return {
            success: false,
            error: `Receipt limit reached: ${receiptLimit} receipts per month on the ${plan} plan. Upgrade to continue scanning.`,
          };
        }
      }
    }
  } catch (err) {
    // CRIT-4: Fail-closed — block if plan enforcement fails
    logError(err, { action: 'plan_enforcement_check' });
    return { success: false, error: 'Service temporarily unavailable. Please try again.' };
  }

  // HIGH-8: Record this scan attempt before calling Gemini (M1: use server-side auth userId, not client-supplied)
  try {
    await supabaseClient.from('scan_attempts').insert({ user_id: userId });
  } catch {
    logWarn('scan_attempts insert skipped — table may not exist');
  }

  const payload = preparePayload(validImage);

  try {
    const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    });

    // HIGH-7: Add timeout via AbortController — timeout is created per-retry inside wrapper
    let result;
    try {
      result = await withGeminiRetry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);
        try {
          return await model.generateContent([
            buildPrompt(validSource),
            { inlineData: { data: payload.data, mimeType: payload.mimeType } },
          ], { signal: controller.signal } as any);
        } finally {
          clearTimeout(timeout);
        }
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, error: 'Receipt scan timed out. Please try again.' };
      }
      throw err;
    }

    const rawParsed = parseSafely(result.response.text());

    // AI Self-Correction Pass — only run if confidence is low (< 75) to save API quota
    const finalParsed = (rawParsed.confidence_score && Number(rawParsed.confidence_score) < 75)
      ? await selfCorrectExtraction(genAI, rawParsed)
      : rawParsed;

    // Basic sanitize (condensed for Godmode build)
    const vendor_name = toStr(finalParsed.vendor_name) || 'Unknown Vendor';
    const subtotal = toNum(finalParsed.subtotal);
    const tax_amount = toNum(finalParsed.tax_amount);
    const pst_amount = toNum(finalParsed.pst_amount);
    const total_amount = toNum(finalParsed.total_amount);

    // Province tax validation
    const vendorAddr = toStr(finalParsed.vendor_address);
    const { tax_warning } = validateProvinceTax(vendorAddr, subtotal, tax_amount, pst_amount);

    logInfo('Receipt scan completed successfully', {
      vendor_name: vendor_name,
      total_amount,
      confidence_score: toNum(finalParsed.confidence_score) || 85
    });

    return {
      success: true,
      data: {
        vendor_name,
        vendor_address: vendorAddr,
        business_number: toStr(finalParsed.vendor_tax_number),
        total_amount,
        subtotal,
        tax_amount,
        pst_amount,
        transaction_date: normalizeDate(toStr(finalParsed.transaction_date)),
        transaction_time: toStr(finalParsed.transaction_time),
        payment_method: toStr(finalParsed.payment_method),
        payment_reference: toStr(finalParsed.payment_reference),
        card_last_four: toStr(finalParsed.card_last_four).replace(/\D/g, '').slice(-4),
        category: toStr(finalParsed.category),
        notes: [SMART_PURPOSE[toStr(finalParsed.category) as ValidCategory] || '', tax_warning ? `⚠️ Tax Alert: ${tax_warning}` : ''].filter(Boolean).join(' — '),
        currency: toStr(finalParsed.currency) || 'CAD',
        confidence_score: toNum(finalParsed.confidence_score) || 85,
        cra_readiness_score: computeCRAScoreForSave({
          vendor_name,
          vendor_tax_number: toStr(finalParsed.vendor_tax_number),
          transaction_date: normalizeDate(toStr(finalParsed.transaction_date)),
          total_amount,
          tax_amount,
          category: toStr(finalParsed.category),
        }),
        thermal_warning: Boolean(finalParsed.thermal_warning),
        document_type: (toStr(finalParsed.document_type).toLowerCase() || 'receipt') as 'receipt' | 'invoice' | 'statement' | 'unknown',
        duplicate_warning: false,
        duplicate_hash: '',
        math_mismatch_warning: Math.abs((subtotal + tax_amount + pst_amount) - total_amount) > 0.05,
        missing_bn_warning: !toStr(finalParsed.vendor_tax_number) && tax_amount > 0,
        fraud_suspicion: Boolean(finalParsed.fraud_suspicion),
        fraud_reason: toStr(finalParsed.fraud_reason),
        line_items: Array.isArray(finalParsed.line_items) ? finalParsed.line_items.map((i: Record<string, unknown>) => ({
          description: toStr(i.description), quantity: toNum(i.quantity) || 1, unit_price: toNum(i.unit_price), tax_amount: toNum(i.tax_amount), line_total: toNum(i.line_total)
        })) : []
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Receipt scan failed.';
    logError(err, { action: 'scan_receipt', captureSource: validSource });
    return { success: false, error: message };
  }
}