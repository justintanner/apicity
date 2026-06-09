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
  it("signs and creates a bucket with a location constraint", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      return new Response(null, {
        status: 200,
        headers: { location: "/test-bucket" },
      });
    });
    const s3 = createS3({
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key",
      region: "us-west-2",
      endpoint: "https://s3.us-west-2.amazonaws.com",
      forcePathStyle: true,
      fetch,
    });

    const result = await s3.buckets.create({
      bucket: "test-bucket",
      objectOwnership: "BucketOwnerEnforced",
    });

    expect(result.location).toBe("/test-bucket");
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe("https://s3.us-west-2.amazonaws.com/test-bucket");
    expect(init?.method).toBe("PUT");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=/);
    expect(headers["Content-Type"]).toBe("application/xml");
    expect(headers["x-amz-object-ownership"]).toBe("BucketOwnerEnforced");
    expect(new TextDecoder().decode(init?.body as Uint8Array)).toContain(
      "<LocationConstraint>us-west-2</LocationConstraint>"
    );
  });

  it("signs and deletes a bucket request", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      return new Response(null, { status: 204 });
    });
    const s3 = createTestS3(fetch);

    await s3.buckets.del({
      bucket: "test-bucket",
      expectedBucketOwner: "123456789012",
    });

    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe("https://s3.us-east-1.amazonaws.com/test-bucket");
    expect(init?.method).toBe("DELETE");
    const headers = init?.headers as Record<string, string>;
    expect(headers["x-amz-expected-bucket-owner"]).toBe("123456789012");
  });

  it("parses HeadBucket response headers", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      return new Response(null, {
        status: 200,
        headers: {
          "x-amz-bucket-region": "us-east-1",
          "x-amz-access-point-alias": "false",
        },
      });
    });
    const s3 = createTestS3(fetch);

    const result = await s3.buckets.head({ bucket: "test-bucket" });

    expect(result.bucketRegion).toBe("us-east-1");
    expect(result.accessPointAlias).toBe(false);
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe("https://s3.us-east-1.amazonaws.com/test-bucket");
    expect(init?.method).toBe("HEAD");
  });

  it("parses GetBucketLocation XML responses", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      return new Response(
        [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<LocationConstraint xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
          "us-west-2",
          "</LocationConstraint>",
        ].join(""),
        { status: 200 }
      );
    });
    const s3 = createTestS3(fetch);

    const result = await s3.buckets.location({ bucket: "test-bucket" });

    expect(result.locationConstraint).toBe("us-west-2");
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?location"
    );
    expect(init?.method).toBe("GET");
  });

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

  it("signs and copies an object request", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      return new Response(
        [
          "<CopyObjectResult>",
          '<ETag>"copy-etag"</ETag>',
          "<LastModified>2026-06-09T00:00:00.000Z</LastModified>",
          "</CopyObjectResult>",
        ].join(""),
        {
          status: 200,
          headers: { "x-amz-copy-source-version-id": "source-version" },
        }
      );
    });
    const s3 = createTestS3(fetch);

    const result = await s3.objects.copy({
      bucket: "dest-bucket",
      key: "copy.txt",
      sourceBucket: "source-bucket",
      sourceKey: "folder/a b.txt",
      metadata: { copied: "yes" },
    });

    expect(result.eTag).toBe('"copy-etag"');
    expect(result.copySourceVersionId).toBe("source-version");
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe(
      "https://s3.us-east-1.amazonaws.com/dest-bucket/copy.txt"
    );
    expect(init?.method).toBe("PUT");
    const headers = init?.headers as Record<string, string>;
    expect(headers["x-amz-copy-source"]).toBe(
      "/source-bucket/folder/a%20b.txt"
    );
    expect(headers["x-amz-metadata-directive"]).toBe("REPLACE");
    expect(headers["x-amz-meta-copied"]).toBe("yes");
  });

  it("sets, reads, and deletes object tagging requests", async () => {
    const responses = [
      new Response(null, { status: 200 }),
      new Response(
        [
          '<Tagging xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
          "<TagSet>",
          "<Tag><Key>kind</Key><Value>unit</Value></Tag>",
          "<Tag><Key>escaped</Key><Value>a &amp; b</Value></Tag>",
          "</TagSet>",
          "</Tagging>",
        ].join(""),
        { status: 200 }
      ),
      new Response(null, { status: 204 }),
    ];
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      const response = responses.shift();
      if (!response) throw new Error("unexpected request");
      return response;
    });
    const s3 = createTestS3(fetch);

    await s3.objects.putTagging({
      bucket: "test-bucket",
      key: "tags.txt",
      tagSet: [
        { key: "kind", value: "unit" },
        { key: "escaped", value: "a & b" },
      ],
    });
    const tags = await s3.objects.getTagging({
      bucket: "test-bucket",
      key: "tags.txt",
    });
    await s3.objects.delTagging({
      bucket: "test-bucket",
      key: "tags.txt",
    });

    expect(tags.tagSet).toEqual([
      { key: "kind", value: "unit" },
      { key: "escaped", value: "a & b" },
    ]);
    expect(fetch).toHaveBeenCalledTimes(3);

    const [putUrl, putInit] = fetch.mock.calls[0];
    expect(String(putUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/tags.txt?tagging"
    );
    expect(putInit?.method).toBe("PUT");
    expect(new TextDecoder().decode(putInit?.body as Uint8Array)).toContain(
      "<Value>a &amp; b</Value>"
    );

    const [getUrl, getInit] = fetch.mock.calls[1];
    expect(String(getUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/tags.txt?tagging"
    );
    expect(getInit?.method).toBe("GET");

    const [deleteUrl, deleteInit] = fetch.mock.calls[2];
    expect(String(deleteUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/tags.txt?tagging"
    );
    expect(deleteInit?.method).toBe("DELETE");
  });

  it("creates, uploads, lists, and completes multipart uploads", async () => {
    const responses = [
      new Response(
        [
          "<InitiateMultipartUploadResult>",
          "<Bucket>test-bucket</Bucket>",
          "<Key>large.txt</Key>",
          "<UploadId>upload-1</UploadId>",
          "</InitiateMultipartUploadResult>",
        ].join(""),
        { status: 200 }
      ),
      new Response(null, {
        status: 200,
        headers: { etag: '"part-1"' },
      }),
      new Response(
        [
          "<ListPartsResult>",
          "<Bucket>test-bucket</Bucket>",
          "<Key>large.txt</Key>",
          "<UploadId>upload-1</UploadId>",
          "<IsTruncated>false</IsTruncated>",
          "<Part>",
          "<PartNumber>1</PartNumber>",
          '<ETag>"part-1"</ETag>',
          "<Size>11</Size>",
          "</Part>",
          "</ListPartsResult>",
        ].join(""),
        { status: 200 }
      ),
      new Response(
        [
          "<CompleteMultipartUploadResult>",
          "<Location>https://test-bucket.s3.amazonaws.com/large.txt</Location>",
          "<Bucket>test-bucket</Bucket>",
          "<Key>large.txt</Key>",
          '<ETag>"complete"</ETag>',
          "</CompleteMultipartUploadResult>",
        ].join(""),
        { status: 200 }
      ),
    ];
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      const response = responses.shift();
      if (!response) throw new Error("unexpected request");
      return response;
    });
    const s3 = createTestS3(fetch);

    const created = await s3.objects.createMultipartUpload({
      bucket: "test-bucket",
      key: "large.txt",
      contentType: "text/plain",
      metadata: { source: "unit" },
      checksumAlgorithm: "SHA256",
    });
    const part = await s3.objects.uploadPart({
      bucket: "test-bucket",
      key: "large.txt",
      uploadId: created.uploadId,
      partNumber: 1,
      body: "hello world",
    });
    const listed = await s3.objects.listParts({
      bucket: "test-bucket",
      key: "large.txt",
      uploadId: created.uploadId,
    });
    const complete = await s3.objects.completeMultipartUpload({
      bucket: "test-bucket",
      key: "large.txt",
      uploadId: created.uploadId,
      parts: [{ partNumber: 1, eTag: part.eTag ?? "" }],
    });

    expect(created.uploadId).toBe("upload-1");
    expect(listed.parts[0]).toMatchObject({
      partNumber: 1,
      eTag: '"part-1"',
      size: 11,
    });
    expect(complete.eTag).toBe('"complete"');
    expect(fetch).toHaveBeenCalledTimes(4);

    const [createUrl, createInit] = fetch.mock.calls[0];
    expect(String(createUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/large.txt?uploads"
    );
    expect(createInit?.method).toBe("POST");
    const createHeaders = createInit?.headers as Record<string, string>;
    expect(createHeaders["Content-Type"]).toBe("text/plain");
    expect(createHeaders["x-amz-meta-source"]).toBe("unit");
    expect(createHeaders["x-amz-checksum-algorithm"]).toBe("SHA256");

    const [partUrl, partInit] = fetch.mock.calls[1];
    expect(String(partUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/large.txt?partNumber=1&uploadId=upload-1"
    );
    expect(partInit?.method).toBe("PUT");
    expect(part.eTag).toBe('"part-1"');

    const [listUrl, listInit] = fetch.mock.calls[2];
    expect(String(listUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/large.txt?uploadId=upload-1"
    );
    expect(listInit?.method).toBe("GET");

    const [completeUrl, completeInit] = fetch.mock.calls[3];
    expect(String(completeUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/large.txt?uploadId=upload-1"
    );
    expect(completeInit?.method).toBe("POST");
    expect(
      new TextDecoder().decode(completeInit?.body as Uint8Array)
    ).toContain("<PartNumber>1</PartNumber>");
  });

  it("copies parts, lists active multipart uploads, and aborts them", async () => {
    const responses = [
      new Response(
        [
          "<CopyPartResult>",
          "<LastModified>2026-06-09T00:00:00.000Z</LastModified>",
          '<ETag>"copy-part"</ETag>',
          "</CopyPartResult>",
        ].join(""),
        { status: 200 }
      ),
      new Response(
        [
          "<ListMultipartUploadsResult>",
          "<Bucket>test-bucket</Bucket>",
          "<IsTruncated>false</IsTruncated>",
          "<Upload>",
          "<Key>copy.txt</Key>",
          "<UploadId>upload-copy</UploadId>",
          "<StorageClass>STANDARD</StorageClass>",
          "<Initiated>2026-06-09T00:00:00.000Z</Initiated>",
          "</Upload>",
          "</ListMultipartUploadsResult>",
        ].join(""),
        { status: 200 }
      ),
      new Response(null, { status: 204 }),
    ];
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      const response = responses.shift();
      if (!response) throw new Error("unexpected request");
      return response;
    });
    const s3 = createTestS3(fetch);

    const copied = await s3.objects.uploadPartCopy({
      bucket: "test-bucket",
      key: "copy.txt",
      uploadId: "upload-copy",
      partNumber: 1,
      sourceBucket: "source-bucket",
      sourceKey: "folder/source.txt",
      copySourceRange: "bytes=0-10",
    });
    const uploads = await s3.objects.listMultipartUploads({
      bucket: "test-bucket",
      prefix: "copy",
    });
    await s3.objects.abortMultipartUpload({
      bucket: "test-bucket",
      key: "copy.txt",
      uploadId: "upload-copy",
    });

    expect(copied.eTag).toBe('"copy-part"');
    expect(uploads.uploads[0]).toMatchObject({
      key: "copy.txt",
      uploadId: "upload-copy",
      storageClass: "STANDARD",
    });

    const [copyUrl, copyInit] = fetch.mock.calls[0];
    expect(String(copyUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/copy.txt?partNumber=1&uploadId=upload-copy"
    );
    expect(copyInit?.method).toBe("PUT");
    const copyHeaders = copyInit?.headers as Record<string, string>;
    expect(copyHeaders["x-amz-copy-source"]).toBe(
      "/source-bucket/folder/source.txt"
    );
    expect(copyHeaders["x-amz-copy-source-range"]).toBe("bytes=0-10");

    const [listUrl, listInit] = fetch.mock.calls[1];
    expect(String(listUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?uploads&prefix=copy"
    );
    expect(listInit?.method).toBe("GET");

    const [abortUrl, abortInit] = fetch.mock.calls[2];
    expect(String(abortUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/copy.txt?uploadId=upload-copy"
    );
    expect(abortInit?.method).toBe("DELETE");
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
