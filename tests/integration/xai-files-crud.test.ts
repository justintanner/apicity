import { describe, it, expect } from "vitest";
import { createXai } from "@apicity/xai";

interface FetchCall {
  url: string;
  method: string;
  body?: unknown;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseJsonBody(body: BodyInit | null | undefined): unknown {
  if (typeof body !== "string") return undefined;
  return JSON.parse(body) as unknown;
}

function createQueuedFetch(responses: unknown[]): {
  calls: FetchCall[];
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
} {
  const calls: FetchCall[] = [];

  return {
    calls,
    fetch: async (input, init) => {
      const response = responses.shift();
      if (response === undefined) {
        throw new Error("No queued response for fake fetch");
      }

      calls.push({
        url: input instanceof Request ? input.url : String(input),
        method:
          init?.method ?? (input instanceof Request ? input.method : "GET"),
        body: parseJsonBody(init?.body),
      });

      if (response instanceof Response) return response;
      return jsonResponse(response);
    },
  };
}

describe("xAI files CRUD integration", () => {
  describe("schema validation", () => {
    it("should have files namespace under get.v1", () => {
      const provider = createXai({ apiKey: "test-key" });
      expect(provider.get.v1.files).toBeDefined();
      expect(provider.get.v1.files).toBeTypeOf("function");
    });

    it("should have files delete under delete.v1", () => {
      const provider = createXai({ apiKey: "test-key" });
      expect(provider.delete.v1.files).toBeDefined();
      expect(provider.delete.v1.files).toBeTypeOf("function");
    });

    it("should expose files public URL create and revoke methods", () => {
      const provider = createXai({ apiKey: "test-key" });
      expect(provider.post.v1.files.publicUrl).toBeDefined();
      expect(provider.post.v1.files.publicUrl).toBeTypeOf("function");
      expect(provider.post.v1.files.publicUrl.revoke).toBeDefined();
      expect(provider.post.v1.files.publicUrl.revoke).toBeTypeOf("function");
    });

    it("validates public URL expiry bounds", () => {
      const provider = createXai({ apiKey: "test-key" });
      const schema = provider.post.v1.files.publicUrl.schema;

      expect(schema.safeParse({}).success).toBe(true);
      expect(schema.safeParse({ expires_after: 3600 }).success).toBe(true);
      expect(schema.safeParse({ expires_after: 2592000 }).success).toBe(true);
      expect(schema.safeParse({ expires_after: 3599 }).success).toBe(false);
      expect(schema.safeParse({ expires_after: 2592001 }).success).toBe(false);
    });
  });

  describe("public URL requests", () => {
    it("creates a public URL with an empty default body", async () => {
      const { calls, fetch } = createQueuedFetch([
        {
          public_url: "https://files-cdn.x.ai/token/file_diagram.png",
        },
      ]);
      const provider = createXai({ apiKey: "test-key", fetch });

      const result = await provider.post.v1.files.publicUrl("file_diagram");

      expect(calls).toEqual([
        {
          url: "https://api.x.ai/v1/files/file_diagram/public-url",
          method: "POST",
          body: {},
        },
      ]);
      expect(result.public_url).toBe(
        "https://files-cdn.x.ai/token/file_diagram.png"
      );
      expect(result.expires_at).toBeUndefined();
    });

    it("keeps the same token when updating public URL expiry", async () => {
      const publicUrl = "https://files-cdn.x.ai/token/file_photo.png";
      const { calls, fetch } = createQueuedFetch([
        { public_url: publicUrl, expires_at: 1782945600 },
        { public_url: publicUrl, expires_at: 1783546800 },
      ]);
      const provider = createXai({ apiKey: "test-key", fetch });

      const first = await provider.post.v1.files.publicUrl("file_photo", {
        expires_after: 86400,
      });
      const second = await provider.post.v1.files.publicUrl("file_photo", {
        expires_after: 604800,
      });

      expect(calls).toEqual([
        {
          url: "https://api.x.ai/v1/files/file_photo/public-url",
          method: "POST",
          body: { expires_after: 86400 },
        },
        {
          url: "https://api.x.ai/v1/files/file_photo/public-url",
          method: "POST",
          body: { expires_after: 604800 },
        },
      ]);
      expect(first.public_url).toBe(publicUrl);
      expect(second.public_url).toBe(publicUrl);
      expect(second.expires_at).toBeGreaterThan(first.expires_at ?? 0);
    });

    it("revokes public URLs idempotently without deleting the file", async () => {
      const publicUrl = "https://files-cdn.x.ai/token/file_photo.png";
      const { calls, fetch } = createQueuedFetch([
        { id: "file_photo", revoked: true, public_url: publicUrl },
        { id: "file_photo", revoked: false },
      ]);
      const provider = createXai({ apiKey: "test-key", fetch });

      const first = await provider.post.v1.files.publicUrl.revoke("file_photo");
      const second =
        await provider.post.v1.files.publicUrl.revoke("file_photo");

      expect(calls).toEqual([
        {
          url: "https://api.x.ai/v1/files/file_photo/public-url/revoke",
          method: "POST",
          body: {},
        },
        {
          url: "https://api.x.ai/v1/files/file_photo/public-url/revoke",
          method: "POST",
          body: {},
        },
      ]);
      expect(first).toMatchObject({
        id: "file_photo",
        revoked: true,
        public_url: publicUrl,
      });
      expect(second).toMatchObject({ id: "file_photo", revoked: false });
    });
  });

  describe("public URL metadata", () => {
    it("lists files with public URL filters and preserves metadata fields", async () => {
      const { calls, fetch } = createQueuedFetch([
        {
          object: "list",
          data: [
            {
              id: "file_public_pdf",
              object: "file",
              bytes: 1024,
              created_at: 1782942000,
              expires_at: null,
              filename: "guide.pdf",
              purpose: "assistants",
              public_url: "https://files-cdn.x.ai/token/guide.pdf",
              public_url_expires_at: 1783028400,
            },
          ],
          pagination_token: "next_page",
        },
      ]);
      const provider = createXai({ apiKey: "test-key", fetch });

      const result = await provider.get.v1.files({
        filter: "public_url != null",
        limit: 10,
      });

      expect(calls).toEqual([
        {
          url: "https://api.x.ai/v1/files?filter=public_url%20!%3D%20null&limit=10",
          method: "GET",
          body: undefined,
        },
      ]);
      expect("data" in result && result.data[0]).toMatchObject({
        id: "file_public_pdf",
        public_url: "https://files-cdn.x.ai/token/guide.pdf",
        public_url_expires_at: 1783028400,
      });
      expect("pagination_token" in result && result.pagination_token).toBe(
        "next_page"
      );
    });

    it("gets file metadata with inherited public URL expiration", async () => {
      const { calls, fetch } = createQueuedFetch([
        {
          id: "file_short_lived",
          object: "file",
          bytes: 2048,
          created_at: 1782942000,
          expires_at: 1783028400,
          filename: "short-lived.png",
          purpose: "assistants",
          public_url: "https://files-cdn.x.ai/token/short-lived.png",
          public_url_expires_at: 1783028400,
        },
      ]);
      const provider = createXai({ apiKey: "test-key", fetch });

      const result = await provider.get.v1.files("file_short_lived");

      expect(calls).toEqual([
        {
          url: "https://api.x.ai/v1/files/file_short_lived",
          method: "GET",
          body: undefined,
        },
      ]);
      expect("id" in result && result).toMatchObject({
        id: "file_short_lived",
        expires_at: 1783028400,
        public_url: "https://files-cdn.x.ai/token/short-lived.png",
        public_url_expires_at: 1783028400,
      });
    });
  });
});
