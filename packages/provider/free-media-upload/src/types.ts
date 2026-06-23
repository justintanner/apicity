// ---------------------------------------------------------------------------
// @apicity/free-media-upload – free file hosting providers
// ---------------------------------------------------------------------------

import type { z } from "zod";

// -- Request types — derived from Zod schemas (source of truth in zod.ts) ---

export type {
  FreeMediaUploadOptions,
  TmpfilesUploadRequest,
  TmpfilesUploadParsedRequest,
  UguuUploadRequest,
  UguuUploadParsedRequest,
  CatboxUploadRequest,
  CatboxUploadParsedRequest,
  LitterboxUploadRequest,
  LitterboxUploadParsedRequest,
  GofileUploadRequest,
  GofileUploadParsedRequest,
  FilebinUploadRequest,
  FilebinUploadParsedRequest,
  TempshUploadRequest,
  TempshUploadParsedRequest,
  TflinkUploadRequest,
  TflinkUploadParsedRequest,
} from "./zod";

// -- Response types (hand-written) ------------------------------------------

// -- Tmpfiles.org types -----------------------------------------------------

export interface TmpfilesUploadData {
  url: string;
}

export interface TmpfilesUploadResponse {
  status: string;
  data: TmpfilesUploadData;
}

// -- Uguu.se types ----------------------------------------------------------

export interface UguuFileEntry {
  hash: string;
  filename: string;
  url: string;
  size: number;
  dupe: boolean;
}

export interface UguuUploadResponse {
  success: boolean;
  files: UguuFileEntry[];
}

// -- Gofile types -----------------------------------------------------------

export interface GofileUploadData {
  id: string;
  name: string;
  parentFolder: string;
  parentFolderCode: string;
  downloadPage: string;
  md5: string;
  mimetype: string;
  size: number;
  type: string;
  servers: string[];
  createTime: number;
  modTime: number;
  guestToken: string;
}

export interface GofileUploadResponse {
  status: string;
  data: GofileUploadData;
}

// -- Filebin types ----------------------------------------------------------

export interface FilebinBin {
  id: string;
  readonly: boolean;
  bytes: number;
  bytes_readable: string;
  files: number;
  updated_at: string;
  created_at: string;
  expired_at: string;
}

export interface FilebinFile {
  filename: string;
  "content-type": string;
  bytes: number;
  bytes_readable: string;
  md5: string;
  sha256: string;
  updated_at: string;
  created_at: string;
}

export interface FilebinUploadResponse {
  bin: FilebinBin;
  file: FilebinFile;
}

// -- tfLink types -----------------------------------------------------------

export interface TflinkUploadResponse {
  fileName: string;
  downloadLink: string;
  downloadLinkEncoded: string;
  size: number;
  type: string;
  uploadedTo: string;
}

// -- Error ------------------------------------------------------------------

export class FreeMediaUploadError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "FreeMediaUploadError";
    this.status = status;
    this.body = body ?? null;
  }
}

// -- Method interfaces ------------------------------------------------------

import type {
  TmpfilesUploadRequest,
  UguuUploadRequest,
  CatboxUploadRequest,
  LitterboxUploadRequest,
  GofileUploadRequest,
  FilebinUploadRequest,
  TempshUploadRequest,
  TflinkUploadRequest,
} from "./zod";

export interface TmpfilesUploadMethod {
  (
    req: TmpfilesUploadRequest,
    signal?: AbortSignal
  ): Promise<TmpfilesUploadResponse>;
  schema: z.ZodType<TmpfilesUploadRequest>;
}

export interface UguuUploadMethod {
  (req: UguuUploadRequest, signal?: AbortSignal): Promise<UguuUploadResponse>;
  schema: z.ZodType<UguuUploadRequest>;
}

export interface CatboxUploadMethod {
  (req: CatboxUploadRequest, signal?: AbortSignal): Promise<string>;
  schema: z.ZodType<CatboxUploadRequest>;
}

export interface LitterboxUploadMethod {
  (req: LitterboxUploadRequest, signal?: AbortSignal): Promise<string>;
  schema: z.ZodType<LitterboxUploadRequest>;
}

export interface GofileUploadMethod {
  (
    req: GofileUploadRequest,
    signal?: AbortSignal
  ): Promise<GofileUploadResponse>;
  schema: z.ZodType<GofileUploadRequest>;
}

export interface FilebinUploadMethod {
  (
    req: FilebinUploadRequest,
    signal?: AbortSignal
  ): Promise<FilebinUploadResponse>;
  schema: z.ZodType<FilebinUploadRequest>;
}

export interface TempshUploadMethod {
  (req: TempshUploadRequest, signal?: AbortSignal): Promise<string>;
  schema: z.ZodType<TempshUploadRequest>;
}

export interface TflinkUploadMethod {
  (
    req: TflinkUploadRequest,
    signal?: AbortSignal
  ): Promise<TflinkUploadResponse>;
  schema: z.ZodType<TflinkUploadRequest>;
}

// -- Namespace interfaces ---------------------------------------------------

export interface TmpfilesApiV1Namespace {
  upload: TmpfilesUploadMethod;
}

export interface TmpfilesApiNamespace {
  v1: TmpfilesApiV1Namespace;
}

export interface TmpfilesNamespace {
  api: TmpfilesApiNamespace;
}

export interface UguuNamespace {
  upload: UguuUploadMethod;
}

export interface CatboxNamespace {
  upload: CatboxUploadMethod;
}

export interface LitterboxNamespace {
  upload: LitterboxUploadMethod;
}

export interface GofileNamespace {
  upload: GofileUploadMethod;
}

export interface FilebinNamespace {
  upload: FilebinUploadMethod;
}

export interface TempshNamespace {
  upload: TempshUploadMethod;
}

export interface TflinkNamespace {
  upload: TflinkUploadMethod;
}

export interface FreeMediaUploadProvider {
  tmpfiles: TmpfilesNamespace;
  uguu: UguuNamespace;
  catbox: CatboxNamespace;
  litterbox: LitterboxNamespace;
  gofile: GofileNamespace;
  filebin: FilebinNamespace;
  tempsh: TempshNamespace;
  tflink: TflinkNamespace;
}
