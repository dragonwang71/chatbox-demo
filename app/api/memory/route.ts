import OpenAI from "openai";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";

type MemoryRequest = {
  memory: string;
  messages: Pick<ChatMessage, "role" | "content">[];
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

  const body = (await request.json()) as MemoryRequest;
  const client = new OpenAI({ apiKey });
  const transcript = body.messages
    .filter((message) => message.content.trim())
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");

  const prompt = `You update the long-term user memory for an Agent i-style consumer assistant demo.

Goal:
- Extract only durable information that helps answer the end user's future everyday questions.
- Keep this as a fictional Tokyo consumer persona for demonstrating Agent i's memory value.
- The memory must start exactly with:
# ユーザーメモ

回答は質問された言語に合わせる。
- Keep useful existing memory that improves the demo user's future answers.
- Preserve concrete lifestyle details when they help show why memory matters.
- Merge duplicates and rewrite the memory as clean Japanese Markdown.

Store:
- stable living context, especially city or neighborhood
- daily mobility, budget, language, schedule, food, shopping, leisure, and travel preferences
- answer preferences that improve future chat or place-page responses
- practical constraints that affect recommendations

Do not store:
- raw chat logs
- one-off requests
- app-development, portfolio, resume, job-application, coding, UI, or implementation details
- API keys, secrets, private identifiers, or credentials
- unsupported guesses about the user

Keep it concise and useful for a normal consumer assistant. Return Japanese Markdown only.

Current memory:
${body.memory || "(empty)"}

Recent conversation:
${transcript || "(empty)"}`;

  const response = await client.responses.create({
    model,
    reasoning: { effort: "low" },
    input: prompt
  });

  return Response.json({
    memory: response.output_text.trim()
  });
}
