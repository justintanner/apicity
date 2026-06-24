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
  signingService: z.string().min(1).optional(),
  forcePathStyle: z.boolean().optional(),
  timeout: z.number().int().positive().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type S3Options = z.infer<typeof S3OptionsSchema>;

export const S3ListBucketsRequestSchema = z.object({}).optional();

export type S3ListBucketsRequest = z.input<typeof S3ListBucketsRequestSchema>;
export type S3ListBucketsRequestInput = S3ListBucketsRequest;
export type S3ListBucketsParsedRequest = z.output<
  typeof S3ListBucketsRequestSchema
>;

export const S3ListDirectoryBucketsRequestSchema = z
  .object({
    continuationToken: z.string().optional(),
    maxDirectoryBuckets: z.number().int().min(0).max(1000).optional(),
  })
  .optional();

export type S3ListDirectoryBucketsRequest = z.input<
  typeof S3ListDirectoryBucketsRequestSchema
>;
export type S3ListDirectoryBucketsRequestInput = S3ListDirectoryBucketsRequest;
export type S3ListDirectoryBucketsParsedRequest = z.output<
  typeof S3ListDirectoryBucketsRequestSchema
>;

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

export type S3CreateBucketRequest = z.input<typeof S3CreateBucketRequestSchema>;
export type S3CreateBucketRequestInput = S3CreateBucketRequest;
export type S3CreateBucketParsedRequest = z.output<
  typeof S3CreateBucketRequestSchema
>;

export const S3CreateSessionRequestSchema = z.object({
  bucket: z.string().min(1),
  sessionMode: z.enum(["ReadOnly", "ReadWrite"]).optional(),
  serverSideEncryption: z.string().optional(),
  sseKmsEncryptionContext: z.string().optional(),
  sseKmsKeyId: z.string().optional(),
  bucketKeyEnabled: z.boolean().optional(),
});

export type S3CreateSessionRequest = z.input<
  typeof S3CreateSessionRequestSchema
>;
export type S3CreateSessionRequestInput = S3CreateSessionRequest;
export type S3CreateSessionParsedRequest = z.output<
  typeof S3CreateSessionRequestSchema
>;

export const S3BucketRequestSchema = z.object({
  bucket: z.string().min(1),
  expectedBucketOwner: z.string().optional(),
});

export type S3BucketRequest = z.input<typeof S3BucketRequestSchema>;
export type S3BucketRequestInput = S3BucketRequest;
export type S3BucketParsedRequest = z.output<typeof S3BucketRequestSchema>;

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

export type S3ListObjectsV2Request = z.input<
  typeof S3ListObjectsV2RequestSchema
>;
export type S3ListObjectsV2RequestInput = S3ListObjectsV2Request;
export type S3ListObjectsV2ParsedRequest = z.output<
  typeof S3ListObjectsV2RequestSchema
>;

export const S3ListObjectsRequestSchema = z.object({
  bucket: z.string().min(1),
  delimiter: z.string().optional(),
  encodingType: z.enum(["url"]).optional(),
  marker: z.string().optional(),
  maxKeys: z.number().int().positive().max(1000).optional(),
  optionalObjectAttributes: z.array(z.enum(["RestoreStatus"])).optional(),
  prefix: z.string().optional(),
  ...expectedOwnerFieldsSchema,
});

export type S3ListObjectsRequest = z.input<typeof S3ListObjectsRequestSchema>;
export type S3ListObjectsRequestInput = S3ListObjectsRequest;
export type S3ListObjectsParsedRequest = z.output<
  typeof S3ListObjectsRequestSchema
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

export type S3ListObjectVersionsRequest = z.input<
  typeof S3ListObjectVersionsRequestSchema
>;
export type S3ListObjectVersionsRequestInput = S3ListObjectVersionsRequest;
export type S3ListObjectVersionsParsedRequest = z.output<
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
  checksumAlgorithm: checksumAlgorithmSchema.optional(),
  contentMD5: z.string().optional(),
  ...checksumFieldsSchema,
});

export type S3PutObjectRequest = z.input<typeof S3PutObjectRequestSchema>;
export type S3PutObjectRequestInput = S3PutObjectRequest;
export type S3PutObjectParsedRequest = z.output<
  typeof S3PutObjectRequestSchema
