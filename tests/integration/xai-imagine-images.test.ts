import { describe, expect, it } from "vitest";
import {
  createXai,
  type XaiImageEditRequest,
  type XaiImageGenerateRequest,
} from "@apicity/xai";

import { TEST_PAYGATE_SECRET, mintXaiOtp } from "../harness";

const MODEL = "grok-imagine-image-quality";
const GENERATIONS_DOT_PATH = "v1.images.generations";
const EDITS_DOT_PATH = "v1.images.edits";

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

describe("xai Grok Imagine image generation and edits", () => {
  it("submits a generation payload and preserves url response metadata", async () => {
    const fileOutput = {
      file_id: "file_img_123",
      filename: "apple.jpeg",
      expires_at: "2026-06-13T00:00:00Z",
      public_url: "https://files.x.ai/apple.jpeg",
      public_url_error: null,
      public_url_expires_at: "2026-06-13T01:00:00Z",
    };
    const { calls, fetch } = createQueuedFetch([
      {
        data: [
          {
            url: "https://imgen.x.ai/apple.jpeg",
            mime_type: "image/jpeg",
            revised_prompt: "A simple red apple on a white background.",
            file_output: fileOutput,
          },
        ],
        usage: { cost_in_usd_ticks: 200000000 },
      },
    ]);
    const provider = createXai({
      apiKey: "sk-test",
      fetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const req = {
      model: MODEL,
      prompt: "A simple red apple on a white background",
      n: 2,
      aspect_ratio: "16:9",
      resolution: "2k",
      response_format: "url",
      storage_options: { filename: "apple.jpeg", public_url: true },
      user: "user-123",
    } satisfies XaiImageGenerateRequest;

    const result = await provider.post.v1.images.generations(
      req,
      mintXaiOtp(GENERATIONS_DOT_PATH, req)
    );

    expect(calls).toEqual([
      {
        url: "https://api.x.ai/v1/images/generations",
        method: "POST",
        body: req,
      },
    ]);
    expect(result.data[0]).toMatchObject({
      url: "https://imgen.x.ai/apple.jpeg",
      mime_type: "image/jpeg",
      file_output: fileOutput,
    });
    expect(result.usage?.cost_in_usd_ticks).toBe(200000000);
  });

  it("submits a single-image edit payload and preserves b64/storage errors", async () => {
    const storageError = {
      code: "storage_unavailable",
      message: "Could not persist generated image",
    };
    const { calls, fetch } = createQueuedFetch([
      {
        data: [
          {
            b64_json: "aW1hZ2UtYnl0ZXM=",
            mime_type: "image/png",
            storage_error: storageError,
          },
        ],
        usage: { cost_in_usd_ticks: 220000000 },
      },
    ]);
    const provider = createXai({
      apiKey: "sk-test",
      fetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const req = {
      model: MODEL,
      prompt: "Render this as a pencil sketch with detailed shading",
      image: {
        image_url: "data:image/png;base64,aW1hZ2U=",
        type: "image_url",
      },
      resolution: "1k",
      response_format: "b64_json",
      storage_options: { filename: "sketch.png", public_url: false },
      user: "user-456",
    } satisfies XaiImageEditRequest;

    const result = await provider.post.v1.images.edits(
      req,
      mintXaiOtp(EDITS_DOT_PATH, req)
    );

    expect(calls).toEqual([
      {
        url: "https://api.x.ai/v1/images/edits",
        method: "POST",
        body: {
          ...req,
          image: {
            url: "data:image/png;base64,aW1hZ2U=",
            type: "image_url",
          },
        },
      },
    ]);
    expect(result.data[0]).toMatchObject({
      b64_json: "aW1hZ2UtYnl0ZXM=",
      mime_type: "image/png",
      storage_error: storageError,
    });
    expect(result.usage?.cost_in_usd_ticks).toBe(220000000);
  });

  it("submits multi-reference edit payloads with image_url aliases normalized", async () => {
    const { calls, fetch } = createQueuedFetch([
      {
        data: [
          { url: "https://imgen.x.ai/merged-1.jpeg" },
          { url: "https://imgen.x.ai/merged-2.jpeg" },
        ],
      },
    ]);
    const provider = createXai({
      apiKey: "sk-test",
      fetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const req = {
      model: MODEL,
      prompt: "Combine these references into one scene",
      images: [
        {
          url: "https://docs.x.ai/assets/api-examples/images/a.png",
          type: "image_url",
        },
        { image_url: "data:image/jpeg;base64,cmVm" },
        { file_id: "file_ref_123" },
      ],
      n: 2,
      aspect_ratio: "3:2",
    } satisfies XaiImageEditRequest;

    const result = await provider.post.v1.images.edits(
      req,
      mintXaiOtp(EDITS_DOT_PATH, req)
    );

    expect(calls).toEqual([
      {
        url: "https://api.x.ai/v1/images/edits",
        method: "POST",
        body: {
          ...req,
          images: [
            {
              url: "https://docs.x.ai/assets/api-examples/images/a.png",
              type: "image_url",
            },
            { url: "data:image/jpeg;base64,cmVm" },
            { file_id: "file_ref_123" },
          ],
        },
      },
    ]);
    expect(result.data).toHaveLength(2);
  });

  it("normalizes stored file IDs for iterative image edits", async () => {
    const fileOutput = {
      file_id: "file_city_neon",
      filename: "city-neon.jpg",
    };
    const { calls, fetch } = createQueuedFetch([
      {
        data: [
          {
            url: "https://imgen.x.ai/city-neon.jpg",
            file_output: fileOutput,
          },
        ],
      },
    ]);
    const provider = createXai({
      apiKey: "sk-test",
      fetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const req = {
      model: MODEL,
      prompt: "Add neon signs to the buildings",
      image_file_id: "file_city",
      storage_options: { filename: "city-neon.jpg" },
    } satisfies XaiImageEditRequest;

    const result = await provider.post.v1.images.edits(
      req,
      mintXaiOtp(EDITS_DOT_PATH, req)
    );

    expect(calls).toEqual([
      {
        url: "https://api.x.ai/v1/images/edits",
        method: "POST",
        body: {
          model: MODEL,
          prompt: "Add neon signs to the buildings",
          image: { file_id: "file_city" },
          storage_options: { filename: "city-neon.jpg" },
        },
      },
    ]);
    expect(result.data[0].file_output?.file_id).toBe("file_city_neon");
  });

  it("validates image request enums and edit image requirements", () => {
    const provider = createXai({ apiKey: "sk-test" });

    expect(
      provider.post.v1.images.generations.schema.safeParse({
        model: MODEL,
        prompt: "A city skyline",
        aspect_ratio: "auto",
        resolution: "2k",
        response_format: "b64_json",
        storage_options: { filename: "city.jpg", public_url: true },
        user: "user-789",
      }).success
    ).toBe(true);

    expect(
      provider.post.v1.images.generations.schema.safeParse({
        prompt: "A city skyline",
        aspect_ratio: "5:4",
      }).success
    ).toBe(false);
    expect(
      provider.post.v1.images.generations.schema.safeParse({
        prompt: "A city skyline",
        resolution: "4k",
      }).success
    ).toBe(false);
    expect(
      provider.post.v1.images.generations.schema.safeParse({
        prompt: "A city skyline",
        response_format: "jpeg",
      }).success
    ).toBe(false);
    expect(
      provider.post.v1.images.edits.schema.safeParse({
        model: MODEL,
        prompt: "Add a hat",
      }).success
    ).toBe(false);
    expect(
      provider.post.v1.images.edits.schema.safeParse({
        model: MODEL,
        prompt: "Add a hat",
        image: {},
      }).success
    ).toBe(false);
    expect(
      provider.post.v1.images.edits.schema.safeParse({
        model: MODEL,
        prompt: "Combine references",
        images: [
          { url: "https://example.com/1.png" },
          { image_url: "data:image/png;base64,AA==" },
          { file_id: "file_ref_123" },
          { url: "https://example.com/4.png" },
        ],
      }).success
    ).toBe(false);
  });
});
