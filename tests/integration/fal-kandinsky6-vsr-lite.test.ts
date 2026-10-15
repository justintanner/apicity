import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createFal } from "@apicity/fal";
import {
  getPollyMode,
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

// fal.run answers only once the video is ready. A call that queues and runs
// past the 300 s headers timeout of Node's built-in fetch is aborted on our
// side but still billed (fal-vidu-q4-reference-to-video, 2026-10-15). When
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

describe("fal Kandinsky 6.0 VSR Lite", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/kandinsky6-vsr-lite");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("upscales seedance-ref.mp4 two times", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
      ...(getPollyMode() === "replay" ? {} : { fetch: patientFetch(900000) }),
    });
    // The committed 720x576 colour-bar clip: both sides are multiples of 16,
    // as 2x upscaling requires.
    const result = await provider.run.kandinsky6Vsr.lite({
      video_url: `data:video/mp4;base64,${readFileSync(new URL("../fixtures/seedance-ref.mp4", import.meta.url)).toString("base64")}`,
      upscale_factor: 2,
    });
    expect(result.video.url).toMatch(/^https:\/\//);
    expect(typeof result.seed).toBe("number");
  }, 900000);
});
