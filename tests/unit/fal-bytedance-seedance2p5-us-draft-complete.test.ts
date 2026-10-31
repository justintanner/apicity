import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  fal as pricing,
} from "../../packages/provider/cost/src/pricing/fal";
import {
  MODEL_SLUGS,
  MODEL_DISPLAY,
} from "../../packages/provider/cost/src/slugs";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";
import {
  createFal,
  type FalBytedanceSeedance2p5UsDraftCompleteRequest,
  type FalBytedanceSeedance2p5UsDraftCompleteRequestInput,
  type FalBytedanceSeedance2p5UsDraftCompleteParsedRequest,
  type FalBytedanceSeedance2p5UsDraftCompleteResponse,
  type FalRunBytedanceSeedance2p5UsDraftNamespace,
} from "@apicity/fal";
import {
  FalBytedanceSeedance2p5UsDraftCompleteRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
const endpoint = "bytedance/seedance-2.5/us/draft/complete";
const payload = {
  draft_id: "draft-123",
} satisfies FalBytedanceSeedance2p5UsDraftCompleteRequest;
const valid = (extra: Record<string, unknown>) =>
  schema.safeParse({ ...payload, ...extra }).success;

describe("Bytedance Seedance 2.5 US draft completion", () => {
  it("exports the owned US draft namespace, schema, registry and types", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(Object.keys(p.run.bytedance.seedance2p5.us.draft)).toEqual([
      "complete",
    ]);
    expect(p.run.bytedance.seedance2p5.us.draft.complete).toBe(
      p.post.run.bytedance.seedance2p5.us.draft.complete
    );
    expect(p.run.bytedance.seedance2p5.us.draft.complete.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      p.run.bytedance.seedance2p5.us.draft
    ).toEqualTypeOf<FalRunBytedanceSeedance2p5UsDraftNamespace>();
    expectTypeOf(p.run.bytedance.seedance2p5.us.draft.complete)
      .parameter(0)
      .toEqualTypeOf<FalBytedanceSeedance2p5UsDraftCompleteRequest>();
    expectTypeOf(
      p.run.bytedance.seedance2p5.us.draft.complete
    ).returns.resolves.toEqualTypeOf<FalBytedanceSeedance2p5UsDraftCompleteResponse>();
    expectTypeOf<FalBytedanceSeedance2p5UsDraftCompleteRequestInput>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalBytedanceSeedance2p5UsDraftCompleteParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("leaves the US leaves and the 2.5 draft object in place", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(Object.keys(p.run.bytedance.seedance2p5.us)).toEqual([
      "textToVideo",
      "imageToVideo",
      "referenceToVideo",
      "draft",
    ]);
    expect(typeof p.run.bytedance.seedance2p5.draft.complete).toBe("function");
    expect(p.run.bytedance.seedance2p5.us.draft.complete).not.toBe(
      p.run.bytedance.seedance2p5.draft.complete
    );
  });
  it("posts the exact body and returns the documented response", async () => {
    const response: FalBytedanceSeedance2p5UsDraftCompleteResponse = {
      video: {
        url: "https://example.com/seedance-2p5-us-draft.mp4",
        content_type: "video/mp4",
        file_name: null,
        file_size: null,
      },
      seed: 42,
      draft_id: null,
    };
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify(response), { status: 200 })
      );
    const p = createFal({
      apiKey: "test-key",
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    expect(
      await p.run.bytedance.seedance2p5.us.draft.complete(payload)
    ).toEqual(response);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe(
      "https://fal.run/bytedance/seedance-2.5/us/draft/complete"
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(payload);
    // Output requires video and seed; draft_id is optional and nullable.
    expectTypeOf<{
      video: { url: string };
      seed: number;
    }>().toExtend<FalBytedanceSeedance2p5UsDraftCompleteResponse>();
    expectTypeOf<{
      video: { url: string };
    }>().not.toExtend<FalBytedanceSeedance2p5UsDraftCompleteResponse>();
  });
  it("requires a draft_id of 1 to 8192 characters", () => {
    expect(schema.safeParse({}).success).toBe(false);
    for (const draft_id of [undefined, null, 7, ""])
      expect(valid({ draft_id })).toBe(false);
    for (const draft_id of ["x", "x".repeat(8192)])
      expect(valid({ draft_id })).toBe(true);
    expect(valid({ draft_id: "x".repeat(8193) })).toBe(false);
  });
  it("defaults resolution to the literal 1080p and codec to auto", () => {
    expect(schema.parse(payload)).toEqual({
      draft_id: payload.draft_id,
      resolution: "1080p",
      codec: "auto",
    });
    for (const resolution of ["720p", "4k", null])
      expect(valid({ resolution })).toBe(false);
    for (const codec of ["auto", "H264", "H265"])
      expect(valid({ codec })).toBe(true);
    for (const codec of ["h264", "VP9", null])
      expect(valid({ codec })).toBe(false);
  });
});

describe("Bytedance Seedance 2.5 US draft completion pricing", () => {
  // No US completion is billed yet. The card repeats the 2.5 completion's
  // figures, so it prices like that completion: 1920 x 1080 x 121 / 1024
  // tokens for a 5 s 16:9 draft at the billed 1080p $0.0234116.
  it("prices the completion from the draft's hinted duration and aspect", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).not.toContain(
      endpoint
    );
    expect(pricing[endpoint]).toBeDefined();
    expect((MODEL_SLUGS.fal as Record<string, string>)[endpoint]).toBe("sd2p5");
    expect((MODEL_DISPLAY.fal as Record<string, string>)[endpoint]).toBe(
      "Seedance 2.5 US"
    );
    const result = computeEstimate({
      provider: "fal",
      endpoint,
      payload,
      costHints: { durationSeconds: 5, aspectRatio: "16:9" },
    });
    expect(result.usd).toBeCloseTo(5.73642729, 10);
    expect(result.breakdown.units).toBeCloseTo(245025, 6);
    expect(result.warnings).toEqual([]);
  });

  it("fails closed without the draft's hints", () => {
    const result = computeEstimate({ provider: "fal", endpoint, payload });
    expect(result.usd).toBe(0);
    expect(result.warnings[0]).toContain("costHints.aspectRatio");
  });
});
