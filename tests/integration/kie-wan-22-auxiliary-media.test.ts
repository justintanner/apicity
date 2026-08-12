import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

const IMAGE_URL =
  "https://static.aiquickdraw.com/tools/example/1767694885407_pObJoMcy.png";
const VIDEO_URL =
  "https://static.aiquickdraw.com/tools/example/1767525918769_QyvTNib2.mp4";
const AUDIO_URL =
  "https://storage.googleapis.com/falserverless/example_inputs/elevenlabs/scribe_v2_in.mp3";

describe("kie Wan 2.2 auxiliary media integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  async function createTaskAndInspect(request: MediaGenerationRequest) {
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: process.env.KIE_API_KEY ?? "test-key",
    });
    const task = await provider.post.api.v1.jobs.createTask(
      request,
      mintKieCreateTaskOtp(request)
    );

    expect(task.code).toBe(200);
    expect(task.data?.taskId).toEqual(expect.any(String));
    expect(task.data?.taskId).toMatch(/\S/);

    const taskId = task.data!.taskId;
    const info = await provider.get.api.v1.jobs.recordInfo(taskId);

    expect(info.data?.taskId).toBe(taskId);
    expect(info.data?.model).toBe(request.model);
    expect(["waiting", "queuing", "generating", "success", "fail"]).toContain(
      info.data?.state
    );

    expect(typeof info.data?.param).toBe("string");
    const recordedParam = JSON.parse(info.data!.param!) as Record<
      string,
      unknown
    >;
    expect(recordedParam.model).toBe(request.model);
    expect(typeof recordedParam.input).toBe("string");
    if (typeof recordedParam.input !== "string") {
      throw new Error("Kie recordInfo omitted the original input payload");
    }
    // KIE may add server-side defaults (for example, duration for Animate
    // Move) to recordInfo.param. Every submitted operation-specific field
    // must still be preserved in the original request.
    expect(JSON.parse(recordedParam.input)).toMatchObject(request.input);
  }

  it("creates and inspects an A14B image-to-video task", async () => {
    const request = {
      model: "wan/2-2-a14b-image-to-video-turbo",
      input: {
        image_url: IMAGE_URL,
        prompt: "A cat looks toward the camera",
        resolution: "480p",
      },
    } satisfies MediaGenerationRequest;

    ctx = setupPolly("kie/wan-22-auxiliary-media/a14b-image-to-video");
    await createTaskAndInspect(request);
  });

  it("creates and inspects an A14B speech-to-video task", async () => {
    const request = {
      model: "wan/2-2-a14b-speech-to-video-turbo",
      input: {
        prompt: "A cat looks toward the camera",
        image_url: IMAGE_URL,
        audio_url: AUDIO_URL,
        num_frames: 40,
        frames_per_second: 4,
        resolution: "480p",
      },
    } satisfies MediaGenerationRequest;

    ctx = setupPolly("kie/wan-22-auxiliary-media/a14b-speech-to-video");
    await createTaskAndInspect(request);
  });

  it("creates and inspects an Animate Move task", async () => {
    const request = {
      model: "wan/2-2-animate-move",
      input: {
        video_url: VIDEO_URL,
        image_url: IMAGE_URL,
        resolution: "480p",
      },
    } satisfies MediaGenerationRequest;

    ctx = setupPolly("kie/wan-22-auxiliary-media/animate-move");
    await createTaskAndInspect(request);
  });

  it("creates and inspects an Animate Replace task", async () => {
    const request = {
      model: "wan/2-2-animate-replace",
      input: {
        video_url: VIDEO_URL,
        image_url: IMAGE_URL,
        resolution: "480p",
      },
    } satisfies MediaGenerationRequest;

    ctx = setupPolly("kie/wan-22-auxiliary-media/animate-replace");
    await createTaskAndInspect(request);
  });
});
