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

// Declared OpenAI Realtime usage (ac-ow167y). gpt-realtime-2.1 rates verified
// 2026-10-19, USD per million tokens: text 4 / 0.40 cached / 24 output, audio
// 32 / 0.40 / 64, image 5 / 0.50 (input only).

const RT = "gpt-realtime-2.1";

function rt(costHints?: CostHints): CostEstimate {
  return computeEstimate({
    provider: "openai",
    payload: { model: RT },
    costHints,
  });
}

// A Realtime `response.done` usage object, mapped the way the README says.
interface RealtimeUsage {
  input_tokens: number;
  output_tokens: number;
  input_token_details: {
    text_tokens: number;
    audio_tokens: number;
    image_tokens: number;
    cached_tokens: number;
    cached_tokens_details: {
      text_tokens: number;
      audio_tokens: number;
      image_tokens: number;
    };
  };
  output_token_details: { text_tokens: number; audio_tokens: number };
}

function fromUsage(u: RealtimeUsage): CostHints {
  const d = u.input_token_details;
  return {
    inputTokens: u.input_tokens,
    cacheReadInputTokens: d.cached_tokens,
    audioInputTokens: d.audio_tokens,
    imageInputTokens: d.image_tokens,
    cacheReadAudioInputTokens: d.cached_tokens_details.audio_tokens,
    cacheReadImageInputTokens: d.cached_tokens_details.image_tokens,
    outputTokens: u.output_tokens,
    audioOutputTokens: u.output_token_details.audio_tokens,
  };
}

function counts(
  inputTokens: number,
  cacheReadInputTokens: number,
  outputTokens: number,
  audio: [input: number, cached: number, output: number],
  image: [input: number, cached: number]
): CostHints {
  return {
    inputTokens,
    cacheReadInputTokens,
    outputTokens,
    audioInputTokens: audio[0],
    cacheReadAudioInputTokens: audio[1],
    audioOutputTokens: audio[2],
    imageInputTokens: image[0],
    cacheReadImageInputTokens: image[1],
  };
}

function expectUnknown(est: CostEstimate, warning: string): void {
  expect(est.usd).toBe(0);
  expect(est.source).toBe("declared-tokens+table");
  expect(est.breakdown.inputUsdPerMillion).toBeUndefined();
  expect(est.breakdown.modalities).toBeUndefined();
  expect(isCostPolicyKnown(est)).toBe(false);
  expect(classifyEstimate(est)).toBe("prohibitive");
  expect(est.warnings).toHaveLength(1);
  expect(est.warnings[0]).toContain(warning);
}

describe("openai gpt-realtime-2.1 declared modality usage", () => {
  // OpenAI's Realtime cost guide, turn 2 of its example session.
  const docsExample: RealtimeUsage = {
    input_tokens: 132,
    output_tokens: 121,
    input_token_details: {
      text_tokens: 119,
      audio_tokens: 13,
      image_tokens: 0,
      cached_tokens: 64,
      cached_tokens_details: {
        text_tokens: 64,
        audio_tokens: 0,
        image_tokens: 0,
      },
    },
    output_token_details: { text_tokens: 30, audio_tokens: 91 },
  };

  it("prices mixed text and audio with cached input per modality", () => {
    const est = rt(fromUsage(docsExample));
    // 55 x 4 + 64 x 0.40 + 13 x 32 + 30 x 24 + 91 x 64 = 7,205.6 per million
    expect(est.usd).toBeCloseTo(0.0072056, 9);
    expect(est.source).toBe("declared-tokens+table");
    expect(est.rateAsOf).toBe("2026-10-19");
    expect(est.warnings).toEqual([]);
    expect(est.breakdown.modalities).toEqual({
      text: {
        inputTokens: 119,
        cacheReadInputTokens: 64,
        outputTokens: 30,
        inputUsdPerMillion: 4,
        cacheReadUsdPerMillion: 0.4,
        outputUsdPerMillion: 24,
      },
      audio: {
        inputTokens: 13,
        cacheReadInputTokens: 0,
        outputTokens: 91,
        inputUsdPerMillion: 32,
        cacheReadUsdPerMillion: 0.4,
        outputUsdPerMillion: 64,
      },
      image: {
        inputTokens: 0,
        cacheReadInputTokens: 0,
        inputUsdPerMillion: 5,
        cacheReadUsdPerMillion: 0.5,
      },
    });
    // The text remainders equal the usage's own text counts.
    expect(est.breakdown.modalities?.text.inputTokens).toBe(
      docsExample.input_token_details.text_tokens
    );
    expect(est.breakdown.modalities?.text.outputTokens).toBe(
      docsExample.output_token_details.text_tokens
    );
  });

  it("never prices mixed modalities at one flat text rate", () => {
    const flat = (132 * 4 + 121 * 24) / 1_000_000;
    expect(rt(fromUsage(docsExample)).usd).not.toBeCloseTo(flat, 6);
  });

  it("prices text-only usage at the text rates", () => {
    expect(rt(counts(1_000, 0, 500, [0, 0, 0], [0, 0])).usd).toBeCloseTo(
      0.016,
      9
    );
  });

  it("prices cached audio at the audio cached rate", () => {
    // text 2,000 in (1,000 cached) / 500 out; audio 8,000 in (5,000 cached)
    // / 1,500 out: 4,000 + 400 + 12,000 + 96,000 + 2,000 + 96,000
    const est = rt(counts(10_000, 6_000, 2_000, [8_000, 5_000, 1_500], [0, 0]));
    expect(est.usd).toBeCloseTo(0.2104, 9);
  });

  it("prices image input and cached image input", () => {
    // text 1,000 in / 100 out; image 2,000 in (1,000 cached)
    const est = rt(counts(3_000, 1_000, 100, [0, 0, 0], [2_000, 1_000]));
    expect(est.usd).toBeCloseTo(0.0119, 9);
  });

  it("prices zero usage at $0 as a known policy", () => {
    const est = rt(counts(0, 0, 0, [0, 0, 0], [0, 0]));
    expect(est.usd).toBe(0);
    expect(isCostPolicyKnown(est)).toBe(true);
    expect(classifyEstimate(est)).toBe("cheap");
  });
});

