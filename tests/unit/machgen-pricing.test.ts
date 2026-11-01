import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  computeEstimate,
  isMachGenQuotePriced,
  resolveMachGenUpscaleEstimate,
  PRICING,
  MODEL_SLUGS,
  MODEL_DISPLAY,
} from "@apicity/cost";
import {
  machgenHints,
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
interface PricebookRow {
  model: string;
  height: number | null;
  has_input_video: boolean | null;
  unit_price_micros: number;
  discounted_unit_price_micros: number | null;
  discount_ends_at: string | null;
}
const pricebook = JSON.parse(
  readFileSync(
    "tests/fixtures/machgen-evidence/machgen-pricebook-2026-10-25.json",
    "utf8"
  )
) as { prices: PricebookRow[] };
// MiniMax-H3-MultiMax, the API's MiniMax-H3-Turbo, re-read once the
// 2026-10-25 snapshot's promotion had ended.
const turboPricebook = JSON.parse(
  readFileSync(
    "tests/fixtures/machgen-evidence/machgen-turbo-pricebook-2026-11-01.json",
    "utf8"
  )
) as { readAt: string; prices: PricebookRow[] };
const turboRow = (
  prices: PricebookRow[],
  height: number | null,
  video: boolean
) =>
  prices.find(
    (r) =>
      r.model === "MiniMax-H3-MultiMax" &&
      r.height === height &&
      r.has_input_video === video
  )!;
// MiniMax-H3-Omni's pricebook rows and grid, read on 2026-11-01.
const omniEvidence = JSON.parse(
  readFileSync(
    "tests/fixtures/machgen-evidence/machgen-omni-2026-11-01.json",
    "utf8"
  )
) as { pricebook: { prices: PricebookRow[] } };
// Models priced from the public pricebook after the 2026-10-25 snapshot.
const pricebookAsOf: Record<string, string> = {
  "Seedance-2.5": "2026-10-29",
  "Seedance-2.0": "2026-10-29",
  "MiniMax-H3-Turbo": "2026-11-01",
  "MiniMax-H3-Omni": "2026-11-01",
};
// Those re-read after their receipts were recorded; MiniMax-H3-Omni was
// first priced and recorded on 2026-11-01.
const repriced = new Set(["Seedance-2.5", "Seedance-2.0", "MiniMax-H3-Turbo"]);

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
  if (task === "UPSCALE" || task === "SHARPEN")
    return {
      model: row.apiModel,
      task_type: task,
      prompt: "",
      src_task_ids: ["source-task"],
      video_config: { height: row.height, duration_secs: seconds },
    };
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
    // Seedance 2.5 and 2.0 were re-read from the public pricebook on
    // 2026-10-29, and MiniMax-H3-Turbo on 2026-11-01, when its first
    // promotion ended. MACHGEN_RECORDED keeps the receipts as billed; the
    // forward estimate uses the new per-second micros.
    const refreshedUsd = (
      model: string,
      variant: (typeof MACHGEN_RECORDED)[number][2]
    ) => {
      const video = variant?.video !== undefined;
      if (model === "Seedance-2.5") {
        const seconds = variant?.operation ? 8 : 4;
        return seconds * (video ? 0.061488 : 0.1028);
      }
      // 4 s out, plus the 4 s read from a reference video.
      if (model === "MiniMax-H3-Turbo") return (video ? 8 : 4) * 0.015;
      return 4 * 0.070308;
    };
    for (const [i, task, variant, usd] of MACHGEN_RECORDED) {
      const result = computeEstimate({
        provider: "machgen",
        payload: machgenPayload(i, task, variant),
        costHints: machgenHints(variant),
      });
      const model = MACHGEN_CASES[i]![1];
      const label = `${MACHGEN_CASES[i]![0]} ${task} ${JSON.stringify(variant ?? {})}`;
      const reread = repriced.has(model);
      const forward = reread ? refreshedUsd(model, variant) : usd;
      expect(result.usd, label).toBeCloseTo(forward, 8);
      expect(result.warnings, label).toEqual([]);
      expect(result.rateAsOf, label).toBe(pricebookAsOf[model] ?? "2026-10-25");
      if (reread) expect(usd, label).not.toBeCloseTo(forward, 6);
    }
  });
  it("checks MiniMax-H3-Turbo's receipts against its dated promotions", () => {
    // MachGen bills MiniMax-H3-MultiMax, the API's MiniMax-H3-Turbo, at
    // discounted_unit_price_micros until discount_ends_at. Every Turbo
    // receipt was recorded on 2026-10-25, inside the first promotion; the
    // forward estimate prices the one read after it ended.
    const turbo = MACHGEN_RECORDED.filter(
      ([i]) => MACHGEN_CASES[i]![1] === "MiniMax-H3-Turbo"
    );
    expect(turbo).toHaveLength(5);
    for (const [i, task, variant, usd] of turbo) {
      const label = `${task} ${JSON.stringify(variant ?? {})}`;
      const height = MACHGEN_CASES[i]![3];
      const video = variant?.video !== undefined;
      const then = turboRow(pricebook.prices, height, video);
      const now = turboRow(turboPricebook.prices, height, video);
      expect(then.discount_ends_at, label).toBe("2026-11-01T06:59:00+00:00");
      expect(Date.parse(turboPricebook.readAt), label).toBeGreaterThan(
        Date.parse(then.discount_ends_at!)
      );
      expect(now.discount_ends_at, label).toBe("2027-01-01T07:59:00+00:00");
      expect(now.unit_price_micros, label).toBe(then.unit_price_micros);
      const forward = computeEstimate({
        provider: "machgen",
        payload: machgenPayload(i, task, variant),
        costHints: machgenHints(variant),
      });
      // The receipt bills the forward estimate's seconds at the first
      // promotion's discount.
      expect(usd, label).toBeCloseTo(
        (forward.usd * then.discounted_unit_price_micros!) /
          now.discounted_unit_price_micros!,
        8
      );
    }
  });
  it("matches every priced pricebook row's own example", () => {
    // The 2026-10-25 fixture's Seedance 2.5 and 2.0 examples are the
    // historical page totals. Those two models were re-priced on
    // 2026-10-29, so their rows stay in the fixture and are not rechecked
    // against today's rates.
    const historicalModels = new Set(["Seedance-2.5", "Seedance-2.0"]);
    let checked = 0;
    let historical = 0;
    for (const row of evidence.rows) {
      if (!row.prices) continue;
      if (historicalModels.has(row.apiModel)) {
        historical += row.prices.length;
        continue;
      }
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
          // An upscale or a sharpen renders its source's length.
          if (shape === "UPSCALE" || shape === "SHARPEN")
            hints = { inputDurationSeconds: seconds };
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
        // MiniMax H3 Turbo's examples bill its first promotion's rate; it
        // now prices at the 2026-11-01 pricebook's discounted rate.
        if (row.apiModel === "MiniMax-H3-Turbo") {
          const now = turboRow(
            turboPricebook.prices,
            row.height,
            row.section === "With input video"
          );
          usd *= now.discounted_unit_price_micros! / 1e6 / row.usdPerSecond;
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
    expect(historical).toBe(35);
    expect(checked + historical).toBe(334);
  });
  it("prices exactly the models the evidence prices", () => {
    const priced = new Set(
      evidence.rows.filter((r) => r.prices).map((r) => r.apiModel)
    );
    // Image pricebook rows are independently verified in machgen-image.test.ts.
    for (const model of [
      "GPT-Image-2",
      "GPT-Image-2.5-Sunburst",
      "GPT-Image-2.5-Flare",
      "Nano-Banana-2",
      "Nano-Banana-2.1",
    ])
      priced.add(model);
    // Priced from the 2026-11-01 pricebook (the next test).
    priced.add("MiniMax-H3-Omni");
    expect(Object.keys(PRICING.machgen).sort()).toEqual([...priced].sort());
    for (const row of evidence.rows.filter((r) => r.unpriced))
      expect(row.unpriced!.length, row.apiModel).toBeGreaterThan(0);
  });
  it("prices MiniMax-H3-Omni at its 2026-11-01 pricebook rows", () => {
    const rows = omniEvidence.pricebook.prices;
    expect(rows).toHaveLength(2);
    const r2v = (extra: Record<string, unknown>, hints?: CostHints) =>
      computeEstimate({
        provider: "machgen",
        payload: {
          model: "MiniMax-H3-Omni",
          task_type: "R2V",
          prompt: "x",
          video_config: { height: 768, duration_secs: 4 },
          ...extra,
        },
        costHints: hints,
      });
    for (const row of rows) {
      expect(row.height).toBe(768);
      expect(row.discounted_unit_price_micros).toBeNull();
      const usdPerSecond = row.unit_price_micros / 1e6;
      // An input-video row bills the 4 s read on top of the 4 s out.
      const result = row.has_input_video
        ? r2v(
            { src_video_urls: ["https://example.com/ref.mp4"] },
            { inputDurationSeconds: 4 }
          )
        : r2v({ src_image_urls: ["https://example.com/cat.jpg"] });
      expect(result.usd).toBeCloseTo(
        (row.has_input_video ? 8 : 4) * usdPerSecond,
        8
      );
      expect(result.warnings).toEqual([]);
      expect(result.rateAsOf).toBe("2026-11-01");
    }
    // R2V at 768p only.
    const sd = r2v({
      src_image_urls: ["a"],
      video_config: { height: 480, duration_secs: 4 },
    });
    expect(sd.usd).toBe(0);
    expect(sd.warnings.length).toBeGreaterThan(0);
    const t2v = computeEstimate({
      provider: "machgen",
      payload: {
        model: "MiniMax-H3-Omni",
        task_type: "T2V",
        prompt: "x",
        video_config: { height: 768, duration_secs: 4 },
      },
    });
    expect(t2v.usd).toBe(0);
    expect(t2v.warnings).toEqual([
      "@apicity/cost prices MachGen MiniMax-H3-Omni for R2V only.",
    ]);
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
      estimate({ model: "Vidu-Q4-Preview", task_type: "T2V" }).warnings
    ).toEqual([
      "@apicity/cost prices MachGen Vidu-Q4-Preview for I2V, R2V only.",
    ]);
    expect(
      estimate({
        video_config: { height: 480, duration_secs: 1, sharpen: true },
      }).warnings
    ).toEqual([
      "MachGen publishes SHARPEN task rates (0.015 USD/s at 480p, 0.066 USD/s at 768p, none at 1440p) but not what video_config.sharpen adds to a generation; price a separate SHARPEN task instead.",
    ]);
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
    expect(estimate(video, { inputDurationSeconds: 3 }).usd).toBeCloseTo(
      0.430416,
      6
    );
    expect(estimate(video, { inputDurationSeconds: -1 }).usd).toBe(0);
    expect(
      estimate({
        model: "Seedance-2.5",
        draft_source_task_id: "draft",
        video_config: { height: 480, duration_secs: 4 },
      }).usd
    ).toBeCloseTo(2.27448, 6);
  });
  it("prices reference videos, edits and upscales by the seconds MachGen bills", () => {
    const video = "https://example.com/ref.mp4";
    const r2v = (
      model: string,
      extra: Record<string, unknown>,
      hints?: CostHints
    ) =>
      computeEstimate({
        provider: "machgen",
        payload: {
          model,
          task_type: "R2V",
          prompt: "x",
          video_config: { height: 480, duration_secs: 4 },
          ...extra,
        },
        costHints: hints,
      });
    // Input plus output seconds: 4 s read + 4 s out.
    expect(
      r2v(
        "Seedance-2.0-Mini",
        { src_video_urls: [video] },
        { inputDurationSeconds: 4 }
      ).usd
    ).toBeCloseTo(0.16);
    // A 4 s clip read from 1 s bills 3 s of input: 7 s in all, a 70000
    // micros receipt at the first promotion's 0.01 USD/s (2026-10-25).
    expect(
      r2v(
        "MiniMax-H3-Turbo",
        { src_video_urls: [video], reference_video_start_secs: [1] },
        { inputDurationSeconds: 3 }
      ).usd
    ).toBeCloseTo(0.105, 6);
    // An edit renders its source's length, whatever duration_secs says.
    const edit = { src_video_urls: [video], reference_video_operation: "edit" };
    expect(
      r2v("Seedance-2.5", edit, { inputDurationSeconds: 4 }).usd
    ).toBeCloseTo(0.491904, 6);
    expect(
      r2v(
        "Seedance-2.5",
        { ...edit, src_video_urls: [video, video] },
        { inputDurationSeconds: 8 }
      ).warnings
    ).toEqual([
      "MachGen renders an edit at its source's length; pass costHints.inputDurationSeconds for one reference video, or costHints.durationSeconds.",
    ]);
    // Audio references do not bill (receipt: 50000 micros for 1 s).
    expect(
      computeEstimate({
        provider: "machgen",
        payload: {
          model: "MiniMax-H3",
          task_type: "R2V",
          prompt: "x",
          src_audio_urls: ["https://example.com/voice.mp3"],
          video_config: { height: 480, duration_secs: 1 },
        },
      }).usd
    ).toBeCloseTo(0.05);
    const upscale = (model: string, height: number, hints?: CostHints) =>
      computeEstimate({
        provider: "machgen",
        payload: {
          model,
          task_type: "UPSCALE",
          prompt: "",
          src_task_ids: ["source"],
          video_config: { height, duration_secs: 5 },
        },
        costHints: hints,
      });
    // The 5 s source in and out (receipt: 500000 micros).
    expect(
      upscale("MiniMax-H3", 1440, { inputDurationSeconds: 5 }).usd
    ).toBeCloseTo(0.5);
    expect(upscale("MiniMax-H3", 1440).warnings).toEqual([
      "MachGen bills an upscale by its source's length; pass costHints.inputDurationSeconds.",
    ]);
    // A sharpen bills the source's seconds once, whatever duration_secs says
    // (quotes: 15000 micros for 1 s at 480p, 330000 for 5 s at 768p).
    const sharpen = (height: number, hints?: CostHints) =>
      computeEstimate({
        provider: "machgen",
        payload: {
          model: "MiniMax-H3",
          task_type: "SHARPEN",
          prompt: "",
          src_task_ids: ["source"],
          video_config: { height, duration_secs: 5 },
        },
        costHints: hints,
      });
    expect(sharpen(480, { inputDurationSeconds: 1 }).usd).toBeCloseTo(0.015);
    expect(sharpen(768, { inputDurationSeconds: 5 }).usd).toBeCloseTo(0.33);
    expect(sharpen(480, { inputDurationSeconds: 1 }).warnings).toEqual([]);
    expect(sharpen(480).warnings).toEqual([
      "MachGen bills a sharpen by its source's length; pass costHints.inputDurationSeconds.",
    ]);
    expect(sharpen(1440, { inputDurationSeconds: 1 }).usd).toBe(0);
    // Topaz bills vendor credits that depend on the source, and MachGen
    // answered HTTP 500 to every Vidu-Upscale-Pro request.
    for (const model of ["Topaz-Video-Precision", "Vidu-Upscale-Pro"]) {
      const result = upscale(model, 1080, { inputDurationSeconds: 5 });
      expect(result.usd, model).toBe(0);
      expect(result.warnings.length, model).toBeGreaterThan(0);
    }
  });
  it("prices the upscales the table cannot with MachGen's quote", async () => {
    const upscale = (model: string, height = 1080) => ({
      model,
      task_type: "UPSCALE",
      prompt: "",
      src_task_ids: ["source"],
      video_config: { height, duration_secs: 4 },
    });
    const topaz = upscale("Topaz-Video-Precision");
    for (const model of [
      "Topaz-Video-Precision",
      "Topaz-Video-Precision-Animation",
      "Topaz-Video-Generative",
      "Topaz-Video-Generative-Fast",
      "Vidu-Upscale-Pro",
    ])
      expect(isMachGenQuotePriced(upscale(model)), model).toBe(true);
    expect(isMachGenQuotePriced(upscale("MiniMax-H3", 1440))).toBe(false);
    expect(isMachGenQuotePriced(machgenPayload(0, "T2V"))).toBe(false);

    const asked: unknown[] = [];
    const quoted = await resolveMachGenUpscaleEstimate(topaz, async (req) => {
      asked.push(req);
      return { cost_micros: 149000 };
    });
    expect(asked).toEqual([topaz]);
    expect(quoted).toEqual({
      usd: 0.149,
      currency: "USD",
      source: "per-unit-table",
      breakdown: {},
      rateAsOf: null,
      warnings: [],
    });

    // Requests the table prices never reach the quote.
    const never = async (): Promise<{ cost_micros: number }> => {
      throw new Error("quote called");
    };
    const h3 = upscale("MiniMax-H3", 1440);
    expect(
      await resolveMachGenUpscaleEstimate(h3, never, {
        hints: { inputDurationSeconds: 5 },
      })
    ).toEqual(
      computeEstimate({
        provider: "machgen",
        payload: h3,
        costHints: { inputDurationSeconds: 5 },
      })
    );
    expect(
      (await resolveMachGenUpscaleEstimate(machgenPayload(0, "T2V"), never)).usd
    ).toBeCloseTo(0.035);

    // A failed or unusable answer degrades to the local estimate.
    const local = computeEstimate({ provider: "machgen", payload: topaz });
    expect(local.usd).toBe(0);
    const failed = await resolveMachGenUpscaleEstimate(topaz, async () => {
      throw new Error(
        "MachGen API error 400: UPSCALE target resolution must exceed the source video"
      );
    });
    expect(failed).toEqual({
      ...local,
      warnings: [
        ...local.warnings,
        "MachGen upscale quote failed for 'Topaz-Video-Precision': MachGen API error 400: UPSCALE target resolution must exceed the source video",
      ],
    });
    for (const answer of [{}, { cost_micros: -1 }, { cost_micros: "149000" }]) {
      const result = await resolveMachGenUpscaleEstimate(
        topaz,
        async () => answer as { cost_micros: number }
      );
      expect(result.usd, JSON.stringify(answer)).toBe(0);
      expect(result.warnings.at(-1)).toBe(
        "MachGen upscale quote for 'Topaz-Video-Precision' returned no usable cost_micros"
      );
    }
  });
  it("pins provenance, shared slugs and displays", () => {
    for (const [model, row] of Object.entries(PRICING.machgen)) {
      expect(row.source, model).toEqual(
        row.kind === "perUnit" && row.unit === "images"
          ? {
              url: "https://api.machgen.ai/api/v0/billing/pricebook/public",
              asOf: "2026-10-30",
            }
          : pricebookAsOf[model]
            ? {
                url: "https://api.machgen.ai/api/v0/billing/pricebook/public",
                asOf: pricebookAsOf[model],
              }
            : {
                url: "https://www.machgen.ai/pricing",
                asOf: "2026-10-25",
              }
      );
    }
    expect(MODEL_SLUGS.machgen).toEqual({
      "GPT-Image-2": "gi2",
      "GPT-Image-2.5-Sunburst": "gi2p5sb",
      "GPT-Image-2.5-Flare": "gi2p5fl",
      "Nano-Banana-2": "nb2",
      "Nano-Banana-2.1": "nb21",
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
      "MiniMax-H3-Omni": "mmh3o",
      "Seedance-2.0-Fast": "sd2f",
      "Seedance-2.0-Mini": "sd2m",
      "Kling-v3": "kling3",
      "Vidu-Q4-Preview": "viduq4",
      "Vidu-Q3-Pro-Fast": "viduq3pf",
      "Pixverse-V6": "pixv6",
      "Pixverse-C1": "pixc1",
      "HappyHorse-1.0": "hh",
      "Kling-o3": "klingo3",
      "Vidu-Q3": "viduq3",
      "Veo-3.1": "veo3p1",
      "Veo-3.1-Fast": "veo3p1f",
      "Grok-Imagine-Video": "grokimgv",
    });
    // A model another provider also sells shares its slug; the rest are new.
    const elsewhere = new Set(
      Object.entries(MODEL_SLUGS)
        .filter(([provider]) => provider !== "machgen")
        .flatMap(([, slugs]) => Object.values(slugs))
    );
    const own = [
      "ltx2p3p",
      "viduq3t",
      "viduq3p",
      "mmh3t",
      "mmh3o",
      "viduq3pf",
      "pixc1",
      "viduq3",
    ];
    for (const slug of Object.values(MODEL_SLUGS.machgen))
      expect(elsewhere.has(slug), slug).toBe(!own.includes(slug));
    expect(Object.keys(MODEL_DISPLAY.machgen)).toEqual(
      Object.keys(MODEL_SLUGS.machgen)
    );
  });
});
