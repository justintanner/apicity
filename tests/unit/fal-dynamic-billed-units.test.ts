import { describe, expect, it } from "vitest";
import { computeEstimate } from "../../packages/provider/cost/src/compute";
import {
  FAL_DYNAMIC_BILLED_UNITS,
  FAL_DYNAMIC_PRICING_ENDPOINTS,
  falDynamicBilledUnit,
} from "../../packages/provider/cost/src/pricing/fal";

// Includes the reframe-video card checked on 2026-10-21.
// The ten 0.15.0 fal endpoints ac-j3d6ki.4 re-checked on 2026-10-17. Each card,
// OpenAPI and pricing-API row matched the 2026-10-15 reads behind its
// recording, and each recorded bill shows the request cannot fix the billed
// quantity, so each stays dynamic with its billed unit named.
const CHECKED = [
  "fal-ai/flux-2-flex",
  "fal-ai/kandinsky6-lite/image-to-video",
  "fal-ai/kandinsky6-lite/text-to-video",
  "fal-ai/kandinsky6-pro/image-to-video",
  "fal-ai/kandinsky6-pro/text-to-video",
  "fal-ai/kandinsky6-vsr",
  "fal-ai/kandinsky6-vsr/lite",
  "google/nano-banana-2.1",
  "google/nano-banana-2.1/edit",
  "minimax/h3-max/reframe-video",
  "mirelo-ai/sfx2.0/video-to-video",
];

// The substrings every dynamic fal warning keeps (fal-pricing-estimate pins
// them for every dynamic id; ac-ytg1l1 added the last two).
const PINNED = [
  "POST https://api.fal.ai/v1/models/pricing/estimate",
  "fal.v1.models.pricing.estimate",
  "FAL_ADMIN_API_KEY",
  "x-fal-billable-units",
  "unitQuantity",
];

describe("billed units of dynamically priced fal endpoints", () => {
  it("names exactly the checked endpoints, all still dynamic", () => {
    expect(Object.keys(FAL_DYNAMIC_BILLED_UNITS).sort()).toEqual(CHECKED);
    for (const endpoint of CHECKED) {
      expect(FAL_DYNAMIC_PRICING_ENDPOINTS, endpoint).toContain(endpoint);
    }
  });

  it.each(CHECKED)("names the billed unit and why in %s's warning", (id) => {
    const billed = falDynamicBilledUnit(id);
    expect(billed, id).toBeDefined();
    const estimate = computeEstimate({
      provider: "fal",
      endpoint: id,
      payload: {},
    });
    expect(estimate.usd).toBe(0);
    expect(estimate.warnings).toHaveLength(1);
    const [warning] = estimate.warnings;
    expect(warning).toContain(`fal '${id}' bills ${billed?.unit}.`);
    expect(warning).toContain(`payload: ${billed?.why}, so no local rate`);
    for (const fragment of PINNED) expect(warning).toContain(fragment);
    expect(warning).not.toContain("is billed on a unit");
  });

  it("keeps the generic warning for a dynamic endpoint without an entry", () => {
    const endpoint = "alibaba/wan-3.0/text-to-video";
    expect(falDynamicBilledUnit(endpoint)).toBeUndefined();
    const [warning] = computeEstimate({
      provider: "fal",
      endpoint,
      payload: {},
    }).warnings;
    expect(warning).toContain(
      `fal '${endpoint}' is billed on a unit this estimator cannot derive`
    );
    for (const fragment of PINNED) expect(warning).toContain(fragment);
  });

  it("finds no entry for an unknown id or an inherited key", () => {
    expect(falDynamicBilledUnit("fal-ai/not-a-model")).toBeUndefined();
    expect(falDynamicBilledUnit("constructor")).toBeUndefined();
    expect(falDynamicBilledUnit("toString")).toBeUndefined();
  });
});
