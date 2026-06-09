import { afterEach, describe, expect, it } from "vitest";

import { createS3 } from "@apicity/s3";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("s3 object governance integration", () => {
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

  it("reads object attributes and ACL metadata", async () => {
    ctx = setupPolly("s3/object-governance");

    const s3 = createProvider();
    const bucket = process.env.S3_BUCKET ?? "apicity-s3-fixtures";
    const key = "apicity-tests/object-governance.csv";
    const body = "id,name\n1,Ada\n2,Grace\n";
    let uploaded = false;

    try {
      await s3.objects.put({
        bucket,
        key,
        body,
        contentType: "text/csv",
        metadata: { source: "object-governance" },
      });
      uploaded = true;

      const attributes = await s3.objects.getAttributes({
        bucket,
        key,
        objectAttributes: ["ETag", "ObjectSize"],
      });
      expect(attributes.eTag).toEqual(expect.any(String));
      expect(attributes.objectSize).toBe(
        new TextEncoder().encode(body).byteLength
      );

      const acl = await s3.objects.getAcl({ bucket, key });
      expect(acl.owner?.id).toEqual(expect.any(String));
      expect(acl.grants.length).toBeGreaterThan(0);
    } finally {
      if (uploaded) {
        await s3.objects.del({ bucket, key });
      }
    }
  });
});
