import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareCost,
  computeEstimate,
  extractActual,
  mergeActuals,
  type ActualUsage,
  type CostActual,
  type CostEstimate,
  type ProviderExchange,
} from "@apicity/cost";
import { entryToProviderExchange, type HarEntry } from "@apicity/har";

// Reads committed recordings as files: no Polly, no network.
const ROOT = path.resolve(__dirname, "../recordings");
const FIELDS = path.resolve(__dirname, "../fixtures/cost-actual-fields.tsv");

function entries(pin: string): HarEntry[] {
  const har = JSON.parse(readFileSync(path.join(ROOT, pin), "utf8"));
  return har.log.entries;
}

function actuals(pin: string, provider: string): CostActual[] {
  return entries(pin).map((entry) =>
    extractActual(entryToProviderExchange(entry, { provider }))
  );
}

function one(pin: string, provider: string): CostActual {
  const [actual] = actuals(pin, provider);
  if (!actual) throw new Error(`no entries in ${pin}`);
  return actual;
}

function inlineExchange(
  overrides: Partial<ProviderExchange> & { provider: string; url: string }
): ProviderExchange {
  return {
    method: "POST",
    status: 200,
    requestBody: null,
    responseHeaders: {},
    responseBody: null,
    ...overrides,
  };
}

// The field map's paths, as the survey wrote them: a list index is "[]", and a
// header is "header:<name>".
function numericFields(value: unknown, prefix = ""): Map<string, number> {
  const out = new Map<string, number>();
  const visit = (node: unknown, at: string) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item, `${at}[]`);
    } else if (typeof node === "object" && node !== null) {
      for (const [key, child] of Object.entries(node)) {
        visit(child, at ? `${at}.${key}` : key);
      }
    } else if (typeof node === "number") {
      out.set(at, node);
    }
  };
  visit(value, prefix);
  return out;
}

function rawField(exchange: ProviderExchange, field: string) {
  if (field.startsWith("header:")) {
    const raw = exchange.responseHeaders[field.slice("header:".length)];
    return raw === undefined ? undefined : Number(raw);
  }
  const frames = Array.isArray(exchange.responseBody)
    ? exchange.responseBody
    : [exchange.responseBody];
  let found: number | undefined;
  for (const frame of frames) {
    found = numericFields(frame).get(field) ?? found;
  }
  return found;
}

interface FieldRow {
  provider: string;
  dotPathPattern: string;
  field: string;
  actualKey: string;
  recordingPin: string;
}

const STATED_CHECKS: Record<string, (raw: number, actual: CostActual) => void> =
  {
    cost_in_usd_ticks: (raw, actual) =>
      expect(actual.statedUsd).toBeCloseTo(raw / 1e10, 12),
    creditsConsumed: (raw, actual) => {
      expect(actual.usage.credits).toBe(raw);
      expect(actual.statedUsd).toBeCloseTo(raw * 0.005, 10);
    },
    credits_consumed: (raw, actual) => {
      expect(actual.usage.credits).toBe(raw);
      expect(actual.statedUsd).toBeCloseTo(raw * 0.005, 10);
    },
    generation_cost_micros: (raw, actual) =>
      expect(actual.statedListUsd).toBeCloseTo(raw / 1e6, 10),
    net_cost_micros: (raw, actual) =>
      expect(actual.statedUsd).toBeCloseTo(raw / 1e6, 10),
    // Inside a plan's quota it reads 0, which says no overage was billed.
    "fiat-cost-before-overages": (raw, actual) =>
      expect(actual.statedUsd).toBe(raw > 0 ? raw : null),
    cost: (raw, actual) => expect(actual.statedUsd).toBe(raw),
  };

const ALIASES = [
  ["input_tokens", "prompt_tokens"],
  ["output_tokens", "completion_tokens"],
  ["cached_tokens", "cache_read_input_tokens"],
];

const fieldRows: FieldRow[] = readFileSync(FIELDS, "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => {
    const [provider, dotPathPattern, field, actualKey, recordingPin] =
      line.split("\t") as [string, string, string, string, string];
    return { provider, dotPathPattern, field, actualKey, recordingPin };
  });

describe("extractActual reads every field in the survey's map", () => {
  it("has rows for every family that reports a field", () => {
    expect(new Set(fieldRows.map((row) => row.provider))).toEqual(
      new Set([
        "alibaba",
        "anthropic",
        "elevenlabs",
        "fal",
        "fireworks",
        "google",
        "kie",
        "kimicoding",
        "machgen",
        "openai",
        "wavespeed",
        "xai",
        "zaicoding",
      ])
    );
  });

  it.each(fieldRows)(
    "$provider $field ($actualKey)",
    ({ provider, field, actualKey, recordingPin }) => {
      const hit = entries(recordingPin)
        .map((entry) => entryToProviderExchange(entry, { provider }))
        .find(
          (exchange) =>
            exchange.status >= 200 &&
            exchange.status < 300 &&
            rawField(exchange, field) !== undefined
        );
      if (!hit) throw new Error(`${field} not found in ${recordingPin}`);
      const raw = rawField(hit, field) as number;
      const actual = extractActual(hit);

      if (actualKey === "none") return;
      if (actualKey === "stated") {
        const leaf = field
          .replace(/^header:/, "")
          .split(".")
          .at(-1) as string;
        const check = STATED_CHECKS[leaf];
        if (!check) throw new Error(`no stated check for ${field}`);
        check(raw, actual);
        expect(actual.evidence).toContain(field);
        return;
      }

      const value = actual.usage[actualKey as keyof ActualUsage];
      // In a stream a later frame's usage replaces an earlier one, and some
      // bodies carry one count under two names (prompt_tokens and input_tokens).
      // Either way the extractor read this count through another path.
      if (!actual.evidence.includes(field)) {
        const leaf = field.split(".").at(-1) as string;
        const names = ALIASES.find((group) => group.includes(leaf)) ?? [leaf];
        expect(
          actual.evidence.some((seen) =>
            names.includes(seen.split(".").at(-1) as string)
          ),
          `${field} or an alias in ${actual.evidence.join(", ")}`
        ).toBe(true);
        expect(value).toBeTypeOf("number");
        return;
      }
      if (actualKey === "inputTokens" && field.endsWith("input_tokens")) {
        // Anthropic-shaped input is the uncached remainder, so the total adds
        // the cache counts. An OpenAI-shaped total already holds them.
        const { cacheReadInputTokens = 0, cacheWriteInputTokens = 0 } =
          actual.usage;
        expect([
          raw,
          raw + cacheReadInputTokens + cacheWriteInputTokens,
        ]).toContain(value);
      } else if (actualKey === "outputTokens") {
        // Google adds thoughts, and total_tokens can hold more than the field.
        expect(value).toBeGreaterThanOrEqual(raw);
      } else {
        expect(value).toBe(raw);
      }
    }
  );
});

