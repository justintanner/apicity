import { afterEach, describe, expect, it } from "vitest";

import { createB2 } from "@apicity/b2";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("b2 object core integration", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  function createProvider() {
    return createB2({
      accessKeyId: process.env.B2_ACCESS_KEY_ID ?? "test-access-key",
      secretAccessKey: process.env.B2_SECRET_ACCESS_KEY ?? "test-secret-key",
      region: process.env.B2_REGION ?? "us-west-004",
      endpoint:
        process.env.B2_ENDPOINT ?? "https://s3.us-west-004.backblazeb2.com",
    });
  }

  it("checks a bucket and manages a small object", async () => {
    ctx = setupPolly("b2/object-core");

    const b2 = createProvider();
    const bucket = process.env.B2_BUCKET ?? "apicity";
    const key = "apicity-tests/object-core.txt";
    const body = "hello from @apicity/b2 object core test\n";
    let versionId: string | undefined;

    const bucketHead = await b2.buckets.head({ bucket });
    expect(bucketHead.headers).toEqual(expect.any(Object));

    try {
      const put = await b2.objects.put({
        bucket,
        key,
        body,
        contentType: "text/plain",
        metadata: {
          source: "apicity",
        },
      });
      versionId = put.versionId;

      expect(put.eTag).toEqual(expect.any(String));

      const head = await b2.objects.head({ bucket, key });
      expect(head.contentLength).toBe(body.length);
      expect(head.contentType).toBe("text/plain");
      expect(head.metadata.source).toBe("apicity");

      const get = await b2.objects.get({ bucket, key });
      expect(new TextDecoder().decode(get.body)).toBe(body);
      expect(get.contentType).toBe("text/plain");

      const listed = await b2.objects.list({
        bucket,
        prefix: "apicity-tests/",
        maxKeys: 10,
      });
      expect(listed.contents.some((object) => object.key === key)).toBe(true);
    } finally {
      if (versionId) {
        await b2.objects.del({ bucket, key, versionId });
      }
    }
  });
});
