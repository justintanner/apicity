import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createFal } from "@apicity/fal";
import {
  setupPollyIgnoringBody,
  teardownPolly,
  type PollyContext,
} from "../harness";

function fixtureDataUrl(name: string, mime: string): string {
  return `data:${mime};base64,${readFileSync(new URL(`../fixtures/${name}`, import.meta.url)).toString("base64")}`;
}

describe("fal FLUX 3 Action SO-101", () => {
  let ctx: PollyContext;
  beforeEach(() => {
    ctx = setupPollyIgnoringBody("fal/flux-3-action-so101");
  });
  afterEach(async () => {
    await teardownPolly(ctx);
  });
  it("predicts one action chunk from the studio-bg.jpg and cat2.jpg frames", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    // The prompt is the repo's house prompt (fal-ideogram-v4-5 and others).
    // The committed studio-bg.jpg and cat2.jpg fixtures stand in for the
    // scene and wrist cameras, and the state is a neutral arm pose.
    const result = await provider.run.flux3Action.so101({
      prompt: "A red panda waves once, then holds still.",
      scene_image_url: fixtureDataUrl("studio-bg.jpg", "image/jpeg"),
      wrist_image_url: fixtureDataUrl("cat2.jpg", "image/jpeg"),
      state: [0, 90, 90, 0, 0, 50],
    });
    expect(result.actions.length).toBeGreaterThan(0);
    for (const action of result.actions) {
      expect(action).toHaveLength(result.action_labels.length);
      for (const value of action) expect(typeof value).toBe("number");
    }
    expect(result.action_labels.length).toBeGreaterThan(0);
    expect(typeof result.action_hz).toBe("number");
    expect(Number.isInteger(result.execute_steps)).toBe(true);
    expect(Number.isInteger(result.seed)).toBe(true);
    for (const seconds of Object.values(result.timings))
      expect(typeof seconds).toBe("number");
  }, 900000);
});
