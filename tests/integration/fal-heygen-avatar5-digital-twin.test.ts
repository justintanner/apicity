import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createFal,
  type FalHeygenAvatar5DigitalTwinRequest,
} from "@apicity/fal";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("fal HeyGen Avatar 5 digital twin", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPolly("fal/heygen-avatar5-digital-twin");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("has the default avatar speak the house prompt at 720p", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const input = {
      prompt: "A red panda waves once, then holds still.",
    } satisfies FalHeygenAvatar5DigitalTwinRequest;
    expect(
      provider.run.heygen.avatar5.digitalTwin.schema.safeParse(input).success
    ).toBe(true);
    const result = await provider.run.heygen.avatar5.digitalTwin(input);
    expect(result.video.url).toMatch(/^https:\/\//);
  }, 900000);
});
