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

export interface YouTubeVideosNamespace {
  list: YouTubeVideosListMethod;
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

// -- Provider --------------------------------------------------------------

export interface YouTubeProvider {
  videos: YouTubeVideosNamespace;
  channels: YouTubeChannelsNamespace;
}

export type { YouTubeOptions } from "./zod";
