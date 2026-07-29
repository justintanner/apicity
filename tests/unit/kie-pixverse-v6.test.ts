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

// ---------------------------------------------------------------------------
// The four remaining PixVerse V6 models (REQ-002..REQ-005, REQ-008)
// ---------------------------------------------------------------------------
//
// Same two axes as the text-to-video block above, table-driven because the
// four models differ only in their payloads: one serialization test proving
// the guard leaves an accepted request untouched on the way to
// `/api/v1/jobs/createTask`, and one rejection test per documented violation
// proving `createTask` throws `KieError` 400 with populated issues and — the
// half that is easy to assume rather than assert — issues **no** fetch. The
// fetch stub therefore throws if it is ever reached, so a guard that stopped
// running would fail here rather than quietly pass.

const FRAME_URL = "https://example.com/frame.png";
const REFERENCE_URL = "https://example.com/subject.png";
const CLIP_URL = "https://example.com/clip.mp4";

interface GuardRejection {
  readonly label: string;
  readonly omit?: readonly string[];
  readonly patch?: Record<string, unknown>;
  // Set only where the acceptance criteria require the message to name the
  // offending pair (AC-7); range and enum cases assert issues, not wording.
  readonly message?: string;
}

interface GuardModel {
  readonly model: string;
  readonly taskId: string;
  readonly input: Record<string, unknown>;
  readonly rejections: readonly GuardRejection[];
}

const RANGE_REJECTIONS: readonly GuardRejection[] = [
  { label: "an off-list quality", patch: { quality: "2160p" } },
  { label: "a duration below the 1-15 range", patch: { duration: 0 } },
  { label: "a duration above the 1-15 range", patch: { duration: 16 } },
  { label: "a negative seed", patch: { seed: -1 } },
  { label: "a seed above 2147483647", patch: { seed: 2147483648 } },
  { label: "a 2-character prompt", patch: { prompt: "hi" } },
  { label: "a 5001-character prompt", patch: { prompt: "p".repeat(5001) } },
];

const GUARD_MODELS: readonly GuardModel[] = [
  {
    model: "pixverse-v6/image-to-video",
    taskId: "pixverse-v6-image-to-video-task-1",
    input: {
      prompt: SPEC_PROMPT,
      image_urls: [FRAME_URL],
      quality: "720p",
      duration: 5,
      generate_audio_switch: false,
      generate_multi_clip_switch: false,
      seed: 123456789,
    },
    rejections: [
      ...RANGE_REJECTIONS,
      { label: "a missing prompt", omit: ["prompt"] },
      { label: "a missing image_urls", omit: ["image_urls"] },
      { label: "a missing quality", omit: ["quality"] },
      { label: "an empty image_urls array", patch: { image_urls: [] } },
      {
        label: "three image_urls",
        patch: { image_urls: [FRAME_URL, FRAME_URL, FRAME_URL] },
      },
      {
        label: "both duration and template_id",
        patch: { template_id: "t-neon-rain" },
        message:
          "pixverse-v6/image-to-video requires exactly one of duration or template_id",
      },
      {
        label: "neither duration nor template_id",
        omit: ["duration"],
        message:
          "pixverse-v6/image-to-video requires exactly one of duration or template_id",
      },
    ],
  },
  {
    model: "pixverse-v6/transition",
    taskId: "pixverse-v6-transition-task-1",
    input: {
      prompt: SPEC_PROMPT,
      first_frame_image_url: "https://example.com/first.png",
      last_frame_image_url: "https://example.com/last.png",
      quality: "720p",
      duration: 5,
      generate_audio_switch: false,
      seed: 123456789,
    },
    rejections: [
      ...RANGE_REJECTIONS,
      { label: "a missing prompt", omit: ["prompt"] },
      {
        label: "a missing first_frame_image_url",
        omit: ["first_frame_image_url"],
      },
      {
        label: "a missing last_frame_image_url",
        omit: ["last_frame_image_url"],
      },
      { label: "a missing quality", omit: ["quality"] },
      { label: "a missing duration", omit: ["duration"] },
    ],
  },
  {
    model: "pixverse-v6/extend",
    taskId: "pixverse-v6-extend-task-1",
    input: {
      prompt: SPEC_PROMPT,
      duration: 5,
      quality: "720p",
      video_url: CLIP_URL,
      generate_audio_switch: false,
      seed: 123456789,
    },
    rejections: [
      ...RANGE_REJECTIONS,
      { label: "a missing prompt", omit: ["prompt"] },
      { label: "a missing duration", omit: ["duration"] },
      { label: "a missing quality", omit: ["quality"] },
      {
        label: "both taskId and video_url",
        patch: { taskId: "task-abc123" },
        message:
          "pixverse-v6/extend requires exactly one of taskId or video_url",
      },
      {
        label: "neither taskId nor video_url",
        omit: ["video_url"],
        message:
          "pixverse-v6/extend requires exactly one of taskId or video_url",
      },
    ],
  },
  {
    model: "pixverse-v6/reference-to-video",
    taskId: "pixverse-v6-reference-to-video-task-1",
    input: {
      prompt: SPEC_PROMPT,
      image_references: [
        { image_url: REFERENCE_URL, type: "subject", ref_name: "hero" },
        { image_url: FRAME_URL, type: "background" },
      ],
      aspect_ratio: "16:9",
      quality: "720p",
      duration: 5,
      generate_audio_switch: false,
      seed: 123456789,
    },
    rejections: [
      ...RANGE_REJECTIONS,
      { label: "a missing prompt", omit: ["prompt"] },
      { label: "a missing image_references", omit: ["image_references"] },
      { label: "a missing aspect_ratio", omit: ["aspect_ratio"] },
      { label: "a missing quality", omit: ["quality"] },
      { label: "a missing duration", omit: ["duration"] },
      { label: "an off-list aspect_ratio", patch: { aspect_ratio: "4:5" } },
      {
        label: "an empty image_references array",
        patch: { image_references: [] },
      },
      {
        label: "eight image_references",
        patch: {
          image_references: Array.from({ length: 8 }, (_unused, index) => ({
            image_url: `https://example.com/reference-${index}.png`,
          })),
        },
      },
      {
        label: "an image_references entry without image_url",
        patch: { image_references: [{ type: "subject", ref_name: "hero" }] },
      },
    ],
  },
];

