const COST_PACKAGE: string = "@apicity/cost";

export interface CostPaidEndpointEntry {
  key: {
    provider: string;
    method: string;
    dotPath: string;
  };
}

export interface CostHelpers {
  PAID_ENDPOINTS: CostPaidEndpointEntry[];
  isPaidEndpoint: (
    provider: string,
    method: string,
    dotPath: string
  ) => boolean;
}

let costHelpersPromise: Promise<CostHelpers> | undefined;

export function loadCostHelpers(): Promise<CostHelpers> {
  costHelpersPromise ??= import(COST_PACKAGE).then((mod) => {
    const exports = mod as Record<string, unknown>;
    const paidEndpoints = exports.PAID_ENDPOINTS;
    const isPaidEndpoint = exports.isPaidEndpoint;

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

    return {
      PAID_ENDPOINTS: paidEndpoints as CostPaidEndpointEntry[],
      isPaidEndpoint: isPaidEndpoint as CostHelpers["isPaidEndpoint"],
    };
  });

  return costHelpersPromise;
}