describe("extractActual pins", () => {
  it("xAI image ticks", () => {
    const actual = one(
      "xai_3613880225/image-edit-aspect-ratio_2033117966/recording.har",
      "xai"
    );
    expect(actual.statedUsd).toBe(0.022);
    expect(actual.usd).toBe(0.022);
    expect(actual.basis).toBe("stated");
    expect(actual.settled).toBe(true);
    expect(actual.evidence).toEqual(["usage.cost_in_usd_ticks"]);
  });

  // Independent published rates pin the bundled derivation. The stated ticks
  // equal tokens times the published rates once the cached rate is included.
  it.each([
    [
      "grok-4-fast",
      "responses-create_280461930",
      170,
      153,
      98,
      0.2,
      0.05,
      0.5,
      600500,
    ],
    [
      "grok-4.6",
      "grok-4-6-responses_2467291669",
      221,
      128,
      128,
      2,
      0.5,
      6,
      10180000,
    ],
    [
      "grok-4",
      "vision-analysis-json_243984103",
      2684,
      679,
      728,
      3,
      0.75,
      15,
      174442500,
    ],
  ])(
    "xAI chat ticks: %s",
    (
      _model,
      name,
      input,
      cached,
      output,
      rateIn,
      rateCached,
      rateOut,
      ticks
    ) => {
      const actual = one(`xai_3613880225/${name}/recording.har`, "xai");
      expect(actual.usage).toMatchObject({
        inputTokens: input,
        cacheReadInputTokens: cached,
        outputTokens: output,
      });
      expect(actual.statedUsd).toBe(ticks / 1e10);
      const fromRates =
        (input - cached) * rateIn + cached * rateCached + output * rateOut;
      expect(Math.round(fromRates * 1e4)).toBe(ticks);
    }
  );

  it("xAI cached usage derives the stated figure", () => {
    const actual = one(
      "xai_3613880225/grok-4-6-responses_2467291669/recording.har",
      "xai"
    );
    expect(actual.derivedUsd).toBe(actual.statedUsd);
    expect(actual.warnings).toEqual([]);
  });

  it("KIE task credits", () => {
    const parts = actuals(
      "kie_2079838932/bytedance-seedance-2-4k_1424029474/recording.har",
      "kie"
    );
    const final = parts.at(-1) as CostActual;
    expect(final.usage.credits).toBe(832);
    expect(final.statedUsd).toBe(4.16);
    expect(final.model).toBe("bytedance/seedance-2");
    expect(final.settled).toBe(true);
    expect(final.evidence).toEqual(["data.creditsConsumed"]);
  });

  it("KIE chat credits, Anthropic-shaped, with a total input", () => {
    const actual = one(
      "kie_2079838932/anthropic-messages_56611030/recording.har",
      "kie"
    );
    expect(actual.usage).toMatchObject({
      credits: 0.06,
      inputTokens: 7571,
      cacheReadInputTokens: 7561,
      outputTokens: 46,
    });
    expect(actual.statedUsd).toBeCloseTo(0.0003, 10);
  });

  it("KIE ignores the xAI ticks passed through its grok routes", () => {
    const row = fieldRows.find(
      (candidate) =>
        candidate.provider === "kie" &&
        candidate.field === "usage.cost_in_usd_ticks"
    ) as FieldRow;
    const entry = entries(row.recordingPin)
      .map((item) => entryToProviderExchange(item, { provider: "kie" }))
      .find((exchange) => rawField(exchange, row.field) !== undefined);
    const actual = extractActual(entry as ProviderExchange);
    expect(actual.evidence).not.toContain("usage.cost_in_usd_ticks");
    expect(actual.statedUsd).toBeCloseTo(
      (actual.usage.credits as number) * 0.005,
      10
    );
  });

  it("MachGen receipt: both figures", () => {
    const actual = actuals(
      "machgen_3663587242/gpt-image-2-t2i_1069439625/recording.har",
      "machgen"
    ).at(-1) as CostActual;
    expect(actual.statedListUsd).toBe(0.001385);
    expect(actual.statedUsd).toBe(0.001177);
    expect(actual.usd).toBe(0.001177);
    expect(actual.basis).toBe("stated");
  });

  it("fal sync header", () => {
    const actual = one(
      "fal_2801268556/alibaba-happy-horse-image-to-video_287187440/recording.har",
      "fal"
    );
    expect(actual.usage.billableUnits).toBe(3);
    expect(actual.evidence).toContain("header:x-fal-billable-units");
    expect(actual.model).toBe("alibaba/happy-horse/image-to-video");
    expect(actual.settled).toBe(true);
    // The header's unit often differs from the table's, so nothing is derived.
    expect(actual.derivedUsd).toBeNull();
    expect(actual.basis).toBe("usage-only");
  });

  it("fal queue result header", () => {
    const final = actuals(
      "fal_2801268556/flux-3-klein-base-trainer-edit_546531/recording.har",
      "fal"
    ).at(-1) as CostActual;
    expect(final.usage.billableUnits).toBe(211);
    expect(final.settled).toBe(true);
  });

  it("ElevenLabs character-cost is credits, never stated USD", () => {
    const actual = one(
      "elevenlabs_2379486140/sound-generation_3519036185/recording.har",
      "elevenlabs"
    );
    expect(actual.usage.credits).toBe(10);
    expect(actual.statedUsd).toBeNull();
    expect(actual.basis).toBe("usage-only");
    expect(actual.warnings.join(" ")).toContain("depends on the plan");
  });

  it("ElevenLabs STT fiat header", () => {
    const actual = actuals(
      "elevenlabs_2379486140/speech-to-text-transcripts_1147943751/recording.har",
      "elevenlabs"
    )[0] as CostActual;
    expect(actual.evidence).toContain("header:fiat-cost-before-overages");
    // 0 inside a plan's quota says no overage was billed, not that it was free.
    expect(actual.statedUsd).toBeNull();
    expect(actual.usage.seconds).toBe(0.5);
    expect(actual.basis).toBe("derived");
    expect(actual.derivedUsd).toBeCloseTo((0.5 * 0.22) / 3600, 12);
    expect(actual.warnings.join(" ")).toContain("plan's quota");
  });

  // No committed OpenAI recording holds these two fields, only the capture
  // corpus, so each uses an inline body in the documented shape.
  it("OpenAI Responses with cache_write_tokens", () => {
    const actual = extractActual(
      inlineExchange({
        provider: "openai",
        url: "https://api.openai.com/v1/responses",
        requestBody: { model: "gpt-5.6-sol" },
        responseBody: {
          model: "gpt-5.6-sol",
          service_tier: "default",
          status: "completed",
          usage: {
            input_tokens: 1000,
            input_tokens_details: {
              cached_tokens: 200,
              cache_write_tokens: 300,
            },
            output_tokens: 50,
            output_tokens_details: { reasoning_tokens: 10 },
          },
        },
      })
    );
    expect(actual.usage).toEqual({
      inputTokens: 1000,
      cacheReadInputTokens: 200,
      cacheWriteInputTokens: 300,
      outputTokens: 50,
      reasoningTokens: 10,
    });
    // (500 x 4 + 200 x 0.4 + 300 x 5 + 50 x 20) / 1M
    expect(actual.derivedUsd).toBeCloseTo(0.00458, 10);
    expect(actual.basis).toBe("derived");
    expect(actual.rateAsOf).toBe("2026-11-04");
  });

  it("OpenAI bills a non-Standard tier nothing it can derive", () => {
    const actual = extractActual(
      inlineExchange({
        provider: "openai",
        url: "https://api.openai.com/v1/responses",
        requestBody: { model: "gpt-5.6-sol" },
        responseBody: {
          service_tier: "priority",
          usage: {
            input_tokens: 10,
            input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 },
            output_tokens: 1,
          },
        },
      })
    );
    expect(actual.derivedUsd).toBeNull();
    expect(actual.basis).toBe("usage-only");
    expect(actual.warnings.join(" ")).toContain("not bundled");
  });

  it("OpenAI transcription usage.seconds", () => {
    const actual = extractActual(
      inlineExchange({
        provider: "openai",
        url: "https://api.openai.com/v1/audio/transcriptions",
        requestBody: { model: "gpt-transcribe" },
        responseBody: { usage: { type: "duration", seconds: 91 } },
      })
    );
    expect(actual.usage).toEqual({ seconds: 91 });
    expect(actual.evidence).toEqual(["usage.seconds"]);
    expect(actual.basis).toBe("derived");
    expect(actual.usd).toBeCloseTo(0.006825, 12);
  });

  it("Anthropic cache counts from a recording", () => {
    const actual = one(
      "anthropic_2966493235/messages-code-review_891889396/recording.har",
      "anthropic"
    );
    expect(actual.usage).toEqual({
      inputTokens: 268,
      cacheReadInputTokens: 0,
      cacheWriteInputTokens: 0,
      outputTokens: 33,
    });
    // (268 x 3 + 33 x 15) / 1M
    expect(actual.derivedUsd).toBeCloseTo(0.001299, 10);
    expect(actual.evidence).toContain(
      "usage.cache_creation.ephemeral_5m_input_tokens"
    );
  });

  const anthropicMessage = (cacheCreation: Record<string, number>) =>
    inlineExchange({
      provider: "anthropic",
      url: "https://api.anthropic.com/v1/messages",
      requestBody: { model: "claude-sonnet-4-6" },
      responseBody: {
        usage: {
          input_tokens: 100,
          cache_read_input_tokens: 1000,
          cache_creation_input_tokens: 200,
          cache_creation: cacheCreation,
          output_tokens: 50,
        },
      },
    });

  it("prices Anthropic's 5-minute cache writes at cacheWrite5m", () => {
    const actual = extractActual(
      anthropicMessage({
        ephemeral_5m_input_tokens: 200,
        ephemeral_1h_input_tokens: 0,
      })
    );
    expect(actual.usage.inputTokens).toBe(1300);
    // (100 x 3 + 1000 x 0.3 + 200 x 3.75 + 50 x 15) / 1M
    expect(actual.derivedUsd).toBeCloseTo(0.0021, 10);
  });

  it("derives nothing for a 1-hour cache write, which has no bundled rate", () => {
    const actual = extractActual(
      anthropicMessage({
        ephemeral_5m_input_tokens: 0,
        ephemeral_1h_input_tokens: 200,
      })
    );
    expect(actual.derivedUsd).toBeNull();
    expect(actual.basis).toBe("usage-only");
    expect(actual.warnings.join(" ")).toContain("1-hour cache writes");
  });

  it("merges Anthropic stream frames: input first, output last", () => {
    const actual = extractActual(
      inlineExchange({
        provider: "anthropic",
        url: "https://api.anthropic.com/v1/messages",
        requestBody: { model: "claude-sonnet-4-6" },
        responseBody: [
          {
            type: "message_start",
            message: {
              usage: {
                input_tokens: 10,
                cache_read_input_tokens: 5,
                cache_creation_input_tokens: 0,
                output_tokens: 1,
              },
            },
          },
          { type: "message_delta", usage: { output_tokens: 40 } },
        ],
      })
    );
    expect(actual.usage).toMatchObject({ inputTokens: 15, outputTokens: 40 });
    expect(actual.evidence).toEqual(
      expect.arrayContaining([
        "message.usage.input_tokens",
        "usage.output_tokens",
      ])
    );
  });

  it("Alibaba video seconds", () => {
    const final = actuals(
      "alibaba_1329897167/wan-i2v_2196817451/recording.har",
      "alibaba"
    ).at(-1) as CostActual;
    expect(final.usage.seconds).toBe(5);
    expect(final.evidence).toContain("usage.duration");
    expect(final.settled).toBe(true);
  });

  it("adds reasoning when the total says the output leaves it out", () => {
    const actual = one(
      "xai_3613880225/responses-compact_101159155/recording.har",
      "xai"
    );
    expect(actual.usage).toMatchObject({
      inputTokens: 572,
      reasoningTokens: 607,
      outputTokens: 844,
    });
  });

  it.each([
    ["s3", "https://s3.us-east-1.amazonaws.com/b/k", "one request is the unit"],
    ["x", "https://api.x.com/2/tweets", "one request"],
    ["quo", "https://api.quo.com/v1/messages", "segment"],
    ["telegram", "https://api.telegram.org/bot/getMe", "no billing fields"],
  ])("%s has nothing to read and says so", (provider, url, phrase) => {
    const actual = extractActual(inlineExchange({ provider, url }));
    expect(actual.basis).toBe("none");
    expect(actual.usd).toBeNull();
    expect(actual.warnings.join(" ")).toContain(phrase);
  });

  it("WaveSpeed states nothing and names where the bill is", () => {
    const actual = extractActual(
      inlineExchange({
        provider: "wavespeed",
        url: "https://api.wavespeed.ai/api/v3/predictions/abc/result",
        method: "GET",
        responseBody: {
          data: { status: "completed", timings: { inference: 1200 } },
        },
      })
    );
    expect(actual.basis).toBe("none");
    expect(actual.settled).toBe(true);
    expect(actual.warnings.join(" ")).toContain("billings/search");
  });

  it("says why when usage has no figure", () => {
    const actual = extractActual(
      inlineExchange({
        provider: "google",
        url: "https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash:generateContent",
        responseBody: {
          usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 2 },
        },
      })
    );
    expect(actual.basis).toBe("usage-only");
    expect(actual.model).toBe("gemini-2.5-flash");
    expect(actual.warnings).toEqual([
      "no USD figure is derived: no bundled rate applies, or the request that selects one is not in this exchange",
    ]);
  });

  it("says so when a response reports nothing", () => {
    const actual = extractActual(
      inlineExchange({
        provider: "openai",
        method: "GET",
        url: "https://api.openai.com/v1/models",
        responseBody: { data: [] },
      })
    );
    expect(actual.basis).toBe("none");
    expect(actual.warnings).toEqual([
      "this response reports no usage or charge",
    ]);
  });

  it("never throws on a malformed exchange", () => {
    const actual = extractActual(
      inlineExchange({ provider: "fal", url: "http://[bad", responseBody: 7 })
    );
    expect(actual.basis).toBe("none");
    expect(actual.warnings.join(" ")).toContain("could not read");
  });

  it("does not modify the frames it reads", () => {
    const frames = [{ model: "a" }, { model: "b" }];
    extractActual(
      inlineExchange({
        provider: "openai",
        url: "https://api.openai.com/v1/responses",
        responseBody: frames,
      })
    );
    expect(frames).toEqual([{ model: "a" }, { model: "b" }]);
  });

  it("marks a truncated stream with no usage as unsettled", () => {
    const actual = extractActual(
      inlineExchange({
        provider: "openai",
        url: "https://api.openai.com/v1/responses",
        responseBody: [{ type: "response.output_text.delta" }],
        bodyTruncated: true,
      })
    );
    expect(actual.settled).toBe(false);
    expect(actual.warnings.join(" ")).toContain("stops before");
  });

  describe("what a solved rate must not absorb", () => {
    const xai = (responseBody: Record<string, unknown>) =>
      extractActual(
        inlineExchange({
          provider: "xai",
          url: "https://api.x.ai/v1/responses",
          requestBody: { model: "grok-4.6" },
          responseBody: {
            model: "grok-4.6",
            status: "completed",
            ...responseBody,
          },
        })
      );
    const usage = {
      input_tokens: 10,
      output_tokens: 5,
      cost_in_usd_ticks: 1e6,
    };

    it("says nothing on a plain call", () => {
      const actual = xai({ usage });
      expect(actual).not.toHaveProperty("uncoveredCharge");
      expect(actual).not.toHaveProperty("serviceTier");
    });

    it("names a fee no rate prices", () => {
      const actual = xai({
        usage: { ...usage, num_server_side_tools_used: 1 },
      });
      expect(actual.uncoveredCharge).toContain("server-side tool");
    });

    it("names the service tier the response reports", () => {
      expect(xai({ usage, service_tier: "priority" }).serviceTier).toBe(
        "priority"
      );
    });

    it("keeps both across a merge", () => {
      const merged = mergeActuals([
        xai({
          usage: { ...usage, num_server_side_tools_used: 1 },
          service_tier: "priority",
        }),
        xai({ usage }),
      ]);
      expect(merged.uncoveredCharge).toContain("server-side tool");
      expect(merged.serviceTier).toBe("priority");
    });
  });

  // A capture keeps a stream's two ends, so any frame can be missing from between.
  describe("a stream's two ends", () => {
    const anthropic = (responseBody: unknown[]) =>
      extractActual(
        inlineExchange({
          provider: "anthropic",
          url: "https://api.anthropic.com/v1/messages",
          requestBody: { model: "claude-sonnet-4-5" },
          responseBody,
          bodyTruncated: true,
        })
      );
    const start = {
      type: "message_start",
      message: { usage: { input_tokens: 100_000, output_tokens: 1 } },
    };
    const delta = {
      type: "message_delta",
      usage: { output_tokens: 50_000 },
    };
    const stop = { type: "message_stop" };

    it("settles once message_start and message_delta both survive", () => {
      const actual = anthropic([start, delta, stop]);
      expect(actual.settled).toBe(true);
      expect(actual.usd).toBeCloseTo(1.05, 6);
    });

    it.each([
      ["message_stop without message_delta", [start, stop]],
      ["message_delta without message_start", [delta, stop]],
    ])("states no figure from %s", (_, frames) => {
      const actual = anthropic(frames);
      expect(actual.settled).toBe(false);
      expect(actual.usd).toBeNull();
      expect(actual.warnings.join(" ")).toContain("stops before");
    });

    const chat = (responseBody: unknown[]) =>
      extractActual(
        inlineExchange({
          provider: "openai",
          url: "https://api.openai.com/v1/chat/completions",
          responseBody,
          bodyTruncated: true,
        })
      );
    const usage = { prompt_tokens: 1000, completion_tokens: 50 };

    it.each([
      ["a finish reason", [{ choices: [{ finish_reason: "stop" }], usage }]],
      ["no choices left", [{ choices: [], usage }]],
      ["no choices field", [{ usage }]],
    ])("takes a usage chunk with %s as final", (_, frames) => {
      expect(chat(frames).settled).toBe(true);
    });

    it("does not take a running count on an unfinished choice as final", () => {
      const actual = chat([{ choices: [{ finish_reason: null }], usage }]);
      expect(actual.settled).toBe(false);
      expect(actual.usd).toBeNull();
    });
  });

  describe("a stream cut short", () => {
    const anthropicStart = {
      type: "message_start",
      message: {
        usage: {
          input_tokens: 10,
          cache_read_input_tokens: 5,
          cache_creation_input_tokens: 0,
          output_tokens: 1,
        },
      },
    };

    it("is unsettled and derives nothing from message_start's placeholder output", () => {
      const actual = extractActual(
        inlineExchange({
          provider: "anthropic",
          url: "https://api.anthropic.com/v1/messages",
          requestBody: { model: "claude-sonnet-4-6" },
          responseBody: [anthropicStart],
          bodyTruncated: true,
        })
      );
      expect(actual.settled).toBe(false);
      expect(actual.derivedUsd).toBeNull();
    });

    it("is whole when the tail kept the final usage frame", () => {
      const actual = extractActual(
        inlineExchange({
          provider: "anthropic",
          url: "https://api.anthropic.com/v1/messages",
          requestBody: { model: "claude-sonnet-4-6" },
          responseBody: [
            anthropicStart,
            { type: "message_delta", usage: { output_tokens: 40 } },
          ],
          bodyTruncated: true,
        })
      );
      expect(actual.settled).toBe(true);
      expect(actual.usage.outputTokens).toBe(40);
      expect(actual.derivedUsd).not.toBeNull();
    });

    it.each([
      [
        "kie",
        "https://api.kie.ai/gemini/v1/models/x:streamGenerateContent",
        [{ usageMetadata: { promptTokenCount: 4 } }],
      ],
      [
        "google",
        "https://aiplatform.googleapis.com/v1/publishers/google/models/m:generateContent",
        [{ usageMetadata: { promptTokenCount: 4 }, candidates: [{}] }],
      ],
    ])("is unsettled on %s too", (provider, url, responseBody) => {
      const actual = extractActual(
        inlineExchange({ provider, url, responseBody, bodyTruncated: true })
      );
      expect(actual.settled).toBe(false);
    });

    it("the same flag on a whole JSON body means the request was truncated", () => {
      const actual = extractActual(
        inlineExchange({
          provider: "xai",
          url: "https://api.x.ai/v1/images/edits",
          responseBody: { usage: { cost_in_usd_ticks: 200000000 } },
          bodyTruncated: true,
        })
      );
      expect(actual.settled).toBe(true);
      expect(actual.statedUsd).toBe(0.02);
      expect(actual.warnings.join(" ")).not.toContain("stops before");
    });

    it("a binary placeholder is settled and says its body is gone", () => {
      const actual = extractActual(
        inlineExchange({
          provider: "elevenlabs",
          url: "https://api.elevenlabs.io/v1/text-to-speech/v",
          responseBody: null,
          bodyTruncated: true,
        })
      );
      expect(actual.settled).toBe(true);
      expect(actual.warnings.join(" ")).toContain("not captured");
    });
  });

  describe("a charge the token rate cannot see fails the figure closed", () => {
    it("an OpenAI web search call", () => {
      const actual = actuals(
        "openai_3991279299/responses-web-search_2869815247/recording.har",
        "openai"
      )[0] as CostActual;
      expect(actual.usage.inputTokens).toBe(309);
      expect(actual.derivedUsd).toBeNull();
      expect(actual.basis).toBe("usage-only");
      expect(actual.warnings.join(" ")).toContain("web_search_call");
    });

    const anthropic = (usage: Record<string, unknown>, body = {}) =>
      extractActual(
        inlineExchange({
          provider: "anthropic",
          url: "https://api.anthropic.com/v1/messages",
          requestBody: { model: "claude-sonnet-4-6", ...body },
          responseBody: {
            usage: { input_tokens: 1000, output_tokens: 100, ...usage },
          },
        })
      );

    it("prices an ordinary Anthropic call", () => {
      expect(anthropic({ inference_geo: "global" }).derivedUsd).toBeCloseTo(
        0.0045,
        10
      );
    });

    it.each([
      ["US-only inference", { inference_geo: "us" }, {}, "multiplier"],
      [
        "a web search",
        { server_tool_use: { web_search_requests: 1 } },
        {},
        "server tool",
      ],
      ["fast mode", {}, { speed: "fast" }, "fast mode"],
    ])("Anthropic %s", (_name, usage, body, phrase) => {
      const actual = anthropic(usage, body);
      expect(actual.derivedUsd).toBeNull();
      expect(actual.warnings.join(" ")).toContain(phrase);
    });

    it("web fetch is token-priced, so it still derives", () => {
      expect(
        anthropic({ server_tool_use: { web_fetch_requests: 1 } }).derivedUsd
      ).toBeCloseTo(0.0045, 10);
    });

    it("an xAI server-side tool, with the ticks still stated", () => {
      const actual = extractActual(
        inlineExchange({
          provider: "xai",
          url: "https://api.x.ai/v1/responses",
          requestBody: { model: "grok-build-0.1" },
          responseBody: {
            usage: {
              input_tokens: 10,
              input_tokens_details: { cached_tokens: 0 },
              output_tokens: 5,
              num_server_side_tools_used: 2,
              cost_in_usd_ticks: 50000000,
            },
          },
        })
      );
      expect(actual.derivedUsd).toBeNull();
      expect(actual.statedUsd).toBe(0.005);
      expect(actual.basis).toBe("stated");
    });

    it("a regional endpoint's uplift", () => {
      const actual = extractActual(
        inlineExchange({
          provider: "xai",
          url: "https://us.api.x.ai/v1/responses",
          requestBody: { model: "grok-build-0.1" },
          responseBody: {
            usage: {
              input_tokens: 10,
              input_tokens_details: { cached_tokens: 0 },
              output_tokens: 5,
            },
          },
        })
      );
      expect(actual.derivedUsd).toBeNull();
      expect(actual.warnings.join(" ")).toContain("regional");
    });

    it("KIE cached tokens on a card with no cache rate", () => {
      const actual = one(
        "kie_2079838932/claude-haiku-5-5-chat-hello_1507256244/recording.har",
        "kie"
      );
      expect(actual.usage.cacheReadInputTokens).toBe(3616);
      expect(actual.derivedUsd).toBeNull();
      expect(actual.statedUsd).toBeCloseTo(0.0003, 10);
      expect(actual.warnings.join(" ")).toContain("cached tokens");
    });
  });

  describe("per-unit rows", () => {
    it("a band prices once, matching the receipt", () => {
      const parts = actuals(
        "machgen_3663587242/vidu-q3-turbo-i2v-6s_3970792303/recording.har",
        "machgen"
      );
      expect(parts[0]?.usage.seconds).toBe(6);
      expect(parts[0]?.derivedUsd).toBeCloseTo(0.093, 10);
      expect(parts.at(-1)?.statedListUsd).toBe(0.093);
    });

    it("prices by the model the caller sent when the response names an alias", () => {
      const pin =
        "machgen_3663587242/wan-2-2-a14b-i2v_3145422822/recording.har";
      const parts = actuals(pin, "machgen");
      expect(parts[0]?.derivedUsd).toBeCloseTo(0.09, 10);
      const merged = mergeActuals(parts);
      expect(merged.model).toBe("Wan2.2-A14B");
    });

    it("prices units on the poll at the rate the submit's request selected", () => {
      const parts = actuals(
        "alibaba_1329897167/wan-i2v_2196817451/recording.har",
        "alibaba"
      );
      const poll = parts.at(-1) as CostActual;
      expect(poll.basis).toBe("usage-only");
      expect(poll.warnings.join(" ")).toContain("not in this exchange");
      const merged = mergeActuals(parts);
      expect(merged.derivedUsd).toBeCloseTo(0.5, 10);
      expect(merged.basis).toBe("derived");
      expect(merged.warnings).toEqual([]);
    });

    it("reports no seconds when MachGen's length follows the source", () => {
      const parts = actuals(
        "machgen_3663587242/seedance-2-5-r2v-video-edit_2669245042/recording.har",
        "machgen"
      );
      for (const part of parts) {
        expect(part.usage.seconds).toBeUndefined();
      }
    });
  });

  describe("usage totals", () => {
    it("adds what total_tokens holds beyond input and output", () => {
      const actual = one(
        "kie_2079838932/gemini-31-pro-chat_166868540/recording.har",
        "kie"
      );
      expect(actual.usage).toMatchObject({ inputTokens: 8, outputTokens: 107 });
    });

    it("does not read a cache-heavy Anthropic-shaped total as hidden output", () => {
      const actual = extractActual(
        inlineExchange({
          provider: "kimicoding",
          url: "https://api.kimi.com/coding/v1/messages",
          responseBody: {
            usage: {
              input_tokens: 0,
              cache_read_input_tokens: 92,
              cache_creation_input_tokens: 0,
              prompt_tokens: 92,
              output_tokens: 38,
              total_tokens: 130,
            },
          },
        })
      );
      expect(actual.usage).toMatchObject({ inputTokens: 92, outputTokens: 38 });
    });
  });
});

