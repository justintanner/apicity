import { describe, expect, it } from "vitest";
import {
  createXai,
  XaiError,
  type XaiVideoGenerateRequest,
} from "@apicity/xai";

import { TEST_PAYGATE_SECRET, mintXaiOtp } from "../harness";

const MODEL = "grok-imagine-video-1.5-preview";
const VIDEO_GENERATIONS_DOT_PATH = "v1.videos.generations";
const VIDEO_EDITS_DOT_PATH = "v1.videos.edits";
const VIDEO_EXTENSIONS_DOT_PATH = "v1.videos.extensions";
const DOT_PATH = "v1.videos.generations.imageToVideo";

interface FetchCall {
  url: string;
  method: string;
  body?: unknown;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseJsonBody(body: BodyInit | null | undefined): unknown {
  if (typeof body !== "string") return undefined;
  return JSON.parse(body) as unknown;
}

function createQueuedFetch(responses: unknown[]): {
  calls: FetchCall[];
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
} {
  const calls: FetchCall[] = [];

  return {
    calls,
    fetch: async (input, init) => {
      const response = responses.shift();
      if (response === undefined) {
        throw new Error("No queued response for fake fetch");
      }

      calls.push({
        url: input instanceof Request ? input.url : String(input),
        method:
          init?.method ?? (input instanceof Request ? input.method : "GET"),
        body: parseJsonBody(init?.body),
      });

      if (response instanceof Response) return response;
      return jsonResponse(response);
    },
  };
}

function createProvider(fetch: ReturnType<typeof createQueuedFetch>["fetch"]) {
  return createXai({
    apiKey: "sk-test",
    fetch,
    paygate: { secret: TEST_PAYGATE_SECRET },
  });
}

describe("xai video generations default model", () => {
  it("defaults model-less generation requests to Grok Imagine Video 1.5", async () => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_default" },
    ]);
    const provider = createProvider(fetch);
    const req = {
      prompt: "A cinematic tracking shot through a rain-lit city street",
      duration: 10 as const,
      aspect_ratio: "16:9" as const,
      resolution: "720p" as const,
    };

    const result = await provider.post.v1.videos.generations(
      req,
      mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req)
    );

