import { appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect } from "vitest";
import { createMachGen, type MachGenGenerateRequest } from "@apicity/machgen";
import { computeEstimate } from "../packages/provider/cost/src/compute";
import { type PollyContext, teardownPolly, recordingExists } from "./harness";

export const MACHGEN_FIXTURE =
  "https://raw.githubusercontent.com/justintanner/apicity/d885599410f0a904c1d78ab74019e6a5fa97f00e/tests/fixtures/cat2.jpg";
export const MACHGEN_CASES = [
  ["minimax-h3", "MiniMax-H3", 1, 480, true],
  ["seedance-2-5", "Seedance-2.5", 4, 480, true],
  ["seedance-2-0", "Seedance-2.0", 4, 480, true],
  ["wan-3-0", "Alibaba-Wan-3.0", 2, 480, true],
  ["happyhorse-1-1", "HappyHorse-1.1", 3, 720, false],
  ["grok-imagine-video-1-5", "Grok-Imagine-Video-1.5", 1, 480, false],
] as const;
export function machgenPayload(
  index: number,
  task_type: "T2V" | "I2V" | "R2V"
): MachGenGenerateRequest {
  const [, model, duration_secs, height, audio] = MACHGEN_CASES[index]!;
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
        : audio
          ? { audio: false }
          : {}),
      ...(model === "Seedance-2.5" && task_type === "I2V"
        ? { aspect_ratio: "adaptive" as const }
        : {}),
    },
    ...(task_type !== "T2V" ? { src_image_urls: [MACHGEN_FIXTURE] } : {}),
  };
}

export async function recordMachgen(
  index: number,
  taskType: "T2V" | "I2V" | "R2V",
  setup: () => PollyContext
) {
  const name = `machgen/${MACHGEN_CASES[index]![0]}-${taskType.toLowerCase()}`;
  const live =
    process.env.POLLY_MODE === "record" ||
    (process.env.POLLY_MODE === "record-missing" && !recordingExists(name));
  const ctx = setup();
  const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
  const provider = createMachGen({ apiKey, timeout: 120000 });
  try {
    const payload = machgenPayload(index, taskType);
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
    // Billing is verification evidence, not part of the shipped provider API.
    const billingResponse = await fetch(
      `https://api.machgen.ai/api/v0/tasks/${encodeURIComponent(task.task_id)}/billing`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );
    expect(billingResponse.status).toBe(200);
    const billing = (await billingResponse.json()) as {
      generation_cost_micros: number;
      generation_credit_micros: number;
      net_cost_micros: number;
    };
    expect(status.status, status.error_msg ?? "task did not complete").toBe(
      "COMPLETED"
    );
    expect(status.task_output?.video).toMatch(/^https:\/\//);
    expect(status.task_output?.video).toContain(task.task_id);
    expect(status.metadata.model).toBe(payload.model);
    expect(billing.generation_cost_micros / 1e6).toBeCloseTo(estimate.usd, 6);
    if (live)
      console.log(
        JSON.stringify({
          recording: name,
          task_id: task.task_id,
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
