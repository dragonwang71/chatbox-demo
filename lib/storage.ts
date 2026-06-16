"use client";

import { defaultMemory, legacyDefaultMemoryMarkers, seedConversations } from "@/lib/demoData";
import type { UiLanguage } from "@/lib/i18n";
import type { Conversation } from "@/lib/types";

const conversationsKey = "agent-i-demo-conversations";
const languageKey = "agent-i-demo-language";
const languageDefaultVersionKey = "agent-i-demo-language-default-version";
const currentLanguageDefaultVersion = "ja-default-2026-06";
const memoryKey = "agent-i-demo-memory";

function isLegacyDefaultMemory(memory: string) {
  const markerMatches = legacyDefaultMemoryMarkers.filter((marker) => memory.includes(marker));

  return markerMatches.length >= 2;
}

export function loadConversations() {
  if (typeof window === "undefined") {
    return seedConversations;
  }

  try {
    const stored = window.localStorage.getItem(conversationsKey);
    return stored ? (JSON.parse(stored) as Conversation[]) : seedConversations;
  } catch {
    return seedConversations;
  }
}

export function saveConversations(conversations: Conversation[]) {
  window.localStorage.setItem(conversationsKey, JSON.stringify(conversations));
}

export function loadMemory() {
  if (typeof window === "undefined") {
    return defaultMemory;
  }

  try {
    const stored = window.localStorage.getItem(memoryKey);
    if (!stored?.trim()) {
      return defaultMemory;
    }

    if (isLegacyDefaultMemory(stored)) {
      window.localStorage.setItem(memoryKey, defaultMemory);
      return defaultMemory;
    }

    return stored;
  } catch {
    return defaultMemory;
  }
}

export function saveMemory(memory: string) {
  window.localStorage.setItem(memoryKey, memory);
}

export function loadLanguage(): UiLanguage {
  if (typeof window === "undefined") {
    return "ja";
  }

  const stored = window.localStorage.getItem(languageKey);
  const defaultVersion = window.localStorage.getItem(languageDefaultVersionKey);

  if (!defaultVersion && stored === "en") {
    window.localStorage.setItem(languageKey, "ja");
    window.localStorage.setItem(languageDefaultVersionKey, currentLanguageDefaultVersion);
    return "ja";
  }

  if (stored === "ja" || stored === "en" || stored === "zh") {
    window.localStorage.setItem(languageDefaultVersionKey, currentLanguageDefaultVersion);
    return stored;
  }

  window.localStorage.setItem(languageDefaultVersionKey, currentLanguageDefaultVersion);
  return "ja";
}

export function saveLanguage(language: UiLanguage) {
  window.localStorage.setItem(languageKey, language);
  window.localStorage.setItem(languageDefaultVersionKey, currentLanguageDefaultVersion);
}
