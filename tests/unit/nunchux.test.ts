import { readFileSync } from "node:fs";
import examples from "../../packages/provider/nunchux/src/example";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createNunchux,
  NunchuxError,
  isNunchuxErrorBody,
} from "@apicity/nunchux";

function capture(body: unknown, status = 200) {
  const requests: { url: string; init: RequestInit }[] = [];
  const fetch: typeof globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify(body), { status });
  };
  return { requests, fetch };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("nunchux", () => {
  it("parses the recorded Wan video request and rejects image models and off-grid controls", () => {
    const { schema } =
      createNunchux().v1.alibaba.services.aigc.videoGeneration.videoSynthesis;
    const body = schema.parse(
      examples["POST v1.alibaba.services.aigc.videoGeneration.videoSynthesis"]!
        .payload
    );
    expect(body.model).toBe("wan3.0-video");
    expect(schema.safeParse({ ...body, model: "wan2.7-image" }).success).toBe(
      false
    );
    expect(
      schema.safeParse({ ...body, parameters: { resolution: "4K" } }).success
    ).toBe(false);
    expect(
      schema.safeParse({ ...body, parameters: { duration: 1 } }).success
    ).toBe(false);
  });
  it("encodes the task ID as one path segment without a GET body", async () => {
    const body = { output: { task_id: "task/id ?#", task_status: "UNKNOWN" } };
    const { fetch, requests } = capture(body);
    await expect(
      createNunchux({ apiKey: "test-key", fetch }).v1.alibaba.tasks(
        "task/id ?#"
      )
    ).resolves.toEqual(body);
    expect(requests[0].url).toBe(
      "https://api.nunchux.com/v1/alibaba/tasks/task%2Fid%20%3F%23"
    );
    expect(requests[0].init.method).toBe("GET");
    expect(requests[0].init.body).toBeUndefined();
  });
  it("encodes the Seedance task ID as one path segment without a GET body", async () => {
    const body = { id: "task/id ?#", status: "queued" };
    const { fetch, requests } = capture(body);
    await expect(
      createNunchux({
        apiKey: "test-key",
        fetch,
      }).v1.bytedance.contents.generations.tasks.retrieve("task/id ?#")
    ).resolves.toEqual(body);
    expect(requests[0].url).toBe(
      "https://api.nunchux.com/v1/bytedance/contents/generations/tasks/task%2Fid%20%3F%23"
    );
    expect(requests[0].init.method).toBe("GET");
    expect(requests[0].init.body).toBeUndefined();
  });
  it("parses the recorded Seedance body and rejects off-grid controls and non-web video URLs", () => {
    const { schema } = createNunchux().v1.bytedance.contents.generations.tasks;
    const body = schema.parse(
      examples["POST v1.bytedance.contents.generations.tasks"]!.payload
    );
    expect(body.model).toBe("dreamina-seedance-2-5-260628");
    expect(schema.safeParse({ ...body, resolution: "1080p" }).success).toBe(
      false
    );
    expect(
      schema.safeParse({ ...body, model: "seedream-2-5-260628" }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        ...body,
        content: [
          ...body.content,
          {
            type: "video_url",
            role: "reference_video",
            video_url: { url: "data:video/mp4;base64,YQ==" },
          },
        ],
      }).success
    ).toBe(false);
  });
  it("parses the recorded Seedance first frame and rejects a video role on an image", () => {
    const har = JSON.parse(
      readFileSync(
        "tests/recordings/nunchux_350094952/seedance-2-5-image-to-video_3270814726/recording.har",
        "utf8"
      )
    ) as { log: { entries: { request: { postData: { text: string } } }[] } };
    const { schema } = createNunchux().v1.bytedance.contents.generations.tasks;
    const payload = schema.parse(
      JSON.parse(har.log.entries[0]!.request.postData.text)
    );
    expect(payload.content[1]).toMatchObject({
      type: "image_url",
      role: "first_frame",
      image_url: { url: expect.stringMatching(/\/cat1\.jpg$/) },
    });
    expect(
      schema.safeParse({
        ...payload,
        content: [
          payload.content[0],
          { ...payload.content[1], role: "reference_video" },
        ],
      }).success
    ).toBe(false);
  });
  it("uses the default URL and Bearer key without a GET body", async () => {
    const { fetch, requests } = capture({ credits_remaining: 5 });
    await expect(
      createNunchux({ apiKey: "test-key", fetch }).v1.credits()
    ).resolves.toEqual({ credits_remaining: 5 });
    expect(requests[0]).toMatchObject({
      url: "https://api.nunchux.com/v1/credits",
      init: { method: "GET", headers: { Authorization: "Bearer test-key" } },
    });
    expect(requests[0].init.body).toBeUndefined();
  });
  it("parses the recorded Google request and checks image controls and edit inputs", () => {
    const { schema } = createNunchux().v1.google.v1beta.interactions;
    const recorded = schema.parse(
      examples["POST v1.google.v1beta.interactions"]!.payload
    );
    expect(
      schema.safeParse({
        ...recorded,
        response_format: { type: "image", image_size: "0.5K" },
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        ...recorded,
        response_format: { type: "image", aspect_ratio: "auto" },
      }).success
    ).toBe(false);
    const image = { type: "image", data: "YQ==", mime_type: "image/jpeg" };
    expect(
      schema.safeParse({
        ...recorded,
        input: [...recorded.input, ...Array(14).fill(image)],
      }).success
    ).toBe(true);
    expect(
      schema.safeParse({
        ...recorded,
        input: [...recorded.input, ...Array(15).fill(image)],
      }).success
    ).toBe(false);
    expect(
      schema.safeParse({
        ...recorded,
        input: [{ ...image, data: "data:image/jpeg;base64,YQ==" }],
      }).success
    ).toBe(false);
  });
  it("parses the recorded Nano Banana edit with its cat image part", () => {
    const { schema } = createNunchux().v1.google.v1beta.interactions;
    const har = JSON.parse(
      readFileSync(
        "tests/recordings/nunchux_350094952/nano-banana-2-1-edit_4018369537/recording.har",
        "utf8"
      )
    ) as { log: { entries: { request: { postData: { text: string } } }[] } };
    const recorded = JSON.parse(har.log.entries[0]!.request.postData.text) as {
      input: Record<string, unknown>[];
    };
    // The harness stores the image as a size summary; restore the bytes of
    // the fixture it summarizes, which the test sent.
    const cat = readFileSync("tests/fixtures/cat1.jpg");
    expect(recorded.input[1]).toEqual({
      type: "image",
      data: `<inline base64 data; ${cat.byteLength} bytes>`,
      mime_type: "image/jpeg",
    });
    const payload = {
      ...recorded,
      input: [
        recorded.input[0],
        { ...recorded.input[1], data: cat.toString("base64") },
      ],
    };
    expect(schema.safeParse(payload).success).toBe(true);
    expect(
      schema.safeParse({
        ...payload,
        response_format: { type: "image", image_size: "8K" },
      }).success
    ).toBe(false);
  });
  it("encodes the MiniMax task ID as one path segment without a GET body", async () => {
    const body = { task: { status: "queued" } };
    const { fetch, requests } = capture(body);
    await expect(
      createNunchux({
        apiKey: "test-key",
        fetch,
      }).v1.minimax.v2.query.videoGeneration("task/id ?#")
    ).resolves.toEqual(body);
    expect(requests[0].url).toBe(
      "https://api.nunchux.com/v1/minimax/v2/query/video_generation/task%2Fid%20%3F%23"
    );
    expect(requests[0].init.method).toBe("GET");
    expect(requests[0].init.body).toBeUndefined();
  });
  it("uses the configured base URL and environment key", async () => {
    vi.stubEnv("NUNCHUX_API_KEY", "env-key");
    const { fetch, requests } = capture({});
    await createNunchux({
      baseURL: "https://nunchux.test///",
      fetch,
    }).v1.credits();
    expect(requests[0]).toMatchObject({
      url: "https://nunchux.test/v1/credits",
      init: { headers: { Authorization: "Bearer env-key" } },
    });
  });
  it("requires a key before making a request", async () => {
    vi.stubEnv("NUNCHUX_API_KEY", "");
    const { fetch, requests } = capture({});
    await expect(createNunchux({ fetch }).v1.credits()).rejects.toMatchObject({
      status: 401,
    });
    expect(requests).toHaveLength(0);
  });
  it.each([
    {
      body: {
        error: {
          code: "invalid_api_key",
          message: "Invalid key",
          request_id: "r1",
          details: {},
        },
      },
      status: 401,
      code: "invalid_api_key",
      message: "Invalid key",
    },
    {
      body: { detail: "Bad parameter" },
      status: 400,
      code: undefined,
      message: "Bad parameter",
    },
    {
      body: {
        detail: {
          code: "model_not_available",
          message: "Restricted",
          model: "model",
          entrypoint: "alibaba",
        },
      },
      status: 403,
      code: "model_not_available",
      message: "Restricted",
    },
    {
      body: {
        code: "InvalidParameter",
        message: "Invalid input",
        request_id: "r2",
      },
      status: 400,
      code: "InvalidParameter",
      message: "Invalid input",
    },
  ])("parses $status $message", async ({ body, status, code, message }) => {
    expect(isNunchuxErrorBody(body)).toBe(true);
    const { fetch } = capture(body, status);
    const error = await createNunchux({ apiKey: "test-key", fetch })
      .v1.credits()
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(NunchuxError);
    expect(error).toMatchObject({
      status,
      code,
      body,
      message: `Nunchux API error ${status}: ${message}`,
    });
  });
  it.each([
    null,
    [],
    {},
    { error: {} },
    { detail: 1 },
    { code: 4, message: "bad" },
  ])("rejects malformed error bodies: %j", (value) => {
    expect(isNunchuxErrorBody(value)).toBe(false);
  });
  it("redacts echoed credentials from errors", async () => {
    const { fetch } = capture(
      { error: { code: "invalid_api_key", message: "Bad test-key" } },
      401
    );
    const error = await createNunchux({ apiKey: "test-key", fetch })
      .v1.credits()
      .catch((caught: unknown) => caught);
    expect(JSON.stringify(error)).not.toContain("test-key");
    expect((error as Error).message).toContain("[REDACTED]");
  });
  it("reports timeouts and caller aborts distinctly", async () => {
    const fetch: typeof globalThis.fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        if (init?.signal?.aborted) reject(new Error("aborted"));
        else
          init?.signal?.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true }
          );
      });
    await expect(
      createNunchux({ apiKey: "key", timeout: 1, fetch }).v1.credits()
    ).rejects.toMatchObject({ status: 408 });
    const controller = new AbortController();
    controller.abort();
    await expect(
      createNunchux({ apiKey: "key", fetch }).v1.credits(controller.signal)
    ).rejects.toMatchObject({ status: 499 });
  });
});
