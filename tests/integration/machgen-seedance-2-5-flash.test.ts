import { describe, expect, it } from "vitest";
import { computeEstimate } from "@apicity/cost";
import {
  createMachGen,
  MachGenError,
  type MachGenGenerateRequest,
} from "@apicity/machgen";
import { recordingExists, setupPolly, teardownPolly } from "../harness";
import { CAT } from "../machgen-helpers";

// Public pricebook, 2026-11-25: 480p without an input video is 67253
// micros/s, Generation Credit 0, so 4 s quotes at 269012 micros. The
// recorded task billed exactly that.
const QUOTE_MICROS = 269012;
const RECEIPT_MICROS = 269012;
const FLOOR_MICROS = 10_000_000;

async function balance(apiKey: string): Promise<number> {
  const response = await fetch(
    "https://api.machgen.ai/api/v0/billing/account",
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );
  expect(response.status).toBe(200);
  const body = (await response.json()) as { balance_micros: number };
  expect(Number.isFinite(body.balance_micros)).toBe(true);
  return body.balance_micros;
}

describe("MachGen Seedance 2.5 Flash", () => {
  it("rejects an off-grid height without billing", async () => {
    const ctx = setupPolly("machgen/seedance-2-5-flash-off-grid-height");
    const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
    const provider = createMachGen({ apiKey, timeout: 120000 });
    try {
      const before = await balance(apiKey);
      // Height is checked before duration, and 999 s is off every grid, so
      // MachGen refuses the request before admitting a task.
      const payload: MachGenGenerateRequest = {
        model: "Seedance-2.5-Flash",
        task_type: "I2V",
        prompt: "The cat slowly blinks.",
        src_image_urls: [CAT],
        video_config: {
          height: 1080,
          duration_secs: 999,
          aspect_ratio: "adaptive",
        },
      };
      const local = provider.api.v0.generate.schema.safeParse(payload);
      expect(local.success).toBe(false);
      expect(local.error?.issues.map((i) => i.message)).toContain(
        "Seedance-2.5-Flash does not support I2V height=1080; allowed heights: 480, 720"
      );
      const error = await provider.api.v0
        .generate(payload)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(MachGenError);
      expect((error as MachGenError).status).toBe(400);
      // MachGen names the same two heights as the model list and the grid.
      expect((error as MachGenError).detail).toBe(
        "Seedance-2.5-Flash does not support I2V height=1080; allowed heights: [480, 720]"
      );
      expect(await balance(apiKey)).toBe(before);
    } finally {
      await teardownPolly(ctx);
    }
  }, 120000);

  it("generates a 480p 4s image-to-video", async () => {
    const name = "machgen/seedance-2-5-flash-i2v";
    const live =
      process.env.POLLY_MODE === "record" ||
      (process.env.POLLY_MODE === "record-missing" && !recordingExists(name));
    const ctx = setupPolly(name);
    const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
    const provider = createMachGen({ apiKey, timeout: 120000 });
    try {
      const payload: MachGenGenerateRequest = {
        model: "Seedance-2.5-Flash",
        task_type: "I2V",
        prompt: "The cat slowly blinks.",
        src_image_urls: [CAT],
        video_config: {
          duration_secs: 4,
          height: 480,
          audio: false,
          aspect_ratio: "adaptive",
        },
      };
      expect(provider.api.v0.generate.schema.safeParse(payload).success).toBe(
        true
      );
      const estimate = computeEstimate({ provider: "machgen", payload });
      expect(estimate.warnings).toEqual([]);
      expect(Math.round(estimate.usd * 1e6)).toBe(QUOTE_MICROS);
      const before = await balance(apiKey);
      if (before - QUOTE_MICROS < FLOOR_MICROS) {
        throw new Error(
          `wallet ${before} micros would fall under ${FLOOR_MICROS} after this call`
        );
      }
      const task = await provider.api.v0.generate(payload);
      expect(task.task_id).toBeTruthy();
      let status = await provider.api.v0.tasks(task.task_id);
      for (
        let attempt = 0;
        attempt < 180 && !["COMPLETED", "FAILED"].includes(status.status);
        attempt++
      ) {
        if (live) await new Promise((resolve) => setTimeout(resolve, 10000));
        status = await provider.api.v0.tasks(task.task_id);
      }
      const billing = await provider.api.v0.tasks.billing(task.task_id);
      expect(status.status, status.error_msg ?? "task did not complete").toBe(
        "COMPLETED"
      );
      expect(status.task_output?.video).toMatch(/^https:\/\//);
      expect(billing.generation_cost_micros).toBe(RECEIPT_MICROS);
      expect(billing.generation_credit_micros).toBe(0);
      expect(billing.net_cost_micros).toBe(RECEIPT_MICROS);
      expect(before).toBeGreaterThan(RECEIPT_MICROS);
    } finally {
      await teardownPolly(ctx);
    }
  }, 2000000);
});
