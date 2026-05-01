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
// POST /2/media/upload/initialize
// ---------------------------------------------------------------------------

// `media_category` values documented for v2: amplify_video, tweet_video,
// tweet_image, tweet_gif, dm_video, dm_image, dm_gif, subtitles. Modeled as
// open string to stay forward-compatible with new categories X may add.
export const XMediaUploadInitializeRequestSchema = z.object({
  media_type: z.string().min(1),
  total_bytes: z.number().int().min(0).max(17_179_869_184),
  media_category: z.string().optional(),
  shared: z.boolean().optional(),
  additional_owners: z.array(z.string()).optional(),
});

export type XMediaUploadInitializeRequest = z.infer<
  typeof XMediaUploadInitializeRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /2/media/upload/{id}/append
// ---------------------------------------------------------------------------

// Body is multipart form-data — `media` is a binary chunk (≤ 1 MB),
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

// Either `text` or `media.media_ids` is required by the server. We don't pre-
// validate that — leave it to the API so error messages match what callers
// would get from the X API directly.
const XReplySettingsSchema = z.enum([
  "everyone",
  "mentionedUsers",
  "following",
  "subscribers",
  "verified",
]);

const XTweetMediaSchema = z.object({
  media_ids: z
    .array(z.string().regex(/^[0-9]+$/))
    .min(1)
    .max(4),
  tagged_user_ids: z.array(z.string()).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  preview_media_id: z.string().optional(),
  embeddable: z.boolean().optional(),
});

const XTweetReplySchema = z.object({
  in_reply_to_tweet_id: z.string().regex(/^[0-9]+$/),
  exclude_reply_user_ids: z.array(z.string()).optional(),
});

const XTweetPollSchema = z.object({
  options: z.array(z.string()).min(2).max(4),
  duration_minutes: z.number().int().min(5).max(10080),
  reply_settings: XReplySettingsSchema.optional(),
});

const XTweetGeoSchema = z.object({
  place_id: z.string(),
});

export const XTweetCreateRequestSchema = z.object({
  text: z.string().max(4000).optional(),
  direct_message_deep_link: z.string().optional(),
  for_super_followers_only: z.boolean().optional(),
  geo: XTweetGeoSchema.optional(),
  media: XTweetMediaSchema.optional(),
  nullcast: z.boolean().optional(),
  poll: XTweetPollSchema.optional(),
  quote_tweet_id: z
    .string()
    .regex(/^[0-9]+$/)
    .optional(),
  reply: XTweetReplySchema.optional(),
  reply_settings: XReplySettingsSchema.optional(),
});

export type XTweetCreateRequest = z.infer<typeof XTweetCreateRequestSchema>;
