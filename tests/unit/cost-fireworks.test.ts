import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  computeEstimate,
  estimateEndpoint,
  extractActual,
  endpointBilling,
  PRICING,
} from "@apicity/cost";
import { entryToProviderExchange } from "@apicity/har";
import { fireworksSizeRate } from "../../packages/provider/cost/src/pricing/fireworks";
import snapshot from "../fixtures/fireworks-pricing-2026-11-04.json";

const estimate = (
  payload: Record<string, unknown>,
  dotPath = "inference.v1.chat.completions",
  costHints?: Parameters<typeof estimateEndpoint>[0]["costHints"]
) =>
  estimateEndpoint({
    provider: "fireworks",
    method: "POST",
    dotPath,
    payload,
    costHints,
  });
const usage = {
  inputTokens: 1000,
  outputTokens: 100,
  cacheReadInputTokens: 200,
};

describe("Fireworks dated serverless pricing", () => {
  it.each(Object.entries(snapshot.standard))(
    "prices named model %s including cached input",
    (model, rate) => {
      const result = estimate({ model }, undefined, usage);
      expect(result.status).toBe("priced");
      expect(result.usd).toBeCloseTo(
        (800 * rate.input + 200 * rate.cacheRead + 100 * rate.output) / 1e6,
        12
      );
      expect(result.rateAsOf).toBe(snapshot.asOf);
      expect(result.warnings).toEqual([]);
    }
  );
  it.each(Object.entries(snapshot.priority))(
    "selects documented priority for %s",
    (model, rate) => {
      const result = estimate(
        { model, service_tier: "priority" },
        undefined,
        usage
      );
      expect(result.status).toBe("priced");
      expect(result.usd).toBeCloseTo(
        (800 * rate.input + 200 * rate.cacheRead + 100 * rate.output) / 1e6,
        12
      );
    }
  );
  it.each([
    [3_999_999_999, false, 0.1],
    [4e9, false, 0.2],
    [16e9, false, 0.2],
    [16e9 + 1, false, 0.9],
    [56e9, true, 0.5],
    [56e9 + 1, true, undefined],
    [56.1e9, true, 1.2],
    [176e9, true, 1.2],
    [176e9 + 1, true, undefined],
    [0, false, undefined],
    [NaN, false, undefined],
  ] as const)("pins size boundary %s / MoE %s", (size, moe, rate) =>
    expect(fireworksSizeRate(size, moe)).toBe(rate)
  );

  it("uses pinned metadata, including cached input at the uniform band rate", () => {
    const result = estimate(
      { model: "accounts/fireworks/models/llama-v3p3-70b-instruct" },
      undefined,
      usage
    );
    expect(result.usd).toBeCloseTo((1100 * 0.9) / 1e6, 12);
    expect(result.notes?.join(" ")).toContain("pinned model metadata");
    expect(result.warnings).toEqual([]);
  });

  it.each([
    "deepseek-v4-pro",
    "deepseek-v3",
    "glm-5",
    "glm-5.1",
    "kimi-k2.6",
    "qwen3-vl-30b",
    "invented-70b",
  ])("does not reuse an unsupported price or infer size from %s", (model) => {
    const result = estimate({ model }, undefined, usage);
    expect(result.status).toBe("unavailable");
    expect(result.warnings.join(" ")).toContain(model);
  });
  it("fails closed when the model is missing", () =>
    expect(estimate({}).warnings.join(" ")).toContain("payload.model"));

  it.each([
    [{ service_tier: "fast" }, undefined, "serviceTier"],
    [{ service_tier: "spot" }, undefined, "serviceTier"],
    [{ service_tier: "batch" }, undefined, "serviceTier"],
    [{ region: "eu" }, undefined, "region"],
    [{ batch: true }, undefined, "batch"],
    [{}, { regionalProcessing: true }, "regionalProcessing"],
  ] as const)("fails closed on unbundled modes %j", (payload, extra, field) => {
    const result = estimate(
      { model: "accounts/fireworks/models/kimi-k3", ...payload },
      undefined,
      { ...usage, ...extra }
    );
    expect(result.status).toBe("unavailable");
    expect(result.warnings.join(" ")).toContain(field);
  });
  it("uses router IDs for Fast/US, rejects priority on Fast and does not double-charge US", () => {
    expect(
      estimate(
        {
          model: "accounts/fireworks/routers/kimi-k3-fast",
          service_tier: "priority",
        },
        undefined,
        usage
      ).status
    ).toBe("unavailable");
    const result = estimate(
      { model: "accounts/fireworks/routers/kimi-k3-us" },
      undefined,
      { ...usage, regionalProcessing: true }
    );
    expect(result.usd).toBeCloseTo(
      (800 * 4.5 + 200 * 0.45 + 100 * 22.5) / 1e6,
      12
    );
  });
  it("does not ignore incomplete/invalid token hints", () => {
    const model = "accounts/fireworks/models/ember-1";
    expect(estimate({ model }, undefined, { inputTokens: 100 }).status).toBe(
      "unavailable"
    );
    expect(
      estimate({ model }, undefined, { ...usage, cacheReadInputTokens: 1001 })
        .status
    ).toBe("unavailable");
    expect(
      estimate({ model }, undefined, { ...usage, outputTokens: -1 }).status
    ).toBe("unavailable");
  });
  it("keeps tool incompleteness warnings", () =>
    expect(
      estimate(
        {
          model: "accounts/fireworks/models/ember-1",
          tools: [{ type: "function" }],
        },
        undefined,
        usage
      ).warnings.join(" ")
    ).toContain("tool"));
});