    expect(result.request_id).toBe("vid_req_default");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: "https://api.x.ai/v1/videos/generations",
      method: "POST",
      body: {
        ...req,
        model: MODEL,
      },
    });
    expect(req).not.toHaveProperty("model");
  });

  it("preserves explicit generation model selections", async () => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_explicit" },
    ]);
    const provider = createProvider(fetch);
    const req = {
      prompt: "A bright product reveal against a white studio background",
      model: "grok-imagine-video",
      duration: 10 as const,
    };

    const result = await provider.post.v1.videos.generations(
      req,
      mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req)
    );

    expect(result.request_id).toBe("vid_req_explicit");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: "https://api.x.ai/v1/videos/generations",
      method: "POST",
      body: req,
    });
  });

  // generate_audio comes from the video generation guide, output and user
  // from the REST reference; each is sent as written.
  it("sends generate_audio, output and user unchanged", async () => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_extras" },
    ]);
    const provider = createProvider(fetch);
    const req: XaiVideoGenerateRequest = {
      prompt: "A paper boat drifting down a rain-soaked street",
      model: "grok-imagine-video-1.5",
      aspect_ratio: "21:9",
      generate_audio: false,
      output: { upload_url: "https://bucket.example.com/boat.mp4?sig=abc" },
      user: "user-123",
    };

    await provider.post.v1.videos.generations(
      req,
      mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req)
    );

    expect(calls).toEqual([
      {
        url: "https://api.x.ai/v1/videos/generations",
        method: "POST",
        body: req,
      },
    ]);
  });

  // REQ-003/REQ-005 transport default, per the current reference-to-video doc
  // https://docs.x.ai/developers/model-capabilities/video/reference-to-video:
  // reference inputs are supported by the 1.5 family, so model-less reference
  // requests default to the canonical grok-imagine-video-1.5 model.
  it("defaults model-less reference_images requests to canonical 1.5", async () => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_ref_default" },
    ]);
    const provider = createProvider(fetch);
    const req = {
      prompt: "A dancer moves through a sunlit loft",
      reference_images: [{ url: "https://example.com/dancer.png" }],
    };

    const result = await provider.post.v1.videos.generations(
      req,
      mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req)
    );

    expect(result.request_id).toBe("vid_req_ref_default");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: "https://api.x.ai/v1/videos/generations",
      method: "POST",
      body: {
        ...req,
        model: "grok-imagine-video-1.5",
      },
    });
    expect(req).not.toHaveProperty("model");
  });

  it("defaults model-less reference_image_file_ids requests to canonical 1.5", async () => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_ref_ids_default" },
    ]);
    const provider = createProvider(fetch);
    const req = {
      prompt: "A dancer moves through a sunlit loft",
      reference_image_file_ids: ["file_dancer"],
    };

    const result = await provider.post.v1.videos.generations(
      req,
      mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req)
    );

    expect(result.request_id).toBe("vid_req_ref_ids_default");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: "https://api.x.ai/v1/videos/generations",
      method: "POST",
      body: {
        prompt: req.prompt,
        model: "grok-imagine-video-1.5",
        reference_images: [{ file_id: "file_dancer" }],
      },
    });
    expect(req).not.toHaveProperty("model");
  });

  it("normalizes stored file IDs for video generation", async () => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_files" },
    ]);
    const provider = createProvider(fetch);
    const req = {
      prompt: "A camera pulls back through a neon city",
      model: "grok-imagine-video",
      duration: 5 as const,
      reference_image_file_ids: ["file_sign", "file_street"],
      storage_options: {
        filename: "city-loop.mp4",
        public_url: { expires_after: 86400 },
      },
    };

    const result = await provider.post.v1.videos.generations(
      req,
      mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req)
    );

    expect(result.request_id).toBe("vid_req_files");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: "https://api.x.ai/v1/videos/generations",
      method: "POST",
      body: {
        prompt: req.prompt,
        model: "grok-imagine-video",
        duration: 5,
        reference_images: [
          { file_id: "file_sign" },
          { file_id: "file_street" },
        ],
        storage_options: {
          filename: "city-loop.mp4",
          public_url: { expires_after: 86400 },
        },
      },
    });
    expect(calls[0]?.body).not.toHaveProperty("image");
  });

  it("transports mixed raw reference images in order without mutation", async () => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_mixed_raw_refs" },
    ]);
    const provider = createProvider(fetch);
    const referenceImages = [
      { url: "https://example.com/reference.png" },
      { url: "data:image/png;base64,AAAA" },
      { file_id: "file_reference" },
    ];
    const req = {
      prompt: "The subject from <IMAGE_0> crosses a sunlit plaza",
      model: "grok-imagine-video-1.5-preview",
      reference_images: referenceImages,
    };
    const original = {
      prompt: req.prompt,
      model: req.model,
      reference_images: referenceImages.map((reference) => ({ ...reference })),
    };

    await provider.post.v1.videos.generations(
      req,
      mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req)
    );

    expect(calls).toEqual([
      {
        url: "https://api.x.ai/v1/videos/generations",
        method: "POST",
        body: original,
      },
    ]);
    expect(req).toEqual(original);
    expect(req.reference_images).toBe(referenceImages);
  });

  it("transports audio-only references and preserves caller input", async () => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_audio_ref" },
    ]);
    const provider = createProvider(fetch);
    const referenceAudios = [{ voice_id: "Eve" }];
    const req = {
      prompt: "The speaker uses <AUDIO_0> in a quiet studio",
      reference_audios: referenceAudios,
      duration: 15 as const,
    };
    const original = {
      prompt: req.prompt,
      reference_audios: [{ voice_id: "Eve" }],
      duration: req.duration,
    };

    await provider.post.v1.videos.generations(
      req,
      mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req)
    );

    expect(req).toEqual(original);
    expect(req.reference_audios).toBe(referenceAudios);
    expect(calls).toEqual([
      {
        url: "https://api.x.ai/v1/videos/generations",
        method: "POST",
        body: {
          prompt: req.prompt,
          model: "grok-imagine-video-1.5",
          reference_audios: [{ voice_id: "Eve" }],
          duration: 15,
        },
      },
    ]);
    expect(calls[0]?.body).not.toHaveProperty("reference_audio_ids");
  });

  it("transports combined image and audio references without rewriting markers", async () => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_combined_ref" },
    ]);
    const provider = createProvider(fetch);
    const req = {
      prompt: "The person from <IMAGE_0> speaks with <AUDIO_0>",
      model: "grok-imagine-video-1.5-preview",
      reference_image_file_ids: ["file_person"],
      reference_audios: [{ voice_id: "eve" }],
    };

    await provider.post.v1.videos.generations(
      req,
      mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req)
    );

    expect(calls[0]?.body).toEqual({
      prompt: req.prompt,
      model: req.model,
      reference_images: [{ file_id: "file_person" }],
      reference_audios: [{ voice_id: "eve" }],
    });
    expect(req).toEqual({
      prompt: req.prompt,
      model: req.model,
      reference_image_file_ids: ["file_person"],
      reference_audios: [{ voice_id: "eve" }],
    });
  });

  it.each([
    {
      label: "four voices",
      request: {
        prompt: "A singer walks onto a stage",
        reference_audios: [
          { voice_id: "a" },
          { voice_id: "b" },
          { voice_id: "c" },
          { voice_id: "d" },
        ],
      },
    },
    {
      label: "blank voice",
      request: {
        prompt: "A singer walks onto a stage",
        reference_audios: [{ voice_id: "   " }],
      },
    },
    {
      label: "empty voice",
      request: {
        prompt: "A singer walks onto a stage",
        reference_audios: [{ voice_id: "" }],
      },
    },
    {
      label: "fifteen raw reference images",
      request: {
        prompt: "A singer walks onto a stage",
        reference_images: Array.from({ length: 15 }, (_, index) => ({
          url: `https://example.com/reference-${index}.png`,
        })),
      },
    },
    {
      label: "fifteen reference image file IDs",
      request: {
        prompt: "A singer walks onto a stage",
        reference_image_file_ids: Array.from(
          { length: 15 },
          (_, index) => `file_reference_${index}`
        ),
      },
    },
    {
      label: "eight reference images on grok-imagine-video",
      request: {
        prompt: "A singer walks onto a stage",
        model: "grok-imagine-video",
        reference_images: Array.from({ length: 8 }, (_, index) => ({
          url: `https://example.com/reference-${index}.png`,
        })),
      },
    },
    {
      label: "five keyframes",
      request: {
        keyframes: [1, 2, 3, 4, 5].map((timestamp_s) => ({
          image: { url: `https://example.com/key-${timestamp_s}.png` },
          timestamp_s,
        })),
      },
    },
    {
      label: "a keyframe at 0 seconds",
      request: {
        keyframes: [
          { image: { url: "https://example.com/key.png" }, timestamp_s: 0 },
        ],
      },
    },
    {
      label: "a keyframe at the end of a 4-second clip",
      request: {
        duration: 4 as const,
        keyframes: [
          { image: { url: "https://example.com/key.png" }, timestamp_s: 4 },
        ],
      },
    },
    {
      label: "two keyframes in one 1/3-second slot",
      request: {
        keyframes: [
          { image: { url: "https://example.com/a.png" }, timestamp_s: 2 },
          { image: { url: "https://example.com/b.png" }, timestamp_s: 2.1 },
        ],
      },
    },
    {
      label: "a last frame on grok-imagine-video",
      request: {
        model: "grok-imagine-video",
        last_frame: { url: "https://example.com/last.png" },
      },
    },
    {
      label: "keyframes on 1.5-lite",
      request: {
        model: "grok-imagine-video-1.5-lite",
        keyframes: [
          { image: { url: "https://example.com/key.png" }, timestamp_s: 2 },
        ],
      },
    },
    {
      label: "reference images without a prompt",
      request: {
        reference_images: [{ url: "https://example.com/ref.png" }],
      },
    },
    {
      label: "voices without a prompt",
      request: { reference_audios: [{ voice_id: "eve" }] },
    },
    { label: "an empty request", request: {} },
    {
      label: "legacy duration",
      request: {
        prompt: "A singer walks onto a stage",
        model: "grok-imagine-video",
        reference_images: [{ url: "https://example.com/ref.png" }],
        duration: 11 as const,
      },
    },
    // The lite model page lists text and image to video only.
    {
      label: "reference images on 1.5-lite",
      request: {
        prompt: "A dancer moves through a sunlit loft",
        model: "grok-imagine-video-1.5-lite",
        reference_images: [{ url: "https://example.com/dancer.png" }],
      },
    },
    {
      label: "reference file ids on 1.5-lite",
      request: {
        prompt: "A dancer moves through a sunlit loft",
        model: "grok-imagine-video-1.5-lite",
        reference_image_file_ids: ["file_dancer"],
      },
    },
    // docs.x.ai documents voices on grok-imagine-video-1.5 only.
    {
      label: "a voice on 1.5-lite",
      request: {
        prompt: "A singer walks onto a stage",
        model: "grok-imagine-video-1.5-lite",
        reference_audios: [{ voice_id: "eve" }],
      },
    },
  ])("rejects $label before fetch", async ({ request }) => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_never_sent" },
    ]);
    const provider = createProvider(fetch);

    const error = await provider.post.v1.videos
      .generations(request, mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, request))
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(XaiError);
    expect((error as XaiError).status).toBe(400);
    expect(calls).toHaveLength(0);
  });
});

