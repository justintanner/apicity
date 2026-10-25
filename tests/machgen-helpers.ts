import { appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "vitest";
import { createMachGen, type MachGenGenerateRequest } from "@apicity/machgen";
import { computeEstimate } from "../packages/provider/cost/src/compute";
import { type PollyContext, teardownPolly, recordingExists } from "./harness";

export const MACHGEN_FIXTURE =
  "https://raw.githubusercontent.com/justintanner/apicity/d885599410f0a904c1d78ab74019e6a5fa97f00e/tests/fixtures/cat2.jpg";
export const MACHGEN_END_FRAME =
  "https://raw.githubusercontent.com/justintanner/apicity/d885599410f0a904c1d78ab74019e6a5fa97f00e/tests/fixtures/cat1.jpg";
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
/** A recorded request beside a case's default: I2V frames, audio on, or a longer clip. */
export interface MachgenVariant {
  frames?: MachgenFrames;
  audio?: true;
  durationSecs?: number;
}
const variantSuffix = (v?: MachgenVariant) =>
  [
    v?.frames,
    v?.audio ? "audio" : undefined,
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
  [1, "T2V", undefined, 0.4],
  [1, "I2V", undefined, 0.4],
  [1, "R2V", undefined, 0.4],
  [2, "T2V", undefined, 0.28],
  [2, "I2V", undefined, 0.28],
  [2, "R2V", undefined, 0.28],
  [3, "T2V", undefined, 0.098],
  [3, "I2V", undefined, 0.098],
  [3, "R2V", undefined, 0.098],
  [4, "T2V", undefined, 0.396],
  [4, "I2V", undefined, 0.396],
  [4, "R2V", undefined, 0.396],
  [5, "I2V", undefined, 0.095],
  [6, "I2V", undefined, 0.04],
  [6, "I2V", { frames: "end-frame" }, 0.04],
  [6, "I2V", { frames: "lone-end-frame" }, 0.04],
  [7, "T2V", undefined, 0.09],
  [7, "I2V", undefined, 0.09],
  [8, "I2V", undefined, 0.18],
  [9, "I2V", undefined, 0.03],
  // 5 s at 0.015 USD/s plus 1 s at the 6-10 s band's 0.018 USD/s.
  [9, "I2V", { durationSecs: 6 }, 0.093],
  [10, "I2V", undefined, 0.106],
  [11, "I2V", undefined, 0.2],
  [12, "I2V", undefined, 0.132],
  [13, "I2V", undefined, 0.24],
  [13, "I2V", { audio: true }, 0.357],
  [14, "I2V", undefined, 0.135],
  [15, "I2V", undefined, 0.236],
  [16, "I2V", undefined, 0.048],
  [16, "I2V", { audio: true }, 0.066],
  [17, "I2V", undefined, 0.058],
  [17, "I2V", { audio: true }, 0.076],
  [18, "I2V", undefined, 0.396],
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
  return {
    model,
    task_type,
    prompt: prompts[task_type],
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
    ...(frames === "end-frame"
      ? { src_image_urls: [MACHGEN_FIXTURE, MACHGEN_END_FRAME] }
      : frames === "lone-end-frame"
        ? { src_image_urls: [MACHGEN_END_FRAME], keyframe_indices: [-1] }
        : task_type !== "T2V"
          ? { src_image_urls: [MACHGEN_FIXTURE] }
          : {}),
  };
}

export async function recordMachgen(
  index: number,
  taskType: "T2V" | "I2V" | "R2V",
  setup: () => PollyContext,
  variant?: MachgenVariant
) {
  const name = `machgen/${MACHGEN_CASES[index]![0]}-${taskType.toLowerCase()}${variantSuffix(variant)}`;
  const live =
    process.env.POLLY_MODE === "record" ||
    (process.env.POLLY_MODE === "record-missing" && !recordingExists(name));
  const ctx = setup();
  const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
  const provider = createMachGen({ apiKey, timeout: 120000 });
  try {
    const payload = machgenPayload(index, taskType, variant);
    expect(provider.api.v0.generate.schema.safeParse(payload).success).toBe(
      true
    );
    const estimate = computeEstimate({ provider: "machgen", payload });
    expect(estimate.warnings).toEqual([]);
    expect(estimate.usd).toBeGreaterThan(0);
    expect(estimate.usd).toBeLessThanOrEqual(2);
    const task = await provider.api.v0.generate(payload);
    expect(task.task_id).toBeTruthy();
    if (live) {
      console.log(
        `Accepted ${name}: ${task.task_id}; estimate USD ${estimate.usd}`
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
          task_type: taskType,
          estimate_usd: estimate.usd,
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
    expect(status.metadata.model).toBe(resolvedModel(payload.model, taskType));
    expect(billing.generation_cost_micros / 1e6).toBeCloseTo(estimate.usd, 6);
    if (live)
      console.log(
        JSON.stringify({
          recording: name,
          estimate_usd: estimate.usd,
          ...billing,
        })
      );
    if (index === 0 && taskType === "T2V") {
      const bytes = new Uint8Array(await provider.api.v0.assets(task.task_id));
      expect(bytes.byteLength).toBeGreaterThan(8);
      expect(new TextDecoder().decode(bytes.slice(4, 8))).toBe("ftyp");
    }
  } finally {
    await teardownPolly(ctx);
  }
}
