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
  it("prices the recorded reference-image clip like a text-to-video clip", () => {
    const r2v = JSON.parse(
      (
        JSON.parse(
          readFileSync(
            "tests/recordings/nunchux_350094952/wan-3-0-reference-to-video_3561610200/recording.har",
            "utf8"
          )
        ) as { log: { entries: HarEntry[] } }
      ).log.entries[0]!.request.postData!.text!
    ) as Record<string, unknown>;
    const estimate = quote(r2v);
    expect(estimate.usd).toBeCloseTo(0.1, 9);
    expect(estimate.warnings).toEqual([]);
  });
  it("prices the recorded Wan 2.7 edit from the source clip's length", () => {
    const edit = JSON.parse(
      (
        JSON.parse(
          readFileSync(
            "tests/recordings/nunchux_350094952/wan-2-7-video-edit_1170098627/recording.har",
            "utf8"
          )
        ) as {
          log: { entries: HarEntry[] };
        }
      ).log.entries[0]!.request.postData!.text!
    ) as Record<string, unknown>;
    // Output 2 s plus the 3 s source billed up to the output length: 4 s.
    expect(quote(edit, 3)).toMatchObject({ warnings: [] });
    expect(quote(edit, 3).usd).toBeCloseTo(0.4, 9);
    // Without a duration the output follows the source: 3 + 3 seconds.
    expect(
      quote({ ...edit, parameters: { resolution: "720P" } }, 3).usd
    ).toBeCloseTo(0.6, 9);
    // The source bills at most 10 seconds; 1080P is the default tier.
    expect(
      quote({ ...edit, parameters: { duration: 10 } }, 12).usd
    ).toBeCloseTo(3, 9);
    for (const seconds of [undefined, 0, -1, NaN]) {
      const estimate = quote(edit, seconds);
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings.join(" ")).toContain(
        "costHints.inputDurationSeconds"
      );
    }
    for (const parameters of [{ resolution: "480P" }, { duration: 11 }]) {
      const estimate = quote({ ...edit, parameters }, 3);
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings.length).toBeGreaterThan(0);
    }
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
  it("prices the recorded 16:9 reference-image render on output tokens alone", () => {
    const har = JSON.parse(
      readFileSync(
        "tests/recordings/nunchux_350094952/seedance-2-5-reference-to-video_2938573094/recording.har",
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
      ratio: "16:9",
      usage: { completion_tokens: 38830 },
    });
    const request = { provider: "nunchux" as const, payload };
    const estimate = computeEstimate(request);
    expect(estimate.warnings).toEqual([]);
    expect(estimate.usd).toBeCloseTo(
      (receipt.usage.completion_tokens * 10.7) / 1e6,
      9
    );
    expect(
      computeEstimate({ ...request, costHints: { inputDurationSeconds: 4 } })
        .usd
    ).toBe(estimate.usd);
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
    const request = { provider: "nunchux" as const, payload };
    for (const inputDurationSeconds of [undefined, 0, -1, NaN]) {
      const estimate = computeEstimate({
        ...request,
        costHints: { inputDurationSeconds },
      });
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings.join(" ")).toContain(
        "costHints.inputDurationSeconds"
      );
    }
    // Four seconds of input add 96 frames to the 97 output frames at 854 × 480.
    expect(
      computeEstimate({ ...request, costHints: { inputDurationSeconds: 4 } })
        .usd
    ).toBeCloseTo((77260 * 6.4) / 1e6, 9);
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

describe("Nunchux MiniMax H3 pricing", () => {
  const body = JSON.parse(
    (
      JSON.parse(
        readFileSync(
          "tests/recordings/nunchux_350094952/minimax-h3-text-to-video_1104830590/recording.har",
          "utf8"
        )
      ) as {
        log: { entries: HarEntry[] };
      }
    ).log.entries[0]!.request.postData!.text!
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
  const text = (body.content as unknown[])[0];
  const image = {
    type: "image_url",
    role: "reference_image",
    image_url: { url: "https://example.com/i.jpg" },
  };
  const video = {
    type: "video_url",
    role: "reference_video",
    video_url: { url: "https://example.com/v.mp4" },
  };

  it("prices the recorded 768P four-second clip at list", () => {
    expect(quote(body)).toMatchObject({ warnings: [] });
    expect(quote(body).usd).toBeCloseTo(0.32, 9);
    expect(quote({ ...body, resolution: "2K", duration: 15 }).usd).toBeCloseTo(
      1.95,
      9
    );
  });
  it("adds 0.04 for each reference image beyond the first five", () => {
    expect(
      quote({ ...body, content: [text, ...Array(5).fill(image)] }).usd
    ).toBeCloseTo(0.32, 9);
    expect(
      quote({ ...body, content: [text, ...Array(7).fill(image)] }).usd
    ).toBeCloseTo(0.4, 9);
  });
  it("bills reference video seconds at the output rate from the hint", () => {
    expect(quote({ ...body, content: [text, video] }, 5).usd).toBeCloseTo(
      0.72,
      9
    );
    for (const seconds of [undefined, 0, -1, NaN]) {
      const estimate = quote({ ...body, content: [text, video] }, seconds);
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings.join(" ")).toContain(
        "costHints.inputDurationSeconds"
      );
    }
  });
  it("fails closed without a resolution or with an off-grid duration", () => {
    for (const payload of [
      { ...body, resolution: undefined },
      { ...body, duration: 3 },
      { ...body, duration: 16 },
    ]) {
      const estimate = quote(payload);
      expect(estimate.usd).toBe(0);
      expect(estimate.warnings.length).toBeGreaterThan(0);
    }
  });
});