describe("settled", () => {
  const kie = actuals(
    "kie_2079838932/bytedance-seedance-2-4k_1424029474/recording.har",
    "kie"
  );

  it("KIE createTask and in-flight polls are not settled", () => {
    expect(kie[0]?.settled).toBe(false);
    // An in-flight poll already states the final bill, but the task is not over.
    expect(kie[1]?.settled).toBe(false);
    expect(kie[1]?.statedUsd).toBe(4.16);
  });

  it("a fal queue submit and status read are not settled", () => {
    const submit = inlineExchange({
      provider: "fal",
      url: "https://queue.fal.run/fal-ai/flux/dev",
      responseBody: { status: "IN_QUEUE", request_id: "r" },
    });
    const status = inlineExchange({
      provider: "fal",
      method: "GET",
      url: "https://queue.fal.run/fal-ai/flux/requests/r/status",
      responseBody: { status: "IN_PROGRESS" },
    });
    const queued = inlineExchange({
      provider: "fal",
      method: "GET",
      status: 202,
      url: "https://queue.fal.run/fal-ai/flux/requests/r",
      responseBody: { status: "IN_QUEUE" },
    });
    for (const exchange of [submit, status, queued]) {
      expect(extractActual(exchange).settled).toBe(false);
    }
  });

  it("KIE reads each poll route's own finished field", () => {
    const poll = (data: Record<string, unknown>) =>
      extractActual(
        inlineExchange({
          provider: "kie",
          method: "GET",
          url: "https://api.kie.ai/api/v1/veo/record-info",
          responseBody: { code: 200, data },
        })
      ).settled;
    expect(poll({ state: "waiting" })).toBe(false);
    expect(poll({ state: "fail" })).toBe(true);
    expect(poll({ successFlag: 0 })).toBe(false);
    expect(poll({ successFlag: 1 })).toBe(true);
    expect(poll({ status: "PENDING" })).toBe(false);
    expect(poll({ status: "FIRST_SUCCESS" })).toBe(false);
    expect(poll({ status: "SUCCESS" })).toBe(true);
    expect(poll({ status: "GENERATE_AUDIO_FAILED" })).toBe(true);
  });

  it("reads the other KIE routes' words and numbers", () => {
    const poll = (url: string, data: Record<string, unknown>) =>
      extractActual(
        inlineExchange({
          provider: "kie",
          method: "GET",
          url: `https://api.kie.ai${url}`,
          responseBody: { code: 200, data },
        })
      ).settled;
    const wav = "/api/v1/wav/record-info";
    expect(poll(wav, { successFlag: "PENDING" })).toBe(false);
    expect(poll(wav, { successFlag: "SUCCESS" })).toBe(true);
    expect(poll(wav, { successFlag: "GENERATE_WAV_FAILED" })).toBe(true);
    const cover = "/api/v1/suno/cover/record-info";
    expect(poll(cover, { successFlag: 2 })).toBe(false);
    expect(poll(cover, { successFlag: 3 })).toBe(true);
    const veo = "/api/v1/veo/record-info";
    expect(poll(veo, { successFlag: 2 })).toBe(true);
    const voice = "/api/v1/voice/record-info";
    expect(poll(voice, { status: "wait_processing" })).toBe(false);
    expect(poll(voice, { status: "processing_validate" })).toBe(false);
    expect(poll(voice, { status: "processing_validate_fail" })).toBe(true);
    expect(poll(voice, { status: "success" })).toBe(true);
    expect(poll(voice, { status: "fail" })).toBe(true);
  });

  it("a KIE sync route that answers in its own words is finished", () => {
    const parts = actuals(
      "kie_2079838932/suno_690832138/style-boost_3473068648/recording.har",
      "kie"
    );
    expect(parts[0]?.settled).toBe(true);
  });

  it("an xAI video is unsettled only while pending", () => {
    const poll = (status: string) =>
      extractActual(
        inlineExchange({
          provider: "xai",
          method: "GET",
          url: "https://api.x.ai/v1/videos/abc",
          responseBody: { status },
        })
      ).settled;
    expect(poll("pending")).toBe(false);
    expect(poll("done")).toBe(true);
    expect(poll("failed")).toBe(true);
    expect(poll("expired")).toBe(true);
  });

  it("a 4xx ends the call, and a 429 or 5xx may pass", () => {
    const failed = (status: number, provider: string, url: string) =>
      extractActual(inlineExchange({ provider, url, status }));
    const generate = "https://api.machgen.ai/api/v0/generate";
    const result = "https://queue.fal.run/fal-ai/flux/requests/r";
    expect(failed(400, "machgen", generate).settled).toBe(true);
    expect(failed(422, "fal", result).settled).toBe(true);
    expect(failed(429, "machgen", generate).settled).toBe(false);
    expect(failed(503, "machgen", generate).settled).toBe(false);
    const invalidKey = one(
      "machgen_3663587242/invalid-key_2715742494/recording.har",
      "machgen"
    );
    expect(invalidKey.settled).toBe(true);
    expect(invalidKey.warnings.join(" ")).not.toContain("no final usage");
  });

  it("a MachGen receipt that answers 409 is still pending", () => {
    const running = extractActual(
      inlineExchange({
        provider: "machgen",
        method: "GET",
        url: "https://api.machgen.ai/api/v0/tasks/t",
        responseBody: { status: "RUNNING" },
      })
    );
    const receipt = extractActual(
      inlineExchange({
        provider: "machgen",
        method: "GET",
        status: 409,
        url: "https://api.machgen.ai/api/v0/tasks/t/billing",
        responseBody: { detail: "not finished" },
      })
    );
    expect(receipt.settled).toBe(false);
    expect(mergeActuals([running, receipt]).settled).toBe(false);
  });

  it("a Fireworks job settles when its state is final", () => {
    const job = (state: string) =>
      extractActual(
        inlineExchange({
          provider: "fireworks",
          method: "GET",
          url: "https://api.fireworks.ai/v1/accounts/a/batchInferenceJobs/j",
          responseBody: { state, jobProgress: { inputTokens: 5 } },
        })
      ).settled;
    expect(job("JOB_STATE_RUNNING")).toBe(false);
    expect(job("JOB_STATE_WRITING_RESULTS")).toBe(false);
    expect(job("JOB_STATE_COMPLETED")).toBe(true);
    expect(job("JOB_STATE_FAILED")).toBe(true);
  });

  it("an Alibaba task settles once it leaves PENDING and RUNNING", () => {
    const poll = (task_status: string) =>
      extractActual(
        inlineExchange({
          provider: "alibaba",
          method: "GET",
          url: "https://dashscope.aliyuncs.com/api/v1/tasks/abc",
          responseBody: { output: { task_status } },
        })
      ).settled;
    expect(poll("RUNNING")).toBe(false);
    expect(poll("SUCCEEDED")).toBe(true);
    expect(poll("FAILED")).toBe(true);
  });

  it("MachGen generate is not settled and a running task is not either", () => {
    const parts = actuals(
      "machgen_3663587242/gpt-image-2-t2i_1069439625/recording.har",
      "machgen"
    );
    expect(parts[0]?.settled).toBe(false);
    expect(parts[1]?.settled).toBe(false);
    expect(parts[2]?.settled).toBe(true);
  });
});

