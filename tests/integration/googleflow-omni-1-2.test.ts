import { afterEach, describe, expect, it } from "vitest";
import {
  createGoogleFlow,
  GoogleFlowError,
  GoogleFlowVideosResponseSchema,
} from "@apicity/googleflow";
import {
  setupPollyWithPersistScrubber,
  teardownPolly,
  type PersistedHarRecording,
  type PollyContext,
} from "../harness";

const SCRUBBED_EMAIL_HEX = "6163636f756e74406578616d706c652e636f6d";

function scrubFlowResponse(recording: PersistedHarRecording): void {
  const content = recording.response?.content;
  if (content?.text) {
    content.text = content.text
      .replace(/[\w.+-]+@[\w.-]+\.[a-zA-Z]+/g, "account@example.com")
      .replace(/-email:[0-9a-f]{12,}-/g, `-email:${SCRUBBED_EMAIL_HEX}-`)
      .replace(/-u\d+-/g, "-u00000-")
      .replace(/user:\d+/g, "user:00000");
  }
}

describe("googleflow omni-flash-1.2 integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("generates a minimal 3s 360p text-to-video clip with omni-flash-1.2", async () => {
    ctx = setupPollyWithPersistScrubber(
      "google-flow/omni-1-2-t2v",
      scrubFlowResponse
    );

    const provider = createGoogleFlow({
      apiKey: process.env.GOOGLE_FLOW_API_KEY ?? "replay-key",
      timeout: 900000,
    });

    const req = {
      prompt: "A red paper boat drifts slowly across a still pond.",
      model: "omni-flash-1.2" as const,
      duration: 3,
      resolution: "360p" as const,
    };

    expect(provider.post.v1.videos.schema.safeParse(req).success).toBe(true);

    const result = await provider.post.v1.videos(req);
    const parsed = GoogleFlowVideosResponseSchema.safeParse(result);
    expect(parsed.success).toBe(true);
    expect(typeof result.jobId).toBe("string");
    expect(Array.isArray(result.media)).toBe(true);
    const media = result.media as Array<{
      mediaGenerationId: string;
      videoUrl?: string;
    }>;
    expect(media.length).toBeGreaterThan(0);
    expect(typeof media[0]?.mediaGenerationId).toBe("string");
    expect(typeof media[0]?.videoUrl).toBe("string");
  }, 900000);

  it("returns 404 when reading a nonexistent account", async () => {
    ctx = setupPollyWithPersistScrubber(
      "google-flow/omni-1-2-not-found",
      scrubFlowResponse
    );

    const provider = createGoogleFlow({
      apiKey: process.env.GOOGLE_FLOW_API_KEY ?? "replay-key",
    });

    let caught: unknown;
    try {
      await provider.get.v1.accounts.retrieve({
        email: "nonexistent@example.com",
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(GoogleFlowError);
    expect((caught as GoogleFlowError).status).toBe(404);
  });
});
