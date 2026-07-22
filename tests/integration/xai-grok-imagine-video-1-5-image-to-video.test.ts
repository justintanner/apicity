import { describe, expect, it } from "vitest";
import { createXai, XaiError } from "@apicity/xai";

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
      mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req) as unknown as AbortSignal
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
      mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req) as unknown as AbortSignal
    );

    expect(result.request_id).toBe("vid_req_explicit");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      url: "https://api.x.ai/v1/videos/generations",
      method: "POST",
      body: req,
    });
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
      image_file_id: "file_city_neon",
      reference_image_file_ids: ["file_sign", "file_street"],
      storage_options: {
        filename: "city-loop.mp4",
        public_url: { expires_after: 86400 },
      },
    };

    const result = await provider.post.v1.videos.generations(
      req,
      mintXaiOtp(VIDEO_GENERATIONS_DOT_PATH, req) as unknown as AbortSignal
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
        image: { file_id: "file_city_neon" },
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
      mintXaiOtp(VIDEO_EDITS_DOT_PATH, editReq) as unknown as AbortSignal
    );
    const extension = await provider.post.v1.videos.extensions(
      extendReq,
      mintXaiOtp(VIDEO_EXTENSIONS_DOT_PATH, extendReq) as unknown as AbortSignal
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
      mintXaiOtp(DOT_PATH, req) as unknown as AbortSignal
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
      mintXaiOtp(DOT_PATH, req) as unknown as AbortSignal
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
          mintXaiOtp(DOT_PATH, req) as unknown as AbortSignal
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
