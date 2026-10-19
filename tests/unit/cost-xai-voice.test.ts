import { describe, it, expect } from "vitest";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  classifyEstimate,
  isCostPolicyKnown,
} from "../../packages/provider/cost/src/cost-tier";
import { PRICING } from "../../packages/provider/cost/src/pricing/index";
import { MODEL_SLUGS } from "../../packages/provider/cost/src/slugs";
import type { EstimateRequest } from "../../packages/provider/cost/src/types";

// xAI grok-voice-think-fast-2.0 is deliberately unpriced (ac-kvmsvg).
// On 2026-10-19, docs.x.ai/developers/pricing, /developers/models, the voice
// API reference and the realtime schema (docs.x.ai/voice-realtime.ws.json)
// list only grok-voice-latest (an alias of grok-voice-3.0), grok-voice-3.0
// and the deprecated grok-voice-2.0. Those bill $0.08 / min plus $0.004 /
// text input with no stated clock, rounding or text-input unit, and a
// realtime response.done reports tokens only. No other voice id's rate may
// be copied onto this one.

const VOICE = "grok-voice-think-fast-2.0";

function expectUnpriced(req: EstimateRequest): void {
  const est = computeEstimate(req);
  expect(est.usd).toBe(0);
  expect(isCostPolicyKnown(est)).toBe(false);
  expect(classifyEstimate(est)).toBe("prohibitive");
  expect(est.warnings).toContain(
    `model '${VOICE}' not found in pricing table for provider 'xai'`
  );
}

describe("xai grok-voice-think-fast-2.0 stays unpriced", () => {
  it("has no bundled rate or slug", () => {
    expect(PRICING.xai[VOICE]).toBeUndefined();
    expect((MODEL_SLUGS.xai as Record<string, string>)[VOICE]).toBeUndefined();
  });

  it("returns an explicit unknown estimate", () => {
    expectUnpriced({ provider: "xai", payload: { model: VOICE } });
  });

  it("is not priced from declared tokens, a duration or a text payload", () => {
    expectUnpriced({
      provider: "xai",
      payload: { model: VOICE },
      costHints: { inputTokens: 100, outputTokens: 50, durationSeconds: 60 },
    });
    expectUnpriced({
      provider: "xai",
      endpoint: "v1.realtime",
      payload: { model: VOICE, text: "hello there", max_tokens: 100 },
    });
  });
});
