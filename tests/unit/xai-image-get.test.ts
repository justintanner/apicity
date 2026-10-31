import { describe, expect, expectTypeOf, it, vi } from "vitest";

import { createXai } from "../../packages/provider/xai/src/xai";
import type { XaiImageDeferredResult } from "../../packages/provider/xai/src/types";
import { XaiImageGenerateRequestSchema } from "../../packages/provider/xai/src/zod";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("xAI deferred image get", () => {
  it("gets the request id from the inference API, encoded", async () => {
    const body = { request_id: "a/b", status: "pending" };
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse(body, 202));
    const xai = createXai({ apiKey: "xai-test", fetch: mockFetch });

    expect(await xai.get.v1.images("a/b")).toEqual(body);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.x.ai/v1/images/a%2Fb");
    expect(init.method).toBe("GET");
    expect(init.headers).toMatchObject({ Authorization: "Bearer xai-test" });
    expectTypeOf(xai.get.v1.images).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(
      xai.get.v1.images
    ).returns.resolves.toEqualTypeOf<XaiImageDeferredResult>();
  });

  it("returns done and failed generations as bodies", async () => {
    const done: XaiImageDeferredResult = {
      request_id: "r1",
      status: "done",
      data: [{ url: "https://example.com/image.jpg" }],
      usage: { cost_in_usd_ticks: 400000000 },
    };
    const failed: XaiImageDeferredResult = {
      request_id: "r2",
      status: "failed",
      error: { code: "internal_error", message: "generation failed" },
    };
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(done))
      .mockResolvedValueOnce(jsonResponse(failed));
    const xai = createXai({ apiKey: "xai-test", fetch: mockFetch });

    expect(await xai.get.v1.images("r1")).toEqual(done);
    expect(await xai.get.v1.images("r2")).toEqual(failed);
  });

  it("keeps the POST image leaves and takes deferred on generations", () => {
    const xai = createXai({ apiKey: "xai-test" });
    expect(typeof xai.post.v1.images.generations).toBe("function");
    expect(typeof xai.post.v1.images.edits).toBe("function");
    const base = { prompt: "A cat on a windowsill." };
    for (const deferred of [true, false, null])
      expect(
        XaiImageGenerateRequestSchema.safeParse({ ...base, deferred }).success,
        String(deferred)
      ).toBe(true);
    expect(
      XaiImageGenerateRequestSchema.safeParse({ ...base, deferred: "yes" })
        .success
    ).toBe(false);
  });
});
