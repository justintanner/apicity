import { z } from "zod";

const objectBodySchema = z.union([
  z.string(),
  z.instanceof(Blob),
  z.instanceof(ArrayBuffer),
  z.instanceof(Uint8Array),
]);

const requestPayerSchema = z.enum(["requester"]);

const checksumAlgorithmSchema = z.enum([
  "CRC32",
  "CRC32C",
  "CRC64NVME",
  "MD5",
  "SHA1",
  "SHA256",
  "SHA512",
  "XXHASH3",
  "XXHASH64",
  "XXHASH128",
]);

const checksumTypeSchema = z.enum(["COMPOSITE", "FULL_OBJECT"]);

const checksumFieldsSchema = {
  checksumCRC32: z.string().optional(),
  checksumCRC32C: z.string().optional(),
  checksumCRC64NVME: z.string().optional(),
  checksumSHA1: z.string().optional(),
  checksumSHA256: z.string().optional(),
  checksumSHA512: z.string().optional(),
  checksumMD5: z.string().optional(),
  checksumType: checksumTypeSchema.optional(),
};

const objectContentFieldsSchema = {
  contentType: z.string().optional(),
  cacheControl: z.string().optional(),
  contentDisposition: z.string().optional(),
  contentEncoding: z.string().optional(),
  contentLanguage: z.string().optional(),
};

const objectMetadataSchema = z.record(z.string(), z.string()).optional();

const expectedOwnerFieldsSchema = {
  expectedBucketOwner: z.string().optional(),
  requestPayer: requestPayerSchema.optional(),
};

const multipartPartNumberSchema = z.number().int().min(1).max(10000);

export const S3OptionsSchema = z.object({
  accessKeyId: z.string().min(1),
  secretAccessKey: z.string().min(1),
  sessionToken: z.string().min(1).optional(),
  region: z.string().min(1),
  endpoint: z.string().url().optional(),
  forcePathStyle: z.boolean().optional(),
  timeout: z.number().int().positive().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type S3Options = z.infer<typeof S3OptionsSchema>;

export const S3ListBucketsRequestSchema = z.object({}).optional();

export type S3ListBucketsRequest = z.infer<typeof S3ListBucketsRequestSchema>;

export const S3CreateBucketRequestSchema = z.object({
  bucket: z.string().min(1),
  locationConstraint: z.string().min(1).optional(),
  acl: z
    .enum(["private", "public-read", "public-read-write", "authenticated-read"])
    .optional(),
  objectOwnership: z
    .enum(["BucketOwnerPreferred", "ObjectWriter", "BucketOwnerEnforced"])
    .optional(),
  objectLockEnabledForBucket: z.boolean().optional(),
});

export type S3CreateBucketRequest = z.infer<typeof S3CreateBucketRequestSchema>;

export const S3BucketRequestSchema = z.object({
  bucket: z.string().min(1),
  expectedBucketOwner: z.string().optional(),
});

export type S3BucketRequest = z.infer<typeof S3BucketRequestSchema>;

export const S3ListObjectsV2RequestSchema = z.object({
  bucket: z.string().min(1),
  prefix: z.string().optional(),
  delimiter: z.string().optional(),
  continuationToken: z.string().optional(),
  maxKeys: z.number().int().positive().max(1000).optional(),
  startAfter: z.string().optional(),
  encodingType: z.enum(["url"]).optional(),
  fetchOwner: z.boolean().optional(),
});

export type S3ListObjectsV2Request = z.infer<
  typeof S3ListObjectsV2RequestSchema
>;

export const S3ListObjectVersionsRequestSchema = z.object({
  bucket: z.string().min(1),
  delimiter: z.string().optional(),
  encodingType: z.enum(["url"]).optional(),
  keyMarker: z.string().optional(),
  maxKeys: z.number().int().positive().max(1000).optional(),
  prefix: z.string().optional(),
  versionIdMarker: z.string().optional(),
  ...expectedOwnerFieldsSchema,
});

export type S3ListObjectVersionsRequest = z.infer<
  typeof S3ListObjectVersionsRequestSchema
>;

const objectTagSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

export const S3PutObjectRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  body: objectBodySchema,
  ...objectContentFieldsSchema,
  metadata: objectMetadataSchema,
  storageClass: z.string().optional(),
});

