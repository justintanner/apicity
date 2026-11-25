import { appendFileSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeEstimate } from "@apicity/cost";
import { createMachGen, type MachGenGenerateRequest } from "@apicity/machgen";
import {
  CHARSHEET_PRATFALL_PROMPT,
  CHARSHEET_URL,
} from "../charsheet-pratfall-helpers";
import { recordingExists, setupPolly, teardownPolly } from "../harness";

// KIE's google/gemini-omni-flash-1-2 route failed twice on 2026-11-25 with
// failCode 524 "generate task timeout." (tasks
// 7ad078a1a1da78ec00adb151e1f9e1ae and 8cf6b114431202eba2a9ab2b4b0dacf2,
// both refunded), so the mayor moved this bake-off model to MachGen.
// Account reads the same day: the pricebook prices Gemini-Omni-1.2-Flash at
// 720p at 69504 micros/s with no generation credit and no discount, so five
// seconds is 347520 micros. GET /api/v0/models lists R2V heights
// [360, 720, 1080, 2160], aspect ratios adaptive, 16:9 and 9:16, durations
// -1 and 3-15, and supports_audio false: the model has no silence switch,
// so the request sends no audio field and the prompt asks for no dialogue
// and no music. A free R2V POST with duration_secs 999 (task
// 37e5c7a5-a623-428f-af0e-a187308451bc) returned HTTP 400 before reserving
// and left the wallet unchanged. One billed attempt only (mayor ruling on
// ac-x46z98). The receipt was 349200 micros, not the 347520 quote: 5.024 s
// at the 720p rate, which matches the 5.03 s file (720x1280, 24 fps, with
// an AAC track). MachGen's Gemini T2V receipt also billed past its quote
// (machgen-gemini-omni-1-2-flash.test.ts). The estimate stays on the
// published rate.
const RATE_MICROS = 69504;
const SECONDS = 5;
const QUOTE_MICROS = RATE_MICROS * SECONDS;
const RECEIPT_MICROS = 349200;
const CREDIT_MICROS = 0;
const NET_MICROS = RECEIPT_MICROS - CREDIT_MICROS;
const FLOOR_MICROS = 10_000_000;
const PLAN_CAP_USD = 10;
const RECORDING_CEILING_USD = 2;
const LEDGER = "/gc/apicity/plans/ac-gupjgo/evidence/spend-ledger.tsv";

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

function planSpendUsd(): number {
  let text = "";
  try {
    text = readFileSync(LEDGER, "utf8");
  } catch {
    return 0;
  }
  return text
    .split("\n")
    .slice(1)
    .reduce((sum, line) => {
      const usd = Number(line.split("\t")[5]);
      return sum + (Number.isFinite(usd) ? usd : 0);
    }, 0);
}

describe("MachGen Gemini Omni 1.2 Flash charsheet pratfall", () => {
  it("generates a 720p 5s 9:16 reference-to-video", async () => {
    const name = "machgen/gemini-omni-1-2-flash-charsheet-pratfall";
    const live =
      process.env.POLLY_MODE === "record" ||
      (process.env.POLLY_MODE === "record-missing" && !recordingExists(name));
    const ctx = setupPolly(name);
    const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
    const provider = createMachGen({ apiKey, timeout: 120000 });
    try {
      const payload: MachGenGenerateRequest = {
        model: "Gemini-Omni-1.2-Flash",
        task_type: "R2V",
        prompt: CHARSHEET_PRATFALL_PROMPT,
        src_image_urls: [CHARSHEET_URL],
        video_config: {
          height: 720,
          duration_secs: SECONDS,
          aspect_ratio: "9:16",
        },
      };
      expect(provider.api.v0.generate.schema.safeParse(payload).success).toBe(
        true
      );
      const estimate = computeEstimate({ provider: "machgen", payload });
      expect(estimate.warnings).toEqual([]);
      expect(Math.round(estimate.usd * 1e6)).toBe(QUOTE_MICROS);
      expect(estimate.usd).toBeLessThanOrEqual(RECORDING_CEILING_USD);
      if (live) {
        const spent = planSpendUsd();
        if (spent + estimate.usd > PLAN_CAP_USD) {
          throw new Error(
            `plan spend ${spent} + ${estimate.usd} would cross ${PLAN_CAP_USD} USD`
          );
        }
      }
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
      if (live) {
        appendFileSync(
          LEDGER,
          [
            new Date().toISOString(),
            "ac-e9t125",
            "machgen",
            "POST https://api.machgen.ai/api/v0/generate",
            taskId,
            (billing.net_cost_micros / 1e6).toFixed(6),
            String(before),
            String(after),
            [
              `gross ${billing.generation_cost_micros}`,
              `credit ${billing.generation_credit_micros}`,
              `net ${billing.net_cost_micros}`,
              `status ${status.status}`,
              "wallets are micros",
            ].join(" "),
          ].join("\t") + "\n"
        );
      }
      expect(status.status, status.error_msg ?? "task did not complete").toBe(
        "COMPLETED"
      );
      expect(billing.generation_cost_micros).toBe(RECEIPT_MICROS);
      expect(billing.generation_credit_micros).toBe(CREDIT_MICROS);
      expect(billing.net_cost_micros).toBe(NET_MICROS);
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
            gross: billing.generation_cost_micros,
            credit: billing.generation_credit_micros,
            net: billing.net_cost_micros,
          })
        );
      }
    } finally {
      await teardownPolly(ctx);
    }
  }, 2000000);
});
