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
  type FalBytedanceSeedance2p5DraftCompleteRequest,
  type FalBytedanceSeedance2p5DraftCompleteRequestInput,
  type FalBytedanceSeedance2p5DraftCompleteParsedRequest,
  type FalBytedanceSeedance2p5DraftCompleteResponse,
  type FalRunBytedanceSeedance2p5DraftNamespace,
} from "@apicity/fal";
import {
  FalBytedanceSeedance2p5DraftCompleteRequestSchema as schema,
  FAL_ENDPOINT_REQUEST_SCHEMAS,
} from "@apicity/fal/zod";
const endpoint = "bytedance/seedance-2.5/draft/complete";
const payload = {
  draft_id: "draft-123",
} satisfies FalBytedanceSeedance2p5DraftCompleteRequest;
const valid = (extra: Record<string, unknown>) =>
  schema.safeParse({ ...payload, ...extra }).success;

describe("Bytedance Seedance 2.5 draft completion", () => {
  it("exports the owned draft namespace, schema, registry and types", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(Object.keys(p.run.bytedance.seedance2p5.draft)).toEqual([
      "complete",
    ]);
    expect(p.run.bytedance.seedance2p5.draft.complete).toBe(
      p.post.run.bytedance.seedance2p5.draft.complete
    );
    expect(p.run.bytedance.seedance2p5.draft.complete.schema).toBe(schema);
    expect(FAL_ENDPOINT_REQUEST_SCHEMAS[endpoint]).toBe(schema);
    expectTypeOf(
      p.run.bytedance.seedance2p5.draft
    ).toEqualTypeOf<FalRunBytedanceSeedance2p5DraftNamespace>();
    expectTypeOf(p.run.bytedance.seedance2p5.draft.complete)
      .parameter(0)
      .toEqualTypeOf<FalBytedanceSeedance2p5DraftCompleteRequest>();
    expectTypeOf(
      p.run.bytedance.seedance2p5.draft.complete
    ).returns.resolves.toEqualTypeOf<FalBytedanceSeedance2p5DraftCompleteResponse>();
    expectTypeOf<FalBytedanceSeedance2p5DraftCompleteRequestInput>().toEqualTypeOf<
      z.input<typeof schema>
    >();
    expectTypeOf<FalBytedanceSeedance2p5DraftCompleteParsedRequest>().toEqualTypeOf<
      z.output<typeof schema>
    >();
  });
  it("leaves the seedance 2.5 leaves and the us object in place", () => {
    const p = createFal({ apiKey: "test-key" });
    expect(typeof p.run.bytedance.seedance2p5.textToVideo).toBe("function");
    expect(typeof p.run.bytedance.seedance2p5.us.textToVideo).toBe("function");
  });
  it("posts the exact body and returns the documented response", async () => {
    const response: FalBytedanceSeedance2p5DraftCompleteResponse = {
      video: {
        url: "https://example.com/seedance-2p5-draft.mp4",
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
    expect(await p.run.bytedance.seedance2p5.draft.complete(payload)).toEqual(
      response
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe(
      "https://fal.run/bytedance/seedance-2.5/draft/complete"
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual(payload);
    // Output requires video and seed; draft_id is optional and nullable.
    expectTypeOf<{
      video: { url: string };
      seed: number;
    }>().toExtend<FalBytedanceSeedance2p5DraftCompleteResponse>();
    expectTypeOf<{
      video: { url: string };
    }>().not.toExtend<FalBytedanceSeedance2p5DraftCompleteResponse>();
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
    expect(valid({ resolution: "1080p" })).toBe(true);
    for (const resolution of ["720p", "4k", null])
      expect(valid({ resolution })).toBe(false);
  });
  it("takes the three codecs and nothing else", () => {
    for (const codec of ["auto", "H264", "H265"])
      expect(valid({ codec })).toBe(true);
    for (const codec of ["h264", "VP9", "bogus", null])
      expect(valid({ codec })).toBe(false);
  });
  it("leaves the input open, as upstream does not close it", () => {
    expect(valid({ seed: 7 })).toBe(true);
  });
});

describe("Bytedance Seedance 2.5 draft completion pricing", () => {
  // No success is recorded: the cheapest one (4 s at 1080p, about $4.66 by
  // the card) is above the $2.00 ceiling and needs a paid draft generation.
  // The output length comes from the draft, which no request field fixes.
  it("stays dynamically priced because the draft sets the length", () => {
    expect(FAL_DYNAMIC_PRICING_ENDPOINTS as readonly string[]).toContain(
      endpoint
    );
    expect(pricing[endpoint]).toBeUndefined();
    expect(Object.keys(MODEL_SLUGS.fal)).not.toContain(endpoint);
    expect(Object.keys(MODEL_DISPLAY.fal)).not.toContain(endpoint);
    expect(computeEstimate({ provider: "fal", endpoint, payload }).usd).toBe(0);
  });
});
