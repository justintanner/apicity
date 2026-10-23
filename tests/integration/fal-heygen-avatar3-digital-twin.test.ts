import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createFal,
  type FalHeygenAvatar3DigitalTwinRequest,
} from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal HeyGen Avatar 3 digital twin", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/heygen-avatar3-digital-twin");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("has a stock avatar speak the house prompt at 360p", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const input = {
      character: { avatar: "Abigail Office Front" },
      voice: {
        prompt: "A red panda waves once, then holds still.",
        voice: "Ivy",
      },
      resolution: "360p",
    } satisfies FalHeygenAvatar3DigitalTwinRequest;
    expect(
      provider.run.heygen.avatar3.digitalTwin.schema.safeParse(input).success
    ).toBe(true);
    const result = await provider.run.heygen.avatar3.digitalTwin(input);
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