describe("openai gpt-realtime-2.1 fails closed", () => {
  it("has no chars/4 heuristic estimate", () => {
    expectUnknown(
      computeEstimate({
        provider: "openai",
        payload: { model: RT, input: "hello", max_output_tokens: 100 },
      }),
      "per-modality rates that a chars/4 estimate cannot see"
    );
  });

  it.each([
    "audioInputTokens",
    "cacheReadAudioInputTokens",
    "audioOutputTokens",
    "imageInputTokens",
    "cacheReadImageInputTokens",
    "cacheReadInputTokens",
  ] as const)("requires %s", (field) => {
    const hints: CostHints = counts(10, 0, 1, [0, 0, 0], [0, 0]);
    delete hints[field];
    expectUnknown(rt(hints), `pass costHints.${field}`);
  });

  it("rejects a non-integer modality count", () => {
    expectUnknown(
      rt({ ...counts(10, 0, 1, [0, 0, 0], [0, 0]), audioOutputTokens: 1.5 }),
      "costHints.audioOutputTokens must be a non-negative integer"
    );
  });

  it.each([
    [
      counts(100, 0, 10, [80, 0, 0], [30, 0]),
      "exceed costHints.inputTokens (100)",
    ],
    [
      counts(100, 10, 10, [5, 6, 0], [0, 0]),
      "cacheReadAudioInputTokens (6) exceeds",
    ],
    [
      counts(100, 10, 10, [0, 0, 0], [5, 6]),
      "cacheReadImageInputTokens (6) exceeds",
    ],
    [
      counts(100, 4, 10, [10, 5, 0], [0, 0]),
      "exceed costHints.cacheReadInputTokens (4)",
    ],
    [counts(100, 90, 10, [50, 0, 0], [0, 0]), "cached text tokens (90) exceed"],
    [counts(100, 0, 10, [0, 0, 11], [0, 0]), "audioOutputTokens (11) exceeds"],
  ])("refuses an inconsistent partition (%#)", (hints, warning) => {
    expectUnknown(rt(hints), warning);
  });

  it("refuses a cache-write count: no cache-write rate is published", () => {
    expectUnknown(
      rt({ ...counts(10, 0, 1, [0, 0, 0], [0, 0]), cacheWriteInputTokens: 5 }),
      "has no bundled cache-write rate"
    );
  });

  it("refuses modality counts on a model without modality rates", () => {
    const sol = (extra: CostHints): CostEstimate =>
      computeEstimate({
        provider: "openai",
        payload: { model: "gpt-5.6-sol" },
        costHints: {
          inputTokens: 100,
          outputTokens: 10,
          cacheReadInputTokens: 0,
          cacheWriteInputTokens: 0,
          ...extra,
        },
      });
    expectUnknown(
      sol({ audioInputTokens: 5 }),
      "has no bundled audio-token rate"
    );
    expectUnknown(
      sol({ imageInputTokens: 5 }),
      "has no bundled image-token rate"
    );
    // Zero modality counts change nothing.
    expect(sol({ audioInputTokens: 0, imageInputTokens: 0 }).usd).toBeCloseTo(
      (100 * 4 + 10 * 20) / 1_000_000,
      9
    );
  });

  it("does not price sibling realtime models", () => {
    for (const model of [
      "gpt-realtime-2.1-mini",
      "gpt-realtime-2",
      "gpt-realtime",
    ]) {
      expectUnknown(
        computeEstimate({
          provider: "openai",
          payload: { model },
          costHints: counts(10, 0, 1, [0, 0, 0], [0, 0]),
        }),
        `model '${model}' not found`
      );
    }
  });

  it("keeps a modality count from opting legacy rows out of fail-closed", () => {
    // Any declared count opts in to declared usage; totals are then required.
    expectUnknown(
      computeEstimate({
        provider: "openai",
        payload: {
          model: "gpt-4o",
          messages: [{ role: "user", content: "hi" }],
        },
        costHints: { audioInputTokens: 5 },
      }),
      "pass costHints.inputTokens, costHints.outputTokens"
    );
  });
});
