import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  computeEstimate,
  estimateEndpoint,
  extractActual,
  mergeActuals,
  PRICING,
  type CostHints,
  type ProviderExchange,
} from "@apicity/cost";
import { entryToProviderExchange } from "@apicity/har";

const counts = {
  inputTokens: 1300,
  outputTokens: 50,
  cacheReadInputTokens: 1000,
  cacheWriteInputTokens: 200,
};
const payload = {
  model: "claude-sonnet-4-6",
  messages: [{ role: "user", content: "A small cat" }],
  max_tokens: 100,
};
const estimate = (
  data: Record<string, unknown> = payload,
  hints?: CostHints,
  mode: "strict" | "forecast" = "strict",
  dotPath = "v1.messages"
) =>
  estimateEndpoint({
    provider: "anthropic",
    method: "POST",
    dotPath,
    payload: data,
    costHints: hints,
    mode,
  });
const actual = (
  usage: Record<string, unknown>,
  request: Record<string, unknown> = payload
) =>
  extractActual({
    provider: "anthropic",
    dotPath: "v1.messages",
    method: "POST",
    url: "https://api.anthropic.com/v1/messages",
    status: 200,
    requestBody: request,
    responseHeaders: {},
    responseBody: { usage },
  });
const reported = {
  input_tokens: 100,
  output_tokens: 50,
  cache_read_input_tokens: 1000,
  cache_creation_input_tokens: 200,
};
const hour = { ...payload, cache_control: { type: "ephemeral", ttl: "1h" } };

describe("Anthropic 2026-11-04 pricing", () => {
  it.each([
    ["fable-5-1", 10, 50, 0.25],
    ["mythos-5-1", 10, 50, 0.25],
    ["fable-5", 10, 50, 1],
    ["mythos-5", 10, 50, 1],
    ["opus-5-5", 4, 20, 0.2],
    ["opus-5", 5, 25, 0.5],
    ["opus-4-8", 5, 25, 0.5],
    ["opus-4-7", 5, 25, 0.5],
    ["opus-4-6", 5, 25, 0.5],
    ["opus-4-5", 5, 25, 0.5],
    ["opus-4-1", 15, 75, 1.5],
    ["opus-4", 15, 75, 1.5],
    ["sonnet-5-5", 2, 10, 0.1],
    ["sonnet-5", 2, 10, 0.2],
    ["sonnet-4-6", 3, 15, 0.3],
    ["sonnet-4-5", 3, 15, 0.3],
    ["sonnet-4", 3, 15, 0.3],
    ["haiku-5-5", 0.1, 0.5, 0.01],
    ["haiku-4-5", 1, 5, 0.1],
    ["haiku-3-5", 0.8, 4, 0.08],
  ] as const)(
    "pins published %s and mixed TTLs",
    (model, input, output, read) => {
      const result = estimate(
        { model: `claude-${model}` },
        { ...counts, cacheWrite1hInputTokens: 80 }
      );
      expect(result.status).toBe("priced");
      expect(result.usd).toBeCloseTo(
        (100 * input +
          1000 * read +
          120 * input * 1.25 +
          80 * input * 2 +
          50 * output) /
          1e6,
        12
      );
      expect(result.rateAsOf).toBe("2026-11-04");
      expect(result.warnings).toEqual([]);
      expect(result.breakdown.cacheWrite1h).toEqual({
        inputTokens: 80,
        usdPerMillion: input * 2,
      });
    }
  );
  it("covers every published model", () =>
    expect(Object.keys(PRICING.anthropic)).toHaveLength(20));
  it.each([100000, 100001])(
    "selects Haiku long-context at %s total input",
    (inputTokens) => {
      const long = inputTokens > 100000;
      const result = estimate(
        { model: "claude-haiku-5-5" },
        {
          inputTokens,
          outputTokens: 100,
          cacheReadInputTokens: inputTokens - 200,
          cacheWriteInputTokens: 100,
          cacheWrite1hInputTokens: 50,
        }
      );
      expect(result.breakdown.contextTier).toBe(long ? "long" : "short");
      expect(result.usd).toBeCloseTo(
        ((100 * 0.1 +
          (inputTokens - 200) * 0.01 +
          50 * 0.125 +
          50 * 0.2 +
          100 * 0.5) *
          (long ? 5 : 1)) /
          1e6,
        12
      );
    }
  );
  it("keeps compute/paygate without hints and requires counts for endpoint strict", () => {
    expect(
      computeEstimate({ provider: "anthropic", payload }).usd
    ).toBeGreaterThan(0);
    expect(estimate().status).toBe("unavailable");
    expect(
      computeEstimate({ provider: "anthropic", payload, costHints: counts }).usd
    ).toBeCloseTo(0.0021, 12);
  });
  it.each([-1, 201, 0.5, NaN, Infinity])(
    "rejects invalid 1h subset %s",
    (cacheWrite1hInputTokens) =>
      expect(
        estimate(payload, { ...counts, cacheWrite1hInputTokens }).status
      ).toBe("unavailable")
  );
  it("requires the split when 1h is declared and writes are positive", () => {
    expect(estimate(hour, counts).warnings.join(" ")).toContain(
      "costHints.cacheWrite1hInputTokens"
    );
    expect(estimate(hour, { ...counts, cacheWriteInputTokens: 0 }).status).toBe(
      "priced"
    );
    expect(estimate(payload, counts).usd).toBeCloseTo(0.0021, 12);
  });
  it.each([
    { speed: "fast" },
    { inference_geo: "us" },
    { service_tier: "priority" },
    { cache_control: { ttl: "12h" } },
  ])("fails closed for unsupported setting %j", (setting) =>
    expect(estimate({ ...payload, ...setting }, counts).status).toBe(
      "unavailable"
    )
  );
  it("keeps tools incomplete", () => {
    const result = estimate(
      { ...payload, tools: [{ name: "search" }] },
      counts
    );
    expect(result.usd).toBeGreaterThan(0);
    expect(result.warnings.join(" ")).toContain("tool");
    expect(
      actual(reported, { ...payload, tools: [{ name: "search" }] }).derivedUsd
    ).toBeNull();
  });
  it.each(["5m", "1h"])("forecasts highest nested TTL %s", (ttl) => {
    const result = estimate(
      {
        ...payload,
        system: [{ type: "text", text: "", cache_control: { ttl } }],
      },
      undefined,
      "forecast"
    );
    expect(result.range?.low).toBeCloseTo((3 * 0.3) / 1e6, 12);
    expect(result.range?.high).toBeCloseTo(
      (3 * (ttl === "1h" ? 6 : 3.75) + 100 * 15) / 1e6,
      12
    );
    expect(result.usd).toBe(result.range?.high);
    expect(result.warnings.join(" ")).toContain("tokenizer");
  });
  it("rejects an unknown TTL even in forecast", () => {
    const result = estimate(
      { ...payload, cache_control: { ttl: "1d" } },
      undefined,
      "forecast"
    );
    expect(result.status).toBe("unavailable");
    expect(result.warnings.join(" ")).toContain("cache_control.ttl");
  });
  it("sums per-item batch forecasts at half price", () => {
    const second = { ...hour, model: "claude-opus-5-5" };
    const result = estimate(
      { requests: [{ params: payload }, { params: second }] },
      undefined,
      "forecast",
      "v1.messages.batches"
    );
    const a = estimate(payload, undefined, "forecast");
    const b = estimate(second, undefined, "forecast");
    expect(result.status).toBe("priced");
    expect(result.usd).toBeCloseTo((a.usd + b.usd) / 2, 12);
    expect(result.range?.low).toBeCloseTo(
      (a.range!.low + b.range!.low) / 2,
      12
    );
    expect(result.notes?.join(" ")).toContain("50%");
    expect(
      estimate(
        { requests: [{ params: payload }] },
        counts,
        "strict",
        "v1.messages.batches"
      ).status
    ).toBe("unavailable");
  });
  it.each([
    {},
    { model: "not-real" },
    { ...payload, max_tokens: -1 },
    { ...payload, cache_control: { ttl: "1d" } },
  ])("rejects entire batch with invalid item %j", (bad) => {
    const result = estimate(
      { requests: [{ params: payload }, { params: bad }] },
      undefined,
      "forecast",
      "v1.messages.batches"
    );
    expect(result.status).toBe("unavailable");
    expect(result.usd).toBe(0);
    expect(result.warnings.join(" ")).toContain("[1]");
  });
});

