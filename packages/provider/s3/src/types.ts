import type { z } from "zod";

export type {
  S3AbortMultipartUploadRequest,
  S3BucketConfigRequest,
  S3BucketConfigWithIdRequest,
  S3BucketRequest,
  S3CompleteMultipartUploadRequest,
  S3CopyObjectRequest,
  S3CreateMultipartUploadRequest,
  S3CreateBucketRequest,
  S3CreateSessionRequest,
  S3DeleteObjectRequest,
  S3DeleteObjectsRequest,
  S3GetObjectRequest,
  S3GetObjectAttributesRequest,
  S3GetBucketVersioningRequest,
  S3HeadObjectRequest,
  S3ListBucketConfigsRequest,
  S3ListBucketsRequest,
  S3ListDirectoryBucketsRequest,
  S3ListMultipartUploadsRequest,
  S3ListObjectVersionsRequest,
  S3ListObjectsV2Request,
  S3ListPartsRequest,
  S3ObjectGovernanceRequest,
  S3ObjectTaggingRequest,
  S3Options,
  S3PresignObjectRequest,
  S3PutBucketPolicyRequest,
  S3PutBucketRequestPaymentRequest,
  S3PutBucketTaggingRequest,
  S3PutBucketMetadataConfigurationRequest,
  S3PutBucketVersioningRequest,
  S3PutBucketXmlConfigRequest,
  S3PutBucketXmlConfigWithIdRequest,
  S3PutObjectAclRequest,
  S3PutObjectLegalHoldRequest,
  S3PutObjectLockConfigurationRequest,
  S3PutObjectRetentionRequest,
  S3PutObjectTaggingRequest,
  S3PutObjectRequest,
  S3RenameObjectRequest,
  S3RestoreObjectRequest,
  S3SelectObjectContentRequest,
  S3UpdateObjectEncryptionRequest,
  S3UploadPartCopyRequest,
  S3UploadPartRequest,
  S3WriteGetObjectResponseRequest,
} from "./zod";

import type {
  S3AbortMultipartUploadRequest,
  S3BucketConfigRequest,
  S3BucketConfigWithIdRequest,
  S3BucketRequest,
  S3CompleteMultipartUploadRequest,
  S3CopyObjectRequest,
  S3CreateMultipartUploadRequest,
  S3CreateBucketRequest,
  S3CreateSessionRequest,
  S3DeleteObjectRequest,
  S3DeleteObjectsRequest,
  S3GetBucketVersioningRequest,
  S3GetObjectRequest,
  S3GetObjectAttributesRequest,
  S3HeadObjectRequest,
  S3ListBucketConfigsRequest,
  S3ListBucketsRequest,
  S3ListDirectoryBucketsRequest,
  S3ListMultipartUploadsRequest,
  S3ListObjectVersionsRequest,
  S3ListObjectsV2Request,
  S3ListPartsRequest,
  S3ObjectGovernanceRequest,
  S3ObjectTaggingRequest,
  S3PresignObjectRequest,
  S3PutBucketPolicyRequest,
  S3PutBucketRequestPaymentRequest,
  S3PutBucketTaggingRequest,
  S3PutBucketMetadataConfigurationRequest,
  S3PutBucketVersioningRequest,
  S3PutBucketXmlConfigRequest,
  S3PutBucketXmlConfigWithIdRequest,
  S3PutObjectAclRequest,
  S3PutObjectLegalHoldRequest,
  S3PutObjectLockConfigurationRequest,
  S3PutObjectRetentionRequest,
  S3PutObjectTaggingRequest,
  S3PutObjectRequest,
  S3RenameObjectRequest,
  S3RestoreObjectRequest,
  S3SelectObjectContentRequest,
  S3UpdateObjectEncryptionRequest,
  S3UploadPartCopyRequest,
  S3UploadPartRequest,
  S3WriteGetObjectResponseRequest,
} from "./zod";

export class S3Error extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;
  readonly requestId?: string;
  readonly hostId?: string;

  constructor(
    message: string,
    status: number,
    body?: unknown,
    code?: string,
    requestId?: string,
    hostId?: string
  ) {
    super(message);
    this.name = "S3Error";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
    this.requestId = requestId;
    this.hostId = hostId;
  }
}

export interface S3Owner {
  id?: string;
  displayName?: string;
}

export interface S3Bucket {
  name: string;
  creationDate?: string;
}

export interface S3ListBucketsResponse {
  buckets: S3Bucket[];
  owner?: S3Owner;
  rawXml: string;
}

export interface S3DirectoryBucket extends S3Bucket {
  bucketArn?: string;
  bucketRegion?: string;
}

