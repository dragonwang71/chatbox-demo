# Chatbox Demo

**日本語** | [English](docs/README.en.md) | [中文](docs/README.zh-CN.md)

Chatbox Demo は、2C 向け AI アシスタントの使い方を小さく試す Web デモです。  
目的はフル機能のチャットアプリを作ることではなく、長期記憶、構造化された Skill 出力、Web 情報を使った場所ページを、ひとつのシンプルな UI の中で見せることです。

## 背景

一般ユーザー向け AI では、強いモデルをそのまま置くだけでは十分ではありません。ユーザーの日常、好み、移動、関心を自然に扱い、必要な場面で分かりやすい形に変換することが重要です。

このデモでは、その考えを小さく実装しています。

- 通常のチャットは、記憶文書を文脈として使う。
- Memory 画面では、ユーザーの長期文脈を Markdown として見える形にする。
- Place Page では、`/spot_summary` をきっかけに場所向けの構造化 Skill を呼び出す。
- 場所ページは Web Search を使い、回答とリソースを実際のネット情報に寄せる。

## 主な機能

- **New Chat**: OpenAI API を使った通常チャット。
- **Place Page**: 場所名から、要約、参考リソース、概要、注目ポイントを構造化表示。
- **Memory**: ユーザー記憶を Markdown でプレビュー、編集、更新。
- **Chat History**: 会話が始まった後だけ履歴に表示。
- **Language Switch**: UI 言語を日本語、英語、中国語に切り替え。
- **Local-first Storage**: 会話、記憶、言語設定はブラウザの `localStorage` に保存。

## 使い方

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## 環境変数

`.env.example` を `.env.local` にコピーして設定します。

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
OPENAI_PLACE_MODEL=gpt-5.5
```

`.env.local` は Git に含めません。API key は GitHub にコミットしないでください。

## 動作フロー

```mermaid
flowchart TD
  A["User opens Chatbox Demo"] --> B{"Entry"}
  B --> C["New Chat"]
  B --> D["Place Page"]
  B --> E["Memory"]

  C --> C1["Read memory from localStorage"]
  C1 --> C2["Call /api/chat"]
  C2 --> C3["Render assistant answer"]
  C3 --> C4["Save conversation locally"]

  D --> D1["Prepend /spot_summary to input"]
  D1 --> D2["Call /api/place"]
  D2 --> D3["Use OpenAI Web Search"]
  D3 --> D4["Render structured place page"]
  D4 --> D5["Save conversation locally"]

  E --> E1["Preview Markdown memory"]
  E --> E2["Edit memory"]
  E --> E3["Update memory with /api/memory"]
```

## アーキテクチャ

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
  PlaceAPI --> Search["OpenAI Web Search"]

  OpenAI --> ChatAPI
  OpenAI --> PlaceAPI
  OpenAI --> MemoryAPI

  ChatAPI --> UI
  PlaceAPI --> UI
  MemoryAPI --> UI
```

## プロジェクト構成

```txt
app/
  api/
    chat/      # 通常チャット API
    memory/    # 記憶更新 API
    place/     # 場所ページ生成 API
components/   # UI components
lib/          # data model, storage, i18n, fallback logic
docs/         # English / Chinese README
```

## 実装上の判断

このデモでは、あえて複雑な仕組みを入れていません。

- ログインなし
- データベースなし
- ベクトル検索なし
- 地図 API なし
- 複雑な Agent framework なし

理由は、何を見せたいかを明確にするためです。中心は、AI をただのチャット欄ではなく、ユーザー文脈と Skill 的な出力モードを持つプロダクトとして見せることです。

## 今後の改善案

- 公開デモサイトとしてデプロイする。
- Place Page のリソース抽出精度を改善する。
- Memory 更新の差分確認 UI を追加する。
- デモ用の初期ユーザー記憶を複数パターン用意する。
- API 利用量を抑えるための簡単な rate limit を追加する。

## 注意

このリポジトリには個人メモや開発中の補助ファイルは含めません。公開するのは、アプリ本体、README、実行に必要な設定テンプレートのみです。
