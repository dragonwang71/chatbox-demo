import type { Conversation } from "@/lib/types";

export const defaultMemory = `# ユーザーメモ

回答はアプリで選択された言語に合わせる。

## 基本情報
- 東京在住の会社員。
- 平日は電車と徒歩で都心へ移動することが多い。
- 休日は遠出よりも、近場で短時間に行ける場所を探すことが多い。

## 生活文脈
- 朝は天気、電車の遅延、今日見るべきニュースをまとめて知りたい。
- 人混みが強すぎる場所より、落ち着いて歩ける街、神社、カフェ、公園、商店街が好き。
- 外出先では、最寄り駅からの歩きやすさ、混雑しにくい時間、普通の生活予算で使いやすいかを重視する。

## 回答の好み
- まず結論を短く、その後に理由と具体的な行動を示す。
- 高級店や観光客向けだけでなく、日常生活で使いやすい選択肢を優先する。
- 場所ページでは最新のWeb情報を確認し、公式サイトや信頼できる参考リンクを含める。`;

export const legacyDefaultMemoryMarkers = [
  "回答は質問された言語に合わせる。",
  "## Basic Profile",
  "## Product Demo Context",
  "demo memory seed",
  "They often ask about places, neighborhoods, cafes, museums, parks, stations, and short city walks.",
  "The user is an ordinary Tokyo resident.",
  "Treat Tokyo as the default area unless another city is mentioned.",
  "Use current web information when available.",
  "# ユーザーメモ",
  "東京在住",
  "平日は電車と徒歩",
  "近場で短時間",
  "神社、カフェ、公園、商店街",
  "普通の生活予算"
];

export const seedConversations: Conversation[] = [
  {
    id: "seed-chat",
    mode: "chat",
    title: "Chatbox Demo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: "seed-chat-1",
        role: "assistant",
        content:
          "This is Chatbox Demo. You can use normal chat, create a structured place page, or edit the long-term memory document.",
        createdAt: new Date().toISOString(),
        memoryUsed: true
      }
    ]
  }
];

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createTitle(text: string, fallback: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return fallback;
  }

  return cleaned.length > 18 ? `${cleaned.slice(0, 18)}...` : cleaned;
}
