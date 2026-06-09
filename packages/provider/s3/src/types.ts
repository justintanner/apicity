import type { z } from "zod";

export type {
  S3AbortMultipartUploadRequest,
  S3BucketRequest,
  S3CompleteMultipartUploadRequest,
  S3CopyObjectRequest,
  S3CreateMultipartUploadRequest,
  S3CreateBucketRequest,
  S3DeleteObjectRequest,
  S3DeleteObjectsRequest,
  S3GetObjectRequest,
  S3GetBucketVersioningRequest,
  S3HeadObjectRequest,
  S3ListBucketsRequest,
  S3ListMultipartUploadsRequest,
  S3ListObjectVersionsRequest,
  S3ListObjectsV2Request,
  S3ListPartsRequest,
  S3ObjectTaggingRequest,
  S3Options,
  S3PutBucketVersioningRequest,
  S3PutObjectTaggingRequest,
  S3PutObjectRequest,
  S3UploadPartCopyRequest,
  S3UploadPartRequest,
} from "./zod";

import type {
  S3AbortMultipartUploadRequest,
  S3BucketRequest,
  S3CompleteMultipartUploadRequest,
  S3CopyObjectRequest,
  S3CreateMultipartUploadRequest,
  S3CreateBucketRequest,
  S3DeleteObjectRequest,
  S3DeleteObjectsRequest,
  S3GetBucketVersioningRequest,
  S3GetObjectRequest,
  S3HeadObjectRequest,
  S3ListBucketsRequest,
  S3ListMultipartUploadsRequest,
  S3ListObjectVersionsRequest,
  S3ListObjectsV2Request,
  S3ListPartsRequest,
  S3ObjectTaggingRequest,
  S3PutBucketVersioningRequest,
  S3PutObjectTaggingRequest,
  S3PutObjectRequest,
  S3UploadPartCopyRequest,
  S3UploadPartRequest,
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

export interface S3CreateBucketResponse {
  location?: string;
  headers: Record<string, string>;
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

export interface S3CreateBucketMethod {
  (
    req: S3CreateBucketRequest,
    signal?: AbortSignal
  ): Promise<S3CreateBucketResponse>;
  schema: z.ZodType<S3CreateBucketRequest>;
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

export interface S3BucketsNamespace {
  create: S3CreateBucketMethod;
  del: S3DeleteBucketMethod;
  getVersioning: S3GetBucketVersioningMethod;
  head: S3HeadBucketMethod;
  list: S3ListBucketsMethod;
  location: S3GetBucketLocationMethod;
  putVersioning: S3PutBucketVersioningMethod;
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
  getTagging: S3GetObjectTaggingMethod;
  head: S3HeadObjectMethod;
  listMultipartUploads: S3ListMultipartUploadsMethod;
  listVersions: S3ListObjectVersionsMethod;
  list: S3ListObjectsV2Method;
  listParts: S3ListPartsMethod;
  put: S3PutObjectMethod;
  putTagging: S3PutObjectTaggingMethod;
  uploadPart: S3UploadPartMethod;
  uploadPartCopy: S3UploadPartCopyMethod;
}

export interface S3Provider {
  buckets: S3BucketsNamespace;
  objects: S3ObjectsNamespace;
}
