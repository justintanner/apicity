import { z } from "zod";

// ---------------------------------------------------------------------------
// Provider options
// ---------------------------------------------------------------------------

// X requires a user-context OAuth 2.0 access token to post or upload media.
// App-only Bearer tokens are read-only and rejected by the upload + tweets
// endpoints. The caller obtains the access token via the PKCE flow externally
// and supplies it here; this package does not implement the OAuth dance.
export const XOptionsSchema = z.object({
  accessToken: z.string().min(1),
  baseURL: z.string().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type XOptions = z.infer<typeof XOptionsSchema>;

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

// X v2 represents IDs as numeric strings (≤ 19 digits) to avoid 64-bit
// precision loss in JS — every id field on this surface uses this pattern.
const XIdStringSchema = z.string().regex(/^[0-9]{1,19}$/);

// ---------------------------------------------------------------------------
// POST /2/media/upload/initialize
// ---------------------------------------------------------------------------

const XMediaTypeSchema = z.enum([
  "video/mp4",
  "video/webm",
  "video/mp2t",
  "video/quicktime",
  "text/srt",
  "text/vtt",
  "image/jpeg",
  "image/gif",
  "image/bmp",
  "image/png",
  "image/webp",
  "image/pjpeg",
  "image/tiff",
  "model/gltf-binary",
  "model/vnd.usdz+zip",
]);

const XMediaCategorySchema = z.enum([
  "amplify_video",
  "tweet_gif",
  "tweet_image",
  "tweet_video",
  "dm_gif",
  "dm_image",
  "dm_video",
  "subtitles",
]);

// Both `media_type` and `total_bytes` are documented as optional even though
// realistic uploads always supply them — match the docs and let the server
// reject incomplete requests rather than over-constraining at the SDK layer.
export const XMediaUploadInitializeRequestSchema = z.object({
  media_type: XMediaTypeSchema.optional(),
  total_bytes: z.number().int().min(0).max(17_179_869_184).optional(),
  media_category: XMediaCategorySchema.optional(),
  shared: z.boolean().optional(),
  additional_owners: z.array(XIdStringSchema).optional(),
});

export type XMediaUploadInitializeRequest = z.infer<
  typeof XMediaUploadInitializeRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /2/media/upload/{id}/append
// ---------------------------------------------------------------------------

// Body is multipart form-data — `media` is a binary chunk,
// `segment_index` is the 0-based sequential chunk number (max 999). The
// schema validates the *typed* request object the user passes; the factory
// constructs the FormData from it and lets fetch set the boundary header.
export const XMediaUploadAppendRequestSchema = z.object({
  media: z.custom<Blob>(),
  segment_index: z.number().int().min(0).max(999),
});

export type XMediaUploadAppendRequest = z.infer<
  typeof XMediaUploadAppendRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /2/tweets
// ---------------------------------------------------------------------------

// reply_settings allowed values per docs.x.com/x-api/posts/create-post —
// note `everyone` is NOT in this list (it is the implicit default when the
// field is omitted, not an enum value the API accepts).
const XReplySettingsSchema = z.enum([
  "following",
  "mentionedUsers",
  "subscribers",
  "verified",
]);

const XTweetMediaCallToActionsSchema = z
  .object({
    app_install: z
      .object({
        app_store_id: z.string().optional(),
        ipad_app_store_id: z.string().optional(),
        play_store_id: z.string().optional(),
      })
      .optional(),
    visit_site: z.object({ url: z.string() }).optional(),
    watch_now: z.object({ url: z.string() }).optional(),
  })
  .refine(
    (v) =>
      [v.app_install, v.visit_site, v.watch_now].filter((x) => x !== undefined)
        .length === 1,
    { message: "exactly one of app_install, visit_site, watch_now is allowed" }
  );

const XTweetMediaSchema = z.object({
  media_ids: z.array(XIdStringSchema).min(1).max(4),
  call_to_actions: XTweetMediaCallToActionsSchema.optional(),
  description: z.string().optional(),
  embeddable: z.boolean().optional(),
  preview_media_id: XIdStringSchema.optional(),
  tagged_user_ids: z.array(XIdStringSchema).max(10).optional(),
  title: z.string().optional(),
});

const XTweetReplySchema = z.object({
  in_reply_to_tweet_id: XIdStringSchema,
  auto_populate_reply_metadata: z.boolean().optional(),
  exclude_reply_user_ids: z.array(XIdStringSchema).optional(),
});

const XTweetPollSchema = z.object({
  options: z.array(z.string().min(1).max(25)).min(2).max(4),
  duration_minutes: z.number().int().min(5).max(10080),
  reply_settings: XReplySettingsSchema.optional(),
});

const XTweetGeoSchema = z.object({
  place_id: z.string(),
});

const XTweetEditOptionsSchema = z.object({
  previous_post_id: XIdStringSchema,
});

// Either `text` or `media.media_ids` is required by the server. Mutual
// exclusion between media / poll / quote_tweet_id / card_uri /
// direct_message_deep_link is also server-enforced — we don't pre-validate
// either, so error messages match what the API returns directly.
export const XTweetCreateRequestSchema = z.object({
  text: z.string().optional(),
  card_uri: z.string().optional(),
  community_id: XIdStringSchema.optional(),
  direct_message_deep_link: z.string().optional(),
  edit_options: XTweetEditOptionsSchema.optional(),
  for_super_followers_only: z.boolean().optional(),
  geo: XTweetGeoSchema.optional(),
  made_with_ai: z.boolean().optional(),
  media: XTweetMediaSchema.optional(),
  nullcast: z.boolean().optional(),
  paid_partnership: z.boolean().optional(),
  poll: XTweetPollSchema.optional(),
  quote_tweet_id: XIdStringSchema.optional(),
  reply: XTweetReplySchema.optional(),
  reply_settings: XReplySettingsSchema.optional(),
  share_with_followers: z.boolean().optional(),
});

export type XTweetCreateRequest = z.infer<typeof XTweetCreateRequestSchema>;
