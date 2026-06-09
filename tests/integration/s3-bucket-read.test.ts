import { afterEach, describe, expect, it } from "vitest";

import { createS3 } from "@apicity/s3";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("s3 bucket read integration", () => {
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

  it("checks the fixture bucket and reads its location", async () => {
    ctx = setupPolly("s3/bucket-read");

    const s3 = createProvider();
    const bucket = process.env.S3_BUCKET ?? "apicity-s3-fixtures";
    const region = process.env.S3_REGION ?? "us-east-1";

    const head = await s3.buckets.head({ bucket });
    expect(head.bucketRegion).toBe(region);

    const location = await s3.buckets.location({ bucket });
    expect(location.locationConstraint ?? "us-east-1").toBe(region);
  });
});
