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

// Reference-video bake-off: Kling 3.0 (fourth column).
// Companion to kie-grok-imagine-reference-bakeoff.test.ts,
// kie-wan-27-r2v-reference-bakeoff.test.ts, and
// kie-bytedance-seedance-2-fast-reference-bakeoff.test.ts. Same four fixtures
// (cat1, cat2, man, beach) and same scene.
//
// Kling 3.0/video has a unique "named element" reference convention:
// `kling_elements` (max 3) is an array of `{name, description, element_input_urls}`,
// and the prompt refers to subjects by `[name]`. The beach setting goes in
// `image_urls` (a separate general-references array). Cheapest settings:
// `mode: "std"`, `duration: "5"`, no sound, no multi-shot.
//
// Important constraint discovered during recording: Kling requires each
// `kling_elements.element_input_urls` to contain **between 2 and 4 images**.
// The cat has 2 fixtures (cat1, cat2), but the man only has 1 (man.jpg), so
// we pass man.jpg twice to satisfy the min-2 requirement.

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

describe("kie kling-3.0 reference bake-off", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload cat/man/beach references, run kling-3.0/video with named kling_elements, and poll to completion",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/kling-30-reference-bakeoff");

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
          mode: "std",
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
