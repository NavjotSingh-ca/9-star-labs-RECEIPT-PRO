'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { logError } from '@/lib/logger';

const apiKey = env.GOOGLE_AI_KEY;
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface SemanticSearchResult {
  ok: true;
  results: Array<{ id: string; similarity: number }>;
}

export interface SemanticSearchError {
  ok: false;
  error: string;
}

export type SemanticSearchResponse = SemanticSearchResult | SemanticSearchError;

/**
 * Performs a semantic search across receipts using pgvector + Google embeddings.
 *
 * Requires GOOGLE_AI_KEY to be configured in the environment.
 * Returns structured results with `ok` discriminant for safe client-side handling.
 */
export async function semanticSearchAction(query: string): Promise<SemanticSearchResponse> {
  if (!apiKey) {
    return { ok: false, error: 'AI service not configured.' };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    });

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;

    const { data: orgData } = await supabase.rpc('get_user_org');
    const orgId = typeof orgData === 'string' ? orgData : null;
    if (!orgId) return { ok: false, error: 'No organization found.' };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    const result = await model.embedContent(query);
    const embedding = result.embedding.values;

    const embeddingStr = `[${embedding.join(',')}]`;

    const { data, error } = await supabase.rpc('match_receipts', {
      query_embedding: embeddingStr,
      match_threshold: 0.6,
      match_count: 50,
      p_user_id: userId,
      p_org_id: orgId,
    });

    if (error) {
      logError(error, { action: 'semantic_search' });
      return { ok: false, error: 'Search failed. Please try again.' };
    }

    return { ok: true, results: data as Array<{ id: string; similarity: number }> };
  } catch (err: unknown) {
    logError(err, { action: 'semantic_search' });
    return { ok: false, error: 'Search failed. Please try again.' };
  }
}
