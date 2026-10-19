import { describe, it, expect } from "vitest";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  classifyEstimate,
  isCostPolicyKnown,
} from "../../packages/provider/cost/src/cost-tier";
import type {
  CostEstimate,
  CostHints,
} from "../../packages/provider/cost/src/types";

// Declared OpenAI usage (ac-0y875w). Rates verified 2026-10-19:
// gpt-5.6-sol Standard short context 4 / 0.40 / 5 / 20 USD per million
// (input / cached input / cache writes / output); above 272,000 input tokens
// the whole request bills 8 / 0.80 / 10 / 30.

const SOL = "gpt-5.6-sol";

function sol(
  costHints?: CostHints,
  payload: Record<string, unknown> = {}
): CostEstimate {
  return computeEstimate({
    provider: "openai",
    payload: { model: SOL, input: "hi", ...payload },
    costHints,
  });
}

function usage(
  inputTokens: number,
  cacheReadInputTokens: number,
  cacheWriteInputTokens: number,
  outputTokens: number
): CostHints {
  return {
    inputTokens,
    cacheReadInputTokens,
    cacheWriteInputTokens,
    outputTokens,
  };
}

function expectUnknown(est: CostEstimate, warning: string): void {
  expect(est.usd).toBe(0);
  expect(est.source).toBe("declared-tokens+table");
  expect(est.breakdown.inputUsdPerMillion).toBeUndefined();
  expect(est.breakdown.outputUsdPerMillion).toBeUndefined();
  expect(isCostPolicyKnown(est)).toBe(false);
  expect(classifyEstimate(est)).toBe("prohibitive");
  expect(est.warnings).toHaveLength(1);
  expect(est.warnings[0]).toContain(warning);
}

describe("openai gpt-5.6-sol declared usage", () => {
  it.each([
    [10_000, 0, 0, 2_000, 0.08],
    [15_000, 12_000, 3_000, 500, 0.0298],
    [272_000, 0, 0, 1_000, 1.108],
    [272_001, 0, 0, 1_000, 2.206008],
    [272_001, 200_000, 50_000, 1_000, 0.866008],
    [272_000, 200_000, 50_000, 1_000, 0.438],
    [0, 0, 0, 0, 0],
    [15_000, 12_000, 3_000, 1_500, 0.0498],
  ])(
    "prices %i total / %i cached / %i written / %i output",
    (input, read, write, output, usd) => {
      const est = sol(usage(input, read, write, output));
      expect(est.usd).toBeCloseTo(usd, 9);
      expect(est.source).toBe("declared-tokens+table");
      expect(est.rateAsOf).toBe("2026-10-19");
      expect(est.warnings).toEqual([]);
    }
  );

  it("prices uncached input and output at the short-context rates", () => {
    const est = sol(usage(10_000, 0, 0, 2_000));
    expect(est.usd).toBeCloseTo(0.08, 9);
    expect(est.source).toBe("declared-tokens+table");
    expect(est.rateAsOf).toBe("2026-10-19");
    expect(est.warnings).toEqual([]);
    expect(est.breakdown).toEqual({
      inputTokens: 10_000,
      outputTokens: 2_000,
      unit: "tokens",
      inputUsdPerMillion: 4,
      outputUsdPerMillion: 20,
      cacheReadInputTokens: 0,
      cacheReadUsdPerMillion: 0.4,
      cacheWriteInputTokens: 0,
      cacheWriteUsdPerMillion: 5,
      contextTier: "short",
    });
  });

  // OpenAI's prompt-caching guide, request 2: 15,000 input tokens of which
  // 12,000 were read from the cache and 3,000 written to it.
  it("bills cached and cache-write tokens as disjoint subsets of the total", () => {
    const est = sol(usage(15_000, 12_000, 3_000, 500));
    // 0 x 4 + 12,000 x 0.40 + 3,000 x 5 + 500 x 20 = 29,800 per million
    expect(est.usd).toBeCloseTo(0.0298, 9);
    expect(est.breakdown.contextTier).toBe("short");
  });

  it("keeps exactly 272,000 input tokens on the short-context rates", () => {
    const est = sol(usage(272_000, 0, 0, 1_000));
    expect(est.usd).toBeCloseTo(1.108, 9);
    expect(est.breakdown.contextTier).toBe("short");
    expect(est.breakdown.inputUsdPerMillion).toBe(4);
  });

  it("bills the whole request long-context at 272,001 input tokens", () => {
    const est = sol(usage(272_001, 0, 0, 1_000));
    expect(est.usd).toBeCloseTo(2.206008, 9);
    expect(est.breakdown).toMatchObject({
      contextTier: "long",
      inputUsdPerMillion: 8,
      outputUsdPerMillion: 30,
      cacheReadUsdPerMillion: 0.8,
      cacheWriteUsdPerMillion: 10,
    });
  });

  it("selects the tier on total input, cached tokens included", () => {
    // 22,001 uncached + 200,000 cached + 50,000 written = 272,001 total.
    const long = sol(usage(272_001, 200_000, 50_000, 1_000));
    expect(long.usd).toBeCloseTo(0.866008, 9);
    expect(long.breakdown.contextTier).toBe("long");
    const short = sol(usage(272_000, 200_000, 50_000, 1_000));
    expect(short.usd).toBeCloseTo(0.438, 9);
    expect(short.breakdown.contextTier).toBe("short");
  });

  it("accepts zero counts", () => {
    expect(sol(usage(0, 0, 0, 0)).usd).toBe(0);
    expect(isCostPolicyKnown(sol(usage(0, 0, 0, 0)))).toBe(true);
  });

  it("maps Responses and Chat Completions usage to the same price", () => {
    const responses = {
      input_tokens: 15_000,
      input_tokens_details: {
        cached_tokens: 12_000,
        cache_write_tokens: 3_000,
      },
      output_tokens: 1_500,
      output_tokens_details: { reasoning_tokens: 1_200 },
    };
    const chat = {
      prompt_tokens: 15_000,
      prompt_tokens_details: {
        cached_tokens: 12_000,
        cache_write_tokens: 3_000,
      },
      completion_tokens: 1_500,
      completion_tokens_details: { reasoning_tokens: 1_200 },
    };
    const fromResponses = sol({
      inputTokens: responses.input_tokens,
      cacheReadInputTokens: responses.input_tokens_details.cached_tokens,
      cacheWriteInputTokens: responses.input_tokens_details.cache_write_tokens,
      // output_tokens already includes the reasoning tokens.
      outputTokens: responses.output_tokens,
    });
    const fromChat = sol({
      inputTokens: chat.prompt_tokens,
      cacheReadInputTokens: chat.prompt_tokens_details.cached_tokens,
      cacheWriteInputTokens: chat.prompt_tokens_details.cache_write_tokens,
      outputTokens: chat.completion_tokens,
    });
    // 12,000 x 0.40 + 3,000 x 5 + 1,500 x 20 = 49,800 per million
    expect(fromResponses.usd).toBeCloseTo(0.0498, 9);
    expect(fromChat.usd).toBe(fromResponses.usd);
  });
});

