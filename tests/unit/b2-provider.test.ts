import { describe, expect, it, vi } from "vitest";

import { createB2 } from "../../packages/provider/b2/src";

describe("b2 provider", () => {
  it("uses the Backblaze endpoint, path-style requests, and s3 signing", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      return new Response(null, {
        status: 200,
        headers: { etag: '"abc123"', "x-amz-version-id": "version-1" },
      });
    });
    const b2 = createB2({
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key",
      region: "us-west-004",
      fetch,
    });

    const result = await b2.objects.put({
      bucket: "test-bucket",
      key: "folder/a b.txt",
      body: "hello",
      contentType: "text/plain",
    });

    expect(result.versionId).toBe("version-1");
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe(
      "https://s3.us-west-004.backblazeb2.com/test-bucket/folder/a%20b.txt"
    );
    expect(init?.method).toBe("PUT");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toContain("/us-west-004/s3/aws4_request");
  });

  it("exposes only the Backblaze-supported subset", () => {
    const b2 = createB2({
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key",
      region: "us-west-004",
    });

    expect("putTagging" in b2.objects).toBe(false);
    expect("getTagging" in b2.objects).toBe(false);
    expect("putVersioning" in b2.buckets).toBe(false);
    expect("objectLambda" in b2).toBe(false);
  });

  it("preserves S3 method schemas on wrapped endpoints", () => {
    const b2 = createB2({
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key",
      region: "us-west-004",
    });

    expect(b2.objects.put.schema.safeParse({}).success).toBe(false);
    expect(
      b2.objects.put.schema.safeParse({
        bucket: "bucket",
        key: "key",
        body: "hello",
      }).success
    ).toBe(true);
  });

  it("presigns object URLs with the B2 endpoint", () => {
    const b2 = createB2({
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key",
      region: "us-west-004",
    });

    const signed = b2.presign.getObject({
      bucket: "test-bucket",
      key: "folder/a.txt",
      expiresIn: 60,
    });

    const url = new URL(signed.url);
    expect(url.origin).toBe("https://s3.us-west-004.backblazeb2.com");
    expect(url.pathname).toBe("/test-bucket/folder/a.txt");
    expect(url.searchParams.get("X-Amz-Credential")).toContain(
      "/us-west-004/s3/aws4_request"
    );
  });
});