// REQ-001/REQ-006/REQ-010 pre-transport guard call path: the generations leaf
// throws XaiError(400) before any billed request for incompatible modes or
// invalid reference inputs. A source video excludes every other mode, and
// grok-imagine-video refuses an image beside references; the 1.5 family
// pins that image as the first frame.
describe("xai video generations pre-transport mode guard", () => {
  it("rejects a mixed-mode request without consuming the queued fetch", async () => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_never_sent" },
    ]);
    const provider = createProvider(fetch);
    const req = {
      prompt: "A camera pulls back through a neon city",
      model: "grok-imagine-video",
      image: { url: "https://example.com/still.png" },
      reference_images: [{ url: "https://example.com/ref.png" }],
    };

    const error = await provider.post.v1.videos
      .generations(req, mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req))
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(XaiError);
    expect((error as XaiError).status).toBe(400);
    expect((error as XaiError).message).toContain(
      "Only one video mode can be active per request"
    );
    expect(calls).toHaveLength(0);
  });

  it("rejects every reference spelling combined with every source spelling", async () => {
    const referenceModes = [
      {
        label: "reference_images",
        fields: { reference_images: [{ url: "https://example.com/ref.png" }] },
      },
      {
        label: "reference_image_file_ids",
        fields: { reference_image_file_ids: ["file_ref"] },
      },
      {
        label: "reference_audios",
        fields: { reference_audios: [{ voice_id: "eve" }] },
      },
    ];
    const sourceModes = [
      {
        label: "image",
        fields: { image: { url: "https://example.com/image.png" } },
      },
      {
        label: "image_file_id",
        fields: { image_file_id: "file_image" },
      },
      {
        label: "video",
        fields: { video: { url: "https://example.com/video.mp4" } },
      },
      {
        label: "video_file_id",
        fields: { video_file_id: "file_video" },
      },
    ];

    // grok-imagine-video refuses every pair; elsewhere only a source video.
    for (const model of [
      "grok-imagine-video",
      "grok-imagine-video-1.5",
      undefined,
    ]) {
      for (const referenceMode of referenceModes) {
        for (const sourceMode of sourceModes) {
          if (
            model !== "grok-imagine-video" &&
            !sourceMode.label.startsWith("video")
          )
            continue;
          const { calls, fetch } = createQueuedFetch([
            { request_id: "vid_req_never_sent" },
          ]);
          const provider = createProvider(fetch);
          const request = {
            prompt: "A camera pulls back through a neon city",
            ...(model === undefined ? {} : { model }),
            ...referenceMode.fields,
            ...sourceMode.fields,
          };

          const error = await provider.post.v1.videos
            .generations(
              request,
              mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, request)
            )
            .catch((caught: unknown) => caught);

          const label = `${model ?? "no model"}: ${referenceMode.label} + ${sourceMode.label}`;
          expect(error, label).toBeInstanceOf(XaiError);
          expect((error as XaiError).status, label).toBe(400);
          expect((error as XaiError).message, label).toContain(
            "Only one video mode can be active per request"
          );
          expect(calls, label).toHaveLength(0);
        }
      }
    }
  });

  it("rejects a source video beside a pinned frame on the 1.5 family", async () => {
    for (const pin of [
      { last_frame: { url: "https://example.com/last.png" } },
      { last_frame_file_id: "file_last" },
      {
        keyframes: [
          { image: { url: "https://example.com/key.png" }, timestamp_s: 2 },
        ],
      },
    ]) {
      const { calls, fetch } = createQueuedFetch([
        { request_id: "vid_req_never_sent" },
      ]);
      const provider = createProvider(fetch);
      const request = {
        model: "grok-imagine-video-1.5",
        video_file_id: "file_video",
        ...pin,
      };

      const error = await provider.post.v1.videos
        .generations(request, mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, request))
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(XaiError);
      expect((error as XaiError).message).toContain(
        "Only one video mode can be active per request"
      );
      expect(calls).toHaveLength(0);
    }
  });

  it("sends a 1.5 reference request once (guard does not over-block)", async () => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_ref_ok" },
    ]);
    const provider = createProvider(fetch);
    const req = {
      prompt: "A camera pulls back through a neon city",
      model: "grok-imagine-video-1.5",
      reference_images: [{ url: "https://example.com/ref.png" }],
    };

    const result = await provider.post.v1.videos.generations(
      req,
      mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req)
    );

    expect(result.request_id).toBe("vid_req_ref_ok");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: "https://api.x.ai/v1/videos/generations",
      method: "POST",
      body: req,
    });
  });

  it("rejects incompatible audio model before fetch", async () => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_never_sent" },
    ]);
    const provider = createProvider(fetch);
    const req = {
      prompt: "A camera pulls back through a neon city",
      model: "grok-imagine-video",
      reference_audios: [{ voice_id: "eve" }],
    };

    const error = await provider.post.v1.videos
      .generations(req, mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req))
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(XaiError);
    expect((error as XaiError).status).toBe(400);
    expect((error as XaiError).message).toContain("reference_audios");
    expect(calls).toHaveLength(0);
  });

  it("rejects audio plus image-to-video on grok-imagine-video before fetch", async () => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_never_sent" },
    ]);
    const provider = createProvider(fetch);
    const req = {
      prompt: "A camera pulls back through a neon city",
      model: "grok-imagine-video",
      reference_audios: [{ voice_id: "eve" }],
      image: { url: "https://example.com/still.png" },
    };

    const error = await provider.post.v1.videos
      .generations(req, mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req))
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(XaiError);
    expect((error as XaiError).status).toBe(400);
    expect((error as XaiError).message).toContain(
      "Only one video mode can be active"
    );
    expect(calls).toHaveLength(0);
  });
});

