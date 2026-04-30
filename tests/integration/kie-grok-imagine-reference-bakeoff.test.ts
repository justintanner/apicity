import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { kie } from "@apicity/kie";

// Reference-video bake-off: Grok Imagine half of the pair.
// Companion to kie-wan-27-r2v-reference-bakeoff.test.ts. Both tests use the
// same four fixtures (cat1, cat2, man, beach) and the same scene ("the cat
// climbs onto the man's lap on the beach"). This test uses xAI's @ImageN
// reference syntax (see fal-xai-grok-imagine-video-reference-to-video.test.ts
// for the syntax precedent). The two recordings are rendered side-by-side via
// `pnpm run harness:compare`.

const PROMPT = `@Image1 and @Image2 show the same white cat with mismatched yellow and blue eyes.
@Image3 is a man wearing a blue suit and blue tie.
@Image4 is a sandy beach with the ocean behind it.

In the scene, @Image3 sits cross-legged on the sand in the setting from @Image4. @Image1 climbs onto @Image3's lap, purrs, and lifts a paw to bat playfully at his blue tie. @Image3 smiles and waves at the camera with his free hand.`;

async function uploadFixture(
  provider: ReturnType<typeof kie>,
  filename: string,
  mimeType: string
): Promise<string> {
  const blob = new Blob(
    [readFileSync(resolve(__dirname, "../fixtures", filename))],
    {
      type: mimeType,
    }
  );
  const upload = await provider.post.api.fileStreamUpload({
    file: blob,
    filename,
    uploadPath: "images/test-uploads",
  });
  expect(upload.data?.downloadUrl).toBeTruthy();
  return upload.data!.downloadUrl;
}

describe("kie grok-imagine reference bake-off", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload cat/man/beach references, run grok-imagine/image-to-video with @ImageN syntax, and poll to completion",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/grok-imagine-reference-bakeoff");

      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const cat1Url = await uploadFixture(provider, "cat1.jpg", "image/jpeg");
      const cat2Url = await uploadFixture(provider, "cat2.jpg", "image/jpeg");
      const manUrl = await uploadFixture(provider, "man.jpg", "image/jpeg");
      const beachUrl = await uploadFixture(provider, "beach.png", "image/png");

      const task = await provider.post.api.v1.jobs.createTask({
        model: "grok-imagine/image-to-video",
        input: {
          prompt: PROMPT,
          image_urls: [cat1Url, cat2Url, manUrl, beachUrl],
          duration: "6",
          resolution: "480p",
          aspect_ratio: "16:9",
          mode: "fun",
          nsfw_checker: false,
        },
      });

      expect(task.code).toBe(200);
      expect(task.data?.taskId).toBeTruthy();

      const taskId = task.data!.taskId!;
      const pollDelay = getPollyMode() === "replay" ? 0 : 10_000;
      let state = "waiting";
      let resultJson: string | undefined;

      for (let i = 0; i < 200; i++) {
        const info = await provider.get.api.v1.jobs.recordInfo(taskId);
        state = info.data?.state ?? "waiting";
        if (state === "success" || state === "fail") {
          expect(info.data?.taskId).toBe(taskId);
          resultJson = info.data?.resultJson;
          break;
        }
        if (pollDelay) await new Promise((r) => setTimeout(r, pollDelay));
      }

      expect(state).toBe("success");
      expect(resultJson).toBeTruthy();

      const result = JSON.parse(resultJson!) as { resultUrls?: string[] };
      expect(result.resultUrls).toBeInstanceOf(Array);
      expect(result.resultUrls!.length).toBeGreaterThan(0);
      expect(result.resultUrls![0]).toMatch(/^https?:\/\//);
    }
  );
});
