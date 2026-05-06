import {
  PolymarketOptions,
  PolymarketGammaEvent,
  PolymarketGammaMarket,
  PolymarketGammaTag,
  PolymarketGammaEventListResponse,
  PolymarketGammaEventListQuery,
  PolymarketGammaEventKeysetResponse,
  PolymarketGammaKeysetQuery,
  PolymarketGammaMarketListResponse,
  PolymarketGammaMarketListQuery,
  PolymarketGammaMarketKeysetResponse,
  PolymarketGammaMarketKeysetQuery,
  PolymarketGammaSeries,
  PolymarketGammaRelatedTag,
  PolymarketGammaComment,
  PolymarketGammaCommentListQuery,
  PolymarketGammaCommentByUserQuery,
  PolymarketGammaSearchQuery,
  PolymarketGammaSearchResponse,
  PolymarketGammaGetNamespace,
} from "./types";
import { createRequestHelpers } from "./_helpers";

export interface PolymarketGammaSubProvider {
  get: { gamma: PolymarketGammaGetNamespace };
}

// Internal sub-factory for the Gamma host. Owns its own `baseURL` const so
// the endpoint-walker can resolve `https://gamma-api.polymarket.com/...` URLs
// per-factory rather than needing multi-base support.
export function createGammaProvider(
  opts: PolymarketOptions
): PolymarketGammaSubProvider {
  const baseURL = opts.gammaBaseURL ?? "https://gamma-api.polymarket.com";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;
  const { makeGetRequest } = createRequestHelpers(doFetch, timeout);

  function buildEventsQuery(
    params: PolymarketGammaEventListQuery | PolymarketGammaKeysetQuery
  ): string {
    const usp = new URLSearchParams();
    const append = (k: string, v: unknown): void => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        for (const item of v) usp.append(k, String(item));
      } else {
        usp.set(k, String(v));
      }
    };
    append("limit", params.limit);
    append("offset", params.offset);
    append("order", params.order);
    append("ascending", params.ascending);
    append("id", params.id);
    append("slug", params.slug);
    append("archived", params.archived);
    append("active", params.active);
    append("closed", params.closed);
    append("liquidity_min", params.liquidity_min);
    append("liquidity_max", params.liquidity_max);
    append("volume_min", params.volume_min);
    append("volume_max", params.volume_max);
    append("start_date_min", params.start_date_min);
    append("start_date_max", params.start_date_max);
    append("end_date_min", params.end_date_min);
    append("end_date_max", params.end_date_max);
    append("tag", params.tag);
    append("tag_id", params.tag_id);
    append("related_tags", params.related_tags);
    append("tag_slug", params.tag_slug);
    append("featured", params.featured);
    append("restricted", params.restricted);
    append("cyom", params.cyom);
    append("recurrence", params.recurrence);
    if ("next_cursor" in params && params.next_cursor !== undefined) {
      usp.set("next_cursor", params.next_cursor);
    }
    const s = usp.toString();
    return s.length > 0 ? `?${s}` : "";
  }

  // sig-ok: intentional
  // GET https://gamma-api.polymarket.com/events/{paramsOrIdOrSignal}
  // Docs: https://docs.polymarket.com/api-reference/gamma/get-events
  async function gammaEvents(
    paramsOrIdOrSignal?: PolymarketGammaEventListQuery | string | AbortSignal,
    signal?: AbortSignal
  ): Promise<PolymarketGammaEvent | PolymarketGammaEventListResponse> {
    if (typeof paramsOrIdOrSignal === "string") {
      return makeGetRequest<PolymarketGammaEvent>(
        `${baseURL}/events/${encodeURIComponent(paramsOrIdOrSignal)}`,
        signal
      );
    }
    const isQuery =
      paramsOrIdOrSignal !== undefined &&
      paramsOrIdOrSignal !== null &&
      typeof paramsOrIdOrSignal === "object" &&
      !(paramsOrIdOrSignal instanceof AbortSignal);
    const params = isQuery
      ? (paramsOrIdOrSignal as PolymarketGammaEventListQuery)
      : undefined;
    const effectiveSignal = isQuery
      ? signal
      : (paramsOrIdOrSignal as AbortSignal | undefined);
    const query = params ? buildEventsQuery(params) : "";
    return makeGetRequest<PolymarketGammaEventListResponse>(
      `${baseURL}/events${query}`,
      effectiveSignal
    );
  }

  // sig-ok: intentional
  // GET https://gamma-api.polymarket.com/events/keyset{query}
  // Docs: https://docs.polymarket.com/api-reference/gamma/get-events-keyset
  async function gammaEventsKeyset(
    params?: PolymarketGammaKeysetQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaEventKeysetResponse> {
    const query = params ? buildEventsQuery(params) : "";
    return makeGetRequest<PolymarketGammaEventKeysetResponse>(
      `${baseURL}/events/keyset${query}`,
      signal
    );
  }

  // sig-ok: intentional
  // GET https://gamma-api.polymarket.com/events/slug/{slug}
  // Docs: https://docs.polymarket.com/api-reference/gamma/get-event-by-slug
  async function gammaEventsBySlug(
    slug: string,
    signal?: AbortSignal
  ): Promise<PolymarketGammaEvent> {
    return makeGetRequest<PolymarketGammaEvent>(
      `${baseURL}/events/slug/${encodeURIComponent(slug)}`,
      signal
    );
  }

  // sig-ok: intentional
  // GET https://gamma-api.polymarket.com/events/{id}/tags
  // Docs: https://docs.polymarket.com/api-reference/gamma/get-event-tags
  async function gammaEventsTags(
    id: string,
    signal?: AbortSignal
  ): Promise<PolymarketGammaTag[]> {
    return makeGetRequest<PolymarketGammaTag[]>(
      `${baseURL}/events/${encodeURIComponent(id)}/tags`,
      signal
    );
  }

  const events = Object.assign(gammaEvents, {
    keyset: gammaEventsKeyset,
    slug: gammaEventsBySlug,
    tags: gammaEventsTags,
  }) as PolymarketGammaGetNamespace["events"];

  function buildMarketsQuery(
    params: PolymarketGammaMarketListQuery | PolymarketGammaMarketKeysetQuery
  ): string {
    const usp = new URLSearchParams();
    const append = (k: string, v: unknown): void => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        for (const item of v) usp.append(k, String(item));
      } else {
        usp.set(k, String(v));
      }
    };
    append("limit", params.limit);
    append("offset", params.offset);
    append("order", params.order);
    append("ascending", params.ascending);
    append("id", params.id);
    append("slug", params.slug);
    append("archived", params.archived);
    append("active", params.active);
    append("closed", params.closed);
    append("liquidity_min", params.liquidity_min);
    append("liquidity_max", params.liquidity_max);
    append("volume_min", params.volume_min);
    append("volume_max", params.volume_max);
    append("start_date_min", params.start_date_min);
    append("start_date_max", params.start_date_max);
    append("end_date_min", params.end_date_min);
    append("end_date_max", params.end_date_max);
    append("tag", params.tag);
    append("tag_id", params.tag_id);
    append("related_tags", params.related_tags);
    append("tag_slug", params.tag_slug);
    append("featured", params.featured);
    append("restricted", params.restricted);
    append("cyom", params.cyom);
    append("recurrence", params.recurrence);
    append("clob_token_ids", params.clob_token_ids);
    if ("next_cursor" in params && params.next_cursor !== undefined) {
      usp.set("next_cursor", params.next_cursor);
    }
    const s = usp.toString();
    return s.length > 0 ? `?${s}` : "";
  }

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/markets/{paramsOrIdOrSignal}
  // Docs: https://docs.polymarket.com/api-reference/gamma/get-markets
  async function gammaMarkets(
    paramsOrIdOrSignal?: PolymarketGammaMarketListQuery | string | AbortSignal,
    signal?: AbortSignal
  ): Promise<PolymarketGammaMarket | PolymarketGammaMarketListResponse> {
    if (typeof paramsOrIdOrSignal === "string") {
      return makeGetRequest<PolymarketGammaMarket>(
        `${baseURL}/markets/${encodeURIComponent(paramsOrIdOrSignal)}`,
        signal
      );
    }
    const isQuery =
      paramsOrIdOrSignal !== undefined &&
      paramsOrIdOrSignal !== null &&
      typeof paramsOrIdOrSignal === "object" &&
      !(paramsOrIdOrSignal instanceof AbortSignal);
    const params = isQuery
      ? (paramsOrIdOrSignal as PolymarketGammaMarketListQuery)
      : undefined;
    const effectiveSignal = isQuery
      ? signal
      : (paramsOrIdOrSignal as AbortSignal | undefined);
    const query = params ? buildMarketsQuery(params) : "";
    return makeGetRequest<PolymarketGammaMarketListResponse>(
      `${baseURL}/markets${query}`,
      effectiveSignal
    );
  }

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/markets/keyset{query}
  // Docs: https://docs.polymarket.com/api-reference/gamma/get-markets-keyset
  async function gammaMarketsKeyset(
    params?: PolymarketGammaMarketKeysetQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaMarketKeysetResponse> {
    const query = params ? buildMarketsQuery(params) : "";
    return makeGetRequest<PolymarketGammaMarketKeysetResponse>(
      `${baseURL}/markets/keyset${query}`,
      signal
    );
  }

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/markets/slug/{slug}
  // Docs: https://docs.polymarket.com/api-reference/gamma/get-market-by-slug
  async function gammaMarketsBySlug(
    slug: string,
    signal?: AbortSignal
  ): Promise<PolymarketGammaMarket> {
    return makeGetRequest<PolymarketGammaMarket>(
      `${baseURL}/markets/slug/${encodeURIComponent(slug)}`,
      signal
    );
  }

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/markets/{id}/tags
  // Docs: https://docs.polymarket.com/api-reference/gamma/get-market-tags
  async function gammaMarketsTags(
    id: string,
    signal?: AbortSignal
  ): Promise<PolymarketGammaTag[]> {
    return makeGetRequest<PolymarketGammaTag[]>(
      `${baseURL}/markets/${encodeURIComponent(id)}/tags`,
      signal
    );
  }

  const markets = Object.assign(gammaMarkets, {
    keyset: gammaMarketsKeyset,
    slug: gammaMarketsBySlug,
    tags: gammaMarketsTags,
  }) as PolymarketGammaGetNamespace["markets"];

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/series/{paramsOrIdOrSignal}
  // Docs: https://docs.polymarket.com/api-reference/gamma/get-series
  async function gammaSeries(
    paramsOrIdOrSignal?: PolymarketGammaEventListQuery | string | AbortSignal,
    signal?: AbortSignal
  ): Promise<PolymarketGammaSeries | PolymarketGammaSeries[]> {
    if (typeof paramsOrIdOrSignal === "string") {
      return makeGetRequest<PolymarketGammaSeries>(
        `${baseURL}/series/${encodeURIComponent(paramsOrIdOrSignal)}`,
        signal
      );
    }
    const isQuery =
      paramsOrIdOrSignal !== undefined &&
      paramsOrIdOrSignal !== null &&
      typeof paramsOrIdOrSignal === "object" &&
      !(paramsOrIdOrSignal instanceof AbortSignal);
    const params = isQuery
      ? (paramsOrIdOrSignal as PolymarketGammaEventListQuery)
      : undefined;
    const effectiveSignal = isQuery
      ? signal
      : (paramsOrIdOrSignal as AbortSignal | undefined);
    const query = params ? buildEventsQuery(params) : "";
    return makeGetRequest<PolymarketGammaSeries[]>(
      `${baseURL}/series${query}`,
      effectiveSignal
    );
  }

  const series = gammaSeries as PolymarketGammaGetNamespace["series"];

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/tags/{paramsOrIdOrSignal}
  // Docs: https://docs.polymarket.com/api-reference/gamma/get-tags
  async function gammaTags(
    paramsOrIdOrSignal?: PolymarketGammaEventListQuery | string | AbortSignal,
    signal?: AbortSignal
  ): Promise<PolymarketGammaTag | PolymarketGammaTag[]> {
    if (typeof paramsOrIdOrSignal === "string") {
      return makeGetRequest<PolymarketGammaTag>(
        `${baseURL}/tags/${encodeURIComponent(paramsOrIdOrSignal)}`,
        signal
      );
    }
    const isQuery =
      paramsOrIdOrSignal !== undefined &&
      paramsOrIdOrSignal !== null &&
      typeof paramsOrIdOrSignal === "object" &&
      !(paramsOrIdOrSignal instanceof AbortSignal);
    const params = isQuery
      ? (paramsOrIdOrSignal as PolymarketGammaEventListQuery)
      : undefined;
    const effectiveSignal = isQuery
      ? signal
      : (paramsOrIdOrSignal as AbortSignal | undefined);
    const query = params ? buildEventsQuery(params) : "";
    return makeGetRequest<PolymarketGammaTag[]>(
      `${baseURL}/tags${query}`,
      effectiveSignal
    );
  }

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/tags/slug/{slug}
  // Docs: https://docs.polymarket.com/api-reference/gamma/get-tag-by-slug
  async function gammaTagsBySlug(
    slug: string,
    signal?: AbortSignal
  ): Promise<PolymarketGammaTag> {
    return makeGetRequest<PolymarketGammaTag>(
      `${baseURL}/tags/slug/${encodeURIComponent(slug)}`,
      signal
    );
  }

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/tags/{id}/related-tags
  // Docs: https://docs.polymarket.com/api-reference/gamma/get-related-tags-by-id
  async function gammaTagsRelatedById(
    id: string,
    signal?: AbortSignal
  ): Promise<PolymarketGammaRelatedTag[]> {
    return makeGetRequest<PolymarketGammaRelatedTag[]>(
      `${baseURL}/tags/${encodeURIComponent(id)}/related-tags`,
      signal
    );
  }

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/tags/slug/{slug}/related-tags
  // Docs: https://docs.polymarket.com/api-reference/gamma/get-related-tags-by-slug
  async function gammaTagsRelatedBySlug(
    slug: string,
    signal?: AbortSignal
  ): Promise<PolymarketGammaRelatedTag[]> {
    return makeGetRequest<PolymarketGammaRelatedTag[]>(
      `${baseURL}/tags/slug/${encodeURIComponent(slug)}/related-tags`,
      signal
    );
  }

  const relatedTags = Object.assign(gammaTagsRelatedById, {
    slug: gammaTagsRelatedBySlug,
  }) as PolymarketGammaGetNamespace["tags"]["relatedTags"];

  const tags = Object.assign(gammaTags, {
    slug: gammaTagsBySlug,
    relatedTags,
  }) as PolymarketGammaGetNamespace["tags"];

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/comments/{paramsOrIdOrSignal}
  // Docs: https://docs.polymarket.com/api-reference/gamma/get-comments
  async function gammaComments(
    paramsOrIdOrSignal: PolymarketGammaCommentListQuery | string | AbortSignal,
    signal?: AbortSignal
  ): Promise<PolymarketGammaComment[]> {
    if (typeof paramsOrIdOrSignal === "string") {
      return makeGetRequest<PolymarketGammaComment[]>(
        `${baseURL}/comments/${encodeURIComponent(paramsOrIdOrSignal)}`,
        signal
      );
    }
    const isQuery =
      paramsOrIdOrSignal !== null &&
      typeof paramsOrIdOrSignal === "object" &&
      !(paramsOrIdOrSignal instanceof AbortSignal);
    const params = isQuery
      ? (paramsOrIdOrSignal as PolymarketGammaCommentListQuery)
      : undefined;
    const effectiveSignal = isQuery
      ? signal
      : (paramsOrIdOrSignal as AbortSignal);
    const usp = new URLSearchParams();
    if (params) {
      usp.set("parent_entity_type", params.parent_entity_type);
      usp.set("parent_entity_id", String(params.parent_entity_id));
      if (params.limit !== undefined) usp.set("limit", String(params.limit));
      if (params.offset !== undefined) usp.set("offset", String(params.offset));
      if (params.order !== undefined) usp.set("order", params.order);
      if (params.ascending !== undefined)
        usp.set("ascending", String(params.ascending));
    }
    const query = usp.toString().length > 0 ? `?${usp.toString()}` : "";
    return makeGetRequest<PolymarketGammaComment[]>(
      `${baseURL}/comments${query}`,
      effectiveSignal
    );
  }

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/comments/user_address/{address}{query}
  // Docs: https://docs.polymarket.com/api-reference/gamma/get-comments-by-user
  async function gammaCommentsByUser(
    address: string,
    params?: PolymarketGammaCommentByUserQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaComment[]> {
    const usp = new URLSearchParams();
    if (params?.limit !== undefined) usp.set("limit", String(params.limit));
    if (params?.offset !== undefined) usp.set("offset", String(params.offset));
    const query = usp.toString().length > 0 ? `?${usp.toString()}` : "";
    return makeGetRequest<PolymarketGammaComment[]>(
      `${baseURL}/comments/user_address/${encodeURIComponent(address)}${query}`,
      signal
    );
  }

  const comments = Object.assign(gammaComments, {
    byUser: gammaCommentsByUser,
  }) as PolymarketGammaGetNamespace["comments"];

  // sig-ok: maps `gamma.search` to /public-search (the protected /search needs
  // session cookies — out of scope for the public SDK)
  // GET https://gamma-api.polymarket.com/public-search{query}
  // Docs: https://docs.polymarket.com/api-reference/gamma/search
  async function gammaSearch(
    params: PolymarketGammaSearchQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaSearchResponse> {
    const usp = new URLSearchParams();
    usp.set("q", params.q);
    if (params.limit_per_type !== undefined)
      usp.set("limit_per_type", String(params.limit_per_type));
    if (params.events_status !== undefined)
      usp.set("events_status", params.events_status);
    const query = `?${usp.toString()}`;
    return makeGetRequest<PolymarketGammaSearchResponse>(
      `${baseURL}/public-search${query}`,
      signal
    );
  }

  return {
    get: {
      gamma: {
        events,
        markets,
        series,
        tags,
        comments,
        search: gammaSearch,
      },
    },
  };
}
