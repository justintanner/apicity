import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { kie } from "@apicity/kie";

// Verifies the SDK's response shape against the live API for the error path,
// using a deterministic bogus taskId so the recording is stable across runs.
describe("kie suno record-info (not found)", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("kie/suno/record-info-not-found");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns code:200 with data:null when the taskId does not exist", async () => {
    const provider = kie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });

    const result =
      await provider.suno.get.api.v1.generate.recordInfo(
        "apicity-test-nonexistent-task-id-do-not-record-real"
      );

    // Kie returns the success envelope with data:null rather than a 4xx code.
    expect(result.code).toBe(200);
    expect(result.msg).toBe("success");
    expect(result.data).toBeNull();
  });
});
