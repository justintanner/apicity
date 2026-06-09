import { afterEach, describe, expect, it } from "vitest";

import { createS3, S3Error } from "@apicity/s3";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

type Captured<T> = { ok: true; value: T } | { error: S3Error; ok: false };

describe("s3 compatibility gap integration", () => {
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

  async function captureS3<T>(call: () => Promise<T>): Promise<Captured<T>> {
    try {
      return { ok: true, value: await call() };
    } catch (error) {
      if (error instanceof S3Error) return { ok: false, error };
      throw error;
    }
  }

  function expectCaptured<T>(result: Captured<T>): void {
    if (result.ok) {
      expect(result.value).toBeDefined();
      return;
    }

    expect(result.error.status).toBeGreaterThanOrEqual(400);
    expect(result.error.code ?? result.error.message).toEqual(
      expect.any(String)
    );
  }

  const bucket = () => process.env.S3_BUCKET ?? "apicity-s3-fixtures";

  const intelligentTieringId = "apicity-compat-tiering";
  const intelligentTieringBody = [
    '<IntelligentTieringConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
    `<Id>${intelligentTieringId}</Id>`,
    "<Status>Enabled</Status>",
    "<Tiering><AccessTier>ARCHIVE_ACCESS</AccessTier><Days>90</Days></Tiering>",
    "</IntelligentTieringConfiguration>",
  ].join("");

  it("records ListObjects", async () => {
    ctx = setupPolly("s3/list-objects");

    const result = await createProvider().objects.listLegacy({
      bucket: bucket(),
      prefix: "apicity-tests/",
      maxKeys: 10,
    });

    expect(result.isTruncated).toEqual(expect.any(Boolean));
    expect(result.contents).toEqual(expect.any(Array));
  });

  it("records GetBucketAccelerateConfiguration", async () => {
    ctx = setupPolly("s3/bucket-get-accelerate-configuration");

    const result = await captureS3(() =>
      createProvider().buckets.getAccelerateConfiguration({ bucket: bucket() })
    );

    expectCaptured(result);
  });

  it("records PutBucketAccelerateConfiguration", async () => {
    ctx = setupPolly("s3/bucket-put-accelerate-configuration");

    const body = [
      '<AccelerateConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
      "<Status>Suspended</Status>",
      "</AccelerateConfiguration>",
    ].join("");
    const result = await captureS3(() =>
      createProvider().buckets.putAccelerateConfiguration({
        bucket: bucket(),
        body,
      })
    );

    expectCaptured(result);
  });

  it("records GetBucketAcl", async () => {
    ctx = setupPolly("s3/bucket-get-acl");

    const result = await createProvider().buckets.getAcl({ bucket: bucket() });

    expect(result.grants).toEqual(expect.any(Array));
  });

  it("records PutBucketAcl", async () => {
    ctx = setupPolly("s3/bucket-put-acl");

    const result = await captureS3(() =>
      createProvider().buckets.putAcl({ bucket: bucket(), acl: "private" })
    );

    expectCaptured(result);
  });

  it("records GetBucketAbac", async () => {
    ctx = setupPolly("s3/bucket-get-abac");

    const result = await captureS3(() =>
      createProvider().buckets.getAbac({ bucket: bucket() })
    );

    expectCaptured(result);
  });

  it("records PutBucketAbac", async () => {
    ctx = setupPolly("s3/bucket-put-abac");

    const body = [
      '<AbacStatus xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
      "<Status>Disabled</Status>",
      "</AbacStatus>",
    ].join("");
    const result = await captureS3(() =>
      createProvider().buckets.putAbac({ bucket: bucket(), body })
    );

    expectCaptured(result);
  });

  it("records GetBucketPolicyStatus", async () => {
    ctx = setupPolly("s3/bucket-get-policy-status");

    const result = await captureS3(() =>
      createProvider().buckets.getPolicyStatus({ bucket: bucket() })
    );

    if (result.ok) {
      expect(result.value.isPublic).toEqual(expect.any(Boolean));
    } else {
      expectCaptured(result);
    }
  });

  it("records ListBucketIntelligentTieringConfigurations", async () => {
    ctx = setupPolly("s3/bucket-list-intelligent-tiering");

    const result = await captureS3(() =>
      createProvider().buckets.listIntelligentTiering({ bucket: bucket() })
    );

    expectCaptured(result);
  });

  it("records GetBucketIntelligentTieringConfiguration", async () => {
    ctx = setupPolly("s3/bucket-get-intelligent-tiering");

    const result = await captureS3(() =>
      createProvider().buckets.getIntelligentTiering({
        bucket: bucket(),
        id: intelligentTieringId,
      })
    );

    expectCaptured(result);
  });

  it("records PutBucketIntelligentTieringConfiguration", async () => {
    ctx = setupPolly("s3/bucket-put-intelligent-tiering");
    const s3 = createProvider();

    const result = await captureS3(() =>
      s3.buckets.putIntelligentTiering({
        bucket: bucket(),
        id: intelligentTieringId,
        body: intelligentTieringBody,
      })
    );
    if (result.ok) {
      await captureS3(() =>
        s3.buckets.delIntelligentTiering({
          bucket: bucket(),
          id: intelligentTieringId,
        })
      );
    }

    expectCaptured(result);
  });

  it("records DeleteBucketIntelligentTieringConfiguration", async () => {
    ctx = setupPolly("s3/bucket-delete-intelligent-tiering");

    const result = await captureS3(() =>
      createProvider().buckets.delIntelligentTiering({
        bucket: bucket(),
        id: intelligentTieringId,
      })
    );

    expectCaptured(result);
  });

  it("records CreateBucketMetadataTableConfiguration", async () => {
    ctx = setupPolly("s3/bucket-create-metadata-table-configuration");

    const body = [
      '<MetadataTableConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
      "<S3TablesDestination>",
      "<TableBucketArn>arn:aws:s3tables:us-east-1:123456789012:bucket/apicity-metadata-tables</TableBucketArn>",
      "<TableName>apicity_compat</TableName>",
      "</S3TablesDestination>",
      "</MetadataTableConfiguration>",
    ].join("");
    const result = await captureS3(() =>
      createProvider().buckets.createMetadataTableConfiguration({
        bucket: bucket(),
        body,
      })
    );

    expectCaptured(result);
  });

  it("records GetBucketMetadataTableConfiguration", async () => {
    ctx = setupPolly("s3/bucket-get-metadata-table-configuration");

    const result = await captureS3(() =>
      createProvider().buckets.getMetadataTableConfiguration({
        bucket: bucket(),
      })
    );

    expectCaptured(result);
  });

  it("records DeleteBucketMetadataTableConfiguration", async () => {
    ctx = setupPolly("s3/bucket-delete-metadata-table-configuration");

    const result = await captureS3(() =>
      createProvider().buckets.delMetadataTableConfiguration({
        bucket: bucket(),
      })
    );

    expectCaptured(result);
  });

  it("records GetBucketLifecycle", async () => {
    ctx = setupPolly("s3/bucket-get-lifecycle-legacy");

    const result = await captureS3(() =>
      createProvider().buckets.getLifecycleLegacy({ bucket: bucket() })
    );

    expectCaptured(result);
  });

  it("records PutBucketLifecycle", async () => {
    ctx = setupPolly("s3/bucket-put-lifecycle-legacy");

    const body = [
      '<LifecycleConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
      "<Rule>",
      "<ID>apicity-compat-disabled</ID>",
      "<Filter><Prefix>apicity-compat-disabled/</Prefix></Filter>",
      "<Status>Disabled</Status>",
      "<Expiration><Days>3650</Days></Expiration>",
      "</Rule>",
      "</LifecycleConfiguration>",
    ].join("");
    const result = await captureS3(() =>
      createProvider().buckets.putLifecycleLegacy({
        bucket: bucket(),
        body,
      })
    );

    expectCaptured(result);
  });

  it("records GetBucketNotification", async () => {
    ctx = setupPolly("s3/bucket-get-notification-legacy");

    const result = await captureS3(() =>
      createProvider().buckets.getNotificationLegacy({ bucket: bucket() })
    );

    expectCaptured(result);
  });

  it("records PutBucketNotification", async () => {
    ctx = setupPolly("s3/bucket-put-notification-legacy");

    const body =
      '<NotificationConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/" />';
    const result = await captureS3(() =>
      createProvider().buckets.putNotificationLegacy({
        bucket: bucket(),
        body,
      })
    );

    expectCaptured(result);
  });
});
