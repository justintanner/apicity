import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

// Verifies the SDK's response shape for the Runway record-detail poll against
// the live API on the error path, using a deterministic bogus taskId so the
// recording is stable across runs (no paid generation required).
describe("kie runway record-detail (not found)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/runway/record-detail-not-found");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns the kie envelope when the taskId does not exist", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.get.api.v1.runway.recordDetail(
      "apicity-test-nonexistent-task-id-do-not-record-real"
    );

    // Kie returns its envelope shape; the response validates against the
    // published record-detail schema regardless of the not-found outcome.
    expect(typeof result.code).toBe("number");
    expect(typeof result.msg).toBe("string");
    const parsed =
      provider.get.api.v1.runway.recordDetail.responseSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });
});
