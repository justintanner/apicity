import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createFal } from "@apicity/fal";
import {
  getPollyMode,
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

function fixtureDataUrl(name: string, mime: string): string {
  return `data:${mime};base64,${readFileSync(new URL(`../fixtures/${name}`, import.meta.url)).toString("base64")}`;
}

// fal.run answers only once the video is ready. On 2026-10-15 a call with
// this payload queued for 147 s and ran for 261 s, past the 300 s headers
// timeout of Node's built-in fetch, and the aborted call still billed. When
// recording, the provider therefore gets a fetch whose dispatcher waits as
// long as the test does; replay never reaches the network.
function patientFetch(timeoutMs: number): typeof fetch {
  // Node's bundled undici keeps its global Agent under this symbol.
  const globalAgent = (globalThis as unknown as Record<symbol, object>)[
    Symbol.for("undici.globalDispatcher.1")
  ];
  const Agent = globalAgent.constructor as new (options: {
    headersTimeout: number;
    bodyTimeout: number;
  }) => object;
  const dispatcher = new Agent({
    headersTimeout: timeoutMs,
    bodyTimeout: timeoutMs,
  });
  return (input, init) =>
    globalThis.fetch(input, { ...init, dispatcher } as RequestInit);
}

describe("fal Vidu Q4 reference-to-video", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/vidu-q4-reference-to-video");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("places the cat2.jpg cat on the beach.png beach for three seconds at 540p", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
      ...(getPollyMode() === "replay" ? {} : { fetch: patientFetch(900000) }),
    });
    // Reuse the owned fixtures and prompt from kie-vidu-q4-reference-to-video,
    // with fal's [@reference_image_N] tokens for "reference image N".
    const result = await provider.run.vidu.q4.referenceToVideo({
      prompt:
        "In the scene of [@reference_image_1], the white cat from [@reference_image_2] sits on the wet sand, blinks, and turns its head toward the waves.",
      reference_image_urls: [
        fixtureDataUrl("beach.png", "image/png"),
        fixtureDataUrl("cat2.jpg", "image/jpeg"),
      ],
      duration: 3,
      resolution: "540p",
      audio: false,
    });
    expect(result.video.url).toMatch(/^https:\/\//);
    expect(typeof result.seed).toBe("number");
    if (result.cover_image != null) {
      expect(result.cover_image.url).toMatch(/^https:\/\//);
    }
  }, 900000);
});
