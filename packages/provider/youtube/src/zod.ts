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

const blobSchema = z.instanceof(Blob);

export const YouTubeVideoSnippetInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  defaultLanguage: z.string().optional(),
});

export const YouTubeVideoStatusInputSchema = z.object({
  embeddable: z.boolean().optional(),
  license: z.enum(["youtube", "creativeCommon"]).optional(),
  privacyStatus: z.enum(["public", "unlisted", "private"]).optional(),
  publicStatsViewable: z.boolean().optional(),
  publishAt: z.string().optional(),
  selfDeclaredMadeForKids: z.boolean().optional(),
  containsSyntheticMedia: z.boolean().optional(),
});

export const YouTubeRecordingDetailsInputSchema = z.object({
  recordingDate: z.string().optional(),
});

export const YouTubeLocalizationsInputSchema = z.record(
  z.object({
    title: z.string(),
    description: z.string().optional(),
  })
);

export const YouTubeVideosInsertRequestSchema = z.object({
  snippet: YouTubeVideoSnippetInputSchema.optional(),
  status: YouTubeVideoStatusInputSchema.optional(),
  recordingDetails: YouTubeRecordingDetailsInputSchema.optional(),
  localizations: YouTubeLocalizationsInputSchema.optional(),
  video: blobSchema,
  notifySubscribers: z.boolean().optional(),
  onBehalfOfContentOwner: z.string().optional(),
  onBehalfOfContentOwnerChannel: z.string().optional(),
});

export type YouTubeVideosInsertRequest = z.infer<
  typeof YouTubeVideosInsertRequestSchema
>;
