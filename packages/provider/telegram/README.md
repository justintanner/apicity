# @apicity/telegram

[![npm](https://img.shields.io/npm/v/@apicity/telegram?color=cb0000)](https://www.npmjs.com/package/@apicity/telegram)
[![dependencies](https://img.shields.io/badge/dependencies-1-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)
[![docs](https://img.shields.io/badge/docs-core.telegram.org-blue)](https://core.telegram.org/bots/api)

Telegram Bot API provider for sending messages, media, polls, and rich messages.

Runtime dependencies:

- `zod@^4.4.3` — request schemas attached to every POST endpoint as `.schema`

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
- Recorded examples redact bot tokens, webhook secret tokens, payment
  payloads, passport data, Telegram file identifiers, and Blob bytes.

## API Reference

180 endpoints across 180 groups. Each method mirrors an upstream URL path.

### addStickerToSet

<details>
<summary><code>POST</code> <b><code>telegram.addStickerToSet</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/addStickerToSet</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#addstickertoset)

```typescript
const res = await telegram.addStickerToSet({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### answerCallbackQuery

<details>
<summary><code>POST</code> <b><code>telegram.answerCallbackQuery</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/answerCallbackQuery</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#answercallbackquery)

```typescript
const res = await telegram.answerCallbackQuery({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### answerChatJoinRequestQuery

<details>
<summary><code>POST</code> <b><code>telegram.answerChatJoinRequestQuery</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/answerChatJoinRequestQuery</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#answerguestquery)

```typescript
const res = await telegram.answerGuestQuery({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### answerInlineQuery

<details>
<summary><code>POST</code> <b><code>telegram.answerInlineQuery</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/answerInlineQuery</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#answerinlinequery)

```typescript
const res = await telegram.answerInlineQuery({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### answerPreCheckoutQuery

<details>
<summary><code>POST</code> <b><code>telegram.answerPreCheckoutQuery</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/answerPreCheckoutQuery</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#answerprecheckoutquery)

```typescript
const res = await telegram.answerPreCheckoutQuery({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### answerShippingQuery

<details>
<summary><code>POST</code> <b><code>telegram.answerShippingQuery</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/answerShippingQuery</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#answershippingquery)

```typescript
const res = await telegram.answerShippingQuery({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### answerWebAppQuery

<details>
<summary><code>POST</code> <b><code>telegram.answerWebAppQuery</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/answerWebAppQuery</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#answerwebappquery)

```typescript
const res = await telegram.answerWebAppQuery({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### approveChatJoinRequest

<details>
<summary><code>POST</code> <b><code>telegram.approveChatJoinRequest</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/approveChatJoinRequest</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#approvechatjoinrequest)

```typescript
const res = await telegram.approveChatJoinRequest({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### approveSuggestedPost

<details>
<summary><code>POST</code> <b><code>telegram.approveSuggestedPost</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/approveSuggestedPost</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#approvesuggestedpost)

```typescript
const res = await telegram.approveSuggestedPost({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### banChatMember

<details>
<summary><code>POST</code> <b><code>telegram.banChatMember</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/banChatMember</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#banchatsenderchat)

```typescript
const res = await telegram.banChatSenderChat({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### close

<details>
<summary><code>POST</code> <b><code>telegram.close</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/close</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#close)

```typescript
const res = await telegram.close({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### closeForumTopic

<details>
<summary><code>POST</code> <b><code>telegram.closeForumTopic</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/closeForumTopic</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#closegeneralforumtopic)

```typescript
const res = await telegram.closeGeneralForumTopic({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### convertGiftToStars

<details>
<summary><code>POST</code> <b><code>telegram.convertGiftToStars</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/convertGiftToStars</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#convertgifttostars)

```typescript
const res = await telegram.convertGiftToStars({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### copyMessage

<details>
<summary><code>POST</code> <b><code>telegram.copyMessage</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/copyMessage</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#copymessages)

```typescript
const res = await telegram.copyMessages({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### createChatInviteLink

<details>
<summary><code>POST</code> <b><code>telegram.createChatInviteLink</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/createChatInviteLink</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#createforumtopic)

```typescript
const res = await telegram.createForumTopic({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### createInvoiceLink

<details>
<summary><code>POST</code> <b><code>telegram.createInvoiceLink</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/createInvoiceLink</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#createinvoicelink)

```typescript
const res = await telegram.createInvoiceLink({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### createNewStickerSet

<details>
<summary><code>POST</code> <b><code>telegram.createNewStickerSet</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/createNewStickerSet</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#createnewstickerset)

```typescript
const res = await telegram.createNewStickerSet({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### declineChatJoinRequest

<details>
<summary><code>POST</code> <b><code>telegram.declineChatJoinRequest</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/declineChatJoinRequest</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#declinechatjoinrequest)

```typescript
const res = await telegram.declineChatJoinRequest({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### declineSuggestedPost

<details>
<summary><code>POST</code> <b><code>telegram.declineSuggestedPost</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/declineSuggestedPost</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#declinesuggestedpost)

```typescript
const res = await telegram.declineSuggestedPost({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteAllMessageReactions

<details>
<summary><code>POST</code> <b><code>telegram.deleteAllMessageReactions</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteAllMessageReactions</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deleteallmessagereactions)

```typescript
const res = await telegram.deleteAllMessageReactions({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteBusinessMessages

<details>
<summary><code>POST</code> <b><code>telegram.deleteBusinessMessages</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteBusinessMessages</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deletebusinessmessages)

```typescript
const res = await telegram.deleteBusinessMessages({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteChatPhoto

<details>
<summary><code>POST</code> <b><code>telegram.deleteChatPhoto</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteChatPhoto</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deleteforumtopic)

```typescript
const res = await telegram.deleteForumTopic({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteMessage

<details>
<summary><code>POST</code> <b><code>telegram.deleteMessage</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteMessage</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deletemessages)

```typescript
const res = await telegram.deleteMessages({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteMyCommands

<details>
<summary><code>POST</code> <b><code>telegram.deleteMyCommands</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteMyCommands</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deletemycommands)

```typescript
const res = await telegram.deleteMyCommands({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteStickerFromSet

<details>
<summary><code>POST</code> <b><code>telegram.deleteStickerFromSet</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteStickerFromSet</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deletestickerfromset)

```typescript
const res = await telegram.deleteStickerFromSet({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteStickerSet

<details>
<summary><code>POST</code> <b><code>telegram.deleteStickerSet</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteStickerSet</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deletestickerset)

```typescript
const res = await telegram.deleteStickerSet({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteStory

<details>
<summary><code>POST</code> <b><code>telegram.deleteStory</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteStory</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deletestory)

```typescript
const res = await telegram.deleteStory({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteWebhook

<details>
<summary><code>POST</code> <b><code>telegram.deleteWebhook</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteWebhook</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deletewebhook)

```typescript
const res = await telegram.deleteWebhook({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### editChatInviteLink

<details>
<summary><code>POST</code> <b><code>telegram.editChatInviteLink</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/editChatInviteLink</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#editgeneralforumtopic)

```typescript
const res = await telegram.editGeneralForumTopic({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### editMessageCaption

<details>
<summary><code>POST</code> <b><code>telegram.editMessageCaption</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/editMessageCaption</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#editmessagetext)

```typescript
const res = await telegram.editMessageText({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### editStory

<details>
<summary><code>POST</code> <b><code>telegram.editStory</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/editStory</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#editstory)

```typescript
const res = await telegram.editStory({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### editUserStarSubscription

<details>
<summary><code>POST</code> <b><code>telegram.editUserStarSubscription</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/editUserStarSubscription</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#edituserstarsubscription)

```typescript
const res = await telegram.editUserStarSubscription({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### exportChatInviteLink

<details>
<summary><code>POST</code> <b><code>telegram.exportChatInviteLink</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/exportChatInviteLink</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#exportchatinvitelink)

```typescript
const res = await telegram.exportChatInviteLink({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### forwardMessage

<details>
<summary><code>POST</code> <b><code>telegram.forwardMessage</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/forwardMessage</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#forwardmessages)

```typescript
const res = await telegram.forwardMessages({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getAvailableGifts

<details>
<summary><code>POST</code> <b><code>telegram.getAvailableGifts</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getAvailableGifts</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getavailablegifts)

```typescript
const res = await telegram.getAvailableGifts({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getBusinessAccountGifts

<details>
<summary><code>POST</code> <b><code>telegram.getBusinessAccountGifts</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getBusinessAccountGifts</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getbusinessaccountgifts)

```typescript
const res = await telegram.getBusinessAccountGifts({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getBusinessAccountStarBalance

<details>
<summary><code>POST</code> <b><code>telegram.getBusinessAccountStarBalance</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getBusinessAccountStarBalance</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getbusinessaccountstarbalance)

```typescript
const res = await telegram.getBusinessAccountStarBalance({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getBusinessConnection

<details>
<summary><code>POST</code> <b><code>telegram.getBusinessConnection</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getBusinessConnection</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getbusinessconnection)

```typescript
const res = await telegram.getBusinessConnection({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getChat

<details>
<summary><code>POST</code> <b><code>telegram.getChat</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getChat</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getchatadministrators)

```typescript
const res = await telegram.getChatAdministrators({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getChatGifts

<details>
<summary><code>POST</code> <b><code>telegram.getChatGifts</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getChatGifts</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getchatgifts)

```typescript
const res = await telegram.getChatGifts({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getChatMember

<details>
<summary><code>POST</code> <b><code>telegram.getChatMember</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getChatMember</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getchatmembercount)

```typescript
const res = await telegram.getChatMemberCount({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getChatMenuButton

<details>
<summary><code>POST</code> <b><code>telegram.getChatMenuButton</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getChatMenuButton</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getchatmenubutton)

```typescript
const res = await telegram.getChatMenuButton({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getCustomEmojiStickers

<details>
<summary><code>POST</code> <b><code>telegram.getCustomEmojiStickers</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getCustomEmojiStickers</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getcustomemojistickers)

```typescript
const res = await telegram.getCustomEmojiStickers({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getFile

<details>
<summary><code>POST</code> <b><code>telegram.getFile</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getFile</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getfile)

```typescript
const res = await telegram.getFile({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getForumTopicIconStickers

<details>
<summary><code>POST</code> <b><code>telegram.getForumTopicIconStickers</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getForumTopicIconStickers</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getforumtopiciconstickers)

```typescript
const res = await telegram.getForumTopicIconStickers({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getGameHighScores

<details>
<summary><code>POST</code> <b><code>telegram.getGameHighScores</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getGameHighScores</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getgamehighscores)

```typescript
const res = await telegram.getGameHighScores({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getManagedBotAccessSettings

<details>
<summary><code>POST</code> <b><code>telegram.getManagedBotAccessSettings</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getManagedBotAccessSettings</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getmyshortdescription)

```typescript
const res = await telegram.getMyShortDescription({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getMyStarBalance

<details>
<summary><code>POST</code> <b><code>telegram.getMyStarBalance</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getMyStarBalance</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getmystarbalance)

```typescript
const res = await telegram.getMyStarBalance({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getStarTransactions

<details>
<summary><code>POST</code> <b><code>telegram.getStarTransactions</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getStarTransactions</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getstartransactions)

```typescript
const res = await telegram.getStarTransactions({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getStickerSet

<details>
<summary><code>POST</code> <b><code>telegram.getStickerSet</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getStickerSet</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getstickerset)

```typescript
const res = await telegram.getStickerSet({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getUpdates

<details>
<summary><code>POST</code> <b><code>telegram.getUpdates</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getUpdates</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getupdates)

```typescript
const res = await telegram.getUpdates({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getUserChatBoosts

<details>
<summary><code>POST</code> <b><code>telegram.getUserChatBoosts</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getUserChatBoosts</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getuserchatboosts)

```typescript
const res = await telegram.getUserChatBoosts({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getUserGifts

<details>
<summary><code>POST</code> <b><code>telegram.getUserGifts</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getUserGifts</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getusergifts)

```typescript
const res = await telegram.getUserGifts({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getUserPersonalChatMessages

<details>
<summary><code>POST</code> <b><code>telegram.getUserPersonalChatMessages</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getUserPersonalChatMessages</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getuserpersonalchatmessages)

```typescript
const res = await telegram.getUserPersonalChatMessages({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getUserProfileAudios

<details>
<summary><code>POST</code> <b><code>telegram.getUserProfileAudios</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getUserProfileAudios</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getuserprofileaudios)

```typescript
const res = await telegram.getUserProfileAudios({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getUserProfilePhotos

<details>
<summary><code>POST</code> <b><code>telegram.getUserProfilePhotos</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getUserProfilePhotos</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getuserprofilephotos)

```typescript
const res = await telegram.getUserProfilePhotos({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getWebhookInfo

<details>
<summary><code>POST</code> <b><code>telegram.getWebhookInfo</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getWebhookInfo</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getwebhookinfo)

```typescript
const res = await telegram.getWebhookInfo({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### giftPremiumSubscription

<details>
<summary><code>POST</code> <b><code>telegram.giftPremiumSubscription</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/giftPremiumSubscription</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#giftpremiumsubscription)

```typescript
const res = await telegram.giftPremiumSubscription({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### hideGeneralForumTopic

<details>
<summary><code>POST</code> <b><code>telegram.hideGeneralForumTopic</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/hideGeneralForumTopic</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#leavechat)

```typescript
const res = await telegram.leaveChat({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### logOut

<details>
<summary><code>POST</code> <b><code>telegram.logOut</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/logOut</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#logout)

```typescript
const res = await telegram.logOut({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### pinChatMessage

<details>
<summary><code>POST</code> <b><code>telegram.pinChatMessage</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/pinChatMessage</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#pinchatmessage)

```typescript
const res = await telegram.pinChatMessage({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### postStory

<details>
<summary><code>POST</code> <b><code>telegram.postStory</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/postStory</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#poststory)

```typescript
const res = await telegram.postStory({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### promoteChatMember

<details>
<summary><code>POST</code> <b><code>telegram.promoteChatMember</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/promoteChatMember</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#promotechatmember)

```typescript
const res = await telegram.promoteChatMember({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### readBusinessMessage

<details>
<summary><code>POST</code> <b><code>telegram.readBusinessMessage</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/readBusinessMessage</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#readbusinessmessage)

```typescript
const res = await telegram.readBusinessMessage({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### refundStarPayment

<details>
<summary><code>POST</code> <b><code>telegram.refundStarPayment</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/refundStarPayment</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#refundstarpayment)

```typescript
const res = await telegram.refundStarPayment({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### removeBusinessAccountProfilePhoto

<details>
<summary><code>POST</code> <b><code>telegram.removeBusinessAccountProfilePhoto</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/removeBusinessAccountProfilePhoto</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#removebusinessaccountprofilephoto)

```typescript
const res = await telegram.removeBusinessAccountProfilePhoto({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### removeChatVerification

<details>
<summary><code>POST</code> <b><code>telegram.removeChatVerification</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/removeChatVerification</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#removechatverification)

```typescript
const res = await telegram.removeChatVerification({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### removeMyProfilePhoto

<details>
<summary><code>POST</code> <b><code>telegram.removeMyProfilePhoto</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/removeMyProfilePhoto</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#removemyprofilephoto)

```typescript
const res = await telegram.removeMyProfilePhoto({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### removeUserVerification

<details>
<summary><code>POST</code> <b><code>telegram.removeUserVerification</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/removeUserVerification</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#removeuserverification)

```typescript
const res = await telegram.removeUserVerification({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### reopenForumTopic

<details>
<summary><code>POST</code> <b><code>telegram.reopenForumTopic</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/reopenForumTopic</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#reopengeneralforumtopic)

```typescript
const res = await telegram.reopenGeneralForumTopic({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### replaceManagedBotToken

<details>
<summary><code>POST</code> <b><code>telegram.replaceManagedBotToken</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/replaceManagedBotToken</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#replacemanagedbottoken)

```typescript
const res = await telegram.replaceManagedBotToken({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### replaceStickerInSet

<details>
<summary><code>POST</code> <b><code>telegram.replaceStickerInSet</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/replaceStickerInSet</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#replacestickerinset)

```typescript
const res = await telegram.replaceStickerInSet({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### repostStory

<details>
<summary><code>POST</code> <b><code>telegram.repostStory</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/repostStory</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#repoststory)

```typescript
const res = await telegram.repostStory({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### restrictChatMember

<details>
<summary><code>POST</code> <b><code>telegram.restrictChatMember</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/restrictChatMember</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#revokechatinvitelink)

```typescript
const res = await telegram.revokeChatInviteLink({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### savePreparedInlineMessage

<details>
<summary><code>POST</code> <b><code>telegram.savePreparedInlineMessage</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/savePreparedInlineMessage</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#savepreparedinlinemessage)

```typescript
const res = await telegram.savePreparedInlineMessage({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### savePreparedKeyboardButton

<details>
<summary><code>POST</code> <b><code>telegram.savePreparedKeyboardButton</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/savePreparedKeyboardButton</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#savepreparedkeyboardbutton)

```typescript
const res = await telegram.savePreparedKeyboardButton({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendAnimation

<details>
<summary><code>POST</code> <b><code>telegram.sendAnimation</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendAnimation</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendchataction)

```typescript
const res = await telegram.sendChatAction({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendChatJoinRequestWebApp

<details>
<summary><code>POST</code> <b><code>telegram.sendChatJoinRequestWebApp</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendChatJoinRequestWebApp</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendchatjoinrequestwebapp)

```typescript
const res = await telegram.sendChatJoinRequestWebApp({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendChecklist

<details>
<summary><code>POST</code> <b><code>telegram.sendChecklist</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendChecklist</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#senddocument)

```typescript
const res = await telegram.sendDocument({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendGame

<details>
<summary><code>POST</code> <b><code>telegram.sendGame</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendGame</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendgame)

```typescript
const res = await telegram.sendGame({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendGift

<details>
<summary><code>POST</code> <b><code>telegram.sendGift</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendGift</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendgift)

```typescript
const res = await telegram.sendGift({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendInvoice

<details>
<summary><code>POST</code> <b><code>telegram.sendInvoice</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendInvoice</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendinvoice)

```typescript
const res = await telegram.sendInvoice({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendLivePhoto

<details>
<summary><code>POST</code> <b><code>telegram.sendLivePhoto</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendLivePhoto</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendrichmessagedraft)

```typescript
const res = await telegram.sendRichMessageDraft({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendSticker

<details>
<summary><code>POST</code> <b><code>telegram.sendSticker</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendSticker</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendsticker)

```typescript
const res = await telegram.sendSticker({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### sendVenue

<details>
<summary><code>POST</code> <b><code>telegram.sendVenue</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendVenue</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendvoice)

```typescript
const res = await telegram.sendVoice({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setBusinessAccountBio

<details>
<summary><code>POST</code> <b><code>telegram.setBusinessAccountBio</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setBusinessAccountBio</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setbusinessaccountbio)

```typescript
const res = await telegram.setBusinessAccountBio({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setBusinessAccountGiftSettings

<details>
<summary><code>POST</code> <b><code>telegram.setBusinessAccountGiftSettings</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setBusinessAccountGiftSettings</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setbusinessaccountgiftsettings)

```typescript
const res = await telegram.setBusinessAccountGiftSettings({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setBusinessAccountName

<details>
<summary><code>POST</code> <b><code>telegram.setBusinessAccountName</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setBusinessAccountName</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setbusinessaccountname)

```typescript
const res = await telegram.setBusinessAccountName({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setBusinessAccountProfilePhoto

<details>
<summary><code>POST</code> <b><code>telegram.setBusinessAccountProfilePhoto</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setBusinessAccountProfilePhoto</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setbusinessaccountprofilephoto)

```typescript
const res = await telegram.setBusinessAccountProfilePhoto({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setBusinessAccountUsername

<details>
<summary><code>POST</code> <b><code>telegram.setBusinessAccountUsername</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setBusinessAccountUsername</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setbusinessaccountusername)

```typescript
const res = await telegram.setBusinessAccountUsername({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setChatAdministratorCustomTitle

<details>
<summary><code>POST</code> <b><code>telegram.setChatAdministratorCustomTitle</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setChatAdministratorCustomTitle</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setchatmembertag)

```typescript
const res = await telegram.setChatMemberTag({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setChatMenuButton

<details>
<summary><code>POST</code> <b><code>telegram.setChatMenuButton</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setChatMenuButton</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setchatmenubutton)

```typescript
const res = await telegram.setChatMenuButton({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setChatPermissions

<details>
<summary><code>POST</code> <b><code>telegram.setChatPermissions</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setChatPermissions</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setchattitle)

```typescript
const res = await telegram.setChatTitle({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setCustomEmojiStickerSetThumbnail

<details>
<summary><code>POST</code> <b><code>telegram.setCustomEmojiStickerSetThumbnail</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setCustomEmojiStickerSetThumbnail</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setcustomemojistickersetthumbnail)

```typescript
const res = await telegram.setCustomEmojiStickerSetThumbnail({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setGameScore

<details>
<summary><code>POST</code> <b><code>telegram.setGameScore</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setGameScore</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setgamescore)

```typescript
const res = await telegram.setGameScore({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setManagedBotAccessSettings

<details>
<summary><code>POST</code> <b><code>telegram.setManagedBotAccessSettings</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setManagedBotAccessSettings</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setmanagedbotaccesssettings)

```typescript
const res = await telegram.setManagedBotAccessSettings({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setMessageReaction

<details>
<summary><code>POST</code> <b><code>telegram.setMessageReaction</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setMessageReaction</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setmessagereaction)

```typescript
const res = await telegram.setMessageReaction({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setMyCommands

<details>
<summary><code>POST</code> <b><code>telegram.setMyCommands</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setMyCommands</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setmyname)

```typescript
const res = await telegram.setMyName({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setMyProfilePhoto

<details>
<summary><code>POST</code> <b><code>telegram.setMyProfilePhoto</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setMyProfilePhoto</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setmyprofilephoto)

```typescript
const res = await telegram.setMyProfilePhoto({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setMyShortDescription

<details>
<summary><code>POST</code> <b><code>telegram.setMyShortDescription</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setMyShortDescription</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setmyshortdescription)

```typescript
const res = await telegram.setMyShortDescription({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setPassportDataErrors

<details>
<summary><code>POST</code> <b><code>telegram.setPassportDataErrors</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setPassportDataErrors</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setpassportdataerrors)

```typescript
const res = await telegram.setPassportDataErrors({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setStickerEmojiList

<details>
<summary><code>POST</code> <b><code>telegram.setStickerEmojiList</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setStickerEmojiList</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setstickeremojilist)

```typescript
const res = await telegram.setStickerEmojiList({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setStickerKeywords

<details>
<summary><code>POST</code> <b><code>telegram.setStickerKeywords</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setStickerKeywords</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setstickerkeywords)

```typescript
const res = await telegram.setStickerKeywords({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setStickerMaskPosition

<details>
<summary><code>POST</code> <b><code>telegram.setStickerMaskPosition</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setStickerMaskPosition</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setstickermaskposition)

```typescript
const res = await telegram.setStickerMaskPosition({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setStickerPositionInSet

<details>
<summary><code>POST</code> <b><code>telegram.setStickerPositionInSet</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setStickerPositionInSet</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setstickerpositioninset)

```typescript
const res = await telegram.setStickerPositionInSet({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setStickerSetThumbnail

<details>
<summary><code>POST</code> <b><code>telegram.setStickerSetThumbnail</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setStickerSetThumbnail</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setstickersetthumbnail)

```typescript
const res = await telegram.setStickerSetThumbnail({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setStickerSetTitle

<details>
<summary><code>POST</code> <b><code>telegram.setStickerSetTitle</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setStickerSetTitle</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setstickersettitle)

```typescript
const res = await telegram.setStickerSetTitle({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setUserEmojiStatus

<details>
<summary><code>POST</code> <b><code>telegram.setUserEmojiStatus</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setUserEmojiStatus</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setuseremojistatus)

```typescript
const res = await telegram.setUserEmojiStatus({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setWebhook

<details>
<summary><code>POST</code> <b><code>telegram.setWebhook</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setWebhook</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#setwebhook)

```typescript
const res = await telegram.setWebhook({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### stopMessageLiveLocation

<details>
<summary><code>POST</code> <b><code>telegram.stopMessageLiveLocation</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/stopMessageLiveLocation</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#stoppoll)

```typescript
const res = await telegram.stopPoll({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### transferBusinessAccountStars

<details>
<summary><code>POST</code> <b><code>telegram.transferBusinessAccountStars</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/transferBusinessAccountStars</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#transferbusinessaccountstars)

```typescript
const res = await telegram.transferBusinessAccountStars({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### transferGift

<details>
<summary><code>POST</code> <b><code>telegram.transferGift</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/transferGift</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#transfergift)

```typescript
const res = await telegram.transferGift({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### unbanChatMember

<details>
<summary><code>POST</code> <b><code>telegram.unbanChatMember</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/unbanChatMember</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#unhidegeneralforumtopic)

```typescript
const res = await telegram.unhideGeneralForumTopic({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### unpinAllChatMessages

<details>
<summary><code>POST</code> <b><code>telegram.unpinAllChatMessages</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/unpinAllChatMessages</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#unpinallchatmessages)

```typescript
const res = await telegram.unpinAllChatMessages({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### unpinAllForumTopicMessages

<details>
<summary><code>POST</code> <b><code>telegram.unpinAllForumTopicMessages</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/unpinAllForumTopicMessages</code>

Cost tier: <code>cheap</code>

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

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#unpinallgeneralforumtopicmessages)

```typescript
const res = await telegram.unpinAllGeneralForumTopicMessages({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### unpinChatMessage

<details>
<summary><code>POST</code> <b><code>telegram.unpinChatMessage</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/unpinChatMessage</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#unpinchatmessage)

```typescript
const res = await telegram.unpinChatMessage({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### upgradeGift

<details>
<summary><code>POST</code> <b><code>telegram.upgradeGift</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/upgradeGift</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#upgradegift)

```typescript
const res = await telegram.upgradeGift({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### uploadStickerFile

<details>
<summary><code>POST</code> <b><code>telegram.uploadStickerFile</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/uploadStickerFile</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#uploadstickerfile)

```typescript
const res = await telegram.uploadStickerFile({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### verifyChat

<details>
<summary><code>POST</code> <b><code>telegram.verifyChat</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/verifyChat</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#verifychat)

```typescript
const res = await telegram.verifyChat({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### verifyUser

<details>
<summary><code>POST</code> <b><code>telegram.verifyUser</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/verifyUser</code>

Cost tier: <code>cheap</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#verifyuser)

```typescript
const res = await telegram.verifyUser({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