describe("openai gpt-5.6-sol fails closed", () => {
  it("has no chars/4 heuristic estimate", () => {
    expectUnknown(
      sol(undefined, { max_output_tokens: 1_000 }),
      "costHints.inputTokens, costHints.outputTokens, " +
        "costHints.cacheReadInputTokens, costHints.cacheWriteInputTokens"
    );
    expectUnknown(sol({}), "a chars/4 estimate cannot see");
    // A non-usage hint does not opt in either.
    expectUnknown(sol({ durationSeconds: 5 }), "a chars/4 estimate cannot see");
  });

  it.each([
    [
      "outputTokens",
      { inputTokens: 10, cacheReadInputTokens: 0, cacheWriteInputTokens: 0 },
    ],
    [
      "cacheReadInputTokens",
      { inputTokens: 10, outputTokens: 1, cacheWriteInputTokens: 0 },
    ],
    [
      "cacheWriteInputTokens",
      { inputTokens: 10, outputTokens: 1, cacheReadInputTokens: 0 },
    ],
    [
      "inputTokens",
      { outputTokens: 1, cacheReadInputTokens: 0, cacheWriteInputTokens: 0 },
    ],
  ] as const)("requires %s", (field, hints) => {
    expectUnknown(sol(hints), `pass costHints.${field}`);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, "100", null])(
    "rejects %s as a token count",
    (bad) => {
      const hints = {
        ...usage(10, 0, 0, 1),
        cacheWriteInputTokens: bad,
      } as unknown as CostHints;
      expectUnknown(
        sol(hints),
        "costHints.cacheWriteInputTokens must be a non-negative integer"
      );
    }
  );

  it("refuses cache subsets larger than the total input (double counting)", () => {
    // An uncached-only input count beside the cached subset.
    expectUnknown(
      sol(usage(3_000, 12_000, 0, 500)),
      "exceed costHints.inputTokens (3000)"
    );
    expectUnknown(sol(usage(15_000, 12_000, 3_001, 500)), "(15001) exceed");
  });

  it.each(["priority", "fast", "flex", "batch", "scale", "standard"])(
    "refuses the declared %s service tier",
    (tier) => {
      expectUnknown(
        sol({ ...usage(10, 0, 0, 1), serviceTier: tier }),
        `service tier "${tier}" is not bundled`
      );
    }
  );

  it("prices Standard service tiers and lets the response's tier win", () => {
    const base = sol(usage(10_000, 0, 0, 2_000)).usd;
    for (const serviceTier of ["default", "auto"]) {
      expect(sol({ ...usage(10_000, 0, 0, 2_000), serviceTier }).usd).toBe(
        base
      );
    }
    expect(sol(usage(10_000, 0, 0, 2_000), { service_tier: null }).usd).toBe(
      base
    );
    expectUnknown(
      sol(usage(10_000, 0, 0, 2_000), { service_tier: "flex" }),
      'service tier "flex" is not bundled'
    );
    // A Fast request downgraded by the ramp-rate limit reports "default"
    // and bills Standard rates.
    expect(
      sol(
        { ...usage(10_000, 0, 0, 2_000), serviceTier: "default" },
        { service_tier: "fast" }
      ).usd
    ).toBe(base);
  });

  it("refuses regional processing and prices regionalProcessing: false", () => {
    expectUnknown(
      sol({ ...usage(10, 0, 0, 1), regionalProcessing: true }),
      "regional processing (data residency) and FedRAMP"
    );
    expect(
      sol({ ...usage(10_000, 0, 0, 2_000), regionalProcessing: false }).usd
    ).toBeCloseTo(0.08, 9);
  });

  it("does not price the gpt-5.6 alias or sibling models", () => {
    for (const model of ["gpt-5.6", "gpt-5.6-terra", "gpt-5.6-luna"]) {
      const est = computeEstimate({
        provider: "openai",
        payload: { model },
        costHints: usage(10, 0, 0, 1),
      });
      expectUnknown(est, `model '${model}' not found`);
    }
  });
});

