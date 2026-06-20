import {
  PolymarketOptions,
  PolymarketDataHealthResponse,
  PolymarketDataAccountingSnapshotQuery,
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
  PolymarketDataTradedResponse,
  PolymarketDataUserQuery,
  PolymarketDataOpenInterestResponse,
  PolymarketDataOpenInterestQuery,
  PolymarketDataLiveVolumeResponse,
  PolymarketDataLiveVolumeQuery,
  PolymarketDataClosedPosition,
  PolymarketDataClosedPositionsQuery,
  PolymarketDataComboActivityResponse,
  PolymarketDataComboActivityQuery,
  PolymarketDataComboPositionsResponse,
  PolymarketDataComboPositionsQuery,
  PolymarketDataMarketPositionsGroup,
  PolymarketDataMarketPositionsQuery,
  PolymarketDataBuilderLeaderboardEntry,
  PolymarketDataBuildersLeaderboardQuery,
  PolymarketDataBuilderVolumeEntry,
  PolymarketDataBuildersVolumeQuery,
  PolymarketDataTraderLeaderboardEntry,
  PolymarketDataLeaderboardQuery,
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
  const { makeGetRequest, makeGetBinaryRequest } = createRequestHelpers(
    doFetch,
    timeout
  );

  function buildQuery(params?: object): string {
    if (!params) return "";
    const usp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        if (value.length === 0) continue;
        usp.set(key, value.map(String).join(","));
        continue;
      }
      usp.set(key, String(value));
    }
    const s = usp.toString();
    return s.length > 0 ? `?${s}` : "";
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/
  // Docs: https://docs.polymarket.com/api-spec/data-openapi.yaml
  async function dataHealth(
    signal?: AbortSignal
  ): Promise<PolymarketDataHealthResponse> {
    return makeGetRequest<PolymarketDataHealthResponse>(`${baseURL}/`, signal);
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/v1/accounting/snapshot{query}
  // Docs: https://docs.polymarket.com/api-reference/misc/download-an-accounting-snapshot-zip-of-csvs.md
  async function dataAccountingSnapshot(
    params: PolymarketDataAccountingSnapshotQuery,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    const query = buildQuery(params);
    return makeGetBinaryRequest(
      `${baseURL}/v1/accounting/snapshot${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/positions{query}
  // Docs: https://docs.polymarket.com/api-reference/core/get-current-positions-for-a-user.md
  async function dataPositions(
    params: PolymarketDataPositionsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataPosition[]> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketDataPosition[]>(
      `${baseURL}/positions${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/v1/positions/combos{query}
  // Docs: https://docs.polymarket.com/api-reference/core/get-user-combo-positions.md
  async function dataPositionsCombos(
    params: PolymarketDataComboPositionsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataComboPositionsResponse> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketDataComboPositionsResponse>(
      `${baseURL}/v1/positions/combos${query}`,
      signal
    );
  }

  const positions = Object.assign(dataPositions, {
    combos: dataPositionsCombos,
  }) as PolymarketDataGetNamespace["positions"];

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/value{query}
  // Docs: https://docs.polymarket.com/api-reference/core/get-total-value-of-a-users-positions.md
  async function dataValue(
    params: PolymarketDataValueQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataValueResponse> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketDataValueResponse>(
      `${baseURL}/value${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/holders{query}
  // Docs: https://docs.polymarket.com/api-reference/core/get-top-holders-for-markets.md
  async function dataHolders(
    params: PolymarketDataHoldersQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataHoldersGroup[]> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketDataHoldersGroup[]>(
      `${baseURL}/holders${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/activity{query}
  // Docs: https://docs.polymarket.com/api-reference/core/get-user-activity.md
  async function dataActivity(
    params: PolymarketDataActivityQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataActivityEntry[]> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketDataActivityEntry[]>(
      `${baseURL}/activity${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/v1/activity/combos{query}
  // Docs: https://docs.polymarket.com/api-reference/core/get-user-combo-activity.md
  async function dataActivityCombos(
    params: PolymarketDataComboActivityQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataComboActivityResponse> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketDataComboActivityResponse>(
      `${baseURL}/v1/activity/combos${query}`,
      signal
    );
  }

  const activity = Object.assign(dataActivity, {
    combos: dataActivityCombos,
  }) as PolymarketDataGetNamespace["activity"];

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/trades{query}
  // Docs: https://docs.polymarket.com/api-reference/core/get-trades-for-a-user-or-markets.md
  async function dataTrades(
    params: PolymarketDataTradesQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataTradeEntry[]> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketDataTradeEntry[]>(
      `${baseURL}/trades${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/traded{query}
  // Docs: https://docs.polymarket.com/api-reference/misc/get-total-markets-a-user-has-traded.md
  async function dataTraded(
    params: PolymarketDataUserQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataTradedResponse> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketDataTradedResponse>(
      `${baseURL}/traded${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/oi{query}
  // Docs: https://docs.polymarket.com/api-reference/misc/get-open-interest.md
  async function dataOi(
    params?: PolymarketDataOpenInterestQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataOpenInterestResponse> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketDataOpenInterestResponse>(
      `${baseURL}/oi${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/live-volume{query}
  // Docs: https://docs.polymarket.com/api-reference/misc/get-live-volume-for-an-event.md
  async function dataLiveVolume(
    params: PolymarketDataLiveVolumeQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataLiveVolumeResponse> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketDataLiveVolumeResponse>(
      `${baseURL}/live-volume${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/closed-positions{query}
  // Docs: https://docs.polymarket.com/api-reference/core/get-closed-positions-for-a-user.md
  async function dataClosedPositions(
    params: PolymarketDataClosedPositionsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataClosedPosition[]> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketDataClosedPosition[]>(
      `${baseURL}/closed-positions${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/v1/market-positions{query}
  // Docs: https://docs.polymarket.com/api-reference/core/get-positions-for-a-market.md
  async function dataMarketPositions(
    params: PolymarketDataMarketPositionsQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataMarketPositionsGroup[]> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketDataMarketPositionsGroup[]>(
      `${baseURL}/v1/market-positions${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/v1/builders/leaderboard{query}
  // Docs: https://docs.polymarket.com/api-reference/builders/get-aggregated-builder-leaderboard.md
  async function dataBuildersLeaderboard(
    params?: PolymarketDataBuildersLeaderboardQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataBuilderLeaderboardEntry[]> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketDataBuilderLeaderboardEntry[]>(
      `${baseURL}/v1/builders/leaderboard${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/v1/builders/volume{query}
  // Docs: https://docs.polymarket.com/api-reference/builders/get-daily-builder-volume-time-series.md
  async function dataBuildersVolume(
    params?: PolymarketDataBuildersVolumeQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataBuilderVolumeEntry[]> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketDataBuilderVolumeEntry[]>(
      `${baseURL}/v1/builders/volume${query}`,
      signal
    );
  }

  // sig-ok: hostname `data-api` shortened to `data` for caller ergonomics
  // GET https://data-api.polymarket.com/v1/leaderboard{query}
  // Docs: https://docs.polymarket.com/api-reference/core/get-trader-leaderboard-rankings.md
  async function dataLeaderboard(
    params?: PolymarketDataLeaderboardQuery,
    signal?: AbortSignal
  ): Promise<PolymarketDataTraderLeaderboardEntry[]> {
    const query = buildQuery(params);
    return makeGetRequest<PolymarketDataTraderLeaderboardEntry[]>(
      `${baseURL}/v1/leaderboard${query}`,
      signal
    );
  }

  return {
    get: {
      data: {
        health: dataHealth,
        accounting: {
          snapshot: dataAccountingSnapshot,
        },
        positions,
        value: dataValue,
        holders: dataHolders,
        activity,
        trades: dataTrades,
        traded: dataTraded,
        oi: dataOi,
        liveVolume: dataLiveVolume,
        closedPositions: dataClosedPositions,
        marketPositions: dataMarketPositions,
        builders: {
          leaderboard: dataBuildersLeaderboard,
          volume: dataBuildersVolume,
        },
        leaderboard: dataLeaderboard,
      },
    },
  };
}
