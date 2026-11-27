import { describe, expect, it } from "vitest";
import { FAL_ENDPOINT_REQUEST_SCHEMAS } from "@apicity/fal/zod";
import { estimateEndpoint } from "../../packages/provider/cost/src/estimate-endpoint";
import { resolveFalDynamicEstimate } from "../../packages/provider/cost/src/fal-dynamic";
import type { CostHints } from "../../packages/provider/cost/src/types";

const estimate = (
  dotPath: string,
  payload: Record<string, unknown>,
  costHints?: CostHints
) =>
  estimateEndpoint({
    provider: "fal",
    method: "POST",
    dotPath,
    payload,
    costHints,
  });

describe("fal resolution prices from the 2026-11-27 model cards", () => {
  it.each(["textToImage", "editImage"])(
    "prices FLUX 3 %s by output resolution",
    (operation) => {
      const path = "blackforestlabs.flux3." + operation;
      for (const [resolution, price] of [
        ["768sq", 0.041],
        ["1k", 0.048],
        ["1.5k", 0.07],
        ["2k", 0.1],
        ["4k", 0.607],
      ] as const) {
        expect(estimate(path, { resolution, image_urls: ["a", "b"] }).usd).toBe(
          price
        );
      }
      expect(estimate(path, { resolution: "512sq" }).status).toBe(
        "unavailable"
      );
    }
  );

  it("can still price billed units for a legacy FLUX 3 resolution", async () => {
    const result = await resolveFalDynamicEstimate(
      "blackforestlabs/flux-3/edit-image",
      { resolution: "512sq" },
      async (request) => {
        expect(request).toEqual({
          estimate_type: "unit_price",
          endpoints: {
            "blackforestlabs/flux-3/edit-image": { unit_quantity: 2 },
          },
        });
        return {
          total_cost: 0.096,
          currency: "USD",
          estimate_type: "unit_price",
        };
      },
      { unitQuantity: 2 }
    );
    expect(result.usd).toBe(0.096);
  });

  it.each(["", "us."])(
    "prices Seedance 2.5 %s4K standard and video-input tokens",
    (region) => {
      const path = "bytedance.seedance2p5." + region;
      for (const operation of [
        "textToVideo",
        "imageToVideo",
        "referenceToVideo",
        "draft.complete",
      ]) {
        const payload = { resolution: "4k", duration: "12" };
        expect(
          estimate(path + operation, payload, { videoOutputTokens: 1000 }).usd
        ).toBeCloseTo(0.0094, 12);
        const preview = estimate(path + operation, payload, {
          durationSeconds: 12,
        });
        expect(preview.usd).toBeCloseTo(22.08, 10);
        expect(preview.warnings.join(" ")).toContain("approximate");
      }
      for (const operation of ["referenceToVideo", "draft.complete"]) {
        expect(
          estimate(
            path + operation,
            { resolution: "4k", video_urls: ["clip"] },
            { videoInputTokens: 1000, videoOutputTokens: 2000 }
          ).usd
        ).toBeCloseTo(3 * 0.0058, 12);
      }
      expect(
        estimate(path + "referenceToVideo", {
          resolution: "4k",
          video_urls: ["clip"],
          duration: "12",
        }).status
      ).toBe("unavailable");
      expect(
        estimate(path + "textToVideo", {
          resolution: "4k",
          draft: true,
          duration: "4",
          aspect_ratio: "1:1",
        }).usd
      ).toBeCloseTo(0.83032, 8);
    }
  );

  it.each(["textToVideo", "imageToVideo", "referenceToVideo"])(
    "prices Kling v4 %s SDR and HDR output seconds",
    (op) => {
      expect(
        estimate("kling.v4." + op, { resolution: "4k", duration: 12 }).usd
      ).toBeCloseTo(6.588, 10);
      expect(
        estimate("kling.v4." + op, {
          resolution: "4k",
          duration: 12,
          hdr: true,
        }).usd
      ).toBeCloseTo(7.524, 10);
    }
  );

  it.each(["referenceToVideo", "videoToVideo.edit"])(
    "bills Kling %s on input plus output with a two-output minimum",
    (op) => {
      const payload = {
        resolution: "4k",
        duration: 12,
        video_urls: ["clip"],
        hdr: true,
      };
      for (const input of [4, 16]) {
        expect(
          estimate("kling.v4." + op, payload, { inputDurationSeconds: input })
            .usd
        ).toBeCloseTo(Math.max(24, input + 12) * 0.329 + 12 * 0.078, 10);
      }
      expect(estimate("kling.v4." + op, payload).status).toBe("unavailable");
    }
  );

  it.each([
    "kling/v4/text-to-video",
    "kling/v4/image-to-video",
    "kling/v4/reference-to-video",
    "kling/v4/video-to-video/edit",
  ] as const)("accepts 4k on %s and rejects an unlisted resolution", (id) => {
    const schema = FAL_ENDPOINT_REQUEST_SCHEMAS[id].shape.resolution;
    expect(schema.safeParse("4k").success).toBe(true);
    expect(schema.safeParse("8k").success).toBe(false);
  });
});
