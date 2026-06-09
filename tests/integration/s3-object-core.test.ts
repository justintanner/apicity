import { afterEach, describe, expect, it } from "vitest";

import { createS3 } from "@apicity/s3";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("s3 object core integration", () => {
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

  it("lists buckets and manages a small object", async () => {
    ctx = setupPolly("s3/object-core");

    const s3 = createProvider();
    const bucket = process.env.S3_BUCKET ?? "apicity-s3-fixtures";
    const key = "apicity-tests/object-core.txt";
    const body = "hello from @apicity/s3 object core test\n";

    const buckets = await s3.buckets.list();
    expect(buckets.buckets.some((b) => b.name === bucket)).toBe(true);

    let uploaded = false;
    try {
      const put = await s3.objects.put({
        bucket,
        key,
        body,
        contentType: "text/plain",
        metadata: {
          source: "apicity",
        },
      });
      uploaded = true;

      expect(put.eTag).toEqual(expect.any(String));

      const head = await s3.objects.head({ bucket, key });
      expect(head.contentLength).toBe(body.length);
      expect(head.contentType).toBe("text/plain");
      expect(head.metadata.source).toBe("apicity");

      const get = await s3.objects.get({ bucket, key });
      expect(new TextDecoder().decode(get.body)).toBe(body);
      expect(get.contentType).toBe("text/plain");

      const listed = await s3.objects.list({
        bucket,
        prefix: "apicity-tests/",
        maxKeys: 10,
      });
      expect(listed.contents.some((object) => object.key === key)).toBe(true);
    } finally {
      if (uploaded) {
        await s3.objects.del({ bucket, key });
      }
    }
  });

  it("exposes object schemas", () => {
    const s3 = createProvider();

    expect(s3.objects.put.schema.safeParse({}).success).toBe(false);
    expect(
      s3.objects.put.schema.safeParse({
        bucket: "bucket",
        key: "key",
        body: "hello",
      }).success
    ).toBe(true);
  });
});