export interface S3ListDirectoryBucketsResponse {
  buckets: S3DirectoryBucket[];
  continuationToken?: string;
  rawXml: string;
}

export interface S3CreateBucketResponse {
  location?: string;
  headers: Record<string, string>;
}

export interface S3CreateSessionCredentials {
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  expiration?: string;
}

export interface S3CreateSessionResponse extends S3BucketConfigResponse {
  credentials?: S3CreateSessionCredentials;
  rawXml: string;
}

export interface S3HeadBucketResponse {
  bucketArn?: string;
  bucketLocationType?: string;
  bucketLocationName?: string;
  bucketRegion?: string;
  accessPointAlias?: boolean;
  headers: Record<string, string>;
}

export interface S3GetBucketLocationResponse {
  locationConstraint?: string;
  rawXml: string;
}

export interface S3DeleteBucketResponse {
  headers: Record<string, string>;
}

export interface S3ObjectSummary {
  key: string;
  lastModified?: string;
  eTag?: string;
  size?: number;
  storageClass?: string;
  owner?: S3Owner;
}

export interface S3CommonPrefix {
  prefix: string;
}

export interface S3ListObjectsV2Response {
  name?: string;
  prefix?: string;
  delimiter?: string;
  keyCount?: number;
  maxKeys?: number;
  isTruncated: boolean;
  nextContinuationToken?: string;
  contents: S3ObjectSummary[];
  commonPrefixes: S3CommonPrefix[];
  rawXml: string;
}

export interface S3PutObjectResponse {
  eTag?: string;
  versionId?: string;
  serverSideEncryption?: string;
  requestCharged?: string;
}

export interface S3CopyObjectResponse {
  eTag?: string;
  lastModified?: string;
  checksumCRC32?: string;
  checksumCRC32C?: string;
  checksumCRC64NVME?: string;
  checksumSHA1?: string;
  checksumSHA256?: string;
  checksumSHA512?: string;
  checksumMD5?: string;
  checksumType?: string;
  versionId?: string;
  copySourceVersionId?: string;
  serverSideEncryption?: string;
  requestCharged?: string;
  rawXml: string;
}

export interface S3ObjectHeaders {
  acceptRanges?: string;
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  contentLanguage?: string;
  contentLength?: number;
  contentRange?: string;
  contentType?: string;
  eTag?: string;
  expires?: string;
  lastModified?: string;
  storageClass?: string;
  versionId?: string;
  metadata: Record<string, string>;
  headers: Record<string, string>;
}

export interface S3GetObjectResponse extends S3ObjectHeaders {
  body: ArrayBuffer;
}

export interface S3GetObjectStreamResponse extends S3ObjectHeaders {
  body: ReadableStream<Uint8Array> | null;
}

export type S3HeadObjectResponse = S3ObjectHeaders;

export interface S3DeleteObjectResponse {
  deleteMarker?: boolean;
  versionId?: string;
  requestCharged?: string;
}

export interface S3DeletedObject {
  key: string;
  versionId?: string;
  deleteMarker?: boolean;
  deleteMarkerVersionId?: string;
}

export interface S3DeleteObjectError {
  key: string;
  versionId?: string;
  code?: string;
  message?: string;
}

export interface S3DeleteObjectsResponse {
  deleted: S3DeletedObject[];
  errors: S3DeleteObjectError[];
  requestCharged?: string;
  rawXml: string;
}

export interface S3GetBucketVersioningResponse {
  status?: string;
  mfaDelete?: string;
  rawXml: string;
}

export interface S3PutBucketVersioningResponse {
  requestCharged?: string;
  headers: Record<string, string>;
}

export interface S3BucketConfigResponse {
  headers: Record<string, string>;
}

export interface S3GetBucketConfigResponse extends S3BucketConfigResponse {
  rawXml: string;
}

export type S3ListBucketConfigsResponse = S3GetBucketConfigResponse;

export type S3PutBucketConfigResponse = S3BucketConfigResponse;

export type S3DeleteBucketConfigResponse = S3BucketConfigResponse;

export interface S3GetBucketPolicyResponse extends S3BucketConfigResponse {
  policy: string;
}

export interface S3GetBucketTaggingResponse extends S3GetBucketConfigResponse {
  tagSet: S3ObjectTag[];
}

export interface S3GetBucketRequestPaymentResponse extends S3GetBucketConfigResponse {
  payer?: string;
}

export interface S3ChecksumFields {
  checksumCRC32?: string;
  checksumCRC32C?: string;
  checksumCRC64NVME?: string;
  checksumMD5?: string;
  checksumSHA1?: string;
  checksumSHA256?: string;
  checksumSHA512?: string;
  checksumType?: string;
}

