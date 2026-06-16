import type { Conversation } from "@/lib/types";

export const defaultMemory = `# ユーザーメモ

回答は質問された言語に合わせる。

## ユーザー像
- Agent i の2C利用シーンを見せるための、東京在住ユーザーのデモ用プロフィール。
- ユーザーは東京在住の会社員。平日は電車と徒歩で都心へ移動することが多い。
- 人混みが強すぎる場所より、落ち着いて歩ける街、神社、カフェ、公園、商店街が好き。

## 生活文脈
- 朝は天気、電車の遅延、今日見るべきニュースをまとめて知りたい。
- 週末は近場で短時間に行ける場所を探すことが多い。
- 外出先では、最寄り駅からの歩きやすさ、混雑しにくい時間、ついでに寄れる場所を重視する。

## 回答の好み
- まず結論を短く、その後に理由と具体的な行動を示す。
- 高級店や観光客向けだけでなく、普通の生活予算で使いやすい選択肢を優先する。
- 地点ページでは最新のWeb情報を確認し、公式サイトや信頼できる参考リンクを含める。`;

export const legacyDefaultMemoryMarkers = [
  "## Basic Profile",
  "## Product Demo Context",
  "demo memory seed",
  "They often ask about places, neighborhoods, cafes, museums, parks, stations, and short city walks.",
  "The user is an ordinary Tokyo resident.",
  "Treat Tokyo as the default area unless another city is mentioned.",
  "Use current web information when available.",
  "# ユーザーメモ",
  "ユーザーは東京で暮らす一般的な生活者。",
  "ユーザーは東京在住の一般的な生活者。",
  "平日は仕事や用事の合間に、電車と徒歩で移動することが多い。",
  "東京近郊の神社、カフェ、公園、美術館、商店街",
  "日常生活、街歩き、カフェ",
  "普通の生活予算",
  "その場所の見どころ、向いている人",
  "可能な場合は最新のWeb情報を使う。",
  "正在准备 LINE Yahoo / Agent i 相关岗位申请",
  "Agent i Chatbox Demo",
  "Business Analytics 背景",
  "结构化 Skill 输出"
];

export const seedConversations: Conversation[] = [
  {
    id: "seed-chat",
    mode: "chat",
    title: "Chatbox Demo 説明",
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
