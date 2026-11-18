import { afterEach, describe, expect, it, vi } from "vitest";

import { createWaveSpeed, WaveSpeedError } from "@apicity/wavespeed";
import {
  WaveSpeedAlibabaHappyhorse1p0VideoEditRequestSchema,
  WaveSpeedAlibabaHappyhorse1p1ImageToVideoRequestSchema,
  WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoRequestSchema,
  WaveSpeedAlibabaWan2p7VideoEditRequestSchema,
  WaveSpeedAlibabaWan3p0ImageToVideoRequestSchema,
  WaveSpeedAlibabaWan3p0ReferenceToVideoRequestSchema,
  WaveSpeedAlibabaWan3p0TextToVideoRequestSchema,
  WaveSpeedAlibabaWan3p0VideoEditRequestSchema,
  WaveSpeedBlackForestLabsFlux3ImageToVideoRequestSchema,
  WaveSpeedBlackForestLabsFlux3TextToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p0ImageToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p0ReferenceToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p0TextToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p0VideoEditRequestSchema,
  WaveSpeedBytedanceSeedance2p5ImageToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p5ReferenceToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p5TextToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p5VideoEditRequestSchema,
  WaveSpeedBytedanceSeedreamV5p5EditRequestSchema,
  WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p2FlashReferenceToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p2FlashTextToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p1FlashVideoEditRequestSchema,
  WaveSpeedGoogleGeminiOmni1p2FlashVideoEditRequestSchema,
  WaveSpeedGoogleNanoBanana2p1EditRequestSchema,
  WaveSpeedGoogleNanoBanana2p1TextToImageRequestSchema,
  WaveSpeedHeygenVideo1p0ReferenceToVideoRequestSchema,
  WaveSpeedHeygenVideo1p0TextToVideoRequestSchema,
  WaveSpeedKwaivgiKlingVideoO3ProVideoEditRequestSchema,
  WaveSpeedMinimaxH3ImageToVideoRequestSchema,
  WaveSpeedMinimaxH3ReferenceToVideoRequestSchema,
  WaveSpeedMinimaxH3TextToVideoRequestSchema,
  WaveSpeedOpenaiGptImage2p5FlareTextToImageRequestSchema,
  WaveSpeedOpenaiGptImage2TextToImageRequestSchema,
  WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequestSchema,
  WaveSpeedOpenaiGptImage2p6FlareEditRequestSchema,
  WaveSpeedOpenaiGptImage2p6FlareTextToImageRequestSchema,
  WaveSpeedOpenaiGptImage2p6SunburstEditRequestSchema,
  WaveSpeedOpenaiGptImage2p6SunburstTextToImageRequestSchema,
  WaveSpeedPredictionStatusSchema,
  WaveSpeedPrunaAiPVideo2ProImageToVideoRequestSchema,
  WaveSpeedRunwaymlAleph2RequestSchema,
  WaveSpeedSkyworkAiSkyreelsV4TextToVideoRequestSchema,
  WaveSpeedWavespeedAiMinimaxH3VideoEditRequestSchema,
  WaveSpeedXAiGrokImagineImageV2p0TextToImageRequestSchema,
  WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoRequestSchema,
  WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoRequestSchema,
} from "@apicity/wavespeed/zod";

interface CapturedRequest {
  url: string;
  init: RequestInit;
}

function capture(respond: () => Response) {
  const requests: CapturedRequest[] = [];
  const fetch: typeof globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init: init ?? {} });
    return respond();
  };
  return { requests, fetch };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// The documented history sample, as a result read answers it.
const COMPLETED = {
  code: 200,
  message: "success",
  data: {
    id: "e6832d4abffb4d79bfbca19783fca133",
    model: "wavespeed-ai/z-image/turbo",
    outputs: ["https://example.com/output/example.jpeg"],
    urls: {
      get: "https://api.wavespeed.ai/api/v3/predictions/e6832d4abffb4d79bfbca19783fca133/result",
    },
    status: "completed",
    created_at: "2025-05-19T06:09:15.948268264Z",
    error: "",
    timings: { inference: 25729 },
  },
};

// Never answers; rejects once the request's signal aborts.
const hangingFetch: typeof globalThis.fetch = (_url, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener(
      "abort",
      () => reject(new Error("aborted")),
      { once: true }
    );
  });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("wavespeed provider", () => {
  it("exposes the prediction result read as a function", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed)).toEqual(["api"]);
    expect(Object.keys(wavespeed.api)).toEqual(["v3"]);
    expect(Object.keys(wavespeed.api.v3)).toEqual([
      "predictions",
      "alibaba",
      "heygen",
      "minimax",
      "bytedance",
      "blackForestLabs",
      "google",
      "xAi",
      "wavespeedAi",
      "runwayml",
      "kwaivgi",
      "openai",
      "prunaAi",
      "skyworkAi",
    ]);
    expect(Object.keys(wavespeed.api.v3.predictions)).toEqual(["result"]);
    expect(typeof wavespeed.api.v3.predictions.result).toBe("function");
  });

  it("reads a prediction with the key as a Bearer token", async () => {
    const { requests, fetch } = capture(() => jsonResponse(COMPLETED));
    const wavespeed = createWaveSpeed({ apiKey: "ws-key", fetch });

    await expect(
      wavespeed.api.v3.predictions.result(COMPLETED.data.id)
    ).resolves.toEqual(COMPLETED);

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(
      "https://api.wavespeed.ai/api/v3/predictions/e6832d4abffb4d79bfbca19783fca133/result"
    );
    expect(requests[0].init.method).toBe("GET");
    expect(requests[0].init.headers).toEqual({
      Authorization: "Bearer ws-key",
    });
    expect(requests[0].init.body).toBeUndefined();
  });

  it("strips trailing slashes from baseURL and encodes the id", async () => {
    const { requests, fetch } = capture(() => jsonResponse(COMPLETED));
    const wavespeed = createWaveSpeed({
      apiKey: "ws-key",
      baseURL: "https://wavespeed.test//",
      fetch,
    });

    await wavespeed.api.v3.predictions.result("a/b c");

    expect(requests[0].url).toBe(
      "https://wavespeed.test/api/v3/predictions/a%2Fb%20c/result"
    );
  });

  it("reads WAVESPEED_API_KEY when no apiKey is passed", async () => {
    vi.stubEnv("WAVESPEED_API_KEY", "env-key");
    const { requests, fetch } = capture(() => jsonResponse(COMPLETED));

    await createWaveSpeed({ fetch }).api.v3.predictions.result("abc");

    expect(requests[0].init.headers).toEqual({
      Authorization: "Bearer env-key",
    });
  });

  it("rejects without a key before sending anything", async () => {
    vi.stubEnv("WAVESPEED_API_KEY", "");
    const { requests, fetch } = capture(() => jsonResponse(COMPLETED));

    const error = await createWaveSpeed({ fetch })
      .api.v3.predictions.result("abc")
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WaveSpeedError);
    expect(error).toMatchObject({
      name: "WaveSpeedError",
      message:
        "WaveSpeed API key is required. Pass apiKey or set WAVESPEED_API_KEY.",
      status: 401,
    });
    expect(requests).toHaveLength(0);
  });

  it("rejects an error envelope with its status, code and message", async () => {
    const body = { code: 404, message: "Prediction not found." };
    const { fetch } = capture(() => jsonResponse(body, 404));

    const error = await createWaveSpeed({ apiKey: "ws-key", fetch })
      .api.v3.predictions.result("abc")
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WaveSpeedError);
    expect(error).toMatchObject({
      name: "WaveSpeedError",
      message: "WaveSpeed API error 404: Prediction not found.",
      status: 404,
      code: 404,
      body,
    });
  });

  it("redacts the key from an error body that echoes it", async () => {
    const { fetch } = capture(() =>
      jsonResponse({ code: 401, message: "Invalid API key ws-key." }, 401)
    );

    const error = (await createWaveSpeed({ apiKey: "ws-key", fetch })
      .api.v3.predictions.result("abc")
      .catch((caught: unknown) => caught)) as WaveSpeedError;

    expect(error.message).toBe(
      "WaveSpeed API error 401: Invalid API key [REDACTED]."
    );
    expect(error.code).toBe(401);
    expect(JSON.stringify(error.body)).not.toContain("ws-key");
  });

  it("rejects a non-JSON error with its status and a bounded message", async () => {
    const page = `<html>${"x".repeat(500)}</html>`;
    const { fetch } = capture(() => new Response(page, { status: 502 }));

    const error = (await createWaveSpeed({ apiKey: "ws-key", fetch })
      .api.v3.predictions.result("abc")
      .catch((caught: unknown) => caught)) as WaveSpeedError;

    expect(error).toMatchObject({
      name: "WaveSpeedError",
      status: 502,
      body: page,
    });
    expect(error.code).toBeUndefined();
    expect(error.message).toBe(
      `WaveSpeed API error 502: ${page.slice(0, 200)}`
    );
  });

  it("reports a timeout as 408, a caller abort as 499 and no response as 500", async () => {
    await expect(
      createWaveSpeed({
        apiKey: "ws-key",
        timeout: 1,
        fetch: hangingFetch,
      }).api.v3.predictions.result("abc")
    ).rejects.toMatchObject({ status: 408 });

    const caller = new AbortController();
    const pending = createWaveSpeed({
      apiKey: "ws-key",
      fetch: hangingFetch,
    }).api.v3.predictions.result("abc", caller.signal);
    caller.abort();
    await expect(pending).rejects.toMatchObject({ status: 499 });

    await expect(
      createWaveSpeed({
        apiKey: "ws-key",
        fetch: async () => {
          throw new TypeError("fetch failed");
        },
      }).api.v3.predictions.result("abc")
    ).rejects.toMatchObject({
      message: "WaveSpeed request failed: fetch failed",
      status: 500,
    });
  });

  it("lists the documented prediction statuses", () => {
    expect(WaveSpeedPredictionStatusSchema.options).toEqual([
      "created",
      "processing",
      "completed",
      "failed",
      "cancelled",
      "timeout",
      "deleted",
    ]);
    expect(WaveSpeedPredictionStatusSchema.safeParse("queued").success).toBe(
      false
    );
  });
});