export interface S3RestoreStatus {
  isRestoreInProgress?: boolean;
  restoreExpiryDate?: string;
}

export interface S3ObjectVersion extends S3ChecksumFields {
  key: string;
  versionId?: string;
  isLatest?: boolean;
  lastModified?: string;
  eTag?: string;
  size?: number;
  storageClass?: string;
  owner?: S3Owner;
  restoreStatus?: S3RestoreStatus;
}

export interface S3ObjectDeleteMarker {
  key: string;
  versionId?: string;
  isLatest?: boolean;
  lastModified?: string;
  owner?: S3Owner;
}

export interface S3ListObjectVersionsResponse {
  name?: string;
  prefix?: string;
  delimiter?: string;
  keyMarker?: string;
  versionIdMarker?: string;
  nextKeyMarker?: string;
  nextVersionIdMarker?: string;
  maxKeys?: number;
  encodingType?: string;
  isTruncated: boolean;
  versions: S3ObjectVersion[];
  deleteMarkers: S3ObjectDeleteMarker[];
  commonPrefixes: S3CommonPrefix[];
  requestCharged?: string;
  rawXml: string;
}

export interface S3ObjectTag {
  key: string;
  value: string;
}

export interface S3GetObjectTaggingResponse {
  tagSet: S3ObjectTag[];
  versionId?: string;
  rawXml: string;
}

export interface S3PutObjectTaggingResponse {
  versionId?: string;
}

export interface S3DeleteObjectTaggingResponse {
  versionId?: string;
}

export interface S3ObjectConfigResponse {
  requestCharged?: string;
  headers: Record<string, string>;
}

export interface S3GetObjectXmlConfigResponse extends S3ObjectConfigResponse {
  rawXml: string;
  versionId?: string;
}

export interface S3ObjectAclGrantee {
  type?: string;
  id?: string;
  displayName?: string;
  uri?: string;
  emailAddress?: string;
}

export interface S3ObjectAclGrant {
  grantee: S3ObjectAclGrantee;
  permission?: string;
}

export interface S3GetObjectAclResponse extends S3GetObjectXmlConfigResponse {
  owner?: S3Owner;
  grants: S3ObjectAclGrant[];
}

export type S3PutObjectAclResponse = S3ObjectConfigResponse;

export interface S3ObjectAttributesResponse
  extends S3ChecksumFields, S3ObjectConfigResponse {
  deleteMarker?: boolean;
  eTag?: string;
  lastModified?: string;
  objectParts?: string;
  objectSize?: number;
  storageClass?: string;
  versionId?: string;
  rawXml: string;
}

export type S3RestoreObjectResponse = S3ObjectConfigResponse;

export interface S3GetObjectLegalHoldResponse extends S3GetObjectXmlConfigResponse {
  status?: string;
}

export type S3PutObjectLegalHoldResponse = S3ObjectConfigResponse;

export interface S3GetObjectRetentionResponse extends S3GetObjectXmlConfigResponse {
  mode?: string;
  retainUntilDate?: string;
}

export type S3PutObjectRetentionResponse = S3ObjectConfigResponse;

export interface S3GetObjectLockConfigurationResponse extends S3GetBucketConfigResponse {
  objectLockEnabled?: string;
}

export type S3PutObjectLockConfigurationResponse = S3BucketConfigResponse;

export interface S3GetObjectTorrentResponse extends S3ObjectConfigResponse {
  body: ArrayBuffer;
}

export interface S3SelectObjectContentResponse extends S3ObjectConfigResponse {
  body: ArrayBuffer;
}

export type S3RenameObjectResponse = S3ObjectConfigResponse;

export type S3UpdateObjectEncryptionResponse = S3ObjectConfigResponse;

export type S3WriteGetObjectResponseResult = S3ObjectConfigResponse;

export interface S3CreateMultipartUploadResponse extends S3ChecksumFields {
  bucket?: string;
  key?: string;
  uploadId: string;
  abortDate?: string;
  abortRuleId?: string;
  bucketKeyEnabled?: boolean;
  requestCharged?: string;
  serverSideEncryption?: string;
  sseKmsKeyId?: string;
  rawXml: string;
}

export interface S3UploadPartResponse extends S3ChecksumFields {
  eTag?: string;
  requestCharged?: string;
  serverSideEncryption?: string;
  sseKmsKeyId?: string;
}

export interface S3UploadPartCopyResponse extends S3ChecksumFields {
  eTag?: string;
  lastModified?: string;
  requestCharged?: string;
  rawXml: string;
}

