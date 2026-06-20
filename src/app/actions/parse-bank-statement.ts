'use server';

import { GoogleGenerativeAI, type RequestOptions } from '@google/generative-ai';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { logError } from '@/lib/logger';

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface BankTransactionData {
  date: string;
  description: string;
  amount: number;
  balance: number | null;
  transaction_type: 'debit' | 'credit';
}

export type ParseBankStatementResult = 
  | { success: true; transactions: BankTransactionData[]; duplicatesSkipped?: number }
  | { success: false; error: string };

function parseSafely(raw: string): unknown[] {
  const cleanFences = raw.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(cleanFences); } catch { /* continue */ }
  
  const start = cleanFences.indexOf('[');
  const end = cleanFences.lastIndexOf(']');
  if (start !== -1 && end > start) {
    try { return JSON.parse(cleanFences.slice(start, end + 1)); } catch { /* continue */ }
  }
  return [];
}

// ─── OFX/QFX Parser ───
// OFX (Open Financial Exchange) is an SGML-based format used by most Canadian banks
function parseOFX(text: string): BankTransactionData[] {
  const transactions: BankTransactionData[] = [];
  
  // Match all STMTTRN blocks
  const stmttrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  
  while ((match = stmttrnRegex.exec(text)) !== null) {
    const block = match[1];
    
    const getTag = (tag: string): string => {
      // OFX can be SGML (no closing tags) or XML (with closing tags)
      const xmlMatch = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'));
      if (xmlMatch) return xmlMatch[1].trim();
      const sgmlMatch = block.match(new RegExp(`<${tag}>(.+?)(?:\r?\n|$)`, 'i'));
      if (sgmlMatch) return sgmlMatch[1].trim();
      return '';
    };
    
    const dtPosted = getTag('DTPOSTED');
    const trnAmt = getTag('TRNAMT');
    const name = getTag('NAME') || getTag('MEMO') || 'Unknown';
    
    if (!dtPosted || !trnAmt) continue;
    
    // Parse OFX date format: YYYYMMDD or YYYYMMDDHHMMSS
    const year = dtPosted.slice(0, 4);
    const month = dtPosted.slice(4, 6);
    const day = dtPosted.slice(6, 8);
    const formattedDate = `${year}-${month}-${day}`;
    
    const amount = parseFloat(trnAmt);
    if (isNaN(amount)) continue;
    
    transactions.push({
      date: formattedDate,
      description: name,
      amount: amount, // OFX uses negative for debits
      balance: null,
      transaction_type: amount < 0 ? 'debit' : 'credit',
    });
  }
  
  return transactions;
}

// ─── CSV Parser ───
function parseCSV(text: string): BankTransactionData[] {
  const lines = text.split('\n').filter(l => l.trim() !== '');
  if (lines.length === 0) return [];

  const headers = lines[0].toLowerCase().split(',').map(s => s.trim());
  const dateIdx = headers.findIndex(h => h.includes('date'));
  const descIdx = headers.findIndex(h => h.includes('description') || h.includes('memo') || h.includes('name'));
  const amtIdx = headers.findIndex(h => h.includes('amount') || h.includes('debit'));
  const creditIdx = headers.findIndex(h => h.includes('credit'));

  const dataLines = (dateIdx >= 0 && descIdx >= 0) ? lines.slice(1) : lines;

  const parsed = dataLines.map((line): BankTransactionData | null => {
    const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    const date = dateIdx >= 0 ? cols[dateIdx] : cols[0] || '';
    const description = descIdx >= 0 ? cols[descIdx] : cols[1] || 'Unknown';
    
    let amount: number;
    if (amtIdx >= 0) {
      amount = parseFloat(cols[amtIdx].replace(/[^0-9.\-]/g, ''));
    } else {
      amount = parseFloat((cols[2] || cols[cols.length - 1] || '0').replace(/[^0-9.\-]/g, ''));
    }
    
    // Some CSVs have separate debit/credit columns
    if (creditIdx >= 0 && cols[creditIdx]) {
      const credit = parseFloat(cols[creditIdx].replace(/[^0-9.\-]/g, ''));
      if (!isNaN(credit) && credit > 0) {
        return { date, description, amount: credit, balance: null, transaction_type: 'credit' as const };
      }
    }
    
    if (isNaN(amount)) return null;
    
    return {
      date,
      description,
      amount: Math.abs(amount),
      balance: null,
      transaction_type: 'debit' as const,
    };
  });

  return parsed.filter((t): t is BankTransactionData => t !== null && t.amount > 0 && !!t.date);
}

async function getAuthenticatedClient() {
  const cookieStore = await cookies();
  const supabaseClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });

  const { data: authData } = await supabaseClient.auth.getUser();
  if (!authData?.user) return null;

  const { data: roleData } = await supabaseClient
    .from('user_roles')
    .select('org_id')
    .eq('user_id', authData.user.id)
    .single();

  return {
    client: supabaseClient,
    userId: authData.user.id,
    orgId: roleData?.org_id as string | undefined,
  };
}