// grok-imagine-video-1.5 pins "`image` as the first frame alongside
// references, `last_frame`, and up to **4** `keyframes`", and the prompt is
// optional whenever a frame is pinned (reference-to-video doc, read
// 2026-11-01).
describe("xai video generations pinned frames", () => {
  const FIRST = { url: "https://example.com/first.png" };
  const LAST = { url: "https://example.com/last.png" };
  const REFERENCE = { url: "https://example.com/reference.png" };
  const key = (timestamp_s: number) => ({
    image: { url: `https://example.com/key-${timestamp_s}.png` },
    timestamp_s,
  });
  const SHAPES: { label: string; request: XaiVideoGenerateRequest }[] = [
    {
      label: "image + last_frame",
      request: { image: FIRST, last_frame: LAST },
    },
    { label: "last_frame alone", request: { last_frame: LAST } },
    {
      label: "last_frame_file_id alone",
      request: { last_frame_file_id: "file_last" },
    },
    {
      label: "last_frame + reference_images",
      request: { last_frame: LAST, reference_images: [REFERENCE] },
    },
    {
      label: "image + reference_images",
      request: { image: FIRST, reference_images: [REFERENCE] },
    },
    {
      label: "image_file_id + reference_image_file_ids",
      request: {
        image_file_id: "file_first",
        reference_image_file_ids: ["file_reference"],
      },
    },
    {
      label: "image + reference_audios",
      request: { image: FIRST, reference_audios: [{ voice_id: "eve" }] },
    },
    { label: "one keyframe", request: { keyframes: [key(2)] } },
    { label: "four keyframes", request: { keyframes: [1, 2, 3, 4].map(key) } },
    {
      label: "every pin with references and voices",
      request: {
        image: FIRST,
        keyframes: [key(2), key(4)],
        last_frame: LAST,
        reference_images: [REFERENCE],
        reference_audios: [{ voice_id: "eve" }],
      },
    },
  ];

  it.each(SHAPES)("parses and sends $label once", async ({ request }) => {
    for (const model of [
      undefined,
      "grok-imagine-video-1.5",
      "grok-imagine-video-1.5-preview",
      "grok-imagine-video-1.5-2026-05-30",
    ]) {
      const { calls, fetch } = createQueuedFetch([{ request_id: "vid_pin" }]);
      const provider = createProvider(fetch);
      const req = model === undefined ? request : { ...request, model };

      expect(
        provider.post.v1.videos.generations.schema.safeParse(req).success,
        model
      ).toBe(true);
      await provider.post.v1.videos.generations(
        req,
        mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req)
      );

      expect(calls, model).toHaveLength(1);
      const body = calls[0]?.body as Record<string, unknown>;
      // Pinned frames and references default to the canonical 1.5 model.
      expect(body.model, model).toBe(model ?? "grok-imagine-video-1.5");
      for (const alias of [
        "image_file_id",
        "last_frame_file_id",
        "reference_image_file_ids",
      ]) {
        expect(body, model).not.toHaveProperty(alias);
      }
    }
  });

  it("sends last_frame_file_id as last_frame without mutating the caller", async () => {
    const { calls, fetch } = createQueuedFetch([{ request_id: "vid_last" }]);
    const provider = createProvider(fetch);
    const req = { last_frame_file_id: "file_last" };

    await provider.post.v1.videos.generations(
      req,
      mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req)
    );

    expect(calls[0]?.body).toEqual({
      last_frame: { file_id: "file_last" },
      model: "grok-imagine-video-1.5",
    });
    expect(req).toEqual({ last_frame_file_id: "file_last" });
  });

  it("lets last_frame win over last_frame_file_id", async () => {
    const { calls, fetch } = createQueuedFetch([{ request_id: "vid_both" }]);
    const provider = createProvider(fetch);
    const req = {
      model: "grok-imagine-video-1.5",
      last_frame: LAST,
      last_frame_file_id: "file_last",
    };

    await provider.post.v1.videos.generations(
      req,
      mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req)
    );

    expect(calls[0]?.body).toEqual({
      model: "grok-imagine-video-1.5",
      last_frame: LAST,
    });
  });

  it("keeps the preview default for plain image-to-video", async () => {
    const { calls, fetch } = createQueuedFetch([{ request_id: "vid_i2v" }]);
    const provider = createProvider(fetch);
    const req = { image: FIRST };

    await provider.post.v1.videos.generations(
      req,
      mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req)
    );

    expect(calls[0]?.body).toEqual({ image: FIRST, model: MODEL });
  });
});

