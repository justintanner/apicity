import { z } from "zod";

// ---------------------------------------------------------------------------
// Provider options
// ---------------------------------------------------------------------------

// Instagram Graph API requires a long-lived user access token from the
// Instagram Login OAuth flow (instagram_business_basic +
// instagram_business_content_publish scopes). The caller obtains the token
// externally and supplies it here; this package does not implement the OAuth
// dance. Tokens last 60 days and are refreshable for another 60 each time.
export const IgOptionsSchema = z.object({
  accessToken: z.string().min(1),
  baseURL: z.string().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type IgOptions = z.infer<typeof IgOptionsSchema>;

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

// Instagram object IDs are numeric strings. The Graph API uses 64-bit ints
// over the wire as decimal strings to avoid JS precision loss. Cap at 19
// digits (max int64).
const IgIdStringSchema = z.string().regex(/^[0-9]{1,19}$/);

const IgUserTagSchema = z.object({
  username: z.string().min(1),
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
});

// ---------------------------------------------------------------------------
// POST /v25.0/{ig-user-id}/media
// ---------------------------------------------------------------------------

// `media_type` drives which url field is required. Carousel items reference
// their parent container via `is_carousel_item: true`, but full carousel
// support is out of scope for this first cut — REELS / VIDEO / IMAGE only.
const IgMediaTypeSchema = z.enum(["REELS", "VIDEO", "IMAGE", "CAROUSEL"]);

// Server-side validation enforces that REELS / VIDEO require `video_url`,
// IMAGE requires `image_url`, etc. Mirror the docs at the SDK layer with
// simple optionality so error messages come back from the API verbatim
// instead of being pre-empted by an over-zealous local schema.
export const IgMediaCreateRequestSchema = z.object({
  media_type: IgMediaTypeSchema,
  video_url: z.string().url().optional(),
  image_url: z.string().url().optional(),
  caption: z.string().max(2200).optional(),
  thumb_offset: z.number().int().min(0).optional(),
  share_to_feed: z.boolean().optional(),
  location_id: IgIdStringSchema.optional(),
  user_tags: z.array(IgUserTagSchema).max(20).optional(),
  collaborators: z.array(z.string().min(1)).max(3).optional(),
});

export type IgMediaCreateRequest = z.infer<typeof IgMediaCreateRequestSchema>;

// ---------------------------------------------------------------------------
// POST /v25.0/{ig-user-id}/media_publish
// ---------------------------------------------------------------------------

// `creation_id` is the container ID returned from /media — must reach
// status_code === "FINISHED" before this endpoint will accept it (server
// returns 400 otherwise).
export const IgMediaPublishRequestSchema = z.object({
  creation_id: IgIdStringSchema,
});

export type IgMediaPublishRequest = z.infer<typeof IgMediaPublishRequestSchema>;
