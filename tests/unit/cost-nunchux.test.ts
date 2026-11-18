import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeEstimate, estimateEndpoint } from "@apicity/cost";
import type { HarEntry } from "../har-data";

const har = JSON.parse(
  readFileSync(
    "tests/recordings/nunchux_350094952/nano-banana-2-1-text-to-image_903528036/recording.har",
    "utf8"
  )
) as { log: { entries: HarEntry[] } };
const payload = JSON.parse(
  har.log.entries[0]!.request.postData!.text!
) as Record<string, unknown>;
const quote = (response_format: Record<string, unknown>) =>
  computeEstimate({
    provider: "nunchux",
    payload: { ...payload, response_format },
  });

describe("Nunchux Nano Banana 2.1 pricing", () => {
  it("prices the recorded 1K image at list", () => {
    const request = { provider: "nunchux" as const, payload };
    expect(computeEstimate(request)).toMatchObject({
      usd: 0.0336,
      warnings: [],
    });
    expect(
      estimateEndpoint({
        ...request,
        method: "POST",
        dotPath: "v1.google.v1beta.interactions",
      })
    ).toMatchObject({ status: "priced", usd: 0.0336 });
  });
  it("prices sizes independently and defaults to 4K", () => {
    expect(quote({ type: "image", image_size: "2K" }).usd).toBe(0.0504);
    expect(quote({ type: "image", image_size: "4K" }).usd).toBe(0.113);
    expect(quote({ type: "image" }).usd).toBe(0.113);
  });
  it("reports unsupported sizes and models", () => {
    const size = quote({ type: "image", image_size: "512" });
    expect(size.usd).toBe(0);
    expect(size.warnings.length).toBeGreaterThan(0);
    const model = computeEstimate({
      provider: "nunchux",
      payload: { ...payload, model: "gemini-unknown" },
    });
    expect(model.usd).toBe(0);
    expect(model.warnings.length).toBeGreaterThan(0);
  });
});