describe("xai video stored file inputs", () => {
  it("normalizes stored video IDs for edits and extensions", async () => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_edit_file" },
      { request_id: "vid_extend_file" },
    ]);
    const provider = createProvider(fetch);
    const editReq = {
      model: "grok-imagine-video",
      prompt: "Add rain and a moody atmosphere",
      video_file_id: "file_source_video",
      storage_options: { filename: "rainy-city.mp4" },
    };
    const extendReq = {
      model: "grok-imagine-video",
      prompt: "Continue through the city",
      video_file_id: "file_rainy_city",
      duration: 5 as const,
      storage_options: {
        filename: "rainy-city-extended.mp4",
        public_url: false,
      },
    };

    const edit = await provider.post.v1.videos.edits(
      editReq,
      mintXaiOtp(VIDEO_EDITS_DOT_PATH, editReq)
    );
    const extension = await provider.post.v1.videos.extensions(
      extendReq,
      mintXaiOtp(VIDEO_EXTENSIONS_DOT_PATH, extendReq)
    );

    expect(edit.request_id).toBe("vid_edit_file");
    expect(extension.request_id).toBe("vid_extend_file");
    expect(calls).toEqual([
      {
        url: "https://api.x.ai/v1/videos/edits",
        method: "POST",
        body: {
          model: "grok-imagine-video",
          prompt: "Add rain and a moody atmosphere",
          video: { file_id: "file_source_video" },
          storage_options: { filename: "rainy-city.mp4" },
        },
      },
      {
        url: "https://api.x.ai/v1/videos/extensions",
        method: "POST",
        body: {
          model: "grok-imagine-video",
          prompt: "Continue through the city",
          video: { file_id: "file_rainy_city" },
          duration: 5,
          storage_options: {
            filename: "rainy-city-extended.mp4",
            public_url: false,
          },
        },
      },
    ]);
  });
});

