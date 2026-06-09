import { S3OptionsSchema } from "@apicity/s3";
import type { z } from "zod";

import type { B2Options } from "./types";

export {
  S3AbortMultipartUploadRequestSchema,
  S3BucketRequestSchema,
  S3CompleteMultipartUploadRequestSchema,
  S3CopyObjectRequestSchema,
  S3CreateBucketRequestSchema,
  S3CreateMultipartUploadRequestSchema,
  S3DeleteObjectRequestSchema,
  S3DeleteObjectsRequestSchema,
  S3GetBucketVersioningRequestSchema,
  S3GetObjectRequestSchema,
  S3HeadObjectRequestSchema,
  S3ListMultipartUploadsRequestSchema,
  S3ListObjectVersionsRequestSchema,
  S3ListObjectsRequestSchema,
  S3ListObjectsV2RequestSchema,
  S3ListPartsRequestSchema,
  S3ObjectGovernanceRequestSchema,
  S3OptionsSchema,
  S3PresignObjectRequestSchema,
  S3PutBucketAclRequestSchema,
  S3PutBucketXmlConfigRequestSchema,
  S3PutObjectAclRequestSchema,
  S3PutObjectLegalHoldRequestSchema,
  S3PutObjectLockConfigurationRequestSchema,
  S3PutObjectRetentionRequestSchema,
  S3PutObjectRequestSchema,
  S3UploadPartCopyRequestSchema,
  S3UploadPartRequestSchema,
} from "@apicity/s3";

export const B2OptionsSchema: z.ZodType<B2Options> = S3OptionsSchema.pick({
  accessKeyId: true,
  secretAccessKey: true,
  region: true,
  endpoint: true,
  forcePathStyle: true,
  timeout: true,
  fetch: true,
}) as z.ZodType<B2Options>;
