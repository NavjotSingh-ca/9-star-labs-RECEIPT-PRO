/**
 * Supabase Connection Pooler Configuration
 * 
 * This file provides the connection string configuration for Supabase's
 * built-in PgBouncer connection pooler (pooler.supabase.co:6543).
 * 
 * Benefits:
 * - Reduces connection overhead in serverless environments
 * - Handles connection pooling automatically
 * - Prevents connection exhaustion under load
 * - Supports transaction pooling mode
 */

export const POOLER_CONFIG = {
  /** Enable connection pooling (disable for local development) */
  enabled: process.env.NODE_ENV === 'production' || process.env.USE_POOLER === 'true',
  
  /** Pooler host - varies by region */
  getHost: () => {
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (!projectRef) {
      console.warn('[Pooler] Could not determine project ref from NEXT_PUBLIC_SUPABASE_URL');
      return '';
    }
    return `${projectRef}.pooler.supabase.com`;
  },
  
  /** Pooler port (6543 for transaction pooling, 5432 for session pooling) */
  port: 6543,
  
  /** Connection parameters */
  params: {
    /** Pool mode: 'transaction' (default) | 'session' | 'statement' */
    pool_mode: 'transaction',
    
    /** Connection timeout (ms) */
    connect_timeout: 10,
    
    /** Prepared statements: 'true' for session pooling, 'false' for transaction pooling */
    prepare: false,
    
    /** Application name for monitoring */
    application_name: 'leduc-receipt-pro',
  },
};

/**
 * Build the pooler connection string
 */
export function buildPoolerConnectionString(): string {
  if (!POOLER_CONFIG.enabled) return '';
  
  const host = POOLER_CONFIG.getHost();
  if (!host) return '';
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  // Extract project reference
  const projectRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) return '';
  
  // Build connection string with pooler
  const params = new URLSearchParams({
    pgbouncer: 'true',
    pool_mode: POOLER_CONFIG.params.pool_mode,
    connect_timeout: String(POOLER_CONFIG.params.connect_timeout),
    prepare: String(POOLER_CONFIG.params.prepare),
    application_name: POOLER_CONFIG.params.application_name,
  });
  
  return `postgresql://postgres.${projectRef}:${anonKey}@${host}:${POOLER_CONFIG.port}/postgres?${params.toString()}`;
}

/**
 * Create a Supabase client that uses the pooler
 */
export function createPoolerClient() {
  if (!POOLER_CONFIG.enabled) {
    // Return standard client if pooler disabled
    return null;
  }
  
  const connectionString = buildPoolerConnectionString();
  if (!connectionString) {
    console.warn('[Pooler] Could not build connection string, falling back to standard client');
    return null;
  }
  
  // This would be used with the Supabase client constructor
  // Note: The Supabase JS client doesn't directly support custom connection strings
  // You would typically use this with a raw pg client or use the standard client
  // which internally uses the pooler when configured in Supabase dashboard
  return connectionString;
}

/**
 * Check if connection pooling is available
 */
export function isPoolerAvailable(): boolean {
  return POOLER_CONFIG.enabled && !!POOLER_CONFIG.getHost();
}

/**
 * Get pooler status for health checks
 */
export function getPoolerStatus(): {
  enabled: boolean;
  host: string;
  available: boolean;
} {
  const host = POOLER_CONFIG.getHost();
  return {
    enabled: POOLER_CONFIG.enabled,
    host,
    available: !!host,
  };
}