export type S3PutObjectRequest = z.infer<typeof S3PutObjectRequestSchema>;

export const S3CopyObjectRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  sourceBucket: z.string().min(1),
  sourceKey: z.string().min(1),
  sourceVersionId: z.string().optional(),
  ...objectContentFieldsSchema,
  metadata: objectMetadataSchema,
  metadataDirective: z.enum(["COPY", "REPLACE"]).optional(),
  taggingDirective: z.enum(["COPY", "REPLACE"]).optional(),
  storageClass: z.string().optional(),
  ...expectedOwnerFieldsSchema,
  sourceExpectedBucketOwner: z.string().optional(),
});

export type S3CopyObjectRequest = z.infer<typeof S3CopyObjectRequestSchema>;

export const S3GetObjectRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  range: z.string().optional(),
  versionId: z.string().optional(),
});

export type S3GetObjectRequest = z.infer<typeof S3GetObjectRequestSchema>;

export const S3HeadObjectRequestSchema = S3GetObjectRequestSchema;

export type S3HeadObjectRequest = z.infer<typeof S3HeadObjectRequestSchema>;

export const S3ObjectTaggingRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  versionId: z.string().optional(),
  expectedBucketOwner: z.string().optional(),
});

export type S3ObjectTaggingRequest = z.infer<
  typeof S3ObjectTaggingRequestSchema
>;

export const S3PutObjectTaggingRequestSchema =
  S3ObjectTaggingRequestSchema.extend({
    tagSet: z.array(objectTagSchema).max(10),
  });

export type S3PutObjectTaggingRequest = z.infer<
  typeof S3PutObjectTaggingRequestSchema
>;

export const S3DeleteObjectRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  versionId: z.string().optional(),
});

export type S3DeleteObjectRequest = z.infer<typeof S3DeleteObjectRequestSchema>;

const objectIdentifierSchema = z.object({
  key: z.string().min(1),
  versionId: z.string().optional(),
  eTag: z.string().optional(),
  lastModifiedTime: z.string().optional(),
  size: z.number().int().nonnegative().optional(),
});

export const S3DeleteObjectsRequestSchema = z.object({
  bucket: z.string().min(1),
  objects: z.array(objectIdentifierSchema).min(1).max(1000),
  quiet: z.boolean().optional(),
  bypassGovernanceRetention: z.boolean().optional(),
  checksumAlgorithm: checksumAlgorithmSchema.optional(),
  contentMD5: z.string().optional(),
  mfa: z.string().optional(),
  ...expectedOwnerFieldsSchema,
});

export type S3DeleteObjectsRequest = z.infer<
  typeof S3DeleteObjectsRequestSchema
>;

export const S3GetBucketVersioningRequestSchema = S3BucketRequestSchema;

export type S3GetBucketVersioningRequest = z.infer<
  typeof S3GetBucketVersioningRequestSchema
>;

export const S3PutBucketVersioningRequestSchema = z.object({
  bucket: z.string().min(1),
  status: z.enum(["Enabled", "Suspended"]).optional(),
  mfaDelete: z.enum(["Enabled", "Disabled"]).optional(),
  mfa: z.string().optional(),
  checksumAlgorithm: checksumAlgorithmSchema.optional(),
  contentMD5: z.string().optional(),
  expectedBucketOwner: z.string().optional(),
});

export type S3PutBucketVersioningRequest = z.infer<
  typeof S3PutBucketVersioningRequestSchema
>;

