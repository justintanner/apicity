import { afterEach, describe, expect, it } from "vitest";

import {
  createS3,
  S3Error,
  type S3Provider,
  type S3ObjectTag,
} from "@apicity/s3";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("s3 bucket configuration integration", () => {
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

  async function readOptionalCors(
    s3: S3Provider,
    bucket: string
  ): Promise<string | undefined> {
    try {
      return (await s3.buckets.getCors({ bucket })).rawXml;
    } catch (error) {
      if (error instanceof S3Error && error.status === 404) return undefined;
      throw error;
    }
  }

  async function readOptionalTags(
    s3: S3Provider,
    bucket: string
  ): Promise<S3ObjectTag[] | undefined> {
    try {
      return (await s3.buckets.getTagging({ bucket })).tagSet;
    } catch (error) {
      if (error instanceof S3Error && error.status === 404) return undefined;
      throw error;
    }
  }

  async function deleteCorsIfPresent(
    s3: S3Provider,
    bucket: string
  ): Promise<void> {
    try {
      await s3.buckets.delCors({ bucket });
    } catch (error) {
      if (!(error instanceof S3Error) || error.status !== 404) throw error;
    }
  }

  async function deleteTagsIfPresent(
    s3: S3Provider,
    bucket: string
  ): Promise<void> {
    try {
      await s3.buckets.delTagging({ bucket });
    } catch (error) {
      if (!(error instanceof S3Error) || error.status !== 404) throw error;
    }
  }

  it("sets, reads, and cleans up bucket CORS and tagging config", async () => {
    ctx = setupPolly("s3/bucket-config");

    const s3 = createProvider();
    const bucket = process.env.S3_BUCKET ?? "apicity-s3-fixtures";
    const corsBody = [
      '<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
      "<CORSRule>",
      "<AllowedOrigin>https://example.com</AllowedOrigin>",
      "<AllowedMethod>GET</AllowedMethod>",
      "<AllowedHeader>*</AllowedHeader>",
      "<MaxAgeSeconds>300</MaxAgeSeconds>",
      "</CORSRule>",
      "</CORSConfiguration>",
    ].join("");
    const tagSet = [
      { key: "apicity", value: "s3-bucket-config" },
      { key: "kind", value: "integration" },
    ];

    const originalCors = await readOptionalCors(s3, bucket);
    const originalTags = await readOptionalTags(s3, bucket);

    try {
      await s3.buckets.putCors({ bucket, body: corsBody });
      const cors = await s3.buckets.getCors({ bucket });
      expect(cors.rawXml).toContain(
        "<AllowedOrigin>https://example.com</AllowedOrigin>"
      );
      expect(cors.rawXml).toContain("<AllowedMethod>GET</AllowedMethod>");

      await s3.buckets.putTagging({ bucket, tagSet });
      const tags = await s3.buckets.getTagging({ bucket });
      expect(tags.tagSet).toEqual(expect.arrayContaining(tagSet));

      const metrics = await s3.buckets.listMetrics({ bucket });
      expect(metrics.rawXml).toContain("ListMetricsConfigurationsResult");
    } finally {
      if (originalCors) {
        await s3.buckets.putCors({ bucket, body: originalCors });
      } else {
        await deleteCorsIfPresent(s3, bucket);
      }

      if (originalTags) {
        await s3.buckets.putTagging({ bucket, tagSet: originalTags });
      } else {
        await deleteTagsIfPresent(s3, bucket);
      }
    }
  });
});
