import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

// Recorded evidence that upstream accepts the 4K tier for bytedance/seedance-2,
// spelled `"4k"` — lowercase, matching the enum kie documents at
// docs.kie.ai/market/bytedance/seedance-2 (["480p","720p","1080p","4k"]). The
// uppercase `"4K"` taken from the pricing page's label is rejected on the wire:
// createTask answers `{"code":422,"msg":"Invalid resolution"}` (recorded
// 2026-08-06 under ac-8cfo6r WI-4).
//
// Reaching the wire at all requires Seedance2InputSchema.resolution to list the
// value — the client-side CREATE_TASK_GUARDS entry for this model rejects an
// out-of-enum payload before any request is issued.
//
// Image-to-video with a plain public HTTPS first_frame_url (no asset upload),
// so the cross-cutting allowlists in upload-recordings.test.ts and
// multipart-recordings.test.ts need no entry for this fixture.
//
// The recorded response reports creditsConsumed 832.0 for 4 s — at the repo's
// documented 1 credit = $0.005 basis that is $4.16, i.e. 208 credits/s, the
// "no video input" rate — even though first_frame_url is present. See the
// WI-4 summary: @apicity/cost's seedance-2 i2v/t2v discriminator keys off
// first_frame_url and predicts $2.56 for this payload.
describe("kie bytedance/seedance-2 4K integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should create a 4K image-to-video task and poll to completion",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/bytedance-seedance-2-4k");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        model: "bytedance/seedance-2",
        input: {
          prompt: "A cat stretches lazily then looks up toward the camera",
          first_frame_url:
            "https://static.aiquickdraw.com/tools/example/1767694885407_pObJoMcy.png",
          resolution: "4k",
          duration: 4,
          generate_audio: false,
          web_search: false,
          nsfw_checker: false,
        },
      } satisfies MediaGenerationRequest;
      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const pollDelay = getPollyMode() === "replay" ? 0 : 5000;
      const taskId = task.data!.taskId;
      let state = "waiting";
      for (let i = 0; i < 200; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          if (state === "success") {
            expect(info.data?.resultJson).toBeTruthy();
          }
          break;
        }
        if (pollDelay) await new Promise((r) => setTimeout(r, pollDelay));
      }

      expect(state).toBe("success");
    }
  );

  it("should accept 4K through the shipped createTask schema", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });

    const ok = provider.post.api.v1.jobs.createTask.schema.safeParse({
      model: "bytedance/seedance-2",
      input: {
        prompt: "A cat stretches lazily then looks up toward the camera",
        first_frame_url:
          "https://static.aiquickdraw.com/tools/example/1767694885407_pObJoMcy.png",
        resolution: "4k",
        duration: 4,
        generate_audio: false,
        web_search: false,
        nsfw_checker: false,
      },
    });
    expect(ok.success).toBe(true);
  });
});
