import { describe, expect, it } from "vitest";
import { computeEstimate } from "@apicity/cost";
import {
  createMachGen,
  MachGenError,
  type MachGenGenerateRequest,
} from "@apicity/machgen";
import {
  CHARSHEET_PRATFALL_PROMPT,
  CHARSHEET_PRATFALL_SOFT_PROMPT,
  CHARSHEET_URL,
} from "../charsheet-pratfall-helpers";
import { recordingExists, setupPolly, teardownPolly } from "../harness";

// Public pricebook re-read 2026-11-25: Seedance-2.5, no input video,
// height 720, is 231120 micros/s with a 15% generation credit and no
// discount. Five seconds at that rate is the shared spec. A free R2V
// POST the same day (aspect_ratio "2:1") returned HTTP 400 before
// reserving and listed 9:16 among the allowed ratios. The silence
// switch on this route is video_config.audio; the schema has no
// generate_audio field.
const RATE_MICROS = 231120;
const SECONDS = 5;
const QUOTE_MICROS = RATE_MICROS * SECONDS;
const CREDIT_MICROS = (QUOTE_MICROS * 15) / 100;
const NET_MICROS = QUOTE_MICROS - CREDIT_MICROS;
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

const moderation = (message: string) =>
  /moderat|safety|policy|refus|prohibited|violat/i.test(message);

const transient = (message: string, status?: number) =>
  (status !== undefined && status >= 500) ||
  /timeout|temporar|unavailable|try again|upstream/i.test(message);

describe("MachGen Seedance 2.5 charsheet pratfall", () => {
  it("generates a 720p 5s 9:16 reference-to-video", async () => {
    const name = "machgen/seedance-2-5-charsheet-pratfall";
    const live =
      process.env.POLLY_MODE === "record" ||
      (process.env.POLLY_MODE === "record-missing" && !recordingExists(name));
    const ctx = setupPolly(name);
    const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
    const provider = createMachGen({ apiKey, timeout: 120000 });
    try {
      let prompt = CHARSHEET_PRATFALL_PROMPT;
      let completed: {
        taskId: string;
        video: string;
        before: number;
        after: number;
        gross: number;
        credit: number;
        net: number;
      } | null = null;

      for (let attempt = 0; attempt < 2 && !completed; attempt++) {
        const payload: MachGenGenerateRequest = {
          model: "Seedance-2.5",
          task_type: "R2V",
          prompt,
          src_image_urls: [CHARSHEET_URL],
          video_config: {
            height: 720,
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

        let taskId = "";
        try {
          const task = await provider.api.v0.generate(payload);
          taskId = task.task_id;
        } catch (error) {
          const status = error instanceof MachGenError ? error.status : 0;
          const detail =
            error instanceof MachGenError
              ? String(error.detail ?? error.message)
              : String(error);
          if (attempt === 0 && transient(detail, status)) continue;
          throw error;
        }
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
        const message = status.error_msg ?? "";
        if (status.status !== "COMPLETED") {
          const retry =
            attempt === 0 && (moderation(message) || transient(message));
          if (retry && moderation(message)) {
            prompt = CHARSHEET_PRATFALL_SOFT_PROMPT;
          }
          if (retry) continue;
          expect(status.status, message || "task did not complete").toBe(
            "COMPLETED"
          );
        }

        expect(billing.generation_cost_micros).toBe(QUOTE_MICROS);
        expect(billing.generation_credit_micros).toBe(CREDIT_MICROS);
        expect(billing.net_cost_micros).toBe(NET_MICROS);
        expect(status.task_output?.video).toMatch(/^https:\/\//);
        expect(status.task_output?.video).toContain(taskId);
        completed = {
          taskId,
          video: status.task_output?.video ?? "",
          before,
          after,
          gross: billing.generation_cost_micros,
          credit: billing.generation_credit_micros,
          net: billing.net_cost_micros,
        };
      }

      expect(completed).not.toBeNull();
      if (live && completed) {
        console.log(JSON.stringify({ recording: name, ...completed }));
      }
    } finally {
      await teardownPolly(ctx);
    }
  }, 2000000);
});
