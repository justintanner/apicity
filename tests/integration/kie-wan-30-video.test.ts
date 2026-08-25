import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

describe("kie wan/3-0-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a wan 3.0 text-to-video task and poll status", async () => {
    ctx = setupPolly("kie/wan-30-video");

    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const request = {
      model: "wan/3-0-video",
      input: {
        prompt:
          "Under the moonlight, a small cat walks along a rooftop; distant neon flickers, smooth cinematic camera movement",
        resolution: "480P",
        aspect_ratio: "1:1",
        duration: 2,
        audio: false,
        nsfw_checker: false,
      },
    } satisfies MediaGenerationRequest;
    const task = await provider.post.api.v1.jobs.createTask(
      request,
      mintKieCreateTaskOtp(request)
    );

    expect(task.code).toBe(200);
    expect(task.data?.taskId).toBeTruthy();

    const info = await provider.get.api.v1.jobs.recordInfo(task.data!.taskId);

    expect(info.data?.taskId).toBe(task.data?.taskId);
    expect(["waiting", "queuing", "generating", "success", "fail"]).toContain(
      info.data?.state
    );
  });

  it("should create a wan 3.0 prime task and poll status", async () => {
    ctx = setupPolly("kie/wan-30-video-prime");

    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });

    const request = {
      model: "wan/3-0-video-prime",
      input: {
        prompt:
          "A red panda pads through bamboo at sunrise, soft light, smooth cinematic camera movement",
        resolution: "480P",
        aspect_ratio: "1:1",
        duration: 2,
        audio: false,
        nsfw_checker: false,
      },
    } satisfies MediaGenerationRequest;
    const task = await provider.post.api.v1.jobs.createTask(
      request,
      mintKieCreateTaskOtp(request)
    );

    expect(task.code).toBe(200);
    expect(task.data?.taskId).toBeTruthy();
  });

  it("should validate a minimal text-to-video payload for both models", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    for (const model of ["wan/3-0-video", "wan/3-0-video-prime"]) {
      const result = provider.post.api.v1.jobs.createTask.schema.safeParse({
        model,
        input: { prompt: "a cat on a rooftop" },
      });
      expect(result.success, model).toBe(true);
    }
  });

  it("should require a prompt or at least one media input", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const result = provider.post.api.v1.jobs.createTask.schema.safeParse({
      model: "wan/3-0-video",
      input: { resolution: "720P" },
    });
    expect(result.success).toBe(false);
  });

  it("should reject frame parameters combined with reference media", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const result = provider.post.api.v1.jobs.createTask.schema.safeParse({
      model: "wan/3-0-video",
      input: {
        prompt: "a cat",
        first_frame_url: "https://example.com/a.png",
        reference_image_urls: ["https://example.com/b.png"],
      },
    });
    expect(result.success).toBe(false);
  });

  it("should reject file and link sources together", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const result = provider.post.api.v1.jobs.createTask.schema.safeParse({
      model: "wan/3-0-video",
      input: {
        prompt: "a cat",
        reference_file_urls: ["https://example.com/brief.pdf"],
        reference_link_urls: ["https://example.com/article"],
      },
    });
    expect(result.success).toBe(false);
  });

  it("should enforce the published reference-media limits", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const schema = provider.post.api.v1.jobs.createTask.schema;
    const url = "https://example.com/a.png";
    const parse = (input: Record<string, unknown>) =>
      schema.safeParse({ model: "wan/3-0-video", input }).success;
    expect(parse({ reference_image_urls: Array(10).fill(url) })).toBe(true);
    expect(parse({ reference_image_urls: Array(11).fill(url) })).toBe(false);
    expect(parse({ reference_video_urls: Array(5).fill(url) })).toBe(true);
    expect(parse({ reference_video_urls: Array(6).fill(url) })).toBe(false);
    expect(parse({ reference_audio_urls: Array(5).fill(url) })).toBe(true);
    expect(parse({ reference_audio_urls: Array(6).fill(url) })).toBe(false);
    expect(parse({ reference_file_urls: Array(2).fill(url) })).toBe(false);
    expect(parse({ reference_link_urls: Array(2).fill(url) })).toBe(false);
  });

  it("should accept the uppercase resolution tiers and reject lowercase", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const schema = provider.post.api.v1.jobs.createTask.schema;
    const parse = (resolution: string) =>
      schema.safeParse({
        model: "wan/3-0-video",
        input: { prompt: "a cat", resolution },
      }).success;
    // Kie spells this family's tiers in uppercase, unlike wan/2-7.
    expect(parse("480P")).toBe(true);
    expect(parse("720P")).toBe(true);
    expect(parse("1080P")).toBe(true);
    expect(parse("720p")).toBe(false);
  });

  it("should bound duration and accept the -1 intelligent-duration sentinel", () => {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: "test-key",
    });
    const schema = provider.post.api.v1.jobs.createTask.schema;
    const parse = (duration: number) =>
      schema.safeParse({
        model: "wan/3-0-video",
        input: { prompt: "a cat", duration },
      }).success;
    expect(parse(2)).toBe(true);
    expect(parse(30)).toBe(true);
    expect(parse(-1)).toBe(true);
    expect(parse(1)).toBe(false);
    expect(parse(31)).toBe(false);
    expect(parse(-2)).toBe(false);
  });

  it("should expose both models in modelInputSchemas", () => {
    for (const model of ["wan/3-0-video", "wan/3-0-video-prime"] as const) {
      const schema = modelInputSchemas[model];
      expect(schema, model).toBeDefined();
      expect(schema.type).toBe("video");
      expect(schema.fields.resolution?.enum).toEqual(["480P", "720P", "1080P"]);
    }
  });
});
