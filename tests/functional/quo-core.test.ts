import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createQuo,
  QuoError,
  QuoSendMessageRequestSchema,
} from "../../packages/provider/quo/src/index";

const ORIGINAL_KEY = process.env.QUO_API_KEY;
const REQUEST = {
  content: "Hello from a test",
  from: "+15550100001",
  to: ["+15550100002"],
} as const;

function successResponse(extra: Record<string, unknown> = {}): Response {
  return Response.json(
    {
      data: {
        id: "AC-test",
        to: [...REQUEST.to],
        from: REQUEST.from,
        text: REQUEST.content,
        phoneNumberId: "PN-test",
        direction: "outgoing",
        userId: "US-test",
        status: "queued",
        createdAt: "2026-07-15T00:00:00Z",
        updatedAt: "2026-07-15T00:00:00Z",
        upstreamField: true,
      },
      ...extra,
    },
    { status: 202 }
  );
}

afterEach(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.QUO_API_KEY;
  else process.env.QUO_API_KEY = ORIGINAL_KEY;
  vi.restoreAllMocks();
});

describe("Quo request schema", () => {
  it("enforces content boundaries and non-whitespace content", () => {
    expect(QuoSendMessageRequestSchema.safeParse(REQUEST).success).toBe(true);
    expect(
      QuoSendMessageRequestSchema.safeParse({ ...REQUEST, content: " " })
        .success
    ).toBe(false);
    expect(
      QuoSendMessageRequestSchema.safeParse({
        ...REQUEST,
        content: "a".repeat(1600),
      }).success
    ).toBe(true);
    expect(
      QuoSendMessageRequestSchema.safeParse({
        ...REQUEST,
        content: "a".repeat(1601),
      }).success
    ).toBe(false);
  });

  it("accepts Quo IDs or E.164 senders and validates recipients", () => {
    expect(
      QuoSendMessageRequestSchema.safeParse({ ...REQUEST, from: "PN123abc" })
        .success
    ).toBe(true);
    expect(
      QuoSendMessageRequestSchema.safeParse({ ...REQUEST, from: "invalid" })
        .success
    ).toBe(false);
    expect(
      QuoSendMessageRequestSchema.safeParse({ ...REQUEST, to: ["5550100002"] })
        .success
    ).toBe(false);
  });

  it("enforces recipient counts, user IDs, and inbox status", () => {
    const recipients = Array.from(
      { length: 10 },
      (_, index) => `+155501000${String(index).padStart(2, "0")}`
    );
    expect(
      QuoSendMessageRequestSchema.safeParse({ ...REQUEST, to: [] }).success
    ).toBe(false);
    expect(
      QuoSendMessageRequestSchema.safeParse({ ...REQUEST, to: recipients })
        .success
    ).toBe(true);
    expect(
      QuoSendMessageRequestSchema.safeParse({
        ...REQUEST,
        to: [...recipients, "+15550100100"],
      }).success
    ).toBe(false);
    expect(
      QuoSendMessageRequestSchema.safeParse({ ...REQUEST, userId: "US123" })
        .success
    ).toBe(true);
    expect(
      QuoSendMessageRequestSchema.safeParse({ ...REQUEST, userId: "user" })
        .success
    ).toBe(false);
    expect(
      QuoSendMessageRequestSchema.safeParse({
        ...REQUEST,
        setInboxStatus: "done",
      }).success
    ).toBe(true);
    expect(
      QuoSendMessageRequestSchema.safeParse({
        ...REQUEST,
        setInboxStatus: "open",
      }).success
    ).toBe(false);
  });
});