describe("mergeActuals", () => {
  it("KIE createTask plus polls ends settled with the final credits", () => {
    const merged = mergeActuals(
      actuals(
        "kie_2079838932/bytedance-seedance-2-4k_1424029474/recording.har",
        "kie"
      )
    );
    expect(merged.settled).toBe(true);
    expect(merged.usage.credits).toBe(832);
    expect(merged.statedUsd).toBe(4.16);
    expect(merged.basis).toBe("stated");
    expect(merged.warnings).toEqual([]);
  });

  it("MachGen generate, poll and billing ends with both stated figures", () => {
    const merged = mergeActuals(
      actuals(
        "machgen_3663587242/gpt-image-2-t2i_1069439625/recording.har",
        "machgen"
      )
    );
    expect(merged.settled).toBe(true);
    expect(merged.statedListUsd).toBe(0.001385);
    expect(merged.statedUsd).toBe(0.001177);
    expect(merged.model).toBe("GPT-Image-2");
  });

  it("a fal submit, status and result ends with billableUnits", () => {
    const merged = mergeActuals(
      actuals(
        "fal_2801268556/flux-3-klein-base-trainer-edit_546531/recording.har",
        "fal"
      )
    );
    expect(merged.settled).toBe(true);
    expect(merged.usage.billableUnits).toBe(211);
    expect(merged.model).toBe("blackforestlabs/flux-3/klein/base/trainer/edit");
    expect(merged.warnings).toEqual([
      "x-fal-billable-units is in fal's own unit, so no USD figure is derived",
    ]);
  });

  it("stays unsettled while no part has finished", () => {
    const submit = extractActual(
      inlineExchange({
        provider: "machgen",
        url: "https://api.machgen.ai/api/v0/generate",
        responseBody: { task_id: "t", metadata: { model: "MiniMax-H3" } },
      })
    );
    const merged = mergeActuals([submit]);
    expect(merged.settled).toBe(false);
    expect(merged.warnings.join(" ")).toContain("no final usage");
  });

  it("drops a part's nothing-reported warning once another part has a figure", () => {
    const empty = extractActual(
      inlineExchange({
        provider: "machgen",
        method: "GET",
        url: "https://api.machgen.ai/api/v0/assets/t",
      })
    );
    expect(empty.warnings).toContain(
      "this response reports no usage or charge"
    );
    const receipt = extractActual(
      inlineExchange({
        provider: "machgen",
        method: "GET",
        url: "https://api.machgen.ai/api/v0/tasks/t/billing",
        responseBody: { generation_cost_micros: 10, net_cost_micros: 8 },
      })
    );
    expect(mergeActuals([empty, receipt]).warnings).toEqual([]);
  });

  it("an upload before the submit does not settle the call", () => {
    const parts = actuals(
      "kie_2079838932/wan-27-first-last-frame_100869299/recording.har",
      "kie"
    );
    const merged = mergeActuals(parts.slice(0, 4));
    expect(merged.settled).toBe(false);
    expect(merged.warnings.join(" ")).toContain("no final usage");
    expect(mergeActuals(parts).settled).toBe(true);
  });

  it("a free quote before the submit does not settle the call", () => {
    const parts = actuals(
      "machgen_3663587242/topaz-video-precision-upscale_641924036/recording.har",
      "machgen"
    );
    expect(mergeActuals(parts.slice(0, 3)).settled).toBe(false);
  });

  it.each([
    [
      "kie",
      "kie_2079838932/bytedance-seedance-2-5-draft_83551116/recording.har",
    ],
    [
      "machgen",
      "machgen_3663587242/minimax-h3-upscale_2427716702/recording.har",
    ],
  ])("warns when %s parts look like two calls", (provider, pin) => {
    const merged = mergeActuals(actuals(pin, provider));
    expect(merged.warnings.join(" ")).toContain("more than one call");
  });

  it("reports nothing to merge", () => {
    const merged = mergeActuals([]);
    expect(merged.basis).toBe("none");
    expect(merged.usd).toBeNull();
  });
});