export interface S3CompleteMultipartUploadResponse extends S3ChecksumFields {
  location?: string;
  bucket?: string;
  key?: string;
  eTag?: string;
  bucketKeyEnabled?: boolean;
  expiration?: string;
  requestCharged?: string;
  serverSideEncryption?: string;
  sseKmsKeyId?: string;
  versionId?: string;
  rawXml: string;
}

export interface S3AbortMultipartUploadResponse {
  requestCharged?: string;
  headers: Record<string, string>;
}

export interface S3MultipartUploadPart extends S3ChecksumFields {
  partNumber: number;
  lastModified?: string;
  eTag?: string;
  size?: number;
}

export interface S3ListPartsResponse {
  bucket?: string;
  key?: string;
  uploadId?: string;
  partNumberMarker?: number;
  nextPartNumberMarker?: number;
  maxParts?: number;
  isTruncated: boolean;
  initiator?: S3Owner;
  owner?: S3Owner;
  storageClass?: string;
  abortDate?: string;
  abortRuleId?: string;
  requestCharged?: string;
  parts: S3MultipartUploadPart[];
  rawXml: string;
}

export interface S3MultipartUploadSummary {
  key: string;
  uploadId: string;
  initiated?: string;
  initiator?: S3Owner;
  owner?: S3Owner;
  storageClass?: string;
  checksumAlgorithms: string[];
  checksumType?: string;
}

export interface S3ListMultipartUploadsResponse {
  bucket?: string;
  keyMarker?: string;
  uploadIdMarker?: string;
  nextKeyMarker?: string;
  nextUploadIdMarker?: string;
  delimiter?: string;
  prefix?: string;
  encodingType?: string;
  maxUploads?: number;
  isTruncated: boolean;
  requestCharged?: string;
  uploads: S3MultipartUploadSummary[];
  commonPrefixes: S3CommonPrefix[];
  rawXml: string;
}

export interface S3ListBucketsMethod {
  (
    req?: S3ListBucketsRequest,
    signal?: AbortSignal
  ): Promise<S3ListBucketsResponse>;
  schema: z.ZodType<S3ListBucketsRequest>;
}

export interface S3ListDirectoryBucketsMethod {
  (
    req?: S3ListDirectoryBucketsRequest,
    signal?: AbortSignal
  ): Promise<S3ListDirectoryBucketsResponse>;
  schema: z.ZodType<S3ListDirectoryBucketsRequest>;
}

export interface S3CreateBucketMethod {
  (
    req: S3CreateBucketRequest,
    signal?: AbortSignal
  ): Promise<S3CreateBucketResponse>;
  schema: z.ZodType<S3CreateBucketRequest>;
}

export interface S3CreateSessionMethod {
  (
    req: S3CreateSessionRequest,
    signal?: AbortSignal
  ): Promise<S3CreateSessionResponse>;
  schema: z.ZodType<S3CreateSessionRequest>;
}

export interface S3HeadBucketMethod {
  (req: S3BucketRequest, signal?: AbortSignal): Promise<S3HeadBucketResponse>;
  schema: z.ZodType<S3BucketRequest>;
}

export interface S3GetBucketLocationMethod {
  (
    req: S3BucketRequest,
    signal?: AbortSignal
  ): Promise<S3GetBucketLocationResponse>;
  schema: z.ZodType<S3BucketRequest>;
}

export interface S3DeleteBucketMethod {
  (req: S3BucketRequest, signal?: AbortSignal): Promise<S3DeleteBucketResponse>;
  schema: z.ZodType<S3BucketRequest>;
}

export interface S3ListObjectsV2Method {
  (
    req: S3ListObjectsV2Request,
    signal?: AbortSignal
  ): Promise<S3ListObjectsV2Response>;
  schema: z.ZodType<S3ListObjectsV2Request>;
}

export interface S3PutObjectMethod {
  (req: S3PutObjectRequest, signal?: AbortSignal): Promise<S3PutObjectResponse>;
  schema: z.ZodType<S3PutObjectRequest>;
}

export interface S3CopyObjectMethod {
  (
    req: S3CopyObjectRequest,
    signal?: AbortSignal
  ): Promise<S3CopyObjectResponse>;
  schema: z.ZodType<S3CopyObjectRequest>;
}

export interface S3GetObjectMethod {
  (req: S3GetObjectRequest, signal?: AbortSignal): Promise<S3GetObjectResponse>;
  schema: z.ZodType<S3GetObjectRequest>;
}

export interface S3GetObjectStreamMethod {
  (
    req: S3GetObjectRequest,
    signal?: AbortSignal
  ): Promise<S3GetObjectStreamResponse>;
  schema: z.ZodType<S3GetObjectRequest>;
}

export interface S3HeadObjectMethod {
  (
    req: S3HeadObjectRequest,
    signal?: AbortSignal
  ): Promise<S3HeadObjectResponse>;
  schema: z.ZodType<S3HeadObjectRequest>;
}

