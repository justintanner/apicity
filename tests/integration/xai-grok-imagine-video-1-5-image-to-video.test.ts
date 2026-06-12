import { describe, expect, it } from "vitest";
import { createXai, XaiError } from "@apicity/xai";

import { TEST_PAYGATE_SECRET, mintXaiOtp } from "../harness";

const MODEL = "grok-imagine-video-1.5-preview";
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
      duration: 12,
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
