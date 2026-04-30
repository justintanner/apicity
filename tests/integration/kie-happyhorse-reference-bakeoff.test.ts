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

// Reference-video bake-off: HappyHorse (fifth column).
// Companion to the grok / wan / seedance / kling bake-off tests. Same four
// fixtures (cat1, cat2, man, beach) and same scene.
//
// HappyHorse `reference-to-video` uses positional plain-text references:
// `reference_image[0]` becomes `character1` in the prompt, `[1]` becomes
// `character2`, and so on (1-9 references). Cheapest settings:
// `resolution: "720p"` (lowest available), `duration: 3` (lowest valid).
//
// Note: an earlier attempt with 4 references (cat1, cat2, man, beach) sat in
// `state: "waiting"` for 20+ minutes — the KIE queue for HappyHorse is slow
// and 4 distinct characters compounds the wait. Reduced to 2 references
// (cat, man) with the beach setting described in the prompt prose, which
// matches the existing kie-happyhorse-reference-to-video test pattern.

const PROMPT = `On a sandy beach with the ocean behind, character2 sits cross-legged on the sand. character1 climbs onto character2's lap, purrs, and lifts a paw to bat playfully at his blue tie. character2 smiles and waves at the camera with his free hand. character1 is a white cat with mismatched yellow and blue eyes. character2 is a man wearing a blue suit and a blue tie.`;

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

describe("kie happyhorse/reference-to-video bake-off", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "should upload cat+man references, run happyhorse/reference-to-video with characterN syntax, and poll to completion",
    { timeout: 1800_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/happyhorse-reference-bakeoff");

      const provider = kie({
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const cat1Url = await uploadFixture(provider, "cat1.jpg", "image/jpeg");
      const manUrl = await uploadFixture(provider, "man.jpg", "image/jpeg");

      const task = await provider.post.api.v1.jobs.createTask({
        model: "happyhorse/reference-to-video",
        input: {
          prompt: PROMPT,
          reference_image: [cat1Url, manUrl],
          resolution: "720p",
          aspect_ratio: "16:9",
          duration: 3,
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