export interface S3DeleteObjectMethod {
  (
    req: S3DeleteObjectRequest,
    signal?: AbortSignal
  ): Promise<S3DeleteObjectResponse>;
  schema: z.ZodType<S3DeleteObjectRequest>;
}

export interface S3DeleteObjectsMethod {
  (
    req: S3DeleteObjectsRequest,
    signal?: AbortSignal
  ): Promise<S3DeleteObjectsResponse>;
  schema: z.ZodType<S3DeleteObjectsRequest>;
}

export interface S3GetBucketVersioningMethod {
  (
    req: S3GetBucketVersioningRequest,
    signal?: AbortSignal
  ): Promise<S3GetBucketVersioningResponse>;
  schema: z.ZodType<S3GetBucketVersioningRequest>;
}

export interface S3PutBucketVersioningMethod {
  (
    req: S3PutBucketVersioningRequest,
    signal?: AbortSignal
  ): Promise<S3PutBucketVersioningResponse>;
  schema: z.ZodType<S3PutBucketVersioningRequest>;
}

export interface S3GetBucketConfigMethod {
  (
    req: S3BucketConfigRequest,
    signal?: AbortSignal
  ): Promise<S3GetBucketConfigResponse>;
  schema: z.ZodType<S3BucketConfigRequest>;
}

export interface S3PutBucketXmlConfigMethod {
  (
    req: S3PutBucketXmlConfigRequest,
    signal?: AbortSignal
  ): Promise<S3PutBucketConfigResponse>;
  schema: z.ZodType<S3PutBucketXmlConfigRequest>;
}

export interface S3DeleteBucketConfigMethod {
  (
    req: S3BucketConfigRequest,
    signal?: AbortSignal
  ): Promise<S3DeleteBucketConfigResponse>;
  schema: z.ZodType<S3BucketConfigRequest>;
}

export interface S3GetBucketPolicyMethod {
  (
    req: S3BucketConfigRequest,
    signal?: AbortSignal
  ): Promise<S3GetBucketPolicyResponse>;
  schema: z.ZodType<S3BucketConfigRequest>;
}

export interface S3PutBucketPolicyMethod {
  (
    req: S3PutBucketPolicyRequest,
    signal?: AbortSignal
  ): Promise<S3PutBucketConfigResponse>;
  schema: z.ZodType<S3PutBucketPolicyRequest>;
}

export interface S3GetBucketTaggingMethod {
  (
    req: S3BucketConfigRequest,
    signal?: AbortSignal
  ): Promise<S3GetBucketTaggingResponse>;
  schema: z.ZodType<S3BucketConfigRequest>;
}

export interface S3PutBucketTaggingMethod {
  (
    req: S3PutBucketTaggingRequest,
    signal?: AbortSignal
  ): Promise<S3PutBucketConfigResponse>;
  schema: z.ZodType<S3PutBucketTaggingRequest>;
}

export interface S3GetBucketRequestPaymentMethod {
  (
    req: S3BucketConfigRequest,
    signal?: AbortSignal
  ): Promise<S3GetBucketRequestPaymentResponse>;
  schema: z.ZodType<S3BucketConfigRequest>;
}

export interface S3PutBucketRequestPaymentMethod {
  (
    req: S3PutBucketRequestPaymentRequest,
    signal?: AbortSignal
  ): Promise<S3PutBucketConfigResponse>;
  schema: z.ZodType<S3PutBucketRequestPaymentRequest>;
}

export interface S3CreateBucketMetadataConfigurationMethod {
  (
    req: S3PutBucketMetadataConfigurationRequest,
    signal?: AbortSignal
  ): Promise<S3BucketConfigResponse>;
  schema: z.ZodType<S3PutBucketMetadataConfigurationRequest>;
}

export interface S3UpdateBucketMetadataTableMethod {
  (
    req: S3PutBucketMetadataConfigurationRequest,
    signal?: AbortSignal
  ): Promise<S3BucketConfigResponse>;
  schema: z.ZodType<S3PutBucketMetadataConfigurationRequest>;
}

export interface S3ListBucketConfigsMethod {
  (
    req: S3ListBucketConfigsRequest,
    signal?: AbortSignal
  ): Promise<S3ListBucketConfigsResponse>;
  schema: z.ZodType<S3ListBucketConfigsRequest>;
}

export interface S3GetBucketConfigWithIdMethod {
  (
    req: S3BucketConfigWithIdRequest,
    signal?: AbortSignal
  ): Promise<S3GetBucketConfigResponse>;
  schema: z.ZodType<S3BucketConfigWithIdRequest>;
}