describe("Fireworks input-only routes", () => {
  it.each(Object.entries(snapshot.embeddingInput))(
    "prices input for %s",
    (model, rate) => {
      const endpoint = model.endsWith("reranker-8b")
        ? "inference.v1.rerank"
        : "inference.v1.embeddings";
      const result = estimate({ model }, endpoint, { inputTokens: 1000 });
      expect(result.status).toBe("priced");
      expect(result.usd).toBeCloseTo((1000 * rate) / 1e6, 12);
      expect(result.warnings).toEqual([]);
    }
  );
  it.each([
    ["12345678", 2],
    [["1234", "12345678"], 3],
    [[1, 2, 3], 3],
    [[[1, 2], [3]], 3],
  ])("handles embedding input %j", (input, tokens) => {
    const result = estimate(
      { model: "nomic-ai/nomic-embed-text-v1.5", input },
      "inference.v1.embeddings"
    );
    expect(result.status).toBe("priced");
    expect(result.usd).toBeCloseTo((Number(tokens) * 0.008) / 1e6, 12);
  });
  it.each([[], [""], [1, "x"], [[1, -1]], null].map((input) => [input]))(
    "fails closed on invalid input %j",
    (input) => {
      expect(
        estimate(
          { model: "nomic-ai/nomic-embed-text-v1.5", input },
          "inference.v1.embeddings"
        ).status
      ).toBe("unavailable");
    }
  );
  it("requires rerank token counts for model-specific query/document templates", () => {
    const result = estimate(
      {
        model: "fireworks/qwen3-reranker-8b",
        query: "hello",
        documents: ["world"],
      },
      "inference.v1.rerank"
    );
    expect(result.status).toBe("unavailable");
    expect(result.warnings.join(" ")).toContain("costHints.inputTokens");
  });
  it("does not reuse embedding rates for chat, unknown models or dedicated Voyage", () => {
    expect(
      estimate({ model: "fireworks/qwen3-embedding-8b" }, undefined, usage)
        .status
    ).toBe("unavailable");
    expect(
      estimate(
        { model: "accounts/fireworks/models/ember-1" },
        "inference.v1.embeddings",
        { inputTokens: 1 }
      ).status
    ).toBe("unavailable");
    expect(
      estimate(
        { model: "fireworks/voyage-rerank-2-5" },
        "inference.v1.rerank",
        { inputTokens: 1 }
      ).status
    ).toBe("unavailable");
  });
  it("rejects positive output usage on input-only calls", () =>
    expect(
      estimate(
        { model: "fireworks/qwen3-embedding-8b" },
        "inference.v1.embeddings",
        { inputTokens: 10, outputTokens: 1 }
      ).status
    ).toBe("unavailable"));
});

