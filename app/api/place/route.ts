import OpenAI from "openai";
import { createFallbackPlacePage } from "@/lib/place";
import type { PlacePagePayload, PlaceResource, ResourceType } from "@/lib/types";

export const runtime = "nodejs";

type PlaceRequest = {
  placeName: string;
  memory: string;
  requestText?: string;
};

type RawResource = {
  id?: unknown;
  type?: unknown;
  title?: unknown;
  source?: unknown;
  url?: unknown;
  thumbnailLabel?: unknown;
  imageUrl?: unknown;
};

type ResourceCandidate = {
  url: string;
  imageUrl?: string;
};

type ResponseLanguage = "zh" | "ja" | "en";
type StatusReporter = (message: string) => void;
type PlaceResult = {
  payload: PlacePagePayload;
  source: "mock" | "openai_web_search" | "fallback";
};

const model = process.env.OPENAI_PLACE_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5.5";
const maxResources = 3;

function detectResponseLanguage(text: string): ResponseLanguage {
  const content = text.replace(/^\/spot_summary\s*/i, "").trim();

  if (/[\u3040-\u30ff]/.test(content)) {
    return "ja";
  }

  if (/[\u4e00-\u9fff]/.test(content)) {
    return "zh";
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

function statusText(language: ResponseLanguage, step: "search" | "organize" | "images" | "done") {
  const labels: Record<ResponseLanguage, Record<typeof step, string>> = {
    zh: {
      search: "正在联网搜索地点信息",
      organize: "正在整理真实资源",
      images: "正在读取网页图片",
      done: "地点页已生成"
    },
    ja: {
      search: "Webで地点情報を検索中",
      organize: "実際の参考リンクを整理中",
      images: "ページ画像を取得中",
      done: "地点ページを生成しました"
    },
    en: {
      search: "Searching the web for this place",
      organize: "Organizing real resources",
      images: "Reading page images",
      done: "Place page generated"
    }
  };

  return labels[language][step];
}

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function extractJson(text: string) {
  const withoutFence = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return withoutFence.slice(start, end + 1);
  }

  return withoutFence;
}

function isResourceType(value: unknown): value is ResourceType {
  return value === "web" || value === "image" || value === "video";
}

function isUsableUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return false;
    }

    if (
      hostname === "example.com" ||
      hostname === "example.org" ||
      hostname === "example.net" ||
      hostname.endsWith(".example") ||
      hostname === "localhost" ||
      hostname.endsWith(".local") ||
      url.hostname === "127.0.0.1"
    ) {
      return false;
    }

    if (
      (hostname === "google.com" || hostname === "bing.com" || hostname === "duckduckgo.com") &&
      url.pathname.includes("search")
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function hostnameLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}

function inferResourceType(url: string): ResourceType {
  const lowerUrl = url.toLowerCase();
  const hostname = hostnameLabel(url);

  if (
    hostname.includes("youtube.com") ||
    hostname.includes("youtu.be") ||
    hostname.includes("vimeo.com") ||
    hostname.includes("nicovideo.jp")
  ) {
    return "video";
  }

  if (/\.(avif|gif|jpe?g|png|webp)(\?|#|$)/.test(lowerUrl)) {
    return "image";
  }

  return "web";
}

function coerceResource(raw: RawResource, index: number): PlaceResource | null {
  const url = textValue(raw.url);

  if (!url || !isUsableUrl(url)) {
    return null;
  }

  const type = isResourceType(raw.type) ? raw.type : inferResourceType(url);
  const source = textValue(raw.source, hostnameLabel(url));
  const title = textValue(raw.title, source);
  const rawImageUrl = textValue(raw.imageUrl);
  const imageUrl =
    rawImageUrl && isUsableUrl(rawImageUrl)
      ? rawImageUrl
      : isLikelyPreviewImage(url)
        ? url
        : undefined;

  return {
    id: textValue(raw.id, `resource-${index}`),
    type,
    title,
    source,
    url,
    thumbnailLabel: textValue(raw.thumbnailLabel, type.toUpperCase()),
    imageUrl
  };
}

function canonicalResourceKey(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    return `${url.protocol}//${hostname}${pathname}`.toLowerCase();
  } catch {
    return value.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/$/, "").toLowerCase();
  }
}

function dedupeResources(resources: PlaceResource[]) {
  const byUrl = new Map<string, PlaceResource>();

  for (const resource of resources) {
    const key = canonicalResourceKey(resource.url);
    const existing = byUrl.get(key);

    if (!existing) {
      byUrl.set(key, resource);
      continue;
    }

    if (!existing.imageUrl && resource.imageUrl) {
      existing.imageUrl = resource.imageUrl;
    }

    if (existing.type === "web" && resource.type !== "web") {
      existing.type = resource.type;
      existing.thumbnailLabel = resource.thumbnailLabel;
    }

    if (existing.title === existing.source && resource.title !== resource.source) {
      existing.title = resource.title;
    }
  }

  return Array.from(byUrl.values()).map((resource, index) => ({
    ...resource,
    id: resource.id || `resource-${index}`
  }));
}

