import { afterEach, describe, expect, it } from "vitest";

import { createS3 } from "@apicity/s3";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("s3 multipart upload integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  function createProvider() {
    return createS3({
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "test-access-key",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "test-secret-key",
      region: process.env.S3_REGION ?? "us-east-1",
      endpoint: process.env.S3_ENDPOINT ?? "https://s3.us-east-1.amazonaws.com",
    });
  }

  it("uploads, copies, lists, and aborts multipart uploads", async () => {
    ctx = setupPolly("s3/multipart-upload");

    const s3 = createProvider();
    const bucket = process.env.S3_BUCKET ?? "apicity-s3-fixtures";
    const uploadedKey = "apicity-tests/multipart-uploaded.txt";
    const copiedKey = "apicity-tests/multipart-copied.txt";
    const abortedKey = "apicity-tests/multipart-aborted.txt";
    const body = "hello from @apicity/s3 multipart upload test\n";

    let uploadedObject = false;
    let copiedObject = false;
    let abortUploadId: string | undefined;
    try {
      const created = await s3.objects.createMultipartUpload({
        bucket,
        key: uploadedKey,
        contentType: "text/plain",
        metadata: { source: "multipart" },
      });
      expect(created.uploadId).toEqual(expect.any(String));

      const part = await s3.objects.uploadPart({
        bucket,
        key: uploadedKey,
        uploadId: created.uploadId,
        partNumber: 1,
        body,
      });
      expect(part.eTag).toEqual(expect.any(String));

      const parts = await s3.objects.listParts({
        bucket,
        key: uploadedKey,
        uploadId: created.uploadId,
      });
      expect(parts.parts).toContainEqual(
        expect.objectContaining({ partNumber: 1, eTag: part.eTag })
      );

      const completed = await s3.objects.completeMultipartUpload({
        bucket,
        key: uploadedKey,
        uploadId: created.uploadId,
        parts: [{ partNumber: 1, eTag: part.eTag ?? "" }],
      });
      uploadedObject = true;
      expect(completed.eTag).toEqual(expect.any(String));

      const uploaded = await s3.objects.get({ bucket, key: uploadedKey });
      expect(new TextDecoder().decode(uploaded.body)).toBe(body);
      expect(uploaded.metadata.source).toBe("multipart");

      const copyUpload = await s3.objects.createMultipartUpload({
        bucket,
        key: copiedKey,
        contentType: "text/plain",
      });
      const copyPart = await s3.objects.uploadPartCopy({
        bucket,
        key: copiedKey,
        uploadId: copyUpload.uploadId,
        partNumber: 1,
        sourceBucket: bucket,
        sourceKey: uploadedKey,
      });
      expect(copyPart.eTag).toEqual(expect.any(String));

      await s3.objects.completeMultipartUpload({
        bucket,
        key: copiedKey,
        uploadId: copyUpload.uploadId,
        parts: [{ partNumber: 1, eTag: copyPart.eTag ?? "" }],
      });
      copiedObject = true;

      const copied = await s3.objects.get({ bucket, key: copiedKey });
      expect(new TextDecoder().decode(copied.body)).toBe(body);

      const abortUpload = await s3.objects.createMultipartUpload({
        bucket,
        key: abortedKey,
      });
      abortUploadId = abortUpload.uploadId;

      const active = await s3.objects.listMultipartUploads({
        bucket,
        prefix: abortedKey,
      });
      expect(active.uploads).toContainEqual(
        expect.objectContaining({
          key: abortedKey,
          uploadId: abortUploadId,
        })
      );

      await s3.objects.abortMultipartUpload({
        bucket,
        key: abortedKey,
        uploadId: abortUploadId,
      });
      abortUploadId = undefined;
    } finally {
      if (abortUploadId) {
        await s3.objects.abortMultipartUpload({
          bucket,
          key: abortedKey,
          uploadId: abortUploadId,
        });
      }
      if (copiedObject) {
        await s3.objects.del({ bucket, key: copiedKey });
      }
      if (uploadedObject) {
        await s3.objects.del({ bucket, key: uploadedKey });
      }
    }
  });
});
