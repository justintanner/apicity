/** HAR 1.2 plus optional Apicity call and entry metadata. */
export interface HarNameValue {
  name: string;
  value: string;
  comment?: string;
}
export interface HarCookie extends HarNameValue {
  [key: string]: unknown;
  path?: string;
  domain?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
}
export interface HarPostData {
  mimeType: string;
  text?: string;
  params?: Array<HarNameValue & { fileName?: string; contentType?: string }>;
  comment?: string;
}
export interface HarContent {
  size: number;
  compression?: number;
  mimeType: string;
  text?: string;
  encoding?: string;
  comment?: string;
}
export interface HarRequest {
  method: string;
  url: string;
  httpVersion: string;
  cookies: HarCookie[];
  headers: HarNameValue[];
  queryString: HarNameValue[];
  postData?: HarPostData;
  headersSize: number;
  bodySize: number;
  comment?: string;
}
export interface HarResponse {
  status: number;
  statusText: string;
  httpVersion: string;
  cookies: HarCookie[];
  headers: HarNameValue[];
  content: HarContent;
  redirectURL: string;
  headersSize: number;
  bodySize: number;
  comment?: string;
}
export interface HarTimings {
  blocked?: number;
  dns?: number;
  connect?: number;
  send: number;
  wait: number;
  receive: number;
  ssl?: number;
  comment?: string;
}
export interface ApicityEntryMetadata {
  kind: "http" | "local";
  role?: "create" | "poll" | "result" | "upload" | "download" | "other";
  pollRepeat?: number;
  streamed?: boolean;
  bodyTruncated?: boolean;
}
export interface ApicityCallMetadata {
  callId: string;
  provider: string;
  endpoint: string;
  input: unknown;
  outcome: "ok" | "provider_error" | "local_error" | "network_error";
  status?: number;
  error?: {
    name: string;
    message: string;
    code?: string | number;
    status?: number;
  };
  context?: Record<string, unknown>;
  apicityVersion: string;
  runtime: string;
  startedAt: string;
  durationMs: number;
}
export interface HarCacheEntry {
  expires?: string;
  lastAccess: string;
  eTag: string;
  hitCount: number;
  comment?: string;
}
export interface HarEntry {
  pageref?: string;
  startedDateTime: string;
  time: number;
  request: HarRequest;
  response: HarResponse;
  cache: {
    beforeRequest?: HarCacheEntry | null;
    afterRequest?: HarCacheEntry | null;
    comment?: string;
  };
  timings: HarTimings;
  serverIPAddress?: string;
  connection?: string;
  comment?: string;
  _apicity?: ApicityEntryMetadata;
  _id?: string;
  _order?: number;
}
export interface HarPage {
  startedDateTime: string;
  id: string;
  title: string;
  pageTimings: { onContentLoad?: number; onLoad?: number; comment?: string };
  comment?: string;
}
export interface HarLog {
  version: "1.2";
  creator: { name: string; version: string; comment?: string };
  browser?: { name: string; version: string; comment?: string };
  pages?: HarPage[];
  entries: HarEntry[];
  comment?: string;
  _apicity?: ApicityCallMetadata;
}
export interface Har {
  log: HarLog;
}
