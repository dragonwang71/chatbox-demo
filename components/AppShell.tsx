"use client";

import { useEffect, useMemo, useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { MemoryPanel } from "@/components/MemoryPanel";
import { Sidebar } from "@/components/Sidebar";
import { createId, createTitle } from "@/lib/demoData";
import { uiText } from "@/lib/i18n";
import {
  loadConversations,
  loadLanguage,
  loadMemory,
  saveConversations,
  saveLanguage,
  saveMemory
} from "@/lib/storage";
import type { UiLanguage } from "@/lib/i18n";
import type { AppMode, ChatMessage, Conversation, PlacePagePayload } from "@/lib/types";

const spotSummaryCommand = "/spot_summary ";

type ComposerPrefill = {
  id: number;
  value: string;
  behavior: "replace" | "prepend";
};

type PlaceStreamEvent =
  | { type: "status"; message: string }
  | { type: "final"; payload?: PlacePagePayload }
  | { type: "error"; error?: string };

type AssistantResult = {
  content?: string;
  payload?: PlacePagePayload;
};

function createConversation(): Conversation {
  const now = new Date().toISOString();

  return {
    id: createId("chat"),
    mode: "chat",
    title: "新的聊天",
    messages: [],
    createdAt: now,
    updatedAt: now
  };
}

function parseSpotSummary(text: string) {
  if (!text.startsWith(spotSummaryCommand)) {
    return null;
  }

  return text.slice(spotSummaryCommand.length).trim();
}

function parsePlaceStreamEvent(line: string): PlaceStreamEvent | null {
  try {
    const event = JSON.parse(line) as Partial<PlaceStreamEvent>;

    if (event.type === "status" || event.type === "final" || event.type === "error") {
      return event as PlaceStreamEvent;
    }
  } catch {
    return null;
  }

  return null;
}

async function readPlaceResponse(
  response: Response,
  onStatus: (message: string) => void
): Promise<AssistantResult> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.body || !contentType.includes("application/x-ndjson")) {
    return (await response.json()) as { payload?: PlacePagePayload };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: { payload?: PlacePagePayload } | null = null;

  function handleLine(line: string) {
    const event = parsePlaceStreamEvent(line);

    if (!event) {
      return;
    }

    if (event.type === "status" && event.message) {
      onStatus(event.message);
      return;
    }

    if (event.type === "error") {
      throw new Error(event.error ?? "Place page generation failed.");
    }

    if (event.type === "final") {
      finalResult = { payload: event.payload };
    }
  }

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    while (buffer.includes("\n")) {
      const newlineIndex = buffer.indexOf("\n");
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);

      if (line) {
        handleLine(line);
      }
    }
  }

  const lastLine = buffer.trim();

  if (lastLine) {
    handleLine(lastLine);
  }

  if (!finalResult) {
    throw new Error("Place page generation did not return a final result.");
  }

  return finalResult;
}

