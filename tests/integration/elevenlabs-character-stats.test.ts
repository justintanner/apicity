import { afterEach, describe, expect, it } from "vitest";
import { createElevenLabs } from "@apicity/elevenlabs";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

const RECORDING_NAME = "elevenlabs/usage-character-stats";
const REQUEST = {
  start_unix: 1685574000,
  end_unix: 1688165999,
};

describe("elevenlabs character usage stats integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("gets character stats with required unix query parameters", async () => {
    ctx = setupPolly(RECORDING_NAME);

    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const result = await provider.v1.usage.characterStats(REQUEST);

    expect(provider.get.v1.usage.characterStats).toBe(
      provider.v1.usage.characterStats
    );
    expect(Array.isArray(result.time)).toBe(true);
    expect(result.usage).toBeTypeOf("object");
    for (const values of Object.values(result.usage)) {
      expect(Array.isArray(values)).toBe(true);
      expect(values.every((value) => typeof value === "number")).toBe(true);
    }
  });

  it("validates required integer query parameters", () => {
    const provider = createElevenLabs({ apiKey: "elevenlabs-test-key" });
    const schema = provider.v1.usage.characterStats.schema;

    expect(schema.safeParse(REQUEST).success).toBe(true);
    expect(
      schema.safeParse({
        start_unix: REQUEST.start_unix,
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        start_unix: String(REQUEST.start_unix),
        end_unix: REQUEST.end_unix,
      }).success
    ).toBe(false);
  });
});
