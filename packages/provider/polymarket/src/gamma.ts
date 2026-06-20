import {
  PolymarketOptions,
  PolymarketGammaEvent,
  PolymarketGammaMarket,
  PolymarketGammaTag,
  PolymarketGammaStatusResponse,
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
  PolymarketGammaRelatedTagsQuery,
  PolymarketGammaComment,
  PolymarketGammaCommentListQuery,
  PolymarketGammaCommentByUserQuery,
  PolymarketGammaSearchQuery,
  PolymarketGammaSearchResponse,
  PolymarketGammaSport,
  PolymarketGammaSportsMarketTypesResponse,
  PolymarketGammaTeam,
  PolymarketGammaTeamsQuery,
  PolymarketGammaPublicProfileQuery,
  PolymarketGammaPublicProfileResponse,
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

  type QueryRecord = object;

  function buildQuery(params?: QueryRecord): string {
    if (!params) return "";
    const usp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) usp.append(key, String(item));
        continue;
      }
      usp.set(key, String(value));
    }
    const s = usp.toString();
    return s.length > 0 ? `?${s}` : "";
  }

  function resolveQueryArgs<T extends QueryRecord>(
    paramsOrSignal?: T | AbortSignal,
    signal?: AbortSignal
  ): {
    params?: T;
    signal?: AbortSignal;
  } {
    if (paramsOrSignal instanceof AbortSignal) {
      return { signal: paramsOrSignal };
    }
    return { params: paramsOrSignal, signal };
  }

  function keysetCursorParams(
    params: PolymarketGammaKeysetQuery | PolymarketGammaMarketKeysetQuery
  ): QueryRecord {
    const { next_cursor, ...rest } = params;
    if (rest.after_cursor !== undefined || next_cursor === undefined) {
      return rest as QueryRecord;
    }
    return { ...rest, after_cursor: next_cursor };
  }

  function buildEventsQuery(
    params: PolymarketGammaEventListQuery | PolymarketGammaKeysetQuery
  ): string {
    return buildQuery(
      "next_cursor" in params ? keysetCursorParams(params) : params
    );
  }

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/status
  // Docs: https://docs.polymarket.com/api-spec/gamma-openapi.yaml
  async function gammaStatus(
    signal?: AbortSignal
  ): Promise<PolymarketGammaStatusResponse> {
    return makeGetRequest<PolymarketGammaStatusResponse>(
      `${baseURL}/status`,
      signal
    );
  }

  // sig-ok: intentional
  // GET https://gamma-api.polymarket.com/events/{paramsOrIdOrSignal}
  // Docs: https://docs.polymarket.com/api-reference/events/list-events.md
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
  // Docs: https://docs.polymarket.com/api-reference/events/list-events-keyset-pagination.md
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
  // Docs: https://docs.polymarket.com/api-reference/events/get-event-by-slug.md
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
  // Docs: https://docs.polymarket.com/api-reference/events/get-event-tags.md
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
    return buildQuery(
      "next_cursor" in params ? keysetCursorParams(params) : params
    );
  }

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/markets/{paramsOrIdOrSignal}
  // Docs: https://docs.polymarket.com/api-reference/markets/list-markets.md
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
  // Docs: https://docs.polymarket.com/api-reference/markets/list-markets-keyset-pagination.md
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
  // Docs: https://docs.polymarket.com/api-reference/markets/get-market-by-slug.md
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
  // Docs: https://docs.polymarket.com/api-reference/markets/get-market-tags-by-id.md
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
  // Docs: https://docs.polymarket.com/api-reference/series/list-series.md
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
  // Docs: https://docs.polymarket.com/api-reference/tags/list-tags.md
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
  // Docs: https://docs.polymarket.com/api-reference/tags/get-tag-by-slug.md
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
  // GET https://gamma-api.polymarket.com/tags/{id}/related-tags{query}
  // Docs: https://docs.polymarket.com/api-reference/tags/get-related-tags-relationships-by-tag-id.md
  async function gammaTagsRelatedById(
    id: string,
    paramsOrSignal?: PolymarketGammaRelatedTagsQuery | AbortSignal,
    signal?: AbortSignal
  ): Promise<PolymarketGammaRelatedTag[]> {
    const args = resolveQueryArgs(paramsOrSignal, signal);
    const query = buildQuery(args.params);
    return makeGetRequest<PolymarketGammaRelatedTag[]>(
      `${baseURL}/tags/${encodeURIComponent(id)}/related-tags${query}`,
      args.signal
    );
  }

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/tags/slug/{slug}/related-tags{query}
  // Docs: https://docs.polymarket.com/api-reference/tags/get-related-tags-relationships-by-tag-slug.md
  async function gammaTagsRelatedBySlug(
    slug: string,
    paramsOrSignal?: PolymarketGammaRelatedTagsQuery | AbortSignal,
    signal?: AbortSignal
  ): Promise<PolymarketGammaRelatedTag[]> {
    const args = resolveQueryArgs(paramsOrSignal, signal);
    const query = buildQuery(args.params);
    return makeGetRequest<PolymarketGammaRelatedTag[]>(
      `${baseURL}/tags/slug/${encodeURIComponent(slug)}/related-tags${query}`,
      args.signal
    );
  }

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/tags/{id}/related-tags/tags{query}
  // Docs: https://docs.polymarket.com/api-reference/tags/get-tags-related-to-a-tag-id.md
  async function gammaTagsRelatedTagsById(
    id: string,
    paramsOrSignal?: PolymarketGammaRelatedTagsQuery | AbortSignal,
    signal?: AbortSignal
  ): Promise<PolymarketGammaTag[]> {
    const args = resolveQueryArgs(paramsOrSignal, signal);
    const query = buildQuery(args.params);
    return makeGetRequest<PolymarketGammaTag[]>(
      `${baseURL}/tags/${encodeURIComponent(id)}/related-tags/tags${query}`,
      args.signal
    );
  }

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/tags/slug/{slug}/related-tags/tags{query}
  // Docs: https://docs.polymarket.com/api-reference/tags/get-tags-related-to-a-tag-slug.md
  async function gammaTagsRelatedTagsBySlug(
    slug: string,
    paramsOrSignal?: PolymarketGammaRelatedTagsQuery | AbortSignal,
    signal?: AbortSignal
  ): Promise<PolymarketGammaTag[]> {
    const args = resolveQueryArgs(paramsOrSignal, signal);
    const query = buildQuery(args.params);
    return makeGetRequest<PolymarketGammaTag[]>(
      `${baseURL}/tags/slug/${encodeURIComponent(slug)}/related-tags/tags${query}`,
      args.signal
    );
  }

  const relatedTagsTags = Object.assign(gammaTagsRelatedTagsById, {
    slug: gammaTagsRelatedTagsBySlug,
  }) as PolymarketGammaGetNamespace["tags"]["relatedTags"]["tags"];

  const relatedTags = Object.assign(gammaTagsRelatedById, {
    slug: gammaTagsRelatedBySlug,
    tags: relatedTagsTags,
  }) as PolymarketGammaGetNamespace["tags"]["relatedTags"];

  const tags = Object.assign(gammaTags, {
    slug: gammaTagsBySlug,
    relatedTags,
  }) as PolymarketGammaGetNamespace["tags"];

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/comments/{paramsOrIdOrSignal}
  // Docs: https://docs.polymarket.com/api-reference/comments/list-comments.md
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
      if (params.get_positions !== undefined)
        usp.set("get_positions", String(params.get_positions));
      if (params.holders_only !== undefined)
        usp.set("holders_only", String(params.holders_only));
    }
    const query = usp.toString().length > 0 ? `?${usp.toString()}` : "";
    return makeGetRequest<PolymarketGammaComment[]>(
      `${baseURL}/comments${query}`,
      effectiveSignal
    );
  }

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/comments/user_address/{address}{query}
  // Docs: https://docs.polymarket.com/api-reference/comments/get-comments-by-user-address.md
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
  // Docs: https://docs.polymarket.com/api-reference/search/search-markets-events-and-profiles.md
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

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/sports
  // Docs: https://docs.polymarket.com/api-reference/sports/get-sports-metadata-information.md
  async function gammaSports(
    signal?: AbortSignal
  ): Promise<PolymarketGammaSport[]> {
    return makeGetRequest<PolymarketGammaSport[]>(`${baseURL}/sports`, signal);
  }

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/sports/market-types
  // Docs: https://docs.polymarket.com/api-reference/sports/get-valid-sports-market-types.md
  async function gammaSportsMarketTypes(
    signal?: AbortSignal
  ): Promise<PolymarketGammaSportsMarketTypesResponse> {
    return makeGetRequest<PolymarketGammaSportsMarketTypesResponse>(
      `${baseURL}/sports/market-types`,
      signal
    );
  }

  const sports = Object.assign(gammaSports, {
    marketTypes: gammaSportsMarketTypes,
  }) as PolymarketGammaGetNamespace["sports"];

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/teams{query}
  // Docs: https://docs.polymarket.com/api-reference/sports/list-teams.md
  async function gammaTeams(
    paramsOrSignal?: PolymarketGammaTeamsQuery | AbortSignal,
    signal?: AbortSignal
  ): Promise<PolymarketGammaTeam[]> {
    const args = resolveQueryArgs(paramsOrSignal, signal);
    const query = buildQuery(args.params);
    return makeGetRequest<PolymarketGammaTeam[]>(
      `${baseURL}/teams${query}`,
      args.signal
    );
  }

  // sig-ok: hostname `gamma-api` shortened to `gamma` for caller ergonomics
  // GET https://gamma-api.polymarket.com/public-profile{query}
  // Docs: https://docs.polymarket.com/api-reference/profiles/get-public-profile-by-wallet-address.md
  async function gammaPublicProfile(
    params: PolymarketGammaPublicProfileQuery,
    signal?: AbortSignal
  ): Promise<PolymarketGammaPublicProfileResponse> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketGammaPublicProfileResponse>(
      `${baseURL}/public-profile${query}`,
      signal
    );
  }

  return {
    get: {
      gamma: {
        status: gammaStatus,
        events,
        markets,
        series,
        tags,
        comments,
        search: gammaSearch,
        sports,
        teams: gammaTeams,
        publicProfile: gammaPublicProfile,
      },
    },
  };
}
