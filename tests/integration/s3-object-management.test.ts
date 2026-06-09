import { afterEach, describe, expect, it } from "vitest";

import { createS3 } from "@apicity/s3";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("s3 object management integration", () => {
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

  it("copies an object and manages its tag set", async () => {
    ctx = setupPolly("s3/object-management");

    const s3 = createProvider();
    const bucket = process.env.S3_BUCKET ?? "apicity-s3-fixtures";
    const sourceKey = "apicity-tests/object-management-source.txt";
    const copyKey = "apicity-tests/object-management-copy.txt";
    const body = "hello from @apicity/s3 object management test\n";

    let uploadedSource = false;
    let copiedObject = false;
    try {
      await s3.objects.put({
        bucket,
        key: sourceKey,
        body,
        contentType: "text/plain",
      });
      uploadedSource = true;

      const copy = await s3.objects.copy({
        bucket,
        key: copyKey,
        sourceBucket: bucket,
        sourceKey,
      });
      copiedObject = true;
      expect(copy.eTag).toEqual(expect.any(String));

      const copied = await s3.objects.get({ bucket, key: copyKey });
      expect(new TextDecoder().decode(copied.body)).toBe(body);

      await s3.objects.putTagging({
        bucket,
        key: copyKey,
        tagSet: [
          { key: "suite", value: "apicity" },
          { key: "operation", value: "copy-tagging" },
        ],
      });

      const tagging = await s3.objects.getTagging({ bucket, key: copyKey });
      expect(tagging.tagSet).toContainEqual({
        key: "operation",
        value: "copy-tagging",
      });

      await s3.objects.delTagging({ bucket, key: copyKey });
      const cleared = await s3.objects.getTagging({ bucket, key: copyKey });
      expect(cleared.tagSet).toEqual([]);
    } finally {
      if (copiedObject) {
        await s3.objects.del({ bucket, key: copyKey });
      }
      if (uploadedSource) {
        await s3.objects.del({ bucket, key: sourceKey });
      }
    }
  });
});