// The guards read `req` and nothing else, so an invalid-by-construction
// payload cannot satisfy the request type. Passing it through the aggregator
// signature is the whole point of the case.
type CreateTaskArgument = Parameters<
  ReturnType<typeof createKie>["post"]["api"]["v1"]["jobs"]["createTask"]
>[0];

describe.each(GUARD_MODELS)(
  "KIE $model createTask guard",
  ({ model, taskId, input, rejections }) => {
    it("serializes an accepted request to the shared KIE jobs endpoint", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ code: 200, msg: "success", data: { taskId } }),
            { status: 200 }
          )
        );
      const provider = createKie({
        apiKey: "test-key",
        baseURL: "https://api.kie.ai",
        fetch: mockFetch,
        paygate: { secret: TEST_PAYGATE_SECRET },
      });
      const request = { model, input } as CreateTaskArgument;

      const result = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(result.data?.taskId).toBe(taskId);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.kie.ai/api/v1/jobs/createTask");
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual({
        Authorization: "Bearer test-key",
        "Content-Type": "application/json",
      });
      // The guard validates; it never rewrites. What the caller passed is
      // byte-for-byte what kie.ai receives — no injected defaults.
      expect(JSON.parse(init.body as string)).toEqual({ model, input });
    });

    it.each(rejections)(
      "rejects a request with $label before fetch",
      async ({ omit, patch, message }) => {
        const mockFetch = vi.fn(() => {
          throw new Error(`createTask must not reach fetch for ${model}`);
        });
        const provider = createKie({
          apiKey: "test-key",
          baseURL: "https://api.kie.ai",
          fetch: mockFetch,
          paygate: { secret: TEST_PAYGATE_SECRET },
        });
        const invalid: Record<string, unknown> = { ...input, ...patch };
        for (const field of omit ?? []) {
          delete invalid[field];
        }
        const request = { model, input: invalid } as CreateTaskArgument;

        const error: unknown = await provider.post.api.v1.jobs
          .createTask(request, mintKieCreateTaskOtp(request))
          .catch((err: unknown) => err);

        expect(error).toBeInstanceOf(KieError);
        const kieError = error as KieError;
        expect(kieError.status).toBe(400);
        expect(kieError.message).toContain("Invalid Kie createTask request");
        const { issues } = kieError.body as { issues: readonly unknown[] };
        expect(issues.length).toBeGreaterThan(0);
        if (message !== undefined) {
          expect(kieError.message).toContain(message);
        }
        expect(mockFetch).not.toHaveBeenCalled();
      }
    );
  }
);
