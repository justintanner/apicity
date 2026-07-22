import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect, afterEach } from "vitest";
import {
  setupPollyForFileUploads,
  teardownPolly,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { createKie, type MediaGenerationRequest } from "@apicity/kie";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

// End-to-end Telegram-media check for Kling 3.0 Turbo (`kling-3.0/video`),
// uploading OUR OWN fixture assets (a cat + a man) and feeding them into the
// generation via named `kling_elements`. This is the final hop in the media
// pipeline: fileStreamUpload -> createTask -> poll to a completed video ->
// committed HAR that the Telegram preview renders.
//
// "Kling 3.0 Turbo" on KIE is the same `kling-3.0/video` model used by
// kie-kling-30-reference-bakeoff.test.ts (Turbo is the product name, not a
// distinct model id or mode); it exposes the named-element reference
// convention: `kling_elements` (max 3) is an array of
// `{name, description, element_input_urls}`, and the prompt refers to subjects
// by `[name]`. Cheapest settings per the KIE docs: `mode: "std"`,
// `duration: "3"`, `sound: false`, no multi-shot.
//
// Constraint discovered during reference-bakeoff recording: each
// `kling_elements.element_input_urls` must hold **2-4 images**. The cat has two
// fixtures (cat1, cat2); the man has one (man.jpg), so we pass man.jpg twice to
// satisfy the min-2 requirement.
//
// Per ac-x8rgr: poll `recordInfo` until `state === "success"` BEFORE
// teardownPolly so the committed recording.har ends on the completed video
// (not a mid-generation `generating`/`waiting` poll). The Telegram preview
// depends on the final poll carrying the finished media URL.

const PROMPT = `In a cozy sunlit living room, [blue_suit_man] sits on a couch. [white_cat] hops up beside him, purrs, and gently bats a paw at his blue tie. [blue_suit_man] smiles and waves at the camera.`;

async function uploadFixture(
  provider: ReturnType<typeof createKie>,
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

describe("kie kling-3.0 turbo upload cat+man e2e", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "uploads our own cat+man fixtures, runs kling-3.0/video with named kling_elements, and polls to a completed video",
    { timeout: 1200_000 },
    async () => {
      ctx = setupPollyForFileUploads("kie/kling-30-turbo-upload-cat-man");

      const provider = createKie({
        paygate: { secret: TEST_PAYGATE_SECRET },
        apiKey: process.env.KIE_API_KEY ?? "test-key",
      });

      const cat1Url = await uploadFixture(provider, "cat1.jpg", "image/jpeg");
      const cat2Url = await uploadFixture(provider, "cat2.jpg", "image/jpeg");
      const manUrl = await uploadFixture(provider, "man.jpg", "image/jpeg");

      const request = {
        model: "kling-3.0/video",
        input: {
          prompt: PROMPT,
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
          duration: "3",
          aspect_ratio: "16:9",
          mode: "std",
          multi_shots: false,
        },
      } satisfies MediaGenerationRequest;
      const task = await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

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
}, 10);