describe("Anthropic actual cache split", () => {
  it.each([
    { ephemeral_5m_input_tokens: 120, ephemeral_1h_input_tokens: 80 },
    { ephemeral_5m_input_tokens: 120 },
    { ephemeral_1h_input_tokens: 80 },
  ])("derives full or inferred split %j", (cache_creation) => {
    const result = actual({ ...reported, cache_creation }, hour);
    expect(result.usage.cacheWrite1hInputTokens).toBe(80);
    expect(result.usage.inputTokens).toBe(1300);
    expect(result.derivedUsd).toBeCloseTo(0.00228, 12);
    expect(mergeActuals([result, result]).usage.cacheWrite1hInputTokens).toBe(
      80
    );
  });
  it("reconstructs total from a complete split", () => {
    const result = actual({
      ...reported,
      cache_creation_input_tokens: undefined,
      cache_creation: {
        ephemeral_5m_input_tokens: 120,
        ephemeral_1h_input_tokens: 80,
      },
    });
    expect(result.usage.cacheWriteInputTokens).toBe(200);
    expect(result.derivedUsd).toBeCloseTo(0.00228, 12);
  });
  it.each([
    { ephemeral_5m_input_tokens: 200, ephemeral_1h_input_tokens: 80 },
    { ephemeral_1h_input_tokens: 201 },
    { ephemeral_1h_input_tokens: -1 },
    { ephemeral_1h_input_tokens: "80" },
    { ephemeral_1h_input_tokens: 0.5 },
  ])("never derives inconsistent split %j", (cache_creation) => {
    expect(actual({ ...reported, cache_creation }).derivedUsd).toBeNull();
  });
  it("total-only derives at 5m unless request declares 1h", () => {
    expect(actual(reported).derivedUsd).toBeCloseTo(0.0021, 12);
    expect(actual(reported, hour).derivedUsd).toBeNull();
    expect(actual(reported, hour).warnings.join(" ")).toContain(
      "cacheWrite1hInputTokens"
    );
  });
  it("prices committed Anthropic message usage with cache evidence", () => {
    const har = JSON.parse(
      readFileSync(
        "tests/recordings/anthropic_2966493235/messages-code-review_891889396/recording.har",
        "utf8"
      )
    );
    const exchange: ProviderExchange = entryToProviderExchange(
      har.log.entries[0],
      { provider: "anthropic" }
    );
    const result = extractActual(exchange);
    expect(result.derivedUsd).toBeCloseTo(0.001299, 12);
    expect(result.usage.cacheWrite1hInputTokens).toBe(0);
    expect(result.rateAsOf).toBe("2026-11-04");
  });
  it("does not change KIE Claude rates", () => {
    const request = {
      provider: "kie" as const,
      payload: { model: "claude-sonnet-4-6" },
      costHints: counts,
    };
    expect(
      computeEstimate({
        ...request,
        costHints: { ...counts, cacheWrite1hInputTokens: 80 },
      })
    ).toEqual(computeEstimate(request));
  });
});
