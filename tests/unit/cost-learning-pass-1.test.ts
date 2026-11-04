import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { estimateEndpoint, PRICING } from "@apicity/cost";

// Each correction docs/cost-learning-pass-1.md applied, pinned to what its
// committed recording billed at the price read on 2026-11-04. Each row's source
// date moves with it, so an old rate cannot come back unnoticed.
interface Recording {
  log: {
    entries: Array<{
      request: { url: string; postData?: { text?: string } };
      response: { headers: Array<{ name: string; value: string }> };
    }>;
  };
}

const read = (recording: string) =>
  JSON.parse(
    readFileSync(`tests/recordings/${recording}/recording.har`, "utf8")
  ) as Recording;

function payloadOf(har: Recording, url: RegExp): Record<string, unknown> {
  const submit = har.log.entries.find(
    (entry) => entry.request.postData?.text && url.test(entry.request.url)
  );
  return JSON.parse(submit!.request.postData!.text!) as Record<string, unknown>;
}

function billableUnits(har: Recording): number {
  for (const entry of har.log.entries) {
    const header = entry.response.headers.find(
      ({ name }) => name.toLowerCase() === "x-fal-billable-units"
    );
    if (header) return Number(header.value);
  }
  throw new Error("no x-fal-billable-units header");
}

const FAL = "fal_2801268556";

describe("fal corrections, at header units x the price on 2026-11-04", () => {
  it.each([
    // The card's floor: requests under 100 steps bill 100 step units.
    [
      "minimax/h3/t2v/trainer",
      "minimax.h3.t2v.trainer",
      `${FAL}/minimax-h3-t2v-trainer_2342852863`,
      0.005,
    ],
    // The October promotion ended, and these are November's rates.
    [
      "minimax/h3-max/text-to-video",
      "minimax.h3Max.textToVideo",
      `${FAL}/minimax-h3-max-text-to-video_447311577`,
      0.035,
    ],
    [
      "minimax/h3-max/image-to-video",
      "minimax.h3Max.imageToVideo",
      `${FAL}/minimax-h3-max-image-to-video_2398423055`,
      0.035,
    ],
    [
      "minimax/h3-max/camera-controls",
      "minimax.h3Max.cameraControls",
      `${FAL}/minimax-h3-max-camera-controls_1794456208`,
      0.035,
    ],
    [
      "minimax/h3-max-turbo/text-to-video",
      "minimax.h3MaxTurbo.textToVideo",
      `${FAL}/minimax-h3-max-turbo-text-to-video_3773243928`,
      0.0175,
    ],
    [
      "minimax/h3-max-turbo/image-to-video",
      "minimax.h3MaxTurbo.imageToVideo",
      `${FAL}/minimax-h3-max-turbo-image-to-video_2916983732`,
      0.0175,
    ],
    // HeyGen's 50% promotion ended on 2026-10-31.
    [
      "heygen/heygen-video/text-to-video",
      "heygen.heygenVideo.textToVideo",
      `${FAL}/heygen-heygen-video-text-to-video_1533684490`,
      0.02,
    ],
    [
      "heygen/heygen-video/image-to-video",
      "heygen.heygenVideo.imageToVideo",
      `${FAL}/heygen-heygen-video-image-to-video_1809742078`,
      0.02,
    ],
    [
      "heygen/heygen-video/reference-to-video",
      "heygen.heygenVideo.referenceToVideo",
      `${FAL}/heygen-heygen-video-reference-to-video_2977972174`,
      0.02,
    ],
    [
      "mureka/api/generate/lyrics",
      "mureka.api.generate.lyrics",
      `${FAL}/mureka-api-generate-lyrics_2266682748`,
      0.009,
    ],
    [
      "mureka/api/generate/song",
      "mureka.api.generate.song",
      `${FAL}/mureka-api-generate-song_929644469`,
      0.005,
    ],
    [
      "fal-ai/nano-banana",
      "nanoBanana.textToImage",
      `${FAL}/nano-banana_3829801939`,
      0.0398,
    ],
    [
      "fal-ai/nano-banana/edit",
      "nanoBanana.edit",
      `${FAL}/nano-banana-edit_1168630294`,
      0.0398,
    ],
  ])("%s", (key, dotPath, recording, price) => {
    const har = read(recording);
    const estimate = estimateEndpoint({
      provider: "fal",
      method: "POST",
      dotPath,
      payload: payloadOf(har, /fal\.run|fal\.ai/),
    });
    expect(estimate.status).toBe("priced");
    expect(estimate.usd).toBeCloseTo(billableUnits(har) * price, 6);
    expect(PRICING.fal[key]!.source?.asOf).toBe("2026-11-04");
  });

  it("floors a trainer's billed steps at 100, and counts more as asked", () => {
    const dotPath = "minimax.h3.t2v.trainer";
    const usd = (number_of_steps?: number) =>
      estimateEndpoint({
        provider: "fal",
        method: "POST",
        dotPath,
        payload: { training_data_url: "https://x", number_of_steps },
      }).usd;
    expect(usd(1)).toBeCloseTo(0.5, 6);
    expect(usd(99)).toBeCloseTo(0.5, 6);
    expect(usd(101)).toBeCloseTo(0.505, 6);
    expect(usd()).toBeCloseTo(10, 6);
  });

  it("states the whole Mureka song grid from the card", () => {
    expect(PRICING.fal["mureka/api/generate/song"]).toMatchObject({
      rates: {
        "mureka-7.6|lyrics": 0.03,
        "mureka-o2|lyrics": 0.045,
        "mureka-8|lyrics": 0.045,
        "mureka-9|lyrics": 0.045,
        "mureka-9.5|lyrics": 0.15,
        "mureka-7.6|prompt": 0.3,
        "mureka-o2|prompt": 0.3,
        "mureka-8|prompt": 0.3,
        "mureka-9|prompt": 0.3,
        "mureka-9.5|prompt": 0.5,
      },
    });
  });
});

describe("KIE corrections", () => {
  it("prices pixverse-v6/reference-to-video at the 4 credits its recording billed", () => {
    const har = read(
      "kie_2079838932/pixverse-v6-reference-to-video_2396754018"
    );
    const estimate = estimateEndpoint({
      provider: "kie",
      method: "POST",
      dotPath: "api.v1.jobs.createTask",
      payload: payloadOf(har, /createTask/),
    });
    expect(estimate.usd).toBeCloseTo(4 * 0.005, 6);
    expect(PRICING.kie["pixverse-v6/reference-to-video"]!.source?.asOf).toBe(
      "2026-11-04"
    );
  });

  it("gives reference-to-video the shared ladder the feed now prints", () => {
    const rates = (key: string) =>
      (PRICING.kie[key] as unknown as { rates: Record<string, number> }).rates;
    expect(rates("pixverse-v6/reference-to-video")).toEqual(
      rates("pixverse-v6/text-to-video")
    );
  });
});
