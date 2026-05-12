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
