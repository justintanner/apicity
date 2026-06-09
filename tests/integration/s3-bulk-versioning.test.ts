import { afterEach, describe, expect, it } from "vitest";

import { createS3 } from "@apicity/s3";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("s3 bulk delete and versioning integration", () => {
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

  it("bulk deletes objects and reads versioning metadata", async () => {
    ctx = setupPolly("s3/bulk-versioning");

    const s3 = createProvider();
    const bucket = process.env.S3_BUCKET ?? "apicity-s3-fixtures";
    const prefix = "apicity-tests/bulk-versioning/";
    const missingA = `${prefix}missing-a.txt`;
    const missingB = `${prefix}missing-b.txt`;
    const keyA = `${prefix}a.txt`;
    const keyB = `${prefix}b.txt`;
    const body = "hello from @apicity/s3 bulk delete test\n";

    let uploaded = false;
    try {
      const missing = await s3.objects.delMany({
        bucket,
        objects: [{ key: missingA }, { key: missingB }],
      });
      expect(missing.deleted.map((object) => object.key).sort()).toEqual([
        missingA,
        missingB,
      ]);

      const versioning = await s3.buckets.getVersioning({ bucket });
      if (versioning.status !== undefined) {
        expect(["Enabled", "Suspended"]).toContain(versioning.status);
      }

      const versions = await s3.objects.listVersions({
        bucket,
        prefix,
        maxKeys: 10,
      });
      expect(versions.isTruncated).toEqual(expect.any(Boolean));
      expect(Array.isArray(versions.versions)).toBe(true);
      expect(Array.isArray(versions.deleteMarkers)).toBe(true);

      await s3.objects.put({
        bucket,
        key: keyA,
        body,
        contentType: "text/plain",
      });
      await s3.objects.put({
        bucket,
        key: keyB,
        body,
        contentType: "text/plain",
      });
      uploaded = true;

      const deleted = await s3.objects.delMany({
        bucket,
        objects: [{ key: keyA }, { key: keyB }],
      });
      uploaded = false;
      expect(deleted.errors).toEqual([]);
      expect(deleted.deleted.map((object) => object.key).sort()).toEqual([
        keyA,
        keyB,
      ]);
    } finally {
      if (uploaded) {
        await s3.objects.del({ bucket, key: keyA });
        await s3.objects.del({ bucket, key: keyB });
      }
    }
  });
});