function parsePayload(
  text: string,
  placeName: string,
  memory: string,
  sourceResources: PlaceResource[]
) {
  try {
    const payload = JSON.parse(extractJson(text)) as Partial<PlacePagePayload>;
    const fallback = createFallbackPlacePage(placeName, memory);
    const resources = Array.isArray(payload.resources)
      ? dedupeResources(
          payload.resources
            .map((resource, index) => coerceResource(resource as RawResource, index))
            .filter((resource): resource is PlaceResource => Boolean(resource))
        )
      : [];

    if (
      typeof payload.placeName === "string" &&
      typeof payload.personalizedIntro === "string" &&
      typeof payload.objectiveDescription === "string" &&
      Array.isArray(payload.userNotes)
    ) {
      const mergedResources = dedupeResources([...resources, ...sourceResources]);

      return {
        ...fallback,
        ...payload,
        resources: mergedResources,
        userNotes: payload.userNotes.filter((note): note is string => typeof note === "string")
      };
    }
  } catch {
    return null;
  }

  return null;
}

function extractSourceResources(output: unknown): PlaceResource[] {
  if (!Array.isArray(output)) {
    return [];
  }

  const candidates: ResourceCandidate[] = [];

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;

    if (record.type !== "web_search_call") {
      continue;
    }

    const action = record.action;

    if (action && typeof action === "object") {
      const actionRecord = action as Record<string, unknown>;
      const actionUrl = textValue(actionRecord.url);

      if (actionUrl) {
        candidates.push({ url: actionUrl });
      }

      const sources = actionRecord.sources;

      if (Array.isArray(sources)) {
        for (const source of sources) {
          if (source && typeof source === "object") {
            const sourceUrl = textValue((source as Record<string, unknown>).url);

            if (sourceUrl) {
              candidates.push({ url: sourceUrl });
            }
          }
        }
      }
    }

    const results = record.results;

    if (Array.isArray(results)) {
      for (const result of results) {
        if (!result || typeof result !== "object") {
          continue;
        }

        const resultRecord = result as Record<string, unknown>;
        const sourceUrl = textValue(resultRecord.source_website_url) || textValue(resultRecord.url);
        const imageUrl =
          textValue(resultRecord.thumbnail_url) || textValue(resultRecord.image_url) || undefined;

        if (sourceUrl) {
          candidates.push({ url: sourceUrl, imageUrl });
        }
      }
    }
  }

  return dedupeResources(
    candidates
      .filter((candidate) => isUsableUrl(candidate.url))
      .map((candidate, index) => ({
        id: `source-${index}`,
        type: inferResourceType(candidate.url),
        title: hostnameLabel(candidate.url),
        source: hostnameLabel(candidate.url),
        url: candidate.url,
        thumbnailLabel: inferResourceType(candidate.url).toUpperCase(),
        imageUrl: candidate.imageUrl
      }))
  ).slice(0, 8);
}

function getMetaAttr(tag: string, attr: string) {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*(?:"([^"]+)"|'([^']+)'|([^\\s>]+))`, "i"));
  return (match?.[1] || match?.[2] || match?.[3])?.trim();
}

function normalizeImageUrl(value: string, pageUrl: string) {
  try {
    const url = new URL(value, pageUrl);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function isLikelyPreviewImage(url: string) {
  const lowerUrl = url.toLowerCase();

  return (
    /\.(avif|jpe?g|png|webp)(\?|#|$)/.test(lowerUrl) &&
    !/(\bicon\b|\bfavicon\b|sprite|blank|loading)/.test(lowerUrl)
  );
}

async function fetchPreviewImage(url: string) {
  if (inferResourceType(url) === "image") {
    return url;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Chatbox-demo/1.0; preview image fetch"
      },
      signal: controller.signal
    });

    const contentType = response.headers.get("content-type") ?? "";
    const contentLength = Number(response.headers.get("content-length") ?? 0);

    if (!response.ok || !contentType.includes("text/html") || contentLength > 2_000_000) {
      return undefined;
    }

    const html = await response.text();
    const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
    const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
    const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];
    const imageKeys = new Set(["og:image", "og:image:secure_url", "twitter:image"]);

    for (const tag of metaTags) {
      const key = getMetaAttr(tag, "property") || getMetaAttr(tag, "name");

      if (!key || !imageKeys.has(key.toLowerCase())) {
        continue;
      }

      const content = getMetaAttr(tag, "content");
      const imageUrl = content ? normalizeImageUrl(content, url) : undefined;

      if (imageUrl) {
        return imageUrl;
      }
    }

    for (const tag of linkTags) {
      const rel = getMetaAttr(tag, "rel")?.toLowerCase();

      if (!rel?.includes("image_src")) {
        continue;
      }

      const href = getMetaAttr(tag, "href");
      const imageUrl = href ? normalizeImageUrl(href, url) : undefined;

      if (imageUrl) {
        return imageUrl;
      }
    }

    for (const tag of imageTags) {
      const src =
        getMetaAttr(tag, "src") ||
        getMetaAttr(tag, "data-src") ||
        getMetaAttr(tag, "data-lazy-src");
      const imageUrl = src ? normalizeImageUrl(src, url) : undefined;

      if (imageUrl && isLikelyPreviewImage(imageUrl)) {
        return imageUrl;
      }
    }
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }

  return undefined;
}