export const S3CreateMultipartUploadRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  ...objectContentFieldsSchema,
  metadata: objectMetadataSchema,
  acl: z
    .enum(["private", "public-read", "public-read-write", "authenticated-read"])
    .optional(),
  bucketKeyEnabled: z.boolean().optional(),
  checksumAlgorithm: checksumAlgorithmSchema.optional(),
  checksumType: checksumTypeSchema.optional(),
  objectLockLegalHold: z.enum(["ON", "OFF"]).optional(),
  objectLockMode: z.enum(["GOVERNANCE", "COMPLIANCE"]).optional(),
  objectLockRetainUntilDate: z.string().optional(),
  serverSideEncryption: z.string().optional(),
  sseKmsEncryptionContext: z.string().optional(),
  sseKmsKeyId: z.string().optional(),
  storageClass: z.string().optional(),
  tagging: z.string().optional(),
  websiteRedirectLocation: z.string().optional(),
  ...expectedOwnerFieldsSchema,
});

export type S3CreateMultipartUploadRequest = z.infer<
  typeof S3CreateMultipartUploadRequestSchema
>;

export const S3UploadPartRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  uploadId: z.string().min(1),
  partNumber: multipartPartNumberSchema,
  body: objectBodySchema,
  contentMD5: z.string().optional(),
  ...checksumFieldsSchema,
  ...expectedOwnerFieldsSchema,
});

export type S3UploadPartRequest = z.infer<typeof S3UploadPartRequestSchema>;

export const S3UploadPartCopyRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  uploadId: z.string().min(1),
  partNumber: multipartPartNumberSchema,
  sourceBucket: z.string().min(1),
  sourceKey: z.string().min(1),
  sourceVersionId: z.string().optional(),
  copySourceIfMatch: z.string().optional(),
  copySourceIfModifiedSince: z.string().optional(),
  copySourceIfNoneMatch: z.string().optional(),
  copySourceIfUnmodifiedSince: z.string().optional(),
  copySourceRange: z.string().optional(),
  ...expectedOwnerFieldsSchema,
  sourceExpectedBucketOwner: z.string().optional(),
});

export type S3UploadPartCopyRequest = z.infer<
  typeof S3UploadPartCopyRequestSchema
>;

const completedMultipartPartSchema = z.object({
  partNumber: multipartPartNumberSchema,
  eTag: z.string().min(1),
  checksumCRC32: z.string().optional(),
  checksumCRC32C: z.string().optional(),
  checksumCRC64NVME: z.string().optional(),
  checksumSHA1: z.string().optional(),
  checksumSHA256: z.string().optional(),
  checksumSHA512: z.string().optional(),
});

export const S3CompleteMultipartUploadRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  uploadId: z.string().min(1),
  parts: z.array(completedMultipartPartSchema).min(1).max(10000),
  ifMatch: z.string().optional(),
  ifNoneMatch: z.string().optional(),
  mpuObjectSize: z.number().int().nonnegative().optional(),
  ...checksumFieldsSchema,
  ...expectedOwnerFieldsSchema,
});

export type S3CompleteMultipartUploadRequest = z.infer<
  typeof S3CompleteMultipartUploadRequestSchema
>;

export const S3AbortMultipartUploadRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  uploadId: z.string().min(1),
  ...expectedOwnerFieldsSchema,
});

export type S3AbortMultipartUploadRequest = z.infer<
  typeof S3AbortMultipartUploadRequestSchema
>;

export const S3ListPartsRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  uploadId: z.string().min(1),
  maxParts: z.number().int().positive().max(1000).optional(),
  partNumberMarker: z.number().int().min(0).optional(),
  ...expectedOwnerFieldsSchema,
});

export type S3ListPartsRequest = z.infer<typeof S3ListPartsRequestSchema>;

export const S3ListMultipartUploadsRequestSchema = z.object({
  bucket: z.string().min(1),
  delimiter: z.string().optional(),
  encodingType: z.enum(["url"]).optional(),
  keyMarker: z.string().optional(),
  maxUploads: z.number().int().positive().max(1000).optional(),
  prefix: z.string().optional(),
  uploadIdMarker: z.string().optional(),
  ...expectedOwnerFieldsSchema,
});

export type S3ListMultipartUploadsRequest = z.infer<
  typeof S3ListMultipartUploadsRequestSchema
>;
