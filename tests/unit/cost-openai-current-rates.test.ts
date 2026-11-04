import { describe, expect, it } from "vitest";
import {
  computeEstimate,
  endpointBilling,
  estimateEndpoint,
  extractActual,
  type ProviderExchange,
} from "@apicity/cost";

const request = {
  provider: "openai",
  method: "POST",
  dotPath: "v1.responses",
};
const hints = {
  inputTokens: 1000,
  outputTokens: 100,
  cacheReadInputTokens: 100,
  cacheWriteInputTokens: 200,
};
function exchange(model: string, usage: unknown): ProviderExchange {
  return {
    ...request,
    url: "https://api.openai.com/v1/responses",
    status: 200,
    requestBody: { model },
    responseHeaders: {},
    responseBody: { model, usage },
  };
}

describe("OpenAI Standard rates read 2026-11-04 (P1)", () => {
  it("prices five captured Astra usages independently, including cache writes", () => {
    // Numeric usage only from the existing videobook corpus; no prompts or URLs.
    const counts = [
      [15662, 15659, 82],
      [14307, 14304, 109],
      [14313, 14310, 60],
      [14202, 14199, 48],
      [14255, 14252, 84],
    ];
    const actuals = counts.map(([input, write, output]) =>
      extractActual(
        exchange("gpt-6-astra", {
          input_tokens: input,
          input_tokens_details: { cache_write_tokens: write, cached_tokens: 0 },
          output_tokens: output,
        })
      )
    );
    for (const actual of actuals) {
      expect(actual.basis).toBe("derived");
      expect(actual.rateAsOf).toBe("2026-11-04");
    }
    expect(
      actuals.reduce((sum, actual) => sum + (actual.usd ?? 0), 0)
    ).toBeCloseTo(0.92835, 10);
  });

  it("prices 91 transcription seconds through both hints and actual usage", () => {
    const actual = extractActual({
      ...exchange("gpt-transcribe", { seconds: 91 }),
      dotPath: "v1.audio.transcriptions",
      url: "https://api.openai.com/v1/audio/transcriptions",
    });
    expect(actual.derivedUsd).toBeCloseTo(0.006825, 12);
    expect(
      computeEstimate({
        provider: "openai",
        payload: { model: "gpt-transcribe" },
        costHints: { durationSeconds: 91 },
      }).usd
    ).toBeCloseTo(0.006825, 12);
  });

  it.each(["gpt-6-astra", "gpt-5.6-sol"])(
    "forecasts %s but keeps strict fail-closed",
    (model) => {
      const req = {
        ...request,
        payload: { model, input: "A useful question", max_output_tokens: 100 },
      };
      expect(estimateEndpoint(req).status).toBe("unavailable");
      const forecast = estimateEndpoint({ ...req, mode: "forecast" });
      expect(forecast.status).toBe("priced");
      expect(forecast.usd).toBeGreaterThan(0);
      expect(forecast.range?.low).toBeLessThan(forecast.range!.high);
      expect(forecast.warnings.join(" ")).toContain("Forecast");
    }
  );

  it.each(["batch", "flex", "priority", "fast", "ultrafast"])(
    "rejects %s in strict, forecast and actuals",
    (tier) => {
      const payload = {
        model: "gpt-6-astra",
        service_tier: tier,
        input: "hello",
        max_output_tokens: 100,
      };
      for (const mode of ["strict", "forecast"] as const) {
        expect(estimateEndpoint({ ...request, payload, mode }).status).toBe(
          "unavailable"
        );
      }
      expect(
        estimateEndpoint({ ...request, payload, costHints: hints }).status
      ).toBe("unavailable");
      const ex = exchange("gpt-6-astra", {
        input_tokens: 1000,
        output_tokens: 100,
        input_tokens_details: { cached_tokens: 100, cache_write_tokens: 200 },
      });
      ex.requestBody = payload;
      expect(extractActual(ex).derivedUsd).toBeNull();
    }
  );

  it.each(["12h", "24h"])(
    "does not price %s cache writes at the 30m rate",
    (retention) => {
      const result = estimateEndpoint({
        ...request,
        payload: { model: "gpt-6-astra", prompt_cache_retention: retention },
        costHints: hints,
      });
      expect(result.status).toBe("unavailable");
      expect(result.warnings.join(" ")).toContain("extended cache writes");
    }
  );

  it("selects long-context rates only above 272K total input", () => {
    for (const [inputTokens, expected] of [
      [272000, 2.72525],
      [272001, 5.44802],
    ]) {
      const result = computeEstimate({
        provider: "openai",
        payload: { model: "gpt-6-astra" },
        costHints: {
          inputTokens,
          outputTokens: 100,
          cacheReadInputTokens: 0,
          cacheWriteInputTokens: 100,
        },
      });
      expect(result.usd).toBeCloseTo(expected, 8);
    }
  });

  it("prices image output separately and rejects impossible partitions", () => {
    const costHints = {
      inputTokens: 1000,
      outputTokens: 500,
      cacheReadInputTokens: 100,
      imageInputTokens: 400,
      cacheReadImageInputTokens: 50,
      imageOutputTokens: 500,
    };
    const result = computeEstimate({
      provider: "openai",
      payload: { model: "gpt-image-1-mini" },
      costHints,
    });
    expect(result.usd).toBeCloseTo(0.0059975, 12);
    const invalid = estimateEndpoint({
      ...request,
      payload: { model: "gpt-image-1-mini" },
      costHints: { ...costHints, imageOutputTokens: 501 },
    });
    expect(invalid.status).toBe("unavailable");
  });

  it("keeps direct search unpriced and warns about Responses tool fees", () => {
    const direct = estimateEndpoint({
      ...request,
      dotPath: "v1.vectorStores.search",
    });
    expect(direct.billing.kind).toBe("unpriced");
    expect(direct.status).toBe("unavailable");
    expect(direct.warnings.join(" ")).toContain("Responses API only");
    const response = estimateEndpoint({
      ...request,
      payload: { model: "gpt-6-astra", tools: [{ type: "file_search" }] },
      costHints: hints,
    });
    expect(response.status).toBe("priced");
    expect(response.warnings.join(" ")).toContain("tool call fees");
    expect(endpointBilling("openai", "POST", "v1.batches").kind).toBe(
      "accrual"
    );
  });
});
