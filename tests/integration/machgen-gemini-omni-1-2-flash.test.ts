import { describe, expect, it } from "vitest";
import { computeEstimate } from "@apicity/cost";
import {
  createMachGen,
  MachGenError,
  type MachGenGenerateRequest,
} from "@apicity/machgen";
import { recordingExists, setupPolly, teardownPolly } from "../harness";

// Published 360p quote on 2026-11-19: 3 s * 23172 micros. The receipt
// that day was 73664 micros, credit 0. The file is 3.029 s, which is
// not 73664 at 23172 micros/s, and the account pricebook matches the
// public rows. The estimate stays on the published rate.
const QUOTE_MICROS = 69516;
const RECEIPT_MICROS = 73664;
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

describe("MachGen Gemini Omni Flash 1.2", () => {
  it("rejects an unknown model id without billing", async () => {
    const ctx = setupPolly("machgen/gemini-omni-1-2-flash-unknown-model");
    const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
    const provider = createMachGen({ apiKey, timeout: 120000 });
    try {
      const before = await balance(apiKey);
      const payload: MachGenGenerateRequest = {
        model: "Gemini-Omni-9.9-Missing",
        task_type: "T2V",
        prompt: "A red paper boat drifts across a calm pond.",
        video_config: {
          height: 360,
          duration_secs: 3,
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

  it("generates a 360p 3s text-to-video", async () => {
    const name = "machgen/gemini-omni-1-2-flash-t2v";
    const live =
      process.env.POLLY_MODE === "record" ||
      (process.env.POLLY_MODE === "record-missing" && !recordingExists(name));
    const ctx = setupPolly(name);
    const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
    const provider = createMachGen({ apiKey, timeout: 120000 });
    try {
      const payload: MachGenGenerateRequest = {
        model: "Gemini-Omni-1.2-Flash",
        task_type: "T2V",
        prompt: "A red paper boat drifts across a calm pond at sunrise.",
        video_config: {
          height: 360,
          duration_secs: 3,
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
      if (before - RECEIPT_MICROS < FLOOR_MICROS) {
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
