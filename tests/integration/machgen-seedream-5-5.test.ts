import { describe, expect, it } from "vitest";
import { computeEstimate } from "@apicity/cost";
import {
  createMachGen,
  MachGenError,
  type MachGenGenerateRequest,
} from "@apicity/machgen";
import { recordingExists, setupPolly, teardownPolly } from "../harness";
import { CAT } from "../machgen-helpers";

// Docs re-read 2026-11-20: $0.008 per input image plus $0.020 per output
// through 2,601,123 pixels. 1024² is 1,048,576, so one source image is
// $0.028. The public pricebook the same day is a flat $0.020 per image.
// The recorded receipt is the billed amount.
const QUOTE_MICROS = 28_000;
const FLOOR_MICROS = 10_000_000;
// Stop before a call that could land under the floor even if the
// receipt is several times the published quote.
const CEILING_MICROS = 100_000;

const payload: MachGenGenerateRequest = {
  model: "Seedream-5.5",
  task_type: "I2I",
  prompt: "A watercolor of the same cat sitting in a sunny window.",
  image_config: { width: 1024, height: 1024 },
  src_image_urls: [CAT],
};

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

describe("MachGen Seedream 5.5", () => {
  it("rejects an unknown model id without billing", async () => {
    const ctx = setupPolly("machgen/seedream-5-5-unknown-model");
    const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
    const provider = createMachGen({ apiKey, timeout: 120000 });
    try {
      const before = await balance(apiKey);
      const missing: MachGenGenerateRequest = {
        ...payload,
        model: "Seedream-5.5-Missing",
      };
      expect(provider.api.v0.generate.schema.safeParse(missing).success).toBe(
        true
      );
      await expect(provider.api.v0.generate(missing)).rejects.toBeInstanceOf(
        MachGenError
      );
      expect(await balance(apiKey)).toBe(before);
    } finally {
      await teardownPolly(ctx);
    }
  }, 120000);

  it("edits one 1024 image", async () => {
    const name = "machgen/seedream-5-5-i2i";
    const live =
      process.env.POLLY_MODE === "record" ||
      (process.env.POLLY_MODE === "record-missing" && !recordingExists(name));
    const ctx = setupPolly(name);
    const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
    const provider = createMachGen({ apiKey, timeout: 120000 });
    try {
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
        attempt < 90 && !["COMPLETED", "FAILED"].includes(status.status);
        attempt++
      ) {
        if (live) await new Promise((resolve) => setTimeout(resolve, 5000));
        status = await provider.api.v0.tasks(task.task_id);
      }
      const billing = await provider.api.v0.tasks.billing(task.task_id);
      const after = await balance(apiKey);
      if (live) {
        console.log(
          JSON.stringify({
            recording: name,
            task_id: task.task_id,
            before,
            after,
            billing,
            status: status.status,
            error: status.error_msg,
          })
        );
      }
      expect(status.status, status.error_msg ?? "task did not complete").toBe(
        "COMPLETED"
      );
      expect(status.task_output?.image).toMatch(/^https:\/\//);
      expect(billing.generation_credit_micros).toBe(0);
      expect(billing.net_cost_micros).toBe(billing.generation_cost_micros);
      expect(billing.generation_cost_micros).toBe(QUOTE_MICROS);
      expect(before).toBeGreaterThan(billing.generation_cost_micros);
    } finally {
      await teardownPolly(ctx);
    }
  }, 520000);
});
