import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export async function GET() {
  const healthCheck = {
    status: 'healthy' as HealthStatus,
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown' as HealthStatus,
      storage: 'unknown' as HealthStatus,
      auth: 'unknown' as HealthStatus
    }
  };

  try {
    // Check database connection
    const { error: dbError } = await supabase
      .from('receipts')
      .select('id')
      .limit(1);

    healthCheck.checks.database = dbError ? 'unhealthy' : 'healthy';

    if (dbError) {
      healthCheck.status = 'degraded';
    }
  } catch (error) {
    healthCheck.checks.database = 'unhealthy';
    healthCheck.status = 'degraded';
  }

  try {
    // Check storage connection
    const { error: storageError } = await supabase.storage
      .from('receipt-images')
      .list('', { limit: 1 });

    healthCheck.checks.storage = storageError ? 'unhealthy' : 'healthy';

    if (storageError) {
      healthCheck.status = 'degraded';
    }
  } catch (error) {
    healthCheck.checks.storage = 'unhealthy';
    healthCheck.status = 'degraded';
  }

  try {
    // Check auth connection
    const { error: authError } = await supabase.auth.getSession();

    healthCheck.checks.auth = authError ? 'unhealthy' : 'healthy';

    if (authError) {
      healthCheck.status = 'degraded';
    }
  } catch (error) {
    healthCheck.checks.auth = 'unhealthy';
    healthCheck.status = 'degraded';
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;

  return NextResponse.json(healthCheck, { status: statusCode });
}
