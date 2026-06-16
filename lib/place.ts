import type { PlacePagePayload, PlaceResource } from "@/lib/types";

const baseResources: PlaceResource[] = [
  {
    id: "official",
    type: "web",
    title: "Reference",
    source: "Mock",
    url: "https://www.japan.travel/",
    thumbnailLabel: "WEB"
  },
  {
    id: "photo",
    type: "image",
    title: "Photo",
    source: "Mock",
    url: "https://unsplash.com/",
    thumbnailLabel: "IMG"
  },
  {
    id: "video",
    type: "video",
    title: "Video",
    source: "Mock",
    url: "https://www.youtube.com/",
    thumbnailLabel: "VID"
  }
];

function memoryHint(memory: string) {
  const hasTokyoContext = /Tokyo|東京|tokyo|city|urban|neighborhood|station|cafe|museum/i.test(
    memory
  );

  if (hasTokyoContext) {
    return "It is framed as a simple city-place summary for someone exploring Tokyo.";
  }

  return "It gives a compact overview without relying on live maps or search.";
}

export function createFallbackPlacePage(placeName: string, memory: string): PlacePagePayload {
  const safeName = placeName.trim() || "this place";

  return {
    placeName: safeName,
    personalizedIntro: `${safeName} is a useful example for a structured place page. ${memoryHint(
      memory
    )}`,
    resources: baseResources,
    objectiveDescription: `${safeName} can be summarized through its location context, atmosphere, visit purpose, and practical notes. This demo keeps the resource area as fixed mock links instead of live map or web search data.`,
    userNotes: [
      "Good for showing how a place question becomes a structured output.",
      "The resource cards are mock links and can later be replaced with live sources.",
      "Useful details include access, timing, crowd level, and what to notice."
    ]
  };
}