>;

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
  checksumAlgorithm: checksumAlgorithmSchema.optional(),
  ...expectedOwnerFieldsSchema,
  sourceExpectedBucketOwner: z.string().optional(),
});

export type S3CopyObjectRequest = z.input<typeof S3CopyObjectRequestSchema>;
export type S3CopyObjectRequestInput = S3CopyObjectRequest;
export type S3CopyObjectParsedRequest = z.output<
  typeof S3CopyObjectRequestSchema
>;

export const S3PresignObjectRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  expiresIn: z.number().int().min(1).max(604800).optional(),
  versionId: z.string().optional(),
  range: z.string().optional(),
  ...objectContentFieldsSchema,
  metadata: objectMetadataSchema,
  storageClass: z.string().optional(),
  checksumAlgorithm: checksumAlgorithmSchema.optional(),
  contentMD5: z.string().optional(),
  ...checksumFieldsSchema,
  responseCacheControl: z.string().optional(),
  responseContentDisposition: z.string().optional(),
  responseContentEncoding: z.string().optional(),
  responseContentLanguage: z.string().optional(),
  responseContentType: z.string().optional(),
  responseExpires: z.string().optional(),
});

export type S3PresignObjectRequest = z.input<
  typeof S3PresignObjectRequestSchema
>;
export type S3PresignObjectRequestInput = S3PresignObjectRequest;
export type S3PresignObjectParsedRequest = z.output<
  typeof S3PresignObjectRequestSchema
>;

export const S3GetObjectRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  range: z.string().optional(),
  versionId: z.string().optional(),
});

export type S3GetObjectRequest = z.input<typeof S3GetObjectRequestSchema>;
export type S3GetObjectRequestInput = S3GetObjectRequest;
export type S3GetObjectParsedRequest = z.output<
  typeof S3GetObjectRequestSchema
>;

export const S3HeadObjectRequestSchema = S3GetObjectRequestSchema;

export type S3HeadObjectRequest = z.input<typeof S3HeadObjectRequestSchema>;
export type S3HeadObjectRequestInput = S3HeadObjectRequest;
export type S3HeadObjectParsedRequest = z.output<
  typeof S3HeadObjectRequestSchema
>;

export const S3ObjectTaggingRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  versionId: z.string().optional(),
  expectedBucketOwner: z.string().optional(),
});

export type S3ObjectTaggingRequest = z.input<
  typeof S3ObjectTaggingRequestSchema
>;
export type S3ObjectTaggingRequestInput = S3ObjectTaggingRequest;
export type S3ObjectTaggingParsedRequest = z.output<
  typeof S3ObjectTaggingRequestSchema
>;

export const S3PutObjectTaggingRequestSchema =
  S3ObjectTaggingRequestSchema.extend({
    tagSet: z.array(objectTagSchema).max(10),
  });

export type S3PutObjectTaggingRequest = z.input<
  typeof S3PutObjectTaggingRequestSchema
>;
export type S3PutObjectTaggingRequestInput = S3PutObjectTaggingRequest;
export type S3PutObjectTaggingParsedRequest = z.output<
  typeof S3PutObjectTaggingRequestSchema
>;

const objectGovernanceFieldsSchema = {
  bucket: z.string().min(1),
  key: z.string().min(1),
  versionId: z.string().optional(),
  ...expectedOwnerFieldsSchema,
};

export const S3ObjectGovernanceRequestSchema = z.object(
  objectGovernanceFieldsSchema
);

export type S3ObjectGovernanceRequest = z.input<
  typeof S3ObjectGovernanceRequestSchema
>;
export type S3ObjectGovernanceRequestInput = S3ObjectGovernanceRequest;
export type S3ObjectGovernanceParsedRequest = z.output<
  typeof S3ObjectGovernanceRequestSchema
>;

export const S3PutObjectAclRequestSchema =
  S3ObjectGovernanceRequestSchema.extend({
    acl: z
      .enum([
        "private",
        "public-read",
        "public-read-write",
        "authenticated-read",
        "aws-exec-read",
        "bucket-owner-read",
        "bucket-owner-full-control",
      ])
      .optional(),
    accessControlPolicy: z.string().optional(),
    checksumAlgorithm: checksumAlgorithmSchema.optional(),
    contentMD5: z.string().optional(),
    grantFullControl: z.string().optional(),
    grantRead: z.string().optional(),
    grantReadAcp: z.string().optional(),
    grantWriteAcp: z.string().optional(),
  });

