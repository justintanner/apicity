import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  computeEstimate,
  estimateEndpoint,
  type CostHints,
} from "@apicity/cost";
import { PRICING } from "../../packages/provider/cost/src/pricing/index";
import evidence from "../fixtures/kie-pricing-evidence/chat-models-2026-11-04.json";

const counts: CostHints = {
  inputTokens: 1_000_000,
  outputTokens: 100_000,
  cacheReadInputTokens: 200_000,
  cacheWriteInputTokens: 100_000,
};
const estimate = (model: string, costHints?: CostHints, payload = {}) =>
  estimateEndpoint({
    provider: "kie",
    method: "POST",
    dotPath: "openai.v1.responses",
    payload: { model, ...payload },
    costHints,
  });

describe("KIE published chat rates", () => {
  it.each(evidence.models)(
    "prices $id using the public credit basis",
    (model) => {
      const rate = model.ratesUsdPerMillion;
      expect(PRICING.kie[model.id]).toMatchObject({ kind: "tokens", rate });
      const read = "cacheRead" in rate ? 200_000 : 0;
      const write = "cacheWrite" in rate ? 100_000 : 0;
      const result = estimate(model.id, {
        ...counts,
        cacheReadInputTokens: read,
        cacheWriteInputTokens: write,
      });
      expect(result.status).toBe("priced");
      expect(result.usd).toBeCloseTo(
        ((1_000_000 - read - write) * rate.input +
          100_000 * rate.output +
          read * (rate.cacheRead ?? 0) +
          write * (rate.cacheWrite ?? 0)) /
          1e6,
        12
      );
    }
  );

  it.each([
    ["gemini.v1.models.gemini36Flash.streamGenerateContent", 0.225, 1.125],
    ["gemini.v1.models.gemini37Flash.streamGenerateContent", 0.225, 1.125],
    ["gemini.v1.models.gemini38Flash.streamGenerateContent", 0.225, 1.125],
    ["gemini36FlashOpenai.v1.chat.completions", 0.225, 1.125],
    ["gemini37FlashOpenai.v1.chat.completions", 0.225, 1.125],
    ["gemini38FlashOpenai.v1.chat.completions", 0.225, 1.125],
    ["gemini31Pro.v1.chat.completions", 0.5, 3.5],
    ["gemini3Pro.v1.chat.completions", 0.5, 3.5],
    ["gemini4ArgonOpenai.v1.chat.completions", 0.8, 4],
    ["gpt52.v1.chat.completions", 0.4375, 3.5],
  ] as const)(
    "prices fixed route %s without payload.model",
    (dotPath, input, output) => {
      const result = estimateEndpoint({
        provider: "kie",
        method: "POST",
        dotPath,
        costHints: { inputTokens: 1e6, outputTokens: 1e6 },
      });
      expect(result.status).toBe("priced");
      expect(result.usd).toBe(input + output);
      expect(result.billing.kind).toBe("metered");
    }
  );

  it.each([
    "anthropic.v1.messages",
    "claude.v1.messages",
    "codex.v1.responses",
    "openai.v1.responses",
    "api.v1.responses",
    "grok.v1.responses",
    "xai.v1.responses",
  ])("selects the payload model on %s", (dotPath) => {
    const result = estimateEndpoint({
      provider: "kie",
      method: "POST",
      dotPath,
      payload: { model: "grok-4-7" },
      costHints: {
        inputTokens: 1000,
        outputTokens: 100,
        cacheReadInputTokens: 200,
      },
    });
    expect(result.status).toBe("priced");
    expect(result.usd).toBeCloseTo(0.00092, 12);
  });

  it.each([
    "gemini.v1.models.gemini35Flash.streamGenerateContent",
    "gemini35FlashOpenai.v1.chat.completions",
    "api.v1.suno.recovery",
  ])("keeps unpublished route %s unavailable", (dotPath) => {
    const result = estimateEndpoint({
      provider: "kie",
      method: "POST",
      dotPath,
      costHints: counts,
    });
    expect(result.status).toBe("unavailable");
    expect(result.billing.kind).toBe("unpriced");
  });

  it("quotes zero for retired Gemini 2.5 Pro, because the docs say it is not charged", () => {
    const result = estimateEndpoint({
      provider: "kie",
      method: "POST",
      dotPath: "gemini25Pro.v1.chat.completions",
      costHints: counts,
    });
    expect(result).toMatchObject({ usd: 0, status: "zero", source: "free" });
    expect(result.billing.kind).toBe("free");
  });

  it("does not borrow a newer model rate or invent a missing media rate", () => {
    for (const model of [
      "gemini-2-5-pro",
      "gemini-3-5-flash",
      "elevenlabs/sound-effect-v2",
      "suno/recovery",
      "unknown-model",
    ]) {
      expect(PRICING.kie[model]).toBeUndefined();
      expect(estimate(model, counts).status).toBe("unavailable");
    }
  });

  it("requires explicit counts, including published cache counts", () => {
    expect(estimate("gpt-6-1-terra").status).toBe("unavailable");
    expect(
      estimate("gpt-6-1-terra", { inputTokens: 100, outputTokens: 5 }).status
    ).toBe("unavailable");
    expect(estimate("claude-opus-5", { inputTokens: 100 }).status).toBe(
      "unavailable"
    );
    expect(
      estimate("gpt-6-1-terra", { ...counts, cacheReadInputTokens: 1_000_001 })
        .status
    ).toBe("unavailable");
  });

  it("refuses unsupported cached usage instead of quoting uncached rates", () => {
    expect(estimate("claude-opus-5", counts).status).toBe("unavailable");
    expect(
      estimate("claude-opus-5", {
        inputTokens: 10,
        outputTokens: 1,
        cacheReadInputTokens: NaN,
      }).status
    ).toBe("unavailable");
  });

  it.each(["priority", "batch", "flex"])(
    "refuses unpublished %s processing",
    (serviceTier) => {
      expect(estimate("gpt-6-1-terra", { ...counts, serviceTier }).status).toBe(
        "unavailable"
      );
      expect(
        estimate("gpt-6-1-terra", counts, { service_tier: serviceTier }).status
      ).toBe("unavailable");
    }
  );

  it("refuses regional processing and marks tool estimates incomplete", () => {
    expect(
      estimate("gpt-6-1-terra", { ...counts, regionalProcessing: true }).status
    ).toBe("unavailable");
    const result = estimate("gpt-6-1-terra", counts, {
      tools: [{ type: "web_search" }],
    });
    expect(result.usd).toBeGreaterThan(0);
    expect(result.status).toBe("priced");
    expect(result.warnings.join(" ")).toContain("tool fees");
  });

  it("keeps the recorded GPT-5.5 spelling at the same published rate", () => {
    const har = JSON.parse(
      readFileSync(
        new URL(
          "../recordings/kie_2079838932/openai-responses-codex_3724448548/recording.har",
          import.meta.url
        ),
        "utf8"
      )
    );
    const entry = har.log.entries.find(
      (row: { request: { method: string } }) => row.request.method === "POST"
    );
    const model = JSON.parse(entry.request.postData.text).model;
    expect(model).toBe("gpt-5.5");
    expect(
      computeEstimate({
        provider: "kie",
        payload: { model },
        costHints: { inputTokens: 0, outputTokens: 5, cacheReadInputTokens: 0 },
      }).usd
    ).toBeCloseTo(0.000042, 12);
  });
});
