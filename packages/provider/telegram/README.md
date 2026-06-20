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

66 endpoints across 66 groups. Each method mirrors an upstream URL path.

### addStickerToSet

<details>
<summary><code>POST</code> <b><code>telegram.addStickerToSet</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/addStickerToSet</code>

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

[Upstream docs ↗](https://core.telegram.org/bots/api#answercallbackquery)

```typescript
const res = await telegram.answerCallbackQuery({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### answerInlineQuery

<details>
<summary><code>POST</code> <b><code>telegram.answerInlineQuery</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/answerInlineQuery</code>

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

[Upstream docs ↗](https://core.telegram.org/bots/api#answerwebappquery)

```typescript
const res = await telegram.answerWebAppQuery({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### convertGiftToStars

<details>
<summary><code>POST</code> <b><code>telegram.convertGiftToStars</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/convertGiftToStars</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#convertgifttostars)

```typescript
const res = await telegram.convertGiftToStars({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### createInvoiceLink

<details>
<summary><code>POST</code> <b><code>telegram.createInvoiceLink</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/createInvoiceLink</code>

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

[Upstream docs ↗](https://core.telegram.org/bots/api#createnewstickerset)

```typescript
const res = await telegram.createNewStickerSet({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteBusinessMessages

<details>
<summary><code>POST</code> <b><code>telegram.deleteBusinessMessages</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteBusinessMessages</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#deletebusinessmessages)

```typescript
const res = await telegram.deleteBusinessMessages({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### deleteStickerFromSet

<details>
<summary><code>POST</code> <b><code>telegram.deleteStickerFromSet</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/deleteStickerFromSet</code>

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

[Upstream docs ↗](https://core.telegram.org/bots/api#deletestory)

```typescript
const res = await telegram.deleteStory({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### editStory

<details>
<summary><code>POST</code> <b><code>telegram.editStory</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/editStory</code>

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

[Upstream docs ↗](https://core.telegram.org/bots/api#edituserstarsubscription)

```typescript
const res = await telegram.editUserStarSubscription({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getAvailableGifts

<details>
<summary><code>POST</code> <b><code>telegram.getAvailableGifts</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getAvailableGifts</code>

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

[Upstream docs ↗](https://core.telegram.org/bots/api#getbusinessconnection)

```typescript
const res = await telegram.getBusinessConnection({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getChatGifts

<details>
<summary><code>POST</code> <b><code>telegram.getChatGifts</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getChatGifts</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getchatgifts)

```typescript
const res = await telegram.getChatGifts({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getCustomEmojiStickers

<details>
<summary><code>POST</code> <b><code>telegram.getCustomEmojiStickers</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getCustomEmojiStickers</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getcustomemojistickers)

```typescript
const res = await telegram.getCustomEmojiStickers({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getGameHighScores

<details>
<summary><code>POST</code> <b><code>telegram.getGameHighScores</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getGameHighScores</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getgamehighscores)

```typescript
const res = await telegram.getGameHighScores({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getMyStarBalance

<details>
<summary><code>POST</code> <b><code>telegram.getMyStarBalance</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getMyStarBalance</code>

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

[Upstream docs ↗](https://core.telegram.org/bots/api#getstickerset)

```typescript
const res = await telegram.getStickerSet({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### getUserGifts

<details>
<summary><code>POST</code> <b><code>telegram.getUserGifts</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/getUserGifts</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#getusergifts)

```typescript
const res = await telegram.getUserGifts({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### giftPremiumSubscription

<details>
<summary><code>POST</code> <b><code>telegram.giftPremiumSubscription</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/giftPremiumSubscription</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#giftpremiumsubscription)

```typescript
const res = await telegram.giftPremiumSubscription({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### postStory

<details>
<summary><code>POST</code> <b><code>telegram.postStory</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/postStory</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#poststory)

```typescript
const res = await telegram.postStory({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### readBusinessMessage

<details>
<summary><code>POST</code> <b><code>telegram.readBusinessMessage</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/readBusinessMessage</code>

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

[Upstream docs ↗](https://core.telegram.org/bots/api#removechatverification)

```typescript
const res = await telegram.removeChatVerification({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### removeUserVerification

<details>
<summary><code>POST</code> <b><code>telegram.removeUserVerification</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/removeUserVerification</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#removeuserverification)

```typescript
const res = await telegram.removeUserVerification({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### replaceStickerInSet

<details>
<summary><code>POST</code> <b><code>telegram.replaceStickerInSet</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/replaceStickerInSet</code>

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

[Upstream docs ↗](https://core.telegram.org/bots/api#repoststory)

```typescript
const res = await telegram.repostStory({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### savePreparedInlineMessage

<details>
<summary><code>POST</code> <b><code>telegram.savePreparedInlineMessage</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/savePreparedInlineMessage</code>

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

[Upstream docs ↗](https://core.telegram.org/bots/api#savepreparedkeyboardbutton)

```typescript
const res = await telegram.savePreparedKeyboardButton({ /* ... */ });
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

### sendGame

<details>
<summary><code>POST</code> <b><code>telegram.sendGame</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendGame</code>

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

[Upstream docs ↗](https://core.telegram.org/bots/api#sendinvoice)

```typescript
const res = await telegram.sendInvoice({ /* ... */ });
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

### sendSticker

<details>
<summary><code>POST</code> <b><code>telegram.sendSticker</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/sendSticker</code>

[Upstream docs ↗](https://core.telegram.org/bots/api#sendsticker)

```typescript
const res = await telegram.sendSticker({ /* ... */ });
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

### setBusinessAccountBio

<details>
<summary><code>POST</code> <b><code>telegram.setBusinessAccountBio</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setBusinessAccountBio</code>

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

[Upstream docs ↗](https://core.telegram.org/bots/api#setbusinessaccountusername)

```typescript
const res = await telegram.setBusinessAccountUsername({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setCustomEmojiStickerSetThumbnail

<details>
<summary><code>POST</code> <b><code>telegram.setCustomEmojiStickerSetThumbnail</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setCustomEmojiStickerSetThumbnail</code>

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

[Upstream docs ↗](https://core.telegram.org/bots/api#setgamescore)

```typescript
const res = await telegram.setGameScore({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### setPassportDataErrors

<details>
<summary><code>POST</code> <b><code>telegram.setPassportDataErrors</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/setPassportDataErrors</code>

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

[Upstream docs ↗](https://core.telegram.org/bots/api#setuseremojistatus)

```typescript
const res = await telegram.setUserEmojiStatus({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### transferBusinessAccountStars

<details>
<summary><code>POST</code> <b><code>telegram.transferBusinessAccountStars</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/transferBusinessAccountStars</code>

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

[Upstream docs ↗](https://core.telegram.org/bots/api#transfergift)

```typescript
const res = await telegram.transferGift({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

### upgradeGift

<details>
<summary><code>POST</code> <b><code>telegram.upgradeGift</code></b></summary>

<code>POST https://api.telegram.org/bot{token}/upgradeGift</code>

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

[Upstream docs ↗](https://core.telegram.org/bots/api#verifyuser)

```typescript
const res = await telegram.verifyUser({ /* ... */ });
```

Source: [`packages/provider/telegram/src/telegram.ts`](src/telegram.ts)

</details>

Part of the [apicity](https://github.com/justintanner/apicity) monorepo.

## License

MIT — see [LICENSE](LICENSE).
