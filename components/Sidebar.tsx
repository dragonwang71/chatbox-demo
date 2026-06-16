"use client";

import { useState } from "react";
import {
  BookOpen,
  Check,
  Info,
  Languages,
  MapPinned,
  MessageSquare,
  SquarePen,
  Trash2
} from "lucide-react";
import { languageLabels, type UiLanguage, type UiText } from "@/lib/i18n";
import type { AppMode, Conversation } from "@/lib/types";

type SidebarProps = {
  mode: AppMode;
  conversations: Conversation[];
  activeConversationId: string;
  language: UiLanguage;
  text: UiText;
  onDeleteConversation: (conversationId: string) => void;
  onLanguageChange: (language: UiLanguage) => void;
  onNewChat: () => void;
  onOpenPlace: () => void;
  onOpenMemory: () => void;
  onSelectConversation: (conversation: Conversation) => void;
};

export function Sidebar({
  mode,
  conversations,
  activeConversationId,
  language,
  text,
  onDeleteConversation,
  onLanguageChange,
  onNewChat,
  onOpenPlace,
  onOpenMemory,
  onSelectConversation
}: SidebarProps) {
  const [menuConversationId, setMenuConversationId] = useState<string | null>(null);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  function toggleLanguage() {
    setIsLanguageOpen((current) => !current);
    setIsAboutOpen(false);
    setMenuConversationId(null);
  }

  function toggleAbout() {
    setIsAboutOpen((current) => !current);
    setIsLanguageOpen(false);
    setMenuConversationId(null);
  }

  return (
    <aside className="flex shrink-0 border-b border-[#ded8cf] bg-[#f7f4ee] text-[#24211c] md:h-dvh md:w-[280px] md:flex-col md:border-b-0 md:border-r">
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 p-3 md:p-4">
        <div className="shrink-0 px-1 py-1">
          <p className="text-lg font-semibold leading-tight">Chatbox Demo</p>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-1 md:grid-cols-1">
          <NavButton icon={<SquarePen size={20} />} onClick={onNewChat}>
            {text.newChat}
          </NavButton>
          <NavButton icon={<MapPinned size={20} />} onClick={onOpenPlace}>
            {text.placePage}
          </NavButton>
          <NavButton active={mode === "memory"} icon={<BookOpen size={20} />} onClick={onOpenMemory}>
            {text.memory}
          </NavButton>
        </div>

        <div className="hidden min-h-0 flex-1 border-t border-[#ded8cf] pt-4 md:flex md:flex-col">
          <div className="mb-2 flex items-center gap-2 px-2 text-sm font-medium uppercase tracking-[0.08em] text-[#82796c]">
            <MessageSquare size={13} />
            Chat History
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
            {conversations.map((conversation) => (
              <div className="relative" key={conversation.id}>
                <button
                  className={`w-full rounded-md px-2.5 py-2 pr-16 text-left text-base transition ${
                    conversation.id === activeConversationId && mode !== "memory"
                      ? "bg-[#ebe7df] text-[#24211c]"
                      : "text-[#5f574c] hover:bg-[#eeebe4] hover:text-[#24211c]"
                  }`}
                  onClick={() => {
                    setMenuConversationId(null);
                    onSelectConversation(conversation);
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setMenuConversationId(conversation.id);
                    setIsLanguageOpen(false);
                    setIsAboutOpen(false);
                  }}
                  type="button"
                >
                  <span className="block truncate">{conversation.title}</span>
                </button>

                {menuConversationId === conversation.id ? (
                  <button
                    className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md bg-[#fbe7e7] px-2 py-1 text-sm font-medium text-[#b42318] transition hover:bg-[#f7d4d4]"
                    onClick={() => {
                      onDeleteConversation(conversation.id);
                      setMenuConversationId(null);
                    }}
                    type="button"
                  >
                    <Trash2 size={13} />
                    {text.delete}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-auto hidden shrink-0 md:block">
          {isLanguageOpen ? (
            <div className="mb-2 rounded-xl bg-[#fbfaf7] p-2 shadow-sm ring-1 ring-[#ded8cf]">
              {(["ja", "en", "zh"] as UiLanguage[]).map((option) => (
                <button
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-base transition ${
                    language === option
                      ? "bg-[#e4eadb] text-[#24211c]"
                      : "text-[#5f574c] hover:bg-[#eeebe4] hover:text-[#24211c]"
                  }`}
                  key={option}
                  onClick={() => {
                    onLanguageChange(option);
                    setIsLanguageOpen(false);
                  }}
                  type="button"
                >
                  <span>{languageLabels[option]}</span>
                  {language === option ? <Check className="text-[#5a705c]" size={14} /> : null}
                </button>
              ))}
            </div>
          ) : null}

          {isAboutOpen ? (
            <div className="mb-2 rounded-xl bg-[#fbfaf7] p-4 shadow-sm ring-1 ring-[#ded8cf]">
              <h2 className="text-base font-semibold">{text.aboutTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-[#5f574c]">{text.aboutIntro}</p>
              <div className="mt-3 space-y-3">
                {text.aboutFeatures.map((feature) => (
                  <section key={feature.title}>
                    <h3 className="text-sm font-semibold text-[#24211c]">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#5f574c]">{feature.body}</p>
                  </section>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex justify-start gap-2">
            <UtilityButton
              active={isAboutOpen}
              icon={<Info size={18} />}
              label={text.about}
              onClick={toggleAbout}
            />
            <UtilityButton
              active={isLanguageOpen}
              icon={<Languages size={18} />}
              label={text.language}
              onClick={toggleLanguage}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavButton({
  active,
  children,
  icon,
  onClick
}: {
  active?: boolean;
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex min-h-10 items-center justify-center gap-3 rounded-md px-2 text-base font-medium outline-none transition focus:outline-none focus-visible:bg-[#eeebe4] md:justify-start ${
        active ? "bg-[#ebe7df]" : "bg-transparent hover:bg-[#eeebe4]"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}

function UtilityButton({
  active,
  icon,
  label,
  onClick
}: {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-md outline-none transition focus-visible:bg-[#eeebe4] ${
        active ? "bg-[#ebe7df] text-[#24211c]" : "text-[#5f574c] hover:bg-[#eeebe4]"
      }`}
      onClick={onClick}
      title={label}
      type="button"
    >
      {icon}
    </button>
  );
}
