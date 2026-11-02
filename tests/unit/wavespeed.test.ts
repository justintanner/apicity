import { afterEach, describe, expect, it, vi } from "vitest";

import { createWaveSpeed, WaveSpeedError } from "@apicity/wavespeed";
import {
  WaveSpeedAlibabaWan3p0TextToVideoRequestSchema,
  WaveSpeedHeygenVideo1p0TextToVideoRequestSchema,
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
