import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

// Verifies the SDK's response shape against the live API for the not-found
// path, using a deterministic bogus taskId so the recording is stable across
// runs (no dependency on a real Flux Kontext generation task).
describe("kie flux-kontext record-info (not found)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/flux-kontext-record-info-not-found");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns the success envelope when the taskId does not exist", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const recordInfo = provider.get.api.v1.flux.kontext.recordInfo;

    const result = await recordInfo(
      "apicity-test-nonexistent-task-id-do-not-record-real"
    );

    expect(typeof result.code).toBe("number");
    expect(typeof result.msg).toBe("string");

    // The response is well-formed against the published schema.
    const parsed = recordInfo.responseSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it("validates the request taskId via schema", () => {
    const provider = createKie({ apiKey: "kie-test-key" });
    const recordInfo = provider.get.api.v1.flux.kontext.recordInfo;

    expect(recordInfo.schema.safeParse({ taskId: "abc123" }).success).toBe(
      true
    );
    // Missing the required taskId.
    expect(recordInfo.schema.safeParse({}).success).toBe(false);
    // Empty taskId is rejected.
    expect(recordInfo.schema.safeParse({ taskId: "" }).success).toBe(false);
  });
});
