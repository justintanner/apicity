import { PolymarketOptions, PolymarketProvider } from "./types";
import { createClobProvider } from "./clob";
import { createGammaProvider } from "./gamma";

// Top-level orchestrator. Each sub-factory owns its own host and request
// helpers — see clob.ts and gamma.ts. The endpoint-walker traverses each
// sub-factory independently so per-host base URLs resolve cleanly.
export function polymarket(opts: PolymarketOptions = {}): PolymarketProvider {
  // Reserve dataBaseURL so the public surface is stable while data.* is
  // still pending (D1-D3).
  void opts.dataBaseURL;

  const clob = createClobProvider(opts);
  const gamma = createGammaProvider(opts);

  return {
    get: {
      ...clob.get,
      ...gamma.get,
    },
    post: {
      ...clob.post,
    },
  };
}
