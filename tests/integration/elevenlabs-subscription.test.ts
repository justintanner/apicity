import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

describe("elevenlabs v1.user.subscription", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/user-subscription");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets subscription usage and remaining character balance", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const subscription = await provider.v1.user.subscription();

    expect(typeof subscription.tier).toBe("string");
    expect(subscription.tier.length).toBeGreaterThan(0);
    expect(subscription.character_count).toBeGreaterThanOrEqual(0);
    expect(subscription.character_limit).toBeGreaterThanOrEqual(0);
    expect(subscription.character_count).toBeLessThanOrEqual(
      subscription.character_limit
    );
    expect(subscription.remaining_character_count).toBe(
      Math.max(0, subscription.character_limit - subscription.character_count)
    );
    expect(subscription.remaining_character_count).toBeGreaterThanOrEqual(0);
    expect(
      subscription.character_count + subscription.remaining_character_count
    ).toBe(subscription.character_limit);
    expect(typeof subscription.status).toBe("string");
    expect(subscription.status?.length).toBeGreaterThan(0);
  });
});
