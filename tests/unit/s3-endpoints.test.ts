import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import { createS3, S3Error } from "../../packages/provider/s3/src";

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function createTestS3(fetch: typeof globalThis.fetch, forcePathStyle = true) {
  return createS3({
    accessKeyId: "test-access-key",
    secretAccessKey: "test-secret-key",
    region: "us-east-1",
    endpoint: "https://s3.us-east-1.amazonaws.com",
    forcePathStyle,
    fetch,
  });
}

describe("s3 endpoints", () => {
  it("signs and PUTs a path-style object request", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      return new Response(null, {
        status: 200,
        headers: { etag: '"abc123"' },
      });
    });
    const s3 = createTestS3(fetch);

    const result = await s3.objects.put({
      bucket: "test-bucket",
      key: "folder/a b.txt",
      body: "hello",
      contentType: "text/plain",
      metadata: { source: "unit" },
    });

    expect(result.eTag).toBe('"abc123"');
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/folder/a%20b.txt"
    );
    expect(init?.method).toBe("PUT");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=/);
    expect(headers["x-amz-content-sha256"]).toBe(sha256Hex("hello"));
    expect(headers["x-amz-date"]).toMatch(/^\d{8}T\d{6}Z$/);
    expect(headers["Content-Type"]).toBe("text/plain");
    expect(headers["x-amz-meta-source"]).toBe("unit");
  });

  it("uses virtual-hosted URLs by default for AWS-compatible bucket names", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      return new Response(null, { status: 200 });
    });
    const s3 = createTestS3(fetch, false);

    await s3.objects.head({ bucket: "test-bucket", key: "a.txt" });

    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe(
      "https://test-bucket.s3.us-east-1.amazonaws.com/a.txt"
    );
    expect(init?.method).toBe("HEAD");
  });

  it("parses ListObjectsV2 XML responses", async () => {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
      "<Name>test-bucket</Name>",
      "<Prefix>apicity-tests/</Prefix>",
      "<KeyCount>1</KeyCount>",
      "<MaxKeys>10</MaxKeys>",
      "<IsTruncated>false</IsTruncated>",
      "<Contents>",
      "<Key>apicity-tests/object-core.txt</Key>",
      "<LastModified>2026-06-08T00:00:00.000Z</LastModified>",
      '<ETag>"etag"</ETag>',
      "<Size>38</Size>",
      "<StorageClass>STANDARD</StorageClass>",
      "</Contents>",
      "</ListBucketResult>",
    ].join("");
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      return new Response(xml, { status: 200 });
    });
    const s3 = createTestS3(fetch);

    const result = await s3.objects.list({
      bucket: "test-bucket",
      prefix: "apicity-tests/",
      maxKeys: 10,
    });

    expect(result.name).toBe("test-bucket");
    expect(result.keyCount).toBe(1);
    expect(result.isTruncated).toBe(false);
    expect(result.contents[0]).toMatchObject({
      key: "apicity-tests/object-core.txt",
      size: 38,
      storageClass: "STANDARD",
    });
  });

  it("throws S3Error with parsed XML error details", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      return new Response(
        [
          "<Error>",
          "<Code>NoSuchKey</Code>",
          "<Message>The specified key does not exist.</Message>",
          "<RequestId>request-id</RequestId>",
          "<HostId>host-id</HostId>",
          "</Error>",
        ].join(""),
        { status: 404 }
      );
    });
    const s3 = createTestS3(fetch);

    await expect(
      s3.objects.get({ bucket: "test-bucket", key: "missing.txt" })
    ).rejects.toMatchObject({
      name: "S3Error",
      status: 404,
      code: "NoSuchKey",
      requestId: "request-id",
      hostId: "host-id",
    } satisfies Partial<S3Error>);
  });
});
