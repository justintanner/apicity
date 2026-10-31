import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { computeEstimate } from "@apicity/cost";

// OpenAI GPT Image pricing (ac-b12rs0). gpt-image-2 and the 2.5 models bill
// image output tokens at 30 USD per 1M; gpt-image-1.5's model page lists a
// price per image. Text and image input tokens are not in the request.

const floor = (model: string) =>
  `openai '${model}': prices the image output only; text and image input tokens bill on top, so this estimate is a floor`;

const estimate = (payload: Record<string, unknown>) =>
  computeEstimate({ provider: "openai", payload });

// The image generation guide's GptImageTokenCalculator, rewritten from its
// bundle (developers.openai.com/_astro/GptImageTokenCalculator.react.*.js,
// read 2026-10-31) as an independent oracle.
const PATCHES: Record<string, Record<string, number>> = {
  "gpt-image-2": { low: 16, medium: 48, high: 96 },
  "gpt-image-2.5": { low: 16, medium: 24, high: 48, xhigh: 64, max: 96 },
};
function calculatorTokens(
  family: string,
  quality: string,
  width: number,
  height: number
): number {
  const long = Math.max(width, height);
  const short = Math.min(width, height);
  const patches = PATCHES[family]![quality]!;
  const scaled = patches / (long / short);
  const whole = Math.floor(scaled);
  const rounded =
    scaled - whole === 0.5 ? whole + (whole % 2) : Math.round(scaled);
  const grid =
    (width >= height ? patches : rounded) *
    (width >= height ? rounded : patches);
  return Math.ceil((grid * (2e6 + width * height)) / 4e6);
}

