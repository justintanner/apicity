import { computeEstimate } from "./compute";
import type { CostOptions, CostProvider, EstimateRequest } from "./types";

export function cost(opts: CostOptions): CostProvider {
  return {
    estimate: (req: EstimateRequest) => computeEstimate(opts, req),
  };
}