export type S3PutObjectAclRequest = z.input<typeof S3PutObjectAclRequestSchema>;
export type S3PutObjectAclRequestInput = S3PutObjectAclRequest;
export type S3PutObjectAclParsedRequest = z.output<
  typeof S3PutObjectAclRequestSchema
>;

export const S3GetObjectAttributesRequestSchema =
  S3ObjectGovernanceRequestSchema.extend({
    objectAttributes: z
      .array(
        z.enum([
          "ETag",
          "Checksum",
          "ObjectParts",
          "StorageClass",
          "ObjectSize",
        ])
      )
      .min(1),
    maxParts: z.number().int().positive().max(1000).optional(),
    partNumberMarker: z.number().int().min(0).optional(),
    sseCustomerAlgorithm: z.string().optional(),
    sseCustomerKey: z.string().optional(),
    sseCustomerKeyMD5: z.string().optional(),
  });

export type S3GetObjectAttributesRequest = z.input<
  typeof S3GetObjectAttributesRequestSchema
>;
export type S3GetObjectAttributesRequestInput = S3GetObjectAttributesRequest;
export type S3GetObjectAttributesParsedRequest = z.output<
  typeof S3GetObjectAttributesRequestSchema
>;

export const S3RestoreObjectRequestSchema =
  S3ObjectGovernanceRequestSchema.extend({
    body: z.string().optional(),
    checksumAlgorithm: checksumAlgorithmSchema.optional(),
    contentMD5: z.string().optional(),
  });

export type S3RestoreObjectRequest = z.input<
  typeof S3RestoreObjectRequestSchema
>;
export type S3RestoreObjectRequestInput = S3RestoreObjectRequest;
export type S3RestoreObjectParsedRequest = z.output<
  typeof S3RestoreObjectRequestSchema
>;

export const S3PutObjectLegalHoldRequestSchema =
  S3ObjectGovernanceRequestSchema.extend({
    checksumAlgorithm: checksumAlgorithmSchema.optional(),
    contentMD5: z.string().optional(),
    status: z.enum(["ON", "OFF"]),
  });

export type S3PutObjectLegalHoldRequest = z.input<
  typeof S3PutObjectLegalHoldRequestSchema
>;
export type S3PutObjectLegalHoldRequestInput = S3PutObjectLegalHoldRequest;
export type S3PutObjectLegalHoldParsedRequest = z.output<
  typeof S3PutObjectLegalHoldRequestSchema
>;

export const S3PutObjectRetentionRequestSchema =
  S3ObjectGovernanceRequestSchema.extend({
    bypassGovernanceRetention: z.boolean().optional(),
    checksumAlgorithm: checksumAlgorithmSchema.optional(),
    contentMD5: z.string().optional(),
    mode: z.enum(["GOVERNANCE", "COMPLIANCE"]),
    retainUntilDate: z.string(),
  });

export type S3PutObjectRetentionRequest = z.input<
  typeof S3PutObjectRetentionRequestSchema
>;
export type S3PutObjectRetentionRequestInput = S3PutObjectRetentionRequest;
export type S3PutObjectRetentionParsedRequest = z.output<
  typeof S3PutObjectRetentionRequestSchema
>;

export const S3PutObjectLockConfigurationRequestSchema = z.object({
  bucket: z.string().min(1),
  body: z.string(),
  checksumAlgorithm: checksumAlgorithmSchema.optional(),
  contentMD5: z.string().optional(),
  expectedBucketOwner: z.string().optional(),
  objectLockToken: z.string().optional(),
  requestPayer: requestPayerSchema.optional(),
});

export type S3PutObjectLockConfigurationRequest = z.input<
  typeof S3PutObjectLockConfigurationRequestSchema
>;
export type S3PutObjectLockConfigurationRequestInput =
  S3PutObjectLockConfigurationRequest;
export type S3PutObjectLockConfigurationParsedRequest = z.output<
  typeof S3PutObjectLockConfigurationRequestSchema
>;