describe("compareCost", () => {
  const estimate = (
    usd: number,
    over?: Partial<CostEstimate>
  ): CostEstimate => ({
    usd,
    currency: "USD",
    source: "per-unit-table",
    breakdown: {},
    rateAsOf: "2026-11-04",
    warnings: [],
    ...over,
  });
  const actual = (over: Partial<CostActual>): CostActual => ({
    provider: "kie",
    dotPath: null,
    model: null,
    usage: {},
    evidence: [],
    statedUsd: null,
    statedListUsd: null,
    derivedUsd: null,
    usd: null,
    basis: "stated",
    settled: true,
    rateAsOf: null,
    warnings: [],
    ...over,
  });

  it("reads an estimate whose optional fields are absent", () => {
    const paid = actual({ usd: 0.5 });
    expect(compareCost({ usd: 0.5 }, paid).verdict).toBe("match");
    expect(
      compareCost({ usd: 0, source: "per-unit-table" }, paid).verdict
    ).toBe("under");
    expect(compareCost({ usd: 0, status: "zero" }, actual({})).verdict).toBe(
      "free"
    );
  });

  it("match, within the 2% default tolerance", () => {
    const result = compareCost(estimate(1.01), actual({ usd: 1 }));
    expect(result.verdict).toBe("match");
    expect(result.deltaUsd).toBeCloseTo(0.01, 10);
    expect(result.ratio).toBeCloseTo(1.01, 10);
  });

  it("over, when the estimate runs high", () => {
    const result = compareCost(estimate(2), actual({ usd: 1 }));
    expect(result).toMatchObject({ verdict: "over", deltaUsd: 1, ratio: 2 });
  });

  it("under, when the estimate runs low", () => {
    const result = compareCost(estimate(0.5), actual({ usd: 1 }));
    expect(result).toMatchObject({
      verdict: "under",
      deltaUsd: -0.5,
      ratio: 0.5,
    });
  });

  it("honours an explicit tolerance", () => {
    expect(
      compareCost(estimate(1.1), actual({ usd: 1 }), { tolerance: 0.2 }).verdict
    ).toBe("match");
  });

  it("no-estimate: none quoted, or the estimator failed closed", () => {
    expect(compareCost(null, actual({ usd: 1 })).verdict).toBe("no-estimate");
    const failed = estimate(0, { warnings: ["no rate"] });
    const result = compareCost(failed, actual({ usd: 1 }));
    expect(result).toMatchObject({ verdict: "no-estimate", estimateUsd: null });
  });

  it("no-actual: usage with no figure", () => {
    const result = compareCost(
      estimate(1),
      actual({ basis: "usage-only", usd: null })
    );
    expect(result).toMatchObject({ verdict: "no-actual", actualUsd: null });
  });

  it("free: a free estimate, or zero on both sides", () => {
    expect(
      compareCost(estimate(0, { source: "free" }), actual({ usd: 0 })).verdict
    ).toBe("free");
    expect(compareCost(estimate(0), actual({ usd: 0 })).verdict).toBe("free");
  });

  it("free: a free estimate with nothing to read", () => {
    const result = compareCost(
      estimate(0, { source: "free" }),
      actual({ basis: "none", usd: null })
    );
    expect(result).toMatchObject({ verdict: "free", actualUsd: null });
  });

  it("free: a zero-status endpoint estimate, whatever its source", () => {
    const zero = { ...estimate(0), status: "zero" } as CostEstimate;
    expect(
      compareCost(zero, actual({ basis: "none", usd: null })).verdict
    ).toBe("free");
  });

  it("under: a free estimate the provider then billed", () => {
    const result = compareCost(
      estimate(0, { source: "free" }),
      actual({ usd: 0.5 })
    );
    expect(result).toMatchObject({
      verdict: "under",
      deltaUsd: -0.5,
      ratio: 0,
    });
  });

  it("over, with no ratio, when the actual is zero", () => {
    const result = compareCost(estimate(1), actual({ usd: 0 }));
    expect(result).toMatchObject({ verdict: "over", ratio: null });
  });

  it("no-actual: an unsettled figure can still move", () => {
    const waiting = actuals(
      "kie_2079838932/seedream-5-pro-text-to-image_3273949277/recording.har",
      "kie"
    )[1] as CostActual;
    expect(waiting.settled).toBe(false);
    expect(waiting.statedUsd).toBe(0);
    const result = compareCost(estimate(0.035), waiting);
    expect(result).toMatchObject({ verdict: "no-actual", actualUsd: null });
  });

  it("a plan's zero fiat header is not a rate error", () => {
    const actual = actuals(
      "elevenlabs_2379486140/speech-to-text_1600104305/recording.har",
      "elevenlabs"
    )[0] as CostActual;
    expect(actual.statedUsd).toBeNull();
    const result = compareCost(estimate(actual.usd as number), actual);
    expect(result.verdict).toBe("match");
  });

  it("compares a MachGen estimate with the list figure, not the net", () => {
    const merged = mergeActuals(
      actuals(
        "machgen_3663587242/gpt-image-2-t2i_1069439625/recording.har",
        "machgen"
      )
    );
    const result = compareCost(estimate(0.001385), merged);
    expect(merged.usd).toBe(0.001177);
    expect(result.actualUsd).toBe(0.001385);
    expect(result.verdict).toBe("match");
  });
});

