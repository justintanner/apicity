import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  type PollyContext,
  mintXaiOtp,
} from "../harness";
import { createXaiProvider } from "../xai-provider";
import { computeEstimate } from "@apicity/cost";
import type {
  XaiImageEditRequest,
  XaiImageGenerateRequest,
  XaiImageResponse,
  XaiVideoGenerateRequest,
  XaiVideoResult,
} from "@apicity/xai";

// Billing probes for PRICING.xai (ac-k7qv4n, 2026-10-31). Each response
// carries usage.cost_in_usd_ticks (1 USD = 1e10 ticks), the amount xAI billed
// for that call, and each test pins it to the estimate for its payload. The
// inputs are tests/fixtures/cat1.jpg and man.jpg, pinned to the commit that
// added them.
const FIXTURES =
  "https://raw.githubusercontent.com/justintanner/apicity/22505b16d876d3b024c304554ae0e16432b4e92d/tests/fixtures";
const CAT1_URL = `${FIXTURES}/cat1.jpg`;
const MAN_URL = `${FIXTURES}/man.jpg`;

// The billed ticks the cost table predicts for a payload.
function estimatedTicks(payload: Record<string, unknown>): number {
  const estimate = computeEstimate({ provider: "xai", payload });
  expect(estimate.warnings).toEqual([]);
  return Math.round(estimate.usd * 1e10);
}

function expectBilled(
  result: XaiImageResponse,
  images: number,
  req: Record<string, unknown>
): void {
  expect(result.data).toHaveLength(images);
  expect(result.usage?.cost_in_usd_ticks).toBe(estimatedTicks(req));
}

// Submits a one-second clip and polls GET /v1/videos/{id} to the end; the
// final poll carries the bill.
async function billVideo(
  req: XaiVideoGenerateRequest
): Promise<XaiVideoResult> {
  const provider = createXaiProvider();
  const { request_id } = await provider.post.v1.videos.generations(
    req,
    mintXaiOtp("v1.videos.generations", req)
  );
  expect(request_id).toBeTruthy();

  const pollDelay = getPollyMode() === "replay" ? 0 : 5_000;
  let result = await provider.get.v1.videos(request_id);
  for (let i = 0; i < 160 && result.status === "pending"; i++) {
    if (pollDelay) await new Promise((r) => setTimeout(r, pollDelay));
    result = await provider.get.v1.videos(request_id);
  }

  expect(result.status).toBe("done");
  expect(result.video?.duration).toBe(1);
  return result;
}

