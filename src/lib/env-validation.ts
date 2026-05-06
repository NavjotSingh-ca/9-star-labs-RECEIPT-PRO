const requiredEnvVars = [
  'NEXT_PUBLIC_SITE_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'QBO_CLIENT_ID',
  'QBO_CLIENT_SECRET',
  'XERO_CLIENT_ID',
  'XERO_CLIENT_SECRET'
];

const optionalEnvVars = [
  'NEXT_PUBLIC_GA_TRACKING_ID',
  'NEXT_PUBLIC_SENTRY_DSN'
];

export function validateEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Check optional variables
  for (const key of optionalEnvVars) {
    if (!process.env[key]) {
      warnings.push(`Optional env var not set: ${key}`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}

export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getPublicEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required public environment variable: ${key}`);
  }
  return value;
}
