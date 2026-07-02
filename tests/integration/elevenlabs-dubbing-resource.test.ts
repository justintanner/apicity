import { afterEach, describe, expect, it } from "vitest";
import { createElevenLabs } from "@apicity/elevenlabs";
import {
  getPollyMode,
  recordingExists,
  setupPolly,
  teardownPolly,
  type PollyContext,
} from "../harness";

const recordingName = ["elevenlabs", "dubbing-resource-get"].join("/");

describe("elevenlabs v1.dubbing.resource", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("gets a dubbing studio resource", async () => {
    if (getPollyMode() === "replay" && !recordingExists(recordingName)) {
      return;
    }

    ctx = setupPolly(recordingName);

    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });
    const dubbingId =
      process.env.ELEVENLABS_DUBBING_RESOURCE_ID ?? "dubbing_id";

    const resource = await provider.v1.dubbing.resource.get(dubbingId);

    expect(resource.id).toBe(dubbingId);
    expect(typeof resource.version).toBe("number");
    expect(typeof resource.source_language).toBe("string");
    expect(Array.isArray(resource.target_languages)).toBe(true);
    expect(typeof resource.input.src).toBe("string");
    expect(typeof resource.input.content_type).toBe("string");
    expect(typeof resource.input.bucket_name).toBe("string");
    expect(typeof resource.input.random_path_slug).toBe("string");
    expect(typeof resource.input.duration_secs).toBe("number");
    expect(typeof resource.input.is_audio).toBe("boolean");
    expect(typeof resource.input.url).toBe("string");
    expect(typeof resource.speaker_tracks).toBe("object");
    expect(typeof resource.speaker_segments).toBe("object");
    expect(typeof resource.renders).toBe("object");
  });

  it("exposes the resource get method", () => {
    const provider = createElevenLabs({ apiKey: "elevenlabs-test-key" });

    expect(typeof provider.v1.dubbing.resource.get).toBe("function");
  });
});
