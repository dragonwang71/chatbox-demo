import OpenAI from "openai";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";

type ChatRequest = {
  messages: Pick<ChatMessage, "role" | "content">[];
  memory: string;
  responseLanguage?: ResponseLanguage;
};

type ResponseLanguage = "zh" | "ja" | "en";

const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

function normalizeResponseLanguage(value: unknown): ResponseLanguage {
  if (value === "zh" || value === "ja" || value === "en") {
    return value;
  }

  return "en";
}

function languageInstruction(language: ResponseLanguage) {
  if (language === "zh") {
    return "Simplified Chinese";
  }

  if (language === "ja") {
    return "Japanese";
  }

  return "English";
}

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
  const responseLanguage = normalizeResponseLanguage(body.responseLanguage);
  const outputLanguage = languageInstruction(responseLanguage);
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
- Answer in ${outputLanguage}. The app's selected language is the source of truth for the reply language.
- Do not infer Chinese only because the request contains kanji/Han characters.
- If the user explicitly asks to translate or use a different language inside the message, follow that explicit request.

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