export interface S3PutBucketXmlConfigWithIdMethod {
  (
    req: S3PutBucketXmlConfigWithIdRequest,
    signal?: AbortSignal
  ): Promise<S3PutBucketConfigResponse>;
  schema: z.ZodType<S3PutBucketXmlConfigWithIdRequest>;
}

export interface S3DeleteBucketConfigWithIdMethod {
  (
    req: S3BucketConfigWithIdRequest,
    signal?: AbortSignal
  ): Promise<S3DeleteBucketConfigResponse>;
  schema: z.ZodType<S3BucketConfigWithIdRequest>;
}

export interface S3ListObjectVersionsMethod {
  (
    req: S3ListObjectVersionsRequest,
    signal?: AbortSignal
  ): Promise<S3ListObjectVersionsResponse>;
  schema: z.ZodType<S3ListObjectVersionsRequest>;
}

export interface S3GetObjectTaggingMethod {
  (
    req: S3ObjectTaggingRequest,
    signal?: AbortSignal
  ): Promise<S3GetObjectTaggingResponse>;
  schema: z.ZodType<S3ObjectTaggingRequest>;
}

export interface S3PutObjectTaggingMethod {
  (
    req: S3PutObjectTaggingRequest,
    signal?: AbortSignal
  ): Promise<S3PutObjectTaggingResponse>;
  schema: z.ZodType<S3PutObjectTaggingRequest>;
}

export interface S3DeleteObjectTaggingMethod {
  (
    req: S3ObjectTaggingRequest,
    signal?: AbortSignal
  ): Promise<S3DeleteObjectTaggingResponse>;
  schema: z.ZodType<S3ObjectTaggingRequest>;
}

export interface S3GetObjectAclMethod {
  (
    req: S3ObjectGovernanceRequest,
    signal?: AbortSignal
  ): Promise<S3GetObjectAclResponse>;
  schema: z.ZodType<S3ObjectGovernanceRequest>;
}

export interface S3PutObjectAclMethod {
  (
    req: S3PutObjectAclRequest,
    signal?: AbortSignal
  ): Promise<S3PutObjectAclResponse>;
  schema: z.ZodType<S3PutObjectAclRequest>;
}

export interface S3GetObjectAttributesMethod {
  (
    req: S3GetObjectAttributesRequest,
    signal?: AbortSignal
  ): Promise<S3ObjectAttributesResponse>;
  schema: z.ZodType<S3GetObjectAttributesRequest>;
}

export interface S3RestoreObjectMethod {
  (
    req: S3RestoreObjectRequest,
    signal?: AbortSignal
  ): Promise<S3RestoreObjectResponse>;
  schema: z.ZodType<S3RestoreObjectRequest>;
}

export interface S3GetObjectLegalHoldMethod {
  (
    req: S3ObjectGovernanceRequest,
    signal?: AbortSignal
  ): Promise<S3GetObjectLegalHoldResponse>;
  schema: z.ZodType<S3ObjectGovernanceRequest>;
}

export interface S3PutObjectLegalHoldMethod {
  (
    req: S3PutObjectLegalHoldRequest,
    signal?: AbortSignal
  ): Promise<S3PutObjectLegalHoldResponse>;
  schema: z.ZodType<S3PutObjectLegalHoldRequest>;
}

export interface S3GetObjectRetentionMethod {
  (
    req: S3ObjectGovernanceRequest,
    signal?: AbortSignal
  ): Promise<S3GetObjectRetentionResponse>;
  schema: z.ZodType<S3ObjectGovernanceRequest>;
}

export interface S3PutObjectRetentionMethod {
  (
    req: S3PutObjectRetentionRequest,
    signal?: AbortSignal
  ): Promise<S3PutObjectRetentionResponse>;
  schema: z.ZodType<S3PutObjectRetentionRequest>;
}

export interface S3GetObjectLockConfigurationMethod {
  (
    req: S3BucketConfigRequest,
    signal?: AbortSignal
  ): Promise<S3GetObjectLockConfigurationResponse>;
  schema: z.ZodType<S3BucketConfigRequest>;
}

export interface S3PutObjectLockConfigurationMethod {
  (
    req: S3PutObjectLockConfigurationRequest,
    signal?: AbortSignal
  ): Promise<S3PutObjectLockConfigurationResponse>;
  schema: z.ZodType<S3PutObjectLockConfigurationRequest>;
}

export interface S3GetObjectTorrentMethod {
  (
    req: S3ObjectGovernanceRequest,
    signal?: AbortSignal
  ): Promise<S3GetObjectTorrentResponse>;
  schema: z.ZodType<S3ObjectGovernanceRequest>;
}