describe("wavespeed alibaba/wan-3.0/text-to-video", () => {
  // The payload tests/integration/wavespeed-alibaba-wan-3-0-text-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "A red paper boat drifts across a calm pond at sunrise.",
    resolution: "480p",
    duration: 2,
    generate_audio: false,
  };

  it("posts the request as JSON to the model's URL", async () => {
    const created = {
      code: 200,
      message: "success",
      data: { id: "abc", model: "alibaba/wan-3.0/text-to-video" },
    };
    const { requests, fetch } = capture(() => jsonResponse(created));
    const wavespeed = createWaveSpeed({ apiKey: "ws-key", fetch });

    await expect(
      wavespeed.api.v3.alibaba.wan3p0.textToVideo({
        prompt: RECORDED.prompt,
        resolution: "480p",
        duration: 2,
        generate_audio: false,
      })
    ).resolves.toEqual(created);

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(
      "https://api.wavespeed.ai/api/v3/alibaba/wan-3.0/text-to-video"
    );
    expect(requests[0].init.method).toBe("POST");
    expect(requests[0].init.headers).toEqual({
      Authorization: "Bearer ws-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(requests[0].init.body))).toEqual(RECORDED);
  });

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(wavespeed.api.v3.alibaba.wan3p0.textToVideo.schema).toBe(
      WaveSpeedAlibabaWan3p0TextToVideoRequestSchema
    );
    expect(
      WaveSpeedAlibabaWan3p0TextToVideoRequestSchema.safeParse(RECORDED).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "360p"],
      ["aspect_ratio", "21:9"],
      ["duration", 1],
      ["duration", 31],
      ["duration", 2.5],
    ] as const) {
      expect(
        WaveSpeedAlibabaWan3p0TextToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        `${field} ${value}`
      ).toBe(false);
    }
    expect(
      WaveSpeedAlibabaWan3p0TextToVideoRequestSchema.safeParse({
        resolution: "480p",
      }).success
    ).toBe(false);
  });
});

describe("wavespeed heygen/video-1.0/image-to-video", () => {
  const schema = createWaveSpeed({ apiKey: "ws-key" }).api.v3.heygen.video1p0
    .imageToVideo.schema;
  const minimal = {
    image: "https://example.com/cat.jpg",
    prompt: "Cat blinks.",
  };

  it("accepts the required fields and documented upper limits", () => {
    expect(schema.safeParse(minimal).success).toBe(true);
    expect(
      schema.safeParse({
        ...minimal,
        duration: 15,
        resolution: "2k",
        seed: 2147483647,
        prompt_enhancement: "quality",
      }).success
    ).toBe(true);
  });

  it.each([
    ["image", ""],
    ["prompt", ""],
    ["prompt", "a".repeat(32001)],
    ["duration", 4],
    ["duration", 16],
    ["duration", 5.5],
    ["resolution", "720p"],
    ["prompt_enhancement", "on"],
    ["seed", -1],
    ["seed", 2147483648],
  ])("rejects an out-of-range %s", (field, value) => {
    expect(schema.safeParse({ ...minimal, [field]: value }).success).toBe(
      false
    );
  });
});

describe("wavespeed heygen/video-1.0/text-to-video", () => {
  // The payload tests/integration/wavespeed-heygen-video-1-0-text-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "A red paper boat drifts across a calm pond at sunrise.",
    duration: 5,
    resolution: "480p",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(wavespeed.api.v3.heygen.video1p0.textToVideo.schema).toBe(
      WaveSpeedHeygenVideo1p0TextToVideoRequestSchema
    );
    expect(
      WaveSpeedHeygenVideo1p0TextToVideoRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "720p"],
      ["aspect_ratio", "2:1"],
      ["duration", 4],
      ["duration", 16],
      ["prompt_enhancement", "max"],
      ["seed", -1],
    ] as const) {
      expect(
        WaveSpeedHeygenVideo1p0TextToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        `${field} ${value}`
      ).toBe(false);
    }
  });
});

describe("wavespeed minimax/h3/text-to-video", () => {
  // The payload tests/integration/wavespeed-minimax-h3-text-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "A red paper boat drifts across a calm pond at sunrise.",
    resolution: "768p",
    duration: 4,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(wavespeed.api.v3.minimax.h3.textToVideo.schema).toBe(
      WaveSpeedMinimaxH3TextToVideoRequestSchema
    );
    expect(
      WaveSpeedMinimaxH3TextToVideoRequestSchema.safeParse(RECORDED).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "1080p"],
      ["aspect_ratio", "2:1"],
      ["duration", 3],
      ["duration", 16],
      ["duration", 4.5],
    ] as const) {
      expect(
        WaveSpeedMinimaxH3TextToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        `${field} ${value}`
      ).toBe(false);
    }
  });
});

describe("wavespeed bytedance/seedance-2.5/text-to-video", () => {
  // The payload tests/integration/wavespeed-bytedance-seedance-2-5-text-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "A red paper boat drifts across a calm pond at sunrise.",
    resolution: "480p",
    duration: 4,
    generate_audio: false,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(wavespeed.api.v3.bytedance.seedance2p5.textToVideo.schema).toBe(
      WaveSpeedBytedanceSeedance2p5TextToVideoRequestSchema
    );
    expect(
      WaveSpeedBytedanceSeedance2p5TextToVideoRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/clip.mp4";
    for (const [field, value] of [
      ["resolution", "2k"],
      ["aspect_ratio", "2:1"],
      ["duration", 3],
      ["duration", 31],
      ["reference_videos", Array(11).fill(url)],
      ["reference_images", Array(31).fill(url)],
    ] as const) {
      expect(
        WaveSpeedBytedanceSeedance2p5TextToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed black-forest-labs/flux-3/text-to-video", () => {
  // The payload tests/integration/wavespeed-black-forest-labs-flux-3-text-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "A red paper boat drifts across a calm pond at sunrise.",
    resolution: "720p",
    duration: 5,
    generate_audio: false,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(wavespeed.api.v3.blackForestLabs.flux3.textToVideo.schema).toBe(
      WaveSpeedBlackForestLabsFlux3TextToVideoRequestSchema
    );
    expect(
      WaveSpeedBlackForestLabsFlux3TextToVideoRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "480p"],
      ["aspect_ratio", "5:2"],
      ["duration", 4],
      ["duration", 21],
    ] as const) {
      expect(
        WaveSpeedBlackForestLabsFlux3TextToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        `${field} ${value}`
      ).toBe(false);
    }
  });
});

describe("wavespeed bytedance/seedance-2.0/text-to-video", () => {
  // The payload tests/integration/wavespeed-bytedance-seedance-2-0-text-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "A red paper boat drifts across a calm pond at sunrise.",
    resolution: "480p",
    duration: 4,
    generate_audio: false,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.bytedance)).toEqual([
      "seedance2p5",
      "seedance2p0",
      "seedreamV5p5",
    ]);
    expect(wavespeed.api.v3.bytedance.seedance2p0.textToVideo.schema).toBe(
      WaveSpeedBytedanceSeedance2p0TextToVideoRequestSchema
    );
    expect(
      WaveSpeedBytedanceSeedance2p0TextToVideoRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/clip.mp4";
    for (const [field, value] of [
      ["resolution", "2k"],
      ["aspect_ratio", "2:1"],
      ["duration", 3],
      ["duration", 16],
      ["reference_videos", Array(4).fill(url)],
      ["reference_images", Array(10).fill(url)],
    ] as const) {
      expect(
        WaveSpeedBytedanceSeedance2p0TextToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed google/gemini-omni-1.1-flash/text-to-video", () => {
  // The payload tests/integration/wavespeed-google-gemini-omni-1-1-flash-text-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "A red paper boat drifts across a calm pond at sunrise.",
    resolution: "360p",
    duration: 3,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(wavespeed.api.v3.google.geminiOmni1p1Flash.textToVideo.schema).toBe(
      WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequestSchema
    );
    expect(
      WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "480p"],
      ["aspect_ratio", "1:1"],
      ["duration", 2],
      ["duration", 11],
    ] as const) {
      expect(
        WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        `${field} ${value}`
      ).toBe(false);
    }
  });
});

