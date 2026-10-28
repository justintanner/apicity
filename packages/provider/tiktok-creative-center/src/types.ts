import type { z } from "zod";
import type {
  TiktokCreativeCenterGetTopContentsListRequestSchema,
  TiktokCreativeCenterOrderByMetricSchema,
  TiktokCreativeCenterPeriodDimensionSchema,
} from "./zod";

/**
 * `status` is the HTTP status, or 408 on timeout, 499 when the caller aborts
 * and 500 when no response arrived. Creative Center also fails with HTTP 200
 * and a nonzero `BaseResp.StatusCode`, which `statusCode` carries.
 */
export class TiktokCreativeCenterError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "TiktokCreativeCenterError";
  }
}

export interface TiktokCreativeCenterOptions {
  baseURL?: string;
  timeout?: number;
  fetch?: typeof fetch;
  /** Sent as `User-Agent`; defaults to a desktop Chrome string. */
  userAgent?: string;
}

export type TiktokCreativeCenterPeriodDimension = z.infer<
  typeof TiktokCreativeCenterPeriodDimensionSchema
>;
export type TiktokCreativeCenterOrderByMetric = z.infer<
  typeof TiktokCreativeCenterOrderByMetricSchema
>;
export type TiktokCreativeCenterGetTopContentsListRequest = z.infer<
  typeof TiktokCreativeCenterGetTopContentsListRequestSchema
>;

/** `StatusCode` 0 is success; anything else rejects the call. */
export interface TiktokCreativeCenterBaseResp {
  StatusCode: number;
  StatusMessage: string;
  [key: string]: unknown;
}

export interface TiktokCreativeCenterCover {
  format?: string;
  imageUrl?: string;
  [key: string]: unknown;
}

// Creative Center publishes no schema for these endpoints, so every field
// below except the ids the client rewrites is optional.
export interface TiktokCreativeCenterItemInfo {
  /**
   * A string: TikTok sends the id as a JSON number above 2^53, and the client
   * quotes it before parsing so no digit is lost. The video page is
   * `https://www.tiktok.com/@<handlerName>/video/<itemID>`.
   */
  itemID: string;
  title?: string;
  /** Unix seconds. */
  createTime?: number;
  coverURL?: string;
  coverURLList?: TiktokCreativeCenterCover[];
  /** A signed TikTok CDN MP4 link that expires. */
  videoURL?: string;
  /** A string, for the same reason as `itemID`. */
  authorID?: string;
  /** A string, for the same reason as `itemID`. */
  creatorID?: string;
  contentType?: number;
  [key: string]: unknown;
}

export interface TiktokCreativeCenterItemMetrics {
  videoViews?: number;
  videoViewsLifeTime?: number;
  organicVideoViews?: number;
  organicVideoViewsLifeTime?: number;
  engagementRate?: number;
  engagementRateLifeTime?: number;
  sixSecondsVTR?: number;
  sixSecondsVTRLifeTime?: number;
  [key: string]: unknown;
}

export interface TiktokCreativeCenterAuthorInfo {
  handlerName?: string;
  nickName?: string;
  avatarURI?: string;
  bio?: string;
  [key: string]: unknown;
}

export interface TiktokCreativeCenterAuthorMetrics {
  followers?: number;
  [key: string]: unknown;
}

export interface TiktokCreativeCenterEntity {
  itemInfo: TiktokCreativeCenterItemInfo;
  itemMetrics?: TiktokCreativeCenterItemMetrics;
  itemAuthorInfo?: TiktokCreativeCenterAuthorInfo;
  itemAuthorMetrics?: TiktokCreativeCenterAuthorMetrics;
  [key: string]: unknown;
}

/** Without a TikTok One session, `page` is 1 and `limit` 4 whatever was asked. */
export interface TiktokCreativeCenterPagination {
  limit: number;
  page: number;
  pageCount: number;
  totalCount: number;
  hasMore: boolean;
  [key: string]: unknown;
}

/**
 * A country or period without a list answers `StatusCode` 0 with neither
 * `entityInfos` nor `pagination`.
 */
export interface TiktokCreativeCenterGetTopContentsListResponse {
  BaseResp: TiktokCreativeCenterBaseResp;
  entityInfos?: TiktokCreativeCenterEntity[];
  pagination?: TiktokCreativeCenterPagination;
  [key: string]: unknown;
}

export interface TiktokCreativeCenterGetTopContentsListMethod {
  (
    request: TiktokCreativeCenterGetTopContentsListRequest,
    signal?: AbortSignal
  ): Promise<TiktokCreativeCenterGetTopContentsListResponse>;
  schema: typeof TiktokCreativeCenterGetTopContentsListRequestSchema;
}
export interface TiktokCreativeCenterReportNamespace {
  creativeCenterGetTopContentsList: TiktokCreativeCenterGetTopContentsListMethod;
}
export interface TiktokCreativeCenterCreativeOneNamespace {
  report: TiktokCreativeCenterReportNamespace;
}
export interface TiktokCreativeCenterAdsNamespace {
  creativeOne: TiktokCreativeCenterCreativeOneNamespace;
}
export interface TiktokCreativeCenterProvider {
  ads: TiktokCreativeCenterAdsNamespace;
}
