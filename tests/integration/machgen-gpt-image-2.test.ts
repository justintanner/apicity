import { appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createMachGen } from "@apicity/machgen";
import { computeEstimate } from "@apicity/cost";
import { setupPolly, teardownPolly, recordingExists } from "../harness";

describe("MachGen GPT Image 2", () => {
  it("generates one EXPRESS image through the existing async endpoint", async () => {
    const name = "machgen/gpt-image-2-t2i";
    const live =
      process.env.POLLY_MODE === "record" ||
      (process.env.POLLY_MODE === "record-missing" && !recordingExists(name));
    const ctx = setupPolly(name);
    const machgen = createMachGen({
      apiKey: process.env.MACHGEN_API_KEY ?? "test-key",
      timeout: 120000,
    });
    try {
      const payload = {
        model: "GPT-Image-2",
        task_type: "T2I" as const,
        prompt: "A small red circle centered on a plain white background.",
        image_config: { width: 1280, height: 544 },
        optimization_level: "EXPRESS" as const,
      };
      expect(machgen.api.v0.generate.schema.safeParse(payload).success).toBe(
        true
      );
      const estimate = computeEstimate({ provider: "machgen", payload });
      expect(estimate.usd).toBe(0.001385);
      const task = await machgen.api.v0.generate(payload);
      expect(task.task_id).toBeTruthy();
      if (live) {
        console.log(`Accepted ${name}: ${task.task_id}`);
        appendFileSync(
          join(tmpdir(), "apicity-machgen-submissions.jsonl"),
          JSON.stringify({
            utc: new Date().toISOString(),
            recording: name,
            task_id: task.task_id,
            model: payload.model,
            task_type: payload.task_type,
            estimate_usd: estimate.usd,
          }) + "\n"
        );
      }
      let status = await machgen.api.v0.tasks(task.task_id);
      for (
        let attempt = 0;
        attempt < 180 && !["COMPLETED", "FAILED"].includes(status.status);
        attempt++
      ) {
        if (live) await new Promise((resolve) => setTimeout(resolve, 10000));
        status = await machgen.api.v0.tasks(task.task_id);
      }
      const billing = await machgen.api.v0.tasks.billing(task.task_id);
      if (live) console.log(JSON.stringify({ recording: name, ...billing }));
      expect(status.status, status.error_msg ?? "task did not complete").toBe(
        "COMPLETED"
      );
      expect(status.task_output?.image).toMatch(/^https:\/\//);
      expect(billing.task_id).toBe(task.task_id);
      expect(billing.generation_cost_micros / 1e6).toBe(estimate.usd);
      expect(billing.net_cost_micros).toBe(
        billing.generation_cost_micros - billing.generation_credit_micros
      );
    } finally {
      await teardownPolly(ctx);
    }
  }, 2000000);
});
