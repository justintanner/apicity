import { z } from "zod";

// ---------------------------------------------------------------------------
// Provider options
// ---------------------------------------------------------------------------

// YouTube Data API v3 requires an OAuth 2.0 access token with the
// appropriate scopes (youtube.upload, youtube.force-ssl, etc.). The caller
// obtains the token externally and supplies it here; this package does not
// implement the OAuth dance.
export const YouTubeOptionsSchema = z.object({
  accessToken: z.string().min(1),
  baseURL: z.string().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type YouTubeOptions = z.infer<typeof YouTubeOptionsSchema>;

// ---------------------------------------------------------------------------
// GET /youtube/v3/channels
// ---------------------------------------------------------------------------

export const YouTubeChannelsListRequestSchema = z.object({
  part: z.string().min(1),
  id: z.string().optional(),
  mine: z.boolean().optional(),
  forUsername: z.string().optional(),
  maxResults: z.number().int().min(1).max(50).optional(),
  pageToken: z.string().optional(),
});

export type YouTubeChannelsListRequest = z.infer<
  typeof YouTubeChannelsListRequestSchema
>;

// ---------------------------------------------------------------------------
// POST /upload/youtube/v3/videos
// ---------------------------------------------------------------------------

export const YouTubeVideosInsertRequestSchema = z.object({
  part: z.string().min(1),
  snippet: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      categoryId: z.string().optional(),
      defaultLanguage: z.string().optional(),
    })
    .optional(),
  status: z
    .object({
      privacyStatus: z.enum(["private", "public", "unlisted"]).optional(),
      publishAt: z.string().optional(),
      license: z.string().optional(),
      embeddable: z.boolean().optional(),
      publicStatsViewable: z.boolean().optional(),
      selfDeclaredMadeForKids: z.boolean().optional(),
      containsSyntheticMedia: z.boolean().optional(),
    })
    .optional(),
  notifySubscribers: z.boolean().optional(),
  onBehalfOfContentOwner: z.string().optional(),
  onBehalfOfContentOwnerChannel: z.string().optional(),
});

export type YouTubeVideosInsertRequest = z.infer<
  typeof YouTubeVideosInsertRequestSchema
>;