describe("xai Grok Imagine Video 1.5 image-to-video helper", () => {
  it("submits a fixed-model image-to-video request and polls to completion", async () => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_123" },
      { status: "pending", progress: 40 },
      {
        status: "done",
        progress: 100,
        video: {
          url: "https://vidgen.x.ai/generated.mp4",
          duration: 12,
          respect_moderation: true,
        },
        usage: { cost_in_usd_ticks: 960000000 },
      },
    ]);
    const provider = createProvider(fetch);
    const req = {
      prompt: "Animate the still image into a slow cinematic dolly shot",
      image: "https://example.com/still.png",
      duration: 12 as const,
      resolution: "720p" as const,
      pollIntervalMs: 0,
      maxPolls: 3,
    };

    const result = await provider.post.v1.videos.generations.imageToVideo(
      req,
      mintXaiOtp(DOT_PATH, req)
    );

    expect(result).toMatchObject({
      request_id: "vid_req_123",
      status: "done",
      model: MODEL,
      video: { url: "https://vidgen.x.ai/generated.mp4" },
      usage: { cost_in_usd_ticks: 960000000 },
    });
    expect(calls).toHaveLength(3);
    expect(calls[0]).toMatchObject({
      url: "https://api.x.ai/v1/videos/generations",
      method: "POST",
      body: {
        prompt: req.prompt,
        model: MODEL,
        image: { url: req.image },
        duration: 12,
        resolution: "720p",
      },
    });
    expect(calls[1]).toMatchObject({
      url: "https://api.x.ai/v1/videos/vid_req_123",
      method: "GET",
    });
    expect(calls[2]).toMatchObject({
      url: "https://api.x.ai/v1/videos/vid_req_123",
      method: "GET",
    });
  });

  it("chains stored image input into a persisted video output", async () => {
    const fileOutput = {
      file_id: "file_video_123",
      filename: "city-loop.mp4",
      public_url: "https://files-cdn.x.ai/city-loop.mp4",
    };
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_file_chain" },
      {
        status: "done",
        progress: 100,
        video: {
          url: "https://vidgen.x.ai/city-loop.mp4",
          duration: 5,
          respect_moderation: true,
          file_output: fileOutput,
        },
      },
    ]);
    const provider = createProvider(fetch);
    const req = {
      prompt: "A camera pulls back through the city",
      image_file_id: "file_city_neon",
      duration: 5 as const,
      storage_options: {
        filename: "city-loop.mp4",
        public_url: true,
      },
      pollIntervalMs: 0,
      maxPolls: 1,
    };

    const result = await provider.post.v1.videos.generations.imageToVideo(
      req,
      mintXaiOtp(DOT_PATH, req)
    );

    expect(result.video.file_output?.file_id).toBe("file_video_123");
    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({
      url: "https://api.x.ai/v1/videos/generations",
      method: "POST",
      body: {
        prompt: req.prompt,
        model: MODEL,
        image: { file_id: "file_city_neon" },
        duration: 5,
        storage_options: {
          filename: "city-loop.mp4",
          public_url: true,
        },
      },
    });
  });

  // The image is always pinned, so the prompt is optional.
  it("submits without a prompt and sends no prompt key", async () => {
    const { calls, fetch } = createQueuedFetch([
      { request_id: "vid_req_no_prompt" },
      {
        status: "done",
        progress: 100,
        video: {
          url: "https://vidgen.x.ai/still.mp4",
          duration: 8,
          respect_moderation: true,
        },
      },
    ]);
    const provider = createProvider(fetch);
    const req = {
      image: "https://example.com/still.png",
      pollIntervalMs: 0,
      maxPolls: 1,
    };

    expect(
      provider.post.v1.videos.generations.imageToVideo.schema.safeParse(req)
        .success
    ).toBe(true);
    await provider.post.v1.videos.generations.imageToVideo(
      req,
      mintXaiOtp(DOT_PATH, req)
    );

    expect(calls[0]?.body).toEqual({
      model: MODEL,
      image: { url: req.image },
    });
  });

  it("validates URL, data URI, and file_id image inputs", () => {
    const provider = createXai({ apiKey: "sk-test" });
    const schema = provider.post.v1.videos.generations.imageToVideo.schema;

    expect(
      schema.safeParse({
        prompt: "Animate it",
        image: "https://example.com/still.png",
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        prompt: "Animate it",
        image: "data:image/jpeg;base64,AAAA",
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        prompt: "Animate it",
        image: { file_id: "file_abc123" },
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        prompt: "Animate it",
        image_file_id: "file_abc123",
        storage_options: { filename: "animated.mp4" },
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        prompt: "Animate it",
        image: {},
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        prompt: "Animate it",
        image: "https://example.com/still.png",
        model: "grok-imagine-video",
      }).success
    ).toBe(false);
  });

  it.each(["failed", "expired"] as const)(
    "throws XaiError when polling returns %s",
    async (status) => {
      const { fetch } = createQueuedFetch([
        { request_id: `vid_req_${status}` },
        { status, progress: 100 },
      ]);
      const provider = createProvider(fetch);
      const req = {
        prompt: "Animate it",
        image: { file_id: "file_abc123" },
        pollIntervalMs: 0,
        maxPolls: 1,
      };

      await expect(
        provider.post.v1.videos.generations.imageToVideo(
          req,
          mintXaiOtp(DOT_PATH, req)
        )
      ).rejects.toMatchObject({
        name: "XaiError",
        status: 500,
        body: expect.objectContaining({
          request_id: `vid_req_${status}`,
          status,
        }),
      } satisfies Partial<XaiError>);
    }
  );
});
