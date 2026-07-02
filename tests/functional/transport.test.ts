import { describe, expect, it } from "vitest";
import { createTransport as createAlibabaTransport } from "../../packages/provider/alibaba/src/transport";
import { createTransport as createKimiCodingTransport } from "../../packages/provider/kimicoding/src/transport";
import { createTransport as createOpenAiTransport } from "../../packages/provider/openai/src/transport";
import { createTransport as createXaiTransport } from "../../packages/provider/xai/src/transport";

type CreateTransport = typeof createKimiCodingTransport;

class TestTransportError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "TestTransportError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

interface TestErrorEnvelope {
  error?: {
    message?: string;
    code?: string;
  };
}

function isTestErrorEnvelope(x: unknown): x is TestErrorEnvelope {
  return (
    typeof x === "object" &&
    x !== null &&
    "error" in x &&
    typeof (x as { error?: unknown }).error === "object"
  );
}

function createTestTransport(
  createTransport: CreateTransport,
  fetchImpl: typeof fetch,
  timeoutMs = 1000
) {
  return createTransport({
    baseUrl: "https://example.test/",
    timeoutMs,
    fetchImpl,
    defaultHeaders: () => ({ Authorization: "Bearer test-key" }),
    parseErrorBody: (status, body) => {
      let message = `Test error: ${status}`;
      let code: string | undefined;
      if (
        isTestErrorEnvelope(body) &&
        typeof body.error?.message === "string"
      ) {
        message = `Test error ${status}: ${body.error.message}`;
        code =
          typeof body.error.code === "string" ? body.error.code : undefined;
      }
      return code ? { message, code } : { message };
    },
    errorClass: TestTransportError,
    requestFailedPrefix: "Test transport failed",
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function headersFromInit(
  init: RequestInit | undefined
): Record<string, string> {
  const headers = init?.headers;
  if (!headers || headers instanceof Headers || Array.isArray(headers)) {
    return {};
  }
  return headers;
}

function pendingAbortFetch(): typeof fetch {
  return async (_input, init) => {
    return await new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      if (!signal) {
        reject(new Error("missing signal"));
        return;
      }
      signal.addEventListener(
        "abort",
        () => reject(new DOMException("aborted", "AbortError")),
        { once: true }
      );
    });
  };
}

const transportCopies = [
  { name: "kimicoding", createTransport: createKimiCodingTransport },
  { name: "alibaba", createTransport: createAlibabaTransport },
  { name: "xai", createTransport: createXaiTransport },
  { name: "openai", createTransport: createOpenAiTransport },
];

describe.each(transportCopies)(
  "shared provider transport ($name)",
  ({ createTransport }) => {
    it("returns JSON for successful requests", async () => {
      const fetchImpl: typeof fetch = async (input, init) => {
        expect(String(input)).toBe("https://example.test/v1/messages");
        expect(init?.method).toBe("POST");
        expect(headersFromInit(init)).toMatchObject({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        });
        expect(init?.body).toBe(JSON.stringify({ prompt: "hello" }));
        return jsonResponse({ ok: true });
      };

      const transport = createTestTransport(createTransport, fetchImpl);
      await expect(
        transport.postJson("v1/messages", { prompt: "hello" })
      ).resolves.toEqual({ ok: true });
    });

    it("throws parsed error envelopes", async () => {
      const fetchImpl: typeof fetch = async () =>
        jsonResponse(
          { error: { message: "bad request", code: "bad_request" } },
          400
        );

      const transport = createTestTransport(createTransport, fetchImpl);

      await expect(transport.getJson("v1/models")).rejects.toMatchObject({
        name: "TestTransportError",
        message: "Test error 400: bad request",
        status: 400,
        body: { error: { message: "bad request", code: "bad_request" } },
        code: "bad_request",
      });
    });

    it("throws provider errors for unparseable error bodies", async () => {
      const fetchImpl: typeof fetch = async () =>
        new Response("not-json", { status: 502 });

      const transport = createTestTransport(createTransport, fetchImpl);

      await expect(transport.getJson("v1/models")).rejects.toMatchObject({
        name: "TestTransportError",
        message: "Test error: 502",
        status: 502,
        body: null,
      });
    });

    it("wraps network failures", async () => {
      const fetchImpl: typeof fetch = async () => {
        throw new Error("offline");
      };

      const transport = createTestTransport(createTransport, fetchImpl);

      await expect(transport.getJson("v1/models")).rejects.toMatchObject({
        name: "TestTransportError",
        message: "Test transport failed: Error: offline",
        status: 500,
        body: null,
      });
    });

    it("wraps malformed JSON success bodies", async () => {
      const fetchImpl: typeof fetch = async () =>
        new Response("{broken", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      const transport = createTestTransport(createTransport, fetchImpl);

      try {
        await transport.getJson("v1/models");
        throw new Error("expected getJson to throw");
      } catch (error) {
        expect(error).toMatchObject({
          name: "TestTransportError",
          status: 500,
          body: null,
        });
        expect((error as Error).message.toLowerCase()).toContain("failed");
      }
    });

    it("aborts requests on timeout", async () => {
      const transport = createTestTransport(
        createTransport,
        pendingAbortFetch(),
        1
      );

      await expect(transport.getJson("slow")).rejects.toMatchObject({
        name: "TestTransportError",
        message: "Test transport failed: AbortError: aborted",
        status: 500,
      });
    });

    it("aborts requests from external signals", async () => {
      const transport = createTestTransport(
        createTransport,
        pendingAbortFetch()
      );
      const controller = new AbortController();
      const promise = transport.getJson("slow", { signal: controller.signal });

      controller.abort();

      await expect(promise).rejects.toMatchObject({
        name: "TestTransportError",
        message: "Test transport failed: AbortError: aborted",
        status: 500,
      });
    });

    it("aborts requests from already-aborted external signals", async () => {
      const fetchImpl: typeof fetch = async (_input, init) => {
        if (init?.signal?.aborted) {
          throw new DOMException("aborted", "AbortError");
        }
        return jsonResponse({ ok: true });
      };
      const controller = new AbortController();
      controller.abort();
      const transport = createTestTransport(createTransport, fetchImpl);

      await expect(
        transport.getJson("slow", { signal: controller.signal })
      ).rejects.toMatchObject({
        name: "TestTransportError",
        message: "Test transport failed: AbortError: aborted",
        status: 500,
      });
    });

    it("applies per-call base URL, timeout, and headers overrides", async () => {
      const fetchImpl: typeof fetch = async (input, init) => {
        expect(String(input)).toBe("https://override.test/v1/models");
        expect(headersFromInit(init)).toMatchObject({
          Authorization: "Bearer override",
          "x-extra": "1",
        });
        return jsonResponse({ data: [] });
      };

      const transport = createTestTransport(createTransport, fetchImpl);
      await expect(
        transport.getJson("v1/models", {
          baseUrl: "https://override.test/",
          timeoutMs: 5,
          headers: { Authorization: "Bearer override", "x-extra": "1" },
        })
      ).resolves.toEqual({ data: [] });
    });

    it("posts form bodies without forcing JSON content type", async () => {
      const form = new FormData();
      form.set("file", new Blob(["abc"]), "a.txt");
      const fetchImpl: typeof fetch = async (_input, init) => {
        expect(init?.method).toBe("POST");
        expect(init?.body).toBe(form);
        expect(headersFromInit(init)).not.toHaveProperty("Content-Type");
        return jsonResponse({ uploaded: true });
      };

      const transport = createTestTransport(createTransport, fetchImpl);
      await expect(transport.postForm("upload", form)).resolves.toEqual({
        uploaded: true,
      });
    });

    it("returns binary responses", async () => {
      const bytes = new Uint8Array([1, 2, 3]);
      const fetchImpl: typeof fetch = async () => new Response(bytes);
      const transport = createTestTransport(createTransport, fetchImpl);

      await expect(transport.getBinary("asset")).resolves.toEqual(bytes.buffer);
    });

    it("returns text responses", async () => {
      const fetchImpl: typeof fetch = async () => new Response("plain text");
      const transport = createTestTransport(createTransport, fetchImpl);

      await expect(transport.getText("asset.txt")).resolves.toBe("plain text");
    });

    it("returns raw responses", async () => {
      const fetchImpl: typeof fetch = async (_input, init) => {
        expect(init?.method).toBe("POST");
        expect(init?.body).toBe("payload");
        expect(headersFromInit(init)).toMatchObject({
          "Content-Type": "text/event-stream",
        });
        return new Response("event: done\n\n");
      };

      const transport = createTestTransport(createTransport, fetchImpl);
      const res = await transport.raw("stream", {
        method: "POST",
        headers: { "Content-Type": "text/event-stream" },
        body: "payload",
      });

      expect(res).toBeInstanceOf(Response);
      await expect(res.text()).resolves.toBe("event: done\n\n");
    });
  }
);
