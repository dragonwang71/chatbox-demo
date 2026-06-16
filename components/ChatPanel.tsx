"use client";

import { SendHorizontal } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { PlacePageCard } from "@/components/PlacePageCard";
import type { UiText } from "@/lib/i18n";
import type { Conversation } from "@/lib/types";

type ChatPanelProps = {
  conversation?: Conversation;
  composerPrefill: {
    id: number;
    value: string;
    behavior: "replace" | "prepend";
  };
  generationSteps: string[];
  isSending: boolean;
  onSend: (text: string) => void;
  text: UiText;
};

export function ChatPanel({
  conversation,
  composerPrefill,
  generationSteps,
  isSending,
  onSend,
  text
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const hasMessages = Boolean(conversation?.messages.length);

  useEffect(() => {
    if (composerPrefill.behavior === "prepend") {
      setDraft((currentDraft) => {
        if (currentDraft.startsWith(composerPrefill.value)) {
          return currentDraft;
        }

        return `${composerPrefill.value}${currentDraft}`;
      });
      return;
    }

    setDraft(composerPrefill.value);
  }, [composerPrefill]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextText = draft.trim();

    if (!nextText) {
      return;
    }

    onSend(nextText);
    setDraft("");
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f7f4ee]">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8">
        <div className="mx-auto flex w-full max-w-[780px] flex-col gap-6">
          {!hasMessages ? <EmptyState text={text} /> : null}

          {conversation?.messages.map((message) => {
            if (message.placePage) {
              return <PlacePageCard key={message.id} payload={message.placePage} text={text} />;
            }

            if (!message.content.trim()) {
              return null;
            }

            return (
              <div
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                key={message.id}
              >
                <div
                  className={`max-w-[88%] whitespace-pre-wrap text-base leading-8 ${
                    message.role === "user"
                      ? "rounded-2xl bg-[#e4eadb] px-4 py-2.5 text-[#24211c]"
                      : "text-[#2d2a25]"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            );
          })}

          {isSending ? <GenerationProgress steps={generationSteps} fallback={text.sending} /> : null}
        </div>
      </div>

      <div className="shrink-0 bg-[#f7f4ee] px-5 py-4">
        <form
          className="mx-auto flex w-full max-w-[780px] items-end gap-3 rounded-2xl border border-[#ded8cf] bg-[#fbfaf7] px-3 py-3"
          onSubmit={handleSubmit}
        >
          <textarea
            className="min-h-10 flex-1 bg-transparent px-1 py-2 text-lg leading-8 text-[#24211c] outline-none placeholder:text-[#9a9183]"
            disabled={isSending}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={text.inputPlaceholder}
            value={draft}
          />
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2f5f43] text-white transition hover:bg-[#254d36] disabled:bg-[#b8ad9d]"
            disabled={isSending || !draft.trim()}
            title={text.send}
            type="submit"
          >
            <SendHorizontal size={17} />
          </button>
        </form>
      </div>
    </section>
  );
}

function EmptyState({ text }: { text: UiText }) {
  return (
    <div className="pt-[18vh] text-center">
      <p className="text-xl font-semibold text-[#24211c]">{text.emptyTitle}</p>
    </div>
  );
}

function GenerationProgress({ fallback, steps }: { fallback: string; steps: string[] }) {
  const visibleSteps = steps.length ? steps : [fallback];

  return (
    <div className="max-w-[88%] text-base leading-8 text-[#7c7466]">
      {visibleSteps.map((step, index) => (
        <div className="flex items-center gap-2" key={`${step}-${index}`}>
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              index === visibleSteps.length - 1 ? "bg-[#2f5f43]" : "bg-[#b8ad9d]"
            }`}
          />
          <span>{step}</span>
        </div>
      ))}
    </div>
  );
}
