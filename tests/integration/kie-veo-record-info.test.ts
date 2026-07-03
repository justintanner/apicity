import { afterEach, describe, expect, it } from "vitest";
import { createKie } from "@apicity/kie";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

const RECORDING_NAME = "kie/veo/record-info-not-found";
const MISSING_TASK_ID =
  "apicity-test-nonexistent-veo-task-id-do-not-record-real";

describe("kie veo record-info", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("returns a live response envelope for a missing Veo task", async () => {
    ctx = setupPolly(RECORDING_NAME);

    const provider = createKie({
      apiKey: process.env.KIE_API_KEY ?? "kie-test-key",
    });
    const recordInfo = provider.veo.get.api.v1.veo.recordInfo;

    const result = await recordInfo(MISSING_TASK_ID);

    expect(typeof result.code).toBe("number");
    expect(typeof result.msg).toBe("string");
    expect(recordInfo.responseSchema.safeParse(result).success).toBe(true);
  });

  it("validates the request taskId via schema", () => {
    const recordInfo = createKie({
      apiKey: "kie-test-key",
    }).veo.get.api.v1.veo.recordInfo;

    expect(recordInfo.schema.safeParse({ taskId: "abc123" }).success).toBe(
      true
    );
    expect(recordInfo.schema.safeParse({}).success).toBe(false);
    expect(recordInfo.schema.safeParse({ taskId: "" }).success).toBe(false);
  });
});
