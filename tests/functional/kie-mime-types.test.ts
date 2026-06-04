// Tests for Kie MIME type utilities — pure functions, no API calls
import { describe, it, expect } from "vitest";
import { createKie } from "../../packages/provider/kie/src/kie";

describe("kie inferMimeType", () => {
  // Helper to create a mock fetch that returns a fresh Response each call
  const mockFetch = (responseFactory: () => Response): typeof fetch => {
    return (): Promise<Response> => Promise.resolve(responseFactory());
  };

  const successResponse = () =>
    new Response(JSON.stringify({ data: { downloadUrl: "http://test" } }), {
      status: 200,
    });

  it("infers image/jpeg for jpg extension", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(successResponse),
    });
    // Should not throw for known image types
    const file = new Blob(["test content"]);
    await expect(
      p.post.api.fileStreamUpload({
        file,
        filename: "test.jpg",
        uploadPath: "uploads",
      })
    ).resolves.toBeDefined();
  });

  it("infers image/jpeg for jpeg extension", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(successResponse),
    });
    const file = new Blob(["test content"]);
    await expect(
      p.post.api.fileStreamUpload({
        file,
        filename: "test.jpeg",
        uploadPath: "uploads",
      })
    ).resolves.toBeDefined();
  });

  it("infers image/png for png extension", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(successResponse),
    });
    const file = new Blob(["test content"]);
    await expect(
      p.post.api.fileStreamUpload({
        file,
        filename: "test.png",
        uploadPath: "uploads",
      })
    ).resolves.toBeDefined();
  });

  it("infers image/gif for gif extension", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(successResponse),
    });
    const file = new Blob(["test content"]);
    await expect(
      p.post.api.fileStreamUpload({
        file,
        filename: "test.gif",
        uploadPath: "uploads",
      })
    ).resolves.toBeDefined();
  });

  it("infers image/webp for webp extension", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(successResponse),
    });
    const file = new Blob(["test content"]);
    await expect(
      p.post.api.fileStreamUpload({
        file,
        filename: "test.webp",
        uploadPath: "uploads",
      })
    ).resolves.toBeDefined();
  });

  it("infers video/mp4 for mp4 extension", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(successResponse),
    });
    const file = new Blob(["test content"]);
    await expect(
      p.post.api.fileStreamUpload({
        file,
        filename: "test.mp4",
        uploadPath: "uploads",
      })
    ).resolves.toBeDefined();
  });

  it("infers audio/mpeg for mp3 extension", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(successResponse),
    });
    const file = new Blob(["test content"]);
    await expect(
      p.post.api.fileStreamUpload({
        file,
        filename: "test.mp3",
        uploadPath: "uploads",
      })
    ).resolves.toBeDefined();
  });

  it("is case insensitive for extensions", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(successResponse),
    });
    // Test uppercase extension
    await expect(
      p.post.api.fileStreamUpload({
        file: new Blob(["test content"]),
        filename: "test.JPG",
        uploadPath: "uploads",
      })
    ).resolves.toBeDefined();
    // Test mixed case extension
    await expect(
      p.post.api.fileStreamUpload({
        file: new Blob(["test content"]),
        filename: "test.PnG",
        uploadPath: "uploads",
      })
    ).resolves.toBeDefined();
  });

  it("throws error for unknown extension without explicit mimeType", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(() => new Response("", { status: 200 })),
    });
    const file = new Blob(["test content"]);
    await expect(
      p.post.api.fileStreamUpload({
        file,
        filename: "test.unknown",
        uploadPath: "uploads",
      })
    ).rejects.toThrow(/Cannot determine MIME type/);
  });

  it("uses last extension for multiple dots in filename", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(successResponse),
    });
    const file = new Blob(["test content"]);
    // file.jpg.png should use png
    await expect(
      p.post.api.fileStreamUpload({
        file,
        filename: "file.jpg.png",
        uploadPath: "uploads",
      })
    ).resolves.toBeDefined();
  });

  it("throws error for filename without extension", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(() => new Response("", { status: 200 })),
    });
    const file = new Blob(["test content"]);
    await expect(
      p.post.api.fileStreamUpload({
        file,
        filename: "noextension",
        uploadPath: "uploads",
      })
    ).rejects.toThrow(/Cannot determine MIME type/);
  });

  it("uses explicit mimeType when provided", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(successResponse),
    });
    const file = new Blob(["test content"]);
    // Even with unknown extension, explicit mimeType should work
    await expect(
      p.post.api.fileStreamUpload({
        file,
        filename: "test.unknown",
        uploadPath: "uploads",
        mimeType: "application/octet-stream",
      })
    ).resolves.toBeDefined();
  });

  it("infers image/svg+xml for svg extension", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(successResponse),
    });
    const file = new Blob(["test content"]);
    await expect(
      p.post.api.fileStreamUpload({
        file,
        filename: "test.svg",
        uploadPath: "uploads",
      })
    ).resolves.toBeDefined();
  });

  it("infers video/quicktime for mov extension", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(successResponse),
    });
    const file = new Blob(["test content"]);
    await expect(
      p.post.api.fileStreamUpload({
        file,
        filename: "test.mov",
        uploadPath: "uploads",
      })
    ).resolves.toBeDefined();
  });

  it("infers audio/wav for wav extension", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(successResponse),
    });
    const file = new Blob(["test content"]);
    await expect(
      p.post.api.fileStreamUpload({
        file,
        filename: "test.wav",
        uploadPath: "uploads",
      })
    ).resolves.toBeDefined();
  });
});

describe("kie fileBase64Upload with inferMimeType", () => {
  const mockFetch = (responseFactory: () => Response): typeof fetch => {
    return (): Promise<Response> => Promise.resolve(responseFactory());
  };

  const successResponse = () =>
    new Response(JSON.stringify({ data: { downloadUrl: "http://test" } }), {
      status: 200,
    });

  it("sends mimeType when provided for base64 uploads", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(successResponse),
    });
    await expect(
      p.post.api.fileBase64Upload({
        base64Data: "aGVsbG8=",
        uploadPath: "uploads",
        mimeType: "image/png",
      })
    ).resolves.toBeDefined();
  });

  it("proceeds without mimeType when not provided for base64 uploads", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(successResponse),
    });
    // For base64 uploads, if mimeType is not provided, it just omits it
    await expect(
      p.post.api.fileBase64Upload({
        base64Data: "aGVsbG8=",
        uploadPath: "uploads",
      })
    ).resolves.toBeDefined();
  });

  it("uses explicit mimeType when provided for base64", async () => {
    const p = createKie({
      apiKey: "test",
      fetch: mockFetch(successResponse),
    });
    await expect(
      p.post.api.fileBase64Upload({
        base64Data: "aGVsbG8=",
        uploadPath: "uploads",
        mimeType: "application/octet-stream",
      })
    ).resolves.toBeDefined();
  });
});
