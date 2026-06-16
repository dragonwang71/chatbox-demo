export type UiLanguage = "zh" | "ja" | "en";

export const languageLabels: Record<UiLanguage, string> = {
  zh: "中文",
  ja: "日本語",
  en: "English"
};

export const uiText = {
  zh: {
    newChat: "新聊天",
    placePage: "地点页",
    memory: "记忆",
    emptyTitle: "今天想了解什么？",
    inputPlaceholder: "输入消息，或使用 /spot_summary 地点名",
    send: "发送",
    sending: "生成中...",
    update: "更新",
    updating: "更新中",
    updateFailed: "更新失败",
    preview: "预览",
    edit: "编辑",
    delete: "删除",
    language: "语言",
    about: "说明",
    aboutTitle: "应用说明",
    aboutIntro: "这个 Demo 展示一个带长期记忆和 Skill 模式的 AI 聊天框。",
    aboutFeatures: [
      {
        title: "新聊天",
        body: "普通对话入口，会参考记忆文档给出更贴近上下文的回答。"
      },
      {
        title: "地点页",
        body: "新开一段带 /spot_summary 的聊天，用固定结构生成地点摘要。"
      },
      {
        title: "记忆",
        body: "查看、编辑和整理 Markdown 记忆，让后续提问持续受益。"
      }
    ],
    resources: "资源",
    intro: "介绍",
    notes: "留意"
  },
  ja: {
    newChat: "新規チャット",
    placePage: "スポット",
    memory: "メモリ",
    emptyTitle: "今日は何を知りたいですか？",
    inputPlaceholder: "メッセージを入力、または /spot_summary 場所名",
    send: "送信",
    sending: "生成中...",
    update: "更新",
    updating: "更新中",
    updateFailed: "更新失敗",
    preview: "プレビュー",
    edit: "編集",
    delete: "削除",
    language: "言語",
    about: "説明",
    aboutTitle: "アプリ概要",
    aboutIntro: "長期メモリと Skill モードを持つ AI チャット Demo です。",
    aboutFeatures: [
      {
        title: "新規チャット",
        body: "通常の会話入口です。メモリ文書を文脈として回答します。"
      },
      {
        title: "スポット",
        body: "/spot_summary 付きの新しいチャットを開き、場所を構造化して要約します。"
      },
      {
        title: "メモリ",
        body: "Markdown メモリを表示、編集、整理して、後続の質問に活用します。"
      }
    ],
    resources: "リソース",
    intro: "紹介",
    notes: "注目"
  },
  en: {
    newChat: "New Chat",
    placePage: "Place Page",
    memory: "Memory",
    emptyTitle: "What would you like to explore today?",
    inputPlaceholder: "Type a message, or use /spot_summary place name",
    send: "Send",
    sending: "Generating...",
    update: "Update",
    updating: "Updating",
    updateFailed: "Update failed",
    preview: "Preview",
    edit: "Edit",
    delete: "Delete",
    language: "Language",
    about: "About",
    aboutTitle: "About This App",
    aboutIntro: "This demo shows an AI chatbox with long-term memory and a Skill mode.",
    aboutFeatures: [
      {
        title: "New Chat",
        body: "A normal chat entry that can use the memory document as context."
      },
      {
        title: "Place Page",
        body: "Starts a new chat with /spot_summary and renders a structured place summary."
      },
      {
        title: "Memory",
        body: "View, edit, and refine Markdown memory for better future answers."
      }
    ],
    resources: "Resources",
    intro: "Intro",
    notes: "Notes"
  }
} as const;

export type UiText = (typeof uiText)[UiLanguage];