describe("no behaviour change for existing callers", () => {
  it("computeEstimate with no hints stays fail-closed for gpt-5.6-sol", () => {
    const estimate = computeEstimate({
      provider: "openai",
      payload: { model: "gpt-5.6-sol", input: "hello", max_output_tokens: 100 },
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.source).toBe("declared-tokens+table");
    expect(estimate.breakdown).toEqual({ unit: "tokens" });
    expect(estimate.warnings).toHaveLength(1);
    expect(estimate.warnings[0]).toContain("No estimate is quoted.");
  });
});

describe("package boundaries", () => {
  const sources = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name);
      return statSync(full).isDirectory()
        ? sources(full)
        : /\.(ts|mjs)$/.test(name)
          ? [full]
          : [];
    });
  const pkgDir = (name: string) =>
    path.resolve(__dirname, `../../packages/provider/${name}`);

  it.each([
    ["cost", "@apicity/har"],
    ["har", "@apicity/cost"],
  ])("%s does not import %s", (name, other) => {
    for (const file of sources(path.join(pkgDir(name), "src"))) {
      const text = readFileSync(file, "utf8");
      expect(
        new RegExp(`from "${other}|import\\("${other}`).test(text),
        file
      ).toBe(false);
    }
    const pkg = JSON.parse(
      readFileSync(path.join(pkgDir(name), "package.json"), "utf8")
    );
    for (const field of [
      "dependencies",
      "peerDependencies",
      "optionalDependencies",
    ]) {
      expect(Object.keys(pkg[field] ?? {})).not.toContain(other);
    }
  });
});
