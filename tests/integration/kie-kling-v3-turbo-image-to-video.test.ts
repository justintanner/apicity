import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

const KLING_V3_TURBO_IMAGE_TO_VIDEO_REQUEST = {
  model: "kling/v3-turbo-image-to-video",
  input: {
    image_urls: [
      "https://static.aiquickdraw.com/tools/example/1770688028208_jxcvxCQm.png",
    ],
    prompt: "Camera slowly pushes in while morning light crosses the table.",
    duration: "5",
    resolution: "720p",
  },
} as const;

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

describe("kie kling/v3-turbo-image-to-video integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("creates a task with the documented image-to-video payload", async () => {
    ctx = setupPolly("kie/kling-v3-turbo-image-to-video");

    let captured: CapturedRequest | undefined;
    const provider = createKie({
      paygate: { secret: TEST_PAYGATE_SECRET },
      apiKey: process.env.KIE_API_KEY ?? "test-key",
      fetch: async (input, init) => {
        const headers = new Headers(init?.headers);
        captured = {
          url: requestUrl(input),
          method: init?.method ?? "GET",
          headers: Object.fromEntries(headers.entries()),
          body: typeof init?.body === "string" ? init.body : "",
        };

        return globalThis.fetch(input, init);
      },
    });

    const task = await provider.post.api.v1.jobs.createTask(
      KLING_V3_TURBO_IMAGE_TO_VIDEO_REQUEST,
      mintKieCreateTaskOtp(KLING_V3_TURBO_IMAGE_TO_VIDEO_REQUEST)
    );

    expect(captured).toBeDefined();
    expect(captured?.url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
    expect(captured?.method).toBe("POST");
    expect(captured?.headers.authorization).toBe("Bearer test-key");
    expect(captured?.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(captured!.body)).toEqual(
      KLING_V3_TURBO_IMAGE_TO_VIDEO_REQUEST
    );

    expect(task.code).toBe(200);
    expect(task.data?.taskId).toBe(
      "task_kling_v3_turbo_image_to_video_apicity"
    );
  });
});
