import type { z } from "zod";

export type {
  S3BucketRequest,
  S3CopyObjectRequest,
  S3CreateBucketRequest,
  S3DeleteObjectRequest,
  S3GetObjectRequest,
  S3HeadObjectRequest,
  S3ListBucketsRequest,
  S3ListObjectsV2Request,
  S3ObjectTaggingRequest,
  S3Options,
  S3PutObjectTaggingRequest,
  S3PutObjectRequest,
} from "./zod";

import type {
  S3BucketRequest,
  S3CopyObjectRequest,
  S3CreateBucketRequest,
  S3DeleteObjectRequest,
  S3GetObjectRequest,
  S3HeadObjectRequest,
  S3ListBucketsRequest,
  S3ListObjectsV2Request,
  S3ObjectTaggingRequest,
  S3PutObjectTaggingRequest,
  S3PutObjectRequest,
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

export interface S3BucketsNamespace {
  create: S3CreateBucketMethod;
  del: S3DeleteBucketMethod;
  head: S3HeadBucketMethod;
  list: S3ListBucketsMethod;
  location: S3GetBucketLocationMethod;
}

export interface S3ObjectsNamespace {
  copy: S3CopyObjectMethod;
  del: S3DeleteObjectMethod;
  delTagging: S3DeleteObjectTaggingMethod;
  get: S3GetObjectMethod;
  getTagging: S3GetObjectTaggingMethod;
  head: S3HeadObjectMethod;
  list: S3ListObjectsV2Method;
  put: S3PutObjectMethod;
  putTagging: S3PutObjectTaggingMethod;
}

export interface S3Provider {
  buckets: S3BucketsNamespace;
  objects: S3ObjectsNamespace;
}
