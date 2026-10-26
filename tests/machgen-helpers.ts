import { appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "vitest";
import {
  createMachGen,
  type MachGenGenerateRequest,
  type MachGenUpscaleQuoteRequest,
} from "@apicity/machgen";
import { computeEstimate } from "../packages/provider/cost/src/compute";
import { resolveMachGenUpscaleEstimate } from "../packages/provider/cost/src/machgen-quote";
import type { CostHints } from "../packages/provider/cost/src/types";
import { type PollyContext, teardownPolly, recordingExists } from "./harness";

export const MACHGEN_FIXTURE =
  "https://raw.githubusercontent.com/justintanner/apicity/d885599410f0a904c1d78ab74019e6a5fa97f00e/tests/fixtures/cat2.jpg";
export const MACHGEN_END_FRAME =
  "https://raw.githubusercontent.com/justintanner/apicity/d885599410f0a904c1d78ab74019e6a5fa97f00e/tests/fixtures/cat1.jpg";
/** A 4.0 s 720x576 clip (tests/fixtures/seedance-ref.mp4). */
export const MACHGEN_REF_VIDEO =
  "https://raw.githubusercontent.com/justintanner/apicity/d885599410f0a904c1d78ab74019e6a5fa97f00e/tests/fixtures/seedance-ref.mp4";
const REF_VIDEO_SECS = 4;
/** A completed MiniMax-H3-Turbo I2V task (4 s, 864x480): the upscale source. */
export const MACHGEN_UPSCALE_SOURCE = "4cef7130-22ce-4fcb-a237-a776791e22f1";
export const MACHGEN_CASES = [
  ["minimax-h3", "MiniMax-H3", 1, 480, true],
  ["seedance-2-5", "Seedance-2.5", 4, 480, true],
  ["seedance-2-0", "Seedance-2.0", 4, 480, true],
  ["wan-3-0", "Alibaba-Wan-3.0", 2, 480, true],
  ["happyhorse-1-1", "HappyHorse-1.1", 3, 720, false],
  ["grok-imagine-video-1-5", "Grok-Imagine-Video-1.5", 1, 480, false],
  // MachGen's cheapest tier: 0.01 USD/s while the promotion lasts, 4 s minimum.
  ["minimax-h3-turbo", "MiniMax-H3-Turbo", 4, 480, true],
  // Price checks, one per newly priced model: the shortest clip (2 s where the
  // model allows it) at the lowest height (operator order, 2026-10-25).
  ["wan-2-2-a14b", "Wan2.2-A14B", 5, 480, false],
  ["ltx-2-3-pro", "LTX-2.3-Pro", 6, 1080, true],
  ["vidu-q3-turbo", "Vidu-Q3-Turbo", 2, 540, true],
  ["vidu-q3-pro", "Vidu-Q3-Pro", 2, 540, true],
  ["seedance-2-0-fast", "Seedance-2.0-Fast", 4, 480, true],
  ["seedance-2-0-mini", "Seedance-2.0-Mini", 4, 480, true],
  ["kling-v3", "Kling-v3", 3, 720, true],
  ["vidu-q4-preview", "Vidu-Q4-Preview", 3, 540, true],
  ["vidu-q3-pro-fast", "Vidu-Q3-Pro-Fast", 2, 720, true],
  ["pixverse-v6", "Pixverse-V6", 2, 360, true],
  ["pixverse-c1", "Pixverse-C1", 2, 360, true],
  ["happyhorse-1-0", "HappyHorse-1.0", 3, 720, false],
  ["vidu-q3", "Vidu-Q3", 3, 540, true],
  ["kling-o3", "Kling-o3", 3, 720, true],
  // T2V-only models. Veo 3.1's audio is always on, so it takes no audio flag.
  ["veo-3-1", "Veo-3.1", 4, 720, false],
  ["veo-3-1-fast", "Veo-3.1-Fast", 4, 720, false],
  ["grok-imagine-video", "Grok-Imagine-Video", 1, 480, false],
] as const;
// The task metadata names the model an alias resolves to.
const resolvedModel = (model: string, task: string) =>
  model === "MiniMax-H3-Turbo"
    ? "MiniMax-H3-MultiMax"
    : model === "Wan2.2-A14B"
      ? `Wan2.2-${task}-A14B`
      : model;
/** I2V frame layouts: start frame only, start and end, or a lone end frame. */
export type MachgenFrames = "end-frame" | "lone-end-frame";
/**
 * A recorded request beside a case's default: I2V frames, audio on, a longer
 * clip, or an R2V reference video (read from an offset, or edited or extended).
 */
export interface MachgenVariant {
  frames?: MachgenFrames;
  audio?: true;
  durationSecs?: number;
  video?: { startSecs?: number };
  operation?: "edit" | "extend";
}
const variantSuffix = (v?: MachgenVariant) =>
  [
    v?.frames,
    v?.audio ? "audio" : undefined,
    v?.video ? "video" : undefined,
    v?.video?.startSecs && `from${v.video.startSecs}s`,
    v?.operation,
    v?.durationSecs && `${v.durationSecs}s`,
  ]
    .filter(Boolean)
    .map((part) => `-${part}`)
    .join("");
/** Every recorded request with the gross USD its billing receipt reported. */
export const MACHGEN_RECORDED: ReadonlyArray<
  readonly [number, "T2V" | "I2V" | "R2V", MachgenVariant | undefined, number]
> = [
  [0, "T2V", undefined, 0.035],
  [0, "I2V", undefined, 0.035],
  [0, "R2V", undefined, 0.05],
  // H3 bills I2V with an end frame at its Image to Video rate, not the
  // pricebook's Frame to Frame rate (which would be 0.1).
  [0, "I2V", { frames: "end-frame", durationSecs: 2 }, 0.07],
  [0, "I2V", { frames: "lone-end-frame", durationSecs: 2 }, 0.07],
  // The 3 s read after the 1 s start offset plus 2 s out, at 0.05 USD/s.
  [0, "R2V", { video: { startSecs: 1 }, durationSecs: 2 }, 0.25],
  [1, "T2V", undefined, 0.4],
  [1, "I2V", undefined, 0.4],
  [1, "R2V", undefined, 0.4],
  // An edit renders its 4 s source: 4 s read plus 4 s out at 0.06 USD/s.
  [1, "R2V", { video: {}, operation: "edit" }, 0.48],
  // An extend bills the 4 s read plus the 4 s it adds.
  [1, "R2V", { video: {}, operation: "extend" }, 0.48],
  [2, "T2V", undefined, 0.28],
  [2, "I2V", undefined, 0.28],
  [2, "R2V", undefined, 0.28],
  [3, "T2V", undefined, 0.098],
  [3, "I2V", undefined, 0.098],
  [3, "R2V", undefined, 0.098],
  // Its one rate covers the 4 s read from the reference video and the 2 s out.
  [3, "R2V", { video: {} }, 0.294],
  [4, "T2V", undefined, 0.396],
  [4, "I2V", undefined, 0.396],
  [4, "R2V", undefined, 0.396],
  [5, "I2V", undefined, 0.095],
  [6, "I2V", undefined, 0.04],
  [6, "I2V", { frames: "end-frame" }, 0.04],
  [6, "I2V", { frames: "lone-end-frame" }, 0.04],
  [6, "R2V", undefined, 0.04],
  // 4 s read from the reference video plus 4 s out.
  [6, "R2V", { video: {} }, 0.08],
  [7, "T2V", undefined, 0.09],
  [7, "I2V", undefined, 0.09],
  [8, "I2V", undefined, 0.18],
  [9, "I2V", undefined, 0.03],
  // 5 s at 0.015 USD/s plus 1 s at the 6-10 s band's 0.018 USD/s.
  [9, "I2V", { durationSecs: 6 }, 0.093],
  [9, "R2V", undefined, 0.03],
  [10, "I2V", undefined, 0.106],
  [10, "R2V", undefined, 0.106],
  [11, "I2V", undefined, 0.2],
  [11, "R2V", undefined, 0.2],
  [11, "R2V", { video: {} }, 0.24],
  [12, "I2V", undefined, 0.132],
  [12, "R2V", undefined, 0.132],
  [12, "R2V", { video: {} }, 0.16],
  [13, "I2V", undefined, 0.24],
  [13, "I2V", { audio: true }, 0.357],
  [14, "I2V", undefined, 0.135],
  [14, "R2V", undefined, 0.135],
  [15, "I2V", undefined, 0.236],
  [16, "I2V", undefined, 0.048],
  [16, "I2V", { audio: true }, 0.066],
  [16, "R2V", undefined, 0.048],
  [17, "I2V", undefined, 0.058],
  [17, "I2V", { audio: true }, 0.076],
  [17, "R2V", undefined, 0.058],
  [18, "I2V", undefined, 0.396],
  [18, "R2V", undefined, 0.396],
  [19, "R2V", undefined, 0.126],
  [20, "R2V", undefined, 0.24],
  [20, "R2V", { audio: true }, 0.318],
  [21, "T2V", undefined, 1.884],
  [22, "T2V", undefined, 0.472],
  [23, "T2V", undefined, 0.059],
];
export function machgenPayload(
  index: number,
  task_type: "T2V" | "I2V" | "R2V",
  variant?: MachgenVariant
): MachGenGenerateRequest {
  const [, model, caseSecs, height, audio] = MACHGEN_CASES[index]!;
  const duration_secs = variant?.durationSecs ?? caseSecs;
  const frames = variant?.frames;
  const prompts = {
    T2V: "A red paper boat drifts across a calm pond at sunrise.",
    I2V: "The cat slowly blinks and turns its head toward the window.",
    R2V: "The cat from the reference image walks across a sunlit wooden floor.",
  };
  const videoPrompts = {
    reference: "Recreate the motion of the reference video in a sunlit park.",
    edit: "Make the reference video look like a watercolor painting.",
    extend: "Continue the reference video as the camera slowly pulls back.",
  };
  const video = variant?.video;
  return {
    model,
    task_type,
    prompt: video
      ? videoPrompts[variant?.operation ?? "reference"]
      : prompts[task_type],
    video_config: {
      duration_secs,
      height,
      // MachGen's documented Wan 3.0 example config (ac-ed194s).
      ...(model === "Alibaba-Wan-3.0"
        ? { aspect_ratio: "adaptive" as const, fps: 30, audio: true }
        : variant?.audio
          ? { audio: true }
          : audio
            ? { audio: false }
            : {}),
      ...(model === "Seedance-2.5" && task_type === "I2V"
        ? { aspect_ratio: "adaptive" as const }
        : {}),
    },
    ...(video
      ? {
          src_video_urls: [MACHGEN_REF_VIDEO],
          ...(video.startSecs !== undefined
            ? { reference_video_start_secs: [video.startSecs] }
            : {}),
          ...(variant?.operation
            ? { reference_video_operation: variant.operation }
            : {}),
        }
      : frames === "end-frame"
        ? { src_image_urls: [MACHGEN_FIXTURE, MACHGEN_END_FRAME] }
        : frames === "lone-end-frame"
          ? { src_image_urls: [MACHGEN_END_FRAME], keyframe_indices: [-1] }
          : task_type !== "T2V"
            ? { src_image_urls: [MACHGEN_FIXTURE] }
            : {}),
  };
}

/** The seconds of the reference video MachGen reads, as a cost hint. */
export function machgenHints(variant?: MachgenVariant): CostHints | undefined {
  const video = variant?.video;
  return video
    ? { inputDurationSeconds: REF_VIDEO_SECS - (video.startSecs ?? 0) }
    : undefined;
}

const liveFor = (name: string) =>
  process.env.POLLY_MODE === "record" ||
  (process.env.POLLY_MODE === "record-missing" && !recordingExists(name));

// Submits a task, polls it to a terminal state and reads its receipt.
async function runTask(
  provider: ReturnType<typeof createMachGen>,
  payload: MachGenGenerateRequest,
  name: string,
  estimateUsd: number | null
) {
  const live = liveFor(name);
  const task = await provider.api.v0.generate(payload);
  expect(task.task_id).toBeTruthy();
  if (live) {
    console.log(
      `Accepted ${name}: ${task.task_id}; estimate USD ${estimateUsd}`
    );
    // Optional recovery journal for paid recording sessions. Never written in replay.
    const ledger =
      process.env.MACHGEN_RECORDING_LEDGER ??
      join(tmpdir(), "apicity-machgen-submissions.jsonl");
    appendFileSync(
      ledger,
      JSON.stringify({
        utc: new Date().toISOString(),
        recording: name,
        task_id: task.task_id,
        model: payload.model,
        task_type: payload.task_type,
        estimate_usd: estimateUsd,
      }) + "\n"
    );
  }
  let status = await provider.api.v0.tasks(task.task_id);
  for (
    let attempt = 0;
    attempt < 180 && !["COMPLETED", "FAILED"].includes(status.status);
    attempt++
  ) {
    if (live) await new Promise((resolve) => setTimeout(resolve, 10000));
    status = await provider.api.v0.tasks(task.task_id);
  }
  // The receipt is final once the task is COMPLETED or FAILED.
  const billing = await provider.api.v0.tasks.billing(task.task_id);
  expect(billing.task_id).toBe(task.task_id);
  expect(billing.net_cost_micros).toBe(
    billing.generation_cost_micros - billing.generation_credit_micros
  );
  expect(status.status, status.error_msg ?? "task did not complete").toBe(
    "COMPLETED"
  );
  expect(status.task_output?.video).toMatch(/^https:\/\//);
  expect(status.task_output?.video).toContain(task.task_id);
  expect(status.metadata.model).toBe(
    resolvedModel(payload.model, payload.task_type)
  );
  if (live)
    console.log(
      JSON.stringify({ recording: name, estimate_usd: estimateUsd, ...billing })
    );
  return { task, status, billing };
}

export async function recordMachgen(
  index: number,
  taskType: "T2V" | "I2V" | "R2V",
  setup: () => PollyContext,
  variant?: MachgenVariant
) {
  const name = `machgen/${MACHGEN_CASES[index]![0]}-${taskType.toLowerCase()}${variantSuffix(variant)}`;
  const ctx = setup();
  const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
  const provider = createMachGen({ apiKey, timeout: 120000 });
  try {
    const payload = machgenPayload(index, taskType, variant);
    expect(provider.api.v0.generate.schema.safeParse(payload).success).toBe(
      true
    );
    const estimate = computeEstimate({
      provider: "machgen",
      payload,
      costHints: machgenHints(variant),
    });
    expect(estimate.warnings).toEqual([]);
    expect(estimate.usd).toBeGreaterThan(0);
    expect(estimate.usd).toBeLessThanOrEqual(2);
    const { task, billing } = await runTask(
      provider,
      payload,
      name,
      estimate.usd
    );
    expect(billing.generation_cost_micros / 1e6).toBeCloseTo(estimate.usd, 6);
    if (index === 0 && taskType === "T2V") {
      const bytes = new Uint8Array(await provider.api.v0.assets(task.task_id));
      expect(bytes.byteLength).toBeGreaterThan(8);
      expect(new TextDecoder().decode(bytes.slice(4, 8))).toBe("ftyp");
    }
  } finally {
    await teardownPolly(ctx);
  }
}

/**
 * Records an UPSCALE of `sourceTaskId`, or of a source generated in the same
 * recording first. Topaz bills vendor credits that depend on the source, so
 * its estimate comes from MachGen's upscale quote.
 */
export async function recordMachgenUpscale(
  name: string,
  setup: () => PollyContext,
  opts: {
    model: string;
    height: number;
    sourceSecs: number;
    sourceTaskId?: string;
    source?: MachGenGenerateRequest;
    engine?: string;
  }
) {
  const ctx = setup();
  const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
  const provider = createMachGen({ apiKey, timeout: 120000 });
  try {
    let sourceTaskId = opts.sourceTaskId;
    if (opts.source) {
      const estimate = computeEstimate({
        provider: "machgen",
        payload: opts.source,
      });
      const { task, billing } = await runTask(
        provider,
        opts.source,
        `${name} (source)`,
        estimate.usd
      );
      expect(billing.generation_cost_micros / 1e6).toBeCloseTo(estimate.usd, 6);
      sourceTaskId = task.task_id;
    }
    const payload: MachGenUpscaleQuoteRequest = {
      prompt: "",
      model: opts.model,
      task_type: "UPSCALE",
      src_task_ids: [sourceTaskId!],
      ...(opts.engine ? { upscale_config: { engine: opts.engine } } : {}),
      video_config: { height: opts.height, duration_secs: opts.sourceSecs },
    };
    expect(provider.api.v0.generate.schema.safeParse(payload).success).toBe(
      true
    );
    // Topaz asks MachGen's quote, which creates no task; MiniMax-H3 is priced
    // locally from the source's length.
    const estimate = await resolveMachGenUpscaleEstimate(
      payload,
      provider.api.v0.upscale.quote,
      { hints: { inputDurationSeconds: opts.sourceSecs } }
    );
    expect(estimate.warnings).toEqual([]);
    expect(estimate.usd).toBeGreaterThan(0);
    const { billing } = await runTask(provider, payload, name, estimate.usd);
    expect(billing.generation_cost_micros / 1e6).toBeCloseTo(estimate.usd, 6);
  } finally {
    await teardownPolly(ctx);
  }
}
