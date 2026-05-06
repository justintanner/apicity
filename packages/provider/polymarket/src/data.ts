import {
  PolymarketOptions,
  PolymarketDataPosition,
  PolymarketDataPositionsQuery,
  PolymarketDataValueResponse,
  PolymarketDataValueQuery,
  PolymarketDataGetNamespace,
} from "./types";
import { createRequestHelpers } from "./_helpers";

export interface PolymarketDataSubProvider {
  get: { data: PolymarketDataGetNamespace };
}

// Internal sub-factory for the Data API host. Owns its own `baseURL` const
// so the endpoint-walker can resolve `https://data-api.polymarket.com/...`
// URLs per-factory.
export function createDataProvider(
  opts: PolymarketOptions
): PolymarketDataSubProvider {
  const baseURL = opts.dataBaseURL ?? "https://data-api.polymarket.com";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;
  const { makeGetRequest } = createRequestHelpers(doFetch, timeout);

  function buildPositionsQuery(params: PolymarketDataPositionsQuery): string {
    const usp = new URLSearchParams();
    usp.set("user", params.user);
    if (params.market !== undefined) {
      if (Array.isArray(params.market)) {
        for (const m of params.market) usp.append("market", m);
      } else {
        usp.set("market", params.market);
      }
    }
    if (params.eventId !== undefined) usp.set("eventId", params.eventId);
    if (params.sizeThreshold !== undefined)
      usp.set("sizeThreshold", String(params.sizeThreshold));
    if (params.redeemable !== undefined)
      usp.set("redeemable", String(params.redeemable));
    if (params.mergeable !== undefined)
      usp.set("mergeable", String(params.mergeable));
    if (params.title !== undefined) usp.set("title", params.title);
    if (params.sortBy !== undefined) usp.set("sortBy", params.sortBy);
    if (params.sortDirection !== undefined)
      usp.set("sortDirection", params.sortDirection);
    if (params.limit !== undefined) usp.set("limit", String(params.limit));
    if (params.offset !== undefined) usp.set("offset", String(params.offset));
    return `?${usp.toString()}`;
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/positions{query}
  // Docs: https://docs.polymarket.com/api-reference/data/get-positions
  async function dataPositions(
    params: PolymarketDataPositionsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataPosition[]> {
    const query = buildPositionsQuery(params);
    return makeGetRequest<PolymarketDataPosition[]>(
      `${baseURL}/positions${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/value{query}
  // Docs: https://docs.polymarket.com/api-reference/data/get-positions-value
  async function dataValue(
    params: PolymarketDataValueQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataValueResponse> {
    const query = `?user=${encodeURIComponent(params.user)}`;
    return makeGetRequest<PolymarketDataValueResponse>(
      `${baseURL}/value${query}`,
      signal
    );
  }

  return {
    get: {
      data: {
        positions: dataPositions,
        value: dataValue,
      },
    },
  };
}