describe("openai GPT Image 2 and 2.5", () => {
  // The guide's per-image table for gpt-image-2, rounded to the cent's tenth.
  it.each([
    ["low", "1024x1024", 0.006],
    ["low", "1024x1536", 0.005],
    ["low", "1536x1024", 0.005],
    ["medium", "1024x1024", 0.053],
    ["medium", "1024x1536", 0.041],
    ["medium", "1536x1024", 0.041],
    ["high", "1024x1024", 0.211],
    ["high", "1024x1536", 0.165],
    ["high", "1536x1024", 0.165],
  ])(
    "reproduces the published gpt-image-2 %s %s price",
    (quality, size, usd) => {
      const result = estimate({
        model: "gpt-image-2",
        prompt: "x",
        quality,
        size,
      });
      expect(Number(result.usd.toFixed(3))).toBe(usd);
      expect(result.breakdown.unit).toBe("tokens");
      expect(result.breakdown.perUnitUsd).toBe(0.00003);
      expect(result.warnings).toEqual([floor("gpt-image-2")]);
    }
  );

  // Each committed gpt-image-2 call left quality unset, was served at
  // `medium`, and billed the calculator's output tokens.
  it("matches the output tokens of every recorded gpt-image-2 call", () => {
    const dir = resolve(__dirname, "../recordings/openai_3991279299");
    const recordings = readdirSync(dir).filter((name) =>
      name.startsWith("gpt-image-2-")
    );
    expect(recordings.length).toBeGreaterThanOrEqual(3);
    for (const name of recordings) {
      const har = JSON.parse(
        readFileSync(join(dir, name, "recording.har"), "utf8")
      ) as {
        log: { entries: { response: { content: { text: string } } }[] };
      };
      const body = JSON.parse(har.log.entries[0]!.response.content.text) as {
        quality: string;
        size: string;
        usage: { output_tokens: number };
      };
      const result = estimate({
        model: "gpt-image-2",
        prompt: "x",
        quality: body.quality,
        size: body.size,
      });
      expect(result.breakdown.units, name).toBe(body.usage.output_tokens);
    }
  });

  it("matches the calculator across sizes and qualities", () => {
    const models = {
      "gpt-image-2": "gpt-image-2",
      "gpt-image-2.5-sunburst": "gpt-image-2.5",
      "gpt-image-2.5-flare": "gpt-image-2.5",
    };
    let checked = 0;
    for (const [model, family] of Object.entries(models)) {
      for (const quality of Object.keys(PATCHES[family]!)) {
        for (let width = 256; width <= 3840; width += 64) {
          for (let height = 256; height <= 3840; height += 64) {
            const pixels = width * height;
            const ratio = Math.max(width, height) / Math.min(width, height);
            if (pixels < 655_360 || pixels > 8_294_400 || ratio > 3) continue;
            const result = estimate({
              model,
              prompt: "x",
              quality,
              size: `${width}x${height}`,
            });
            expect(result.breakdown.units, `${model} ${quality}`).toBe(
              calculatorTokens(family, quality, width, height)
            );
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(10_000);
  });

  it("rounds the short edge half to even", () => {
    // 48 patches over a 1536:528 ratio is 16.5, which rounds to 16, not 17.
    const result = estimate({
      model: "gpt-image-2",
      prompt: "x",
      quality: "medium",
      size: "528x1536",
    });
    expect(result.breakdown.units).toBe(540);
  });

  it("prices the 2.5 calculator's default and scales with n", () => {
    const one = estimate({
      model: "gpt-image-2.5-sunburst",
      prompt: "x",
      quality: "low",
      size: "1024x1024",
    });
    expect(one.breakdown.units).toBe(196);
    expect(one.usd).toBeCloseTo(0.00588, 10);
    const two = estimate({
      model: "gpt-image-2.5-flare",
      prompt: "x",
      quality: "max",
      size: "3840x2160",
      n: 2,
    });
    expect(two.breakdown.units).toBe(2 * 13342);
    expect(two.warnings).toEqual([floor("gpt-image-2.5-flare")]);
  });

  it("prices an edit the same way and still warns about inputs", () => {
    const result = estimate({
      model: "gpt-image-2",
      prompt: "x",
      image: new Blob(["cat"]),
      quality: "high",
      size: "2048x1152",
    });
    expect(result.breakdown.units).toBe(5650);
    expect(result.warnings).toEqual([floor("gpt-image-2")]);
  });

  it.each([
    ["quality and size omitted", {}],
    ["quality auto", { quality: "auto", size: "1024x1024" }],
    ["size auto", { quality: "high", size: "auto" }],
    ["a quality gpt-image-2 lacks", { quality: "xhigh", size: "1024x1024" }],
    ["a prototype key", { quality: "constructor", size: "1024x1024" }],
    ["an edge off the 16 px grid", { quality: "low", size: "1000x1000" }],
    ["too few pixels", { quality: "low", size: "512x512" }],
    ["a ratio over 3:1", { quality: "low", size: "3840x1024" }],
    ["an edge over 3840", { quality: "low", size: "4096x1024" }],
  ])("fails closed for %s", (_label, body) => {
    const result = estimate({ model: "gpt-image-2", prompt: "x", ...body });
    expect(result.usd).toBe(0);
    expect(result.warnings).toEqual([
      "openai 'gpt-image-2': needs an explicit quality (low, medium, high) and a WIDTHxHEIGHT size within the GPT Image size rules; auto depends on the generated image",
    ]);
  });

  it("names the 2.5 qualities when it fails closed", () => {
    expect(
      estimate({ model: "gpt-image-2.5-sunburst", prompt: "x" }).warnings
    ).toEqual([
      "openai 'gpt-image-2.5-sunburst': needs an explicit quality (low, medium, high, xhigh, max) and a WIDTHxHEIGHT size within the GPT Image size rules; auto depends on the generated image",
    ]);
  });
});

describe("openai GPT Image 1.5", () => {
  it.each([
    ["low", "1024x1024", 0.009],
    ["low", "1536x1024", 0.013],
    ["medium", "1024x1536", 0.05],
    ["high", "1024x1024", 0.133],
    ["high", "1536x1024", 0.2],
  ])("prices %s %s per image from the model page", (quality, size, usd) => {
    const result = estimate({
      model: "gpt-image-1.5",
      prompt: "x",
      quality,
      size,
      n: 3,
    });
    expect(result.usd).toBeCloseTo(3 * usd, 10);
    expect(result.breakdown).toEqual({
      units: 3,
      unit: "images",
      perUnitUsd: usd,
    });
    expect(result.warnings).toEqual([floor("gpt-image-1.5")]);
  });

  it.each([
    ["quality and size omitted", {}],
    ["quality auto", { quality: "auto", size: "1024x1024" }],
    ["a size off its grid", { quality: "low", size: "2048x2048" }],
  ])("fails closed for %s", (_label, body) => {
    const result = estimate({ model: "gpt-image-1.5", prompt: "x", ...body });
    expect(result.usd).toBe(0);
    expect(result.warnings).toEqual([
      "openai 'gpt-image-1.5': needs an explicit quality (low, medium, high) and size (1024x1024, 1024x1536, 1536x1024); auto depends on the generated image",
    ]);
  });
});
