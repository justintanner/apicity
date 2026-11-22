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
  it.each([
    ["qwen3.8-max", "International"],
    ["qwen3.8-max-0902", "International"],
    ["qwen3.7-max", "International"],
    ["qwen3.7-max-preview", "International"],
    ["qwen3.8-max", "Global"],
    ["qwen3.8-max-0902", "Global"],
    ["qwen3.7-max", "Global"],
    ["qwen3.7-plus", "International"],
    ["qwen3.6-plus", "International"],
    ["qwen3.5-plus", "International"],
    ["qwen3.7-plus", "Global"],
    ["qwen3.6-plus", "Global"],
    ["qwen3.5-plus", "Global"],
    ["qwen3.8-flash", "International"],
    ["qwen3.7-flash", "International"],
    ["qwen3.6-flash", "International"],
    ["qwen3.5-flash", "International"],
    ["qwen3.8-flash", "Global"],
    ["qwen3.7-flash", "Global"],
    ["qwen3.6-flash", "Global"],
    ["qwen3.5-flash", "Global"],
    ["qwen3.5-omni-plus", "International"],
    ["qwen3.5-omni-flash", "International"],
    ["qwen3-omni-flash", "International"],
    ["qwen3-vl-plus", "International"],
    ["qwen3-vl-plus", "Global"],
    ["qwen3-coder-flash", "International"],
    ["qwen3-coder-flash", "Global"],
    ["qwen3.8-2.4t-a95b", "International"],
    ["qwen3.8-27b", "International"],
    ["qwen3.6-35b-a3b", "International"],
    ["qwen3.6-27b", "International"],
    ["qwen3.6-35b-a3b", "Global"],
    ["qwen3.5-397b-a17b", "International"],
    ["qwen3.5-122b-a10b", "International"],
    ["qwen3.5-27b", "International"],
    ["qwen3.5-35b-a3b", "International"],
    ["qwen3.5-397b-a17b", "Global"],
    ["qwen3.5-122b-a10b", "Global"],
    ["qwen3.5-27b", "Global"],
  ] as const)("covers surveyed %s in %s", (model, scope) => {
    const result = computeEstimate({
      provider: "alibaba",
      payload: { model, enable_thinking: true },
      costHints: { ...hints, alibabaDeploymentScope: scope },
    });
    expect(result.warnings).toEqual([]);
    expect(result.usd).toBeGreaterThan(0);
    expect(result.rateAsOf).toBe("2026-11-04");
  });
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
  it("uses the published Global list rate rather than a time-limited discount", () => {
    const result = alibaba(
      "https://workspace.us-east-1.maas.aliyuncs.com",
      { ...hints, alibabaDeploymentScope: "Global" },
      "qwen3.7-plus"
    );
    expect(result.warnings).toEqual([]);
    expect(result.breakdown.inputUsdPerMillion).toBe(0.276);
    expect(result.breakdown.outputUsdPerMillion).toBe(1.101);
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
      payload: {
        model: "wan2.7-i2v",
        parameters: { resolution: "720P", duration: 5 },
      },
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
      requestBody: {
        model: "gemini-2.5-pro",
        contents: [{ parts: [{ text: "Hello" }] }],
      },
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
  it("prices Google Nano Banana 2.1 text, reasoning, and image tokens", () => {
    const req = {
      provider: "google" as const,
      endpoint: "gemini-nano-banana-2.1",
      baseURL:
        "https://aiplatform.googleapis.com/v1/projects/my-project/locations/global",
      payload: {
        contents: [
          {
            role: "user",
            parts: [
              { text: "Edit this" },
              { inlineData: { mimeType: "image/png", data: "AAAA" } },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { imageSize: "1K", aspectRatio: "1:1" },
        },
      },
    };
    // Without declared token usage, estimate fails closed rather than guessing.
    expect(computeEstimate(req).warnings.join()).toContain(
      "costHints.imageOutputTokens"
    );
    const est = computeEstimate({
      ...req,
      costHints: {
        inputTokens: 1130,
        outputTokens: 1140,
        cacheReadInputTokens: 0,
        imageInputTokens: 1120,
        imageOutputTokens: 1120,
        cacheReadImageInputTokens: 0,
      },
    });
    expect(est.warnings).toEqual([]);
    // (10 text-in + 1120 image-in) * 1.5 + 20 text/thinking-out * 7.5 + 1120 image-out * 30
    expect(est.usd).toBeCloseTo((1130 * 1.5 + 20 * 7.5 + 1120 * 30) / 1e6, 12);

    const actual = extractActual({
      provider: "google",
      method: "POST",
      url: "https://aiplatform.googleapis.com/v1/projects/477314613503/locations/global/publishers/google/models/gemini-nano-banana-2.1:generateContent",
      status: 200,
      requestBody: req.payload,
      responseHeaders: {},
      responseBody: {
        usageMetadata: {
          promptTokenCount: 1130,
          candidatesTokenCount: 1120,
          thoughtsTokenCount: 20,
          promptTokensDetails: [
            { modality: "TEXT", tokenCount: 10 },
            { modality: "IMAGE", tokenCount: 1120 },
          ],
          candidatesTokensDetails: [{ modality: "IMAGE", tokenCount: 1120 }],
        },
      },
    });
    expect(actual.warnings).toEqual([]);
    expect(actual.basis).toBe("derived");
    expect(actual.derivedUsd).toBeCloseTo(est.usd, 12);
    expect(actual.usage.imageInputTokens).toBe(1120);
    expect(actual.usage.imageOutputTokens).toBe(1120);
  });
  it("prices Google Gemini Omni 1.2 and 1.1 Flash multimodal video/text tokens", () => {
    const req12 = {
      provider: "google" as const,
      payload: {
        model: "gemini-omni-1.2-flash",
        store: false,
        input: [
          {
            type: "user_input",
            content: [{ type: "text", text: "A red paper boat." }],
          },
        ],
        response_format: [
          {
            type: "video",
            delivery: "inline",
            resolution: "360p",
            duration: "3s",
          },
        ],
      },
    };
    // Without declared token usage, estimate fails closed rather than guessing.
    expect(computeEstimate(req12).warnings.join()).toContain(
      "costHints.videoOutputTokens"
    );
    const est12 = computeEstimate({
      ...req12,
      costHints: {
        inputTokens: 10,
        outputTokens: 6000,
        imageInputTokens: 0,
        audioInputTokens: 0,
        videoInputTokens: 0,
        videoOutputTokens: 5793,
      },
    });
    expect(est12.warnings).toEqual([]);
    // 10 * 1.5 + 207 * 9 + 5793 * 12
    expect(est12.usd).toBeCloseTo((10 * 1.5 + 207 * 9 + 5793 * 12) / 1e6, 12);

    const actual12 = extractActual({
      provider: "google",
      method: "POST",
      url: "https://aiplatform.googleapis.com/v1/projects/apicity-youtube/locations/global/interactions",
      status: 200,
      requestBody: req12.payload,
      responseHeaders: {},
      responseBody: {
        id: "int-12",
        model: "gemini-omni-1.2-flash",
        status: "completed",
        usage: {
          total_input_tokens: 10,
          input_tokens_by_modality: [{ modality: "text", tokens: 10 }],
          total_output_tokens: 5793,
          output_tokens_by_modality: [{ modality: "video", tokens: 5793 }],
          total_thought_tokens: 207,
          total_tokens: 6010,
        },
      },
    });
    expect(actual12.warnings).toEqual([]);
    expect(actual12.basis).toBe("derived");
    expect(actual12.derivedUsd).toBeCloseTo(est12.usd, 12);
    expect(actual12.usage.videoOutputTokens).toBe(5793);

    // Gemini Omni 1.1 Flash preview bills $17.50/1M video output tokens
    const actual11 = extractActual({
      provider: "google",
      method: "POST",
      url: "https://aiplatform.googleapis.com/v1/projects/apicity-youtube/locations/global/interactions",
      status: 200,
      requestBody: { model: "gemini-omni-1.1-flash-preview" },
      responseHeaders: {},
      responseBody: {
        id: "int-11",
        model: "gemini-omni-1.1-flash-preview",
        status: "completed",
        usage: {
          total_input_tokens: 17386,
          input_tokens_by_modality: [
            { modality: "text", tokens: 10 },
            { modality: "video", tokens: 17376 },
          ],
          total_output_tokens: 5793,
          output_tokens_by_modality: [{ modality: "video", tokens: 5793 }],
          total_thought_tokens: 100,
          total_tokens: 23279,
        },
      },
    });
    expect(actual11.warnings).toEqual([]);
    expect(actual11.basis).toBe("derived");
    expect(actual11.derivedUsd).toBeCloseTo(
      (17386 * 1.5 + 100 * 9 + 5793 * 17.5) / 1e6,
      12
    );
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
    const nbHar = JSON.parse(
      readFileSync(
        path.resolve(
          __dirname,
          "../recordings/google_2644829574/nano-banana-2-1_1752383898/recording.har"
        ),
        "utf8"
      )
    ) as { log: { entries: HarEntry[] } };
    const nbActual = extractActual(
      entryToProviderExchange(nbHar.log.entries[0], { provider: "google" })
    );
    expect(nbActual.model).toBe("gemini-nano-banana-2.1");
    expect(nbActual.basis).toBe("derived");
    expect(nbActual.warnings).toEqual([]);
    expect(nbActual.usage).toMatchObject({
      inputTokens: 11,
      outputTokens: 1886,
      reasoningTokens: 766,
      imageInputTokens: 0,
      imageOutputTokens: 1120,
      cacheReadImageInputTokens: 0,
    });
    expect(nbActual.derivedUsd).toBeCloseTo(0.0393615, 12);

    const omni12Har = JSON.parse(
      readFileSync(
        path.resolve(
          __dirname,
          "../recordings/google_2644829574/omni-1-2-flash-t2v_3332731059/recording.har"
        ),
        "utf8"
      )
    ) as { log: { entries: HarEntry[] } };
    const omni12Actual = extractActual(
      entryToProviderExchange(omni12Har.log.entries[0], { provider: "google" })
    );
    expect(omni12Actual.model).toBe("gemini-omni-1.2-flash");
    expect(omni12Actual.basis).toBe("derived");
    expect(omni12Actual.warnings).toEqual([]);
    expect(omni12Actual.usage).toMatchObject({
      inputTokens: 28,
      outputTokens: 6557,
      reasoningTokens: 764,
      videoInputTokens: 0,
      videoOutputTokens: 5793,
    });
    expect(omni12Actual.derivedUsd).toBeCloseTo(0.076434, 12);

    const omni11Har = JSON.parse(
      readFileSync(
        path.resolve(
          __dirname,
          "../recordings/google_2644829574/omni-1-1-flash-edit_518642090/recording.har"
        ),
        "utf8"
      )
    ) as { log: { entries: HarEntry[] } };
    const omni11Actual = extractActual(
      entryToProviderExchange(omni11Har.log.entries[0], { provider: "google" })
    );
    expect(omni11Actual.model).toBe("gemini-omni-1.1-flash-preview");
    expect(omni11Actual.basis).toBe("derived");
    expect(omni11Actual.warnings).toEqual([]);
    expect(omni11Actual.usage).toMatchObject({
      inputTokens: 17406,
      outputTokens: 6043,
      reasoningTokens: 250,
      videoInputTokens: 17376,
      videoOutputTokens: 5793,
    });
    expect(omni11Actual.derivedUsd).toBeCloseTo(0.1297365, 12);
  });
});
