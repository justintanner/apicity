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

29 endpoints across 29 groups. Each method mirrors an upstream URL path.

### close

<details>
<summary><code>POST</code> <b><code>telegram.close</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/close</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#close)

```typescript
const res = await telegram.close({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteMyCommands

<details>
<summary><code>POST</code> <b><code>telegram.deleteMyCommands</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteMyCommands</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deletemycommands)

```typescript
const res = await telegram.deleteMyCommands({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteWebhook

<details>
<summary><code>POST</code> <b><code>telegram.deleteWebhook</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteWebhook</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deletewebhook)

```typescript
const res = await telegram.deleteWebhook({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getChatMenuButton

<details>
<summary><code>POST</code> <b><code>telegram.getChatMenuButton</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getChatMenuButton</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getchatmenubutton)

```typescript
const res = await telegram.getChatMenuButton({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getFile

<details>
<summary><code>POST</code> <b><code>telegram.getFile</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getFile</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getfile)

```typescript
const res = await telegram.getFile({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getManagedBotAccessSettings

<details>
<summary><code>POST</code> <b><code>telegram.getManagedBotAccessSettings</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getManagedBotAccessSettings</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getmanagedbotaccesssettings)

```typescript
const res = await telegram.getManagedBotAccessSettings({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getManagedBotToken

<details>
<summary><code>POST</code> <b><code>telegram.getManagedBotToken</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getManagedBotToken</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getmanagedbottoken)

```typescript
const res = await telegram.getManagedBotToken({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getMe

<details>
<summary><code>POST</code> <b><code>telegram.getMe</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getMe</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getme)

```typescript
const res = await telegram.getMe({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getMyCommands

<details>
<summary><code>POST</code> <b><code>telegram.getMyCommands</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getMyCommands</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getmycommands)

```typescript
const res = await telegram.getMyCommands({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getMyDefaultAdministratorRights

<details>
<summary><code>POST</code> <b><code>telegram.getMyDefaultAdministratorRights</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getMyDefaultAdministratorRights</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getmydefaultadministratorrights)

```typescript
const res = await telegram.getMyDefaultAdministratorRights({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getMyDescription

<details>
<summary><code>POST</code> <b><code>telegram.getMyDescription</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getMyDescription</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getmydescription)

```typescript
const res = await telegram.getMyDescription({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getMyName

<details>
<summary><code>POST</code> <b><code>telegram.getMyName</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getMyName</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getmyname)

```typescript
const res = await telegram.getMyName({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getMyShortDescription

<details>
<summary><code>POST</code> <b><code>telegram.getMyShortDescription</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getMyShortDescription</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getmyshortdescription)

```typescript
const res = await telegram.getMyShortDescription({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getUpdates

<details>
<summary><code>POST</code> <b><code>telegram.getUpdates</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getUpdates</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getupdates)

```typescript
const res = await telegram.getUpdates({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getWebhookInfo

<details>
<summary><code>POST</code> <b><code>telegram.getWebhookInfo</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getWebhookInfo</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getwebhookinfo)

```typescript
const res = await telegram.getWebhookInfo({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### logOut

<details>
<summary><code>POST</code> <b><code>telegram.logOut</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/logOut</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#logout)

```typescript
const res = await telegram.logOut({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### replaceManagedBotToken

<details>
<summary><code>POST</code> <b><code>telegram.replaceManagedBotToken</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/replaceManagedBotToken</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#replacemanagedbottoken)

```typescript
const res = await telegram.replaceManagedBotToken({ /* ... */ });
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

### setChatMenuButton

<details>
<summary><code>POST</code> <b><code>telegram.setChatMenuButton</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setChatMenuButton</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setchatmenubutton)

```typescript
const res = await telegram.setChatMenuButton({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setManagedBotAccessSettings

<details>
<summary><code>POST</code> <b><code>telegram.setManagedBotAccessSettings</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setManagedBotAccessSettings</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setmanagedbotaccesssettings)

```typescript
const res = await telegram.setManagedBotAccessSettings({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setMyCommands

<details>
<summary><code>POST</code> <b><code>telegram.setMyCommands</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setMyCommands</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setmycommands)

```typescript
const res = await telegram.setMyCommands({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setMyDefaultAdministratorRights

<details>
<summary><code>POST</code> <b><code>telegram.setMyDefaultAdministratorRights</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setMyDefaultAdministratorRights</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setmydefaultadministratorrights)

```typescript
const res = await telegram.setMyDefaultAdministratorRights({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setMyDescription

<details>
<summary><code>POST</code> <b><code>telegram.setMyDescription</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setMyDescription</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setmydescription)

```typescript
const res = await telegram.setMyDescription({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setMyName

<details>
<summary><code>POST</code> <b><code>telegram.setMyName</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setMyName</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setmyname)

```typescript
const res = await telegram.setMyName({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setMyShortDescription

<details>
<summary><code>POST</code> <b><code>telegram.setMyShortDescription</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setMyShortDescription</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setmyshortdescription)

```typescript
const res = await telegram.setMyShortDescription({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setWebhook

<details>
<summary><code>POST</code> <b><code>telegram.setWebhook</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setWebhook</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setwebhook)

```typescript
const res = await telegram.setWebhook({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
