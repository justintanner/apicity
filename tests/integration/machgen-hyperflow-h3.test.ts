import { describe, expect, it } from "vitest";
import { computeEstimate } from "@apicity/cost";
import {
  createMachGen,
  MachGenError,
  type MachGenGenerateRequest,
} from "@apicity/machgen";
import { recordingExists, setupPolly, teardownPolly } from "../harness";

// Public pricebook re-read 2026-11-19: MiniMax-H3-MultiMax (the
// MiniMax-H3-Turbo wire id) is 15000 micros/s at 480p through
// 2027-01-01T07:59Z. One second is the shortest accepted clip.
// Recorded receipt the same day, task ad7a09cf: 15000 micros, credit 0.
const QUOTE_MICROS = 15000;
const FLOOR_MICROS = 10_000_000;
// Stop before a call that could land under the floor even if the
// receipt is several times the published 1 s quote.
const CEILING_MICROS = 100_000;

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

describe("MachGen Hyperflow H3 adapter", () => {
  it("rejects an unknown model id without billing", async () => {
    const ctx = setupPolly("machgen/hyperflow-h3-unknown-model");
    const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
    const provider = createMachGen({ apiKey, timeout: 120000 });
    try {
      const before = await balance(apiKey);
      const payload: MachGenGenerateRequest = {
        model: "Hyperflow-H3-Missing",
        task_type: "T2V",
        prompt: "A red paper boat drifts across a calm pond.",
        video_config: {
          height: 480,
          duration_secs: 1,
          aspect_ratio: "16:9",
        },
      };
      expect(provider.api.v0.generate.schema.safeParse(payload).success).toBe(
        true
      );
      await expect(provider.api.v0.generate(payload)).rejects.toBeInstanceOf(
        MachGenError
      );
      expect(await balance(apiKey)).toBe(before);
    } finally {
      await teardownPolly(ctx);
    }
  }, 120000);

  it("generates a 480p 1s clip through the hyperflow adapter", async () => {
    const name = "machgen/hyperflow-h3-t2v";
    const live =
      process.env.POLLY_MODE === "record" ||
      (process.env.POLLY_MODE === "record-missing" && !recordingExists(name));
    const ctx = setupPolly(name);
    const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
    const provider = createMachGen({ apiKey, timeout: 120000 });
    try {
      const payload: MachGenGenerateRequest = {
        model: "MiniMax-H3-Turbo",
        task_type: "T2V",
        prompt: "A red paper boat drifts across a calm pond at sunrise.",
        adapter: "hyperflow",
        video_config: {
          height: 480,
          duration_secs: 1,
          aspect_ratio: "16:9",
        },
      };
      expect(provider.api.v0.generate.schema.safeParse(payload).success).toBe(
        true
      );
      const estimate = computeEstimate({ provider: "machgen", payload });
      expect(estimate.warnings).toEqual([]);
      expect(Math.round(estimate.usd * 1e6)).toBe(QUOTE_MICROS);
      const before = await balance(apiKey);
      if (before - CEILING_MICROS < FLOOR_MICROS) {
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
      expect(billing.generation_credit_micros).toBe(0);
      expect(billing.net_cost_micros).toBe(billing.generation_cost_micros);
      expect(billing.generation_cost_micros).toBe(QUOTE_MICROS);
      expect(before).toBeGreaterThan(billing.generation_cost_micros);
    } finally {
      await teardownPolly(ctx);
    }
  }, 2000000);
});
