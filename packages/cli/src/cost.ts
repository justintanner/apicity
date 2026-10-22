const COST_PACKAGE: string = "@apicity/cost";

export interface CostPaidEndpointEntry {
  key: {
    provider: string;
    method: string;
    dotPath: string;
  };
}

export interface FrontierHelperEndpoint {
  provider: string;
  dotPath: string;
  modelId?: string;
}

export interface FrontierHelperEntry {
  rank: number;
  model: string;
  creator: string;
  elo: number;
  endpoints: FrontierHelperEndpoint[];
}

export interface FrontierHelperType {
  type: string;
  name: string;
  aliases: readonly string[];
  leaderboardId: string;
  sourceUrl: string;
  capturedOn: string;
  methodology: string;
  derived: boolean;
}

export interface FrontierHelperRow {
  type: string;
  rank: number;
  model: string;
  creator: string;
  elo: number;
  provider: string;
  dotPath: string;
  modelId?: string;
}

export interface CostHelpers {
  PAID_ENDPOINTS: CostPaidEndpointEntry[];
  isPaidEndpoint: (
    provider: string,
    method: string,
    dotPath: string
  ) => boolean;
  frontier: (
    type: string,
    options?: { provider?: string }
  ) => FrontierHelperRow[];
  FRONTIER_TYPES: FrontierHelperType[];
  /**
   * Snapshots, including models with an empty endpoint list.
   * `frontier()` returns mapped rows only, so the type table and the
   * unmapped footer read this.
   */
  FRONTIER: Record<string, { entries: FrontierHelperEntry[] }>;
}

let costHelpersPromise: Promise<CostHelpers> | undefined;

export function loadCostHelpers(): Promise<CostHelpers> {
  costHelpersPromise ??= import(COST_PACKAGE).then((mod) => {
    const exports = mod as Record<string, unknown>;
    const paidEndpoints = exports.PAID_ENDPOINTS;
    const isPaidEndpoint = exports.isPaidEndpoint;
    const frontier = exports.frontier;
    const frontierTypes = exports.FRONTIER_TYPES;
    const frontierData = exports.FRONTIER;

    if (!Array.isArray(paidEndpoints)) {
      throw new Error(
        "Expected @apicity/cost to export PAID_ENDPOINTS as an array"
      );
    }
    if (typeof isPaidEndpoint !== "function") {
      throw new Error(
        "Expected @apicity/cost to export isPaidEndpoint as a function"
      );
    }
    if (typeof frontier !== "function") {
      throw new Error(
        "Expected @apicity/cost to export frontier as a function"
      );
    }
    if (!Array.isArray(frontierTypes)) {
      throw new Error(
        "Expected @apicity/cost to export FRONTIER_TYPES as an array"
      );
    }
    if (
      frontierData === null ||
      typeof frontierData !== "object" ||
      Array.isArray(frontierData)
    ) {
      throw new Error("Expected @apicity/cost to export FRONTIER as an object");
    }

    return {
      PAID_ENDPOINTS: paidEndpoints as CostPaidEndpointEntry[],
      isPaidEndpoint: isPaidEndpoint as CostHelpers["isPaidEndpoint"],
      frontier: frontier as CostHelpers["frontier"],
      FRONTIER_TYPES: frontierTypes as CostHelpers["FRONTIER_TYPES"],
      FRONTIER: frontierData as CostHelpers["FRONTIER"],
    };
  });

  return costHelpersPromise;
}
