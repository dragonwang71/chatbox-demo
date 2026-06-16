import OpenAI from "openai";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";

type ChatRequest = {
  messages: Pick<ChatMessage, "role" | "content">[];
  memory: string;
};

const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as ChatRequest;
  const client = new OpenAI({ apiKey });
  const transcript = body.messages
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");

  const prompt = `You are the assistant inside a small Agent i portfolio demo.

Product contract:
- Answer naturally and concisely.
- Use the memory document only when it is relevant.
- Do not mention that memory was used.
- Do not claim to have external search, maps, login, or a database.

Memory document:
${body.memory || "(empty)"}

Conversation:
${transcript}

Return the assistant reply only.`;

  const response = await client.responses.create({
    model,
    reasoning: { effort: "low" },
    input: prompt
  });

  return Response.json({
    content: response.output_text
  });
}
