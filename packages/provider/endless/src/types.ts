import type { z } from "zod";
import type {
  EndlessTikTokTrendsPublicRequestSchema,
  EndlessTikTokTrendsRegionSchema,
} from "./zod";

/**
 * `status` is the HTTP status, or 408 on timeout, 499 when the caller aborts
 * and 500 when no response arrived. `code` is Endless's specific reason
 * (`data.code`, e.g. `invalid_path_parameter`) when the body carries one.
 */
export class EndlessError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
    public readonly code?: string
  ) {
    super(message);
    this.name = "EndlessError";
  }
}

export interface EndlessOptions {
  baseURL?: string;
  timeout?: number;
  fetch?: typeof fetch;
  /**
   * Sent as the `Endless-Api-Version` header. Defaults to `"1"`, the API
   * major these response types describe.
   */
  apiVersion?: string;
}

export type EndlessTikTokTrendsRegion = z.infer<
  typeof EndlessTikTokTrendsRegionSchema
>;
export type EndlessTikTokTrendsPublicRequest = z.infer<
  typeof EndlessTikTokTrendsPublicRequestSchema
>;

export interface EndlessTikTokMusic {
  id?: string;
  title?: string;
  author?: string;
  original?: boolean;
  [key: string]: unknown;
}

export interface EndlessTikTokAuthor {
  id?: string;
  username?: string;
  nickname?: string;
  verified?: boolean;
  [key: string]: unknown;
}

/**
 * Endless's OpenAPI document marks every video field optional, and live
 * responses do omit `text`, `hashtags`, `cover_url` and the music fields.
 */
export interface EndlessTikTokVideo {
  id?: string;
  url?: string;
  text?: string;
  category?: string | null;
  /** ISO country code, e.g. `TH`. */
  region?: string;
  created_at?: string;
  duration_seconds?: number;
  play_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  save_count?: number;
  hashtags?: string[];
  music?: EndlessTikTokMusic;
  author?: EndlessTikTokAuthor;
  cover_url?: string;
  [key: string]: unknown;
}

export interface EndlessTikTokLongestVideo {
  video: EndlessTikTokVideo;
  /** How many snapshots in the window carried the video. */
  snapshots: number;
  [key: string]: unknown;
}

export interface EndlessTikTokSound {
  id: string;
  title?: string;
  author?: string;
  video_count?: number;
  creators: number;
  original: boolean;
  [key: string]: unknown;
}

export interface EndlessTikTokHashtag {
  name: string;
  video_count?: number;
  view_count?: number;
  creators: number;
  [key: string]: unknown;
}

/**
 * The country's most played trending videos of the last 24 hours, read from
 * snapshots Endless takes every few hours. Every response read on 2026-10-28
 * listed `videos` most played first and `longest` by `snapshots`.
 */
export interface EndlessTikTokTrendsPublicResponse {
  region: string;
  captured_at: string | null;
  videos: EndlessTikTokVideo[];
  longest: EndlessTikTokLongestVideo[];
  sounds: EndlessTikTokSound[];
  hashtags: EndlessTikTokHashtag[];
  [key: string]: unknown;
}

export interface EndlessTikTokTrendsPublicMethod {
  (
    request: EndlessTikTokTrendsPublicRequest,
    signal?: AbortSignal
  ): Promise<EndlessTikTokTrendsPublicResponse>;
  schema: typeof EndlessTikTokTrendsPublicRequestSchema;
}
export interface EndlessTikTokTrendsNamespace {
  public: EndlessTikTokTrendsPublicMethod;
}
export interface EndlessSocialNamespace {
  tiktokTrends: EndlessTikTokTrendsNamespace;
}
export interface EndlessProvider {
  social: EndlessSocialNamespace;
}
