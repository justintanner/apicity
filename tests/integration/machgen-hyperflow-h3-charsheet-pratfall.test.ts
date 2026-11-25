import { describe, expect, it } from "vitest";
import { computeEstimate } from "@apicity/cost";
import { createMachGen, type MachGenGenerateRequest } from "@apicity/machgen";
import {
  CHARSHEET_PRATFALL_PROMPT,
  CHARSHEET_URL,
} from "../charsheet-pratfall-helpers";
import { recordingExists, setupPolly, teardownPolly } from "../harness";

// Charsheet umbrella-pratfall bake-off (ac-gupjgo), R04 = ac-az1538:
// Hyperflow H3 is the MiniMax-H3-Turbo `hyperflow` adapter. The derived r2v
// board left it out (it maps it now, ac-46ojeh), so free 400s settled R2V
// first on 2026-11-25: with a
// made-up adapter and duration_secs 999, MachGen answered "MiniMax-H3-MultiMax
// R2V does not support adapter=...; allowed: (... 'hyperflow' ...)", and with
// `hyperflow` it moved on to the duration check, so R2V takes the adapter at
// height 768 and 9:16 (the wallet did not move). The web capability contract
// agrees: the MultiMax r2v mode lists `hyperflow` among its adapters.
// Public pricebook re-read 2026-11-19: MiniMax-H3-MultiMax (the Turbo wire
// id) is 15000 micros/s at 480 and 768 with no generation credit, so five
// seconds is 75000 micros. The silence switch is video_config.audio.
const RATE_MICROS = 15000;
const SECONDS = 5;
const QUOTE_MICROS = RATE_MICROS * SECONDS;
const FLOOR_MICROS = 10_000_000;
const RECORDING_CEILING_USD = 2;

async function balance(apiKey: string): Promise<number> {
  const response = await fetch(
    "https://api.machgen.ai/api/v0/billing/account",
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  expect(response.status).toBe(200);
  const body = (await response.json()) as { balance_micros: number };
  expect(Number.isFinite(body.balance_micros)).toBe(true);
  return body.balance_micros;
}

describe("MachGen Hyperflow H3 charsheet pratfall", () => {
  // One billed attempt only: a second MachGen attempt in this bake-off needs
  // the mayor's yes (ac-az1538 amendment, 2026-11-25), so nothing retries.
  it("generates a 768p 5s 9:16 reference-to-video", async () => {
    const name = "machgen/hyperflow-h3-charsheet-pratfall";
    const live =
      process.env.POLLY_MODE === "record" ||
      (process.env.POLLY_MODE === "record-missing" && !recordingExists(name));
    const ctx = setupPolly(name);
    const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
    const provider = createMachGen({ apiKey, timeout: 120000 });
    try {
      const payload: MachGenGenerateRequest = {
        model: "MiniMax-H3-Turbo",
        task_type: "R2V",
        prompt: CHARSHEET_PRATFALL_PROMPT,
        adapter: "hyperflow",
        src_image_urls: [CHARSHEET_URL],
        video_config: {
          height: 768,
          duration_secs: SECONDS,
          aspect_ratio: "9:16",
          audio: false,
        },
      };
      expect(provider.api.v0.generate.schema.safeParse(payload).success).toBe(
        true
      );
      const estimate = computeEstimate({ provider: "machgen", payload });
      expect(estimate.warnings).toEqual([]);
      expect(Math.round(estimate.usd * 1e6)).toBe(QUOTE_MICROS);
      expect(estimate.usd).toBeLessThanOrEqual(RECORDING_CEILING_USD);
      const before = await balance(apiKey);
      if (before - QUOTE_MICROS < FLOOR_MICROS) {
        throw new Error(
          `wallet ${before} micros would fall under ${FLOOR_MICROS} after this call`
        );
      }

      const task = await provider.api.v0.generate(payload);
      const taskId = task.task_id;
      expect(taskId).toBeTruthy();

      let status = await provider.api.v0.tasks(taskId);
      for (
        let poll = 0;
        poll < 180 && !["COMPLETED", "FAILED"].includes(status.status);
        poll++
      ) {
        if (live) await new Promise((resolve) => setTimeout(resolve, 10000));
        status = await provider.api.v0.tasks(taskId);
      }
      if (!["COMPLETED", "FAILED"].includes(status.status)) {
        throw new Error(
          `task ${taskId} still ${status.status}; not submitting again`
        );
      }
      const billing = await provider.api.v0.tasks.billing(taskId);
      const after = await balance(apiKey);

      expect(status.status, status.error_msg ?? "task did not complete").toBe(
        "COMPLETED"
      );
      expect(billing.generation_cost_micros).toBe(QUOTE_MICROS);
      expect(billing.generation_credit_micros).toBe(0);
      expect(billing.net_cost_micros).toBe(QUOTE_MICROS);
      expect(status.task_output?.video).toMatch(/^https:\/\//);
      expect(status.task_output?.video).toContain(taskId);
      if (live) {
        console.log(
          JSON.stringify({
            recording: name,
            taskId,
            video: status.task_output?.video,
            before,
            after,
            net: billing.net_cost_micros,
          })
        );
      }
    } finally {
      await teardownPolly(ctx);
    }
  }, 2000000);
});