export const S3SelectObjectContentRequestSchema =
  S3ObjectGovernanceRequestSchema.extend({
    body: z.string(),
    sseCustomerAlgorithm: z.string().optional(),
    sseCustomerKey: z.string().optional(),
    sseCustomerKeyMD5: z.string().optional(),
  });

export type S3SelectObjectContentRequest = z.input<
  typeof S3SelectObjectContentRequestSchema
>;
export type S3SelectObjectContentRequestInput = S3SelectObjectContentRequest;
export type S3SelectObjectContentParsedRequest = z.output<
  typeof S3SelectObjectContentRequestSchema
>;

export const S3RenameObjectRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  sourceKey: z.string().min(1),
  clientToken: z.string().min(1).max(64).optional(),
  s3SessionToken: z.string().optional(),
  destinationIfMatch: z.string().optional(),
  destinationIfModifiedSince: z.string().optional(),
  destinationIfNoneMatch: z.string().optional(),
  destinationIfUnmodifiedSince: z.string().optional(),
  sourceIfMatch: z.string().optional(),
  sourceIfModifiedSince: z.string().optional(),
  sourceIfNoneMatch: z.string().optional(),
  sourceIfUnmodifiedSince: z.string().optional(),
});

export type S3RenameObjectRequest = z.input<typeof S3RenameObjectRequestSchema>;
export type S3RenameObjectRequestInput = S3RenameObjectRequest;
export type S3RenameObjectParsedRequest = z.output<
  typeof S3RenameObjectRequestSchema
>;

export const S3UpdateObjectEncryptionRequestSchema =
  S3ObjectGovernanceRequestSchema.extend({
    body: z.string(),
    checksumAlgorithm: checksumAlgorithmSchema.optional(),
    contentMD5: z.string().optional(),
  });

export type S3UpdateObjectEncryptionRequest = z.input<
  typeof S3UpdateObjectEncryptionRequestSchema
>;
export type S3UpdateObjectEncryptionRequestInput =
  S3UpdateObjectEncryptionRequest;
export type S3UpdateObjectEncryptionParsedRequest = z.output<
  typeof S3UpdateObjectEncryptionRequestSchema
>;

export const S3WriteGetObjectResponseRequestSchema = z.object({
  requestRoute: z.string().min(1),
  requestToken: z.string().min(1),
  body: objectBodySchema.optional(),
  statusCode: z.number().int().min(100).max(599).optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type S3WriteGetObjectResponseRequest = z.input<
  typeof S3WriteGetObjectResponseRequestSchema
>;
export type S3WriteGetObjectResponseRequestInput =
  S3WriteGetObjectResponseRequest;
export type S3WriteGetObjectResponseParsedRequest = z.output<
  typeof S3WriteGetObjectResponseRequestSchema
>;

export const S3DeleteObjectRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  versionId: z.string().optional(),
});

export type S3DeleteObjectRequest = z.input<typeof S3DeleteObjectRequestSchema>;
export type S3DeleteObjectRequestInput = S3DeleteObjectRequest;
export type S3DeleteObjectParsedRequest = z.output<
  typeof S3DeleteObjectRequestSchema
>;

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

export type S3DeleteObjectsRequest = z.input<
  typeof S3DeleteObjectsRequestSchema
>;
export type S3DeleteObjectsRequestInput = S3DeleteObjectsRequest;
export type S3DeleteObjectsParsedRequest = z.output<
  typeof S3DeleteObjectsRequestSchema
>;

export const S3GetBucketVersioningRequestSchema = S3BucketRequestSchema;

export type S3GetBucketVersioningRequest = z.input<
  typeof S3GetBucketVersioningRequestSchema
>;
export type S3GetBucketVersioningRequestInput = S3GetBucketVersioningRequest;
export type S3GetBucketVersioningParsedRequest = z.output<
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

export type S3PutBucketVersioningRequest = z.input<
  typeof S3PutBucketVersioningRequestSchema
>;
export type S3PutBucketVersioningRequestInput = S3PutBucketVersioningRequest;
export type S3PutBucketVersioningParsedRequest = z.output<
  typeof S3PutBucketVersioningRequestSchema
>;

export const S3BucketConfigRequestSchema = S3BucketRequestSchema;

export type S3BucketConfigRequest = z.input<typeof S3BucketConfigRequestSchema>;
export type S3BucketConfigRequestInput = S3BucketConfigRequest;
export type S3BucketConfigParsedRequest = z.output<
  typeof S3BucketConfigRequestSchema
