import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie bytedance/seedance-2 integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should create a text-to-video task and poll to completion",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("kie/bytedance-seedance-2");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const request = {
        model: "bytedance/seedance-2",
        input: {
          prompt: "A calm lake at dawn with mist rising over the water",
          resolution: "480p",
          aspect_ratio: "16:9",
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

  it("should validate payload via schema", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });

    const ok = provider.post.api.v1.jobs.createTask.schema.safeParse({
      model: "bytedance/seedance-2",
      input: {
        prompt: "A calm lake at dawn with mist rising over the water",
        resolution: "1080p",
        aspect_ratio: "16:9",
        duration: 5,
        generate_audio: false,
        web_search: false,
      },
    });
    expect(ok.success).toBe(true);

    const badModel = provider.post.api.v1.jobs.createTask.schema.safeParse({
      model: "not-a-real-model",
      input: { prompt: "hello world", web_search: false },
    });
    expect(badModel.success).toBe(false);
  });

  it("should expose model input schema for bytedance/seedance-2", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const schema = provider.modelInputSchemas["bytedance/seedance-2"];

    // Bind the identity, not just presence: consumers build this model's
    // payloads from its modelInputSchemas descriptor, so attaching a
    // sibling model's descriptor here would misstate the input contract.
    expect(schema).toBe(modelInputSchemas["bytedance/seedance-2"]);
    expect(schema.type).toBe("video");
    expect(schema.fields.prompt.required).toBe(true);
    expect(schema.fields.resolution.enum).toContain("1080p");
    expect(schema.fields.resolution.enum).toContain("4K");
    expect(schema.fields.aspect_ratio.enum).toContain("adaptive");
    expect(schema.fields.web_search.required).toBe(true);
  });
});
