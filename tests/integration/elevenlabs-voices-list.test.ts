import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs } from "@apicity/elevenlabs";

describe("elevenlabs v1.voices.list", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/voices-list");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("lists v1 voices and reads the default voice settings", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    // GET /v1/voices is exposed as the `list` child of the voices namespace
    // (the callable itself fetches a single voice by id).
    expect(typeof provider.v1.voices.list).toBe("function");
    expect(provider.get.v1.voices.list).toBe(provider.v1.voices.list);

    const listed = await provider.v1.voices.list();
    expect(Array.isArray(listed.voices)).toBe(true);
    expect(listed.voices.length).toBeGreaterThan(0);
    expect(typeof listed.voices[0].voice_id).toBe("string");

    // GET /v1/voices/settings/default — account-wide default voice settings.
    expect(provider.get.v1.voices.settings.default).toBe(
      provider.v1.voices.settings.default
    );
    const defaults = await provider.v1.voices.settings.default();
    expect(typeof defaults).toBe("object");
    expect(defaults).not.toBeNull();
  });
});
