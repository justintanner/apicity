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

export interface YouTubeProvider {
  videos: YouTubeVideosNamespace;
}

export type { YouTubeOptions } from "./zod";
