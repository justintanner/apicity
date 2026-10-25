import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  computeEstimate,
  PRICING,
  MODEL_SLUGS,
  MODEL_DISPLAY,
} from "@apicity/cost";
import {
  machgenPayload,
  MACHGEN_CASES,
  MACHGEN_RECORDED,
} from "../machgen-helpers";
import type { CostHints } from "@apicity/cost";

interface EvidenceRow {
  apiModel: string;
  section: string | null;
  height: number | null;
  seconds: [number, number] | null;
  usdPerSecond: number;
  example?: string;
  audio?: boolean;
  prices?: string[];
  unpriced?: string;
}
const evidence = JSON.parse(
  readFileSync(
    "tests/fixtures/machgen-evidence/machgen-pricing-2026-10-25.json",
    "utf8"
  )
) as { rows: EvidenceRow[] };

const estimate = (
  overrides: Record<string, unknown> = {},
  costHints?: CostHints
) =>
  computeEstimate({
    provider: "machgen",
    payload: { ...machgenPayload(0, "T2V"), ...overrides },
    costHints,
  });

// A request of the shape a pricebook row prices, e.g. "I2V+end-frame+adapter".
function shapePayload(
  row: EvidenceRow,
  shape: string,
  seconds: number
): Record<string, unknown> {
  const [task, ...parts] = shape.split("+");
  const image = "https://example.com/start.jpg";
  return {
    model: row.apiModel,
    task_type: task,
    prompt: "A cat walks across a sunlit wooden floor.",
    video_config: {
      height: row.height,
      duration_secs: seconds,
      ...(row.audio !== undefined ? { audio: row.audio } : {}),
    },
    ...(task === "T2V"
      ? {}
      : parts.includes("end-frame")
        ? { src_image_urls: [image, "https://example.com/end.jpg"] }
        : parts.includes("lone-end-frame")
          ? { src_image_urls: [image], keyframe_indices: [-1] }
          : { src_image_urls: [image] }),
    ...(parts.includes("input-video")
      ? { src_video_urls: ["https://example.com/ref.mp4"] }
      : {}),
    ...(parts.includes("adapter") ? { adapter: "example-adapter" } : {}),
  };
}

