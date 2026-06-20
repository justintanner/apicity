# @apicity/telegram

[![npm](https://img.shields.io/npm/v/@apicity/telegram?color=cb0000)](https://www.npmjs.com/package/@apicity/telegram)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-core.telegram.org-blue)](https://core.telegram.org/bots/api)

Telegram Bot API provider for sending text, photo, video, and audio messages.

Runtime dependencies:

- `zod@^3.24.0` — request schemas attached to every POST endpoint as `.schema`

## Installation

```bash
npm install @apicity/telegram
# or
pnpm add @apicity/telegram
```

## Quick Start

```typescript
import { createTelegram } from "@apicity/telegram";

const telegram = createTelegram({ botToken: process.env.TELEGRAM_BOT_KEY! });
```

## Setup

This package uses a Telegram Bot API token. In this repo,
`TELEGRAM_BOT_KEY` resolves from 1Password for `@apicitylogbot`.

```typescript
import { createTelegram } from "@apicity/telegram";

const telegram = createTelegram({
  botToken: process.env.TELEGRAM_BOT_KEY!,
});

await telegram.sendMessage({
  chat_id: "@your_channel_or_chat_id",
  text: "hello from @apicity/telegram",
});

const photo = new Blob(["image bytes"], { type: "image/png" });
await telegram.sendPhoto({
  chat_id: "@your_channel_or_chat_id",
  photo,
  caption: "uploaded from @apicitylogbot",
});
```

**Notes**

- `chat_id` can be a numeric chat id or a username such as `@channelname`.
- `photo`, `video`, `audio`, `thumbnail`, and `cover` accept a Telegram
  `file_id`, an HTTP URL, an `attach://...` reference, or a `Blob`.
- Blob payloads are sent as `multipart/form-data`; string payloads use
  `application/json`.

## API Reference

24 endpoints across 24 groups. Each method mirrors an upstream URL path.

### copyMessage

<details>
<summary><code>POST</code> <b><code>telegram.copyMessage</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/copyMessage</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#copymessage)

```typescript
const res = await telegram.copyMessage({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### copyMessages

<details>
<summary><code>POST</code> <b><code>telegram.copyMessages</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/copyMessages</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#copymessages)

```typescript
const res = await telegram.copyMessages({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteAllMessageReactions

<details>
<summary><code>POST</code> <b><code>telegram.deleteAllMessageReactions</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteAllMessageReactions</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deleteallmessagereactions)

```typescript
const res = await telegram.deleteAllMessageReactions({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteMessage

<details>
<summary><code>POST</code> <b><code>telegram.deleteMessage</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteMessage</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deletemessage)

```typescript
const res = await telegram.deleteMessage({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteMessageReaction

<details>
<summary><code>POST</code> <b><code>telegram.deleteMessageReaction</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteMessageReaction</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deletemessagereaction)

```typescript
const res = await telegram.deleteMessageReaction({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteMessages

<details>
<summary><code>POST</code> <b><code>telegram.deleteMessages</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteMessages</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deletemessages)

```typescript
const res = await telegram.deleteMessages({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### editMessageCaption

<details>
<summary><code>POST</code> <b><code>telegram.editMessageCaption</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/editMessageCaption</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#editmessagecaption)

```typescript
const res = await telegram.editMessageCaption({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### editMessageChecklist

<details>
<summary><code>POST</code> <b><code>telegram.editMessageChecklist</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/editMessageChecklist</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#editmessagechecklist)

```typescript
const res = await telegram.editMessageChecklist({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### editMessageLiveLocation

<details>
<summary><code>POST</code> <b><code>telegram.editMessageLiveLocation</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/editMessageLiveLocation</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#editmessagelivelocation)

```typescript
const res = await telegram.editMessageLiveLocation({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### editMessageMedia

<details>
<summary><code>POST</code> <b><code>telegram.editMessageMedia</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/editMessageMedia</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#editmessagemedia)

```typescript
const res = await telegram.editMessageMedia({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### editMessageReplyMarkup

<details>
<summary><code>POST</code> <b><code>telegram.editMessageReplyMarkup</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/editMessageReplyMarkup</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#editmessagereplymarkup)

```typescript
const res = await telegram.editMessageReplyMarkup({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### editMessageText

<details>
<summary><code>POST</code> <b><code>telegram.editMessageText</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/editMessageText</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#editmessagetext)

```typescript
const res = await telegram.editMessageText({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### forwardMessage

<details>
<summary><code>POST</code> <b><code>telegram.forwardMessage</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/forwardMessage</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#forwardmessage)

```typescript
const res = await telegram.forwardMessage({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### forwardMessages

<details>
<summary><code>POST</code> <b><code>telegram.forwardMessages</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/forwardMessages</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#forwardmessages)

```typescript
const res = await telegram.forwardMessages({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### pinChatMessage

<details>
<summary><code>POST</code> <b><code>telegram.pinChatMessage</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/pinChatMessage</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#pinchatmessage)

```typescript
const res = await telegram.pinChatMessage({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendAudio

<details>
<summary><code>POST</code> <b><code>telegram.sendAudio</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendAudio</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendaudio)

```typescript
const res = await telegram.sendAudio({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendMessage

<details>
<summary><code>POST</code> <b><code>telegram.sendMessage</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendMessage</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendmessage)

```typescript
const res = await telegram.sendMessage({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendPhoto

<details>
<summary><code>POST</code> <b><code>telegram.sendPhoto</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendPhoto</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendphoto)

```typescript
const res = await telegram.sendPhoto({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendVideo

<details>
<summary><code>POST</code> <b><code>telegram.sendVideo</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendVideo</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendvideo)

```typescript
const res = await telegram.sendVideo({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setMessageReaction

<details>
<summary><code>POST</code> <b><code>telegram.setMessageReaction</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setMessageReaction</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setmessagereaction)

```typescript
const res = await telegram.setMessageReaction({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### stopMessageLiveLocation

<details>
<summary><code>POST</code> <b><code>telegram.stopMessageLiveLocation</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/stopMessageLiveLocation</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#stopmessagelivelocation)

```typescript
const res = await telegram.stopMessageLiveLocation({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### stopPoll

<details>
<summary><code>POST</code> <b><code>telegram.stopPoll</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/stopPoll</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#stoppoll)

```typescript
const res = await telegram.stopPoll({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### unpinAllChatMessages

<details>
<summary><code>POST</code> <b><code>telegram.unpinAllChatMessages</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/unpinAllChatMessages</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#unpinallchatmessages)

```typescript
const res = await telegram.unpinAllChatMessages({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### unpinChatMessage

<details>
<summary><code>POST</code> <b><code>telegram.unpinChatMessage</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/unpinChatMessage</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#unpinchatmessage)

```typescript
const res = await telegram.unpinChatMessage({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
