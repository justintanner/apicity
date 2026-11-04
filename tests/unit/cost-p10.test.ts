import { describe, expect, it } from "vitest";
import {
  computeEstimate,
  estimateEndpoint,
  extractActual,
  PRICING,
} from "@apicity/cost";

const hints = {
  inputTokens: 1000,
  outputTokens: 100,
  cacheReadInputTokens: 200,
  cacheWriteInputTokens: 0,
};

describe("P10 list comparisons and endpoint rates (sources read 2026-11-04)", () => {
  it.each([
    [160, 0.01],
    [161, 0.02],
    [320, 0.02],
  ])("prices %i Quo characters", (length, usd) => {
    expect(
      estimateEndpoint({
        provider: "quo",
        method: "POST",
        dotPath: "v1.messages",
        payload: { content: "a".repeat(length), to: ["+14155550123"] },
      })
    ).toMatchObject({ usd, status: "priced", warnings: [] });
  });
  it("warns about non-GSM segmentation and unbundled destinations", () => {
    const result = computeEstimate({
      provider: "quo",
      payload: { content: "你".repeat(71), to: ["+441234567890"] },
    });
    expect(result.usd).toBe(0.02);
    expect(result.warnings.join(" ")).toMatch(/non-GSM/);
    expect(result.warnings.join(" ")).toMatch(/international/);
    expect(
      estimateEndpoint({
        provider: "quo",
        method: "POST",
        dotPath: "v1.messages",
        payload: {},
      }).status
    ).toBe("unavailable");
  });
  it.each(["kimicoding", "zaicoding"] as const)(
    "keeps %s plan estimates and actuals separate from list prices",
    (provider) => {
      const model = provider === "kimicoding" ? "kimi-k2.6" : "glm-5.3";
      const payload = {
        model,
        messages: [{ role: "user", content: "hello" }],
        max_tokens: 100,
      };
      const comparison = computeEstimate({
        provider,
        payload,
        costHints: hints,
      });
      expect(comparison.usd).toBeCloseTo(
        provider === "kimicoding" ? 0.001192 : 0.001612
      );
      expect(comparison.notes?.join(" ")).toMatch(/list-price comparison/);
      const endpoint = estimateEndpoint({
        provider,
        method: "POST",
        dotPath:
          provider === "kimicoding"
            ? "coding.v1.messages"
            : "api.coding.paas.v4.chat.completions",
        payload,
      });
      expect(endpoint).toMatchObject({ status: "zero", usd: 0 });
      expect(endpoint.zeroReason).toBeTruthy();
      const actual = extractActual({
        provider,
        method: "POST",
        url: "https://example.test",
        status: 200,
        responseHeaders: {},
        requestBody: payload,
        responseBody: {
          model,
          usage: { prompt_tokens: 1000, completion_tokens: 100 },
        },
      });
      expect(actual).toMatchObject({
        statedUsd: null,
        derivedUsd: null,
        usd: null,
        basis: "usage-only",
      });
    }
  );
  it.each(["k3-256k", "k2p5", "k3.1-pro"])(
    "does not guess a list key for %s",
    (model) => {
      const result = computeEstimate({
        provider: "kimicoding",
        payload: { model },
        costHints: hints,
      });
      expect(result.warnings.join(" ")).toContain(model);
      expect(result.warnings.join(" ")).toContain(
        "no documented current list key"
      );
    }
  );
  it("prices Kimi K3 default cache writes without using Anthropic's TTL hint", () => {
    expect(PRICING.kimicoding["kimi-k3.1-pro"].source.asOf).toBe("2026-11-04");
    const req = {
      provider: "kimicoding" as const,
      payload: { model: "kimi-k3.1-pro" },
      costHints: { ...hints, cacheWriteInputTokens: 300 },
    };
    expect(computeEstimate(req).usd).toBeCloseTo(0.00264);
    expect(
      computeEstimate({
        ...req,
        costHints: { ...req.costHints, cacheWrite1hInputTokens: 300 },
      }).usd
    ).toBe(computeEstimate(req).usd);
    expect(
      computeEstimate({
        ...req,
        payload: {
          ...req.payload,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "x",
                  cache_control: { type: "ephemeral", ttl: "1h" },
                },
              ],
            },
          ],
        },
      }).warnings.join(" ")
    ).toMatch(/TTL/);
  });
  it("routes Flow extensions by model including the documented default", () => {
    const base = {
      provider: "googleflow",
      method: "POST",
      dotPath: "v1.videos.extend",
    };
    expect(
      estimateEndpoint({
        ...base,
        payload: { model: "veo-3.1-quality", count: 2 },
      }).usd
    ).toBe(
      computeEstimate({
        provider: "googleflow",
        endpoint: "veo-3.1-quality",
        payload: { count: 2 },
      }).usd
    );
    expect(
      estimateEndpoint({ ...base, payload: { model: "omni-flash" } }).status
    ).toBe("unavailable");
    expect(estimateEndpoint(base).usd).toBe(
      computeEstimate({
        provider: "googleflow",
        endpoint: "veo-3.1-fast",
        payload: {},
      }).usd
    );
  });
  it("prices supported Flow upscale tiers and leaves undocumented operations unavailable", () => {
    const base = {
      provider: "googleflow",
      method: "POST",
      dotPath: "v1.videos.upscale",
    };
    expect(estimateEndpoint(base)).toMatchObject({ usd: 0, status: "zero" });
    expect(
      estimateEndpoint({
        ...base,
        payload: { resolution: "4K" },
        costHints: { googleFlowPlan: "ultra" },
      }).usd
    ).toBeGreaterThan(0);
    expect(
      estimateEndpoint({ ...base, payload: { resolution: "4K" } }).status
    ).toBe("unavailable");
    for (const operation of ["gif", "concatenate"])
      expect(
        estimateEndpoint({ ...base, dotPath: `v1.videos.${operation}` })
      ).toMatchObject({ status: "unavailable", billing: { kind: "unpriced" } });
  });
});
