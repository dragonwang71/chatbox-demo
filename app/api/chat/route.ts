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

  const prompt = `You are the assistant inside a small consumer AI chatbox demo.

Product contract:
- Answer naturally and concisely.
- Use the memory document only when it is relevant.
- Do not mention that memory was used.
- Use web search to ground factual, current, local, or recommendation-heavy answers.
- Do not claim to have maps, login, or a database.
- If web results are not relevant to the user's request, answer normally.

Memory document:
${body.memory || "(empty)"}

Conversation:
${transcript}

Return the assistant reply only.`;

  const webSearchTool = {
    type: "web_search",
    search_context_size: "medium",
    user_location: {
      type: "approximate",
      city: "Tokyo",
      country: "JP",
      timezone: "Asia/Tokyo"
    }
  } as const;

  const response = await client.responses.create({
    model,
    reasoning: { effort: "low" },
    tools: [webSearchTool],
    tool_choice: "required",
    input: prompt
  });

  return Response.json({
    content: response.output_text
  });
}
