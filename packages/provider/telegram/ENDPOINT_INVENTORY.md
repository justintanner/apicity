# Telegram Bot API endpoint inventory

Inventory source: https://core.telegram.org/bots/api, Bot API 10.1,
published June 11, 2026.

`scripts/endpoint-docs.tsv` is the lint-enforced list of implemented provider
endpoints. The final branch contains Telegram rows for all official Bot API methods.

## Summary

- Official Bot API methods: 180
- Implemented in `@apicity/telegram`: 180
- Missing in-scope wrappers: 0
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
| `getUpdates`                        | implemented | `ac-p7v0.2`         |
| `setWebhook`                        | implemented | `ac-p7v0.2`         |
| `deleteWebhook`                     | implemented | `ac-p7v0.2`         |
| `getWebhookInfo`                    | implemented | `ac-p7v0.2`         |
| `getMe`                             | implemented | `ac-p7v0.2`         |
| `logOut`                            | implemented | `ac-p7v0.2`         |
| `close`                             | implemented | `ac-p7v0.2`         |
| `sendMessage`                       | implemented | `ac-p7v0.3`         |
| `forwardMessage`                    | implemented | `ac-p7v0.4`         |
| `forwardMessages`                   | implemented | `ac-p7v0.4`         |
| `copyMessage`                       | implemented | `ac-p7v0.4`         |
| `copyMessages`                      | implemented | `ac-p7v0.4`         |
| `sendPhoto`                         | implemented | `ac-p7v0.3`         |
| `sendLivePhoto`                     | implemented | `ac-p7v0.3`         |
| `sendAudio`                         | implemented | `ac-p7v0.3`         |
| `sendDocument`                      | implemented | `ac-p7v0.3`         |
| `sendVideo`                         | implemented | `ac-p7v0.3`         |
| `sendAnimation`                     | implemented | `ac-p7v0.3`         |
| `sendVoice`                         | implemented | `ac-p7v0.3`         |
| `sendVideoNote`                     | implemented | `ac-p7v0.3`         |
| `sendPaidMedia`                     | implemented | `ac-p7v0.3`         |
| `sendMediaGroup`                    | implemented | `ac-p7v0.3`         |
| `sendLocation`                      | implemented | `ac-p7v0.3`         |
| `sendVenue`                         | implemented | `ac-p7v0.3`         |
| `sendContact`                       | implemented | `ac-p7v0.3`         |
| `sendPoll`                          | implemented | `ac-p7v0.3`         |
| `sendChecklist`                     | implemented | `ac-p7v0.3`         |
| `sendDice`                          | implemented | `ac-p7v0.3`         |
| `sendMessageDraft`                  | implemented | `ac-p7v0.3`         |
| `sendChatAction`                    | implemented | `ac-p7v0.3`         |
| `setMessageReaction`                | implemented | `ac-p7v0.4`         |
| `getUserProfilePhotos`              | implemented | `ac-p7v0.2`         |
| `getUserProfileAudios`              | implemented | `ac-p7v0.2`         |
| `setUserEmojiStatus`                | implemented | `ac-p7v0.2`         |
| `getFile`                           | implemented | `ac-p7v0.2`         |
| `banChatMember`                     | implemented | `ac-p7v0.5`         |
| `unbanChatMember`                   | implemented | `ac-p7v0.5`         |
| `restrictChatMember`                | implemented | `ac-p7v0.5`         |
| `promoteChatMember`                 | implemented | `ac-p7v0.5`         |
| `setChatAdministratorCustomTitle`   | implemented | `ac-p7v0.5`         |
| `setChatMemberTag`                  | implemented | `ac-p7v0.5`         |
| `banChatSenderChat`                 | implemented | `ac-p7v0.5`         |
| `unbanChatSenderChat`               | implemented | `ac-p7v0.5`         |
| `setChatPermissions`                | implemented | `ac-p7v0.5`         |
| `exportChatInviteLink`              | implemented | `ac-p7v0.5`         |
| `createChatInviteLink`              | implemented | `ac-p7v0.5`         |
| `editChatInviteLink`                | implemented | `ac-p7v0.5`         |
| `createChatSubscriptionInviteLink`  | implemented | `ac-p7v0.5`         |
| `editChatSubscriptionInviteLink`    | implemented | `ac-p7v0.5`         |
| `revokeChatInviteLink`              | implemented | `ac-p7v0.5`         |
| `approveChatJoinRequest`            | implemented | `ac-p7v0.5`         |
| `declineChatJoinRequest`            | implemented | `ac-p7v0.5`         |
| `answerChatJoinRequestQuery`        | implemented | `ac-p7v0.5`         |
| `sendChatJoinRequestWebApp`         | implemented | `ac-p7v0.5`         |
| `setChatPhoto`                      | implemented | `ac-p7v0.5`         |
| `deleteChatPhoto`                   | implemented | `ac-p7v0.5`         |
| `setChatTitle`                      | implemented | `ac-p7v0.5`         |
| `setChatDescription`                | implemented | `ac-p7v0.5`         |
| `pinChatMessage`                    | implemented | `ac-p7v0.4`         |
| `unpinChatMessage`                  | implemented | `ac-p7v0.4`         |
| `unpinAllChatMessages`              | implemented | `ac-p7v0.4`         |
| `leaveChat`                         | implemented | `ac-p7v0.5`         |
| `getChat`                           | implemented | `ac-p7v0.5`         |
| `getChatAdministrators`             | implemented | `ac-p7v0.5`         |
| `getChatMemberCount`                | implemented | `ac-p7v0.5`         |
| `getChatMember`                     | implemented | `ac-p7v0.5`         |
| `getUserPersonalChatMessages`       | implemented | `ac-p7v0.5`         |
| `setChatStickerSet`                 | implemented | `ac-p7v0.5`         |
| `deleteChatStickerSet`              | implemented | `ac-p7v0.5`         |
| `getForumTopicIconStickers`         | implemented | `ac-p7v0.5`         |
| `createForumTopic`                  | implemented | `ac-p7v0.5`         |
| `editForumTopic`                    | implemented | `ac-p7v0.5`         |
| `closeForumTopic`                   | implemented | `ac-p7v0.5`         |
| `reopenForumTopic`                  | implemented | `ac-p7v0.5`         |
| `deleteForumTopic`                  | implemented | `ac-p7v0.5`         |
| `unpinAllForumTopicMessages`        | implemented | `ac-p7v0.5`         |
| `editGeneralForumTopic`             | implemented | `ac-p7v0.5`         |
| `closeGeneralForumTopic`            | implemented | `ac-p7v0.5`         |
| `reopenGeneralForumTopic`           | implemented | `ac-p7v0.5`         |
| `hideGeneralForumTopic`             | implemented | `ac-p7v0.5`         |
| `unhideGeneralForumTopic`           | implemented | `ac-p7v0.5`         |
| `unpinAllGeneralForumTopicMessages` | implemented | `ac-p7v0.5`         |
| `answerCallbackQuery`               | implemented | `ac-p7v0.6`         |
| `answerGuestQuery`                  | implemented | `ac-p7v0.6`         |
| `getUserChatBoosts`                 | implemented | `ac-p7v0.5`         |
| `getBusinessConnection`             | implemented | `ac-p7v0.6`         |
| `getManagedBotToken`                | implemented | `ac-p7v0.2`         |
| `replaceManagedBotToken`            | implemented | `ac-p7v0.2`         |
| `getManagedBotAccessSettings`       | implemented | `ac-p7v0.2`         |
| `setManagedBotAccessSettings`       | implemented | `ac-p7v0.2`         |
| `setMyCommands`                     | implemented | `ac-p7v0.2`         |
| `deleteMyCommands`                  | implemented | `ac-p7v0.2`         |
| `getMyCommands`                     | implemented | `ac-p7v0.2`         |
| `setMyName`                         | implemented | `ac-p7v0.2`         |
| `getMyName`                         | implemented | `ac-p7v0.2`         |
| `setMyDescription`                  | implemented | `ac-p7v0.2`         |
| `getMyDescription`                  | implemented | `ac-p7v0.2`         |
| `setMyShortDescription`             | implemented | `ac-p7v0.2`         |
| `getMyShortDescription`             | implemented | `ac-p7v0.2`         |
| `setMyProfilePhoto`                 | implemented | `ac-p7v0.2`         |
| `removeMyProfilePhoto`              | implemented | `ac-p7v0.2`         |
| `setChatMenuButton`                 | implemented | `ac-p7v0.2`         |
| `getChatMenuButton`                 | implemented | `ac-p7v0.2`         |
| `setMyDefaultAdministratorRights`   | implemented | `ac-p7v0.2`         |
| `getMyDefaultAdministratorRights`   | implemented | `ac-p7v0.2`         |
| `getAvailableGifts`                 | implemented | `ac-p7v0.6`         |
| `sendGift`                          | implemented | `ac-p7v0.6`         |
| `giftPremiumSubscription`           | implemented | `ac-p7v0.6`         |
| `verifyUser`                        | implemented | `ac-p7v0.6`         |
| `verifyChat`                        | implemented | `ac-p7v0.6`         |
| `removeUserVerification`            | implemented | `ac-p7v0.6`         |
| `removeChatVerification`            | implemented | `ac-p7v0.6`         |
| `readBusinessMessage`               | implemented | `ac-p7v0.6`         |
| `deleteBusinessMessages`            | implemented | `ac-p7v0.6`         |
| `setBusinessAccountName`            | implemented | `ac-p7v0.6`         |
| `setBusinessAccountUsername`        | implemented | `ac-p7v0.6`         |
| `setBusinessAccountBio`             | implemented | `ac-p7v0.6`         |
| `setBusinessAccountProfilePhoto`    | implemented | `ac-p7v0.6`         |
| `removeBusinessAccountProfilePhoto` | implemented | `ac-p7v0.6`         |
| `setBusinessAccountGiftSettings`    | implemented | `ac-p7v0.6`         |
| `getBusinessAccountStarBalance`     | implemented | `ac-p7v0.6`         |
| `transferBusinessAccountStars`      | implemented | `ac-p7v0.6`         |
| `getBusinessAccountGifts`           | implemented | `ac-p7v0.6`         |
| `getUserGifts`                      | implemented | `ac-p7v0.6`         |
| `getChatGifts`                      | implemented | `ac-p7v0.6`         |
| `convertGiftToStars`                | implemented | `ac-p7v0.6`         |
| `upgradeGift`                       | implemented | `ac-p7v0.6`         |
| `transferGift`                      | implemented | `ac-p7v0.6`         |
| `postStory`                         | implemented | `ac-p7v0.6`         |
| `repostStory`                       | implemented | `ac-p7v0.6`         |
| `editStory`                         | implemented | `ac-p7v0.6`         |
| `deleteStory`                       | implemented | `ac-p7v0.6`         |
| `answerWebAppQuery`                 | implemented | `ac-p7v0.6`         |
| `savePreparedInlineMessage`         | implemented | `ac-p7v0.6`         |
| `savePreparedKeyboardButton`        | implemented | `ac-p7v0.6`         |
| `editMessageText`                   | implemented | `ac-p7v0.4`         |
| `editMessageCaption`                | implemented | `ac-p7v0.4`         |
| `editMessageMedia`                  | implemented | `ac-p7v0.4`         |
| `editMessageLiveLocation`           | implemented | `ac-p7v0.4`         |
| `stopMessageLiveLocation`           | implemented | `ac-p7v0.4`         |
| `editMessageChecklist`              | implemented | `ac-p7v0.4`         |
| `editMessageReplyMarkup`            | implemented | `ac-p7v0.4`         |
| `stopPoll`                          | implemented | `ac-p7v0.4`         |
| `approveSuggestedPost`              | implemented | `ac-p7v0.4`         |
| `declineSuggestedPost`              | implemented | `ac-p7v0.4`         |
| `deleteMessage`                     | implemented | `ac-p7v0.4`         |
| `deleteMessages`                    | implemented | `ac-p7v0.4`         |
| `deleteMessageReaction`             | implemented | `ac-p7v0.4`         |
| `deleteAllMessageReactions`         | implemented | `ac-p7v0.4`         |
| `sendSticker`                       | implemented | `ac-p7v0.6`         |
| `getStickerSet`                     | implemented | `ac-p7v0.6`         |
| `getCustomEmojiStickers`            | implemented | `ac-p7v0.6`         |
| `uploadStickerFile`                 | implemented | `ac-p7v0.6`         |
| `createNewStickerSet`               | implemented | `ac-p7v0.6`         |
| `addStickerToSet`                   | implemented | `ac-p7v0.6`         |
| `setStickerPositionInSet`           | implemented | `ac-p7v0.6`         |
| `deleteStickerFromSet`              | implemented | `ac-p7v0.6`         |
| `replaceStickerInSet`               | implemented | `ac-p7v0.6`         |
| `setStickerEmojiList`               | implemented | `ac-p7v0.6`         |
| `setStickerKeywords`                | implemented | `ac-p7v0.6`         |
| `setStickerMaskPosition`            | implemented | `ac-p7v0.6`         |
| `setStickerSetTitle`                | implemented | `ac-p7v0.6`         |
| `setStickerSetThumbnail`            | implemented | `ac-p7v0.6`         |
| `setCustomEmojiStickerSetThumbnail` | implemented | `ac-p7v0.6`         |
| `deleteStickerSet`                  | implemented | `ac-p7v0.6`         |
| `sendRichMessage`                   | implemented | `ac-p7v0.3`         |
| `sendRichMessageDraft`              | implemented | `ac-p7v0.3`         |
| `answerInlineQuery`                 | implemented | `ac-p7v0.6`         |
| `sendInvoice`                       | implemented | `ac-p7v0.6`         |
| `createInvoiceLink`                 | implemented | `ac-p7v0.6`         |
| `answerShippingQuery`               | implemented | `ac-p7v0.6`         |
| `answerPreCheckoutQuery`            | implemented | `ac-p7v0.6`         |
| `getMyStarBalance`                  | implemented | `ac-p7v0.6`         |
| `getStarTransactions`               | implemented | `ac-p7v0.6`         |
| `refundStarPayment`                 | implemented | `ac-p7v0.6`         |
| `editUserStarSubscription`          | implemented | `ac-p7v0.6`         |
| `setPassportDataErrors`             | implemented | `ac-p7v0.6`         |
| `sendGame`                          | implemented | `ac-p7v0.6`         |
| `setGameScore`                      | implemented | `ac-p7v0.6`         |
| `getGameHighScores`                 | implemented | `ac-p7v0.6`         |
