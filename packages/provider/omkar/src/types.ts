import type { z } from "zod";
import type { OmkarFeedTrendingRequestSchema } from "./zod";

/**
 * `status` is the HTTP status, or 408 on timeout, 499 when the caller aborts
 * and 500 when no response arrived. `code` is Omkar's stable error code, such
 * as `missing_api_key`, `invalid_api_key`, `quota_exceeded` or
 * `rate_limited`; Omkar asks callers to branch on it, not on the message.
 */
export class OmkarError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
    public readonly code?: string
  ) {
    super(message);
    this.name = "OmkarError";
  }
}

export interface OmkarOptions {
  /** Sent as the `API-Key` header; defaults to `OMKAR_API_KEY`. */
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  fetch?: typeof fetch;
}

export type OmkarFeedTrendingRequest = z.infer<
  typeof OmkarFeedTrendingRequestSchema
>;

export interface OmkarVideoStats {
  play_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  save_count: number;
  repost_count: number;
  [key: string]: unknown;
}

export interface OmkarAuthor {
  id: string;
  sec_uid: string;
  username: string;
  nickname: string;
  link: string;
  profile_picture: string;
  is_verified: boolean;
  is_private: boolean;
  biography: string | null;
  [key: string]: unknown;
}

export interface OmkarAuthorStats {
  follower_count: number;
  following_count: number;
  like_count: number;
  video_count: number;
  friend_count: number;
  liked_video_count: number;
  [key: string]: unknown;
}

export interface OmkarMusicStreamingLink {
  /** Such as `apple_music` or `spotify`. */
  platform: string;
  song_id: string;
  link: string;
  [key: string]: unknown;
}

export interface OmkarMusic {
  id: string;
  title: string;
  link: string;
  author_name: string;
  album: string | null;
  duration_seconds: number;
  /** A signed TikTok CDN audio link that expires. */
  play_link: string;
  cover: string;
  is_original_sound: boolean;
  is_copyrighted: boolean;
  is_commercial_use_allowed: boolean;
  is_unlimited_music: boolean;
  is_private: boolean;
  streaming_links: OmkarMusicStreamingLink[];
  [key: string]: unknown;
}

export interface OmkarVideoQuality {
  /** Such as `1080p`, `720p` or `540p`. */
  quality: string;
  /** Such as `h264` or `h265_hvc1`. */
  codec: string;
  format: string;
  bitrate: number;
  fps: number;
  width: number;
  height: number;
  size_bytes: number;
  play_link: string;
  play_links: string[];
  [key: string]: unknown;
}

export interface OmkarSubtitle {
  language: string;
  /** Such as `asr` (speech recognition), `mt` (machine translation) or `lc`. */
  source: string;
  format: string;
  is_auto_generated: boolean;
  is_translation: boolean;
  size_bytes: number;
  link: string;
  /** ISO 8601 time after which `link` stops working. */
  expires_at: string;
  [key: string]: unknown;
}

export interface OmkarVideoMedia {
  duration_seconds: number;
  width: number;
  height: number;
  quality: string;
  format: string;
  codec: string;
  bitrate: number;
  size_bytes: number;
  cover: string;
  origin_cover: string;
  animated_cover: string;
  play_link: string;
  /** A signed TikTok CDN MP4 link that expires. */
  download_link: string | null;
  qualities: OmkarVideoQuality[];
  subtitles: OmkarSubtitle[];
  [key: string]: unknown;
}

/** One image of a photo post. */
export interface OmkarImage {
  width: number;
  height: number;
  link: string;
  links: string[];
  [key: string]: unknown;
}

export interface OmkarHashtag {
  id: string;
  name: string;
  link: string;
  [key: string]: unknown;
}

export interface OmkarMention {
  id: string;
  username: string;
  sec_uid: string;
  link: string;
  [key: string]: unknown;
}

export interface OmkarEffect {
  id: string;
  name: string;
  link: string;
  [key: string]: unknown;
}

/** A link card on the video, such as a CapCut template. */
export interface OmkarAnchor {
  id: string;
  type: number;
  title: string;
  description: string;
  icon: string;
  link: string;
  [key: string]: unknown;
}

/** A tagged place. Few posts carry one, so its fields are nullable. */
export interface OmkarLocation {
  id: string;
  name: string;
  link: string;
  address: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  category: string | null;
  category_path: string[];
  parent: { id: string | null; name: string | null } | null;
  [key: string]: unknown;
}

export interface OmkarVideo {
  id: string;
  /** `https://www.tiktok.com/@<username>/video/<id>`. */
  link: string;
  /** `video`, or `photo` for a photo post, which has `images` and no `video`. */
  type: string;
  description: string | null;
  title: string | null;
  language: string;
  /** ISO 8601 UTC time the post was published. */
  created_at: string;
  location_created: string | null;
  is_ad: boolean;
  is_pinned: boolean;
  is_private: boolean;
  is_ai_generated: boolean | null;
  is_original: boolean;
  is_official: boolean;
  is_duet_enabled: boolean | null;
  is_stitch_enabled: boolean | null;
  is_share_enabled: boolean;
  playlist_id: string | null;
  stats: OmkarVideoStats;
  author: OmkarAuthor;
  author_stats: OmkarAuthorStats;
  music: OmkarMusic;
  video: OmkarVideoMedia | null;
  images: OmkarImage[];
  cover: string;
  location: OmkarLocation | null;
  hashtags: OmkarHashtag[];
  mentions: OmkarMention[];
  effects: OmkarEffect[];
  anchors: OmkarAnchor[];
  suggested_searches: string[];
  text_stickers: string[];
  [key: string]: unknown;
}

/** Up to 30 videos; every call returns a fresh batch. */
export interface OmkarFeedTrendingResponse {
  country: string;
  video_count: number;
  videos: OmkarVideo[];
  [key: string]: unknown;
}

export interface OmkarFeedTrendingMethod {
  (
    request?: OmkarFeedTrendingRequest,
    signal?: AbortSignal
  ): Promise<OmkarFeedTrendingResponse>;
  schema: typeof OmkarFeedTrendingRequestSchema;
}
export interface OmkarFeedNamespace {
  trending: OmkarFeedTrendingMethod;
}
export interface OmkarProvider {
  feed: OmkarFeedNamespace;
}
