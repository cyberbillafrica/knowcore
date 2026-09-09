import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/gemini';
import { chunkText } from '@/lib/chunking';
import { extractTextFromFile, extractTextFromUrl } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const adminPassword = req.headers.get('x-admin-password');
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    let type: 'file' | 'text' | 'url';
    let title: string;
    let content: string;
    let knowledgeBaseId: string;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      knowledgeBaseId = formData.get('knowledgeBaseId') as string;
      
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      
      type = 'file';
      title = file.name;
      const buffer = Buffer.from(await file.arrayBuffer());
      content = await extractTextFromFile(buffer, file.type);
    } else {
      const body = await req.json();
      type = body.type;
      knowledgeBaseId = body.knowledgeBaseId;
      
      if (type === 'text') {
        title = body.title || 'Untitled Text';
        content = body.content;
      } else if (type === 'url') {
        const urlData = await extractTextFromUrl(body.url);
        title = urlData.title;
        content = urlData.content;
      } else {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
      }
    }

    if (!knowledgeBaseId) {
      // For demo: get first knowledge base or create one
      const supabase = createAdminSupabaseClient();
      const { data: kb } = await supabase.from('knowledge_bases').select('id').limit(1).single();
      if (kb) {
        knowledgeBaseId = kb.id;
      } else {
        // Create a default tenant and KB if none exist (for initial setup)
        const { data: tenant } = await supabase.from('tenants').insert({ name: 'Default Organization', slug: 'default' }).select().single();
        const { data: newKb } = await supabase.from('knowledge_bases').insert({ tenant_id: tenant!.id, name: 'Default Knowledge Base' }).select().single();
        knowledgeBaseId = newKb!.id;
      }
    }

    const supabase = createAdminSupabaseClient();

    // 1. Insert Source
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        knowledge_base_id: knowledgeBaseId,
        type,
        title,
        content: content.substring(0, 5000), // Store first 5k chars as preview
        metadata: { length: content.length }
      })
      .select()
      .single();

    if (sourceError) throw sourceError;

    // 2. Chunk and Embed
    const chunks = chunkText(content);
    const chunkInserts = await Promise.all(
      chunks.map(async (chunk) => {
        const embedding = await generateEmbedding(chunk);
        return {
          source_id: source.id,
          content: chunk,
          embedding
        };
      })
    );

    // 3. Batch insert chunks
    const { error: chunkError } = await supabase.from('chunks').insert(chunkInserts);
    if (chunkError) throw chunkError;

    return NextResponse.json({ 
      success: true, 
      sourceId: source.id, 
      chunkCount: chunks.length 
    });

  } catch (error: any) {
    console.error('Error in add-source:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
