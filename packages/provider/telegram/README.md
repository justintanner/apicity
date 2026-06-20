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

50 endpoints across 50 groups. Each method mirrors an upstream URL path.

### answerChatJoinRequestQuery

<details>
<summary><code>POST</code> <b><code>telegram.answerChatJoinRequestQuery</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/answerChatJoinRequestQuery</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#answerchatjoinrequestquery)

```typescript
const res = await telegram.answerChatJoinRequestQuery({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### answerGuestQuery

<details>
<summary><code>POST</code> <b><code>telegram.answerGuestQuery</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/answerGuestQuery</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#answerguestquery)

```typescript
const res = await telegram.answerGuestQuery({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### approveChatJoinRequest

<details>
<summary><code>POST</code> <b><code>telegram.approveChatJoinRequest</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/approveChatJoinRequest</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#approvechatjoinrequest)

```typescript
const res = await telegram.approveChatJoinRequest({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### banChatMember

<details>
<summary><code>POST</code> <b><code>telegram.banChatMember</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/banChatMember</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#banchatmember)

```typescript
const res = await telegram.banChatMember({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### banChatSenderChat

<details>
<summary><code>POST</code> <b><code>telegram.banChatSenderChat</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/banChatSenderChat</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#banchatsenderchat)

```typescript
const res = await telegram.banChatSenderChat({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### closeForumTopic

<details>
<summary><code>POST</code> <b><code>telegram.closeForumTopic</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/closeForumTopic</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#closeforumtopic)

```typescript
const res = await telegram.closeForumTopic({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### closeGeneralForumTopic

<details>
<summary><code>POST</code> <b><code>telegram.closeGeneralForumTopic</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/closeGeneralForumTopic</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#closegeneralforumtopic)

```typescript
const res = await telegram.closeGeneralForumTopic({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### createChatInviteLink

<details>
<summary><code>POST</code> <b><code>telegram.createChatInviteLink</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/createChatInviteLink</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#createchatinvitelink)

```typescript
const res = await telegram.createChatInviteLink({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### createChatSubscriptionInviteLink

<details>
<summary><code>POST</code> <b><code>telegram.createChatSubscriptionInviteLink</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/createChatSubscriptionInviteLink</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#createchatsubscriptioninvitelink)

```typescript
const res = await telegram.createChatSubscriptionInviteLink({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### createForumTopic

<details>
<summary><code>POST</code> <b><code>telegram.createForumTopic</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/createForumTopic</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#createforumtopic)

```typescript
const res = await telegram.createForumTopic({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### declineChatJoinRequest

<details>
<summary><code>POST</code> <b><code>telegram.declineChatJoinRequest</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/declineChatJoinRequest</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#declinechatjoinrequest)

```typescript
const res = await telegram.declineChatJoinRequest({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteChatPhoto

<details>
<summary><code>POST</code> <b><code>telegram.deleteChatPhoto</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteChatPhoto</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deletechatphoto)

```typescript
const res = await telegram.deleteChatPhoto({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteChatStickerSet

<details>
<summary><code>POST</code> <b><code>telegram.deleteChatStickerSet</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteChatStickerSet</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deletechatstickerset)

```typescript
const res = await telegram.deleteChatStickerSet({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteForumTopic

<details>
<summary><code>POST</code> <b><code>telegram.deleteForumTopic</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteForumTopic</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deleteforumtopic)

```typescript
const res = await telegram.deleteForumTopic({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### editChatInviteLink

<details>
<summary><code>POST</code> <b><code>telegram.editChatInviteLink</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/editChatInviteLink</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#editchatinvitelink)

```typescript
const res = await telegram.editChatInviteLink({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### editChatSubscriptionInviteLink

<details>
<summary><code>POST</code> <b><code>telegram.editChatSubscriptionInviteLink</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/editChatSubscriptionInviteLink</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#editchatsubscriptioninvitelink)

```typescript
const res = await telegram.editChatSubscriptionInviteLink({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### editForumTopic

<details>
<summary><code>POST</code> <b><code>telegram.editForumTopic</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/editForumTopic</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#editforumtopic)

```typescript
const res = await telegram.editForumTopic({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### editGeneralForumTopic

<details>
<summary><code>POST</code> <b><code>telegram.editGeneralForumTopic</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/editGeneralForumTopic</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#editgeneralforumtopic)

```typescript
const res = await telegram.editGeneralForumTopic({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### exportChatInviteLink

<details>
<summary><code>POST</code> <b><code>telegram.exportChatInviteLink</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/exportChatInviteLink</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#exportchatinvitelink)

```typescript
const res = await telegram.exportChatInviteLink({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getChat

<details>
<summary><code>POST</code> <b><code>telegram.getChat</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getChat</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getchat)

```typescript
const res = await telegram.getChat({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getChatAdministrators

<details>
<summary><code>POST</code> <b><code>telegram.getChatAdministrators</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getChatAdministrators</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getchatadministrators)

```typescript
const res = await telegram.getChatAdministrators({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getChatMember

<details>
<summary><code>POST</code> <b><code>telegram.getChatMember</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getChatMember</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getchatmember)

```typescript
const res = await telegram.getChatMember({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getChatMemberCount

<details>
<summary><code>POST</code> <b><code>telegram.getChatMemberCount</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getChatMemberCount</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getchatmembercount)

```typescript
const res = await telegram.getChatMemberCount({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getForumTopicIconStickers

<details>
<summary><code>POST</code> <b><code>telegram.getForumTopicIconStickers</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getForumTopicIconStickers</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getforumtopiciconstickers)

```typescript
const res = await telegram.getForumTopicIconStickers({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getUserChatBoosts

<details>
<summary><code>POST</code> <b><code>telegram.getUserChatBoosts</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getUserChatBoosts</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getuserchatboosts)

```typescript
const res = await telegram.getUserChatBoosts({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getUserPersonalChatMessages

<details>
<summary><code>POST</code> <b><code>telegram.getUserPersonalChatMessages</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getUserPersonalChatMessages</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getuserpersonalchatmessages)

```typescript
const res = await telegram.getUserPersonalChatMessages({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### hideGeneralForumTopic

<details>
<summary><code>POST</code> <b><code>telegram.hideGeneralForumTopic</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/hideGeneralForumTopic</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#hidegeneralforumtopic)

```typescript
const res = await telegram.hideGeneralForumTopic({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### leaveChat

<details>
<summary><code>POST</code> <b><code>telegram.leaveChat</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/leaveChat</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#leavechat)

```typescript
const res = await telegram.leaveChat({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### promoteChatMember

<details>
<summary><code>POST</code> <b><code>telegram.promoteChatMember</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/promoteChatMember</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#promotechatmember)

```typescript
const res = await telegram.promoteChatMember({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### reopenForumTopic

<details>
<summary><code>POST</code> <b><code>telegram.reopenForumTopic</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/reopenForumTopic</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#reopenforumtopic)

```typescript
const res = await telegram.reopenForumTopic({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### reopenGeneralForumTopic

<details>
<summary><code>POST</code> <b><code>telegram.reopenGeneralForumTopic</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/reopenGeneralForumTopic</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#reopengeneralforumtopic)

```typescript
const res = await telegram.reopenGeneralForumTopic({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### restrictChatMember

<details>
<summary><code>POST</code> <b><code>telegram.restrictChatMember</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/restrictChatMember</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#restrictchatmember)

```typescript
const res = await telegram.restrictChatMember({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### revokeChatInviteLink

<details>
<summary><code>POST</code> <b><code>telegram.revokeChatInviteLink</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/revokeChatInviteLink</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#revokechatinvitelink)

```typescript
const res = await telegram.revokeChatInviteLink({ /* ... */ });
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

### sendChatJoinRequestWebApp

<details>
<summary><code>POST</code> <b><code>telegram.sendChatJoinRequestWebApp</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendChatJoinRequestWebApp</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendchatjoinrequestwebapp)

```typescript
const res = await telegram.sendChatJoinRequestWebApp({ /* ... */ });
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

### setChatAdministratorCustomTitle

<details>
<summary><code>POST</code> <b><code>telegram.setChatAdministratorCustomTitle</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setChatAdministratorCustomTitle</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setchatadministratorcustomtitle)

```typescript
const res = await telegram.setChatAdministratorCustomTitle({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setChatDescription

<details>
<summary><code>POST</code> <b><code>telegram.setChatDescription</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setChatDescription</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setchatdescription)

```typescript
const res = await telegram.setChatDescription({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setChatMemberTag

<details>
<summary><code>POST</code> <b><code>telegram.setChatMemberTag</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setChatMemberTag</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setchatmembertag)

```typescript
const res = await telegram.setChatMemberTag({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setChatPermissions

<details>
<summary><code>POST</code> <b><code>telegram.setChatPermissions</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setChatPermissions</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setchatpermissions)

```typescript
const res = await telegram.setChatPermissions({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setChatPhoto

<details>
<summary><code>POST</code> <b><code>telegram.setChatPhoto</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setChatPhoto</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setchatphoto)

```typescript
const res = await telegram.setChatPhoto({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setChatStickerSet

<details>
<summary><code>POST</code> <b><code>telegram.setChatStickerSet</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setChatStickerSet</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setchatstickerset)

```typescript
const res = await telegram.setChatStickerSet({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setChatTitle

<details>
<summary><code>POST</code> <b><code>telegram.setChatTitle</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setChatTitle</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setchattitle)

```typescript
const res = await telegram.setChatTitle({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### unbanChatMember

<details>
<summary><code>POST</code> <b><code>telegram.unbanChatMember</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/unbanChatMember</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#unbanchatmember)

```typescript
const res = await telegram.unbanChatMember({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### unbanChatSenderChat

<details>
<summary><code>POST</code> <b><code>telegram.unbanChatSenderChat</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/unbanChatSenderChat</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#unbanchatsenderchat)

```typescript
const res = await telegram.unbanChatSenderChat({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### unhideGeneralForumTopic

<details>
<summary><code>POST</code> <b><code>telegram.unhideGeneralForumTopic</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/unhideGeneralForumTopic</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#unhidegeneralforumtopic)

```typescript
const res = await telegram.unhideGeneralForumTopic({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### unpinAllForumTopicMessages

<details>
<summary><code>POST</code> <b><code>telegram.unpinAllForumTopicMessages</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/unpinAllForumTopicMessages</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#unpinallforumtopicmessages)

```typescript
const res = await telegram.unpinAllForumTopicMessages({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### unpinAllGeneralForumTopicMessages

<details>
<summary><code>POST</code> <b><code>telegram.unpinAllGeneralForumTopicMessages</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/unpinAllGeneralForumTopicMessages</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#unpinallgeneralforumtopicmessages)

```typescript
const res = await telegram.unpinAllGeneralForumTopicMessages({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
