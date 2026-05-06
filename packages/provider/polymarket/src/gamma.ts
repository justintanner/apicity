import {
  PolymarketOptions,
  PolymarketGammaEvent,
  PolymarketGammaTag,
  PolymarketGammaEventListResponse,
  PolymarketGammaEventListQuery,
  PolymarketGammaEventKeysetResponse,
  PolymarketGammaKeysetQuery,
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

  return {
    get: {
      gamma: {
        events,
      },
    },
  };
}
