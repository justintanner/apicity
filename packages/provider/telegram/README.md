# @apicity/telegram

[![npm](https://img.shields.io/npm/v/@apicity/telegram?color=cb0000)](https://www.npmjs.com/package/@apicity/telegram)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-core.telegram.org-blue)](https://core.telegram.org/bots/api)

Telegram Bot API provider for sending messages, media, polls, and rich messages.

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

21 endpoints across 21 groups. Each method mirrors an upstream URL path.

### sendAnimation

<details>
<summary><code>POST</code> <b><code>telegram.sendAnimation</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendAnimation</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendanimation)

```typescript
const res = await telegram.sendAnimation({ /* ... */ });
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

### sendChatAction

<details>
<summary><code>POST</code> <b><code>telegram.sendChatAction</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendChatAction</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendchataction)

```typescript
const res = await telegram.sendChatAction({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendChecklist

<details>
<summary><code>POST</code> <b><code>telegram.sendChecklist</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendChecklist</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendchecklist)

```typescript
const res = await telegram.sendChecklist({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendContact

<details>
<summary><code>POST</code> <b><code>telegram.sendContact</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendContact</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendcontact)

```typescript
const res = await telegram.sendContact({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendDice

<details>
<summary><code>POST</code> <b><code>telegram.sendDice</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendDice</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#senddice)

```typescript
const res = await telegram.sendDice({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendDocument

<details>
<summary><code>POST</code> <b><code>telegram.sendDocument</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendDocument</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#senddocument)

```typescript
const res = await telegram.sendDocument({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendLivePhoto

<details>
<summary><code>POST</code> <b><code>telegram.sendLivePhoto</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendLivePhoto</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendlivephoto)

```typescript
const res = await telegram.sendLivePhoto({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendLocation

<details>
<summary><code>POST</code> <b><code>telegram.sendLocation</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendLocation</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendlocation)

```typescript
const res = await telegram.sendLocation({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendMediaGroup

<details>
<summary><code>POST</code> <b><code>telegram.sendMediaGroup</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendMediaGroup</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendmediagroup)

```typescript
const res = await telegram.sendMediaGroup({ /* ... */ });
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

### sendMessageDraft

<details>
<summary><code>POST</code> <b><code>telegram.sendMessageDraft</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendMessageDraft</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendmessagedraft)

```typescript
const res = await telegram.sendMessageDraft({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendPaidMedia

<details>
<summary><code>POST</code> <b><code>telegram.sendPaidMedia</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendPaidMedia</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendpaidmedia)

```typescript
const res = await telegram.sendPaidMedia({ /* ... */ });
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

### sendPoll

<details>
<summary><code>POST</code> <b><code>telegram.sendPoll</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendPoll</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendpoll)

```typescript
const res = await telegram.sendPoll({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendRichMessage

<details>
<summary><code>POST</code> <b><code>telegram.sendRichMessage</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendRichMessage</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendrichmessage)

```typescript
const res = await telegram.sendRichMessage({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendRichMessageDraft

<details>
<summary><code>POST</code> <b><code>telegram.sendRichMessageDraft</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendRichMessageDraft</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendrichmessagedraft)

```typescript
const res = await telegram.sendRichMessageDraft({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendVenue

<details>
<summary><code>POST</code> <b><code>telegram.sendVenue</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendVenue</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendvenue)

```typescript
const res = await telegram.sendVenue({ /* ... */ });
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

### sendVideoNote

<details>
<summary><code>POST</code> <b><code>telegram.sendVideoNote</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendVideoNote</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendvideonote)

```typescript
const res = await telegram.sendVideoNote({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendVoice

<details>
<summary><code>POST</code> <b><code>telegram.sendVoice</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendVoice</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendvoice)

```typescript
const res = await telegram.sendVoice({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
