import {
  PolymarketOptions,
  PolymarketDataPosition,
  PolymarketDataPositionsQuery,
  PolymarketDataValueResponse,
  PolymarketDataValueQuery,
  PolymarketDataHoldersGroup,
  PolymarketDataHoldersQuery,
  PolymarketDataActivityEntry,
  PolymarketDataActivityQuery,
  PolymarketDataTradeEntry,
  PolymarketDataTradesQuery,
  PolymarketDataOpenInterestResponse,
  PolymarketDataOpenInterestQuery,
  PolymarketDataLiveVolumeResponse,
  PolymarketDataLiveVolumeQuery,
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

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/holders{query}
  // Docs: https://docs.polymarket.com/api-reference/data/get-holders
  async function dataHolders(
    params: PolymarketDataHoldersQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataHoldersGroup[]> {
    const usp = new URLSearchParams();
    if (Array.isArray(params.market)) {
      for (const m of params.market) usp.append("market", m);
    } else {
      usp.set("market", params.market);
    }
    if (params.limit !== undefined) usp.set("limit", String(params.limit));
    const query = `?${usp.toString()}`;
    return makeGetRequest<PolymarketDataHoldersGroup[]>(
      `${baseURL}/holders${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/activity{query}
  // Docs: https://docs.polymarket.com/api-reference/data/get-activity
  async function dataActivity(
    params: PolymarketDataActivityQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataActivityEntry[]> {
    const usp = new URLSearchParams();
    usp.set("user", params.user);
    if (params.limit !== undefined) usp.set("limit", String(params.limit));
    if (params.offset !== undefined) usp.set("offset", String(params.offset));
    if (params.market !== undefined) {
      if (Array.isArray(params.market)) {
        for (const m of params.market) usp.append("market", m);
      } else {
        usp.set("market", params.market);
      }
    }
    if (params.type !== undefined) {
      if (Array.isArray(params.type)) {
        for (const t of params.type) usp.append("type", t);
      } else {
        usp.set("type", params.type);
      }
    }
    if (params.start !== undefined) usp.set("start", String(params.start));
    if (params.end !== undefined) usp.set("end", String(params.end));
    if (params.side !== undefined) usp.set("side", params.side);
    if (params.sortBy !== undefined) usp.set("sortBy", params.sortBy);
    if (params.sortDirection !== undefined)
      usp.set("sortDirection", params.sortDirection);
    const query = `?${usp.toString()}`;
    return makeGetRequest<PolymarketDataActivityEntry[]>(
      `${baseURL}/activity${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/trades{query}
  // Docs: https://docs.polymarket.com/api-reference/data/get-trades
  async function dataTrades(
    params: PolymarketDataTradesQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataTradeEntry[]> {
    const usp = new URLSearchParams();
    if (params.user !== undefined) usp.set("user", params.user);
    if (params.market !== undefined) {
      if (Array.isArray(params.market)) {
        for (const m of params.market) usp.append("market", m);
      } else {
        usp.set("market", params.market);
      }
    }
    if (params.limit !== undefined) usp.set("limit", String(params.limit));
    if (params.offset !== undefined) usp.set("offset", String(params.offset));
    if (params.takerOnly !== undefined)
      usp.set("takerOnly", String(params.takerOnly));
    if (params.filterType !== undefined)
      usp.set("filterType", params.filterType);
    const query = usp.toString().length > 0 ? `?${usp.toString()}` : "";
    return makeGetRequest<PolymarketDataTradeEntry[]>(
      `${baseURL}/trades${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/oi{query}
  // Docs: https://docs.polymarket.com/api-reference/data/get-open-interest
  async function dataOi(
    params?: PolymarketDataOpenInterestQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataOpenInterestResponse> {
    const usp = new URLSearchParams();
    if (params?.market !== undefined) {
      if (Array.isArray(params.market)) {
        for (const m of params.market) usp.append("market", m);
      } else {
        usp.set("market", params.market);
      }
    }
    const query = usp.toString().length > 0 ? `?${usp.toString()}` : "";
    return makeGetRequest<PolymarketDataOpenInterestResponse>(
      `${baseURL}/oi${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/live-volume{query}
  // Docs: https://docs.polymarket.com/api-reference/data/get-live-volume
  async function dataLiveVolume(
    params: PolymarketDataLiveVolumeQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataLiveVolumeResponse> {
    const query = `?id=${encodeURIComponent(String(params.id))}`;
    return makeGetRequest<PolymarketDataLiveVolumeResponse>(
      `${baseURL}/live-volume${query}`,
      signal
    );
  }

  return {
    get: {
      data: {
        positions: dataPositions,
        value: dataValue,
        holders: dataHolders,
        activity: dataActivity,
        trades: dataTrades,
        oi: dataOi,
        liveVolume: dataLiveVolume,
      },
    },
  };
}