>;

export const S3ListBucketConfigsRequestSchema =
  S3BucketConfigRequestSchema.extend({
    continuationToken: z.string().optional(),
  });

export type S3ListBucketConfigsRequest = z.input<
  typeof S3ListBucketConfigsRequestSchema
>;
export type S3ListBucketConfigsRequestInput = S3ListBucketConfigsRequest;
export type S3ListBucketConfigsParsedRequest = z.output<
  typeof S3ListBucketConfigsRequestSchema
>;

export const S3BucketConfigWithIdRequestSchema =
  S3BucketConfigRequestSchema.extend({
    id: z.string().min(1),
  });

export type S3BucketConfigWithIdRequest = z.input<
  typeof S3BucketConfigWithIdRequestSchema
>;
export type S3BucketConfigWithIdRequestInput = S3BucketConfigWithIdRequest;
export type S3BucketConfigWithIdParsedRequest = z.output<
  typeof S3BucketConfigWithIdRequestSchema
>;

export const S3BucketConfigWithPayerRequestSchema =
  S3BucketConfigRequestSchema.extend({
    requestPayer: requestPayerSchema.optional(),
  });

export type S3BucketConfigWithPayerRequest = z.input<
  typeof S3BucketConfigWithPayerRequestSchema
>;
export type S3BucketConfigWithPayerRequestInput =
  S3BucketConfigWithPayerRequest;
export type S3BucketConfigWithPayerParsedRequest = z.output<
  typeof S3BucketConfigWithPayerRequestSchema
>;

export const S3PutBucketXmlConfigRequestSchema =
  S3BucketConfigRequestSchema.extend({
    body: z.string(),
    checksumAlgorithm: checksumAlgorithmSchema.optional(),
    contentMD5: z.string().optional(),
  });

export type S3PutBucketXmlConfigRequest = z.input<
  typeof S3PutBucketXmlConfigRequestSchema
>;
export type S3PutBucketXmlConfigRequestInput = S3PutBucketXmlConfigRequest;
export type S3PutBucketXmlConfigParsedRequest = z.output<
  typeof S3PutBucketXmlConfigRequestSchema
>;

export const S3PutBucketXmlConfigWithIdRequestSchema =
  S3BucketConfigWithIdRequestSchema.extend({
    body: z.string(),
    checksumAlgorithm: checksumAlgorithmSchema.optional(),
    contentMD5: z.string().optional(),
  });

export type S3PutBucketXmlConfigWithIdRequest = z.input<
  typeof S3PutBucketXmlConfigWithIdRequestSchema
>;
export type S3PutBucketXmlConfigWithIdRequestInput =
  S3PutBucketXmlConfigWithIdRequest;
export type S3PutBucketXmlConfigWithIdParsedRequest = z.output<
  typeof S3PutBucketXmlConfigWithIdRequestSchema
>;

export const S3PutBucketPolicyRequestSchema =
  S3BucketConfigRequestSchema.extend({
    policy: z.string().min(1),
    checksumAlgorithm: checksumAlgorithmSchema.optional(),
    confirmRemoveSelfBucketAccess: z.boolean().optional(),
    contentMD5: z.string().optional(),
  });

export type S3PutBucketPolicyRequest = z.input<
  typeof S3PutBucketPolicyRequestSchema
>;
export type S3PutBucketPolicyRequestInput = S3PutBucketPolicyRequest;
export type S3PutBucketPolicyParsedRequest = z.output<
  typeof S3PutBucketPolicyRequestSchema
>;

export const S3PutBucketTaggingRequestSchema =
  S3BucketConfigRequestSchema.extend({
    tagSet: z.array(objectTagSchema).max(50),
  });

export type S3PutBucketTaggingRequest = z.input<
  typeof S3PutBucketTaggingRequestSchema
>;
export type S3PutBucketTaggingRequestInput = S3PutBucketTaggingRequest;
export type S3PutBucketTaggingParsedRequest = z.output<
  typeof S3PutBucketTaggingRequestSchema
>;

export const S3PutBucketRequestPaymentRequestSchema =
  S3BucketConfigRequestSchema.extend({
    payer: z.enum(["Requester", "BucketOwner"]),
    checksumAlgorithm: checksumAlgorithmSchema.optional(),
    contentMD5: z.string().optional(),
  });