async function saveTransactions(
  supabaseClient: SupabaseClient,
  orgId: string,
  userId: string,
  transactions: BankTransactionData[],
  fileName: string
): Promise<{ saved: number; duplicatesSkipped: number }> {
  const today = new Date().toISOString().split('T')[0];
  const insertPayload = transactions.map(t => ({
    org_id: orgId,
    uploaded_by: userId,
    statement_date: today,
    transaction_date: t.date,
    description: t.description,
    amount: Math.abs(t.amount),
    source_file_name: fileName,
  }));

  // Use upsert with onConflict to skip duplicates
  const { data, error: insertErr } = await supabaseClient
    .from('bank_transactions')
    .upsert(insertPayload, { 
      onConflict: 'org_id,transaction_date,amount,description',
      ignoreDuplicates: true 
    })
    .select('id');

  if (insertErr) {
    logError(insertErr, { action: 'insert_bank_transactions' });
    return { saved: 0, duplicatesSkipped: 0 };
  }

  const saved = data?.length ?? 0;
  const duplicatesSkipped = insertPayload.length - saved;
  return { saved, duplicatesSkipped };
}

export async function parseBankStatement(base64Data: string, fileName: string): Promise<ParseBankStatementResult> {
  // File size guard
  if (base64Data.length > 15_000_000) {
    return { 
      success: false, 
      error: 'Statement too large. Please upload one month at a time (max ~10MB).' 
    };
  }

  const auth = await getAuthenticatedClient();
  if (!auth) return { success: false, error: 'Authentication required.' };
  if (!auth.orgId) return { success: false, error: 'Organization not found.' };

  const isOFX = /\.(ofx|qfx)$/i.test(fileName);
  const isCSV = /\.csv$/i.test(fileName);

  // ─── Handle OFX/QFX files (parsed locally, no AI needed) ───
  if (isOFX) {
    try {
      const text = Buffer.from(base64Data, 'base64').toString('utf-8');
      const transactions = parseOFX(text);

      if (transactions.length === 0) {
        return { success: false, error: 'No transactions found in OFX/QFX file.' };
      }

      const { duplicatesSkipped } = await saveTransactions(
        auth.client, auth.orgId, auth.userId, transactions, fileName
      );

      return { success: true, transactions, duplicatesSkipped };
    } catch (err) {
      logError(err, { action: 'parse_ofx' });
      return { success: false, error: 'Failed to parse OFX/QFX file.' };
    }
  }

  // ─── Handle CSV files (parsed locally) ───
  if (isCSV) {
    try {
      const text = Buffer.from(base64Data, 'base64').toString('utf-8');
      const transactions = parseCSV(text);

      if (transactions.length === 0) {
        return { success: false, error: 'No valid transactions found in CSV.' };
      }

      const { duplicatesSkipped } = await saveTransactions(
        auth.client, auth.orgId, auth.userId, transactions, fileName
      );

      return { success: true, transactions, duplicatesSkipped };
    } catch (err) {
      logError(err, { action: 'parse_csv' });
      return { success: false, error: 'Failed to parse CSV file.' };
    }
  }

  // ─── Handle PDF files (Gemini AI extraction) ───
  if (!env.GOOGLE_AI_KEY) {
    return { success: false, error: 'AI service not configured.' };
  }

  try {
    const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.05, responseMimeType: 'application/json' },
    });

    // Improved prompt for Canadian banks where debits are typically shown as positive numbers
    const prompt = `Parse this Canadian bank statement PDF. Return ONLY a JSON array.
Each object must have exactly:
- "date": "YYYY-MM-DD" (include full year — for multi-month statements, use the correct year shown on the statement header or page)
- "description": string (merchant name, cleaned up — remove trailing reference numbers)
- "amount": number (IMPORTANT: Canadian bank statements show debits/expenses as POSITIVE numbers. Return them as NEGATIVE. Credits/deposits are POSITIVE.)
- "balance": number or null
- "transaction_type": "debit" | "credit"

Handle these Canadian bank formats: TD EasyWeb, RBC Online, BMO, Scotiabank, CIBC.
For multi-month or quarterly statements, ensure dates have the correct month and year.
Return [] if no transactions found. No markdown, no explanation.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    let result;
    try {
      result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: 'application/pdf' } },
      ], { signal: controller.signal } as unknown as RequestOptions);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: false, error: 'Statement parsing timed out. Please try a smaller file.' };
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    const transactions = parseSafely(result.response.text());

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return { success: false, error: 'No transactions found in this document.' };
    }

    const validTx: BankTransactionData[] = (transactions as Record<string, unknown>[]).map((t) => ({
      date: typeof t.date === 'string' ? t.date : '',
      description: typeof t.description === 'string' ? t.description : 'Unknown',
      amount: typeof t.amount === 'number' ? t.amount : 0,
      balance: typeof t.balance === 'number' ? t.balance : null,
      transaction_type: (t.transaction_type === 'credit' ? 'credit' : 'debit') as 'credit' | 'debit',
    })).filter((t: BankTransactionData) => t.date && t.amount !== 0);

    if (validTx.length === 0) {
      return { success: false, error: 'No valid transactions extracted.' };
    }

    const { duplicatesSkipped } = await saveTransactions(
      auth.client, auth.orgId, auth.userId, validTx, fileName
    );

    return { success: true, transactions: validTx, duplicatesSkipped };
  } catch (err: unknown) {
    logError(err, { action: 'parse_bank_statement' });
    return { success: false, error: 'Failed to parse bank statement.' };
  }
}