describe("xai Grok Imagine billing", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it(
    "I1: bills a grok-imagine-image-2.0 low edit of one input",
    { timeout: 120_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-2-0-edit-low-one-input");
      const req = {
        prompt: "Render this photo as a pencil sketch",
        model: "grok-imagine-image-2.0",
        image: { url: MAN_URL },
        quality: "low",
      } satisfies XaiImageEditRequest;
      const result = await createXaiProvider().post.v1.images.edits(
        req,
        mintXaiOtp("v1.images.edits", req)
      );
      expectBilled(result, 1, req);
    }
  );

  it(
    "I2: bills a grok-imagine-image-2.0 low edit of two inputs",
    { timeout: 120_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-2-0-edit-low-two-inputs");
      const req = {
        prompt:
          "Draw the cat from <IMAGE_0> sitting beside the man from <IMAGE_1>, as a pencil sketch",
        model: "grok-imagine-image-2.0",
        images: [{ url: CAT1_URL }, { url: MAN_URL }],
        quality: "low",
      } satisfies XaiImageEditRequest;
      const result = await createXaiProvider().post.v1.images.edits(
        req,
        mintXaiOtp("v1.images.edits", req)
      );
      expectBilled(result, 1, req);
    }
  );

  it(
    "I3: bills a grok-imagine-image-2.0 edit at the default quality",
    { timeout: 120_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-2-0-edit-auto-one-input");
      const req = {
        prompt: "Render this photo as a pencil sketch",
        model: "grok-imagine-image-2.0",
        image: { url: MAN_URL },
      } satisfies XaiImageEditRequest;
      const result = await createXaiProvider().post.v1.images.edits(
        req,
        mintXaiOtp("v1.images.edits", req)
      );
      expectBilled(result, 1, req);
    }
  );

  it(
    "I4: bills a grok-imagine-image-2.0 low edit at 2k",
    { timeout: 120_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-2-0-edit-low-2k");
      const req = {
        prompt: "Render this photo as a pencil sketch",
        model: "grok-imagine-image-2.0",
        image: { url: MAN_URL },
        quality: "low",
        resolution: "2k",
      } satisfies XaiImageEditRequest;
      const result = await createXaiProvider().post.v1.images.edits(
        req,
        mintXaiOtp("v1.images.edits", req)
      );
      expectBilled(result, 1, req);
    }
  );

  it(
    "I5: bills a grok-imagine-image-2.0 low edit with two outputs",
    { timeout: 120_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-2-0-edit-low-n2");
      const req = {
        prompt: "Render this photo as a pencil sketch",
        model: "grok-imagine-image-2.0",
        image: { url: MAN_URL },
        quality: "low",
        n: 2,
      } satisfies XaiImageEditRequest;
      const result = await createXaiProvider().post.v1.images.edits(
        req,
        mintXaiOtp("v1.images.edits", req)
      );
      expectBilled(result, 2, req);
    }
  );

  // A medium 2k image takes over a minute: the first attempt hit the 60 s
  // default timeout, and xAI billed nothing for the aborted call.
  it(
    "I6: bills a grok-imagine-image-2.0 medium generation at 2k",
    { timeout: 360_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-2-0-generate-medium-2k");
      const req = {
        prompt: "A lighthouse on a rocky shore at dawn, watercolor",
        model: "grok-imagine-image-2.0",
        quality: "medium",
        resolution: "2k",
      } satisfies XaiImageGenerateRequest;
      const result = await createXaiProvider(
        300_000
      ).post.v1.images.generations(
        req,
        mintXaiOtp("v1.images.generations", req)
      );
      expectBilled(result, 1, req);
    }
  );

  it(
    "I7: bills a grok-imagine-image-2.0 generation at the defaults",
    { timeout: 120_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-2-0-generate-defaults");
      const req = {
        prompt: "A lighthouse on a rocky shore at dawn, watercolor",
        model: "grok-imagine-image-2.0",
      } satisfies XaiImageGenerateRequest;
      const result = await createXaiProvider().post.v1.images.generations(
        req,
        mintXaiOtp("v1.images.generations", req)
      );
      expectBilled(result, 1, req);
    }
  );

  it(
    "I8: bills a grok-imagine-image edit of two inputs",
    { timeout: 120_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-1-0-edit-two-inputs");
      const req = {
        prompt:
          "Draw the cat from <IMAGE_0> sitting beside the man from <IMAGE_1>, as a pencil sketch",
        model: "grok-imagine-image",
        images: [{ url: CAT1_URL }, { url: MAN_URL }],
      } satisfies XaiImageEditRequest;
      const result = await createXaiProvider().post.v1.images.edits(
        req,
        mintXaiOtp("v1.images.edits", req)
      );
      expectBilled(result, 1, req);
    }
  );

  it(
    "V1: bills a one-second grok-imagine-video-1.5 clip at 720p",
    { timeout: 900_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-video-1-5-720p");
      const req = {
        prompt: "A paper boat drifting across a calm pond",
        model: "grok-imagine-video-1.5" as const,
        duration: 1 as const,
        resolution: "720p" as const,
      };
      const result = await billVideo(req);
      expect(result.usage?.cost_in_usd_ticks).toBe(estimatedTicks(req));
    }
  );

  // ac-9jsawg: the other resolution tiers and the image input charges.
  it(
    "V2: bills a one-second grok-imagine-video clip at 720p",
    { timeout: 900_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-video-1-0-720p");
      const req = {
        prompt: "A paper boat drifting across a calm pond",
        model: "grok-imagine-video",
        duration: 1 as const,
        resolution: "720p" as const,
      };
      const result = await billVideo(req);
      expect(result.usage?.cost_in_usd_ticks).toBe(estimatedTicks(req));
    }
  );

  it(
    "V3: bills a one-second grok-imagine-video-1.5-lite clip at 720p",
    { timeout: 900_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-video-1-5-lite-720p");
      const req = {
        prompt: "A paper boat drifting across a calm pond",
        model: "grok-imagine-video-1.5-lite",
        duration: 1 as const,
        resolution: "720p" as const,
      };
      const result = await billVideo(req);
      expect(result.usage?.cost_in_usd_ticks).toBe(estimatedTicks(req));
    }
  );

  it(
    "V4: bills a one-second grok-imagine-video-1.5 clip at 1080p",
    { timeout: 900_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-video-1-5-1080p");
      const req: XaiVideoGenerateRequest = {
        prompt: "A paper boat drifting across a calm pond",
        model: "grok-imagine-video-1.5",
        duration: 1,
        resolution: "1080p",
      };
      const result = await billVideo(req);
      expect(result.usage?.cost_in_usd_ticks).toBe(estimatedTicks(req));
    }
  );

  it(
    "V5: bills a one-second grok-imagine-video-1.5-lite clip at 1080p",
    { timeout: 900_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-video-1-5-lite-1080p");
      const req: XaiVideoGenerateRequest = {
        prompt: "A paper boat drifting across a calm pond",
        model: "grok-imagine-video-1.5-lite",
        duration: 1,
        resolution: "1080p",
      };
      const result = await billVideo(req);
      expect(result.usage?.cost_in_usd_ticks).toBe(estimatedTicks(req));
    }
  );

  it(
    "V6: bills a one-second grok-imagine-video-1.5 image-to-video clip",
    { timeout: 900_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-video-1-5-i2v-480p");
      const req = {
        prompt: "The man smiles and nods at the camera",
        model: "grok-imagine-video-1.5",
        image: { url: MAN_URL },
        duration: 1 as const,
        resolution: "480p" as const,
      };
      const result = await billVideo(req);
      expect(result.usage?.cost_in_usd_ticks).toBe(estimatedTicks(req));
    }
  );

  it(
    "V7: bills a one-second grok-imagine-video-1.5 clip from two references",
    { timeout: 900_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-video-1-5-r2v-two-480p");
      const req = {
        prompt: "The man from <IMAGE_0> pets the cat from <IMAGE_1>",
        model: "grok-imagine-video-1.5",
        reference_images: [{ url: MAN_URL }, { url: CAT1_URL }],
        duration: 1 as const,
        resolution: "480p" as const,
      };
      const result = await billVideo(req);
      expect(result.usage?.cost_in_usd_ticks).toBe(estimatedTicks(req));
    }
  );

  it(
    "V8: bills a one-second grok-imagine-video image-to-video clip",
    { timeout: 900_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-video-1-0-i2v-480p");
      const req = {
        prompt: "The man smiles and nods at the camera",
        model: "grok-imagine-video",
        image: { url: MAN_URL },
        duration: 1 as const,
        resolution: "480p" as const,
      };
      const result = await billVideo(req);
      expect(result.usage?.cost_in_usd_ticks).toBe(estimatedTicks(req));
    }
  );

  it(
    "V9: bills a one-second grok-imagine-video-1.5-lite image-to-video clip",
    { timeout: 900_000 },
    async () => {
      ctx = setupPolly("xai/imagine-billing-video-1-5-lite-i2v-480p");
      const req = {
        prompt: "The man smiles and nods at the camera",
        model: "grok-imagine-video-1.5-lite",
        image: { url: MAN_URL },
        duration: 1 as const,
        resolution: "480p" as const,
      };
      const result = await billVideo(req);
      expect(result.usage?.cost_in_usd_ticks).toBe(estimatedTicks(req));
    }
  );
});
