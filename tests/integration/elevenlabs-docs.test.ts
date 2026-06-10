import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

describe("elevenlabs docs", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/docs");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("returns Mintlify redirect metadata", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const redirect = await provider.docs();

    expect(redirect.status).toBe(301);
    expect(redirect.location).toBe(
      "https://elevenlabs.io/docs/api-reference/text-to-speech"
    );
    expect(provider.get.docs).toBe(provider.docs);
  });
});
