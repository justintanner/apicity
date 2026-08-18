import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  getPollyMode,
  mintKieRunwayOtp,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";
import { createKie, type AlephGenerateRequest } from "@apicity/kie";

// Real Aleph video-to-video upstream-failure evidence, recorded 2026-08-18.
// Never re-record this file: each Aleph submission is billable. The request
// intentionally omits waterMark so a successful result would have no burned-in
// vendor watermark and omits callBackUrl because this test polls directly.
//
// Input: tests/fixtures/jump.mp4, hosted through KIE fileStreamUpload on the
// overseas R2 path (uploadCn: false). The committed attempt used
// https://tempfile.redpandaai.co/kieai/136592/videos/test-uploads/
// 1787093498568-wd60liaaio8.mp4; a record-time HEAD returned HTTP 200 and
// content-type video/mp4.
//
// The authorized ceiling was reached: 4 submissions x $0.55 = $2.20.
// Every task ended successFlag 3 / errorCode 500 with the verbatim message
// "internal error, please try again later.":
// - c0d088df35254cc3e7187fb7116b2efa: 1787093500000..1787093516000
// - aeceae14f47fb417e74fb27d521f2078: 1787093568000..1787093584000
// - 4e3a051bf102e84e89dc7cf7ffba2bfe: 1787093598000..1787093613000
// - b1afb1aee87195168ed9ac70a44b6541: 1787093633000..1787093649000
//
// REQ-003 and REQ-004 are unmet: no task produced a result video URL, so no
// result-media curl evidence exists. The observed failure data keys are all
// already modeled by AlephRecordInfoDataSchema/AlephRecordInfoData; the schema
// rider therefore requires no source change.
const RECORDING_NAME = "kie/aleph/generate-upstream-failure";

describe("kie aleph generate upstream failure", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "uploads a real clip and records Aleph's terminal upstream failure",
    { timeout: 1_200_000 },
    async () => {
      ctx = setupPollyForFileUploads(RECORDING_NAME);

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
      });

      const file = new Blob(
        [readFileSync(resolve(__dirname, "../fixtures/jump.mp4"))],
        { type: "video/mp4" }
      );
      const upload = await provider.post.api.fileStreamUpload({
        file,
        filename: "jump.mp4",
        uploadPath: "videos/test-uploads",
      });

      expect(upload.data?.downloadUrl).toBeTruthy();

      const request = {
        prompt: "Transform the clip into a hand-painted watercolor animation.",
        videoUrl: upload.data!.downloadUrl,
        uploadCn: false,
      } satisfies AlephGenerateRequest;
      const task = await provider.post.api.v1.aleph.generate(
        request,
        mintKieRunwayOtp("api.v1.aleph.generate", request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const recordInfo = provider.get.api.v1.aleph.recordInfo;
      const pollDelay = getPollyMode() === "replay" ? 0 : 5000;
      const taskId = task.data!.taskId;
      let successFlag: number | undefined;
      let errorCode: number | null | undefined;
      let errorMessage: string | null | undefined;

      for (let i = 0; i < 200; i++) {
        const info = await recordInfo(taskId);
        expect(recordInfo.responseSchema.safeParse(info).success).toBe(true);

        successFlag = info.data?.successFlag;
        errorCode = info.data?.errorCode;
        errorMessage = info.data?.errorMessage;
        if (successFlag === 1 || successFlag === 3) break;

        if (pollDelay)
          await new Promise((resolve) => setTimeout(resolve, pollDelay));
      }

      expect(successFlag).toBe(3);
      expect(typeof errorCode).toBe("number");
      expect(errorMessage).toEqual(expect.any(String));
      expect(errorMessage).not.toHaveLength(0);
    }
  );
});
