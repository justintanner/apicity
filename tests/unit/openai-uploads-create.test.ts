import { describe, expect, it, vi } from "vitest";

import { createOpenAi } from "../../packages/provider/openai/src/openai";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("openai uploads create", () => {
  it("posts create upload requests as JSON", async () => {
    const upload = {
      id: "upload_abc123",
      object: "upload",
      bytes: 2147483648,
      created_at: 1719184911,
      expires_at: 1719127296,
      filename: "training_examples.jsonl",
      purpose: "fine-tune",
      status: "pending",
    };
    const request = {
      purpose: "fine-tune" as const,
      filename: "training_examples.jsonl",
      bytes: 2147483648,
      mime_type: "text/jsonl",
      expires_after: {
        anchor: "created_at" as const,
        seconds: 3600,
      },
    };
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse(upload));
    const provider = createOpenAi({
      apiKey: "sk-test-key",
      baseURL: "https://api.openai.test/v1",
      fetch: mockFetch as unknown as typeof fetch,
    });

    const result = await provider.post.v1.uploads(request);

    expect(result).toEqual(upload);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit,
    ];
    expect(String(url)).toBe("https://api.openai.test/v1/uploads");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer sk-test-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toEqual(request);
  });

  it("validates create upload payloads", () => {
    const provider = createOpenAi({ apiKey: "sk-test-key" });

    const valid = provider.post.v1.uploads.schema.safeParse({
      purpose: "vision",
      filename: "image.png",
      bytes: 12345,
      mime_type: "image/png",
      expires_after: {
        anchor: "created_at",
        seconds: 2592000,
      },
    });
    expect(valid.success).toBe(true);

    const missingMimeType = provider.post.v1.uploads.schema.safeParse({
      purpose: "vision",
      filename: "image.png",
      bytes: 12345,
    });
    expect(missingMimeType.success).toBe(false);

    const invalidPurpose = provider.post.v1.uploads.schema.safeParse({
      purpose: "user_data",
      filename: "notes.txt",
      bytes: 12345,
      mime_type: "text/plain",
    });
    expect(invalidPurpose.success).toBe(false);

    const expiresTooSoon = provider.post.v1.uploads.schema.safeParse({
      purpose: "batch",
      filename: "batch.jsonl",
      bytes: 12345,
      mime_type: "text/jsonl",
      expires_after: {
        anchor: "created_at",
        seconds: 3599,
      },
    });
    expect(expiresTooSoon.success).toBe(false);
  });
});
