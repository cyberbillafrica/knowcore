import { createAdminSupabaseClient } from './supabase';

export interface SimilarChunk {
  id: string;
  source_id: string;
  content: string;
  source_title: string;
  similarity: number;
}

/**
 * Query Supabase for chunks similar to the provided embedding.
 */
export async function querySimilarChunks(
  queryEmbedding: number[],
  limit = 5,
  threshold = 0.5
): Promise<SimilarChunk[]> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    console.error('Error querying similar chunks:', error);
    throw new Error('Failed to query vector database.');
  }

  return data as SimilarChunk[];
}
