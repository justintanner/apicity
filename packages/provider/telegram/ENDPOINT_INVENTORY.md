# Telegram Bot API endpoint inventory

Inventory source: https://core.telegram.org/bots/api, Bot API 10.1,
published June 11, 2026.

`scripts/endpoint-docs.tsv` is the lint-enforced list of implemented provider
endpoints. At the time of this inventory it contains four Telegram rows:
`sendMessage`, `sendPhoto`, `sendVideo`, and `sendAudio`.

## Summary

- Official Bot API methods: 180
- Implemented in `@apicity/telegram`: 4
- Missing in-scope wrappers: 176
- Out-of-scope official methods: 0

The Bot API also documents type-only additions and transport behavior that do
not become endpoint rows. These are tracked as notes below rather than TSV
entries.

## Implementation slices

| Bead        | Scope                                                                                                     | Notes                                                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `ac-p7v0.2` | Updates, webhook, bot account, file, command/menu metadata, managed-bot access/token methods              | Treat webhook `secret_token`, bot tokens, file paths, and managed-bot token responses as sensitive in tests and recordings.                |
| `ac-p7v0.3` | Message sending, media sending, polls, checklist, drafts, chat action, rich messages                      | Includes Bot API 10.x `sendLivePhoto`, `sendRichMessage`, and `sendRichMessageDraft`. Multipart and JSON serialization both need coverage. |
| `ac-p7v0.4` | Forward/copy, pin/unpin, message editing, poll stopping, suggested posts, delete, reactions               | Includes Bot API 10.0 `deleteMessageReaction` and `deleteAllMessageReactions`.                                                             |
| `ac-p7v0.5` | Chat/member administration, invite links, join request queries, chat profile fields, forum topics, boosts | Includes Bot API 10.1 `answerChatJoinRequestQuery` and `sendChatJoinRequestWebApp`. Many methods require privileged bot/chat state.        |
| `ac-p7v0.6` | Callback, guest, inline, web app, payment, stars, gifts, stickers, games, passport, business, stories     | Includes payment/passport/business endpoints that need extra sanitizer coverage.                                                           |
| `ac-p7v0.7` | Docs, examples, endpoint docs, sanitizer refresh                                                          | Regenerate docs and harden Telegram-specific redaction after implementation branches land.                                                 |
| `ac-p7v0.8` | Final coverage gate                                                                                       | Re-run this inventory against the final branch and confirm there are no in-scope gaps.                                                     |

## Risk and sanitizer notes

The following endpoint families need focused sanitizer or fixture care:

- Auth tokens and secret material: `setWebhook`, `getManagedBotToken`,
  `replaceManagedBotToken`, managed-bot access settings, webhook
  `secret_token`, and URLs containing `/bot{token}/`.
- Payment, Stars, gifts, and subscriptions: `sendInvoice`,
  `createInvoiceLink`, `answerPreCheckoutQuery`, `refundStarPayment`,
  `editUserStarSubscription`, `sendGift`, `transferGift`, and business-star
  endpoints. Payloads and transaction identifiers should be scrubbed.
- Passport and identity: `setPassportDataErrors`, verification methods, and
  business account profile methods should avoid real personal data in fixtures.
- Uploads and media: methods accepting `InputFile`, `InputMedia*`,
  `InputPaidMedia*`, stickers, story media, live photos, and webhook
  certificates need deterministic multipart serialization and sanitized file
  contents.
- Admin/chat state: moderation, invite-link, join-request, forum, boost, and
  business methods often require privileged chats or specialized accounts.
  Prefer request-construction/unit coverage where live recording credentials
  are impractical.

## Out-of-scope notes

- The "making requests when getting updates" webhook response shortcut is a
  transport behavior, not a named provider method.
- Local Bot API server setup is deployment guidance, not a provider endpoint.
- Type-only additions such as `RichText*`, `RichBlock*`, `LivePhoto`,
  `InputRichMessage*`, and poll media classes should be represented in request
  and response shapes where relevant, but they do not receive
  `endpoint-docs.tsv` rows unless they are attached to a method.

## Method inventory