export interface S3SelectObjectContentMethod {
  (
    req: S3SelectObjectContentRequest,
    signal?: AbortSignal
  ): Promise<S3SelectObjectContentResponse>;
  schema: z.ZodType<S3SelectObjectContentRequest>;
}

export interface S3RenameObjectMethod {
  (
    req: S3RenameObjectRequest,
    signal?: AbortSignal
  ): Promise<S3RenameObjectResponse>;
  schema: z.ZodType<S3RenameObjectRequest>;
}

export interface S3UpdateObjectEncryptionMethod {
  (
    req: S3UpdateObjectEncryptionRequest,
    signal?: AbortSignal
  ): Promise<S3UpdateObjectEncryptionResponse>;
  schema: z.ZodType<S3UpdateObjectEncryptionRequest>;
}

export interface S3WriteGetObjectResponseMethod {
  (
    req: S3WriteGetObjectResponseRequest,
    signal?: AbortSignal
  ): Promise<S3WriteGetObjectResponseResult>;
  schema: z.ZodType<S3WriteGetObjectResponseRequest>;
}

export interface S3CreateMultipartUploadMethod {
  (
    req: S3CreateMultipartUploadRequest,
    signal?: AbortSignal
  ): Promise<S3CreateMultipartUploadResponse>;
  schema: z.ZodType<S3CreateMultipartUploadRequest>;
}

export interface S3UploadPartMethod {
  (
    req: S3UploadPartRequest,
    signal?: AbortSignal
  ): Promise<S3UploadPartResponse>;
  schema: z.ZodType<S3UploadPartRequest>;
}

export interface S3UploadPartCopyMethod {
  (
    req: S3UploadPartCopyRequest,
    signal?: AbortSignal
  ): Promise<S3UploadPartCopyResponse>;
  schema: z.ZodType<S3UploadPartCopyRequest>;
}

export interface S3CompleteMultipartUploadMethod {
  (
    req: S3CompleteMultipartUploadRequest,
    signal?: AbortSignal
  ): Promise<S3CompleteMultipartUploadResponse>;
  schema: z.ZodType<S3CompleteMultipartUploadRequest>;
}

export interface S3AbortMultipartUploadMethod {
  (
    req: S3AbortMultipartUploadRequest,
    signal?: AbortSignal
  ): Promise<S3AbortMultipartUploadResponse>;
  schema: z.ZodType<S3AbortMultipartUploadRequest>;
}

export interface S3ListPartsMethod {
  (req: S3ListPartsRequest, signal?: AbortSignal): Promise<S3ListPartsResponse>;
  schema: z.ZodType<S3ListPartsRequest>;
}

export interface S3ListMultipartUploadsMethod {
  (
    req: S3ListMultipartUploadsRequest,
    signal?: AbortSignal
  ): Promise<S3ListMultipartUploadsResponse>;
  schema: z.ZodType<S3ListMultipartUploadsRequest>;
}

export interface S3PresignedUrl {
  url: string;
  headers: Record<string, string>;
  expiresAt: string;
}

export interface S3PresignObjectMethod {
  (req: S3PresignObjectRequest): S3PresignedUrl;
  schema: z.ZodType<S3PresignObjectRequest>;
}

