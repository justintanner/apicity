import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createFal, FalError } from "@apicity/fal";

// Error-path recording: fal's free validator 422 for an empty draft_id. A
// success recording needs a US draft and its 1080p completion (about 5.54
// USD), which waits for a separate approval (ac-jjngde).
describe("fal bytedance seedance2p5 us draft complete integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/bytedance-seedance2p5-us-draft-complete");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should reject an empty draft_id with a validator 422", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const err = await provider.run.bytedance.seedance2p5.us.draft
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
