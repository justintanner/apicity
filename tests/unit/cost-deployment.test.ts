import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  computeEstimate,
  estimateEndpoint,
  extractActual,
  type CostHints,
} from "@apicity/cost";
import { entryToProviderExchange, type HarEntry } from "@apicity/har";

const hints: CostHints = {
  inputTokens: 1000,
  outputTokens: 100,
  cacheReadInputTokens: 0,
};
const alibaba = (
  baseURL?: string,
  costHints: CostHints = hints,
  model = "qwen3.8-max"
) =>
  computeEstimate({
    provider: "alibaba",
    payload: { model },
    baseURL,
    costHints,
  });
const google = (
  baseURL?: string,
  costHints: CostHints = hints,
  endpoint = "gemini-2.5-flash"
) =>
  computeEstimate({
    provider: "google",
    endpoint,
    payload: { contents: [{ parts: [{ text: "Hello" }] }] },
    baseURL,
    costHints,
  });

describe("deployment-aware pricing", () => {
  it("uses the factory-default mainland rate and names the assumption", () => {
    expect(alibaba()).toMatchObject({
      usd: (1000 * 1.65 + 100 * 4.951) / 1e6,
      warnings: [],
    });
    expect(alibaba().notes?.join()).toContain("Chinese mainland");
    expect(alibaba("https://dashscope-intl.aliyuncs.com").usd).toBe(
      (1000 * 2 + 100 * 6) / 1e6
    );
  });
  it.each([
    "https://workspace.us-east-1.maas.aliyuncs.com",
    "https://workspace.eu-central-1.maas.aliyuncs.com",
    "https://workspace.ap-northeast-1.maas.aliyuncs.com",
    "https://cn-hongkong.dashscope.aliyuncs.com",
    "https://custom.example",
    "https://dashscope.aliyuncs.com.evil.example",
  ])("requires explicit scope for %s", (base) => {
    expect(alibaba(base).warnings.join()).toContain(
      "costHints.alibabaDeploymentScope"
    );
    expect(
      alibaba(base, { ...hints, alibabaDeploymentScope: "Global" }).warnings
    ).toEqual([]);
  });
  it("rejects conflicts and malformed URLs", () => {
    expect(
      alibaba("https://dashscope.aliyuncs.com", {
        ...hints,
        alibabaDeploymentScope: "International",
      }).warnings.join()
    ).toContain("conflicts with baseURL");
    expect(alibaba("not a URL").warnings.join()).toContain("baseURL");
  });
  it.each(["cn-beijing", "ap-southeast-1"])(
    "recognizes documented workspace hosts in %s",
    (region) => {
      expect(
        alibaba(`https://workspace.${region}.maas.aliyuncs.com`).warnings
      ).toEqual([]);
    }
  );
  it("reprices the whole Alibaba request above a tier boundary", () => {
    const run = (n: number) =>
      alibaba(
        "https://dashscope-intl.aliyuncs.com",
        { ...hints, inputTokens: n },
        "qwen3.7-plus"
      );
    expect(run(256000).breakdown.inputUsdPerMillion).toBe(0.4);
    expect(run(256001).breakdown.inputUsdPerMillion).toBe(1.2);
    expect(run(1000001).warnings.join()).toContain("published tiers");
  });
  it("requires declared counts and refuses unknown models", () => {
    expect(alibaba(undefined, {}).warnings.join()).toContain(
      "costHints.inputTokens"
    );
    expect(alibaba(undefined, hints, "qwen3-max").warnings.join()).toContain(
      "no bundled rate"
    );
  });
  it("does not use International media rates for mainland traffic", () => {
    const req = {
      provider: "alibaba" as const,
      payload: { model: "wan2.7-i2v", parameters: { duration: 5 } },
    };
    expect(computeEstimate(req).warnings.join()).toContain("Chinese mainland");
    expect(
      computeEstimate({
        ...req,
        baseURL: "https://dashscope-intl.aliyuncs.com",
      })
    ).toMatchObject({ usd: 0.5, warnings: [] });
  });
  it("prices Google cached input and thinking output at the path model", () => {
    expect(
      google(undefined, { ...hints, cacheReadInputTokens: 200 }).usd
    ).toBeCloseTo((800 * 0.3 + 200 * 0.03 + 100 * 2.5) / 1e6);
    const actual = extractActual({
      provider: "google",
      method: "POST",
      url: "https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent",
      requestBody: { contents: [{ parts: [{ text: "Hello" }] }] },
      status: 200,
      responseHeaders: {},
      responseBody: {
        usageMetadata: {
          promptTokenCount: 1000,
          cachedContentTokenCount: 200,
          candidatesTokenCount: 70,
          thoughtsTokenCount: 30,
        },
      },
    });
    expect(actual.usage.outputTokens).toBe(100);
    expect(actual.derivedUsd).toBeCloseTo(
      google(undefined, { ...hints, cacheReadInputTokens: 200 }).usd
    );
  });
  it("rejects regional Google hosts and location paths", () => {
    for (const base of [
      "https://us-central1-aiplatform.googleapis.com",
      "https://custom.example",
      "https://aiplatform.googleapis.com/v1/projects/a/locations/us-central1",
    ])
      expect(google(base).warnings.join()).toContain("baseURL region");
  });
  it("requires a Google path model and keeps the payload untouched", () => {
    const payload = { contents: [{ parts: [{ text: "Hello" }] }] };
    expect(
      estimateEndpoint({
        provider: "google",
        method: "POST",
        dotPath: "v1.publishers.google.models.generateContent",
        endpoint: "gemini-2.5-flash",
        payload,
        costHints: hints,
      }).status
    ).toBe("priced");
    expect(payload).not.toHaveProperty("model");
    expect(google(undefined, hints, "").warnings.join()).toContain("not found");
  });
  it.each(["priority", "batch"])(
    "fails closed for unsupported %s tier",
    (serviceTier) => {
      expect(
        google(undefined, { ...hints, serviceTier }).warnings.length
      ).toBeGreaterThan(0);
      expect(
        alibaba(undefined, { ...hints, serviceTier }).warnings.length
      ).toBeGreaterThan(0);
    }
  );
  it("does not treat tool charges as a complete token bill", () => {
    const result = computeEstimate({
      provider: "google",
      endpoint: "gemini-2.5-flash",
      payload: { tools: [{ googleSearch: {} }] },
      costHints: hints,
    });
    expect(result.usd).toBeGreaterThan(0);
    expect(result.warnings.join()).toContain("tool charges");
  });
  it("fails closed on unbundled modalities", () => {
    expect(
      computeEstimate({
        provider: "google",
        endpoint: "gemini-2.5-flash",
        payload: {
          contents: [
            { parts: [{ inlineData: { mimeType: "audio/wav", data: "x" } }] },
          ],
        },
        costHints: hints,
      }).warnings.join()
    ).toContain("modality");
  });
  it("refuses derived actuals from ambiguous Alibaba hosts", () => {
    const actual = extractActual({
      provider: "alibaba",
      method: "POST",
      url: "https://w.us-east-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions",
      status: 200,
      requestBody: { model: "qwen3.8-max" },
      responseHeaders: {},
      responseBody: { usage: { prompt_tokens: 1000, completion_tokens: 100 } },
    });
    expect(actual.derivedUsd).toBeNull();
    expect(actual.warnings.join()).toContain(
      "costHints.alibabaDeploymentScope"
    );
  });
  it("does not price Google's reported audio usage at text rates", () => {
    const actual = extractActual({
      provider: "google",
      method: "POST",
      url: "https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent",
      status: 200,
      requestBody: null,
      responseHeaders: {},
      responseBody: {
        usageMetadata: {
          promptTokenCount: 1000,
          candidatesTokenCount: 100,
          promptTokensDetails: [{ modality: "AUDIO", tokenCount: 1000 }],
        },
      },
    });
    expect(actual.derivedUsd).toBeNull();
    expect(actual.uncoveredCharge).toContain("modality");
  });
  it("does not collapse conflicting regional prices into a scope rate", () => {
    expect(
      alibaba(
        "https://custom.example",
        { ...hints, alibabaDeploymentScope: "Global" },
        "deepseek-v4-pro"
      ).warnings.join()
    ).toContain("regional rates disagree");
  });
  it("prices the committed Google exchange and explicitly refuses the retired Alibaba recording model", () => {
    for (const [provider, fixture] of [
      ["google", "google_2644829574/generate-content_2541580906/recording.har"],
      ["alibaba", "alibaba_1329897167/chat-hello_1014512442/recording.har"],
    ]) {
      const har = JSON.parse(
        readFileSync(path.resolve(__dirname, "../recordings", fixture), "utf8")
      ) as { log: { entries: HarEntry[] } };
      const actual = extractActual(
        entryToProviderExchange(har.log.entries[0], { provider })
      );
      if (provider === "google") {
        expect(actual.basis).toBe("derived");
        expect(actual.derivedUsd).toBeGreaterThan(0);
      } else {
        expect(actual.model).toBe("qwen3-max");
        expect(actual.basis).toBe("usage-only");
        expect(actual.warnings.join()).toContain("no bundled rate");
      }
    }
  });
});
