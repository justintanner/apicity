import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs, ElevenLabsError } from "@apicity/elevenlabs";

describe("elevenlabs v1.voices.pvc.verification", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/pvc-manual-verification");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("submits manual verification documents as multipart form data", async () => {
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });
    const verificationFile = new Blob(["apicity verification fixture"], {
      type: "text/plain",
    });

    const parsed = provider.v1.voices.pvc.verification.schema.safeParse({
      files: [verificationFile],
      extra_text: "Manual verification integration coverage.",
    });

    expect(parsed.success).toBe(true);
    expect(provider.post.v1.voices.pvc.verification).toBe(
      provider.v1.voices.pvc.verification
    );

    try {
      await provider.v1.voices.pvc.verification("apicity-invalid-pvc-voice", {
        files: [verificationFile],
        extra_text: "Manual verification integration coverage.",
      });
      throw new Error("Expected invalid PVC voice verification to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ElevenLabsError);
      expect((error as ElevenLabsError).status).toBeGreaterThanOrEqual(400);
    }
  });
});
