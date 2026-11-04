import { readFileSync } from "node:fs";
import {
  entryToProviderExchange,
  type HarEntry,
} from "../../packages/provider/har/src/index";
import { describe, it, expect } from "vitest";
import {
  computeEstimate,
  estimateEndpoint,
  extractActual,
  mergeActuals,
} from "../../packages/provider/cost/src/index";
import type { CostHints } from "../../packages/provider/cost/src/types";

const endpoint = (
  dotPath: string,
  payload: Record<string, unknown> = {},
  costHints?: CostHints
) =>
  estimateEndpoint({
    provider: "elevenlabs",
    method: "POST",
    dotPath,
    payload,
    costHints,
  });
describe("ElevenLabs P2 list rates and endpoint routing", () => {
  it.each([
    ["eleven_flash_v2_5", 0.04],
    ["eleven_turbo_v2_5", 0.04],
    ["eleven_multilingual_v2", 0.08],
    ["eleven_multilingual_v3", 0.08],
    ["eleven_v3", 0.08],
    ["eleven_v4", 0.08],
    ["eleven_v4_turbo", 0.04],
    ["eleven_v3_conversational", 0.04],
    ["eleven_flash_v2", 0.04],
    ["eleven_turbo_v2", 0.04],
  ] as const)(
    "prices %s equally with and without the videobook endpoint",
    (model_id, usd) => {
      const payload = { model_id, text: "x".repeat(1000) };
      const direct = computeEstimate({ provider: "elevenlabs", payload });
      expect(direct.usd).toBeCloseTo(usd, 12);
      expect(
        computeEstimate({
          provider: "elevenlabs",
          endpoint: "text-to-speech",
          payload,
        })
      ).toEqual(direct);
      expect(direct.warnings).toEqual([]);
      expect(direct.notes?.[0]).toContain("credits");
      expect(direct.rateAsOf).toBe("2026-11-04");
    }
  );
  it.each(["music", "sound-generation", "video-to-music"])(
    "prices videobook %s or names the missing duration hint",
    (key) => {
      const req = {
        provider: "elevenlabs" as const,
        endpoint: key,
        payload: {},
      };
      expect(computeEstimate(req).warnings.join(" ")).toContain(
        "costHints.durationSeconds"
      );
      expect(
        computeEstimate({ ...req, costHints: { durationSeconds: 60 } }).usd
      ).toBeCloseTo(key === "sound-generation" ? 0.12 : 0.15, 12);
    }
  );
  it.each([
    ["v1.music", 0.15],
    ["v1.music.detailed", 0.15],
    ["v1.music.stream", 0.15],
    ["v1.music.upload", 0.15],
    ["v1.music.videoToMusic", 0.15],
    ["v1.soundGeneration", 0.12],
    ["v1.audioIsolation", 0.12],
    ["v1.audioIsolation.stream", 0.12],
    ["v1.speechToSpeech", 0.12],
    ["v1.speechToSpeech.stream", 0.12],
    ["v1.forcedAlignment", 0.22 / 60],
  ] as const)("maps %s to its rate", (path, usd) => {
    expect(endpoint(path, {}, { durationSeconds: 60 })).toMatchObject({
      status: "priced",
      warnings: [],
    });
    expect(endpoint(path, {}, { durationSeconds: 60 }).usd).toBeCloseTo(
      usd,
      12
    );
  });
  it("uses wire durations before hints and sums dialogue texts", () => {
    expect(
      endpoint("v1.music", { music_length_ms: 120000 }, { durationSeconds: 60 })
        .usd
    ).toBeCloseTo(0.3, 12);
    expect(
      endpoint(
        "v1.soundGeneration",
        { duration_seconds: 30 },
        { durationSeconds: 60 }
      ).usd
    ).toBeCloseTo(0.06, 12);
    expect(
      endpoint("v1.textToDialogue", {
        inputs: [{ text: "x".repeat(500) }, { text: "y".repeat(500) }],
      }).usd
    ).toBeCloseTo(0.08, 12);
    expect(
      endpoint("v1.textToDialogue", { inputs: [{ text: "ok" }, {}] }).status
    ).toBe("unavailable");
  });
  it.each([
    "v1.studio.projects.create",
    "v1.studio.projects.content.update",
    "v1.audioNative",
    "v1.audioNative.content.update",
  ])("only bills %s with auto_convert", (path) => {
    for (const auto_convert of [undefined, false])
      expect(endpoint(path, { auto_convert })).toMatchObject({
        usd: 0,
        status: "zero",
        warnings: [],
        zeroReason: expect.stringContaining("not converted"),
        billing: { kind: "metered" },
      });
    expect(
      endpoint(path, {
        auto_convert: true,
        model_id: "eleven_v4",
      }).warnings.join(" ")
    ).toContain("costHints.characters");
    expect(
      endpoint(
        path,
        { auto_convert: true, model_id: "eleven_v4" },
        { characters: 1000 }
      )
    ).toMatchObject({ status: "priced", usd: 0.08 });
  });
  it.each([
    "v1.studio.projects.convert",
    "v1.studio.projects.chapters.convert",
  ])("requires explicit model and characters for %s", (path) => {
    expect(
      endpoint(path, {}, { characters: 1000 }).warnings.join(" ")
    ).toContain("costHints.model");
    expect(
      endpoint(path, {}, { characters: 1000, model: "eleven_v4" }).usd
    ).toBeCloseTo(0.08, 12);
    expect(
      endpoint(
        path,
        { model_id: "eleven_flash_v2", text: "x".repeat(100) },
        { characters: 1000, model: "eleven_v4" }
      ).usd
    ).toBeCloseTo(0.004, 12);
  });
  it.each([0, -1, NaN, Infinity, "100"])(
    "rejects invalid character hint %s",
    (characters) => {
      expect(
        endpoint(
          "v1.studio.podcasts.create",
          { model_id: "eleven_v4" },
          { characters: characters as number }
        ).status
      ).toBe("unavailable");
    }
  );
  it("ignores model hints outside the documented project conversion routes", () => {
    expect(
      endpoint("v1.textToSpeech", { text: "hello" }, { model: "eleven_v4" })
        .status
    ).toBe("unavailable");
  });
  it.each([
    "v1.textToVoice.design",
    "v1.textToVoice.remix",
    "v1.studio.podcasts.create",
  ])("prices %s at the explicit model rate", (path) => {
    expect(
      endpoint(path, { model_id: "eleven_v4", text: "x".repeat(1000) }).usd
    ).toBeCloseTo(0.08, 12);
  });
  it.each([
    ["dubbing_v1", true, 0.33],
    ["dubbing_v1", false, 0.5],
    ["dubbing_v2", false, 2.2],
  ] as const)("prices %s watermark=%s", (dubbing_model, watermark, usd) => {
    expect(
      endpoint(
        "v1.dubbing.create",
        { dubbing_model, watermark },
        { durationSeconds: 60 }
      ).usd
    ).toBeCloseTo(usd, 12);
  });
  it.each(["v1.music.stemSeparation", "v1.productions.orders.submit"])(
    "keeps %s unavailable without a list rate",
    (path) => {
      expect(endpoint(path)).toMatchObject({
        status: "unavailable",
        billing: { kind: "metered" },
        warnings: [expect.stringContaining("no published list rate")],
      });
    }
  );
  it("preserves derived Scribe USD and deduplicates notes across merged actuals", () => {
    const actual = extractActual({
      provider: "elevenlabs",
      dotPath: "v1.speechToText",
      method: "POST",
      url: "https://api.elevenlabs.io/v1/speech-to-text",
      status: 200,
      requestBody: { model_id: "scribe_v2" },
      responseHeaders: { "character-cost": "10" },
      responseBody: { audio_duration_secs: 60 },
    });
    expect(actual.usage.credits).toBe(10);
    expect(actual.statedUsd).toBeNull();
    expect(actual.derivedUsd).toBeCloseTo(0.22 / 60, 12);
    expect(actual.notes?.[0]).toContain("credits");
    expect(mergeActuals([actual, actual]).notes).toEqual(actual.notes);
  });
});

