import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createFal, FalError } from "@apicity/fal";

// Error-path recording: a successful completion needs a draft_id from a paid
// draft-mode generation and costs about $4.66 or more at 1080p, so this test
// records fal's free validator 422 for an empty draft_id instead.
describe("fal bytedance seedance2p5 draft complete integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/bytedance-seedance2p5-draft-complete");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should reject an empty draft_id with a validator 422", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const err = await provider.run.bytedance.seedance2p5.draft
      .complete({ draft_id: "" })
      .then(
        () => undefined,
        (e: unknown) => e
      );

    expect(err).toBeInstanceOf(FalError);
    expect((err as FalError).status).toBe(422);
    const body = (err as FalError).body as {
      detail?: Array<{ type?: string; loc?: unknown[] }>;
    };
    expect(Array.isArray(body.detail)).toBe(true);
    expect(
      body.detail?.some(
        (d) =>
          d.type === "string_too_short" &&
          Array.isArray(d.loc) &&
          d.loc.includes("draft_id")
      )
    ).toBe(true);
  }, 900000);
});
