import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  mintKieCreateTaskOtp,
  TEST_PAYGATE_SECRET,
  type PollyContext,
} from "../harness";
import {
  createKie,
  GoogleGeminiOmniFlash12RequestSchema,
  type MediaGenerationRequest,
} from "@apicity/kie";

describe("kie google/gemini-omni-flash-1-2 integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "creates a text-to-video task and polls to a successful media result",
    { timeout: 900_000 },
    async () => {
      ctx = setupPolly("kie/google-gemini-omni-flash-1-2");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      // The cheapest documented request: text only, the 3 s minimum at
      // 360p. KIE bills 4 credits per output second at 360p.
      const request = {
        model: "google/gemini-omni-flash-1-2",
        input: {
          prompt: "A red panda waves once, then holds still.",
          duration: 3,
          resolution: "360p",
          aspect_ratio: "16:9",
        },
      } satisfies MediaGenerationRequest;

      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const taskId = task.data!.taskId!;
      const pollDelay = getPollyMode() === "replay" ? 0 : 5000;
      let state = "waiting";
      let resultJson: string | undefined;
      let creditsConsumed: number | undefined;

      for (let i = 0; i < 240; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          resultJson = info.data?.resultJson;
          creditsConsumed = (
            info.data as { creditsConsumed?: number } | undefined
          )?.creditsConsumed;
          break;
        }
        if (pollDelay)
          await new Promise((resolve) => setTimeout(resolve, pollDelay));
      }

      expect(state).toBe("success");
      expect(resultJson).toBeTruthy();

      const result = JSON.parse(resultJson!) as { resultUrls?: string[] };
      expect(result.resultUrls).toBeInstanceOf(Array);
      expect(result.resultUrls!.length).toBeGreaterThan(0);
      expect(result.resultUrls![0]).toMatch(/^https?:\/\//);
      // Soft on purpose: an upstream omission must not fail a paid fixture.
      if (creditsConsumed !== undefined) {
        expect(creditsConsumed).toBeGreaterThan(0);
      }
    }
  );

  it("should validate payload via schema", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const schema = provider.post.api.v1.jobs.createTask.schema;

    const ok = schema.safeParse({
      model: "google/gemini-omni-flash-1-2",
      input: {
        prompt: "Restyle the clip as a watercolor.",
        video_list: ["https://example.com/clip.mp4"],
        image_urls: ["https://example.com/ref.png"],
        resolution: "1080p",
      },
    });
    expect(ok.success).toBe(true);

    // The mode rules are asserted on the model schema: createTask.schema is
    // a plain z.union, and a union failure nests every member's issues under
    // one invalid_union issue.
    const durationOnEdit = {
      model: "google/gemini-omni-flash-1-2",
      input: {
        prompt: "An edit.",
        duration: 5,
        video_list: ["https://example.com/clip.mp4"],
      },
    };
    const model =
      GoogleGeminiOmniFlash12RequestSchema.safeParse(durationOnEdit);
    expect(model.success).toBe(false);
    expect(
      model.error?.issues.some(
        (issue) => issue.path.join(".") === "input.duration"
      )
    ).toBe(true);
    expect(schema.safeParse(durationOnEdit).success).toBe(false);
  });
});