| Method                              | Status      | Implementation bead |
| ----------------------------------- | ----------- | ------------------- |
| `getUpdates`                        | missing     | `ac-p7v0.2`         |
| `setWebhook`                        | missing     | `ac-p7v0.2`         |
| `deleteWebhook`                     | missing     | `ac-p7v0.2`         |
| `getWebhookInfo`                    | missing     | `ac-p7v0.2`         |
| `getMe`                             | missing     | `ac-p7v0.2`         |
| `logOut`                            | missing     | `ac-p7v0.2`         |
| `close`                             | missing     | `ac-p7v0.2`         |
| `sendMessage`                       | implemented | `ac-p7v0.3`         |
| `forwardMessage`                    | missing     | `ac-p7v0.4`         |
| `forwardMessages`                   | missing     | `ac-p7v0.4`         |
| `copyMessage`                       | missing     | `ac-p7v0.4`         |
| `copyMessages`                      | missing     | `ac-p7v0.4`         |
| `sendPhoto`                         | implemented | `ac-p7v0.3`         |
| `sendLivePhoto`                     | missing     | `ac-p7v0.3`         |
| `sendAudio`                         | implemented | `ac-p7v0.3`         |
| `sendDocument`                      | missing     | `ac-p7v0.3`         |
| `sendVideo`                         | implemented | `ac-p7v0.3`         |
| `sendAnimation`                     | missing     | `ac-p7v0.3`         |
| `sendVoice`                         | missing     | `ac-p7v0.3`         |
| `sendVideoNote`                     | missing     | `ac-p7v0.3`         |
| `sendPaidMedia`                     | missing     | `ac-p7v0.3`         |
| `sendMediaGroup`                    | missing     | `ac-p7v0.3`         |
| `sendLocation`                      | missing     | `ac-p7v0.3`         |
| `sendVenue`                         | missing     | `ac-p7v0.3`         |
| `sendContact`                       | missing     | `ac-p7v0.3`         |
| `sendPoll`                          | missing     | `ac-p7v0.3`         |
| `sendChecklist`                     | missing     | `ac-p7v0.3`         |
| `sendDice`                          | missing     | `ac-p7v0.3`         |
| `sendMessageDraft`                  | missing     | `ac-p7v0.3`         |
| `sendChatAction`                    | missing     | `ac-p7v0.3`         |
| `setMessageReaction`                | missing     | `ac-p7v0.4`         |
| `getUserProfilePhotos`              | missing     | `ac-p7v0.2`         |
| `getUserProfileAudios`              | missing     | `ac-p7v0.2`         |
| `setUserEmojiStatus`                | missing     | `ac-p7v0.2`         |
| `getFile`                           | missing     | `ac-p7v0.2`         |
| `banChatMember`                     | missing     | `ac-p7v0.5`         |
| `unbanChatMember`                   | missing     | `ac-p7v0.5`         |
| `restrictChatMember`                | missing     | `ac-p7v0.5`         |
| `promoteChatMember`                 | missing     | `ac-p7v0.5`         |
| `setChatAdministratorCustomTitle`   | missing     | `ac-p7v0.5`         |
| `setChatMemberTag`                  | missing     | `ac-p7v0.5`         |
| `banChatSenderChat`                 | missing     | `ac-p7v0.5`         |
| `unbanChatSenderChat`               | missing     | `ac-p7v0.5`         |
| `setChatPermissions`                | missing     | `ac-p7v0.5`         |
| `exportChatInviteLink`              | missing     | `ac-p7v0.5`         |
| `createChatInviteLink`              | missing     | `ac-p7v0.5`         |
| `editChatInviteLink`                | missing     | `ac-p7v0.5`         |
| `createChatSubscriptionInviteLink`  | missing     | `ac-p7v0.5`         |
| `editChatSubscriptionInviteLink`    | missing     | `ac-p7v0.5`         |
| `revokeChatInviteLink`              | missing     | `ac-p7v0.5`         |
| `approveChatJoinRequest`            | missing     | `ac-p7v0.5`         |
| `declineChatJoinRequest`            | missing     | `ac-p7v0.5`         |
| `answerChatJoinRequestQuery`        | missing     | `ac-p7v0.5`         |
| `sendChatJoinRequestWebApp`         | missing     | `ac-p7v0.5`         |
| `setChatPhoto`                      | missing     | `ac-p7v0.5`         |
| `deleteChatPhoto`                   | missing     | `ac-p7v0.5`         |
| `setChatTitle`                      | missing     | `ac-p7v0.5`         |
| `setChatDescription`                | missing     | `ac-p7v0.5`         |
| `pinChatMessage`                    | missing     | `ac-p7v0.4`         |
| `unpinChatMessage`                  | missing     | `ac-p7v0.4`         |
| `unpinAllChatMessages`              | missing     | `ac-p7v0.4`         |
| `leaveChat`                         | missing     | `ac-p7v0.5`         |
| `getChat`                           | missing     | `ac-p7v0.5`         |
| `getChatAdministrators`             | missing     | `ac-p7v0.5`         |
| `getChatMemberCount`                | missing     | `ac-p7v0.5`         |
| `getChatMember`                     | missing     | `ac-p7v0.5`         |
| `getUserPersonalChatMessages`       | missing     | `ac-p7v0.5`         |
| `setChatStickerSet`                 | missing     | `ac-p7v0.5`         |
| `deleteChatStickerSet`              | missing     | `ac-p7v0.5`         |
| `getForumTopicIconStickers`         | missing     | `ac-p7v0.5`         |
| `createForumTopic`                  | missing     | `ac-p7v0.5`         |
| `editForumTopic`                    | missing     | `ac-p7v0.5`         |
| `closeForumTopic`                   | missing     | `ac-p7v0.5`         |
| `reopenForumTopic`                  | missing     | `ac-p7v0.5`         |
| `deleteForumTopic`                  | missing     | `ac-p7v0.5`         |
| `unpinAllForumTopicMessages`        | missing     | `ac-p7v0.5`         |
| `editGeneralForumTopic`             | missing     | `ac-p7v0.5`         |
| `closeGeneralForumTopic`            | missing     | `ac-p7v0.5`         |
| `reopenGeneralForumTopic`           | missing     | `ac-p7v0.5`         |
| `hideGeneralForumTopic`             | missing     | `ac-p7v0.5`         |
| `unhideGeneralForumTopic`           | missing     | `ac-p7v0.5`         |
| `unpinAllGeneralForumTopicMessages` | missing     | `ac-p7v0.5`         |
| `answerCallbackQuery`               | missing     | `ac-p7v0.6`         |
| `answerGuestQuery`                  | missing     | `ac-p7v0.6`         |
| `getUserChatBoosts`                 | missing     | `ac-p7v0.5`         |
| `getBusinessConnection`             | missing     | `ac-p7v0.6`         |
| `getManagedBotToken`                | missing     | `ac-p7v0.2`         |
| `replaceManagedBotToken`            | missing     | `ac-p7v0.2`         |
| `getManagedBotAccessSettings`       | missing     | `ac-p7v0.2`         |
| `setManagedBotAccessSettings`       | missing     | `ac-p7v0.2`         |
| `setMyCommands`                     | missing     | `ac-p7v0.2`         |
| `deleteMyCommands`                  | missing     | `ac-p7v0.2`         |
| `getMyCommands`                     | missing     | `ac-p7v0.2`         |
| `setMyName`                         | missing     | `ac-p7v0.2`         |
| `getMyName`                         | missing     | `ac-p7v0.2`         |
| `setMyDescription`                  | missing     | `ac-p7v0.2`         |
| `getMyDescription`                  | missing     | `ac-p7v0.2`         |
| `setMyShortDescription`             | missing     | `ac-p7v0.2`         |
| `getMyShortDescription`             | missing     | `ac-p7v0.2`         |
| `setMyProfilePhoto`                 | missing     | `ac-p7v0.2`         |
| `removeMyProfilePhoto`              | missing     | `ac-p7v0.2`         |
| `setChatMenuButton`                 | missing     | `ac-p7v0.2`         |
| `getChatMenuButton`                 | missing     | `ac-p7v0.2`         |
| `setMyDefaultAdministratorRights`   | missing     | `ac-p7v0.2`         |
| `getMyDefaultAdministratorRights`   | missing     | `ac-p7v0.2`         |
| `getAvailableGifts`                 | missing     | `ac-p7v0.6`         |
| `sendGift`                          | missing     | `ac-p7v0.6`         |
| `giftPremiumSubscription`           | missing     | `ac-p7v0.6`         |
| `verifyUser`                        | missing     | `ac-p7v0.6`         |
| `verifyChat`                        | missing     | `ac-p7v0.6`         |
| `removeUserVerification`            | missing     | `ac-p7v0.6`         |
| `removeChatVerification`            | missing     | `ac-p7v0.6`         |
| `readBusinessMessage`               | missing     | `ac-p7v0.6`         |
| `deleteBusinessMessages`            | missing     | `ac-p7v0.6`         |
| `setBusinessAccountName`            | missing     | `ac-p7v0.6`         |
| `setBusinessAccountUsername`        | missing     | `ac-p7v0.6`         |
| `setBusinessAccountBio`             | missing     | `ac-p7v0.6`         |
| `setBusinessAccountProfilePhoto`    | missing     | `ac-p7v0.6`         |
| `removeBusinessAccountProfilePhoto` | missing     | `ac-p7v0.6`         |
| `setBusinessAccountGiftSettings`    | missing     | `ac-p7v0.6`         |
| `getBusinessAccountStarBalance`     | missing     | `ac-p7v0.6`         |
| `transferBusinessAccountStars`      | missing     | `ac-p7v0.6`         |
| `getBusinessAccountGifts`           | missing     | `ac-p7v0.6`         |
| `getUserGifts`                      | missing     | `ac-p7v0.6`         |
| `getChatGifts`                      | missing     | `ac-p7v0.6`         |
| `convertGiftToStars`                | missing     | `ac-p7v0.6`         |
| `upgradeGift`                       | missing     | `ac-p7v0.6`         |
| `transferGift`                      | missing     | `ac-p7v0.6`         |
| `postStory`                         | missing     | `ac-p7v0.6`         |
| `repostStory`                       | missing     | `ac-p7v0.6`         |
| `editStory`                         | missing     | `ac-p7v0.6`         |
| `deleteStory`                       | missing     | `ac-p7v0.6`         |
| `answerWebAppQuery`                 | missing     | `ac-p7v0.6`         |
| `savePreparedInlineMessage`         | missing     | `ac-p7v0.6`         |
| `savePreparedKeyboardButton`        | missing     | `ac-p7v0.6`         |
| `editMessageText`                   | missing     | `ac-p7v0.4`         |
| `editMessageCaption`                | missing     | `ac-p7v0.4`         |
| `editMessageMedia`                  | missing     | `ac-p7v0.4`         |
| `editMessageLiveLocation`           | missing     | `ac-p7v0.4`         |
| `stopMessageLiveLocation`           | missing     | `ac-p7v0.4`         |
| `editMessageChecklist`              | missing     | `ac-p7v0.4`         |
| `editMessageReplyMarkup`            | missing     | `ac-p7v0.4`         |
| `stopPoll`                          | missing     | `ac-p7v0.4`         |
| `approveSuggestedPost`              | missing     | `ac-p7v0.4`         |
| `declineSuggestedPost`              | missing     | `ac-p7v0.4`         |
| `deleteMessage`                     | missing     | `ac-p7v0.4`         |
| `deleteMessages`                    | missing     | `ac-p7v0.4`         |
| `deleteMessageReaction`             | missing     | `ac-p7v0.4`         |
| `deleteAllMessageReactions`         | missing     | `ac-p7v0.4`         |
| `sendSticker`                       | missing     | `ac-p7v0.6`         |
| `getStickerSet`                     | missing     | `ac-p7v0.6`         |
| `getCustomEmojiStickers`            | missing     | `ac-p7v0.6`         |
| `uploadStickerFile`                 | missing     | `ac-p7v0.6`         |
| `createNewStickerSet`               | missing     | `ac-p7v0.6`         |
| `addStickerToSet`                   | missing     | `ac-p7v0.6`         |
| `setStickerPositionInSet`           | missing     | `ac-p7v0.6`         |
| `deleteStickerFromSet`              | missing     | `ac-p7v0.6`         |
| `replaceStickerInSet`               | missing     | `ac-p7v0.6`         |
| `setStickerEmojiList`               | missing     | `ac-p7v0.6`         |
| `setStickerKeywords`                | missing     | `ac-p7v0.6`         |
| `setStickerMaskPosition`            | missing     | `ac-p7v0.6`         |
| `setStickerSetTitle`                | missing     | `ac-p7v0.6`         |
| `setStickerSetThumbnail`            | missing     | `ac-p7v0.6`         |
| `setCustomEmojiStickerSetThumbnail` | missing     | `ac-p7v0.6`         |
| `deleteStickerSet`                  | missing     | `ac-p7v0.6`         |
| `sendRichMessage`                   | missing     | `ac-p7v0.3`         |
| `sendRichMessageDraft`              | missing     | `ac-p7v0.3`         |
| `answerInlineQuery`                 | missing     | `ac-p7v0.6`         |
| `sendInvoice`                       | missing     | `ac-p7v0.6`         |
| `createInvoiceLink`                 | missing     | `ac-p7v0.6`         |
| `answerShippingQuery`               | missing     | `ac-p7v0.6`         |
| `answerPreCheckoutQuery`            | missing     | `ac-p7v0.6`         |
| `getMyStarBalance`                  | missing     | `ac-p7v0.6`         |
| `getStarTransactions`               | missing     | `ac-p7v0.6`         |
| `refundStarPayment`                 | missing     | `ac-p7v0.6`         |
| `editUserStarSubscription`          | missing     | `ac-p7v0.6`         |
| `setPassportDataErrors`             | missing     | `ac-p7v0.6`         |
| `sendGame`                          | missing     | `ac-p7v0.6`         |
| `setGameScore`                      | missing     | `ac-p7v0.6`         |
| `getGameHighScores`                 | missing     | `ac-p7v0.6`         |
