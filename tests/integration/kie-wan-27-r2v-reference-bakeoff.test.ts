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

// Reference-video bake-off: Wan 2.7 half of the pair.
// Companion to kie-grok-imagine-reference-bakeoff.test.ts. Both tests use the
// same four fixtures (cat1, cat2, man, beach) and the same scene ("the cat
// climbs onto the man's lap on the beach"). Wan 2.7 uses natural-language
// positional references ("Image 1 is X") (see kie-wan-27-r2v.test.ts). The
// beach goes in `first_frame` rather than `reference_image` since Wan 2.7
// has a dedicated background slot.

const PROMPT = `Image 1 and image 2 show the same white cat with mismatched yellow and blue eyes.
Image 3 is a man wearing a blue suit and blue tie.
The setting is a sandy beach with the ocean behind.

In the scene, the man sits cross-legged on the sand. The white cat climbs onto his lap, purrs, and lifts a paw to bat playfully at his blue tie. The man smiles and waves at the camera with his free hand.`;

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

describe("kie wan/2-7-r2v reference bake-off", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload cat/man/beach references, run wan/2-7-r2v with positional references, and poll to completion",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/wan-27-r2v-reference-bakeoff");

      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const cat1Url = await uploadFixture(provider, "cat1.jpg", "image/jpeg");
      const cat2Url = await uploadFixture(provider, "cat2.jpg", "image/jpeg");
      const manUrl = await uploadFixture(provider, "man.jpg", "image/jpeg");
      const beachUrl = await uploadFixture(provider, "beach.png", "image/png");

      const task = await provider.post.api.v1.jobs.createTask({
        model: "wan/2-7-r2v",
        input: {
          prompt: PROMPT,
          reference_image: [cat1Url, cat2Url, manUrl],
          first_frame: beachUrl,
          resolution: "720p",
          aspect_ratio: "16:9",
          duration: 2,
          watermark: false,
          nsfw_checker: false,
          seed: 1308038620,
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