export function AppShell() {
  const [mode, setMode] = useState<AppMode>("chat");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [draftConversation, setDraftConversation] = useState<Conversation | null>(null);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [memory, setMemory] = useState("");
  const [language, setLanguage] = useState<UiLanguage>("ja");
  const [isReady, setIsReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<string[]>([]);
  const [composerPrefill, setComposerPrefill] = useState<ComposerPrefill>({
    id: 0,
    value: "",
    behavior: "replace"
  });

  useEffect(() => {
    const storedConversations = loadConversations();
    const firstConversation = storedConversations[0] ?? createConversation();

    setConversations(storedConversations);
    setActiveConversationId(firstConversation.id);
    setLanguage(loadLanguage());
    setMemory(loadMemory());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) {
      saveConversations(conversations);
    }
  }, [conversations, isReady]);

  useEffect(() => {
    if (isReady) {
      saveLanguage(language);
    }
  }, [isReady, language]);

  const text = uiText[language];

  const activeConversation = useMemo(() => {
    const savedConversation = conversations.find(
      (conversation) => conversation.id === activeConversationId
    );

    if (savedConversation) {
      return savedConversation;
    }

    if (draftConversation?.id === activeConversationId) {
      return draftConversation;
    }

    return undefined;
  }, [activeConversationId, conversations, draftConversation]);

  function upsertConversation(nextConversation: Conversation) {
    setConversations((current) => {
      const exists = current.some((conversation) => conversation.id === nextConversation.id);
      const next = exists
        ? current.map((conversation) =>
            conversation.id === nextConversation.id ? nextConversation : conversation
          )
        : [nextConversation, ...current];

      return next.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
  }

  function startConversation(prefill = "") {
    const nextConversation = createConversation();

    setDraftConversation(nextConversation);
    setActiveConversationId(nextConversation.id);
    setMode("chat");
    setComposerPrefill((current) => ({
      id: current.id + 1,
      value: prefill,
      behavior: "replace"
    }));
  }

  function selectConversation(conversation: Conversation) {
    setDraftConversation(null);
    setActiveConversationId(conversation.id);
    setMode("chat");
  }

  function deleteConversation(conversationId: string) {
    const remainingConversations = conversations.filter(
      (conversation) => conversation.id !== conversationId
    );

    setConversations(remainingConversations);

    if (activeConversationId !== conversationId) {
      return;
    }

    setDraftConversation(null);

    const nextConversation = remainingConversations[0];

    if (nextConversation) {
      setActiveConversationId(nextConversation.id);
      return;
    }

    const nextDraftConversation = createConversation();

    setDraftConversation(nextDraftConversation);
    setActiveConversationId(nextDraftConversation.id);
    setComposerPrefill((current) => ({
      id: current.id + 1,
      value: "",
      behavior: "replace"
    }));
  }

  function openSpotSummary() {
    startConversation(spotSummaryCommand);
  }

  function openMemory() {
    setMode("memory");
  }

  function handleMemorySave(nextMemory: string) {
    setMemory(nextMemory);
    saveMemory(nextMemory);
  }

  async function refreshMemory(nextMemory: string) {
    const recentMessages = conversations
      .flatMap((conversation) => conversation.messages)
      .filter((message) => message.content.trim())
      .slice(-30)
      .map(({ role, content }) => ({ role, content }));

    const response = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memory: nextMemory,
        messages: recentMessages
      })
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(errorBody?.error ?? "Memory update failed.");
    }

    const result = (await response.json()) as { memory?: string };
    const updatedMemory = result.memory?.trim();

    if (updatedMemory) {
      handleMemorySave(updatedMemory);
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();

    if (!trimmed || !activeConversation || isSending) {
      return;
    }

    const placeQuery = parseSpotSummary(trimmed);
    const isSpotSummary = placeQuery !== null;
    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: createId("msg"),
      role: "user",
      content: trimmed,
      createdAt: now
    };

    const titleSource = isSpotSummary ? placeQuery || "地点摘要" : trimmed;
    const pendingConversation: Conversation = {
      ...activeConversation,
      mode: "chat",
      title:
        activeConversation.messages.length === 0
          ? createTitle(titleSource, activeConversation.title)
          : activeConversation.title,
      messages: [...activeConversation.messages, userMessage],
      updatedAt: now
    };

    upsertConversation(pendingConversation);
    setDraftConversation(null);
    setIsSending(true);
    setGenerationSteps([]);

    function addGenerationStep(message: string) {
      setGenerationSteps((current) => (current.includes(message) ? current : [...current, message]));
    }

    try {
      const result: AssistantResult = isSpotSummary
        ? await (async () => {
            const response = await fetch("/api/place", {
              method: "POST",
              headers: {
                Accept: "application/x-ndjson",
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                placeName: placeQuery || "这个地点",
                memory,
                requestText: trimmed
              })
            });

            if (!response.ok) {
              const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
              throw new Error(errorBody?.error ?? "AI request failed.");
            }

            return readPlaceResponse(response, addGenerationStep);
          })()
        : await (async () => {
            const response = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: pendingConversation.messages.map(({ role, content }) => ({
                  role,
                  content
                })),
                memory
              })
            });

            if (!response.ok) {
              const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
              throw new Error(errorBody?.error ?? "AI request failed.");
            }

            return (await response.json()) as AssistantResult;
          })();

      const assistantMessage: ChatMessage = isSpotSummary
        ? {
            id: createId("msg"),
            role: "assistant",
            content: "",
            createdAt: new Date().toISOString(),
            placePage: result.payload
          }
        : {
            id: createId("msg"),
            role: "assistant",
            content: result.content ?? "没有收到有效回复。",
            createdAt: new Date().toISOString()
          };

      upsertConversation({
        ...pendingConversation,
        messages: [...pendingConversation.messages, assistantMessage],
        updatedAt: assistantMessage.createdAt
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "请求失败，请检查服务端配置后重试。";

      upsertConversation({
        ...pendingConversation,
        messages: [
          ...pendingConversation.messages,
          {
            id: createId("msg"),
            role: "assistant",
            content: `请求失败：${message}`,
            createdAt: new Date().toISOString()
          }
        ],
        updatedAt: new Date().toISOString()
      });
    } finally {
      setIsSending(false);
      setGenerationSteps([]);
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[#f7f4ee] text-[#24211c] max-md:flex-col">
      <Sidebar
        activeConversationId={activeConversationId}
        conversations={conversations}
        language={language}
        mode={mode}
        onDeleteConversation={deleteConversation}
        onLanguageChange={setLanguage}
        onNewChat={() => startConversation()}
        onOpenMemory={openMemory}
        onOpenPlace={openSpotSummary}
        onSelectConversation={selectConversation}
        text={text}
      />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f7f4ee]">
        {mode === "memory" ? (
          <MemoryPanel
            memory={memory}
            onRefresh={refreshMemory}
            onSave={handleMemorySave}
            text={text}
          />
        ) : (
          <ChatPanel
            composerPrefill={composerPrefill}
            conversation={activeConversation}
            generationSteps={generationSteps}
            isSending={isSending}
            onSend={sendMessage}
            text={text}
          />
        )}
      </main>
    </div>
  );
}