describe("ElevenLabs committed HAR evidence (no network)", () => {
  it.each([
    ["text-to-speech-stream_3477733348", "v1.textToSpeech.stream", 34, 0.00272],
    ["sound-generation_3519036185", "v1.soundGeneration", 10, 0.001],
    ["audio-isolation_2086589916", "v1.audioIsolation", 99, null],
  ] as const)(
    "keeps %s credits separate from its estimate",
    (recording, dotPath, credits, usd) => {
      const har = JSON.parse(
        readFileSync(
          new URL(
            `../recordings/elevenlabs_2379486140/${recording}/recording.har`,
            import.meta.url
          ),
          "utf8"
        )
      ) as { log: { entries: HarEntry[] } };
      const exchange = entryToProviderExchange(har.log.entries[0], {
        provider: "elevenlabs",
        dotPath,
      });
      const actual = extractActual(exchange);
      expect(actual.usage.credits).toBe(credits);
      expect(actual.statedUsd).toBeNull();
      expect(actual.derivedUsd).toBeNull();
      const estimate = endpoint(dotPath, exchange.requestBody ?? {});
      if (usd !== null) expect(estimate.usd).toBeCloseTo(usd, 12);
      else {
        expect(estimate.status).toBe("unavailable");
        expect(estimate.warnings.join(" ")).toContain(
          "costHints.durationSeconds"
        );
      }
    }
  );
});
