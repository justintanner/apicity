import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createKie } from "@apicity/kie";

// Verifies the SDK's response shape for the 4o Image record-info poll against
// the live API on the error path, using a deterministic bogus taskId so the
// recording is stable across runs (no paid generation required).
describe("kie 4o image record-info (not found)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/gpt4o-image/record-info-not-found");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns the kie envelope when the taskId does not exist", async () => {
    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result = await provider.get.api.v1.gpt4oImage.recordInfo(
      "apicity-test-nonexistent-task-id-do-not-record-real"
    );

    // Kie returns its success envelope shape; the response validates against
    // the published record-info schema regardless of the not-found outcome.
    expect(typeof result.code).toBe("number");
    expect(typeof result.msg).toBe("string");
    const parsed =
      provider.get.api.v1.gpt4oImage.recordInfo.responseSchema.safeParse(
        result
      );
    expect(parsed.success).toBe(true);
  });
});
