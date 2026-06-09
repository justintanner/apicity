import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import { createS3, S3Error } from "../../packages/provider/s3/src";

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function md5Base64(value: string): string {
  return createHash("md5").update(value).digest("base64");
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
      contentMD5: "aGVsbG8=",
      checksumAlgorithm: "SHA256",
      checksumSHA256: "sha256-checksum",
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
    expect(headers["Content-MD5"]).toBe("aGVsbG8=");
    expect(headers["x-amz-checksum-algorithm"]).toBe("SHA256");
    expect(headers["x-amz-checksum-sha256"]).toBe("sha256-checksum");
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
      checksumAlgorithm: "SHA256",
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
    expect(headers["x-amz-checksum-algorithm"]).toBe("SHA256");
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

  it("gets and puts object ACL requests", async () => {
    const aclXml = [
      "<AccessControlPolicy>",
      "<Owner><ID>owner-id</ID><DisplayName>owner</DisplayName></Owner>",
      "<AccessControlList>",
      "<Grant>",
      '<Grantee xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="CanonicalUser">',
      "<ID>grantee-id</ID><DisplayName>grantee</DisplayName>",
      "</Grantee>",
      "<Permission>READ</Permission>",
      "</Grant>",
      "</AccessControlList>",
      "</AccessControlPolicy>",
    ].join("");
    const responses = [
      new Response(aclXml, { status: 200 }),
      new Response(null, { status: 200 }),
    ];
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      const response = responses.shift();
      if (!response) throw new Error("unexpected request");
      return response;
    });
    const s3 = createTestS3(fetch);

    const acl = await s3.objects.getAcl({
      bucket: "test-bucket",
      key: "governed.txt",
      versionId: "v1",
    });
    await s3.objects.putAcl({
      bucket: "test-bucket",
      key: "governed.txt",
      acl: "bucket-owner-full-control",
      expectedBucketOwner: "123456789012",
    });

    expect(acl.owner).toEqual({ id: "owner-id", displayName: "owner" });
    expect(acl.grants[0]).toEqual({
      grantee: {
        type: "CanonicalUser",
        id: "grantee-id",
        displayName: "grantee",
        uri: undefined,
        emailAddress: undefined,
      },
      permission: "READ",
    });

    const [getUrl, getInit] = fetch.mock.calls[0];
    expect(String(getUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/governed.txt?acl&versionId=v1"
    );
    expect(getInit?.method).toBe("GET");

    const [putUrl, putInit] = fetch.mock.calls[1];
    expect(String(putUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/governed.txt?acl"
    );
    expect(putInit?.method).toBe("PUT");
    const headers = putInit?.headers as Record<string, string>;
    expect(headers["x-amz-acl"]).toBe("bucket-owner-full-control");
    expect(headers["x-amz-expected-bucket-owner"]).toBe("123456789012");
  });

  it("gets object attributes with requested attribute headers", async () => {
    const attributesXml = [
      "<GetObjectAttributesResponse>",
      '<ETag>"etag"</ETag>',
      "<Checksum><ChecksumSHA256>sha256</ChecksumSHA256></Checksum>",
      "<ObjectSize>42</ObjectSize>",
      "<StorageClass>STANDARD</StorageClass>",
      "<ObjectParts><TotalPartsCount>1</TotalPartsCount></ObjectParts>",
      "</GetObjectAttributesResponse>",
    ].join("");
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      return new Response(attributesXml, {
        status: 200,
        headers: {
          "last-modified": "Tue, 09 Jun 2026 00:00:00 GMT",
          "x-amz-version-id": "v1",
        },
      });
    });
    const s3 = createTestS3(fetch);

    const result = await s3.objects.getAttributes({
      bucket: "test-bucket",
      key: "governed.txt",
      versionId: "v1",
      maxParts: 100,
      objectAttributes: ["ETag", "Checksum", "ObjectSize", "StorageClass"],
    });

    expect(result).toMatchObject({
      eTag: '"etag"',
      checksumSHA256: "sha256",
      objectSize: 42,
      storageClass: "STANDARD",
      versionId: "v1",
    });

    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/governed.txt?attributes&versionId=v1&max-parts=100"
    );
    expect(init?.method).toBe("GET");
    const headers = init?.headers as Record<string, string>;
    expect(headers["x-amz-object-attributes"]).toBe(
      "ETag,Checksum,ObjectSize,StorageClass"
    );
  });

  it("handles object lock, retention, restore, torrent, and select requests", async () => {
    const responses = [
      new Response("<LegalHold><Status>ON</Status></LegalHold>", {
        status: 200,
      }),
      new Response(null, { status: 200 }),
      new Response(
        [
          "<Retention>",
          "<Mode>GOVERNANCE</Mode>",
          "<RetainUntilDate>2026-06-10T00:00:00.000Z</RetainUntilDate>",
          "</Retention>",
        ].join(""),
        { status: 200 }
      ),
      new Response(null, { status: 200 }),
      new Response(
        "<ObjectLockConfiguration><ObjectLockEnabled>Enabled</ObjectLockEnabled></ObjectLockConfiguration>",
        { status: 200 }
      ),
      new Response(null, { status: 200 }),
      new Response(null, { status: 202 }),
      new Response(new Uint8Array([1, 2, 3]), { status: 200 }),
      new Response(new Uint8Array([4, 5, 6]), { status: 200 }),
    ];
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      const response = responses.shift();
      if (!response) throw new Error("unexpected request");
      return response;
    });
    const s3 = createTestS3(fetch);
    const restoreBody = [
      "<RestoreRequest>",
      "<Days>1</Days>",
      "<GlacierJobParameters><Tier>Bulk</Tier></GlacierJobParameters>",
      "</RestoreRequest>",
    ].join("");
    const selectBody = [
      "<SelectObjectContentRequest>",
      "<Expression>SELECT * FROM S3Object</Expression>",
      "<ExpressionType>SQL</ExpressionType>",
      "<InputSerialization><CSV /></InputSerialization>",
      "<OutputSerialization><CSV /></OutputSerialization>",
      "</SelectObjectContentRequest>",
    ].join("");

    const legalHold = await s3.objects.getLegalHold({
      bucket: "test-bucket",
      key: "locked.txt",
    });
    await s3.objects.putLegalHold({
      bucket: "test-bucket",
      key: "locked.txt",
      status: "ON",
    });
    const retention = await s3.objects.getRetention({
      bucket: "test-bucket",
      key: "locked.txt",
    });
    await s3.objects.putRetention({
      bucket: "test-bucket",
      key: "locked.txt",
      mode: "GOVERNANCE",
      retainUntilDate: "2026-06-10T00:00:00.000Z",
      bypassGovernanceRetention: true,
    });
    const objectLock = await s3.buckets.getObjectLockConfiguration({
      bucket: "test-bucket",
    });
    await s3.buckets.putObjectLockConfiguration({
      bucket: "test-bucket",
      body: objectLock.rawXml,
      objectLockToken: "token",
    });
    await s3.objects.restore({
      bucket: "test-bucket",
      key: "archived.txt",
      body: restoreBody,
    });
    const torrent = await s3.objects.getTorrent({
      bucket: "test-bucket",
      key: "public.txt",
    });
    const selected = await s3.objects.selectContent({
      bucket: "test-bucket",
      key: "data.csv",
      body: selectBody,
    });

    expect(legalHold.status).toBe("ON");
    expect(retention.mode).toBe("GOVERNANCE");
    expect(objectLock.objectLockEnabled).toBe("Enabled");
    expect(new Uint8Array(torrent.body)).toEqual(new Uint8Array([1, 2, 3]));
    expect(new Uint8Array(selected.body)).toEqual(new Uint8Array([4, 5, 6]));

    const putLegalHoldBody = new TextDecoder().decode(
      fetch.mock.calls[1][1]?.body as Uint8Array
    );
    expect(putLegalHoldBody).toContain("<Status>ON</Status>");
    const putLegalHoldHeaders = fetch.mock.calls[1][1]?.headers as Record<
      string,
      string
    >;
    expect(putLegalHoldHeaders["Content-MD5"]).toBe(
      md5Base64(putLegalHoldBody)
    );

    expect(String(fetch.mock.calls[6][0])).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/archived.txt?restore"
    );
    expect(fetch.mock.calls[6][1]?.method).toBe("POST");
    expect(String(fetch.mock.calls[7][0])).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/public.txt?torrent"
    );
    expect(String(fetch.mock.calls[8][0])).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/data.csv?select&select-type=2"
    );
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

  it("bulk deletes objects with Content-MD5 and parses delete results", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      return new Response(
        [
          "<DeleteResult>",
          "<Deleted>",
          "<Key>missing-a.txt</Key>",
          "<VersionId>null</VersionId>",
          "</Deleted>",
          "<Error>",
          "<Key>locked.txt</Key>",
          "<VersionId>v1</VersionId>",
          "<Code>AccessDenied</Code>",
          "<Message>denied</Message>",
          "</Error>",
          "</DeleteResult>",
        ].join(""),
        { status: 200 }
      );
    });
    const s3 = createTestS3(fetch);

    const result = await s3.objects.delMany({
      bucket: "test-bucket",
      objects: [
        { key: "missing-a.txt", versionId: "null" },
        { key: "locked.txt", versionId: "v1" },
      ],
      quiet: false,
      expectedBucketOwner: "123456789012",
    });

    expect(result.deleted).toEqual([
      { key: "missing-a.txt", versionId: "null" },
    ]);
    expect(result.errors).toEqual([
      {
        key: "locked.txt",
        versionId: "v1",
        code: "AccessDenied",
        message: "denied",
      },
    ]);

    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?delete"
    );
    expect(init?.method).toBe("POST");
    const body = new TextDecoder().decode(init?.body as Uint8Array);
    expect(body).toContain("<Key>missing-a.txt</Key>");
    expect(body).toContain("<Quiet>false</Quiet>");
    const headers = init?.headers as Record<string, string>;
    expect(headers["Content-MD5"]).toBe(md5Base64(body));
    expect(headers["x-amz-expected-bucket-owner"]).toBe("123456789012");
  });

  it("gets and puts bucket versioning configuration", async () => {
    const responses = [
      new Response(
        [
          "<VersioningConfiguration>",
          "<Status>Suspended</Status>",
          "<MfaDelete>Disabled</MfaDelete>",
          "</VersioningConfiguration>",
        ].join(""),
        { status: 200 }
      ),
      new Response(null, { status: 200 }),
    ];
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      const response = responses.shift();
      if (!response) throw new Error("unexpected request");
      return response;
    });
    const s3 = createTestS3(fetch);

    const versioning = await s3.buckets.getVersioning({
      bucket: "test-bucket",
    });
    await s3.buckets.putVersioning({
      bucket: "test-bucket",
      status: "Suspended",
      expectedBucketOwner: "123456789012",
    });

    expect(versioning).toMatchObject({
      status: "Suspended",
      mfaDelete: "Disabled",
    });

    const [getUrl, getInit] = fetch.mock.calls[0];
    expect(String(getUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?versioning"
    );
    expect(getInit?.method).toBe("GET");

    const [putUrl, putInit] = fetch.mock.calls[1];
    expect(String(putUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?versioning"
    );
    expect(putInit?.method).toBe("PUT");
    const body = new TextDecoder().decode(putInit?.body as Uint8Array);
    expect(body).toContain("<Status>Suspended</Status>");
    const headers = putInit?.headers as Record<string, string>;
    expect(headers["Content-MD5"]).toBe(md5Base64(body));
    expect(headers["x-amz-expected-bucket-owner"]).toBe("123456789012");
  });

  it("sets, reads, and deletes bucket tagging requests", async () => {
    const responses = [
      new Response(null, { status: 200 }),
      new Response(
        [
          '<Tagging xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
          "<TagSet>",
          "<Tag><Key>kind</Key><Value>bucket</Value></Tag>",
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

    await s3.buckets.putTagging({
      bucket: "test-bucket",
      tagSet: [
        { key: "kind", value: "bucket" },
        { key: "escaped", value: "a & b" },
      ],
      expectedBucketOwner: "123456789012",
    });
    const tags = await s3.buckets.getTagging({ bucket: "test-bucket" });
    await s3.buckets.delTagging({ bucket: "test-bucket" });

    expect(tags.tagSet).toEqual([
      { key: "kind", value: "bucket" },
      { key: "escaped", value: "a & b" },
    ]);

    const [putUrl, putInit] = fetch.mock.calls[0];
    expect(String(putUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?tagging"
    );
    expect(putInit?.method).toBe("PUT");
    const putBody = new TextDecoder().decode(putInit?.body as Uint8Array);
    expect(putBody).toContain("<Value>a &amp; b</Value>");
    const putHeaders = putInit?.headers as Record<string, string>;
    expect(putHeaders["Content-MD5"]).toBe(md5Base64(putBody));
    expect(putHeaders["x-amz-expected-bucket-owner"]).toBe("123456789012");

    const [getUrl, getInit] = fetch.mock.calls[1];
    expect(String(getUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?tagging"
    );
    expect(getInit?.method).toBe("GET");

    const [deleteUrl, deleteInit] = fetch.mock.calls[2];
    expect(String(deleteUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?tagging"
    );
    expect(deleteInit?.method).toBe("DELETE");
  });

  it("reads, writes, and deletes raw XML bucket configurations", async () => {
    const corsXml = [
      '<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
      "<CORSRule>",
      "<AllowedOrigin>https://example.com</AllowedOrigin>",
      "<AllowedMethod>GET</AllowedMethod>",
      "</CORSRule>",
      "</CORSConfiguration>",
    ].join("");
    const responses = [
      new Response(null, { status: 200 }),
      new Response(corsXml, { status: 200 }),
      new Response(null, { status: 204 }),
    ];
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      const response = responses.shift();
      if (!response) throw new Error("unexpected request");
      return response;
    });
    const s3 = createTestS3(fetch);

    await s3.buckets.putCors({
      bucket: "test-bucket",
      body: corsXml,
      checksumAlgorithm: "SHA256",
    });
    const cors = await s3.buckets.getCors({ bucket: "test-bucket" });
    await s3.buckets.delCors({ bucket: "test-bucket" });

    expect(cors.rawXml).toBe(corsXml);

    const [putUrl, putInit] = fetch.mock.calls[0];
    expect(String(putUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?cors"
    );
    expect(putInit?.method).toBe("PUT");
    const putHeaders = putInit?.headers as Record<string, string>;
    expect(putHeaders["Content-MD5"]).toBe(md5Base64(corsXml));
    expect(putHeaders["x-amz-sdk-checksum-algorithm"]).toBe("SHA256");

    const [getUrl, getInit] = fetch.mock.calls[1];
    expect(String(getUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?cors"
    );
    expect(getInit?.method).toBe("GET");

    const [deleteUrl, deleteInit] = fetch.mock.calls[2];
    expect(String(deleteUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?cors"
    );
    expect(deleteInit?.method).toBe("DELETE");
  });

  it("handles bucket policy and request payment configurations", async () => {
    const policy = JSON.stringify({
      Version: "2012-10-17",
      Statement: [],
    });
    const requestPaymentXml = [
      '<RequestPaymentConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
      "<Payer>Requester</Payer>",
      "</RequestPaymentConfiguration>",
    ].join("");
    const responses = [
      new Response(policy, { status: 200 }),
      new Response(null, { status: 204 }),
      new Response(null, { status: 204 }),
      new Response(null, { status: 200 }),
      new Response(requestPaymentXml, { status: 200 }),
    ];
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      const response = responses.shift();
      if (!response) throw new Error("unexpected request");
      return response;
    });
    const s3 = createTestS3(fetch);

    const gotPolicy = await s3.buckets.getPolicy({ bucket: "test-bucket" });
    await s3.buckets.putPolicy({
      bucket: "test-bucket",
      policy,
      confirmRemoveSelfBucketAccess: false,
    });
    await s3.buckets.delPolicy({ bucket: "test-bucket" });
    await s3.buckets.putRequestPayment({
      bucket: "test-bucket",
      payer: "Requester",
    });
    const requestPayment = await s3.buckets.getRequestPayment({
      bucket: "test-bucket",
    });

    expect(gotPolicy.policy).toBe(policy);
    expect(requestPayment.payer).toBe("Requester");

    const [putPolicyUrl, putPolicyInit] = fetch.mock.calls[1];
    expect(String(putPolicyUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?policy"
    );
    expect(putPolicyInit?.method).toBe("PUT");
    const policyHeaders = putPolicyInit?.headers as Record<string, string>;
    expect(policyHeaders["Content-Type"]).toBe("application/json");
    expect(policyHeaders["Content-MD5"]).toBe(md5Base64(policy));
    expect(policyHeaders["x-amz-confirm-remove-self-bucket-access"]).toBe(
      "false"
    );

    const [paymentUrl, paymentInit] = fetch.mock.calls[3];
    expect(String(paymentUrl)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?requestPayment"
    );
    expect(paymentInit?.method).toBe("PUT");
    expect(new TextDecoder().decode(paymentInit?.body as Uint8Array)).toContain(
      "<Payer>Requester</Payer>"
    );
  });

  it("addresses list and id-based bucket configuration resources", async () => {
    const metricsXml = [
      "<ListMetricsConfigurationsResult>",
      "<IsTruncated>false</IsTruncated>",
      "</ListMetricsConfigurationsResult>",
    ].join("");
    const analyticsXml = [
      "<AnalyticsConfiguration>",
      "<Id>analytics-1</Id>",
      "</AnalyticsConfiguration>",
    ].join("");
    const inventoryXml = [
      "<InventoryConfiguration>",
      "<Id>inventory-1</Id>",
      "</InventoryConfiguration>",
    ].join("");
    const responses = [
      new Response(metricsXml, { status: 200 }),
      new Response(analyticsXml, { status: 200 }),
      new Response(null, { status: 200 }),
      new Response(null, { status: 204 }),
      new Response(inventoryXml, { status: 200 }),
    ];
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      const response = responses.shift();
      if (!response) throw new Error("unexpected request");
      return response;
    });
    const s3 = createTestS3(fetch);

    const metrics = await s3.buckets.listMetrics({ bucket: "test-bucket" });
    const analytics = await s3.buckets.getAnalytics({
      bucket: "test-bucket",
      id: "analytics-1",
    });
    await s3.buckets.putMetrics({
      bucket: "test-bucket",
      id: "metrics-1",
      body: "<MetricsConfiguration><Id>metrics-1</Id></MetricsConfiguration>",
    });
    await s3.buckets.delMetrics({
      bucket: "test-bucket",
      id: "metrics-1",
    });
    const inventory = await s3.buckets.getInventory({
      bucket: "test-bucket",
      id: "inventory-1",
    });

    expect(metrics.rawXml).toBe(metricsXml);
    expect(analytics.rawXml).toBe(analyticsXml);
    expect(inventory.rawXml).toBe(inventoryXml);

    expect(String(fetch.mock.calls[0][0])).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?metrics"
    );
    expect(String(fetch.mock.calls[1][0])).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?analytics&id=analytics-1"
    );
    expect(String(fetch.mock.calls[2][0])).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?metrics&id=metrics-1"
    );
    expect(fetch.mock.calls[2][1]?.method).toBe("PUT");
    expect(String(fetch.mock.calls[3][0])).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?metrics&id=metrics-1"
    );
    expect(fetch.mock.calls[3][1]?.method).toBe("DELETE");
    expect(String(fetch.mock.calls[4][0])).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?inventory&id=inventory-1"
    );
  });

  it("lists object versions and delete markers", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      return new Response(
        [
          "<ListVersionsResult>",
          "<Name>test-bucket</Name>",
          "<Prefix>versions/</Prefix>",
          "<KeyMarker>versions/a.txt</KeyMarker>",
          "<VersionIdMarker>v1</VersionIdMarker>",
          "<NextKeyMarker>versions/b.txt</NextKeyMarker>",
          "<NextVersionIdMarker>v2</NextVersionIdMarker>",
          "<MaxKeys>2</MaxKeys>",
          "<IsTruncated>true</IsTruncated>",
          "<Version>",
          "<Key>versions/a.txt</Key>",
          "<VersionId>v1</VersionId>",
          "<IsLatest>true</IsLatest>",
          "<LastModified>2026-06-09T00:00:00.000Z</LastModified>",
          '<ETag>"etag"</ETag>',
          "<Size>12</Size>",
          "<StorageClass>STANDARD</StorageClass>",
          "<ChecksumAlgorithm>SHA256</ChecksumAlgorithm>",
          "</Version>",
          "<DeleteMarker>",
          "<Key>versions/deleted.txt</Key>",
          "<VersionId>marker-1</VersionId>",
          "<IsLatest>false</IsLatest>",
          "</DeleteMarker>",
          "<CommonPrefixes><Prefix>versions/folder/</Prefix></CommonPrefixes>",
          "</ListVersionsResult>",
        ].join(""),
        { status: 200 }
      );
    });
    const s3 = createTestS3(fetch);

    const result = await s3.objects.listVersions({
      bucket: "test-bucket",
      prefix: "versions/",
      maxKeys: 2,
      keyMarker: "versions/a.txt",
      versionIdMarker: "v1",
    });

    expect(result.isTruncated).toBe(true);
    expect(result.versions[0]).toMatchObject({
      key: "versions/a.txt",
      versionId: "v1",
      isLatest: true,
      size: 12,
    });
    expect(result.deleteMarkers[0]).toMatchObject({
      key: "versions/deleted.txt",
      versionId: "marker-1",
      isLatest: false,
    });
    expect(result.commonPrefixes).toEqual([{ prefix: "versions/folder/" }]);

    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?versions&key-marker=versions%2Fa.txt&max-keys=2&prefix=versions%2F&version-id-marker=v1"
    );
    expect(init?.method).toBe("GET");
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

  it("streams object bodies without buffering", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
        controller.close();
      },
    });
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      return new Response(body, {
        status: 200,
        headers: {
          "content-type": "application/octet-stream",
          "x-amz-meta-source": "unit",
        },
      });
    });
    const s3 = createTestS3(fetch);

    const result = await s3.objects.getStream({
      bucket: "test-bucket",
      key: "large.bin",
      range: "bytes=0-2",
    });

    expect(result.contentType).toBe("application/octet-stream");
    expect(result.metadata.source).toBe("unit");
    const reader = result.body?.getReader();
    const chunk = await reader?.read();
    expect(chunk?.value).toEqual(new Uint8Array([1, 2, 3]));
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket/large.bin"
    );
    expect(init?.method).toBe("GET");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Range).toBe("bytes=0-2");
  });

  it("creates SigV4 presigned object URLs", () => {
    const s3 = createTestS3(vi.fn<typeof globalThis.fetch>());

    const result = s3.presign.putObject({
      bucket: "test-bucket",
      key: "folder/a b.txt",
      expiresIn: 900,
      contentType: "text/plain",
      contentMD5: "aGVsbG8=",
      checksumAlgorithm: "SHA256",
      metadata: { source: "unit" },
    });

    const url = new URL(result.url);
    expect(url.origin).toBe("https://s3.us-east-1.amazonaws.com");
    expect(url.pathname).toBe("/test-bucket/folder/a%20b.txt");
    expect(url.searchParams.get("X-Amz-Algorithm")).toBe("AWS4-HMAC-SHA256");
    expect(url.searchParams.get("X-Amz-Credential")).toContain(
      "/us-east-1/s3/aws4_request"
    );
    expect(url.searchParams.get("X-Amz-Expires")).toBe("900");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toBe(
      "content-md5;content-type;host;x-amz-checksum-algorithm;x-amz-meta-source"
    );
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
    expect(result.headers).toEqual({
      "Content-MD5": "aGVsbG8=",
      "Content-Type": "text/plain",
      "x-amz-checksum-algorithm": "SHA256",
      "x-amz-meta-source": "unit",
    });
    expect(Date.parse(result.expiresAt)).toBeGreaterThan(Date.now());
  });

  it("retries AWS bucket-region redirects with the corrected signer region", async () => {
    const responses = [
      new Response(null, {
        status: 301,
        headers: { "x-amz-bucket-region": "us-west-2" },
      }),
      new Response(null, {
        status: 200,
        headers: { "x-amz-bucket-region": "us-west-2" },
      }),
    ];
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      const response = responses.shift();
      if (!response) throw new Error("unexpected request");
      return response;
    });
    const s3 = createS3({
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key",
      region: "us-east-1",
      forcePathStyle: true,
      fetch,
    });

    const result = await s3.buckets.head({ bucket: "test-bucket" });

    expect(result.bucketRegion).toBe("us-west-2");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(String(fetch.mock.calls[0][0])).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket"
    );
    expect(String(fetch.mock.calls[1][0])).toBe(
      "https://s3.us-west-2.amazonaws.com/test-bucket"
    );
    const retryHeaders = fetch.mock.calls[1][1]?.headers as Record<
      string,
      string
    >;
    expect(retryHeaders.Authorization).toContain("/us-west-2/s3/aws4_request");
  });

  it("parses ListObjectsV2 XML responses", async () => {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<s3:ListBucketResult xmlns:s3="http://s3.amazonaws.com/doc/2006-03-01/">',
      "<s3:Name>test-bucket</s3:Name>",
      "<s3:Prefix>apicity-tests/</s3:Prefix>",
      "<s3:KeyCount>1</s3:KeyCount>",
      "<s3:MaxKeys>10</s3:MaxKeys>",
      "<s3:IsTruncated>false</s3:IsTruncated>",
      "<s3:Contents>",
      "<s3:Key>apicity-tests/object-core.txt</s3:Key>",
      "<s3:LastModified>2026-06-08T00:00:00.000Z</s3:LastModified>",
      '<s3:ETag>"etag"</s3:ETag>',
      "<s3:Size>38</s3:Size>",
      "<s3:StorageClass>STANDARD</s3:StorageClass>",
      "</s3:Contents>",
      "</s3:ListBucketResult>",
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

  it("uses S3 Express hosts for directory bucket list and sessions", async () => {
    const responses = [
      new Response(
        [
          "<ListAllMyDirectoryBucketsResult>",
          "<Buckets>",
          "<Bucket>",
          "<Name>demo--use1-az1--x-s3</Name>",
          "<BucketArn>arn:aws:s3express:us-east-1:123456789012:bucket/demo--use1-az1--x-s3</BucketArn>",
          "<BucketRegion>us-east-1</BucketRegion>",
          "<CreationDate>2026-06-09T00:00:00.000Z</CreationDate>",
          "</Bucket>",
          "</Buckets>",
          "<ContinuationToken>next-token</ContinuationToken>",
          "</ListAllMyDirectoryBucketsResult>",
        ].join(""),
        { status: 200 }
      ),
      new Response(
        [
          "<CreateSessionResult>",
          "<Credentials>",
          "<AccessKeyId>session-access</AccessKeyId>",
          "<SecretAccessKey>session-secret</SecretAccessKey>",
          "<SessionToken>session-token</SessionToken>",
          "<Expiration>2026-06-09T00:05:00Z</Expiration>",
          "</Credentials>",
          "</CreateSessionResult>",
        ].join(""),
        { status: 200 }
      ),
    ];
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      const response = responses.shift();
      if (!response) throw new Error("unexpected request");
      return response;
    });
    const s3 = createS3({
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key",
      region: "us-east-1",
      fetch,
    });

    const directoryBuckets = await s3.buckets.listDirectory({
      maxDirectoryBuckets: 10,
    });
    const session = await s3.buckets.createSession({
      bucket: "demo--use1-az1--x-s3",
      sessionMode: "ReadWrite",
    });

    expect(directoryBuckets.buckets[0]).toMatchObject({
      name: "demo--use1-az1--x-s3",
      bucketRegion: "us-east-1",
    });
    expect(directoryBuckets.continuationToken).toBe("next-token");
    expect(session.credentials).toMatchObject({
      accessKeyId: "session-access",
      sessionToken: "session-token",
    });

    const [listUrl, listInit] = fetch.mock.calls[0];
    expect(String(listUrl)).toBe(
      "https://s3express-control.us-east-1.amazonaws.com/?max-directory-buckets=10"
    );
    expect(listInit?.method).toBe("GET");
    expect(
      (listInit?.headers as Record<string, string>).Authorization
    ).toContain("/us-east-1/s3express/aws4_request");

    const [sessionUrl, sessionInit] = fetch.mock.calls[1];
    expect(String(sessionUrl)).toBe(
      "https://demo--use1-az1--x-s3.s3express-use1-az1.us-east-1.amazonaws.com/?session"
    );
    const sessionHeaders = sessionInit?.headers as Record<string, string>;
    expect(sessionHeaders["x-amz-create-session-mode"]).toBe("ReadWrite");
    expect(sessionHeaders.Authorization).toContain(
      "/us-east-1/s3express/aws4_request"
    );
  });

  it("handles S3 metadata table configuration endpoints", async () => {
    const responses = [
      new Response(null, { status: 200 }),
      new Response(
        "<GetBucketMetadataConfigurationResult></GetBucketMetadataConfigurationResult>",
        { status: 200 }
      ),
      new Response(null, { status: 204 }),
      new Response(null, { status: 200 }),
      new Response(null, { status: 200 }),
    ];
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      const response = responses.shift();
      if (!response) throw new Error("unexpected request");
      return response;
    });
    const s3 = createTestS3(fetch);
    const metadataBody =
      '<MetadataConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"></MetadataConfiguration>';
    const inventoryBody =
      '<InventoryTableConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><ConfigurationState>ENABLED</ConfigurationState></InventoryTableConfiguration>';
    const journalBody =
      '<JournalTableConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><RecordExpiration><Expiration>DISABLED</Expiration></RecordExpiration></JournalTableConfiguration>';

    await s3.buckets.createMetadataConfiguration({
      bucket: "test-bucket",
      body: metadataBody,
    });
    const metadata = await s3.buckets.getMetadataConfiguration({
      bucket: "test-bucket",
    });
    await s3.buckets.delMetadataConfiguration({ bucket: "test-bucket" });
    await s3.buckets.updateMetadataInventoryTable({
      bucket: "test-bucket",
      body: inventoryBody,
    });
    await s3.buckets.updateMetadataJournalTable({
      bucket: "test-bucket",
      body: journalBody,
    });

    expect(metadata.rawXml).toContain("GetBucketMetadataConfigurationResult");
    expect(fetch).toHaveBeenCalledTimes(5);
    expect(String(fetch.mock.calls[0][0])).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?metadataConfiguration"
    );
    expect(fetch.mock.calls[0][1]?.method).toBe("POST");
    expect(
      (fetch.mock.calls[0][1]?.headers as Record<string, string>)["Content-MD5"]
    ).toBe(md5Base64(metadataBody));
    expect(fetch.mock.calls[1][1]?.method).toBe("GET");
    expect(fetch.mock.calls[2][1]?.method).toBe("DELETE");
    expect(String(fetch.mock.calls[3][0])).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?metadataInventoryTable"
    );
    expect(String(fetch.mock.calls[4][0])).toBe(
      "https://s3.us-east-1.amazonaws.com/test-bucket?metadataJournalTable"
    );
  });

  it("signs specialized object and Object Lambda requests", async () => {
    const responses = [
      new Response(null, { status: 200 }),
      new Response(null, {
        status: 200,
        headers: { "x-amz-request-charged": "requester" },
      }),
      new Response(null, { status: 200 }),
    ];
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      const response = responses.shift();
      if (!response) throw new Error("unexpected request");
      return response;
    });
    const s3 = createS3({
      accessKeyId: "test-access-key",
      secretAccessKey: "test-secret-key",
      region: "us-east-1",
      fetch,
    });
    const encryptionBody = [
      '<ObjectEncryption xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
      "<SSE-KMS><BucketKeyEnabled>true</BucketKeyEnabled>",
      "<KMSKeyArn>arn:aws:kms:us-east-1:123456789012:key/key-id</KMSKeyArn>",
      "</SSE-KMS></ObjectEncryption>",
    ].join("");

    await s3.objects.rename({
      bucket: "demo--use1-az1--x-s3",
      key: "dest.txt",
      sourceKey: "source file.txt",
      destinationIfNoneMatch: "*",
      s3SessionToken: "directory-session-token",
    });
    const updated = await s3.objects.updateEncryption({
      bucket: "test-bucket",
      key: "secure.txt",
      versionId: "v1",
      body: encryptionBody,
      requestPayer: "requester",
    });
    await s3.objectLambda.writeGetObjectResponse({
      requestRoute: "route-1",
      requestToken: "token-1",
      body: "transformed",
      statusCode: 206,
      headers: { "Content-Type": "text/plain" },
      metadata: { source: "unit" },
    });

    expect(updated.requestCharged).toBe("requester");

    const [renameUrl, renameInit] = fetch.mock.calls[0];
    expect(String(renameUrl)).toBe(
      "https://demo--use1-az1--x-s3.s3express-use1-az1.us-east-1.amazonaws.com/dest.txt?renameObject"
    );
    const renameHeaders = renameInit?.headers as Record<string, string>;
    expect(renameHeaders["x-amz-rename-source"]).toBe("/source%20file.txt");
    expect(renameHeaders["If-None-Match"]).toBe("*");
    expect(renameHeaders["x-amz-s3session-token"]).toBe(
      "directory-session-token"
    );
    expect(renameHeaders.Authorization).toContain(
      "/us-east-1/s3express/aws4_request"
    );

    const [encryptionUrl, encryptionInit] = fetch.mock.calls[1];
    expect(String(encryptionUrl)).toBe(
      "https://test-bucket.s3.us-east-1.amazonaws.com/secure.txt?encryption&versionId=v1"
    );
    expect(encryptionInit?.method).toBe("PUT");
    const encryptionHeaders = encryptionInit?.headers as Record<string, string>;
    expect(encryptionHeaders["x-amz-request-payer"]).toBe("requester");
    expect(encryptionHeaders["Content-MD5"]).toBe(md5Base64(encryptionBody));

    const [lambdaUrl, lambdaInit] = fetch.mock.calls[2];
    expect(String(lambdaUrl)).toBe(
      "https://route-1.s3-object-lambda.us-east-1.amazonaws.com/WriteGetObjectResponse"
    );
    const lambdaHeaders = lambdaInit?.headers as Record<string, string>;
    expect(lambdaHeaders["x-amz-request-route"]).toBe("route-1");
    expect(lambdaHeaders["x-amz-request-token"]).toBe("token-1");
    expect(lambdaHeaders["x-amz-fwd-status"]).toBe("206");
    expect(lambdaHeaders["x-amz-fwd-header-Content-Type"]).toBe("text/plain");
    expect(lambdaHeaders["x-amz-fwd-header-x-amz-meta-source"]).toBe("unit");
    expect(lambdaHeaders.Authorization).toContain(
      "/us-east-1/s3-object-lambda/aws4_request"
    );
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