describe("Quo transport", () => {
  it("sends one exact POST with raw explicit authorization", async () => {
    process.env.QUO_API_KEY = "environment-key";
    const fetchMock = vi.fn<typeof fetch>(async () => successResponse());
    const quo = createQuo({ apiKey: "explicit-key", fetch: fetchMock });

    const response = await quo.v1.messages({ ...REQUEST });

    expect(response.data.upstreamField).toBe(true);
    expect(quo.v1.messages.schema).toBe(QuoSendMessageRequestSchema);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [input, init] = fetchMock.mock.calls[0];
    expect(String(input)).toBe("https://api.openphone.com/v1/messages");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "explicit-key"
    );
    expect(new Headers(init?.headers).get("Authorization")).not.toContain(
      "Bearer"
    );
    expect(JSON.parse(String(init?.body))).toEqual(REQUEST);
  });

  it("uses the environment key and normalized custom base URL", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => successResponse());
    const quo = createQuo({
      baseURL: "https://quo.example.test/root/",
      fetch: fetchMock,
    });
    process.env.QUO_API_KEY = "environment-key";

    await quo.v1.messages({ ...REQUEST });

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://quo.example.test/root/v1/messages"
    );
    expect(
      new Headers(fetchMock.mock.calls[0][1]?.headers).get("Authorization")
    ).toBe("environment-key");
  });

  it("fails before fetch when credentials are missing", async () => {
    delete process.env.QUO_API_KEY;
    const fetchMock = vi.fn<typeof fetch>();
    const quo = createQuo({ fetch: fetchMock });

    await expect(quo.v1.messages({ ...REQUEST })).rejects.toEqual(
      expect.objectContaining({ name: "QuoError", status: 401 })
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps upstream errors without exposing request secrets in messages", async () => {
    const apiKey = "private-test-key";
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Response.json(
        {
          code: "invalid_request",
          message: `Could not send from ${REQUEST.from} to ${REQUEST.to[0]} with ${apiKey}`,
          useful: true,
        },
        { status: 400 }
      )
    );
    const quo = createQuo({ apiKey, fetch: fetchMock });

    let caught: unknown;
    try {
      await quo.v1.messages({ ...REQUEST });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(QuoError);
    const quoError = caught as QuoError;
    expect(quoError.status).toBe(400);
    expect(quoError.code).toBe("invalid_request");
    expect(quoError.body).toEqual(expect.objectContaining({ useful: true }));
    expect(quoError.message).not.toContain(apiKey);
    expect(quoError.message).not.toContain(REQUEST.from);
    expect(quoError.message).not.toContain(REQUEST.to[0]);
  });

  it("wraps fetch and malformed-success failures", async () => {
    const fetchFailure = createQuo({
      apiKey: "key",
      fetch: async () => {
        throw new Error(`network failure involving ${REQUEST.from}`);
      },
    });
    await expect(fetchFailure.v1.messages({ ...REQUEST })).rejects.toEqual(
      expect.objectContaining({ message: "Quo request failed", status: 500 })
    );

    const malformed = createQuo({
      apiKey: "key",
      fetch: async () => new Response("not-json", { status: 202 }),
    });
    await expect(malformed.v1.messages({ ...REQUEST })).rejects.toEqual(
      expect.objectContaining({
        message: "Quo API returned invalid JSON",
        status: 500,
      })
    );
  });

  it("propagates already-aborted and later caller signals", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
      if (init?.signal?.aborted) {
        throw new DOMException("aborted", "AbortError");
      }
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("aborted", "AbortError")),
          { once: true }
        );
      });
    });
    const quo = createQuo({ apiKey: "key", fetch: fetchMock });
    const alreadyAborted = new AbortController();
    alreadyAborted.abort();
    await expect(
      quo.v1.messages({ ...REQUEST }, alreadyAborted.signal)
    ).rejects.toEqual(expect.objectContaining({ status: 499 }));

    const laterAborted = new AbortController();
    const pending = quo.v1.messages({ ...REQUEST }, laterAborted.signal);
    laterAborted.abort();
    await expect(pending).rejects.toEqual(
      expect.objectContaining({ status: 499 })
    );
  });

  it("times out pending fetches and always clears its timer", async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const quo = createQuo({
      apiKey: "key",
      timeout: 1,
      fetch: async (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("aborted", "AbortError")),
            { once: true }
          );
        }),
    });

    await expect(quo.v1.messages({ ...REQUEST })).rejects.toEqual(
      expect.objectContaining({ message: "Quo request timed out", status: 408 })
    );
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