describe("Fireworks recorded usage and unpriced families", () => {
  it.each([
    ["chat-hello_1014512442", 0.9],
    ["completions-hello_1494555809", 0.9],
    ["messages-hello_2213350000", 0.9],
    ["chat-stream-hello_2801342443", 0.9],
    ["messages-stream-hello_3161538389", 0.9],
    ["embeddings-hello_1385297234", 0.008],
    ["rerank-basic_678261817", 0.2],
  ] as const)(
    "derives %s from captured tokens and the dated list rate",
    (dir, rate) => {
      const har = JSON.parse(
        readFileSync(
          `tests/recordings/fireworks_626462085/${dir}/recording.har`,
          "utf8"
        )
      );
      const exchange = entryToProviderExchange(har.log.entries[0], {
        provider: "fireworks",
      });
      const result = extractActual(exchange);
      expect(result.usage.inputTokens).toBeGreaterThan(0);
      expect(result.derivedUsd).toBeCloseTo(
        (((result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0)) *
          rate) /
          1e6,
        12
      );
      expect(result.rateAsOf).toBe("2026-11-04");
    }
  );
  it.each([
    "inference.v1.audio.batch.transcriptions",
    "inference.v1.audio.batch.translations",
    "inference.v1.audio.transcriptions",
    "inference.v1.audio.translations",
  ])("keeps unpublished %s unavailable", (path) => {
    const result = estimate(
      { model: "accounts/fireworks/models/ember-1" },
      path,
      usage
    );
    expect(result.status).toBe("unavailable");
    expect(result.billing.kind).toBe("unpriced");
  });
  it.each(["kontext", "textToImage", "getResult"])(
    "has no billing record for the removed workflows.%s",
    (leaf) => {
      const billing = endpointBilling(
        "fireworks",
        "POST",
        `inference.v1.workflows.${leaf}`
      );
      expect(billing.kind).toBe("unpriced");
      expect(billing.reason).toBe(
        "No reviewed billing record for this endpoint"
      );
    }
  );
  it.each([
    "inference.v1.audio.batch.transcriptions",
    "inference.v1.audio.batch.translations",
    "inference.v1.audio.transcriptions",
    "inference.v1.audio.translations",
  ])("records why %s stays unpriced, with no rate", (path) => {
    const billing = endpointBilling("fireworks", "POST", path);
    expect(billing.kind).toBe("unpriced");
    expect(billing.reason).toContain("last listed 2026-04-29");
    expect(billing.reason).toContain("gone by 2026-05-06");
    expect(billing.reason).toContain(
      "deprecated audio inference on 2026-06-10"
    );
    expect(billing.reason).toContain("ruling ac-8l1x3z, no follow-up");
  });
  it.each([
    "inference.v1.accounts.batchInferenceJobs.create",
    "inference.v1.accounts.deployments.create",
    "inference.v1.accounts.supervisedFineTuningJobs.create",
  ])("preserves accrual for %s", (path) =>
    expect(endpointBilling("fireworks", "POST", path).kind).toBe("accrual")
  );
  it("carries Fireworks request tiers and US host into actual derivation", () => {
    const har = JSON.parse(
      readFileSync(
        "tests/recordings/fireworks_626462085/chat-hello_1014512442/recording.har",
        "utf8"
      )
    );
    const exchange = entryToProviderExchange(har.log.entries[0], {
      provider: "fireworks",
    });
    // Synthetic variants of the existing exchange test derivation only; no receipt is recorded.
    exchange.requestBody = {
      ...exchange.requestBody,
      model: "accounts/fireworks/models/ember-1",
      service_tier: "priority",
    };
    const actual = extractActual(exchange);
    expect(actual.derivedUsd).toBeCloseTo(
      (1 * 3.75 + 40 * 0.375 + 26 * 18.75) / 1e6,
      12
    );
    exchange.responseBody = {
      ...(exchange.responseBody as Record<string, unknown>),
      service_tier: "standard",
    };
    expect(extractActual(exchange).derivedUsd).toBeCloseTo(
      (1 * 3 + 40 * 0.3 + 26 * 15) / 1e6,
      12
    );
    exchange.url = exchange.url.replace(
      "api.fireworks.ai",
      "us.api.fireworks.ai"
    );
    expect(extractActual(exchange).derivedUsd).toBeNull();
  });
  it("direct calls cannot accidentally price audio with a chat model", () => {
    expect(
      computeEstimate({
        provider: "fireworks",
        endpoint: "audio",
        payload: { model: "accounts/fireworks/models/ember-1" },
        costHints: usage,
      }).breakdown.inputUsdPerMillion
    ).toBeUndefined();
  });
  it("pins every new pricing key to current evidence", () => {
    expect(Object.keys(PRICING.fireworks).sort()).toEqual(
      [
        ...Object.keys(snapshot.standard),
        ...Object.keys(snapshot.modelSizes),
        ...Object.keys(snapshot.embeddingInput),
      ].sort()
    );
  });
});
