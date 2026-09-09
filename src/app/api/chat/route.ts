import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding, generateText } from '@/lib/gemini';
import { querySimilarChunks } from '@/lib/vector';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    // 1. Generate embedding for user query
    const queryEmbedding = await generateEmbedding(message);

    // 2. Search for similar chunks in the knowledge base
    const similarChunks = await querySimilarChunks(queryEmbedding, 5, 0.5);

    if (similarChunks.length === 0) {
      return NextResponse.json({ 
        response: "I'm sorry, I don't have enough information in my knowledge base to answer that. Could you please provide more details or ask something else?",
        sources: []
      });
    }

    // 3. Construct Context and Prompt
    const context = similarChunks
      .map((chunk, index) => `[Context ${index + 1}] (Source: ${chunk.source_title}):\n${chunk.content}`)
      .join('\n\n');

    const prompt = `
You are KnowCore Assistant, a helpful AI expert that answers questions based ONLY on the provided context.
Your goal is to provide accurate, concise, and helpful answers.

INSTRUCTIONS:
- Use the provided context to answer the user's question.
- If the answer isn't in the context, say you don't know.
- When you use information from a source, cite it at the end of the sentence or paragraph like this: [Source: filename].
- Be professional and direct.

CONTEXT:
${context}

USER QUESTION:
${message}

ANSWER:
    `.trim();

    // 4. Generate Response using Gemini
    const aiResponse = await generateText(prompt);

    // 5. Extract unique sources
    const sources = Array.from(new Set(similarChunks.map(c => c.source_title)));

    return NextResponse.json({
      response: aiResponse,
      sources
    });

  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
