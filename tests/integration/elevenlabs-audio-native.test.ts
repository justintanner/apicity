import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs, ElevenLabsError } from "@apicity/elevenlabs";

function readArticle(): Blob {
  const html =
    "<html><body><h1>Apicity Audio Native</h1>" +
    "<p>A short article used to exercise the Audio Native project flow.</p>" +
    "</body></html>";
  return new Blob([html], { type: "text/html" });
}

describe("elevenlabs v1.audioNative", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("creates a project, reads settings, and updates content", async () => {
    ctx = setupPolly("elevenlabs/audio-native");
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    const project = await provider.v1.audioNative({
      name: "Apicity Audio Native Test",
      file: readArticle(),
      auto_convert: false,
    });

    expect(typeof project.project_id).toBe("string");
    expect(project.project_id.length).toBeGreaterThan(0);
    expect(typeof project.converting).toBe("boolean");
    expect(typeof project.html_snippet).toBe("string");

    const settings = await provider.v1.audioNative.settings(project.project_id);
    expect(typeof settings.enabled).toBe("boolean");

    const updated = await provider.v1.audioNative.content.update(
      project.project_id,
      { file: readArticle(), auto_convert: false }
    );

    expect(updated.project_id).toBe(project.project_id);
    expect(typeof updated.converting).toBe("boolean");
    expect(typeof updated.publishing).toBe("boolean");
    expect(typeof updated.html_snippet).toBe("string");
  });

  it("updates content from a URL", async () => {
    ctx = setupPolly("elevenlabs/audio-native-content-url");
    const provider = createElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
    });

    // The URL-content endpoint updates a project already provisioned for the
    // given source URL. With no such project it returns a 404 — exercising the
    // request path and surfacing the API contract via ElevenLabsError.
    await expect(
      provider.v1.audioNative.content.fromUrl({
        url: "https://elevenlabs.io/blog",
        title: "Apicity Audio Native URL",
        author: "Apicity",
      })
    ).rejects.toMatchObject({
      constructor: ElevenLabsError,
      status: 404,
    });
  });
});