export type S3PutBucketRequestPaymentRequest = z.input<
  typeof S3PutBucketRequestPaymentRequestSchema
>;
export type S3PutBucketRequestPaymentRequestInput =
  S3PutBucketRequestPaymentRequest;
export type S3PutBucketRequestPaymentParsedRequest = z.output<
  typeof S3PutBucketRequestPaymentRequestSchema
>;

export const S3PutBucketAclRequestSchema = S3BucketConfigRequestSchema.extend({
  acl: z
    .enum(["private", "public-read", "public-read-write", "authenticated-read"])
    .optional(),
  accessControlPolicy: z.string().optional(),
  checksumAlgorithm: checksumAlgorithmSchema.optional(),
  contentMD5: z.string().optional(),
  grantFullControl: z.string().optional(),
  grantRead: z.string().optional(),
  grantReadAcp: z.string().optional(),
  grantWrite: z.string().optional(),
  grantWriteAcp: z.string().optional(),
});

export type S3PutBucketAclRequest = z.input<typeof S3PutBucketAclRequestSchema>;
export type S3PutBucketAclRequestInput = S3PutBucketAclRequest;
export type S3PutBucketAclParsedRequest = z.output<
  typeof S3PutBucketAclRequestSchema
>;

export const S3PutBucketMetadataConfigurationRequestSchema =
  S3BucketConfigRequestSchema.extend({
    body: z.string(),
    checksumAlgorithm: checksumAlgorithmSchema.optional(),
    contentMD5: z.string().optional(),
  });

export type S3PutBucketMetadataConfigurationRequest = z.input<
  typeof S3PutBucketMetadataConfigurationRequestSchema
>;
export type S3PutBucketMetadataConfigurationRequestInput =
  S3PutBucketMetadataConfigurationRequest;
export type S3PutBucketMetadataConfigurationParsedRequest = z.output<
  typeof S3PutBucketMetadataConfigurationRequestSchema
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

export type S3CreateMultipartUploadRequest = z.input<
  typeof S3CreateMultipartUploadRequestSchema
>;
export type S3CreateMultipartUploadRequestInput =
  S3CreateMultipartUploadRequest;
export type S3CreateMultipartUploadParsedRequest = z.output<
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

export type S3UploadPartRequest = z.input<typeof S3UploadPartRequestSchema>;
export type S3UploadPartRequestInput = S3UploadPartRequest;
export type S3UploadPartParsedRequest = z.output<
  typeof S3UploadPartRequestSchema
>;

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

export type S3UploadPartCopyRequest = z.input<
  typeof S3UploadPartCopyRequestSchema
>;
export type S3UploadPartCopyRequestInput = S3UploadPartCopyRequest;
export type S3UploadPartCopyParsedRequest = z.output<
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

export type S3CompleteMultipartUploadRequest = z.input<
  typeof S3CompleteMultipartUploadRequestSchema
>;
export type S3CompleteMultipartUploadRequestInput =
  S3CompleteMultipartUploadRequest;
export type S3CompleteMultipartUploadParsedRequest = z.output<
  typeof S3CompleteMultipartUploadRequestSchema
>;

export const S3AbortMultipartUploadRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  uploadId: z.string().min(1),
  ...expectedOwnerFieldsSchema,
});

export type S3AbortMultipartUploadRequest = z.input<
  typeof S3AbortMultipartUploadRequestSchema
>;
export type S3AbortMultipartUploadRequestInput = S3AbortMultipartUploadRequest;
export type S3AbortMultipartUploadParsedRequest = z.output<
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

export type S3ListPartsRequest = z.input<typeof S3ListPartsRequestSchema>;
export type S3ListPartsRequestInput = S3ListPartsRequest;
export type S3ListPartsParsedRequest = z.output<
  typeof S3ListPartsRequestSchema
>;

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

export type S3ListMultipartUploadsRequest = z.input<
  typeof S3ListMultipartUploadsRequestSchema
>;
export type S3ListMultipartUploadsRequestInput = S3ListMultipartUploadsRequest;
export type S3ListMultipartUploadsParsedRequest = z.output<
  typeof S3ListMultipartUploadsRequestSchema
>;
