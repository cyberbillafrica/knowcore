import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding, generateText } from "@/lib/gemini";
import { querySimilarChunks } from "@/lib/vector";

export async function POST(req: NextRequest) {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!telegramBotToken) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    return NextResponse.json({ error: "Telegram bot token not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    
    // Check if this is a message with text
    if (!body.message?.text) {
      return NextResponse.json({ ok: true }); // Ignore non-text messages
    }

    const chatId = body.message.chat.id;
    const userMessage = body.message.text;

    // 1. Generate embedding for user query
    const queryEmbedding = await generateEmbedding(userMessage);

    // 2. Search for similar chunks in the knowledge base
    const similarChunks = await querySimilarChunks(queryEmbedding, 5, 0.5);

    let responseText: string;

    if (similarChunks.length === 0) {
      responseText = "I'm sorry, I don't have enough information in my knowledge base to answer that. Could you please provide more details or ask something else?";
    } else {
      // 3. Construct Context and Prompt
      const context = similarChunks
        .map((chunk, index) => `[Context ${index + 1}] (Source: ${chunk.source_title}):\n${chunk.content}`)
        .join("\n\n");

      const prompt = `
You are KnowCore Assistant, a helpful AI expert that answers questions based ONLY on the provided context.
Your goal is to provide accurate, concise, and helpful answers.

INSTRUCTIONS:
- Use the provided context to answer the user's question.
- If the answer isn't in the context, say you don't know.
- Be professional and direct.

CONTEXT:
${context}

USER QUESTION:
${userMessage}

ANSWER:
      `.trim();

      // 4. Generate Response using Gemini
      responseText = await generateText(prompt);
    }

    // 5. Send response back to Telegram
    const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    
    await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: responseText,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error in telegram-webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
