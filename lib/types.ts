export type AppMode = "chat" | "place" | "memory";

export type MessageRole = "user" | "assistant";

export type ResourceType = "image" | "video" | "web";

export type PlaceResource = {
  id: string;
  type: ResourceType;
  title: string;
  source: string;
  url: string;
  thumbnailLabel: string;
  imageUrl?: string;
};

export type PlacePagePayload = {
  placeName: string;
  personalizedIntro: string;
  resources: PlaceResource[];
  objectiveDescription: string;
  userNotes: string[];
};

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  memoryUsed?: boolean;
  placePage?: PlacePagePayload;
};

export type Conversation = {
  id: string;
  mode: Exclude<AppMode, "memory">;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};
