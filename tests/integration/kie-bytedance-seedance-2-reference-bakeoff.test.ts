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

// Reference-video bake-off: Seedance 2 (the non-fast tier) as a separate
// column from Seedance 2 Fast. Same fixtures, same scene, same prompt — only
// the model differs (`bytedance/seedance-2` vs `bytedance/seedance-2-fast`).
// This gives us a side-by-side of fast vs full so we can see whether the
// higher-tier version handles multi-reference identity any better.
//
// Reuses the same constraint as the fast variant: passing both
// `reference_image_urls` and `first_frame_url` returns 422
// ("only one scene can be selected"), so all four fixtures go into
// `reference_image_urls`.

const PROMPT = `The reference images show a white cat with mismatched yellow and blue eyes, and a man wearing a blue suit and a blue tie. The setting is a sandy beach with the ocean behind.

In the scene, the man sits cross-legged on the sand. The white cat climbs onto his lap, purrs, and lifts a paw to bat playfully at his blue tie. The man smiles and waves at the camera with his free hand.`;

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

describe("kie bytedance/seedance-2 reference bake-off", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload cat/man/beach references, run bytedance/seedance-2 with natural-language prompt, and poll to completion",
    { timeout: 1500_000 },
    async () => {
      ctx = setupPollyForFileUploads(
        "kie/bytedance-seedance-2-reference-bakeoff"
      );

      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const cat1Url = await uploadFixture(provider, "cat1.jpg", "image/jpeg");
      const cat2Url = await uploadFixture(provider, "cat2.jpg", "image/jpeg");
      const manUrl = await uploadFixture(provider, "man.jpg", "image/jpeg");
      const beachUrl = await uploadFixture(provider, "beach.png", "image/png");

      const task = await provider.post.api.v1.jobs.createTask({
        model: "bytedance/seedance-2",
        input: {
          prompt: PROMPT,
          reference_image_urls: [cat1Url, cat2Url, manUrl, beachUrl],
          resolution: "480p",
          aspect_ratio: "16:9",
          duration: 4,
          generate_audio: false,
          web_search: false,
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