describe("MachGen pricing", () => {
  it("prices every recorded request at its billing receipt", () => {
    for (const [i, task, variant, usd] of MACHGEN_RECORDED) {
      const result = computeEstimate({
        provider: "machgen",
        payload: machgenPayload(i, task, variant),
      });
      const label = `${MACHGEN_CASES[i]![0]} ${task} ${JSON.stringify(variant ?? {})}`;
      expect(result.usd, label).toBeCloseTo(usd, 8);
      expect(result.warnings, label).toEqual([]);
      expect(result.rateAsOf).toBe("2026-10-25");
    }
  });
  it("matches every priced pricebook row's own example", () => {
    let checked = 0;
    for (const row of evidence.rows) {
      if (!row.prices) continue;
      const clip = row.example?.match(/^\(\$([0-9.]+) \/ (\d+)s clip\)$/);
      const input = row.example?.match(
        /^\(\$([0-9.]+) \/ (\d+)s \+ (\d+)s input\)$/
      );
      for (const shape of row.prices) {
        let usd: number;
        let seconds: number;
        let hints: CostHints | undefined;
        if (clip) {
          usd = Number(clip[1]);
          seconds = Number(clip[2]);
        } else if (input) {
          usd = Number(input[1]);
          seconds = Number(input[2]);
          hints = { inputDurationSeconds: Number(input[3]) };
        } else {
          // MiniMax H3's input-video rows show no example: one flat rate.
          seconds = 5;
          hints = { inputDurationSeconds: 5 };
          usd = 10 * row.usdPerSecond;
        }
        const result = computeEstimate({
          provider: "machgen",
          payload: shapePayload(row, shape, seconds),
          costHints: hints,
        });
        // The page truncates totals to three decimals ($0.787 for 0.7875).
        expect(
          Math.abs(result.usd - usd),
          `${row.apiModel} ${row.section ?? ""} ${row.height}p ${shape}: ${result.usd} vs ${usd} (${result.warnings.join(" ")})`
        ).toBeLessThan(0.0011);
        expect(result.warnings).toEqual([]);
        checked++;
      }
    }
    expect(checked).toBe(255);
  });
  it("prices exactly the models the evidence prices", () => {
    const priced = new Set(
      evidence.rows.filter((r) => r.prices).map((r) => r.apiModel)
    );
    expect(Object.keys(PRICING.machgen).sort()).toEqual([...priced].sort());
    for (const row of evidence.rows.filter((r) => r.unpriced))
      expect(row.unpriced!.length, row.apiModel).toBeGreaterThan(0);
  });
  it("applies H3 graduated pricing, frame snapping and its I2V frame rates", () => {
    expect(
      estimate({ video_config: { height: 768, duration_secs: 30 } }).usd
    ).toBeCloseTo(0.9);
    expect(
      estimate({ video_config: { height: 480, duration_secs: 30 } }).usd
    ).toBeCloseTo(0.7875);
    expect(
      estimate({ video_config: { height: 480, num_frames: 22 } }).usd
    ).toBeCloseTo(0.035);
    expect(
      estimate({ task_type: "I2V", src_image_urls: ["a", "b"] }).usd
    ).toBeCloseTo(0.035);
    expect(
      estimate({ task_type: "R2V", src_image_urls: ["a"] }).usd
    ).toBeCloseTo(0.05);
    expect(
      estimate({
        task_type: "I2V",
        src_image_urls: ["a"],
        keyframe_indices: [-1],
      }).usd
    ).toBeCloseTo(0.035);
    expect(
      estimate({
        adapter: "example-adapter",
        video_config: { height: 768, duration_secs: 30 },
      }).usd
    ).toBeCloseTo(1.125);
    expect(
      estimate(
        { task_type: "R2V", src_video_urls: ["v"] },
        { inputDurationSeconds: 20 }
      ).usd
    ).toBeCloseTo(1.05);
  });
  it("bills Vidu Q3 Turbo's duration bands one band at a time", () => {
    const vidu = (height: number, duration_secs: number) =>
      estimate({
        model: "Vidu-Q3-Turbo",
        video_config: { height, duration_secs },
      }).usd;
    expect(vidu(540, 3)).toBeCloseTo(0.045);
    expect(vidu(540, 10)).toBeCloseTo(0.165);
    expect(vidu(540, 16)).toBeCloseTo(0.285);
    expect(vidu(720, 7)).toBeCloseTo(0.23);
    expect(vidu(720, 16)).toBeCloseTo(0.62);
  });
  it("prices audio on and off where MachGen prices them apart", () => {
    const kling = (audio: boolean) =>
      estimate({
        model: "Kling-v3",
        task_type: "I2V",
        src_image_urls: ["a"],
        video_config: { height: 1080, duration_secs: 5, audio },
      }).usd;
    expect(kling(true)).toBeCloseTo(0.795);
    expect(kling(false)).toBeCloseTo(0.53);
    const unset = estimate({
      model: "Pixverse-V6",
      video_config: { height: 360, duration_secs: 5 },
    });
    expect(unset.usd).toBe(0);
    expect(unset.warnings).toEqual([
      "MachGen prices Pixverse-V6 with audio on and off at different rates; set video_config.audio.",
    ]);
  });
  it("fails closed for unpriced and unknowable charges", () => {
    for (const overrides of [
      { video_config: { height: 1080, duration_secs: 1 } },
      { video_config: { height: 1440, duration_secs: 16 } },
      { video_config: { height: 480, duration_secs: 31 } },
      { video_config: { height: 480, duration_secs: 1, sharpen: true } },
      { src_task_ids: ["opaque"] },
      { model: "Unknown-Model" },
      { model: "Grok-Imagine-Video-1.5", task_type: "T2V" },
      { model: "Kling-o3", video_config: { height: 720, duration_secs: 5 } },
      { model: "LTX-2.3-Pro", video_config: { height: 540, duration_secs: 6 } },
      {
        model: "MiniMax-H3-Turbo",
        video_config: { height: 1080, duration_secs: 4 },
      },
      {
        model: "Vidu-Q3-Turbo",
        video_config: { height: 540, duration_secs: 17 },
      },
      {
        model: "Seedance-2.0-Fast",
        task_type: "R2V",
        src_video_urls: ["v"],
      },
    ]) {
      expect(estimate(overrides).usd).toBe(0);
      expect(estimate(overrides).warnings.length).toBeGreaterThan(0);
    }
    expect(
      estimate({ model: "Vidu-Q4-Preview", task_type: "R2V" }).warnings
    ).toEqual(["@apicity/cost prices MachGen Vidu-Q4-Preview for I2V only."]);
  });
  it("requires duration hints for Smart length and input-video charges", () => {
    const smart = { video_config: { height: 480, duration_secs: -1 } };
    expect(estimate(smart).warnings.join()).toContain(
      "costHints.durationSeconds"
    );
    expect(estimate(smart, { durationSeconds: 10 }).usd).toBeCloseTo(0.35);
    const video = {
      model: "Seedance-2.5",
      task_type: "R2V",
      src_video_urls: ["v"],
      video_config: { height: 480, duration_secs: 4 },
    };
    expect(estimate(video).warnings.join()).toContain(
      "input plus output seconds"
    );
    expect(estimate(video, { inputDurationSeconds: 3 }).usd).toBeCloseTo(0.42);
    expect(estimate(video, { inputDurationSeconds: -1 }).usd).toBe(0);
    expect(
      estimate({
        model: "Seedance-2.5",
        draft_source_task_id: "draft",
        video_config: { height: 480, duration_secs: 4 },
      }).usd
    ).toBeCloseTo(2.36);
  });
  it("pins provenance, shared slugs and displays", () => {
    for (const row of Object.values(PRICING.machgen))
      expect(row.source).toEqual({
        url: "https://www.machgen.ai/pricing",
        asOf: "2026-10-25",
      });
    expect(MODEL_SLUGS.machgen).toEqual({
      "MiniMax-H3": "mmh3",
      "Seedance-2.5": "sd2p5",
      "Seedance-2.0": "sd2",
      "Alibaba-Wan-3.0": "wan3p0",
      "HappyHorse-1.1": "hh1p1",
      "Grok-Imagine-Video-1.5": "grokimgv1p5",
      "Wan2.2-A14B": "wan2p2",
      "LTX-2.3-Pro": "ltx2p3p",
      "Vidu-Q3-Turbo": "viduq3t",
      "Vidu-Q3-Pro": "viduq3p",
      "MiniMax-H3-Turbo": "mmh3t",
      "Seedance-2.0-Fast": "sd2f",
      "Seedance-2.0-Mini": "sd2m",
      "Kling-v3": "kling3",
      "Vidu-Q4-Preview": "viduq4",
      "Vidu-Q3-Pro-Fast": "viduq3pf",
      "Pixverse-V6": "pixv6",
      "Pixverse-C1": "pixc1",
      "HappyHorse-1.0": "hh",
    });
    // A model kie or xai also sells shares their slug; the rest are new.
    const elsewhere = new Set(
      Object.entries(MODEL_SLUGS)
        .filter(([provider]) => provider !== "machgen")
        .flatMap(([, slugs]) => Object.values(slugs))
    );
    const own = ["ltx2p3p", "viduq3t", "viduq3p", "mmh3t", "viduq3pf", "pixc1"];
    for (const slug of Object.values(MODEL_SLUGS.machgen)) {
      if (own.includes(slug)) expect(elsewhere.has(slug), slug).toBe(false);
      else
        expect([
          ...Object.values(MODEL_SLUGS.kie),
          ...Object.values(MODEL_SLUGS.xai),
        ]).toContain(slug);
    }
    expect(Object.keys(MODEL_DISPLAY.machgen)).toEqual(
      Object.keys(MODEL_SLUGS.machgen)
    );
  });
});
