import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classifyEstimate, estimateEndpoint, PRICING } from "@apicity/cost";

// Each correction docs/cost-learning-pass-1.md applied, pinned to what its
// committed recording billed at the price read on 2026-11-04. Each row's source
// date moves with it, so an old rate cannot come back unnoticed.
interface Recording {
  log: {
    entries: Array<{
      request: { url: string; postData?: { text?: string } };
      response: {
        headers: Array<{ name: string; value: string }>;
        content?: { text?: string };
      };
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

it("matches the November Seedance US usage receipt", () => {
  const receipt = JSON.parse(
    readFileSync("docs/receipts/fal-seedance-us-2026-11-07.json", "utf8")
  ) as {
    request: Record<string, unknown>;
    usage: {
      time_series: Array<{
        results: Array<{
          endpoint_id: string;
          quantity: number;
          unit_price: number;
          cost_total: number;
        }>;
      }>;
    };
  };
  const bill = receipt.usage.time_series[0].results[0];
  expect(bill.endpoint_id).toBe("bytedance/seedance-2.5/us/text-to-video");
  expect(bill.unit_price).toBe(0.0214);
  expect(bill.cost_total).toBeCloseTo(bill.quantity * bill.unit_price, 8);
  const estimate = estimateEndpoint({
    provider: "fal",
    method: "POST",
    dotPath: "bytedance.seedance2p5.us.textToVideo",
    payload: receipt.request,
  });
  expect(estimate.status).toBe("priced");
  expect(estimate.usd).toBeCloseTo(bill.cost_total, 8);
});

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

// The three rows the pass left open, as ac-1m1poe settled them. fal states no
// USD on a call, so header units x a rate is the bill.
describe("fal rows the pass left open", () => {
  const responseOf = (har: Recording) =>
    JSON.parse(har.log.entries[0]!.response.content!.text!) as {
      video: { height: number; duration: number; num_frames: number };
    };

  it("prices Grok video extend at the bill its source explains", () => {
    const har = read(`${FAL}/xai-grok-imagine-video-extend-video_332223061`);
    const payload = payloadOf(har, /fal\.run/);
    const dotPath = "xai.grokImagineVideo.extendVideo";

    // tests/fixtures/jump.mp4 is 193 frames at 480p, and 4 new seconds at 24 fps
    // make the 289 frames the call returned, so the source ran 8 s.
    expect(payload.duration).toBe(4);
    const { video } = responseOf(har);
    expect(video.height).toBe(480);
    expect(video.num_frames).toBe(193 + 4 * 24);

    const hinted = estimateEndpoint({
      provider: "fal",
      method: "POST",
      dotPath,
      payload,
      costHints: { inputDurationSeconds: 8, inputResolution: "480p" },
    });
    expect(hinted.status).toBe("priced");
    expect(hinted.usd).toBeCloseTo(billableUnits(har) * 0.05, 6);
    expect(hinted.warnings).toEqual([]);
    expect(
      PRICING.fal["xai/grok-imagine-video/extend-video"]!.source?.asOf
    ).toBe("2026-11-04");

    // Without its source there is no figure, where this row used to quote 0.20.
    const bare = estimateEndpoint({
      provider: "fal",
      method: "POST",
      dotPath,
      payload,
    });
    expect(bare.usd).toBe(0);
    expect(bare.status).toBe("unavailable");
    expect(classifyEstimate(bare)).toBe("prohibitive");
    expect(bare.warnings[0]).toContain("costHints.inputDurationSeconds");
  });

  it("calls GPT Image 1.5's per-image price a floor under its bill", () => {
    const har = read(`${FAL}/gpt-image-1-5_4206709809`);
    const estimate = estimateEndpoint({
      provider: "fal",
      method: "POST",
      dotPath: "gptImage1p5",
      payload: payloadOf(har, /fal\.run/),
    });
    expect(estimate.usd).toBe(0.009);
    // Billed at $1 per unit: more than the image, by tokens the call never states.
    expect(billableUnits(har)).toBe(0.02);
    expect(estimate.usd).toBeLessThan(billableUnits(har));
    expect(estimate.warnings[0]).toContain("this estimate is a floor");
  });

  // Reprice October's recorded units at the US rate billed on 2026-11-07.
  // This is today's estimate, not a rewrite of October's historical bill.
  it.each([
    [
      "bytedance/seedance-2.5/us/text-to-video",
      "bytedance.seedance2p5.us.textToVideo",
      `${FAL}/bytedance-seedance2p5-us-text-to-video_2222117863`,
      undefined,
      0.83032,
    ],
    [
      "bytedance/seedance-2.5/us/reference-to-video",
      "bytedance.seedance2p5.us.referenceToVideo",
      `${FAL}/bytedance-seedance2p5-us-reference-to-video_2741595005`,
      { inputDurationSeconds: 4 },
      0.991248,
    ],
  ])(
    "reprices %s at the November US bill rate",
    (key, dotPath, recording, costHints, billedUsd) => {
      const har = read(recording);
      const estimate = estimateEndpoint({
        provider: "fal",
        method: "POST",
        dotPath,
        payload: payloadOf(har, /fal\.run/),
        ...(costHints ? { costHints } : {}),
      });
      expect(estimate.status).toBe("priced");
      expect(estimate.usd).toBeCloseTo(billedUsd, 6);
      expect(billableUnits(har) * 0.0214).toBeCloseTo(billedUsd, 6);
      expect(PRICING.fal[key]).toMatchObject({
        rates: { "480p": 0.0214 / 1000 },
      });
    }
  );
});

// An edit bills both videos, and usage.duration, "used for billing", says so.
describe("Alibaba wan2.7-videoedit", () => {
  const har = read("alibaba_1329897167/wan-videoedit_1470878067");
  const payload = payloadOf(har, /video-synthesis/);
  const { usage } = JSON.parse(
    har.log.entries.at(-1)!.response.content!.text!
  ) as {
    usage: {
      duration: number;
      input_video_duration: number;
      output_video_duration: number;
    };
  };
  const estimate = (costHints?: Record<string, unknown>) =>
    estimateEndpoint({
      provider: "alibaba",
      method: "POST",
      dotPath: "api.v1.services.aigc.videoGeneration.videoSynthesis",
      payload,
      costHints: { alibabaDeploymentScope: "International", ...costHints },
    });

  it("prices its recording's source and output at the seconds it reported", () => {
    expect(payload.parameters).toMatchObject({ resolution: "720P" });
    expect(payload.parameters).not.toHaveProperty("duration");
    expect(usage).toMatchObject({
      duration: 10.04,
      input_video_duration: 5.02,
      output_video_duration: 5.02,
    });
    const priced = estimate({
      inputDurationSeconds: usage.input_video_duration,
    });
    expect(priced.status).toBe("priced");
    expect(priced.breakdown).toMatchObject({
      units: usage.duration,
      perUnitUsd: 0.1,
    });
    expect(priced.usd).toBeCloseTo(1.004, 10);
  });

  it("gives no figure without its source's length, where it once assumed 5 s", () => {
    const bare = estimate();
    expect(bare.usd).toBe(0);
    expect(bare.status).toBe("unavailable");
    expect(classifyEstimate(bare)).toBe("prohibitive");
    expect(bare.warnings[0]).toContain("costHints.inputDurationSeconds");
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
