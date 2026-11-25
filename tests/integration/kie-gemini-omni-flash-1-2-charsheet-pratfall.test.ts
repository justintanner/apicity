import { appendFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { computeEstimate } from "@apicity/cost";
import {
  getPollyMode,
  mintKieCreateTaskOtp,
  recordingExists,
  setupPollyForFileUploads,
  teardownPolly,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import {
  CHARSHEET_FIXTURE,
  CHARSHEET_MIME_TYPE,
  CHARSHEET_PRATFALL_PROMPT,
} from "../charsheet-pratfall-helpers";

// Charsheet umbrella-pratfall bake-off (ac-gupjgo), R05 = ac-e9t125:
// Gemini Omni Flash 1.2 in its reference-image mode (mode A: no first frame,
// no video). The docs, re-read 2026-11-25, still require duration 3-15 in
// this mode and list 9:16 and 720p. The model has no audio switch, so the
// prompt's "no dialogue, no music" is the only silence request.
// The sheet goes up through fileStreamUpload, the bake-off's KIE delivery.
// A first try that passed CHARSHEET_URL straight into image_urls failed
// upstream after 22 s (failCode 524, "generate task timeout.") and was
// refunded, so the retry keeps the image on KIE's own storage.
// PRICING.kie bills 9 credits/s at 720p (0.045 USD/s), 45 credits for 5 s,
// and KIE fixes the charge at submission.
const NAME = "kie/gemini-omni-flash-1-2-charsheet-pratfall";
const SECONDS = 5;
const EXPECTED_CREDITS = 45;
const USD_PER_CREDIT = 0.005;
const FLOOR_CREDITS = 10 / USD_PER_CREDIT;
const PLAN_CAP_USD = 10;
const RECORDING_CEILING_USD = 2;
const LEDGER = "/gc/apicity/plans/ac-gupjgo/evidence/spend-ledger.tsv";

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

describe("kie google/gemini-omni-flash-1-2 charsheet pratfall", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  // One billed attempt only; a retry is a separate, deliberate recording.
  it(
    "generates a 720p 5s 9:16 reference-to-video",
    { timeout: 900_000 },
    async () => {
      const live =
        getPollyMode() === "record" ||
        (getPollyMode() === "record-missing" && !recordingExists(NAME));
      ctx = setupPollyForFileUploads(NAME);

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const upload = await provider.post.api.fileStreamUpload({
        file: new Blob(
          [
            readFileSync(
              path.resolve(
                import.meta.dirname,
                "..",
                "fixtures",
                CHARSHEET_FIXTURE
              )
            ),
          ],
          { type: CHARSHEET_MIME_TYPE }
        ),
        filename: CHARSHEET_FIXTURE,
        uploadPath: "images/test-uploads",
      });
      expect(upload.data?.downloadUrl).toMatch(/^https:\/\//);
      const charsheetUrl = upload.data!.downloadUrl;

      const request = {
        model: "google/gemini-omni-flash-1-2",
        input: {
          prompt: CHARSHEET_PRATFALL_PROMPT,
          duration: SECONDS,
          aspect_ratio: "9:16",
          resolution: "720p",
          image_urls: [charsheetUrl],
        },
      } satisfies MediaGenerationRequest;
      expect(
        provider.post.api.v1.jobs.createTask.schema.safeParse(request).success
      ).toBe(true);
      const estimate = computeEstimate({ provider: "kie", payload: request });
      expect(estimate.warnings).toEqual([]);
      expect(estimate.usd).toBeCloseTo(EXPECTED_CREDITS * USD_PER_CREDIT, 6);
      expect(estimate.usd).toBeLessThanOrEqual(RECORDING_CEILING_USD);
      if (live) {
        const spent = planSpendUsd();
        if (spent + estimate.usd > PLAN_CAP_USD) {
          throw new Error(
            `plan spend ${spent} + ${estimate.usd} would cross ${PLAN_CAP_USD} USD`
          );
        }
      }

      const before = (await provider.get.api.v1.chat.credit()).data;
      expect(typeof before).toBe("number");
      if (before! - EXPECTED_CREDITS < FLOOR_CREDITS) {
        throw new Error(
          `wallet ${before} credits would fall under ${FLOOR_CREDITS} after this call`
        );
      }

      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );
      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();
      const taskId = task.data!.taskId!;

      const pollDelay = live ? 5000 : 0;
      let state = "waiting";
      let resultJson: string | undefined;
      let creditsConsumed: number | undefined;
      let failMsg: string | undefined;
      for (let i = 0; i < 240; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          resultJson = info.data?.resultJson;
          creditsConsumed = (
            info.data as { creditsConsumed?: number } | undefined
          )?.creditsConsumed;
          failMsg = info.data?.failMsg;
          break;
        }
        if (pollDelay)
          await new Promise((resolve) => setTimeout(resolve, pollDelay));
      }
      const after = (await provider.get.api.v1.chat.credit()).data;

      if (live) {
        appendFileSync(
          LEDGER,
          [
            new Date().toISOString(),
            "ac-e9t125",
            "kie",
            "POST https://api.kie.ai/api/v1/jobs/createTask (google/gemini-omni-flash-1-2)",
            taskId,
            ((creditsConsumed ?? 0) * USD_PER_CREDIT).toFixed(6),
            String(before),
            String(after),
            [
              `creditsConsumed ${creditsConsumed}`,
              `state ${state}`,
              "wallets are credits at 0.005 USD",
            ].join(" "),
          ].join("\t") + "\n"
        );
      }

      expect(state, failMsg ?? "task did not finish").toBe("success");
      expect(creditsConsumed).toBe(EXPECTED_CREDITS);
      const result = JSON.parse(resultJson!) as { resultUrls?: string[] };
      expect(result.resultUrls?.[0]).toMatch(/^https:\/\//);
    }
  );
});
