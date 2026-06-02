import { supabase } from '@/lib/supabase';
import { logError, logInfo } from '@/lib/logger';

// Currencies supported by Bank of Canada Valet API
const BOC_SUPPORTED_CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'HKD', 'SEK',
  'NOK', 'DKK', 'SGD', 'MXN', 'NZD', 'CNY', 'INR',
]);

/**
 * Fetch the historical CAD exchange rate for a given currency and date.
 * Strategy:
 *  1. Check fx_rate_cache (DB) — instant if already fetched
 *  2. Call Bank of Canada Valet API for the exact date
 *  3. If no data (weekend/holiday), walk back up to 7 trading days (CRA-accepted)
 *  4. Upsert into cache, return rate
 *  5. On any failure, return 1.0 and log — never block a save
 */
export async function getHistoricalCADRate(currency: string, date: string): Promise<number> {
  const upperCurrency = currency.toUpperCase();
  
  // CAD-to-CAD is always 1.0
  if (upperCurrency === 'CAD') return 1.0;

  // If currency not supported by BoC, return 1.0 with warning
  if (!BOC_SUPPORTED_CURRENCIES.has(upperCurrency)) {
    logError(new Error(`Unsupported currency for auto-rate: ${upperCurrency}`), { action: 'fx_rate_lookup' });
    return 1.0;
  }

  // 1. Check DB cache first
  try {
    const { data: cached } = await supabase
      .from('fx_rate_cache')
      .select('rate_to_cad')
      .eq('date', date)
      .eq('currency', upperCurrency)
      .single();
    
    if (cached?.rate_to_cad) {
      return Number(cached.rate_to_cad);
    }
  } catch {
    // Cache miss — continue to API
  }

  // 2. Fetch from Bank of Canada Valet API with fallback dates
  const seriesName = `FX${upperCurrency}CAD`;
  
  for (let daysBack = 0; daysBack <= 7; daysBack++) {
    const queryDate = offsetDate(date, -daysBack);
    
    try {
      const url = `https://www.bankofcanada.ca/valet/observations/${seriesName}/json?start_date=${queryDate}&end_date=${queryDate}`;
      
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8_000),
        headers: { 'Accept': 'application/json' },
      });
      
      if (!res.ok) continue;
      
      const json = await res.json();
      const observations = json?.observations;
      
      if (!Array.isArray(observations) || observations.length === 0) continue;
      
      const rateStr = observations[0]?.[seriesName]?.v;
      if (!rateStr) continue;
      
      const rate = parseFloat(rateStr);
      if (isNaN(rate) || rate <= 0) continue;
      
      // Cache this rate in DB (use the original requested date, not the fallback date)
      try {
        await supabase.from('fx_rate_cache').upsert(
          { date, currency: upperCurrency, rate_to_cad: rate },
          { onConflict: 'date,currency', ignoreDuplicates: false }
        );
      } catch {
        // Cache write failure is non-critical
      }
      
      logInfo(`FX rate fetched: 1 ${upperCurrency} = ${rate} CAD for ${date} (using ${queryDate})`, {});
      return rate;
    } catch {
      continue;
    }
  }
  
  // Fallback: return 1.0 rather than blocking the save
  logError(new Error(`Could not fetch BoC rate for ${upperCurrency} on ${date}`), { action: 'fx_rate_fetch' });
  return 1.0;
}

/**
 * Offset a YYYY-MM-DD date string by N days
 */
function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}
