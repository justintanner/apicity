import { describe, it, expect, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createElevenLabs, ElevenLabsError } from "@apicity/elevenlabs";

describe("elevenlabs v1.studio", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  // Studio is a premium API gated behind an account whitelist; on a standard
  // account every endpoint returns 403 `invalid_subscription`. This test pins
  // the wiring of the whole `v1.studio` surface and exercises each request
  // style (multipart POST, JSON POST, GET, and nested GET with path params),
  // asserting the gated error is surfaced as an ElevenLabsError.
  it(
    "wires the Studio surface and surfaces the whitelist gate",
    { timeout: 600_000 },
    async () => {
      ctx = setupPolly("elevenlabs/studio");

      const provider = createElevenLabs({
        apiKey: process.env.ELEVENLABS_API_KEY ?? "elevenlabs-test-key",
      });

      const studio = provider.v1.studio;

      // The full Studio surface is exposed under `v1.studio`.
      expect(typeof studio.podcasts.create).toBe("function");
      expect(typeof studio.projects.list).toBe("function");
      expect(typeof studio.projects.create).toBe("function");
      expect(typeof studio.projects.get).toBe("function");
      expect(typeof studio.projects.update).toBe("function");
      expect(typeof studio.projects.delete).toBe("function");
      expect(typeof studio.projects.convert).toBe("function");
      expect(typeof studio.projects.content.update).toBe("function");
      expect(typeof studio.projects.mutedTracks.get).toBe("function");
      expect(typeof studio.projects.pronunciationDictionaries.create).toBe(
        "function"
      );
      expect(typeof studio.projects.snapshots.list).toBe("function");
      expect(typeof studio.projects.snapshots.get).toBe("function");
      expect(typeof studio.projects.snapshots.stream).toBe("function");
      expect(typeof studio.projects.snapshots.archive).toBe("function");
      expect(typeof studio.projects.chapters.list).toBe("function");
      expect(typeof studio.projects.chapters.create).toBe("function");
      expect(typeof studio.projects.chapters.get).toBe("function");
      expect(typeof studio.projects.chapters.update).toBe("function");
      expect(typeof studio.projects.chapters.delete).toBe("function");
      expect(typeof studio.projects.chapters.convert).toBe("function");
      expect(typeof studio.projects.chapters.snapshots.list).toBe("function");
      expect(typeof studio.projects.chapters.snapshots.get).toBe("function");
      expect(typeof studio.projects.chapters.snapshots.stream).toBe("function");

      const expectGated = async (fn: () => Promise<unknown>): Promise<void> => {
        await expect(fn()).rejects.toBeInstanceOf(ElevenLabsError);
      };

      // multipart/form-data POST
      await expectGated(() =>
        provider.v1.studio.projects.create({ name: "apicity-studio-test" })
      );

      // GET with no query params
      await expectGated(() => provider.v1.studio.projects.list());

      // GET with a path param + optional query
      await expectGated(() =>
        provider.v1.studio.projects.get("apicity-fake-project")
      );

      // nested GET with two path segments
      await expectGated(() =>
        provider.v1.studio.projects.chapters.list("apicity-fake-project")
      );

      // application/json POST
      await expectGated(() =>
        provider.v1.studio.podcasts.create({
          model_id: "eleven_multilingual_v2",
          mode: {
            type: "bulletin",
            bulletin: { host_voice_id: "apicity-fake-voice" },
          },
          source: { type: "text", text: "Hello from apicity." },
        })
      );

      // Confirm the surfaced error carries the upstream 403 status.
      try {
        await provider.v1.studio.projects.list();
        throw new Error("expected the Studio gate to reject");
      } catch (err) {
        expect(err).toBeInstanceOf(ElevenLabsError);
        expect((err as ElevenLabsError).status).toBe(403);
      }
    }
  );
});
