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
