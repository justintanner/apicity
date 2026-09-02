import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { createKie, type AlephGenerateRequest } from "@apicity/kie";
import { mintKieRunwayOtp, TEST_PAYGATE_SECRET } from "../harness";

// Records a REAL Runway Aleph video-to-video generation: 110 credits ~= $0.55
// per run (packages/provider/cost/src/pricing/kie.ts, key "aleph/generate").
// NEVER re-record. `pnpm run dev:rerecord` on this file spends another $0.55.
// The committed HAR replays offline forever; there is no reason to re-run it.
const RECORDING_NAME = "kie/aleph/video-lifecycle";

const ALEPH_VIDEO_REQUEST = {
  prompt: "Transform the clip into a hand-painted watercolor animation.",
  videoUrl:
    "https://static.aiquickdraw.com/tools/example/1767525918769_QyvTNib2.mp4",
  aspectRatio: "16:9",
} satisfies AlephGenerateRequest;

describe("kie aleph video lifecycle", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "generates an Aleph video and polls record-info to success",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly(RECORDING_NAME);

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const task = await provider.post.api.v1.aleph.generate(
        ALEPH_VIDEO_REQUEST,
        mintKieRunwayOtp("api.v1.aleph.generate", ALEPH_VIDEO_REQUEST)
      );

      expect(task.code).toBe(200);
      expect(typeof task.data?.taskId).toBe("string");
      expect(task.data?.taskId).toBeTruthy();

      const taskId = task.data!.taskId;
      const recordInfo = provider.get.api.v1.aleph.recordInfo;
      const pollDelay = getPollyMode() === "replay" ? 0 : 5000;

      let flag = 0;
      let resultVideoUrl: string | undefined;
      let failure =
        "poll budget exhausted before Aleph reached a terminal state";

      for (let i = 0; i < 120; i++) {
        const info = await recordInfo(taskId);
        expect(recordInfo.responseSchema.safeParse(info).success).toBe(true);
        expect(info.data?.taskId).toBe(taskId);
        flag = info.data?.successFlag ?? 0;
        // KIE convention: 0 GENERATING, 1 SUCCESS, 2 CREATE_TASK_FAILED,
        // 3 GENERATE_FAILED. Anything >= 1 is terminal.
        if (flag >= 1) {
          resultVideoUrl = info.data?.response?.resultVideoUrl;
          failure = `successFlag=${flag} errorCode=${
            info.data?.errorCode ?? "none"
          } errorMessage=${info.data?.errorMessage ?? "none"}`;
          break;
        }
        if (pollDelay) await new Promise((r) => setTimeout(r, pollDelay));
      }

      expect(flag, failure).toBe(1);
      expect(resultVideoUrl).toBeTruthy();
      expect(resultVideoUrl).toMatch(/^https?:\/\//);
    }
  );
});
