import { afterEach, describe, expect, it } from "vitest";
import { createElevenLabs } from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

const recordingName = "elevenlabs/dubbing-resource-get";
const closedBetaResourceId = "apicity-test-dubbing-resource-closed-beta";

describe("elevenlabs v1.dubbing.resource", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("surfaces the live closed-beta response for resource access", async () => {
    ctx = setupPolly(recordingName);

    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    await expect(
      provider.v1.dubbing.resource.get(closedBetaResourceId)
    ).rejects.toMatchObject({
      status: 400,
    });
  });

  it("exposes the resource get method", () => {
    const provider = createElevenLabs({ apiKey: "elevenlabs-test-key" });

    expect(typeof provider.v1.dubbing.resource.get).toBe("function");
  });
});