async function enrichResourceImages(resources: PlaceResource[]) {
  return Promise.all(
    resources.map(async (resource) => ({
      ...resource,
      imageUrl: resource.imageUrl || (isLikelyPreviewImage(resource.url) ? resource.url : await fetchPreviewImage(resource.url))
    }))
  );
}

async function createPlaceResult(body: PlaceRequest, reportStatus: StatusReporter): Promise<PlaceResult> {
  const fallback = createFallbackPlacePage(body.placeName, body.memory);
  const apiKey = process.env.OPENAI_API_KEY;
  const requestText = body.requestText || `/spot_summary ${body.placeName}`;
  const responseLanguage = detectResponseLanguage(requestText);

  if (!apiKey) {
    reportStatus(statusText(responseLanguage, "done"));
    return { payload: fallback, source: "mock" };
  }

  const client = new OpenAI({ apiKey });
  const outputLanguage = languageInstruction(responseLanguage);
  const prompt = `Create a compact structured place page JSON for this consumer assistant demo.

You must use web search for this request. Ground every factual description and every resource URL in current web information.

Rules:
- Return valid JSON only. No markdown fences, no commentary outside JSON.
- All user-facing JSON string values must be in ${outputLanguage}. This overrides the memory document language.
- Do not answer in English unless the detected user request language is English.
- The user request is: ${requestText}
- Keep each section short and useful in a chat UI.
- Personalize quietly with memory when relevant, but do not say "I used memory".
- Do not invent URLs. Resource URLs must be real pages found through web search.
- Do not return duplicate resource pages. Each resource must point to a different page.
- Prefer resources that expose a page image, thumbnail, or image search result.
- Prefer official pages, venue pages, local government pages, trusted travel/culture guides, map/wiki pages, or relevant video/photo pages.
- If fewer than 3 reliable resources are available, return fewer resources rather than fake links.

JSON shape:
{
  "placeName": "string",
  "personalizedIntro": "1-2 short sentences",
  "objectiveDescription": "one concise paragraph based on web information",
  "resources": [
    {
      "id": "short-stable-id",
      "type": "web | image | video",
      "title": "short source title",
      "source": "site or publisher name",
      "url": "https://real-source-url.example",
      "thumbnailLabel": "WEB | IMG | VID"
    }
  ],
  "userNotes": ["2-3 short notes"]
}

Place name: ${body.placeName}

Memory document:
${body.memory || "(empty)"}`;

  const webSearchTool = {
    type: "web_search",
    search_context_size: "medium",
    search_content_types: ["image", "text"],
    image_settings: {
      max_results: 5,
      caption: true
    },
    user_location: {
      type: "approximate",
      city: "Tokyo",
      country: "JP",
      timezone: "Asia/Tokyo"
    }
  } as const;

  reportStatus(statusText(responseLanguage, "search"));

  const response = await client.responses.create({
    model,
    reasoning: { effort: "low" },
    tools: [webSearchTool],
    tool_choice: "required",
    include: ["web_search_call.results", "web_search_call.action.sources"],
    input: prompt
  });

  reportStatus(statusText(responseLanguage, "organize"));

  const sourceResources = extractSourceResources(response.output);
  const parsed = parsePayload(response.output_text, body.placeName, body.memory, sourceResources);
  const payload = parsed ?? {
    ...fallback,
    resources: sourceResources.length ? sourceResources : fallback.resources
  };

  reportStatus(statusText(responseLanguage, "images"));

  const resources = await enrichResourceImages(payload.resources);
  const rankedResources = dedupeResources(resources).sort((a, b) => {
    if (Boolean(a.imageUrl) === Boolean(b.imageUrl)) {
      return 0;
    }

    return a.imageUrl ? -1 : 1;
  });
  const finalPayload = {
    ...payload,
    resources: rankedResources.slice(0, maxResources)
  };

  reportStatus(statusText(responseLanguage, "done"));

  return {
    payload: finalPayload,
    source: parsed ? "openai_web_search" : "fallback"
  };
}

function streamEvent(controller: ReadableStreamDefaultController<Uint8Array>, event: unknown) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
}

export async function POST(request: Request) {
  const body = (await request.json()) as PlaceRequest;
  const wantsStream = request.headers.get("accept")?.includes("application/x-ndjson");

  if (wantsStream) {
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const result = await createPlaceResult(body, (message) => {
            streamEvent(controller, { type: "status", message });
          });

          streamEvent(controller, { type: "final", ...result });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Place page generation failed.";
          streamEvent(controller, { type: "error", error: message });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/x-ndjson; charset=utf-8"
      }
    });
  }

  try {
    const result = await createPlaceResult(body, () => undefined);

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Place page generation failed.";

    return Response.json({ error: message }, { status: 500 });
  }
}
