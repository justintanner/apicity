import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createB2 } from "@apicity/b2";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

describe("b2 real asset e2e integration", () => {
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

  it("uploads, downloads, lists, and deletes a real JPEG asset", async () => {
    ctx = setupPolly("b2/real-asset-e2e");

    const b2 = createProvider();
    const bucket = process.env.B2_BUCKET ?? "apicity";
    const key = "apicity-tests/real-assets/cat1.jpg";
    const asset = readFileSync(resolve(__dirname, "../fixtures/cat1.jpg"));
    const assetHash = sha256(asset);
    let uploaded = false;
    let versionId: string | undefined;

    try {
      const put = await b2.objects.put({
        bucket,
        key,
        body: asset,
        contentType: "image/jpeg",
        metadata: {
          fixture: "cat1",
          sha256: assetHash,
          source: "apicity",
        },
      });
      uploaded = true;
      versionId = put.versionId;

      expect(put.eTag).toEqual(expect.any(String));

      const get = await b2.objects.get({ bucket, key });
      const downloaded = Buffer.from(get.body);
      expect(sha256(downloaded)).toBe(assetHash);
      expect(get.contentLength).toBe(asset.length);
      expect(get.contentType).toBe("image/jpeg");
      expect(get.metadata.fixture).toBe("cat1");
      expect(get.metadata.sha256).toBe(assetHash);
      expect(get.metadata.source).toBe("apicity");

      const head = await b2.objects.head({ bucket, key });
      expect(head.contentLength).toBe(asset.length);
      expect(head.contentType).toBe("image/jpeg");
      expect(head.metadata.fixture).toBe("cat1");
      expect(head.metadata.sha256).toBe(assetHash);
      expect(head.metadata.source).toBe("apicity");

      const listed = await b2.objects.list({
        bucket,
        prefix: "apicity-tests/real-assets/",
        maxKeys: 10,
      });
      expect(listed.contents.some((object) => object.key === key)).toBe(true);
    } finally {
      if (uploaded) {
        await b2.objects.del({ bucket, key, versionId });
      }
    }
  });
});
