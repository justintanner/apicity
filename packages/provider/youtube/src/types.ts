import type { z } from "zod";
import type { YouTubeChannelsListRequest } from "./zod";

export class YouTubeError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "YouTubeError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

// -- videos.list -----------------------------------------------------------

export interface YouTubeVideoSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  channelTitle: string;
}

export interface YouTubeVideo {
  kind: string;
  etag: string;
  id: string;
  snippet?: YouTubeVideoSnippet;
}

export interface YouTubeVideosListResponse {
  kind: string;
  etag: string;
  items: YouTubeVideo[];
  pageInfo?: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface YouTubeVideosListRequest {
  part: string;
  id?: string;
  chart?: string;
  maxResults?: number;
  pageToken?: string;
}

export interface YouTubeVideosListMethod {
  (
    req: YouTubeVideosListRequest,
    signal?: AbortSignal
  ): Promise<YouTubeVideosListResponse>;
}

// -- videos.insert ---------------------------------------------------------

export interface YouTubeVideoSnippetInput {
  title: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  defaultLanguage?: string;
}

export interface YouTubeVideoStatusInput {
  embeddable?: boolean;
  license?: "youtube" | "creativeCommon";
  privacyStatus?: "public" | "unlisted" | "private";
  publicStatsViewable?: boolean;
  publishAt?: string;
  selfDeclaredMadeForKids?: boolean;
  containsSyntheticMedia?: boolean;
}

export interface YouTubeRecordingDetailsInput {
  recordingDate?: string;
}

export interface YouTubeLocalizationsInput {
  [key: string]: {
    title: string;
    description?: string;
  };
}

export interface YouTubeVideosInsertRequest {
  snippet?: YouTubeVideoSnippetInput;
  status?: YouTubeVideoStatusInput;
  recordingDetails?: YouTubeRecordingDetailsInput;
  localizations?: YouTubeLocalizationsInput;
  video: Blob;
  notifySubscribers?: boolean;
  onBehalfOfContentOwner?: string;
  onBehalfOfContentOwnerChannel?: string;
}

export interface YouTubeVideoStatusResponse {
  uploadStatus?: string;
  failureReason?: string;
  rejectionReason?: string;
  privacyStatus?: string;
  publishAt?: string;
  license?: string;
  embeddable?: boolean;
  publicStatsViewable?: boolean;
  madeForKids?: boolean;
  selfDeclaredMadeForKids?: boolean;
  containsSyntheticMedia?: boolean;
}

export interface YouTubeVideoResource extends YouTubeVideo {
  status?: YouTubeVideoStatusResponse;
  contentDetails?: unknown;
  recordingDetails?: { recordingDate?: string };
  localizations?: Record<string, { title: string; description?: string }>;
}

export type YouTubeVideosInsertResponse = YouTubeVideoResource;

export interface YouTubeVideosInsertMethod {
  (
    req: YouTubeVideosInsertRequest,
    signal?: AbortSignal
  ): Promise<YouTubeVideosInsertResponse>;
}

export interface YouTubeVideosNamespace {
  list: YouTubeVideosListMethod;
  insert: YouTubeVideosInsertMethod;
}

// -- channels.list ---------------------------------------------------------

export interface YouTubePageInfo {
  totalResults: number;
  resultsPerPage: number;
}

export interface YouTubeChannelSnippet {
  title: string;
  description: string;
  publishedAt: string;
  customUrl?: string;
  thumbnails?: Record<string, { url: string; width?: number; height?: number }>;
}

export interface YouTubeChannel {
  kind: string;
  etag: string;
  id: string;
  snippet?: YouTubeChannelSnippet;
}

export interface YouTubeChannelsListResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  pageInfo: YouTubePageInfo;
  items: YouTubeChannel[];
}

export interface YouTubeChannelsListMethod {
  (
    req: YouTubeChannelsListRequest,
    signal?: AbortSignal
  ): Promise<YouTubeChannelsListResponse>;
  schema: z.ZodType<YouTubeChannelsListRequest>;
}

export interface YouTubeChannelsNamespace {
  list: YouTubeChannelsListMethod;
}

// -- transcripts.get -------------------------------------------------------

export interface YouTubeTranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface YouTubeGetTranscriptResponse {
  segments: YouTubeTranscriptSegment[];
  plainText: string;
}

export interface YouTubeGetTranscriptMethod {
  (
    req: import("./zod").YouTubeGetTranscriptRequest,
    signal?: AbortSignal
  ): Promise<YouTubeGetTranscriptResponse>;
}

export interface YouTubeTranscriptsNamespace {
  get: YouTubeGetTranscriptMethod;
}

// -- videoMetadata (keyless oEmbed) --------------------------------------

export interface YouTubeGetVideoMetadataRequest {
  videoId: string;
}

export interface YouTubeGetVideoMetadataResponse {
  title: string;
  authorName: string;
  authorUrl: string;
  type: string;
  html: string;
  width: number;
  height: number;
  thumbnailUrl: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  providerName: string;
  providerUrl: string;
}

export interface YouTubeGetVideoMetadataMethod {
  (
    req: YouTubeGetVideoMetadataRequest,
    signal?: AbortSignal
  ): Promise<YouTubeGetVideoMetadataResponse>;
}

// -- Provider --------------------------------------------------------------

export interface YouTubeProvider {
  videos: YouTubeVideosNamespace;
  channels: YouTubeChannelsNamespace;
  transcripts: YouTubeTranscriptsNamespace;
  videoMetadata: YouTubeGetVideoMetadataMethod;
}

export type { YouTubeOptions } from "./zod";
