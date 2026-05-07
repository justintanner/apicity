import { z } from "zod";

const blobSchema = z.instanceof(Blob);

// ---------------------------------------------------------------------------
// Tmpfiles.org
// ---------------------------------------------------------------------------

export const TmpfilesUploadRequestSchema = z.object({
  file: blobSchema,
  filename: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Uguu.se
// ---------------------------------------------------------------------------

export const UguuUploadRequestSchema = z.object({
  file: blobSchema,
  filename: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Catbox.moe
// ---------------------------------------------------------------------------

export const CatboxUploadRequestSchema = z.object({
  file: blobSchema,
  filename: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Litterbox (catbox.moe)
// ---------------------------------------------------------------------------

export const LitterboxUploadRequestSchema = z.object({
  file: blobSchema,
  filename: z.string().optional(),
  time: z.enum(["1h", "12h", "24h", "72h"]).optional(),
});

// ---------------------------------------------------------------------------
// Gofile.io
// ---------------------------------------------------------------------------

export const GofileUploadRequestSchema = z.object({
  file: blobSchema,
  filename: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Filebin.net
// ---------------------------------------------------------------------------

export const FilebinUploadRequestSchema = z.object({
  file: blobSchema,
  filename: z.string().optional(),
  bin: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Temp.sh
// ---------------------------------------------------------------------------

export const TempshUploadRequestSchema = z.object({
  file: blobSchema,
  filename: z.string().optional(),
});

// ---------------------------------------------------------------------------
// tmpfile.link (tfLink)
// ---------------------------------------------------------------------------

export const TflinkUploadRequestSchema = z.object({
  file: blobSchema,
  filename: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export const FreeOptionsSchema = z.object({
  timeout: z.number().int().positive().optional(),
  fetch: z
    .custom<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >()
    .optional(),
});

// ---------------------------------------------------------------------------
// Inferred types (source of truth — replaces hand-written interfaces)
// ---------------------------------------------------------------------------

export type TmpfilesUploadRequest = z.infer<typeof TmpfilesUploadRequestSchema>;
export type UguuUploadRequest = z.infer<typeof UguuUploadRequestSchema>;
export type CatboxUploadRequest = z.infer<typeof CatboxUploadRequestSchema>;
export type LitterboxUploadRequest = z.infer<
  typeof LitterboxUploadRequestSchema
>;
export type GofileUploadRequest = z.infer<typeof GofileUploadRequestSchema>;
export type FilebinUploadRequest = z.infer<typeof FilebinUploadRequestSchema>;
export type TempshUploadRequest = z.infer<typeof TempshUploadRequestSchema>;
export type TflinkUploadRequest = z.infer<typeof TflinkUploadRequestSchema>;
export type FreeMediaUploadOptions = z.infer<typeof FreeOptionsSchema>;