export interface S3BucketsNamespace {
  create: S3CreateBucketMethod;
  createMetadataConfiguration: S3CreateBucketMetadataConfigurationMethod;
  createSession: S3CreateSessionMethod;
  del: S3DeleteBucketMethod;
  delAnalytics: S3DeleteBucketConfigWithIdMethod;
  delCors: S3DeleteBucketConfigMethod;
  delEncryption: S3DeleteBucketConfigMethod;
  delInventory: S3DeleteBucketConfigWithIdMethod;
  delLifecycle: S3DeleteBucketConfigMethod;
  delMetadataConfiguration: S3DeleteBucketConfigMethod;
  delMetrics: S3DeleteBucketConfigWithIdMethod;
  delOwnershipControls: S3DeleteBucketConfigMethod;
  delPolicy: S3DeleteBucketConfigMethod;
  delPublicAccessBlock: S3DeleteBucketConfigMethod;
  delReplication: S3DeleteBucketConfigMethod;
  delTagging: S3DeleteBucketConfigMethod;
  delWebsite: S3DeleteBucketConfigMethod;
  getAnalytics: S3GetBucketConfigWithIdMethod;
  getCors: S3GetBucketConfigMethod;
  getEncryption: S3GetBucketConfigMethod;
  getInventory: S3GetBucketConfigWithIdMethod;
  getLifecycle: S3GetBucketConfigMethod;
  getLogging: S3GetBucketConfigMethod;
  getMetadataConfiguration: S3GetBucketConfigMethod;
  getMetrics: S3GetBucketConfigWithIdMethod;
  getNotification: S3GetBucketConfigMethod;
  getObjectLockConfiguration: S3GetObjectLockConfigurationMethod;
  getOwnershipControls: S3GetBucketConfigMethod;
  getPolicy: S3GetBucketPolicyMethod;
  getPublicAccessBlock: S3GetBucketConfigMethod;
  getReplication: S3GetBucketConfigMethod;
  getRequestPayment: S3GetBucketRequestPaymentMethod;
  getTagging: S3GetBucketTaggingMethod;
  getVersioning: S3GetBucketVersioningMethod;
  getWebsite: S3GetBucketConfigMethod;
  head: S3HeadBucketMethod;
  listAnalytics: S3ListBucketConfigsMethod;
  listDirectory: S3ListDirectoryBucketsMethod;
  listInventory: S3ListBucketConfigsMethod;
  list: S3ListBucketsMethod;
  listMetrics: S3ListBucketConfigsMethod;
  location: S3GetBucketLocationMethod;
  putAnalytics: S3PutBucketXmlConfigWithIdMethod;
  putCors: S3PutBucketXmlConfigMethod;
  putEncryption: S3PutBucketXmlConfigMethod;
  putInventory: S3PutBucketXmlConfigWithIdMethod;
  putLifecycle: S3PutBucketXmlConfigMethod;
  putLogging: S3PutBucketXmlConfigMethod;
  putMetrics: S3PutBucketXmlConfigWithIdMethod;
  putNotification: S3PutBucketXmlConfigMethod;
  putObjectLockConfiguration: S3PutObjectLockConfigurationMethod;
  putOwnershipControls: S3PutBucketXmlConfigMethod;
  putPolicy: S3PutBucketPolicyMethod;
  putPublicAccessBlock: S3PutBucketXmlConfigMethod;
  putReplication: S3PutBucketXmlConfigMethod;
  putRequestPayment: S3PutBucketRequestPaymentMethod;
  putTagging: S3PutBucketTaggingMethod;
  putVersioning: S3PutBucketVersioningMethod;
  putWebsite: S3PutBucketXmlConfigMethod;
  updateMetadataInventoryTable: S3UpdateBucketMetadataTableMethod;
  updateMetadataJournalTable: S3UpdateBucketMetadataTableMethod;
}

export interface S3ObjectsNamespace {
  abortMultipartUpload: S3AbortMultipartUploadMethod;
  completeMultipartUpload: S3CompleteMultipartUploadMethod;
  copy: S3CopyObjectMethod;
  createMultipartUpload: S3CreateMultipartUploadMethod;
  del: S3DeleteObjectMethod;
  delMany: S3DeleteObjectsMethod;
  delTagging: S3DeleteObjectTaggingMethod;
  get: S3GetObjectMethod;
  getAcl: S3GetObjectAclMethod;
  getAttributes: S3GetObjectAttributesMethod;
  getLegalHold: S3GetObjectLegalHoldMethod;
  getRetention: S3GetObjectRetentionMethod;
  getStream: S3GetObjectStreamMethod;
  getTagging: S3GetObjectTaggingMethod;
  getTorrent: S3GetObjectTorrentMethod;
  head: S3HeadObjectMethod;
  listMultipartUploads: S3ListMultipartUploadsMethod;
  listVersions: S3ListObjectVersionsMethod;
  list: S3ListObjectsV2Method;
  listParts: S3ListPartsMethod;
  put: S3PutObjectMethod;
  putAcl: S3PutObjectAclMethod;
  putLegalHold: S3PutObjectLegalHoldMethod;
  putRetention: S3PutObjectRetentionMethod;
  putTagging: S3PutObjectTaggingMethod;
  rename: S3RenameObjectMethod;
  restore: S3RestoreObjectMethod;
  selectContent: S3SelectObjectContentMethod;
  updateEncryption: S3UpdateObjectEncryptionMethod;
  uploadPart: S3UploadPartMethod;
  uploadPartCopy: S3UploadPartCopyMethod;
}

export interface S3ObjectLambdaNamespace {
  writeGetObjectResponse: S3WriteGetObjectResponseMethod;
}

export interface S3PresignNamespace {
  deleteObject: S3PresignObjectMethod;
  getObject: S3PresignObjectMethod;
  headObject: S3PresignObjectMethod;
  putObject: S3PresignObjectMethod;
}

export interface S3Provider {
  buckets: S3BucketsNamespace;
  objectLambda: S3ObjectLambdaNamespace;
  objects: S3ObjectsNamespace;
  presign: S3PresignNamespace;
}
