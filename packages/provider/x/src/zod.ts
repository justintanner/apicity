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
