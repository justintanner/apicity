import { appendFileSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeEstimate } from "@apicity/cost";
import { createMachGen, type MachGenGenerateRequest } from "@apicity/machgen";
import {
  CHARSHEET_PRATFALL_PROMPT,
  CHARSHEET_URL,
} from "../charsheet-pratfall-helpers";
import { recordingExists, setupPolly, teardownPolly } from "../harness";

// Public pricebook re-read 2026-11-25: Seedance-2.5-Flash, no input
// video, height 720, is 151200 micros/s with generation credit 0 and
// no discount. Five seconds at that rate is the shared spec (0.756
// USD, gross equals net). A free R2V POST the same day (aspect_ratio
// "2:1", task aa227459-82f5-49d7-9d2d-2be262a5aab1) returned HTTP 400
// before reserving and listed 9:16 among the allowed ratios. Duration
// 5, height 720 and audio false passed that check. The silence switch
// on this route is video_config.audio; the schema has no
// generate_audio field. One billed attempt only: a second MachGen
// attempt needs a mayor yes (order amendment 2026-11-25 15:55Z).
const RATE_MICROS = 151200;
const SECONDS = 5;
const QUOTE_MICROS = RATE_MICROS * SECONDS;
const CREDIT_MICROS = 0;
const NET_MICROS = QUOTE_MICROS - CREDIT_MICROS;
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

describe("MachGen Seedance 2.5 Flash charsheet pratfall", () => {
  it("generates a 720p 5s 9:16 reference-to-video", async () => {
    const name = "machgen/seedance-2-5-flash-charsheet-pratfall";
    const live =
      process.env.POLLY_MODE === "record" ||
      (process.env.POLLY_MODE === "record-missing" && !recordingExists(name));
    const ctx = setupPolly(name);
    const apiKey = process.env.MACHGEN_API_KEY ?? "test-key";
    const provider = createMachGen({ apiKey, timeout: 120000 });
    try {
      const payload: MachGenGenerateRequest = {
        model: "Seedance-2.5-Flash",
        task_type: "R2V",
        prompt: CHARSHEET_PRATFALL_PROMPT,
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
            "ac-yza406",
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
      expect(billing.generation_cost_micros).toBe(QUOTE_MICROS);
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
