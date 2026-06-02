'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

const apiKey = env.GOOGLE_AI_KEY;
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function semanticSearchAction(query: string) {
  if (!apiKey) {
    throw new Error('Google AI Key is missing.');
  }

  // Get authenticated user from cookies
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {}, // Server actions can't set cookies
    },
  });

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id || null;

  // Get org_id for proper tenant isolation
  const { data: orgData } = await supabase.rpc('get_user_org');
  const orgId = orgData as unknown as string;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

  // Generate embedding for the query string
  const result = await model.embedContent(query);
  const embedding = result.embedding.values;

  // Search Supabase pgvector
  // We explicitly cast the number[] to the format Postgres expects for vector types, usually '[x,y,z]'
  const embeddingStr = `[${embedding.join(',')}]`;

  const { data, error } = await supabase.rpc('match_receipts', {
    query_embedding: embeddingStr,
    match_threshold: 0.6,
    match_count: 50,
    p_user_id: userId,
    p_org_id: orgId ?? null, // Add org_id for proper tenant isolation
  });

  if (error) {
    throw new Error(`Semantic search failed: ${error.message}`);
  }

  return data as Array<{ id: string; similarity: number }>;
}
