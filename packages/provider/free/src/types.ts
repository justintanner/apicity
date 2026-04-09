// ---------------------------------------------------------------------------
// @nakedapi/free – free file hosting providers
// ---------------------------------------------------------------------------

// -- Options ----------------------------------------------------------------

export interface FreeOptions {
  timeout?: number;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

// -- Tmpfiles.org types -----------------------------------------------------

export interface TmpfilesUploadRequest {
  file: Blob;
  filename?: string;
}

export interface TmpfilesUploadData {
  url: string;
}

export interface TmpfilesUploadResponse {
  status: string;
  data: TmpfilesUploadData;
}

// -- Uguu.se types ----------------------------------------------------------

export interface UguuUploadRequest {
  file: Blob;
  filename?: string;
}

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

// -- Catbox types -----------------------------------------------------------

export interface CatboxUploadRequest {
  file: Blob;
  filename?: string;
}

// -- Litterbox types --------------------------------------------------------

export interface LitterboxUploadRequest {
  file: Blob;
  filename?: string;
  time?: "1h" | "12h" | "24h" | "72h";
}

// -- Gofile types -----------------------------------------------------------

export interface GofileUploadRequest {
  file: Blob;
  filename?: string;
}

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

export interface FilebinUploadRequest {
  file: Blob;
  filename?: string;
  bin?: string;
}

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

// -- Temp.sh types ----------------------------------------------------------

export interface TempshUploadRequest {
  file: Blob;
  filename?: string;
}

// -- tfLink types -----------------------------------------------------------

export interface TflinkUploadRequest {
  file: Blob;
  filename?: string;
}

export interface TflinkUploadResponse {
  fileName: string;
  downloadLink: string;
  downloadLinkEncoded: string;
  size: number;
  type: string;
  uploadedTo: string;
}

// -- Error ------------------------------------------------------------------

export class FreeError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "FreeError";
    this.status = status;
    this.body = body ?? null;
  }
}

// -- Payload validation types -----------------------------------------------

export interface PayloadFieldSchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  required?: boolean;
  description?: string;
  enum?: readonly (string | number | boolean)[];
  items?: PayloadFieldSchema;
  properties?: Record<string, PayloadFieldSchema>;
}

export interface PayloadSchema {
  method: "POST" | "DELETE";
  path: string;
  contentType: "application/json" | "multipart/form-data";
  fields: Record<string, PayloadFieldSchema>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// -- Method interfaces ------------------------------------------------------

export interface TmpfilesUploadMethod {
  (
    req: TmpfilesUploadRequest,
    signal?: AbortSignal
  ): Promise<TmpfilesUploadResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

export interface UguuUploadMethod {
  (req: UguuUploadRequest, signal?: AbortSignal): Promise<UguuUploadResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

export interface CatboxUploadMethod {
  (req: CatboxUploadRequest, signal?: AbortSignal): Promise<string>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

export interface LitterboxUploadMethod {
  (req: LitterboxUploadRequest, signal?: AbortSignal): Promise<string>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

export interface GofileUploadMethod {
  (
    req: GofileUploadRequest,
    signal?: AbortSignal
  ): Promise<GofileUploadResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

export interface FilebinUploadMethod {
  (
    req: FilebinUploadRequest,
    signal?: AbortSignal
  ): Promise<FilebinUploadResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

export interface TempshUploadMethod {
  (req: TempshUploadRequest, signal?: AbortSignal): Promise<string>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
}

export interface TflinkUploadMethod {
  (
    req: TflinkUploadRequest,
    signal?: AbortSignal
  ): Promise<TflinkUploadResponse>;
  payloadSchema: PayloadSchema;
  validatePayload(data: unknown): ValidationResult;
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

export interface FreeProvider {
  tmpfiles: TmpfilesNamespace;
  uguu: UguuNamespace;
  catbox: CatboxNamespace;
  litterbox: LitterboxNamespace;
  gofile: GofileNamespace;
  filebin: FilebinNamespace;
  tempsh: TempshNamespace;
  tflink: TflinkNamespace;
}
