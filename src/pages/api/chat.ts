import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';
import profileData from '../../data/profile.json';

export const prerender = false;

const SYSTEM_PROMPT = `You are a friendly, playful cat assistant on Ade Putra Susila's portfolio website. You speak in a warm, slightly cat-like manner (occasional "meow" or "purr" but don't overdo it). You are knowledgeable about Ade and his work.

Here is Ade's profile information:
${JSON.stringify(profileData, null, 2)}

Guidelines:
- Keep responses concise (2-4 sentences max) since they'll be spoken aloud via TTS
- Be enthusiastic about Ade's skills and experience
- If asked something you don't know about Ade, say so honestly
- Stay in character as a helpful cat guide
- Don't use markdown formatting, emojis, or special characters since the response will be spoken
- Don't reveal that you're Claude or an AI model - you're a cat assistant named after the page's cat guide`;

const MAX_MESSAGE_LENGTH = 500;
const MAX_CONVERSATION_MESSAGES = 10;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function validateMessages(messages: unknown): messages is ChatMessage[] {
  if (!Array.isArray(messages)) return false;
  if (messages.length === 0 || messages.length > MAX_CONVERSATION_MESSAGES) return false;

  return messages.every(
    (msg) =>
      typeof msg === 'object' &&
      msg !== null &&
      (msg.role === 'user' || msg.role === 'assistant') &&
      typeof msg.content === 'string' &&
      msg.content.length > 0 &&
      msg.content.length <= MAX_MESSAGE_LENGTH
  );
}

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Chat service not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { messages?: unknown; catName?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!validateMessages(body.messages)) {
    return new Response(
      JSON.stringify({ error: 'Invalid messages format' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const catName = typeof body.catName === 'string' ? body.catName : 'Neko';
  const systemPrompt = `${SYSTEM_PROMPT}\nYour name is ${catName}.`;

  try {
    const client = new Anthropic({ apiKey });

    // Use create() with stream:true for raw SSE events
    const stream = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: body.messages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          console.error('Stream error:', err);
          const message = err instanceof Error ? err.message : 'Stream interrupted';
          const errorMsg = `data: ${JSON.stringify({ error: message })}\n\n`;
          controller.enqueue(encoder.encode(errorMsg));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Claude API error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: `Failed to get response: ${message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
