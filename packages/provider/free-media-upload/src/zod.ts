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

export type TmpfilesUploadRequest = z.input<typeof TmpfilesUploadRequestSchema>;
export type TmpfilesUploadRequestInput = TmpfilesUploadRequest;
export type TmpfilesUploadParsedRequest = z.output<
  typeof TmpfilesUploadRequestSchema
>;
export type UguuUploadRequest = z.input<typeof UguuUploadRequestSchema>;
export type UguuUploadRequestInput = UguuUploadRequest;
export type UguuUploadParsedRequest = z.output<typeof UguuUploadRequestSchema>;
export type CatboxUploadRequest = z.input<typeof CatboxUploadRequestSchema>;
export type CatboxUploadRequestInput = CatboxUploadRequest;
export type CatboxUploadParsedRequest = z.output<
  typeof CatboxUploadRequestSchema
>;
export type LitterboxUploadRequest = z.input<
  typeof LitterboxUploadRequestSchema
>;
export type LitterboxUploadRequestInput = LitterboxUploadRequest;
export type LitterboxUploadParsedRequest = z.output<
  typeof LitterboxUploadRequestSchema
>;
export type GofileUploadRequest = z.input<typeof GofileUploadRequestSchema>;
export type GofileUploadRequestInput = GofileUploadRequest;
export type GofileUploadParsedRequest = z.output<
  typeof GofileUploadRequestSchema
>;
export type FilebinUploadRequest = z.input<typeof FilebinUploadRequestSchema>;
export type FilebinUploadRequestInput = FilebinUploadRequest;
export type FilebinUploadParsedRequest = z.output<
  typeof FilebinUploadRequestSchema
>;
export type TempshUploadRequest = z.input<typeof TempshUploadRequestSchema>;
export type TempshUploadRequestInput = TempshUploadRequest;
export type TempshUploadParsedRequest = z.output<
  typeof TempshUploadRequestSchema
>;
export type TflinkUploadRequest = z.input<typeof TflinkUploadRequestSchema>;
export type TflinkUploadRequestInput = TflinkUploadRequest;
export type TflinkUploadParsedRequest = z.output<
  typeof TflinkUploadRequestSchema
>;
export type FreeMediaUploadOptions = z.infer<typeof FreeOptionsSchema>;
