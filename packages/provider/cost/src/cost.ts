import { computeEstimate } from "./compute";
import type { CostProvider, EstimateRequest } from "./types";

export function cost(): CostProvider {
  return {
    estimate: (req: EstimateRequest) => computeEstimate(req),
  };
}
