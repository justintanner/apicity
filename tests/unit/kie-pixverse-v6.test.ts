import { describe, expect, it, vi } from "vitest";
import { createKie, KieError } from "@apicity/kie";
import type { PixverseV6TextToVideoRequest } from "@apicity/kie/zod";

import { TEST_PAYGATE_SECRET, mintKieCreateTaskOtp } from "../harness";

// Spec example payload (pixverse-v6-kie-spec.md): the upstream spec marks
// `prompt`, `aspect_ratio`, `quality`, and `duration` required despite
// documenting server defaults, so the createTask guard must reject any
// request that relies on them (BR-3) before any HTTP call (BR-4).
const SPEC_PROMPT =
  "A cinematic sunrise illuminates a mist-shrouded mountain lake; the " +
  "camera slowly sweeps across the water's surface as a flock of birds " +
  "flies overhead.";

describe("KIE PixVerse V6 text-to-video", () => {
  it("serializes createTask requests to the shared KIE jobs endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 200,
          msg: "success",
          data: { taskId: "pixverse-v6-task-1" },
        }),
        { status: 200 }
      )
    );
    const provider = createKie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const request = {
      model: "pixverse-v6/text-to-video",
      input: {
        prompt: SPEC_PROMPT,
        aspect_ratio: "16:9",
        quality: "720p",
        duration: 5,
        generate_audio_switch: false,
        generate_multi_clip_switch: false,
        seed: 123456789,
      },
    } satisfies PixverseV6TextToVideoRequest;

    const result = await provider.post.api.v1.jobs.createTask(
      request,
      mintKieCreateTaskOtp(request)
    );

    expect(result.data?.taskId).toBe("pixverse-v6-task-1");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(init.body as string)).toEqual(request);
  });

  it.each([
    ["missing prompt", { aspect_ratio: "16:9", quality: "720p", duration: 5 }],
    [
      "missing aspect_ratio",
      { prompt: SPEC_PROMPT, quality: "720p", duration: 5 },
    ],
    [
      "missing quality",
      { prompt: SPEC_PROMPT, aspect_ratio: "16:9", duration: 5 },
    ],
    [
      "missing duration",
      { prompt: SPEC_PROMPT, aspect_ratio: "16:9", quality: "720p" },
    ],
    [
      "invalid aspect_ratio enum",
      {
        prompt: SPEC_PROMPT,
        aspect_ratio: "4:5",
        quality: "720p",
        duration: 5,
      },
    ],
    [
      "invalid quality enum",
      {
        prompt: SPEC_PROMPT,
        aspect_ratio: "16:9",
        quality: "2160p",
        duration: 5,
      },
    ],
    [
      "duration below the 1-15 range",
      {
        prompt: SPEC_PROMPT,
        aspect_ratio: "16:9",
        quality: "720p",
        duration: 0,
      },
    ],
    [
      "duration above the 1-15 range",
      {
        prompt: SPEC_PROMPT,
        aspect_ratio: "16:9",
        quality: "720p",
        duration: 16,
      },
    ],
    [
      "negative seed",
      {
        prompt: SPEC_PROMPT,
        aspect_ratio: "16:9",
        quality: "720p",
        duration: 5,
        seed: -1,
      },
    ],
  ])("rejects a request %s before fetch", async (_label, input) => {
    const mockFetch = vi.fn();
    const provider = createKie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    // Invalid-by-construction payloads: the whole point of these cases is
    // that they fail the request schema, so they cannot satisfy the request
    // type. The cast is safe here because the guard only reads the value.
    const request = {
      model: "pixverse-v6/text-to-video",
      input,
    } as PixverseV6TextToVideoRequest;

    await expect(
      provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      )
    ).rejects.toMatchObject({
      name: "KieError",
      status: 400,
      message: expect.stringContaining("Invalid Kie createTask request"),
      body: { issues: expect.any(Array) },
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("exposes the zod issues path in the KieError message", async () => {
    const mockFetch = vi.fn();
    const provider = createKie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch: mockFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const request = {
      model: "pixverse-v6/text-to-video",
      input: { aspect_ratio: "16:9", quality: "720p", duration: 5 },
    } as PixverseV6TextToVideoRequest;

    const error: unknown = await provider.post.api.v1.jobs
      .createTask(request, mintKieCreateTaskOtp(request))
      .catch((err: unknown) => err);

    expect(error).toBeInstanceOf(KieError);
    expect((error as KieError).message).toContain("input.prompt");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
