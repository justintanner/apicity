import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeEstimate, estimateEndpoint } from "@apicity/cost";
import type { HarEntry } from "../har-data";

describe("Nunchux Wan 3.0 video pricing", () => {
  const har = JSON.parse(
    readFileSync(
      "tests/recordings/nunchux_350094952/wan-3-0-text-to-video_3837927036/recording.har",
      "utf8"
    )
  ) as { log: { entries: HarEntry[] } };
  const body = JSON.parse(
    har.log.entries[0]!.request.postData!.text!
  ) as Record<string, unknown>;
  const quote = (
    payload: Record<string, unknown>,
    inputDurationSeconds?: number
  ) =>
    computeEstimate({
      provider: "nunchux",
      payload,
      costHints: { inputDurationSeconds },
    });
  const reference = (type: string) => ({
    ...body,
    input: {
      prompt: "Video 1",
      media: [{ type, url: "https://example.com/ref" }],
    },
    parameters: { resolution: "720P", duration: 5 },
  });

  it("prices the recorded 480P clip and the 1080P five-second default", () => {
    expect(quote(body).usd).toBeCloseTo(0.1, 9);
    expect(quote({ ...body, parameters: undefined }).usd).toBeCloseTo(1, 9);
  });
  it("bills reference video at the output rate, up to 15 input seconds", () => {
    const video = reference("reference_video");
    expect(quote(video, 8).usd).toBeCloseTo(1.3, 9);
    expect(quote(video, 16).usd).toBeCloseTo(2.0, 9);
    for (const seconds of [undefined, 0, -1, NaN]) {
      const estimate = quote(video, seconds);
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings.join(" ")).toContain(
        "costHints.inputDurationSeconds"
      );
    }
    expect(
      quote({ ...video, parameters: { duration: 28 } }, 8).warnings.length
    ).toBeGreaterThan(0);
  });
  it.each(["reference_image", "reference_audio"])(
    "does not bill %s inputs",
    (type) => {
      expect(quote(reference(type), 8).usd).toBeCloseTo(0.5, 9);
    }
  );
});

describe("Nunchux Seedance 2.5 pricing", () => {
  const har = JSON.parse(
    readFileSync(
      "tests/recordings/nunchux_350094952/seedance-2-5-text-to-video_3674644594/recording.har",
      "utf8"
    )
  ) as { log: { entries: HarEntry[] } };
  const body = JSON.parse(
    har.log.entries[0]!.request.postData!.text!
  ) as Record<string, unknown>;
  const receipt = JSON.parse(
    har.log.entries.at(-1)!.response.content.text!
  ) as { usage: { completion_tokens: number } };
  it("prices the recorded 16:9 clip at its settled token charge", () => {
    expect(receipt.usage.completion_tokens).toBe(38830);
    const estimate = computeEstimate({ provider: "nunchux", payload: body });
    expect(estimate.warnings).toEqual([]);
    expect(estimate.usd).toBeCloseTo(
      (receipt.usage.completion_tokens * 10.7) / 1e6,
      9
    );
  });
  it("requires the input frame shape and uses the default 720p resolution", () => {
    const payload = {
      ...body,
      content: [
        { type: "text", text: "Animate this frame." },
        {
          type: "image_url",
          role: "first_frame",
          image_url: { url: "https://example.com/frame.jpg" },
        },
      ],
      resolution: undefined,
    };
    expect(
      computeEstimate({ provider: "nunchux", payload }).warnings.join(" ")
    ).toContain("costHints.aspectRatio");
    expect(
      computeEstimate({
        provider: "nunchux",
        payload,
        costHints: { aspectRatio: "1:1" },
      }).usd
    ).toBeCloseTo((87300 * 10.7) / 1e6, 9);
  });
  it("prices the recorded first-frame render with its reported output ratio", () => {
    const har = JSON.parse(
      readFileSync(
        "tests/recordings/nunchux_350094952/seedance-2-5-image-to-video_3270814726/recording.har",
        "utf8"
      )
    ) as { log: { entries: HarEntry[] } };
    const payload = JSON.parse(
      har.log.entries[0]!.request.postData!.text!
    ) as Record<string, unknown>;
    const receipt = JSON.parse(
      har.log.entries.at(-1)!.response.content.text!
    ) as { ratio: string; usage: { completion_tokens: number } };
    expect(receipt).toMatchObject({
      ratio: "281:374",
      usage: { completion_tokens: 39820 },
    });
    const request = { provider: "nunchux" as const, payload };
    const estimate = computeEstimate({
      ...request,
      costHints: { aspectRatio: receipt.ratio },
    });
    expect(estimate.warnings).toEqual([]);
    expect(estimate.usd).toBeCloseTo(
      (receipt.usage.completion_tokens * 10.7) / 1e6,
      9
    );
    const missing = computeEstimate(request);
    expect(missing.usd).toBe(0);
    expect(missing.warnings.join(" ")).toContain("costHints.aspectRatio");
    expect(
      computeEstimate({
        ...request,
        payload: { ...payload, resolution: "720p" },
        costHints: { aspectRatio: receipt.ratio },
      }).usd
    ).toBe(0);
  });
  it("selects the reference-video rate", () => {
    const payload = {
      ...body,
      content: [
        { type: "text", text: "Follow this motion." },
        {
          type: "video_url",
          role: "reference_video",
          video_url: { url: "https://example.com/clip.mp4" },
        },
      ],
    };
    expect(computeEstimate({ provider: "nunchux", payload }).usd).toBeCloseTo(
      (38830 * 6.4) / 1e6,
      9
    );
  });
});

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
  it("prices the recorded 1K edit at list, like a 1K generation", () => {
    const edit = JSON.parse(
      (
        JSON.parse(
          readFileSync(
            "tests/recordings/nunchux_350094952/nano-banana-2-1-edit_4018369537/recording.har",
            "utf8"
          )
        ) as { log: { entries: HarEntry[] } }
      ).log.entries[0]!.request.postData!.text!
    ) as Record<string, unknown>;
    expect(edit.input).toHaveLength(2);
    expect(computeEstimate({ provider: "nunchux", payload: edit })).toEqual(
      expect.objectContaining({ usd: 0.0336, warnings: [] })
    );
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
