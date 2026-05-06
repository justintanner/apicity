import { PolymarketOptions, PolymarketProvider } from "./types";
import { createClobProvider } from "./clob";
import { createGammaProvider } from "./gamma";
import { createDataProvider } from "./data";

// Top-level orchestrator. Each sub-factory owns its own host and request
// helpers — see clob.ts, gamma.ts, data.ts. The endpoint-walker traverses
// each sub-factory independently so per-host base URLs resolve cleanly.
export function polymarket(opts: PolymarketOptions = {}): PolymarketProvider {
  const clob = createClobProvider(opts);
  const gamma = createGammaProvider(opts);
  const data = createDataProvider(opts);

  return {
    get: {
      ...clob.get,
      ...gamma.get,
      ...data.get,
    },
    post: {
      ...clob.post,
    },
  };
}
