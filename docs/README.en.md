# Chatbox Demo

[日本語](../README.md) | **English** | [中文](README.zh-CN.md)

Chatbox Demo is a small web demo for exploring consumer AI assistant patterns.  
It is not intended to be a full chat product. The goal is to demonstrate long-term memory, skill-like structured output, and web-backed place summaries inside a simple, usable interface.

## Why This Demo

For consumer AI, a powerful model alone is not enough. The assistant should understand user context, fit into everyday scenarios, and turn vague requests into useful product surfaces.

This demo explores that idea in a compact way:

- Normal chat can use both the long-term memory document and web search.
- Memory is visible and editable as Markdown.
- Place Page is not a separate product flow. It only prepends `/spot_summary` to the same chat input.
- When the chat input contains `/spot_summary`, the app runs the structured place-page skill.

## Features

- **New Chat**: normal chat with memory and web search.
- **Place Page**: prepends `/spot_summary` and generates a structured place page.
- **Memory**: preview, edit, and update long-term Markdown memory.
- **Chat History**: conversations appear after messages exist.
- **Language Switch**: Japanese, English, and Chinese UI.
- **Local-first Storage**: conversations, memory, and language settings are stored in browser `localStorage`.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env.local`.

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
OPENAI_PLACE_MODEL=gpt-5.5
```

Do not commit `.env.local` or any API key.

## Flow

```mermaid
flowchart TD
  A["User opens Chatbox Demo"] --> B{"Entry"}
  B --> C["New Chat"]
  B --> D["Place Page"]
  B --> E["Memory"]

  C --> F["Open the same chat composer"]
  D --> D1["Prepend /spot_summary to input"]
  D1 --> F

  F --> G["Send message"]
  G --> H["Read memory from localStorage"]
  H --> I["Use OpenAI Web Search"]
  I --> J{"Skill prefix?"}
  J -->|No skill| K["Call /api/chat"]
  J -->|/spot_summary| L["Call /api/place"]
  K --> M["Render assistant answer"]
  L --> N["Render structured place page"]
  M --> O["Save conversation locally"]
  N --> O

  E --> E1["Preview Markdown memory"]
  E --> E2["Edit memory"]
  E --> E3["Update memory with /api/memory"]
```

## Architecture

```mermaid
flowchart LR
  User["User"] --> UI["Next.js UI"]

  UI --> Local["localStorage<br/>conversations / memory / language"]
  UI --> ChatAPI["/api/chat"]
  UI --> PlaceAPI["/api/place"]
  UI --> MemoryAPI["/api/memory"]

  ChatAPI --> OpenAI["OpenAI Responses API"]
  MemoryAPI --> OpenAI
  PlaceAPI --> OpenAI
  ChatAPI --> Search["OpenAI Web Search"]
  PlaceAPI --> Search["OpenAI Web Search"]

  OpenAI --> ChatAPI
  OpenAI --> PlaceAPI
  OpenAI --> MemoryAPI

  ChatAPI --> UI
  PlaceAPI --> UI
  MemoryAPI --> UI
```

## Project Structure

```txt
app/
  api/
    chat/      # normal chat API
    memory/    # memory update API
    place/     # structured place page API
components/   # UI components
lib/          # data model, storage, i18n, fallback logic
docs/         # localized README files
```

## Scope

The demo intentionally avoids:

- login / multi-user accounts
- database setup
- vector search
- map APIs
- complex agent frameworks
- admin dashboards

The focus is to show how memory and structured skills can make an AI chatbox feel more productized.

## Future Improvements

- Deploy a public demo site.
- Improve resource extraction for Place Page.
- Add a review step before memory updates.
- Prepare multiple demo user memory profiles.
- Add lightweight rate limiting for public deployment.