describe("openai declared usage on models without cache rates", () => {
  it("prices declared input and output for a legacy row", () => {
    const est = computeEstimate({
      provider: "openai",
      payload: { model: "gpt-4o" },
      costHints: { inputTokens: 1_000, outputTokens: 500 },
    });
    expect(est.usd).toBeCloseTo(0.0075, 9);
    expect(est.source).toBe("declared-tokens+table");
    expect(est.breakdown).toEqual({
      inputTokens: 1_000,
      outputTokens: 500,
      unit: "tokens",
      inputUsdPerMillion: 2.5,
      outputUsdPerMillion: 10,
    });
  });

  it("fails closed on a cache count the row has no rate for", () => {
    const est = computeEstimate({
      provider: "openai",
      payload: { model: "gpt-4o" },
      costHints: {
        inputTokens: 1_000,
        outputTokens: 500,
        cacheReadInputTokens: 100,
      },
    });
    expectUnknown(est, "has no bundled cached-input rate");
    expectUnknown(
      computeEstimate({
        provider: "openai",
        payload: { model: "gpt-4o" },
        costHints: {
          inputTokens: 1_000,
          outputTokens: 500,
          cacheWriteInputTokens: 100,
        },
      }),
      "has no bundled cache-write rate"
    );
    const zero = computeEstimate({
      provider: "openai",
      payload: { model: "gpt-4o" },
      costHints: {
        inputTokens: 1_000,
        outputTokens: 500,
        cacheReadInputTokens: 0,
      },
    });
    expect(zero.usd).toBeCloseTo(0.0075, 9);
  });

  it("keeps the chars/4 heuristic when no usage is declared", () => {
    const payload = {
      model: "gpt-5",
      messages: [{ role: "user", content: "y".repeat(800) }],
      max_completion_tokens: 1000,
      service_tier: "flex",
    };
    const plain = computeEstimate({ provider: "openai", payload });
    const hinted = computeEstimate({
      provider: "openai",
      payload,
      costHints: { durationSeconds: 5, serviceTier: "priority" },
    });
    expect(plain.source).toBe("tokens-heuristic+table");
    expect(plain.usd).toBeCloseTo((200 * 1.25 + 1000 * 10) / 1_000_000, 9);
    expect(hinted).toEqual(plain);
  });
});

describe("declared usage stays an openai route", () => {
  it("leaves anthropic on the heuristic when cache counts are passed", () => {
    const payload = {
      model: "claude-haiku-4-5",
      messages: [{ role: "user", content: "x".repeat(400) }],
      max_tokens: 200,
    };
    const plain = computeEstimate({ provider: "anthropic", payload });
    const hinted = computeEstimate({
      provider: "anthropic",
      payload,
      costHints: usage(5_000, 1_000, 1_000, 10),
    });
    expect(hinted).toEqual(plain);
    expect(hinted.source).toBe("tokens-heuristic+table");
  });

  it("leaves the KIE declared-token models unchanged by cache counts", () => {
    const req = {
      provider: "kie" as const,
      payload: { model: "google/gemini-2-5-pro-tts" },
    };
    const plain = computeEstimate({
      ...req,
      costHints: { inputTokens: 1_000, outputTokens: 1_000 },
    });
    const hinted = computeEstimate({
      ...req,
      costHints: {
        inputTokens: 1_000,
        outputTokens: 1_000,
        cacheReadInputTokens: 500,
        cacheWriteInputTokens: 500,
        serviceTier: "flex",
        regionalProcessing: true,
      },
    });
    expect(hinted).toEqual(plain);
  });
});
