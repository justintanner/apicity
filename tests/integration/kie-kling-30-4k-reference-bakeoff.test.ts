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

// Reference-video bake-off: Kling 3.0 in **4K mode** (separate column from
// the cheapest-settings `mode: "std"` test). Same fixtures, same scene,
// same prompt, same kling_elements convention — only `mode` differs. This
// gives us a side-by-side of std vs 4K so we can see whether the higher tier
// changes how Kling resolves the named-element references.
//
// Constraint reminder: each `element_input_urls` must contain 2-4 images;
// `man.jpg` is duplicated to satisfy the min for the man element.

const PROMPT = `On a sandy beach with the ocean behind, [blue_suit_man] sits cross-legged on the sand. [white_cat] climbs onto his lap, purrs, and lifts a paw to bat playfully at his blue tie. [blue_suit_man] smiles and waves at the camera with his free hand.`;

async function uploadFixture(
  provider: ReturnType<typeof kie>,
  filename: string,
  mimeType: string
): Promise<string> {
  const blob = new Blob(
    [readFileSync(resolve(__dirname, "../fixtures", filename))],
    { type: mimeType }
  );
  const upload = await provider.post.api.fileStreamUpload({
    file: blob,
    filename,
    uploadPath: "images/test-uploads",
  });
  expect(upload.data?.downloadUrl).toBeTruthy();
  return upload.data!.downloadUrl;
}

describe("kie kling-3.0 4K reference bake-off", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload cat/man/beach references, run kling-3.0/video in 4K mode, and poll to completion",
    { timeout: 1500_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/kling-30-4k-reference-bakeoff");

      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const cat1Url = await uploadFixture(provider, "cat1.jpg", "image/jpeg");
      const cat2Url = await uploadFixture(provider, "cat2.jpg", "image/jpeg");
      const manUrl = await uploadFixture(provider, "man.jpg", "image/jpeg");
      const beachUrl = await uploadFixture(provider, "beach.png", "image/png");

      const task = await provider.post.api.v1.jobs.createTask({
        model: "kling-3.0/video",
        input: {
          prompt: PROMPT,
          image_urls: [beachUrl],
          kling_elements: [
            {
              name: "white_cat",
              description: "A white cat with mismatched yellow and blue eyes",
              element_input_urls: [cat1Url, cat2Url],
            },
            {
              name: "blue_suit_man",
              description: "A man wearing a blue suit and a blue tie",
              element_input_urls: [manUrl, manUrl],
            },
          ],
          sound: false,
          duration: "5",
          aspect_ratio: "16:9",
          mode: "4K",
          multi_shots: false,
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
