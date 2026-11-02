import { afterEach, describe, expect, it, vi } from "vitest";

import { createWaveSpeed, WaveSpeedError } from "@apicity/wavespeed";
import {
  WaveSpeedAlibabaWan3p0ImageToVideoRequestSchema,
  WaveSpeedAlibabaWan3p0TextToVideoRequestSchema,
  WaveSpeedBlackForestLabsFlux3TextToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p0ImageToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p0TextToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p5ImageToVideoRequestSchema,
  WaveSpeedBytedanceSeedance2p5TextToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p1FlashImageToVideoRequestSchema,
  WaveSpeedGoogleGeminiOmni1p1FlashTextToVideoRequestSchema,
  WaveSpeedHeygenVideo1p0TextToVideoRequestSchema,
  WaveSpeedMinimaxH3ImageToVideoRequestSchema,
  WaveSpeedMinimaxH3TextToVideoRequestSchema,
  WaveSpeedPredictionStatusSchema,
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

    expect(Object.keys(wavespeed.api.v3.minimax.h3)).toEqual([
      "textToVideo",
      "imageToVideo",
    ]);
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

    expect(Object.keys(wavespeed.api.v3.bytedance.seedance2p5)).toEqual([
      "textToVideo",
      "imageToVideo",
    ]);
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

    expect(Object.keys(wavespeed.api.v3.google.geminiOmni1p1Flash)).toEqual([
      "textToVideo",
      "imageToVideo",
    ]);
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

    expect(Object.keys(wavespeed.api.v3.alibaba.wan3p0)).toEqual([
      "textToVideo",
      "imageToVideo",
    ]);
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
