import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import {
  createElevenLabs,
  ElevenLabsError,
  type ElevenLabsCreateSpeechEngineRequest,
} from "@apicity/elevenlabs";

const SPEECH_ENGINE_ID = "seng_3701k3ttaq12ewp8b7qv5rfyszkz";

describe("elevenlabs v1.speechEngine", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("elevenlabs/speech-engine");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  function makeProvider() {
    return createElevenLabs({ apiKey: "elevenlabs-invalid-key" });
  }

  async function expectAuthError(promise: Promise<unknown>): Promise<void> {
    try {
      await promise;
      throw new Error("Expected the speech engine request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ElevenLabsError);
      expect([401, 403]).toContain((error as ElevenLabsError).status);
    }
  }

  it("routes every speech engine endpoint", { timeout: 60000 }, async () => {
    const provider = makeProvider();
    const createRequest: ElevenLabsCreateSpeechEngineRequest = {
      name: "Apicity Speech Engine route test",
      speech_engine: {
        ws_url: "wss://example.com/transcript",
        request_headers: {
          authorization: { variable_name: "transcript_auth" },
        },
      },
      language: "en",
      tags: ["apicity"],
    };

    expect(provider.get.v1.speechEngine.list).toBe(
      provider.v1.speechEngine.list
    );
    expect(provider.post.v1.speechEngine.create).toBe(
      provider.v1.speechEngine.create
    );
    expect(provider.get.v1.speechEngine.get).toBe(provider.v1.speechEngine.get);
    expect(provider.patch.v1.speechEngine.update).toBe(
      provider.v1.speechEngine.update
    );
    expect(provider.delete.v1.speechEngine.delete).toBe(
      provider.v1.speechEngine.delete
    );
    expect(
      provider.v1.speechEngine.create.schema.safeParse(createRequest).success
    ).toBe(true);
    expect(
      provider.v1.speechEngine.update.schema.safeParse({ name: "Updated" })
        .success
    ).toBe(true);

    await expectAuthError(
      provider.v1.speechEngine.list({
        page_size: 1,
        search: "apicity",
        sort_direction: "desc",
        sort_by: "created_at",
      })
    );
    await expectAuthError(provider.v1.speechEngine.create(createRequest));
    await expectAuthError(provider.v1.speechEngine.get(SPEECH_ENGINE_ID));
    await expectAuthError(
      provider.v1.speechEngine.update(SPEECH_ENGINE_ID, {
        name: "Updated Speech Engine",
      })
    );
    await expectAuthError(provider.v1.speechEngine.delete(SPEECH_ENGINE_ID));
  });
});