describe("wavespeed google/gemini-omni-1.2-flash/text-to-video", () => {
  // The payload tests/integration/wavespeed-google-gemini-omni-1-2-flash-text-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "A red paper boat drifts across a calm pond at sunrise.",
    resolution: "360p",
    duration: 3,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(wavespeed.api.v3.google.geminiOmni1p2Flash.textToVideo.schema).toBe(
      WaveSpeedGoogleGeminiOmni1p2FlashTextToVideoRequestSchema
    );
    expect(
      WaveSpeedGoogleGeminiOmni1p2FlashTextToVideoRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });

  it("accepts the 15-second maximum", () => {
    expect(
      WaveSpeedGoogleGeminiOmni1p2FlashTextToVideoRequestSchema.safeParse({
        ...RECORDED,
        duration: 15,
      }).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "480p"],
      ["aspect_ratio", "1:1"],
      ["duration", 2],
      ["duration", 16],
      ["duration", 3.5],
    ] as const) {
      expect(
        WaveSpeedGoogleGeminiOmni1p2FlashTextToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        `${field} ${value}`
      ).toBe(false);
    }
  });
});

describe("wavespeed minimax/h3/image-to-video", () => {
  // The payload tests/integration/wavespeed-minimax-h3-image-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "The cat slowly blinks and turns its head toward the window.",
    image:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    resolution: "768p",
    duration: 4,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.minimax.h3)).toContain("imageToVideo");
    expect(wavespeed.api.v3.minimax.h3.imageToVideo.schema).toBe(
      WaveSpeedMinimaxH3ImageToVideoRequestSchema
    );
    expect(
      WaveSpeedMinimaxH3ImageToVideoRequestSchema.safeParse(RECORDED).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "1080p"],
      ["duration", 3],
      ["duration", 16],
      ["prompt", "x".repeat(7001)],
    ] as const) {
      expect(
        WaveSpeedMinimaxH3ImageToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
    expect(
      WaveSpeedMinimaxH3ImageToVideoRequestSchema.safeParse({
        ...RECORDED,
        image: undefined,
      }).success
    ).toBe(false);
  });

  it("holds the catalog's prompt limits on the text-to-video siblings", () => {
    expect(
      WaveSpeedMinimaxH3TextToVideoRequestSchema.safeParse({
        prompt: "x".repeat(7001),
      }).success
    ).toBe(false);
    expect(
      WaveSpeedHeygenVideo1p0TextToVideoRequestSchema.safeParse({ prompt: "" })
        .success
    ).toBe(false);
    expect(
      WaveSpeedHeygenVideo1p0TextToVideoRequestSchema.safeParse({
        prompt: "x".repeat(32001),
      }).success
    ).toBe(false);
  });
});

describe("wavespeed bytedance/seedance-2.5/image-to-video", () => {
  // The payload tests/integration/wavespeed-bytedance-seedance-2-5-image-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "The cat slowly blinks and turns its head toward the window.",
    image:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    resolution: "480p",
    duration: 4,
    generate_audio: false,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.bytedance.seedance2p5)).toContain(
      "imageToVideo"
    );
    expect(wavespeed.api.v3.bytedance.seedance2p5.imageToVideo.schema).toBe(
      WaveSpeedBytedanceSeedance2p5ImageToVideoRequestSchema
    );
    expect(
      WaveSpeedBytedanceSeedance2p5ImageToVideoRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "2k"],
      ["duration", 3],
      ["duration", 31],
      ["image", undefined],
    ] as const) {
      expect(
        WaveSpeedBytedanceSeedance2p5ImageToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        `${field} ${value}`
      ).toBe(false);
    }
  });
});

describe("wavespeed google/gemini-omni-1.1-flash/image-to-video", () => {
  // The payload tests/integration/wavespeed-google-gemini-omni-1-1-flash-image-to-video.test.ts
  // recorded.
  const RECORDED = {
    image:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    prompt: "The cat slowly blinks and turns its head toward the window.",
    resolution: "360p",
    duration: 3,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.google.geminiOmni1p1Flash)).toContain(
      "imageToVideo"
    );
    expect(wavespeed.api.v3.google.geminiOmni1p1Flash.imageToVideo.schema).toBe(
      WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoRequestSchema
    );
    expect(
      WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "480p"],
      ["aspect_ratio", "1:1"],
      ["duration", 2],
      ["duration", 11],
      ["image", undefined],
    ] as const) {
      expect(
        WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        `${field} ${value}`
      ).toBe(false);
    }
  });
});

describe("wavespeed alibaba/wan-3.0/image-to-video", () => {
  // The payload tests/integration/wavespeed-alibaba-wan-3-0-image-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "The cat slowly blinks and turns its head toward the window.",
    image:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    resolution: "480p",
    duration: 2,
    generate_audio: false,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.alibaba.wan3p0)).toContain(
      "imageToVideo"
    );
    expect(wavespeed.api.v3.alibaba.wan3p0.imageToVideo.schema).toBe(
      WaveSpeedAlibabaWan3p0ImageToVideoRequestSchema
    );
    expect(
      WaveSpeedAlibabaWan3p0ImageToVideoRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "360p"],
      ["aspect_ratio", "21:9"],
      ["duration", 1],
      ["duration", 31],
      ["image", undefined],
    ] as const) {
      expect(
        WaveSpeedAlibabaWan3p0ImageToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        `${field} ${value}`
      ).toBe(false);
    }
  });
});

describe("wavespeed bytedance/seedance-2.0/image-to-video", () => {
  // The payload tests/integration/wavespeed-bytedance-seedance-2-0-image-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "The cat slowly blinks and turns its head toward the window.",
    image:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    resolution: "480p",
    duration: 4,
    generate_audio: false,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.bytedance.seedance2p0)).toEqual([
      "textToVideo",
      "imageToVideo",
      "videoEdit",
      "referenceToVideo",
    ]);
    expect(wavespeed.api.v3.bytedance.seedance2p0.imageToVideo.schema).toBe(
      WaveSpeedBytedanceSeedance2p0ImageToVideoRequestSchema
    );
    expect(
      WaveSpeedBytedanceSeedance2p0ImageToVideoRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "2k"],
      ["aspect_ratio", "2:1"],
      ["duration", 3],
      ["duration", 16],
      ["image", undefined],
    ] as const) {
      expect(
        WaveSpeedBytedanceSeedance2p0ImageToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        `${field} ${value}`
      ).toBe(false);
    }
  });
});

describe("wavespeed black-forest-labs/flux-3/image-to-video", () => {
  // The payload tests/integration/wavespeed-black-forest-labs-flux-3-image-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "The cat slowly blinks and turns its head toward the window.",
    image:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    resolution: "720p",
    duration: 5,
    generate_audio: false,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.blackForestLabs.flux3)).toEqual([
      "textToVideo",
      "imageToVideo",
    ]);
    expect(wavespeed.api.v3.blackForestLabs.flux3.imageToVideo.schema).toBe(
      WaveSpeedBlackForestLabsFlux3ImageToVideoRequestSchema
    );
    expect(
      WaveSpeedBlackForestLabsFlux3ImageToVideoRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "480p"],
      ["aspect_ratio", "5:2"],
      ["duration", 4],
      ["duration", 21],
      ["image", undefined],
    ] as const) {
      expect(
        WaveSpeedBlackForestLabsFlux3ImageToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        `${field} ${value}`
      ).toBe(false);
    }
  });
});

describe("wavespeed x-ai/grok-imagine-video-v1.5/image-to-video", () => {
  // The payload tests/integration/wavespeed-x-ai-grok-imagine-video-v1-5-image-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "The cat slowly blinks and turns its head toward the window.",
    image:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    duration: 1,
    resolution: "480p",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(wavespeed.api.v3.xAi.grokImagineVideoV1p5.imageToVideo.schema).toBe(
      WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoRequestSchema
    );
    expect(
      WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "360p"],
      ["duration", 0],
      ["duration", 16],
      ["image", undefined],
    ] as const) {
      expect(
        WaveSpeedXAiGrokImagineVideoV1p5ImageToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        `${field} ${value}`
      ).toBe(false);
    }
  });
});

