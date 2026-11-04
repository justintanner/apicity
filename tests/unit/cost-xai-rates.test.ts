import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  computeEstimate,
  estimateEndpoint,
  extractActual,
  classifyEstimate,
  type CostHints,
} from "@apicity/cost";
import { PRICING } from "../../packages/provider/cost/src/pricing/index";
import { entryToProviderExchange, type HarEntry } from "@apicity/har";

const estimate = (
  model: string,
  costHints?: CostHints,
  payload: Record<string, unknown> = {}
) =>
  estimateEndpoint({
    provider: "xai",
    method: "POST",
    dotPath: "v1.responses",
    payload: { model, ...payload },
    costHints,
  });
const counts = {
  inputTokens: 1000,
  cacheReadInputTokens: 200,
  outputTokens: 100,
};
const recordedExchange = (name: string) => {
  const har = JSON.parse(
    readFileSync(
      new URL(
        `../recordings/xai_3613880225/${name}/recording.har`,
        import.meta.url
      ),
      "utf8"
    )
  ) as { log: { entries: HarEntry[] } };
  const entry = har.log.entries.find((e) => e.request.method === "POST")!;
  return entryToProviderExchange(entry, { provider: "xai" });
};

describe("xAI November 2026 pricing", () => {
  it.each([
    ["grok-4.7", 2, 0.5, 6],
    ["grok-4.6", 2, 0.5, 6],
    ["grok-4.5", 2, 0.3, 6],
    ["grok-4.3", 1.25, 0.2, 2.5],
    ["grok-4.20-0309-reasoning", 1.25, 0.2, 2.5],
    ["grok-4.20-0309-non-reasoning", 1.25, 0.2, 2.5],
    ["grok-4.20-multi-agent-0309", 1.25, 0.2, 2.5],
    ["grok-build-0.1", 1, 0.2, 2],
  ] as const)(
    "reprices all tokens at the exact 200K boundary: %s",
    (model, input, cached, output) => {
      for (const total of [199999, 200000, 200001]) {
        const result = estimate(model, {
          inputTokens: total,
          cacheReadInputTokens: 100000,
          outputTokens: 100,
        });
        const multiplier = total >= 200000 ? 2 : 1;
        expect(result.status).toBe("priced");
        expect(result.usd).toBeCloseTo(
          (((total - 100000) * input + 100000 * cached + 100 * output) *
            multiplier) /
            1e6,
          12
        );
        expect(result.breakdown.contextTier).toBe(
          multiplier === 2 ? "long" : "short"
        );
        expect(result.rateAsOf).toBe("2026-11-04");
      }
    }
  );

  it("compares historical catalog prices without copying stale 4.20 rates", () => {
    const har = JSON.parse(
      readFileSync(
        new URL(
          "../recordings/xai_3613880225/language-models-list_3294070707/recording.har",
          import.meta.url
        ),
        "utf8"
      )
    );
    const catalog = JSON.parse(har.log.entries[0].response.content.text)
      .models as Array<{
      id: string;
      aliases: string[];
      prompt_text_token_price: number;
      cached_prompt_text_token_price: number;
      completion_text_token_price: number;
    }>;
    // The historical feed also predates the 2026-05-15 retirement.
    for (const [model, input] of [
      ["grok-4", 3],
      ["grok-4-fast", 0.2],
    ] as const) {
      const recorded = catalog.find(
        (row) => row.id === model || row.aliases.includes(model)
      )!;
      expect(recorded.prompt_text_token_price / 1e4).toBe(input);
      expect(PRICING.xai[model]).toMatchObject({
        rate: { input: 1.25, cacheRead: 0.2, output: 2.5 },
      });
    }
    const oldCode = catalog.find((row) => row.id === "grok-code-fast-1")!;
    expect(oldCode.prompt_text_token_price / 1e4).toBe(0.2);
    expect(PRICING.xai[oldCode.id]).toMatchObject({
      rate: { input: 1, cacheRead: 0.2, output: 2 },
    });
    // The historical feed predates the current 1.25/0.2/2.5 card.
    const old = catalog.find((row) => row.id === "grok-4.20-0309-reasoning")!;
    expect(old.prompt_text_token_price / 1e4).toBe(2);
    expect(PRICING.xai[old.id]).toMatchObject({
      rate: { input: 1.25, cacheRead: 0.2, output: 2.5 },
    });
  });

  it("resolves current aliases to the same pricing row", () => {
    expect(PRICING.xai["grok-4.20-reasoning"]).toBe(
      PRICING.xai["grok-4.20-0309-reasoning"]
    );
    expect(PRICING.xai["grok-build-latest"]).toBe(PRICING.xai["grok-4.5"]);
    expect(PRICING.xai["grok-code-fast"]).toBe(PRICING.xai["grok-build-0.1"]);
  });

  // https://docs.x.ai/developers/migration/may-15-retirement.md
  it.each(["grok-4", "grok-3", "grok-4-fast", "grok-4-1-fast"])(
    "bills retired %s as grok-4.3",
    (model) => {
      expect(PRICING.xai[model]).toBe(PRICING.xai["grok-4.3"]);
    }
  );

  it("requires declared counts in strict and forecast modes for long-context rows", () => {
    for (const mode of ["strict", "forecast"] as const) {
      const result = estimateEndpoint({
        provider: "xai",
        method: "POST",
        dotPath: "v1.responses",
        mode,
        payload: { model: "grok-4.7", input: "hello", max_output_tokens: 20 },
      });
      expect(result.status).toBe("unavailable");
      expect(result.warnings.join(" ")).toContain("costHints.inputTokens");
      expect(classifyEstimate(result)).toBe("prohibitive");
    }
    expect(
      estimate("grok-4.7", { inputTokens: 10 }).warnings.join(" ")
    ).toContain("costHints.cacheReadInputTokens");
  });

  it("asks a retired slug for declared counts, then prices grok-4.3's rates", () => {
    const result = estimate("grok-4-fast", undefined, {
      input: "hello",
      max_output_tokens: 20,
    });
    expect(result.source).toBe("declared-tokens+table");
    expect(result.status).toBe("unavailable");
    expect(classifyEstimate(result)).toBe("prohibitive");
    expect(estimate("grok-4-fast", counts).usd).toBeCloseTo(0.00129, 12);
  });

  it("prices confirmed priority and supported US processing, including their combination", () => {
    const standard = estimate("grok-4.7", counts);
    const result = estimate("grok-4.7", {
      ...counts,
      serviceTier: "priority",
      regionalProcessing: true,
    });
    expect(result.usd).toBeCloseTo(standard.usd * 2.2, 12);
    expect(result.breakdown.inputUsdPerMillion).toBe(4.4);
    expect(
      estimate(
        "grok-4.7",
        { ...counts, serviceTier: "default" },
        { service_tier: "priority" }
      ).usd
    ).toBe(standard.usd);
    for (const serviceTier of ["batch", "flex", "unknown"]) {
      const failed = estimate("grok-4.7", { ...counts, serviceTier });
      expect(failed.status).toBe("unavailable");
      expect(failed.usd).toBe(0);
      expect(failed.warnings.join(" ")).toContain("serviceTier");
    }
    expect(
      estimate("grok-4.5", { ...counts, regionalProcessing: true }).status
    ).toBe("unavailable");
    expect(
      estimate("grok-4.7", {
        ...counts,
        regionalProcessing: "EU" as unknown as boolean,
      }).status
    ).toBe("unavailable");
  });

  it("retains the token number with a tool-fee warning", () => {
    const result = estimate("grok-4.7", counts, {
      tools: [{ type: "web_search" }],
    });
    expect(result.usd).toBe(estimate("grok-4.7", counts).usd);
    expect(result.warnings.join(" ")).toContain("tool fees");
  });

  it("derives the committed charge exactly to the tick", () => {
    const exchange = recordedExchange("grok-4-6-responses_2467291669");
    const actual = extractActual(exchange);
    expect(actual.statedUsd).toBe(10180000 / 1e10);
    expect(actual.derivedUsd).not.toBeNull();
    expect(Math.round(actual.derivedUsd! * 1e10)).toBe(10180000);
    expect(actual.warnings).toEqual([]);
    const toolActual = extractActual({
      ...exchange,
      requestBody: {
        ...exchange.requestBody,
        tools: [{ type: "web_search" }],
      },
    });
    expect(toolActual.derivedUsd).toBeNull();
  });

  // xAI's team usage for 2026-06-27 bills this grok-4-fast call as grok-4.3, at
  // exactly its units: 444 prompt, 128 cached, 237 completion and 607 reasoning.
  it("derives what xAI billed for a retired slug", () => {
    const actual = extractActual(
      recordedExchange("responses-compact_101159155")
    );
    expect(actual.statedUsd).toBeNull();
    expect(Math.round(actual.derivedUsd! * 1e10)).toBe(26906000);
    expect(actual.usd).toBe(actual.derivedUsd);
  });

  // These billed the old rates, before the retirement, so what they state stands.
  it.each([
    ["responses-crud-create_10211913", 859500],
    ["responses-create_280461930", 600500],
    ["vision-analysis-json_243984103", 174442500],
    ["responses-crud-delete_2661153406", 1304500],
    ["responses-crud-get_2571518523", 1386500],
  ] as const)(
    "keeps the charge stated before the retirement: %s",
    (name, ticks) => {
      const actual = extractActual(recordedExchange(name));
      expect(actual.statedUsd).toBe(ticks / 1e10);
      expect(actual.usd).toBe(ticks / 1e10);
      expect(Math.round(actual.derivedUsd! * 1e10)).not.toBe(ticks);
    }
  );

  it("uses the response tier and US hostname for derived actuals", () => {
    const har = JSON.parse(
      readFileSync(
        new URL(
          "../recordings/xai_3613880225/grok-4-6-responses_2467291669/recording.har",
          import.meta.url
        ),
        "utf8"
      )
    ) as { log: { entries: HarEntry[] } };
    const exchange = entryToProviderExchange(har.log.entries[0], {
      provider: "xai",
    });
    const body = exchange.responseBody as Record<string, unknown>;
    const standard = extractActual(exchange).derivedUsd!;
    const us = extractActual({
      ...exchange,
      url: "https://us.api.x.ai/v1/responses",
      responseBody: { ...body, service_tier: "priority" },
    });
    expect(us.derivedUsd).toBeCloseTo(standard * 2.2, 12);
    const downgraded = extractActual({
      ...exchange,
      requestBody: { ...exchange.requestBody, service_tier: "priority" },
      responseBody: { ...body, service_tier: "default" },
    });
    expect(downgraded.derivedUsd).toBe(standard);
  });

  it.each([
    ["v1.tts", "POST", { text: "a".repeat(1000) }, undefined, 0.015],
    ["v1.stt", "POST", {}, { durationSeconds: 3600 }, 0.1],
    ["v1.documents.search", "POST", {}, undefined, 0.0025],
    ["v1.files.content", "GET", {}, { downloadBytes: 2 ** 30 }, 0.2],
  ] as const)(
    "prices %s in its documented units",
    (dotPath, method, payload, costHints, usd) => {
      const result = estimateEndpoint({
        provider: "xai",
        method,
        dotPath,
        payload,
        costHints,
      });
      expect(result.status).toBe("priced");
      expect(result.billing.kind).toBe("metered");
      expect(result.usd).toBeCloseTo(usd, 12);
    }
  );

  it.each([undefined, 0, -1, NaN, Infinity, "1024"])(
    "fails closed on missing/invalid download bytes: %s",
    (downloadBytes) => {
      const result = estimateEndpoint({
        provider: "xai",
        method: "GET",
        dotPath: "v1.files.content",
        costHints: { downloadBytes: downloadBytes as number },
      });
      expect(result.status).toBe("unavailable");
      expect(result.warnings.join(" ")).toContain("costHints.downloadBytes");
    }
  );

  it("requires a REST speech duration and keeps accrual rows unavailable", () => {
    expect(
      estimateEndpoint({
        provider: "xai",
        method: "POST",
        dotPath: "v1.stt",
      }).warnings.join(" ")
    ).toContain("costHints.durationSeconds");
    for (const dotPath of [
      "v1.files",
      "v1.batches.requests",
      "managementApi.v1.collections.documents",
    ]) {
      expect(
        estimateEndpoint({ provider: "xai", method: "POST", dotPath }).status
      ).toBe("unavailable");
    }
  });

  it("preserves media rates, ignores text hints for media, and never mutates payload", () => {
    const payload = Object.freeze({
      model: "grok-imagine-video-1.5",
      duration: 10,
      resolution: "720p",
    });
    const result = computeEstimate({
      provider: "xai",
      payload,
      costHints: {
        ...counts,
        serviceTier: "batch",
        regionalProcessing: true,
        downloadBytes: 100,
      },
    });
    expect(result.usd).toBeCloseTo(1.4, 12);
    expect(classifyEstimate(result)).toBe("prohibitive");
    expect(
      computeEstimate({
        provider: "xai",
        payload: { model: "grok-imagine-image", n: 2 },
      }).usd
    ).toBe(0.04);
    expect(payload).toEqual({
      model: "grok-imagine-video-1.5",
      duration: 10,
      resolution: "720p",
    });
  });
});
