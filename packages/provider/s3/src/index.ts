export { createS3 } from "./s3";
export { S3Error } from "./types";
export { withFallback, withRetry } from "./middleware";

export type { FallbackOptions, RetryOptions } from "./middleware";

export type {
  S3Bucket,
  S3BucketsNamespace,
  S3CommonPrefix,
  S3DeleteObjectMethod,
  S3DeleteObjectRequest,
  S3DeleteObjectResponse,
  S3GetObjectMethod,
  S3GetObjectRequest,
  S3GetObjectResponse,
  S3HeadObjectMethod,
  S3HeadObjectRequest,
  S3HeadObjectResponse,
  S3ListBucketsMethod,
  S3ListBucketsRequest,
  S3ListBucketsResponse,
  S3ListObjectsV2Method,
  S3ListObjectsV2Request,
  S3ListObjectsV2Response,
  S3ObjectHeaders,
  S3ObjectSummary,
  S3ObjectsNamespace,
  S3Options,
  S3Owner,
  S3Provider,
  S3PutObjectMethod,
  S3PutObjectRequest,
  S3PutObjectResponse,
} from "./types";

export {
  S3DeleteObjectRequestSchema,
  S3GetObjectRequestSchema,
  S3HeadObjectRequestSchema,
  S3ListBucketsRequestSchema,
  S3ListObjectsV2RequestSchema,
  S3OptionsSchema,
  S3PutObjectRequestSchema,
} from "./zod";