describe("wavespeed alibaba/happyhorse-1.1/image-to-video", () => {
  // The payload tests/integration/wavespeed-alibaba-happyhorse-1-1-image-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "The cat slowly blinks and turns its head toward the window.",
    image:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    resolution: "480p",
    duration: 3,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.alibaba)).toEqual([
      "wan3p0",
      "happyhorse1p1",
      "happyhorse1p0",
      "wan2p7",
    ]);
    expect(wavespeed.api.v3.alibaba.happyhorse1p1.imageToVideo.schema).toBe(
      WaveSpeedAlibabaHappyhorse1p1ImageToVideoRequestSchema
    );
    expect(
      WaveSpeedAlibabaHappyhorse1p1ImageToVideoRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "360p"],
      ["duration", 2],
      ["duration", 16],
      ["prompt", "x".repeat(2501)],
      ["image", undefined],
    ] as const) {
      expect(
        WaveSpeedAlibabaHappyhorse1p1ImageToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed alibaba/wan-3.0/video-edit", () => {
  // The payload tests/integration/wavespeed-alibaba-wan-3-0-video-edit.test.ts
  // recorded.
  const RECORDED = {
    prompt: "Make the cat's fur bright orange.",
    video:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1-kling-o3-3s.mp4",
    resolution: "480p",
    duration: 2,
    generate_audio: false,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.alibaba.wan3p0)).toContain("videoEdit");
    expect(wavespeed.api.v3.alibaba.wan3p0.videoEdit.schema).toBe(
      WaveSpeedAlibabaWan3p0VideoEditRequestSchema
    );
    expect(
      WaveSpeedAlibabaWan3p0VideoEditRequestSchema.safeParse(RECORDED).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.jpg";
    for (const [field, value] of [
      ["resolution", "360p"],
      ["duration", 1],
      ["duration", 16],
      ["reference_images", Array(11).fill(url)],
      ["video", undefined],
    ] as const) {
      expect(
        WaveSpeedAlibabaWan3p0VideoEditRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed alibaba/wan-3.0/reference-to-video", () => {
  // The payload
  // tests/integration/wavespeed-alibaba-wan-3-0-reference-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt:
      "The cat from the reference image walks across a sunlit wooden floor.",
    reference_images: [
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    ],
    resolution: "480p",
    duration: 2,
    generate_audio: false,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.alibaba.wan3p0)).toEqual([
      "textToVideo",
      "imageToVideo",
      "videoEdit",
      "referenceToVideo",
    ]);
    expect(wavespeed.api.v3.alibaba.wan3p0.referenceToVideo.schema).toBe(
      WaveSpeedAlibabaWan3p0ReferenceToVideoRequestSchema
    );
    expect(
      WaveSpeedAlibabaWan3p0ReferenceToVideoRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.mp4";
    for (const [field, value] of [
      ["resolution", "360p"],
      ["aspect_ratio", "21:9"],
      ["duration", 1],
      ["duration", 31],
      ["reference_images", Array(11).fill(url)],
      ["reference_videos", Array(6).fill(url)],
      ["reference_audios", Array(6).fill(url)],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedAlibabaWan3p0ReferenceToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed bytedance/seedance-2.5/video-edit", () => {
  // The payload
  // tests/integration/wavespeed-bytedance-seedance-2-5-video-edit.test.ts
  // recorded.
  const RECORDED = {
    prompt: "Make the cat's fur bright orange.",
    video:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1-kling-o3-3s.mp4",
    resolution: "480p",
    generate_audio: false,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.bytedance.seedance2p5)).toContain(
      "videoEdit"
    );
    expect(wavespeed.api.v3.bytedance.seedance2p5.videoEdit.schema).toBe(
      WaveSpeedBytedanceSeedance2p5VideoEditRequestSchema
    );
    expect(
      WaveSpeedBytedanceSeedance2p5VideoEditRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.jpg";
    for (const [field, value] of [
      ["resolution", "360p"],
      ["reference_images", Array(31).fill(url)],
      ["reference_audios", Array(11).fill(url)],
      ["video", undefined],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedBytedanceSeedance2p5VideoEditRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed heygen/video-1.0/reference-to-video", () => {
  // The payload
  // tests/integration/wavespeed-heygen-video-1-0-reference-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt:
      "The cat from the reference image walks across a sunlit wooden floor.",
    reference_images: [
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    ],
    duration: 5,
    resolution: "480p",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.heygen.video1p0)).toEqual([
      "textToVideo",
      "imageToVideo",
      "referenceToVideo",
    ]);
    expect(wavespeed.api.v3.heygen.video1p0.referenceToVideo.schema).toBe(
      WaveSpeedHeygenVideo1p0ReferenceToVideoRequestSchema
    );
    expect(
      WaveSpeedHeygenVideo1p0ReferenceToVideoRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.mp4";
    for (const [field, value] of [
      ["resolution", "720p"],
      ["aspect_ratio", "1:1"],
      ["prompt_enhancement", "fast"],
      ["duration", 4],
      ["duration", 16],
      ["seed", -1],
      ["prompt", ""],
      ["reference_images", Array(10).fill(url)],
      ["reference_videos", Array(4).fill(url)],
      ["reference_audios", Array(4).fill(url)],
    ] as const) {
      expect(
        WaveSpeedHeygenVideo1p0ReferenceToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed google/gemini-omni-1.1-flash/video-edit", () => {
  // The payload
  // tests/integration/wavespeed-google-gemini-omni-1-1-flash-video-edit.test.ts
  // recorded.
  const RECORDED = {
    video:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1-kling-o3-3s.mp4",
    prompt: "Make the cat's fur bright orange.",
    resolution: "360p",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.google.geminiOmni1p1Flash)).toEqual([
      "textToVideo",
      "imageToVideo",
      "videoEdit",
      "referenceToVideo",
    ]);
    expect(wavespeed.api.v3.google.geminiOmni1p1Flash.videoEdit.schema).toBe(
      WaveSpeedGoogleGeminiOmni1p1FlashVideoEditRequestSchema
    );
    expect(
      WaveSpeedGoogleGeminiOmni1p1FlashVideoEditRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "480p"],
      ["video", undefined],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedGoogleGeminiOmni1p1FlashVideoEditRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed google/gemini-omni-1.2-flash/video-edit", () => {
  // The payload
  // tests/integration/wavespeed-google-gemini-omni-1-2-flash-video-edit.test.ts
  // recorded.
  const RECORDED = {
    video:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1-kling-o3-3s.mp4",
    prompt: "Make the cat's fur bright orange.",
    resolution: "360p",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(wavespeed.api.v3.google.geminiOmni1p2Flash.videoEdit).toBeTypeOf(
      "function"
    );
    expect(wavespeed.api.v3.google.geminiOmni1p2Flash.videoEdit.schema).toBe(
      WaveSpeedGoogleGeminiOmni1p2FlashVideoEditRequestSchema
    );
    expect(
      WaveSpeedGoogleGeminiOmni1p2FlashVideoEditRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "480p"],
      ["video", undefined],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedGoogleGeminiOmni1p2FlashVideoEditRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed minimax/h3/reference-to-video", () => {
  // The payload
  // tests/integration/wavespeed-minimax-h3-reference-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt:
      "The cat from the reference image walks across a sunlit wooden floor.",
    reference_images: [
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    ],
    resolution: "768p",
    duration: 4,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.minimax.h3)).toEqual([
      "textToVideo",
      "imageToVideo",
      "referenceToVideo",
    ]);
    expect(wavespeed.api.v3.minimax.h3.referenceToVideo.schema).toBe(
      WaveSpeedMinimaxH3ReferenceToVideoRequestSchema
    );
    expect(
      WaveSpeedMinimaxH3ReferenceToVideoRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.mp4";
    for (const [field, value] of [
      ["resolution", "1080p"],
      ["aspect_ratio", "2:1"],
      ["duration", 3],
      ["duration", 16],
      ["prompt", "x".repeat(7001)],
      ["reference_images", Array(10).fill(url)],
      ["reference_videos", Array(4).fill(url)],
      ["reference_audios", Array(4).fill(url)],
    ] as const) {
      expect(
        WaveSpeedMinimaxH3ReferenceToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed wavespeed-ai/minimax-h3/video-edit", () => {
  // The payload
  // tests/integration/wavespeed-wavespeed-ai-minimax-h3-video-edit.test.ts
  // recorded.
  const RECORDED = {
    prompt: "Make the cat's fur bright orange.",
    video:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1-kling-o3-3s.mp4",
    resolution: "480p",
    duration: 3,
    generate_audio: false,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.wavespeedAi)).toEqual(["minimaxH3"]);
    expect(Object.keys(wavespeed.api.v3.wavespeedAi.minimaxH3)).toEqual([
      "videoEdit",
    ]);
    expect(wavespeed.api.v3.wavespeedAi.minimaxH3.videoEdit.schema).toBe(
      WaveSpeedWavespeedAiMinimaxH3VideoEditRequestSchema
    );
    expect(
      WaveSpeedWavespeedAiMinimaxH3VideoEditRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.jpg";
    for (const [field, value] of [
      ["resolution", "720p"],
      ["aspect_ratio", "2:1"],
      ["duration", 2],
      ["duration", 16],
      ["reference_images", Array(10).fill(url)],
      ["reference_audios", Array(4).fill(url)],
      ["video", undefined],
    ] as const) {
      expect(
        WaveSpeedWavespeedAiMinimaxH3VideoEditRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed bytedance/seedance-2.5/reference-to-video", () => {
  // The payload
  // tests/integration/wavespeed-bytedance-seedance-2-5-reference-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt:
      "The cat from the reference image walks across a sunlit wooden floor.",
    reference_images: [
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    ],
    resolution: "480p",
    duration: 4,
    generate_audio: false,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.bytedance.seedance2p5)).toEqual([
      "textToVideo",
      "imageToVideo",
      "videoEdit",
      "referenceToVideo",
    ]);
    expect(wavespeed.api.v3.bytedance.seedance2p5.referenceToVideo.schema).toBe(
      WaveSpeedBytedanceSeedance2p5ReferenceToVideoRequestSchema
    );
    expect(
      WaveSpeedBytedanceSeedance2p5ReferenceToVideoRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.mp4";
    for (const [field, value] of [
      ["resolution", "360p"],
      ["aspect_ratio", "9:21"],
      ["duration", 3],
      ["duration", 31],
      ["reference_images", Array(31).fill(url)],
      ["reference_videos", Array(11).fill(url)],
      ["reference_audios", Array(11).fill(url)],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedBytedanceSeedance2p5ReferenceToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed alibaba/happyhorse-1.0/video-edit", () => {
  // The payload
  // tests/integration/wavespeed-alibaba-happyhorse-1-0-video-edit.test.ts
  // recorded.
  const RECORDED = {
    prompt: "Make the cat's fur bright orange.",
    video:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1-kling-o3-3s.mp4",
    resolution: "720p",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.alibaba.happyhorse1p0)).toEqual([
      "videoEdit",
    ]);
    expect(wavespeed.api.v3.alibaba.happyhorse1p0.videoEdit.schema).toBe(
      WaveSpeedAlibabaHappyhorse1p0VideoEditRequestSchema
    );
    expect(
      WaveSpeedAlibabaHappyhorse1p0VideoEditRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("takes up to 5 reference images", () => {
    const url = "https://example.com/ref.jpg";

    expect(
      WaveSpeedAlibabaHappyhorse1p0VideoEditRequestSchema.safeParse({
        ...RECORDED,
        images: Array(5).fill(url),
      }).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.jpg";
    for (const [field, value] of [
      ["resolution", "480p"],
      ["images", Array(6).fill(url)],
      ["seed", 1.5],
      ["prompt", undefined],
      ["video", undefined],
    ] as const) {
      expect(
        WaveSpeedAlibabaHappyhorse1p0VideoEditRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed bytedance/seedance-2.0/video-edit", () => {
  // The payload
  // tests/integration/wavespeed-bytedance-seedance-2-0-video-edit.test.ts
  // recorded.
  const RECORDED = {
    prompt: "Make the cat's fur bright orange.",
    video:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1-kling-o3-3s.mp4",
    resolution: "480p",
    duration: 4,
    generate_audio: false,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(wavespeed.api.v3.bytedance.seedance2p0.videoEdit.schema).toBe(
      WaveSpeedBytedanceSeedance2p0VideoEditRequestSchema
    );
    expect(
      WaveSpeedBytedanceSeedance2p0VideoEditRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.jpg";
    for (const [field, value] of [
      ["resolution", "540p"],
      ["aspect_ratio", "2:1"],
      ["duration", 3],
      ["duration", 16],
      ["reference_images", Array(10).fill(url)],
      ["reference_audios", Array(4).fill(url)],
      ["prompt", undefined],
      ["video", undefined],
    ] as const) {
      expect(
        WaveSpeedBytedanceSeedance2p0VideoEditRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed bytedance/seedance-2.0/reference-to-video", () => {
  // The payload
  // tests/integration/wavespeed-bytedance-seedance-2-0-reference-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt:
      "The cat from the reference image walks across a sunlit wooden floor.",
    reference_images: [
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    ],
    resolution: "480p",
    duration: 4,
    generate_audio: false,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(wavespeed.api.v3.bytedance.seedance2p0.referenceToVideo.schema).toBe(
      WaveSpeedBytedanceSeedance2p0ReferenceToVideoRequestSchema
    );
    expect(
      WaveSpeedBytedanceSeedance2p0ReferenceToVideoRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.mp4";
    for (const [field, value] of [
      ["resolution", "360p"],
      ["aspect_ratio", "9:21"],
      ["duration", 3],
      ["duration", 16],
      ["reference_images", Array(10).fill(url)],
      ["reference_videos", Array(4).fill(url)],
      ["reference_audios", Array(4).fill(url)],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedBytedanceSeedance2p0ReferenceToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed alibaba/wan-2.7/video-edit", () => {
  // The payload
  // tests/integration/wavespeed-alibaba-wan-2-7-video-edit.test.ts recorded.
  const RECORDED = {
    prompt: "Make the cat's fur bright orange.",
    video:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1-kling-o3-3s.mp4",
    resolution: "720p",
    duration: 2,
    audio_setting: "origin",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.alibaba.wan2p7)).toEqual(["videoEdit"]);
    expect(wavespeed.api.v3.alibaba.wan2p7.videoEdit.schema).toBe(
      WaveSpeedAlibabaWan2p7VideoEditRequestSchema
    );
    expect(
      WaveSpeedAlibabaWan2p7VideoEditRequestSchema.safeParse(RECORDED).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.jpg";
    for (const [field, value] of [
      ["resolution", "480p"],
      ["duration", -1],
      ["duration", 11],
      ["audio_setting", "mute"],
      ["reference_images", Array(4).fill(url)],
      ["prompt", undefined],
      ["video", undefined],
    ] as const) {
      expect(
        WaveSpeedAlibabaWan2p7VideoEditRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed google/gemini-omni-1.1-flash/reference-to-video", () => {
  // The payload
  // tests/integration/wavespeed-google-gemini-omni-1-1-flash-reference-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt:
      "The cat from the reference image walks across a sunlit wooden floor.",
    images: [
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    ],
    resolution: "360p",
    duration: 3,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(
      wavespeed.api.v3.google.geminiOmni1p1Flash.referenceToVideo.schema
    ).toBe(WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoRequestSchema);
    expect(
      WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.mp4";
    for (const [field, value] of [
      ["resolution", "480p"],
      ["aspect_ratio", "1:1"],
      ["duration", 2],
      ["duration", 11],
      ["images", Array(11).fill(url)],
      ["reference_videos", Array(4).fill(url)],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedGoogleGeminiOmni1p1FlashReferenceToVideoRequestSchema.safeParse(
          {
            ...RECORDED,
            [field]: value,
          }
        ).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed google/gemini-omni-1.2-flash/reference-to-video", () => {
  // The payload
  // tests/integration/wavespeed-google-gemini-omni-1-2-flash-reference-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "The cat from <IMAGE_REF_0> walks across a sunlit wooden floor.",
    images: [
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    ],
    resolution: "360p",
    duration: 3,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.google.geminiOmni1p2Flash)).toEqual([
      "textToVideo",
      "videoEdit",
      "referenceToVideo",
    ]);
    expect(
      wavespeed.api.v3.google.geminiOmni1p2Flash.referenceToVideo.schema
    ).toBe(WaveSpeedGoogleGeminiOmni1p2FlashReferenceToVideoRequestSchema);
    expect(
      WaveSpeedGoogleGeminiOmni1p2FlashReferenceToVideoRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });

  it("posts the payload to the model's submit URL", async () => {
    const { requests, fetch } = capture(() =>
      jsonResponse({
        code: 200,
        message: "success",
        data: {
          id: "p1",
          model: "google/gemini-omni-1.2-flash/reference-to-video",
          status: "created",
        },
      })
    );
    const wavespeed = createWaveSpeed({ apiKey: "ws-key", fetch });

    await wavespeed.api.v3.google.geminiOmni1p2Flash.referenceToVideo({
      prompt: RECORDED.prompt,
      images: RECORDED.images,
      resolution: "360p",
      duration: 3,
    });

    expect(requests).toHaveLength(1);
    expect(requests[0].init.method).toBe("POST");
    expect(requests[0].url).toBe(
      "https://api.wavespeed.ai/api/v3/google/gemini-omni-1.2-flash/reference-to-video"
    );
    expect(JSON.parse(String(requests[0].init.body))).toEqual(RECORDED);
  });

  it("takes every documented option, up to 15 s", () => {
    const url = "https://example.com/ref.mp4";
    expect(
      WaveSpeedGoogleGeminiOmni1p2FlashReferenceToVideoRequestSchema.safeParse({
        prompt: "<IMAGE_REF_0> meets <VIDEO_REF_0>",
        images: Array(10).fill(url),
        reference_videos: Array(3).fill(url),
        aspect_ratio: "9:16",
        resolution: "4k",
        duration: 15,
      }).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.mp4";
    for (const [field, value] of [
      ["resolution", "480p"],
      ["aspect_ratio", "1:1"],
      ["duration", 2],
      ["duration", 16],
      ["duration", 3.5],
      ["images", Array(11).fill(url)],
      ["reference_videos", Array(4).fill(url)],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedGoogleGeminiOmni1p2FlashReferenceToVideoRequestSchema.safeParse(
          {
            ...RECORDED,
            [field]: value,
          }
        ).success,
        `${field} ${value}`
      ).toBe(false);
    }
  });
});

describe("wavespeed runwayml/aleph-2", () => {
  // The payload tests/integration/wavespeed-runwayml-aleph-2.test.ts recorded.
  const RECORDED = {
    prompt: "Make the cat's fur bright orange.",
    video:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1-kling-o3-3s.mp4",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.runwayml)).toEqual(["aleph2"]);
    expect(wavespeed.api.v3.runwayml.aleph2.schema).toBe(
      WaveSpeedRunwaymlAleph2RequestSchema
    );
    expect(
      WaveSpeedRunwaymlAleph2RequestSchema.safeParse(RECORDED).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/key.jpg";
    for (const [field, value] of [
      ["keyframe_images", Array(6).fill(url)],
      ["keyframe_positions", Array(6).fill("first")],
      ["seed", 1.5],
      ["prompt", undefined],
      ["video", undefined],
    ] as const) {
      expect(
        WaveSpeedRunwaymlAleph2RequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed x-ai/grok-imagine-video-v1.5/reference-to-video", () => {
  // The payload
  // tests/integration/wavespeed-x-ai-grok-imagine-video-v1-5-reference-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt:
      "The cat from the reference image walks across a sunlit wooden floor.",
    reference_images: [
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    ],
    duration: 1,
    resolution: "480p",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.xAi.grokImagineVideoV1p5)).toEqual([
      "imageToVideo",
      "referenceToVideo",
    ]);
    expect(
      wavespeed.api.v3.xAi.grokImagineVideoV1p5.referenceToVideo.schema
    ).toBe(WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoRequestSchema);
    expect(
      WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.jpg";
    for (const [field, value] of [
      ["resolution", "1080p"],
      ["aspect_ratio", "4:3"],
      ["duration", 0],
      ["duration", 16],
      ["reference_images", Array(8).fill(url)],
      ["reference_images", undefined],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedXAiGrokImagineVideoV1p5ReferenceToVideoRequestSchema.safeParse(
          {
            ...RECORDED,
            [field]: value,
          }
        ).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed kwaivgi/kling-video-o3-pro/video-edit", () => {
  // The payload
  // tests/integration/wavespeed-kwaivgi-kling-video-o3-pro-video-edit.test.ts
  // recorded.
  const RECORDED = {
    prompt: "Make the cat's fur bright orange.",
    video:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1-kling-o3-3s.mp4",
    keep_original_sound: true,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.kwaivgi)).toEqual(["klingVideoO3Pro"]);
    expect(Object.keys(wavespeed.api.v3.kwaivgi.klingVideoO3Pro)).toEqual([
      "videoEdit",
    ]);
    expect(wavespeed.api.v3.kwaivgi.klingVideoO3Pro.videoEdit.schema).toBe(
      WaveSpeedKwaivgiKlingVideoO3ProVideoEditRequestSchema
    );
    expect(
      WaveSpeedKwaivgiKlingVideoO3ProVideoEditRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("takes element references", () => {
    expect(
      WaveSpeedKwaivgiKlingVideoO3ProVideoEditRequestSchema.safeParse({
        ...RECORDED,
        element_list: [{ element_id: "element-1" }],
      }).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.jpg";
    for (const [field, value] of [
      ["images", Array(5).fill(url)],
      ["element_list", Array(4).fill({ element_id: "element-1" })],
      ["keep_original_sound", "yes"],
      ["prompt", undefined],
      ["video", undefined],
    ] as const) {
      expect(
        WaveSpeedKwaivgiKlingVideoO3ProVideoEditRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed alibaba/happyhorse-1.1/reference-to-video", () => {
  // The payload
  // tests/integration/wavespeed-alibaba-happyhorse-1-1-reference-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt:
      "The cat from the reference image walks across a sunlit wooden floor.",
    images: [
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    ],
    resolution: "480p",
    duration: 3,
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.alibaba.happyhorse1p1)).toEqual([
      "imageToVideo",
      "referenceToVideo",
    ]);
    expect(wavespeed.api.v3.alibaba.happyhorse1p1.referenceToVideo.schema).toBe(
      WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoRequestSchema
    );
    expect(
      WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.jpg";
    for (const [field, value] of [
      ["resolution", "4k"],
      ["aspect_ratio", "2:1"],
      ["duration", 2],
      ["duration", 16],
      ["images", Array(10).fill(url)],
      ["images", undefined],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedAlibabaHappyhorse1p1ReferenceToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed openai/gpt-image-2.6-sunburst/text-to-image", () => {
  // The payload
  // tests/integration/wavespeed-openai-gpt-image-2-6-sunburst-text-to-image.test.ts
  // recorded.
  const RECORDED = {
    prompt: "A red paper boat drifts across a calm pond at sunrise.",
    quality: "low",
    resolution: "1k",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.openai)).toEqual([
      "gptImage2p6Flare",
      "gptImage2p6Sunburst",
      "gptImage2p5Sunburst",
      "gptImage2p5Flare",
      "gptImage2",
    ]);
    expect(Object.keys(wavespeed.api.v3.openai.gptImage2p6Sunburst)).toEqual([
      "textToImage",
      "edit",
    ]);
    expect(wavespeed.api.v3.openai.gptImage2p6Sunburst.textToImage.schema).toBe(
      WaveSpeedOpenaiGptImage2p6SunburstTextToImageRequestSchema
    );
    expect(
      WaveSpeedOpenaiGptImage2p6SunburstTextToImageRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });

  it("takes every documented option", () => {
    expect(
      WaveSpeedOpenaiGptImage2p6SunburstTextToImageRequestSchema.safeParse({
        prompt: "A koi pond",
        aspect_ratio: "21:9",
        resolution: "4k",
        quality: "max",
        complexity: "low",
        output_format: "gif",
        frame_count: 16,
        frame_duration_ms: 20,
      }).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "8k"],
      ["quality", "ultra"],
      ["aspect_ratio", "7:5"],
      ["complexity", "max"],
      ["output_format", "tiff"],
      ["frame_count", 1],
      ["frame_count", 17],
      ["frame_duration_ms", 19],
      ["frame_duration_ms", 2001],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedOpenaiGptImage2p6SunburstTextToImageRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed openai/gpt-image-2.6-sunburst/edit", () => {
  // The payload
  // tests/integration/wavespeed-openai-gpt-image-2-6-sunburst-edit.test.ts
  // recorded.
  const RECORDED = {
    prompt: "Give the cat a small red knitted scarf.",
    images: [
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    ],
    quality: "low",
    resolution: "1k",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(wavespeed.api.v3.openai.gptImage2p6Sunburst.edit.schema).toBe(
      WaveSpeedOpenaiGptImage2p6SunburstEditRequestSchema
    );
    expect(
      WaveSpeedOpenaiGptImage2p6SunburstEditRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("takes every documented option", () => {
    const url = "https://example.com/ref.png";
    expect(
      WaveSpeedOpenaiGptImage2p6SunburstEditRequestSchema.safeParse({
        prompt: "Swap the sky",
        images: Array(16).fill(url),
        mask_image: url,
        markup_image: url,
        aspect_ratio: "9:21",
        resolution: "4k",
        quality: "max",
        complexity: "medium",
        output_format: "gif",
        frame_count: 2,
        frame_duration_ms: 2000,
      }).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    const url = "https://example.com/ref.png";
    for (const [field, value] of [
      ["resolution", "8k"],
      ["quality", "ultra"],
      ["aspect_ratio", "7:5"],
      ["output_format", "svg"],
      ["frame_count", 17],
      ["frame_duration_ms", 19],
      ["images", Array(17).fill(url)],
      ["images", undefined],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedOpenaiGptImage2p6SunburstEditRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed openai/gpt-image-2.6-flare/text-to-image", () => {
  // The payload
  // tests/integration/wavespeed-openai-gpt-image-2-6-flare-text-to-image.test.ts
  // recorded.
  const RECORDED = {
    prompt: "A red paper boat drifts across a calm pond at sunrise.",
    quality: "low",
    resolution: "1k",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.openai.gptImage2p6Flare)).toEqual([
      "textToImage",
      "edit",
    ]);
    expect(wavespeed.api.v3.openai.gptImage2p6Flare.textToImage.schema).toBe(
      WaveSpeedOpenaiGptImage2p6FlareTextToImageRequestSchema
    );
    expect(
      WaveSpeedOpenaiGptImage2p6FlareTextToImageRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });

  it("takes every documented option and rejects values off the grid", () => {
    const schema = WaveSpeedOpenaiGptImage2p6FlareTextToImageRequestSchema;
    expect(
      schema.safeParse({
        prompt: "A koi pond",
        aspect_ratio: "1:3",
        resolution: "4k",
        quality: "xhigh",
        complexity: "medium",
        output_format: "svg",
      }).success
    ).toBe(true);
    for (const [field, value] of [
      ["resolution", "8k"],
      ["quality", "ultra"],
      ["output_format", "tiff"],
      ["frame_count", 17],
      ["prompt", undefined],
    ] as const) {
      expect(
        schema.safeParse({ ...RECORDED, [field]: value }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed openai/gpt-image-2.6-flare/edit", () => {
  // The payload
  // tests/integration/wavespeed-openai-gpt-image-2-6-flare-edit.test.ts
  // recorded.
  const RECORDED = {
    prompt: "Give the cat a small red knitted scarf.",
    images: [
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    ],
    quality: "low",
    resolution: "1k",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(wavespeed.api.v3.openai.gptImage2p6Flare.edit.schema).toBe(
      WaveSpeedOpenaiGptImage2p6FlareEditRequestSchema
    );
    expect(
      WaveSpeedOpenaiGptImage2p6FlareEditRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("takes every documented option and rejects values off the grid", () => {
    const schema = WaveSpeedOpenaiGptImage2p6FlareEditRequestSchema;
    const url = "https://example.com/ref.png";
    expect(
      schema.safeParse({
        prompt: "Swap the sky",
        images: Array(16).fill(url),
        mask_image: url,
        aspect_ratio: "3:1",
        resolution: "2k",
        quality: "high",
        output_format: "webp",
      }).success
    ).toBe(true);
    for (const [field, value] of [
      ["resolution", "8k"],
      ["quality", "ultra"],
      ["output_format", "svg"],
      ["images", Array(17).fill(url)],
      ["images", undefined],
      ["prompt", undefined],
    ] as const) {
      expect(
        schema.safeParse({ ...RECORDED, [field]: value }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed google/nano-banana-2.1/text-to-image", () => {
  // The payload
  // tests/integration/wavespeed-google-nano-banana-2-1-text-to-image.test.ts
  // recorded.
  const RECORDED = {
    prompt: "A red paper boat drifts across a calm pond at sunrise.",
    resolution: "1k",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.google.nanoBanana2p1)).toEqual([
      "textToImage",
      "edit",
    ]);
    expect(wavespeed.api.v3.google.nanoBanana2p1.textToImage.schema).toBe(
      WaveSpeedGoogleNanoBanana2p1TextToImageRequestSchema
    );
    expect(
      WaveSpeedGoogleNanoBanana2p1TextToImageRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("takes every documented option and rejects values off the grid", () => {
    const schema = WaveSpeedGoogleNanoBanana2p1TextToImageRequestSchema;
    expect(
      schema.safeParse({
        prompt: "A koi pond",
        aspect_ratio: "8:1",
        resolution: "4k",
        output_format: "jpeg",
        enable_web_search: true,
        enable_image_search: true,
      }).success
    ).toBe(true);
    for (const [field, value] of [
      ["resolution", "8k"],
      ["aspect_ratio", "1:2"],
      ["output_format", "webp"],
      ["enable_web_search", "yes"],
      ["prompt", undefined],
    ] as const) {
      expect(
        schema.safeParse({ ...RECORDED, [field]: value }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed google/nano-banana-2.1/edit", () => {
  // The payload
  // tests/integration/wavespeed-google-nano-banana-2-1-edit.test.ts recorded.
  const RECORDED = {
    prompt: "Give the cat a small red knitted scarf.",
    images: [
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    ],
    resolution: "1k",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(wavespeed.api.v3.google.nanoBanana2p1.edit.schema).toBe(
      WaveSpeedGoogleNanoBanana2p1EditRequestSchema
    );
    expect(
      WaveSpeedGoogleNanoBanana2p1EditRequestSchema.safeParse(RECORDED).success
    ).toBe(true);
  });

  it("takes every documented option and rejects values off the grid", () => {
    const schema = WaveSpeedGoogleNanoBanana2p1EditRequestSchema;
    const url = "https://example.com/ref.png";
    expect(
      schema.safeParse({
        prompt: "Swap the sky",
        images: Array(14).fill(url),
        aspect_ratio: "1:8",
        resolution: "4k",
        output_format: "jpeg",
        enable_web_search: true,
        enable_image_search: false,
      }).success
    ).toBe(true);
    for (const [field, value] of [
      ["resolution", "8k"],
      ["aspect_ratio", "1:2"],
      ["output_format", "webp"],
      ["images", Array(15).fill(url)],
      ["images", undefined],
      ["prompt", undefined],
    ] as const) {
      expect(
        schema.safeParse({ ...RECORDED, [field]: value }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed openai/gpt-image-2.5-sunburst/text-to-image", () => {
  // The payload
  // tests/integration/wavespeed-openai-gpt-image-2-5-sunburst-text-to-image.test.ts
  // recorded.
  const RECORDED = {
    prompt: "A red paper boat drifts across a calm pond at sunrise.",
    quality: "low",
    resolution: "1k",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.openai.gptImage2p5Sunburst)).toEqual([
      "textToImage",
    ]);
    expect(wavespeed.api.v3.openai.gptImage2p5Sunburst.textToImage.schema).toBe(
      WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequestSchema
    );
    expect(
      WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });

  it("takes every documented option", () => {
    expect(
      WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequestSchema.safeParse({
        prompt: "A koi pond",
        aspect_ratio: "9:21",
        resolution: "4k",
        quality: "max",
        output_format: "webp",
      }).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid and the GPT Image 2.6 extras", () => {
    for (const [field, value] of [
      ["resolution", "8k"],
      ["quality", "ultra"],
      ["aspect_ratio", "7:5"],
      ["output_format", "svg"],
      ["output_format", "gif"],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed openai/gpt-image-2.5-flare/text-to-image", () => {
  // The payload
  // tests/integration/wavespeed-openai-gpt-image-2-5-flare-text-to-image.test.ts
  // recorded.
  const RECORDED = {
    prompt: "A red paper boat drifts across a calm pond at sunrise.",
    quality: "low",
    resolution: "1k",
  };

  it("attaches the Sunburst schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.openai.gptImage2p5Flare)).toEqual([
      "textToImage",
    ]);
    expect(wavespeed.api.v3.openai.gptImage2p5Flare.textToImage.schema).toBe(
      WaveSpeedOpenaiGptImage2p5FlareTextToImageRequestSchema
    );
    expect(WaveSpeedOpenaiGptImage2p5FlareTextToImageRequestSchema).toBe(
      WaveSpeedOpenaiGptImage2p5SunburstTextToImageRequestSchema
    );
    expect(
      WaveSpeedOpenaiGptImage2p5FlareTextToImageRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });
});

describe("wavespeed pruna-ai/p-video-2-pro/image-to-video", () => {
  // The payload
  // tests/integration/wavespeed-pruna-ai-p-video-2-pro-image-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "The cat slowly blinks and turns its head toward the window.",
    image:
      "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg",
    duration: 5,
    resolution: "480p",
    mode: "cost",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.prunaAi)).toEqual(["pVideo2Pro"]);
    expect(Object.keys(wavespeed.api.v3.prunaAi.pVideo2Pro)).toEqual([
      "imageToVideo",
    ]);
    expect(wavespeed.api.v3.prunaAi.pVideo2Pro.imageToVideo.schema).toBe(
      WaveSpeedPrunaAiPVideo2ProImageToVideoRequestSchema
    );
    expect(
      WaveSpeedPrunaAiPVideo2ProImageToVideoRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("posts the payload to the model's submit URL", async () => {
    const { requests, fetch } = capture(() =>
      jsonResponse({
        code: 200,
        message: "success",
        data: {
          id: "p1",
          model: "pruna-ai/p-video-2-pro/image-to-video",
          status: "created",
        },
      })
    );
    const wavespeed = createWaveSpeed({ apiKey: "ws-key", fetch });

    await wavespeed.api.v3.prunaAi.pVideo2Pro.imageToVideo({
      prompt: RECORDED.prompt,
      image: RECORDED.image,
      duration: 5,
      resolution: "480p",
      mode: "cost",
    });

    expect(requests).toHaveLength(1);
    expect(requests[0].init.method).toBe("POST");
    expect(requests[0].url).toBe(
      "https://api.wavespeed.ai/api/v3/pruna-ai/p-video-2-pro/image-to-video"
    );
    expect(JSON.parse(String(requests[0].init.body))).toEqual(RECORDED);
  });

  it("takes every documented option", () => {
    expect(
      WaveSpeedPrunaAiPVideo2ProImageToVideoRequestSchema.safeParse({
        ...RECORDED,
        last_image: RECORDED.image,
        duration: 15,
        resolution: "768p",
        mode: "quality",
        prompt_upsampler: "off",
        seed: 1712789405,
      }).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["duration", 4],
      ["duration", 16],
      ["duration", 5.5],
      ["resolution", "720p"],
      ["mode", "turbo"],
      ["prompt_upsampler", "on"],
      ["seed", 1.5],
      ["image", ""],
      ["last_image", ""],
      ["image", undefined],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedPrunaAiPVideo2ProImageToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        `${field} ${value}`
      ).toBe(false);
    }
  });
});

describe("wavespeed openai/gpt-image-2/text-to-image", () => {
  // The payload
  // tests/integration/wavespeed-openai-gpt-image-2-text-to-image.test.ts
  // recorded.
  const RECORDED = {
    prompt: "A red paper boat drifts across a calm pond at sunrise.",
    quality: "low",
    resolution: "1k",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.openai.gptImage2)).toEqual([
      "textToImage",
    ]);
    expect(wavespeed.api.v3.openai.gptImage2.textToImage.schema).toBe(
      WaveSpeedOpenaiGptImage2TextToImageRequestSchema
    );
    expect(
      WaveSpeedOpenaiGptImage2TextToImageRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("takes every documented option", () => {
    expect(
      WaveSpeedOpenaiGptImage2TextToImageRequestSchema.safeParse({
        prompt: "A koi pond",
        aspect_ratio: "3:1",
        resolution: "4k",
        quality: "high",
        output_format: "jpeg",
      }).success
    ).toBe(true);
  });

  it("rejects the GPT Image 2.5 tiers above high and values off the grid", () => {
    for (const [field, value] of [
      ["quality", "xhigh"],
      ["quality", "max"],
      ["resolution", "8k"],
      ["aspect_ratio", "7:5"],
      ["output_format", "svg"],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedOpenaiGptImage2TextToImageRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        `${field} ${String(value)}`
      ).toBe(false);
    }
  });
});

describe("wavespeed x-ai/grok-imagine-image-v2.0/text-to-image", () => {
  // The payload
  // tests/integration/wavespeed-x-ai-grok-imagine-image-v2-0-text-to-image.test.ts
  // recorded.
  const RECORDED = {
    prompt: "A red paper boat drifts across a calm pond at sunrise.",
    quality: "low",
    resolution: "1k",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.xAi)).toEqual([
      "grokImagineVideoV1p5",
      "grokImagineImageV2p0",
    ]);
    expect(Object.keys(wavespeed.api.v3.xAi.grokImagineImageV2p0)).toEqual([
      "textToImage",
    ]);
    expect(wavespeed.api.v3.xAi.grokImagineImageV2p0.textToImage.schema).toBe(
      WaveSpeedXAiGrokImagineImageV2p0TextToImageRequestSchema
    );
    expect(
      WaveSpeedXAiGrokImagineImageV2p0TextToImageRequestSchema.safeParse(
        RECORDED
      ).success
    ).toBe(true);
  });

  it("takes every documented option", () => {
    expect(
      WaveSpeedXAiGrokImagineImageV2p0TextToImageRequestSchema.safeParse({
        prompt: "A koi pond",
        aspect_ratio: "19.5:9",
        resolution: "2k",
        quality: "medium",
      }).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["resolution", "4k"],
      ["quality", "high"],
      ["aspect_ratio", "21:9"],
      ["prompt", ""],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedXAiGrokImagineImageV2p0TextToImageRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        `${field} ${String(value)}`
      ).toBe(false);
    }
  });
});

describe("wavespeed bytedance/seedream-v5.5/edit", () => {
  // The payload tests/integration/wavespeed-bytedance-seedream-v5-5-edit.test.ts
  // recorded.
  const CAT_IMAGE =
    "https://raw.githubusercontent.com/justintanner/apicity/ba051beeb8de3c82a9893f65b610653c32616e94/tests/fixtures/cat1.jpg";
  const RECORDED = {
    prompt: "Give the cat a small red knitted scarf.",
    images: [CAT_IMAGE],
    resolution: "1k",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.bytedance.seedreamV5p5)).toEqual([
      "edit",
    ]);
    expect(wavespeed.api.v3.bytedance.seedreamV5p5.edit.schema).toBe(
      WaveSpeedBytedanceSeedreamV5p5EditRequestSchema
    );
    expect(
      WaveSpeedBytedanceSeedreamV5p5EditRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("takes every documented option and ten images", () => {
    expect(
      WaveSpeedBytedanceSeedreamV5p5EditRequestSchema.safeParse({
        prompt: "Make it a watercolour",
        images: Array.from({ length: 10 }, () => CAT_IMAGE),
        aspect_ratio: "9:21",
        resolution: "1.5k",
        output_format: "jpeg",
        background: "transparent",
      }).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["images", Array.from({ length: 11 }, () => CAT_IMAGE)],
      ["images", undefined],
      ["resolution", "4k"],
      ["aspect_ratio", "7:5"],
      ["output_format", "webp"],
      ["background", "white"],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedBytedanceSeedreamV5p5EditRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        field
      ).toBe(false);
    }
  });
});

describe("wavespeed skywork-ai/skyreels-v4/text-to-video", () => {
  // The payload
  // tests/integration/wavespeed-skywork-ai-skyreels-v4-text-to-video.test.ts
  // recorded.
  const RECORDED = {
    prompt: "A red paper boat drifts across a calm pond at sunrise.",
    duration: 3,
    resolution: "480p",
    sound: false,
    mode: "fast",
  };

  it("attaches the schema, which takes the recorded payload", () => {
    const wavespeed = createWaveSpeed({ apiKey: "ws-key" });

    expect(Object.keys(wavespeed.api.v3.skyworkAi)).toEqual(["skyreelsV4"]);
    expect(Object.keys(wavespeed.api.v3.skyworkAi.skyreelsV4)).toEqual([
      "textToVideo",
    ]);
    expect(wavespeed.api.v3.skyworkAi.skyreelsV4.textToVideo.schema).toBe(
      WaveSpeedSkyworkAiSkyreelsV4TextToVideoRequestSchema
    );
    expect(
      WaveSpeedSkyworkAiSkyreelsV4TextToVideoRequestSchema.safeParse(RECORDED)
        .success
    ).toBe(true);
  });

  it("posts the payload to the model's submit URL", async () => {
    const { requests, fetch } = capture(() =>
      jsonResponse({
        code: 200,
        message: "success",
        data: {
          id: "p1",
          model: "skywork-ai/skyreels-v4/text-to-video",
          status: "created",
        },
      })
    );
    const wavespeed = createWaveSpeed({ apiKey: "ws-key", fetch });

    await wavespeed.api.v3.skyworkAi.skyreelsV4.textToVideo({
      prompt: RECORDED.prompt,
      duration: 3,
      resolution: "480p",
      sound: false,
      mode: "fast",
    });

    expect(requests).toHaveLength(1);
    expect(requests[0].init.method).toBe("POST");
    expect(requests[0].url).toBe(
      "https://api.wavespeed.ai/api/v3/skywork-ai/skyreels-v4/text-to-video"
    );
    expect(JSON.parse(String(requests[0].init.body))).toEqual(RECORDED);
  });

  it("takes every documented option", () => {
    expect(
      WaveSpeedSkyworkAiSkyreelsV4TextToVideoRequestSchema.safeParse({
        prompt: "A koi pond",
        duration: 15,
        aspect_ratio: "1:1",
        resolution: "1080p",
        sound: true,
        mode: "std",
      }).success
    ).toBe(true);
  });

  it("rejects values off WaveSpeed's grid", () => {
    for (const [field, value] of [
      ["duration", 2],
      ["duration", 16],
      ["duration", 3.5],
      ["resolution", "4k"],
      ["aspect_ratio", "4:3"],
      ["mode", "turbo"],
      ["sound", "yes"],
      ["prompt", undefined],
    ] as const) {
      expect(
        WaveSpeedSkyworkAiSkyreelsV4TextToVideoRequestSchema.safeParse({
          ...RECORDED,
          [field]: value,
        }).success,
        `${field} ${value}`
      ).toBe(false);
    }
  });
});
