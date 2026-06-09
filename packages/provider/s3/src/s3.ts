import { createHash, createHmac } from "node:crypto";

import { S3Error } from "./types";
import type {
  S3AbortMultipartUploadRequest,
  S3AbortMultipartUploadResponse,
  S3BucketConfigRequest,
  S3BucketConfigResponse,
  S3BucketConfigWithIdRequest,
  S3BucketConfigWithPayerRequest,
  S3BucketRequest,
  S3ChecksumFields,
  S3CompleteMultipartUploadRequest,
  S3CompleteMultipartUploadResponse,
  S3CopyObjectRequest,
  S3CopyObjectResponse,
  S3CreateMultipartUploadRequest,
  S3CreateMultipartUploadResponse,
  S3CreateBucketRequest,
  S3CreateBucketResponse,
  S3CreateSessionRequest,
  S3CreateSessionResponse,
  S3DeleteBucketResponse,
  S3DeleteObjectRequest,
  S3DeleteObjectResponse,
  S3DeleteObjectsRequest,
  S3DeleteObjectsResponse,
  S3GetBucketVersioningRequest,
  S3GetBucketVersioningResponse,
  S3DeleteObjectTaggingResponse,
  S3GetBucketAbacResponse,
  S3GetBucketAccelerateConfigurationResponse,
  S3GetBucketAclResponse,
  S3GetBucketConfigResponse,
  S3GetBucketLocationResponse,
  S3GetBucketPolicyStatusResponse,
  S3GetBucketPolicyResponse,
  S3GetBucketRequestPaymentResponse,
  S3GetBucketTaggingResponse,
  S3GetObjectRequest,
  S3GetObjectResponse,
  S3GetObjectStreamResponse,
  S3GetObjectAclResponse,
  S3GetObjectAttributesRequest,
  S3GetObjectLegalHoldResponse,
  S3GetObjectLockConfigurationResponse,
  S3GetObjectRetentionResponse,
  S3GetObjectTaggingResponse,
  S3GetObjectTorrentResponse,
  S3HeadBucketResponse,
  S3HeadObjectRequest,
  S3HeadObjectResponse,
  S3ListBucketConfigsRequest,
  S3ListBucketConfigsResponse,
  S3ListBucketsRequest,
  S3ListBucketsResponse,
  S3ListDirectoryBucketsRequest,
  S3ListDirectoryBucketsResponse,
  S3ListMultipartUploadsRequest,
  S3ListMultipartUploadsResponse,
  S3ListObjectVersionsRequest,
  S3ListObjectVersionsResponse,
  S3ListObjectsRequest,
  S3ListObjectsResponse,
  S3ListObjectsV2Request,
  S3ListObjectsV2Response,
  S3ListPartsRequest,
  S3ListPartsResponse,
  S3ObjectTaggingRequest,
  S3ObjectAclGrant,
  S3ObjectHeaders,
  S3ObjectSummary,
  S3ObjectAttributesResponse,
  S3ObjectConfigResponse,
  S3ObjectGovernanceRequest,
  S3Options,
  S3Provider,
  S3PutBucketAclRequest,
  S3PutBucketPolicyRequest,
  S3PutBucketMetadataConfigurationRequest,
  S3PutBucketRequestPaymentRequest,
  S3PutBucketTaggingRequest,
  S3PutBucketVersioningRequest,
  S3PutBucketVersioningResponse,
  S3PutBucketXmlConfigRequest,
  S3PutBucketXmlConfigWithIdRequest,
  S3PutObjectAclRequest,
  S3PutObjectLegalHoldRequest,
  S3PutObjectLockConfigurationRequest,
  S3PutObjectRetentionRequest,
  S3PutObjectTaggingRequest,
  S3PutObjectTaggingResponse,
  S3PutObjectRequest,
  S3PutObjectResponse,
  S3PresignObjectRequest,
  S3PresignedUrl,
  S3RenameObjectRequest,
  S3RenameObjectResponse,
  S3RestoreObjectRequest,
  S3RestoreObjectResponse,
  S3SelectObjectContentRequest,
  S3SelectObjectContentResponse,
  S3UpdateObjectEncryptionRequest,
  S3UpdateObjectEncryptionResponse,
  S3UploadPartCopyRequest,
  S3UploadPartCopyResponse,
  S3UploadPartRequest,
  S3UploadPartResponse,
  S3WriteGetObjectResponseRequest,
  S3WriteGetObjectResponseResult,
} from "./types";
import {
  S3AbortMultipartUploadRequestSchema,
  S3BucketConfigRequestSchema,
  S3BucketConfigWithIdRequestSchema,
  S3BucketConfigWithPayerRequestSchema,
  S3BucketRequestSchema,
  S3CompleteMultipartUploadRequestSchema,
  S3CopyObjectRequestSchema,
  S3CreateMultipartUploadRequestSchema,
  S3CreateBucketRequestSchema,
  S3CreateSessionRequestSchema,
  S3DeleteObjectRequestSchema,
  S3DeleteObjectsRequestSchema,
  S3GetBucketVersioningRequestSchema,
  S3GetObjectRequestSchema,
  S3GetObjectAttributesRequestSchema,
  S3HeadObjectRequestSchema,
  S3ListBucketConfigsRequestSchema,
  S3ListBucketsRequestSchema,
  S3ListDirectoryBucketsRequestSchema,
  S3ListMultipartUploadsRequestSchema,
  S3ListObjectVersionsRequestSchema,
  S3ListObjectsRequestSchema,
  S3ListObjectsV2RequestSchema,
  S3ListPartsRequestSchema,
  S3ObjectGovernanceRequestSchema,
  S3ObjectTaggingRequestSchema,
  S3PutBucketAclRequestSchema,
  S3PutBucketPolicyRequestSchema,
  S3PutBucketMetadataConfigurationRequestSchema,
  S3PutBucketRequestPaymentRequestSchema,
  S3PutBucketTaggingRequestSchema,
  S3PutBucketVersioningRequestSchema,
  S3PutBucketXmlConfigRequestSchema,
  S3PutBucketXmlConfigWithIdRequestSchema,
  S3PutObjectAclRequestSchema,
  S3PutObjectLegalHoldRequestSchema,
  S3PutObjectLockConfigurationRequestSchema,
  S3PutObjectRetentionRequestSchema,
  S3PutObjectTaggingRequestSchema,
  S3PutObjectRequestSchema,
  S3PresignObjectRequestSchema,
  S3RenameObjectRequestSchema,
  S3RestoreObjectRequestSchema,
  S3SelectObjectContentRequestSchema,
  S3UpdateObjectEncryptionRequestSchema,
  S3UploadPartCopyRequestSchema,
  S3UploadPartRequestSchema,
  S3WriteGetObjectResponseRequestSchema,
} from "./zod";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD";

interface SignedRequestConfig {
  baseOverride?: string;
  bucket?: string;
  body?: string | Blob | ArrayBuffer | Uint8Array;
  headers?: Record<string, string>;
  signingRegion?: string;
  signingService?: string;
}

interface ParsedS3Error {
  code?: string;
  message?: string;
  requestId?: string;
  hostId?: string;
  rawBody: string;
}

const EMPTY_HASH = sha256Hex(new Uint8Array());

function endpointForRegion(region: string, usEastOneBaseURL: string): string {
  if (region === "us-east-1") return usEastOneBaseURL;
  return `https://s3.${region}.amazonaws.com`;
}

function attachAbortHandler(
  signal: AbortSignal,
  controller: AbortController
): void {
  if (signal.aborted) {
    controller.abort();
    return;
  }
  signal.addEventListener("abort", () => controller.abort(), { once: true });
}

function awsEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function encodeS3Key(key: string): string {
  return key.split("/").map(awsEncode).join("/");
}

function encodeCopySource(
  bucket: string,
  key: string,
  versionId: string | undefined
): string {
  const source = `/${awsEncode(bucket)}/${encodeS3Key(key)}`;
  const query = queryForVersion(versionId);
  return query ? `${source}${query}` : source;
}

function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
  joiner: "?" | "&" = "?"
): string {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined
  );
  if (entries.length === 0) return "";
  const query = entries
    .map(([key, value]) => `${awsEncode(key)}=${awsEncode(String(value))}`)
    .join("&");
  return `${joiner}${query}`;
}

function queryForVersion(versionId?: string): string {
  return buildQuery({ versionId });
}

async function bodyToBytes(
  body: string | Blob | ArrayBuffer | Uint8Array | undefined
): Promise<Uint8Array | undefined> {
  if (body === undefined) return undefined;
  if (typeof body === "string") return new TextEncoder().encode(body);
  if (body instanceof Uint8Array) return body;
  if (body instanceof ArrayBuffer) return new Uint8Array(body);
  return new Uint8Array(await body.arrayBuffer());
}

function sha256Hex(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function md5Base64(data: Uint8Array): string {
  return createHash("md5").update(data).digest("base64");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function signingKey(
  secretAccessKey: string,
  date: string,
  region: string,
  service: string
): Buffer {
  const kDate = hmac(`AWS4${secretAccessKey}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function formatAmzDate(date: Date): { amzDate: string; dateStamp: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
}

function normalizeHeaderValue(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function canonicalQuery(url: URL): string {
  const pairs: Array<[string, string]> = [];
  url.searchParams.forEach((value, key) => {
    pairs.push([key, value]);
  });
  pairs.sort(([ak, av], [bk, bv]) => {
    if (ak !== bk) return ak < bk ? -1 : 1;
    if (av !== bv) return av < bv ? -1 : 1;
    return 0;
  });
  return pairs
    .map(([key, value]) => `${awsEncode(key)}=${awsEncode(value)}`)
    .join("&");
}

function signHeaders(
  opts: S3Options,
  method: HttpMethod,
  url: URL,
  headers: Record<string, string>,
  payloadHash: string,
  now: Date,
  signingService = opts.signingService ?? "s3",
  signingRegion = opts.region
): Record<string, string> {
  const { amzDate, dateStamp } = formatAmzDate(now);
  const headersForSigning: Record<string, string> = {
    ...headers,
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  if (opts.sessionToken) {
    headersForSigning["x-amz-security-token"] = opts.sessionToken;
  }

  const canonicalHeaderValues: Record<string, string> = {};
  for (const [name, value] of Object.entries(headersForSigning)) {
    canonicalHeaderValues[name.toLowerCase()] = value;
  }

  const sortedHeaderNames = Object.keys(canonicalHeaderValues).sort();
  const canonicalHeaders = sortedHeaderNames
    .map(
      (name) => `${name}:${normalizeHeaderValue(canonicalHeaderValues[name])}\n`
    )
    .join("");
  const signedHeaders = sortedHeaderNames.join(";");
  const canonicalRequest = [
    method,
    url.pathname || "/",
    canonicalQuery(url),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/${signingRegion}/${signingService}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(new TextEncoder().encode(canonicalRequest)),
  ].join("\n");
  const signature = createHmac(
    "sha256",
    signingKey(opts.secretAccessKey, dateStamp, signingRegion, signingService)
  )
    .update(stringToSign, "utf8")
    .digest("hex");
  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${opts.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  const finalHeaders: Record<string, string> = {
    ...headers,
    Authorization: authorization,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (opts.sessionToken) {
    finalHeaders["x-amz-security-token"] = opts.sessionToken;
  }
  return finalHeaders;
}

function isLocalOrIpHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) ||
    hostname.includes(":")
  );
}

function shouldUsePathStyle(
  endpoint: URL,
  bucket: string | undefined,
  forcePathStyle: boolean | undefined
): boolean {
  if (!bucket) return true;
  if (forcePathStyle !== undefined) return forcePathStyle;
  if (bucket.includes(".")) return true;
  if (isLocalOrIpHost(endpoint.hostname)) return true;
  return !endpoint.hostname.endsWith("amazonaws.com");
}

function buildRequestUrl(
  endpoint: string,
  pathStylePath: string,
  bucket: string | undefined,
  forcePathStyle: boolean | undefined
): URL {
  if (/^https?:\/\//i.test(pathStylePath)) {
    return new URL(pathStylePath);
  }

  const url = new URL(endpoint);
  const [rawPath = "/", rawQuery = ""] = pathStylePath.split("?");
  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

  if (shouldUsePathStyle(url, bucket, forcePathStyle)) {
    url.pathname = path;
  } else if (bucket) {
    const bucketPrefix = `/${awsEncode(bucket)}`;
    url.hostname = `${bucket}.${url.hostname}`;
    if (path === bucketPrefix) {
      url.pathname = "/";
    } else if (path.startsWith(`${bucketPrefix}/`)) {
      url.pathname = path.slice(bucketPrefix.length);
    } else {
      url.pathname = path;
    }
  } else {
    url.pathname = path;
  }

  url.search = rawQuery ? `?${rawQuery}` : "";
  return url;
}

function collectHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

function getHeader(headers: Headers, name: string): string | undefined {
  return headers.get(name) ?? undefined;
}

function numberHeader(headers: Headers, name: string): number | undefined {
  const value = headers.get(name);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function booleanHeader(headers: Headers, name: string): boolean | undefined {
  const value = headers.get(name);
  if (value === null) return undefined;
  return value === "true";
}

function metadataHeaders(headers: Headers): Record<string, string> {
  const metadata: Record<string, string> = {};
  headers.forEach((value, key) => {
    if (key.toLowerCase().startsWith("x-amz-meta-")) {
      metadata[key.slice("x-amz-meta-".length)] = value;
    }
  });
  return metadata;
}

function objectHeaders(res: Response): S3ObjectHeaders {
  return {
    acceptRanges: getHeader(res.headers, "accept-ranges"),
    cacheControl: getHeader(res.headers, "cache-control"),
    contentDisposition: getHeader(res.headers, "content-disposition"),
    contentEncoding: getHeader(res.headers, "content-encoding"),
    contentLanguage: getHeader(res.headers, "content-language"),
    contentLength: numberHeader(res.headers, "content-length"),
    contentRange: getHeader(res.headers, "content-range"),
    contentType: getHeader(res.headers, "content-type"),
    eTag: getHeader(res.headers, "etag"),
    expires: getHeader(res.headers, "expires"),
    lastModified: getHeader(res.headers, "last-modified"),
    storageClass: getHeader(res.headers, "x-amz-storage-class"),
    versionId: getHeader(res.headers, "x-amz-version-id"),
    metadata: metadataHeaders(res.headers),
    headers: collectHeaders(res.headers),
  };
}

function decodeXml(text: string | undefined): string | undefined {
  if (text === undefined) return undefined;
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function xmlTagPattern(tag: string): string {
  return `(?:[A-Za-z_][\\w.-]*:)?${escapeRegExp(tag)}`;
}

function textOf(xml: string, tag: string): string | undefined {
  const tagPattern = xmlTagPattern(tag);
  const match = xml.match(
    new RegExp(`<${tagPattern}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagPattern}>`)
  );
  return decodeXml(match?.[1]);
}

function numberOf(xml: string, tag: string): number | undefined {
  const text = textOf(xml, tag);
  if (text === undefined) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function boolOf(xml: string, tag: string): boolean | undefined {
  const text = textOf(xml, tag);
  if (text === undefined) return undefined;
  return text.toLowerCase() === "true";
}

function blocksOf(xml: string, tag: string): string[] {
  const blocks: string[] = [];
  const tagPattern = xmlTagPattern(tag);
  const regex = new RegExp(
    `<${tagPattern}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagPattern}>`,
    "g"
  );
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

function textsOf(xml: string, tag: string): string[] {
  return blocksOf(xml, tag).flatMap((text) => {
    const decoded = decodeXml(text);
    return decoded === undefined ? [] : [decoded];
  });
}

function parseOwner(xml: string): { id?: string; displayName?: string } {
  return {
    id: textOf(xml, "ID"),
    displayName: textOf(xml, "DisplayName"),
  };
}

function parseS3Error(xml: string): ParsedS3Error {
  return {
    code: textOf(xml, "Code"),
    message: textOf(xml, "Message"),
    requestId: textOf(xml, "RequestId") ?? textOf(xml, "RequestID"),
    hostId: textOf(xml, "HostId"),
    rawBody: xml,
  };
}

function parseListBuckets(xml: string): S3ListBucketsResponse {
  const ownerBlock = blocksOf(xml, "Owner")[0];
  const owner = ownerBlock ? parseOwner(ownerBlock) : undefined;
  const buckets = blocksOf(xml, "Bucket").map((block) => ({
    name: textOf(block, "Name") ?? "",
    creationDate: textOf(block, "CreationDate"),
  }));
  return { buckets, owner, rawXml: xml };
}

function parseListDirectoryBuckets(
  xml: string
): S3ListDirectoryBucketsResponse {
  return {
    buckets: blocksOf(xml, "Bucket").map((block) => ({
      bucketArn: textOf(block, "BucketArn"),
      bucketRegion: textOf(block, "BucketRegion"),
      creationDate: textOf(block, "CreationDate"),
      name: textOf(block, "Name") ?? "",
    })),
    continuationToken: textOf(xml, "ContinuationToken"),
    rawXml: xml,
  };
}

function parseCreateSession(
  xml: string,
  headers: Headers
): S3CreateSessionResponse {
  const credentialsBlock = blocksOf(xml, "Credentials")[0] ?? "";
  return {
    credentials: credentialsBlock
      ? {
          accessKeyId: textOf(credentialsBlock, "AccessKeyId"),
          secretAccessKey: textOf(credentialsBlock, "SecretAccessKey"),
          sessionToken: textOf(credentialsBlock, "SessionToken"),
          expiration: textOf(credentialsBlock, "Expiration"),
        }
      : undefined,
    rawXml: xml,
    headers: collectHeaders(headers),
  };
}

function parseListObjectsV2(xml: string): S3ListObjectsV2Response {
  return {
    name: textOf(xml, "Name"),
    prefix: textOf(xml, "Prefix"),
    delimiter: textOf(xml, "Delimiter"),
    keyCount: numberOf(xml, "KeyCount"),
    maxKeys: numberOf(xml, "MaxKeys"),
    isTruncated: boolOf(xml, "IsTruncated") ?? false,
    nextContinuationToken: textOf(xml, "NextContinuationToken"),
    contents: blocksOf(xml, "Contents").map((block) => {
      const ownerBlock = blocksOf(block, "Owner")[0];
      return {
        key: textOf(block, "Key") ?? "",
        lastModified: textOf(block, "LastModified"),
        eTag: textOf(block, "ETag"),
        size: numberOf(block, "Size"),
        storageClass: textOf(block, "StorageClass"),
        owner: ownerBlock ? parseOwner(ownerBlock) : undefined,
      };
    }),
    commonPrefixes: blocksOf(xml, "CommonPrefixes").map((block) => ({
      prefix: textOf(block, "Prefix") ?? "",
    })),
    rawXml: xml,
  };
}

function parseObjectSummary(block: string): S3ObjectSummary {
  const ownerBlock = blocksOf(block, "Owner")[0];
  return {
    key: textOf(block, "Key") ?? "",
    lastModified: textOf(block, "LastModified"),
    eTag: textOf(block, "ETag"),
    size: numberOf(block, "Size"),
    storageClass: textOf(block, "StorageClass"),
    owner: ownerBlock ? parseOwner(ownerBlock) : undefined,
  };
}

function parseListObjects(
  xml: string,
  headers: Headers
): S3ListObjectsResponse {
  return {
    name: textOf(xml, "Name"),
    prefix: textOf(xml, "Prefix"),
    delimiter: textOf(xml, "Delimiter"),
    marker: textOf(xml, "Marker"),
    nextMarker: textOf(xml, "NextMarker"),
    maxKeys: numberOf(xml, "MaxKeys"),
    encodingType: textOf(xml, "EncodingType"),
    isTruncated: boolOf(xml, "IsTruncated") ?? false,
    contents: blocksOf(xml, "Contents").map(parseObjectSummary),
    commonPrefixes: blocksOf(xml, "CommonPrefixes").map((block) => ({
      prefix: textOf(block, "Prefix") ?? "",
    })),
    requestCharged: getHeader(headers, "x-amz-request-charged"),
    rawXml: xml,
  };
}

function parseRestoreStatus(xml: string): {
  isRestoreInProgress?: boolean;
  restoreExpiryDate?: string;
} {
  return {
    isRestoreInProgress: boolOf(xml, "IsRestoreInProgress"),
    restoreExpiryDate: textOf(xml, "RestoreExpiryDate"),
  };
}

function parseListObjectVersions(
  xml: string,
  headers: Headers
): S3ListObjectVersionsResponse {
  return {
    name: textOf(xml, "Name"),
    prefix: textOf(xml, "Prefix"),
    delimiter: textOf(xml, "Delimiter"),
    keyMarker: textOf(xml, "KeyMarker"),
    versionIdMarker: textOf(xml, "VersionIdMarker"),
    nextKeyMarker: textOf(xml, "NextKeyMarker"),
    nextVersionIdMarker: textOf(xml, "NextVersionIdMarker"),
    maxKeys: numberOf(xml, "MaxKeys"),
    encodingType: textOf(xml, "EncodingType"),
    isTruncated: boolOf(xml, "IsTruncated") ?? false,
    versions: blocksOf(xml, "Version").map((block) => {
      const ownerBlock = blocksOf(block, "Owner")[0];
      const restoreBlock = blocksOf(block, "RestoreStatus")[0];
      return {
        ...checksumFieldsFromXml(block),
        key: textOf(block, "Key") ?? "",
        versionId: textOf(block, "VersionId"),
        isLatest: boolOf(block, "IsLatest"),
        lastModified: textOf(block, "LastModified"),
        eTag: textOf(block, "ETag"),
        size: numberOf(block, "Size"),
        storageClass: textOf(block, "StorageClass"),
        owner: ownerBlock ? parseOwner(ownerBlock) : undefined,
        restoreStatus: restoreBlock
          ? parseRestoreStatus(restoreBlock)
          : undefined,
      };
    }),
    deleteMarkers: blocksOf(xml, "DeleteMarker").map((block) => {
      const ownerBlock = blocksOf(block, "Owner")[0];
      return {
        key: textOf(block, "Key") ?? "",
        versionId: textOf(block, "VersionId"),
        isLatest: boolOf(block, "IsLatest"),
        lastModified: textOf(block, "LastModified"),
        owner: ownerBlock ? parseOwner(ownerBlock) : undefined,
      };
    }),
    commonPrefixes: blocksOf(xml, "CommonPrefixes").map((block) => ({
      prefix: textOf(block, "Prefix") ?? "",
    })),
    requestCharged: getHeader(headers, "x-amz-request-charged"),
    rawXml: xml,
  };
}

function parseBucketLocation(xml: string): S3GetBucketLocationResponse {
  const locationConstraint = textOf(xml, "LocationConstraint");
  return {
    locationConstraint:
      locationConstraint && locationConstraint.length > 0
        ? locationConstraint
        : undefined,
    rawXml: xml,
  };
}

function parseBucketVersioning(xml: string): S3GetBucketVersioningResponse {
  return {
    status: textOf(xml, "Status"),
    mfaDelete: textOf(xml, "MfaDelete"),
    rawXml: xml,
  };
}

function bucketConfigResponse(res: Response): S3BucketConfigResponse {
  return { headers: collectHeaders(res.headers) };
}

function bucketXmlConfigResponse(
  xml: string,
  headers: Headers
): S3GetBucketConfigResponse {
  return {
    rawXml: xml,
    headers: collectHeaders(headers),
  };
}

function parseBucketTagging(
  xml: string,
  headers: Headers
): S3GetBucketTaggingResponse {
  return {
    ...bucketXmlConfigResponse(xml, headers),
    tagSet: blocksOf(xml, "Tag").map((block) => ({
      key: textOf(block, "Key") ?? "",
      value: textOf(block, "Value") ?? "",
    })),
  };
}

function parseBucketRequestPayment(
  xml: string,
  headers: Headers
): S3GetBucketRequestPaymentResponse {
  return {
    ...bucketXmlConfigResponse(xml, headers),
    payer: textOf(xml, "Payer"),
  };
}

function parseBucketAbac(
  xml: string,
  headers: Headers
): S3GetBucketAbacResponse {
  return {
    ...bucketXmlConfigResponse(xml, headers),
    status: textOf(xml, "Status"),
  };
}

function parseBucketAccelerateConfiguration(
  xml: string,
  headers: Headers
): S3GetBucketAccelerateConfigurationResponse {
  return {
    ...bucketXmlConfigResponse(xml, headers),
    status: textOf(xml, "Status"),
  };
}

function parseBucketPolicyStatus(
  xml: string,
  headers: Headers
): S3GetBucketPolicyStatusResponse {
  return {
    ...bucketXmlConfigResponse(xml, headers),
    isPublic: boolOf(xml, "IsPublic"),
  };
}

function parseBucketPolicy(
  policy: string,
  headers: Headers
): S3GetBucketPolicyResponse {
  return {
    policy,
    headers: collectHeaders(headers),
  };
}

function parseCopyObject(xml: string, headers: Headers): S3CopyObjectResponse {
  return {
    eTag: textOf(xml, "ETag"),
    lastModified: textOf(xml, "LastModified"),
    checksumCRC32: textOf(xml, "ChecksumCRC32"),
    checksumCRC32C: textOf(xml, "ChecksumCRC32C"),
    checksumCRC64NVME: textOf(xml, "ChecksumCRC64NVME"),
    checksumSHA1: textOf(xml, "ChecksumSHA1"),
    checksumSHA256: textOf(xml, "ChecksumSHA256"),
    checksumSHA512: textOf(xml, "ChecksumSHA512"),
    checksumMD5: textOf(xml, "ChecksumMD5"),
    checksumType: textOf(xml, "ChecksumType"),
    versionId: getHeader(headers, "x-amz-version-id"),
    copySourceVersionId: getHeader(headers, "x-amz-copy-source-version-id"),
    serverSideEncryption: getHeader(headers, "x-amz-server-side-encryption"),
    requestCharged: getHeader(headers, "x-amz-request-charged"),
    rawXml: xml,
  };
}

function parseObjectTagging(
  xml: string,
  headers: Headers
): S3GetObjectTaggingResponse {
  return {
    tagSet: blocksOf(xml, "Tag").map((block) => ({
      key: textOf(block, "Key") ?? "",
      value: textOf(block, "Value") ?? "",
    })),
    versionId: getHeader(headers, "x-amz-version-id"),
    rawXml: xml,
  };
}

function objectConfigResponse(res: Response): S3ObjectConfigResponse {
  return {
    requestCharged: getHeader(res.headers, "x-amz-request-charged"),
    headers: collectHeaders(res.headers),
  };
}

function objectXmlConfigResponse(
  xml: string,
  headers: Headers
): S3ObjectConfigResponse & { rawXml: string; versionId?: string } {
  return {
    requestCharged: getHeader(headers, "x-amz-request-charged"),
    rawXml: xml,
    versionId: getHeader(headers, "x-amz-version-id"),
    headers: collectHeaders(headers),
  };
}

function granteeTypeOf(xml: string): string | undefined {
  return xml.match(/(?:xsi:)?type="([^"]+)"/)?.[1];
}

function parseAclGrants(xml: string): S3ObjectAclGrant[] {
  return blocksOf(xml, "Grant").map((block) => {
    const granteeBlock = blocksOf(block, "Grantee")[0] ?? "";
    return {
      grantee: {
        type: granteeTypeOf(block),
        id: textOf(granteeBlock, "ID"),
        displayName: textOf(granteeBlock, "DisplayName"),
        uri: textOf(granteeBlock, "URI"),
        emailAddress: textOf(granteeBlock, "EmailAddress"),
      },
      permission: textOf(block, "Permission"),
    };
  });
}

function parseBucketAcl(xml: string, headers: Headers): S3GetBucketAclResponse {
  const ownerBlock = blocksOf(xml, "Owner")[0];
  return {
    ...bucketXmlConfigResponse(xml, headers),
    owner: ownerBlock ? parseOwner(ownerBlock) : undefined,
    grants: parseAclGrants(xml),
  };
}

function parseObjectAcl(xml: string, headers: Headers): S3GetObjectAclResponse {
  const ownerBlock = blocksOf(xml, "Owner")[0];
  return {
    ...objectXmlConfigResponse(xml, headers),
    owner: ownerBlock ? parseOwner(ownerBlock) : undefined,
    grants: parseAclGrants(xml),
  };
}

function parseObjectAttributes(
  xml: string,
  headers: Headers
): S3ObjectAttributesResponse {
  return {
    ...checksumFieldsFromXml(xml),
    deleteMarker: booleanHeader(headers, "x-amz-delete-marker"),
    eTag: textOf(xml, "ETag"),
    lastModified: getHeader(headers, "last-modified"),
    objectParts: blocksOf(xml, "ObjectParts")[0],
    objectSize: numberOf(xml, "ObjectSize"),
    requestCharged: getHeader(headers, "x-amz-request-charged"),
    storageClass: textOf(xml, "StorageClass"),
    versionId: getHeader(headers, "x-amz-version-id"),
    rawXml: xml,
    headers: collectHeaders(headers),
  };
}

function parseObjectLegalHold(
  xml: string,
  headers: Headers
): S3GetObjectLegalHoldResponse {
  return {
    ...objectXmlConfigResponse(xml, headers),
    status: textOf(xml, "Status"),
  };
}

function parseObjectRetention(
  xml: string,
  headers: Headers
): S3GetObjectRetentionResponse {
  return {
    ...objectXmlConfigResponse(xml, headers),
    mode: textOf(xml, "Mode"),
    retainUntilDate: textOf(xml, "RetainUntilDate"),
  };
}

function parseObjectLockConfiguration(
  xml: string,
  headers: Headers
): S3GetObjectLockConfigurationResponse {
  return {
    ...bucketXmlConfigResponse(xml, headers),
    objectLockEnabled: textOf(xml, "ObjectLockEnabled"),
  };
}

function parseDeleteObjects(
  xml: string,
  headers: Headers
): S3DeleteObjectsResponse {
  return {
    deleted: blocksOf(xml, "Deleted").map((block) => ({
      key: textOf(block, "Key") ?? "",
      versionId: textOf(block, "VersionId"),
      deleteMarker: boolOf(block, "DeleteMarker"),
      deleteMarkerVersionId: textOf(block, "DeleteMarkerVersionId"),
    })),
    errors: blocksOf(xml, "Error").map((block) => ({
      key: textOf(block, "Key") ?? "",
      versionId: textOf(block, "VersionId"),
      code: textOf(block, "Code"),
      message: textOf(block, "Message"),
    })),
    requestCharged: getHeader(headers, "x-amz-request-charged"),
    rawXml: xml,
  };
}

function checksumFieldsFromXml(xml: string): S3ChecksumFields {
  return {
    checksumCRC32: textOf(xml, "ChecksumCRC32"),
    checksumCRC32C: textOf(xml, "ChecksumCRC32C"),
    checksumCRC64NVME: textOf(xml, "ChecksumCRC64NVME"),
    checksumMD5: textOf(xml, "ChecksumMD5"),
    checksumSHA1: textOf(xml, "ChecksumSHA1"),
    checksumSHA256: textOf(xml, "ChecksumSHA256"),
    checksumSHA512: textOf(xml, "ChecksumSHA512"),
    checksumType: textOf(xml, "ChecksumType"),
  };
}

function checksumFieldsFromHeaders(headers: Headers): S3ChecksumFields {
  return {
    checksumCRC32: getHeader(headers, "x-amz-checksum-crc32"),
    checksumCRC32C: getHeader(headers, "x-amz-checksum-crc32c"),
    checksumCRC64NVME: getHeader(headers, "x-amz-checksum-crc64nvme"),
    checksumMD5: getHeader(headers, "x-amz-checksum-md5"),
    checksumSHA1: getHeader(headers, "x-amz-checksum-sha1"),
    checksumSHA256: getHeader(headers, "x-amz-checksum-sha256"),
    checksumSHA512: getHeader(headers, "x-amz-checksum-sha512"),
    checksumType: getHeader(headers, "x-amz-checksum-type"),
  };
}

function parseCreateMultipartUpload(
  xml: string,
  headers: Headers
): S3CreateMultipartUploadResponse {
  return {
    ...checksumFieldsFromHeaders(headers),
    bucket: textOf(xml, "Bucket"),
    key: textOf(xml, "Key"),
    uploadId: textOf(xml, "UploadId") ?? "",
    abortDate: getHeader(headers, "x-amz-abort-date"),
    abortRuleId: getHeader(headers, "x-amz-abort-rule-id"),
    bucketKeyEnabled: booleanHeader(
      headers,
      "x-amz-server-side-encryption-bucket-key-enabled"
    ),
    requestCharged: getHeader(headers, "x-amz-request-charged"),
    serverSideEncryption: getHeader(headers, "x-amz-server-side-encryption"),
    sseKmsKeyId: getHeader(
      headers,
      "x-amz-server-side-encryption-aws-kms-key-id"
    ),
    rawXml: xml,
  };
}

function parseUploadPartCopy(
  xml: string,
  headers: Headers
): S3UploadPartCopyResponse {
  return {
    ...checksumFieldsFromXml(xml),
    eTag: textOf(xml, "ETag"),
    lastModified: textOf(xml, "LastModified"),
    requestCharged: getHeader(headers, "x-amz-request-charged"),
    rawXml: xml,
  };
}

function parseCompleteMultipartUpload(
  xml: string,
  headers: Headers
): S3CompleteMultipartUploadResponse {
  return {
    ...checksumFieldsFromXml(xml),
    location: textOf(xml, "Location"),
    bucket: textOf(xml, "Bucket"),
    key: textOf(xml, "Key"),
    eTag: textOf(xml, "ETag"),
    bucketKeyEnabled: booleanHeader(
      headers,
      "x-amz-server-side-encryption-bucket-key-enabled"
    ),
    expiration: getHeader(headers, "x-amz-expiration"),
    requestCharged: getHeader(headers, "x-amz-request-charged"),
    serverSideEncryption: getHeader(headers, "x-amz-server-side-encryption"),
    sseKmsKeyId: getHeader(
      headers,
      "x-amz-server-side-encryption-aws-kms-key-id"
    ),
    versionId: getHeader(headers, "x-amz-version-id"),
    rawXml: xml,
  };
}

function parseListParts(xml: string, headers: Headers): S3ListPartsResponse {
  const initiatorBlock = blocksOf(xml, "Initiator")[0];
  const ownerBlock = blocksOf(xml, "Owner")[0];
  return {
    bucket: textOf(xml, "Bucket"),
    key: textOf(xml, "Key"),
    uploadId: textOf(xml, "UploadId"),
    partNumberMarker: numberOf(xml, "PartNumberMarker"),
    nextPartNumberMarker: numberOf(xml, "NextPartNumberMarker"),
    maxParts: numberOf(xml, "MaxParts"),
    isTruncated: boolOf(xml, "IsTruncated") ?? false,
    initiator: initiatorBlock ? parseOwner(initiatorBlock) : undefined,
    owner: ownerBlock ? parseOwner(ownerBlock) : undefined,
    storageClass: textOf(xml, "StorageClass"),
    abortDate: getHeader(headers, "x-amz-abort-date"),
    abortRuleId: getHeader(headers, "x-amz-abort-rule-id"),
    requestCharged: getHeader(headers, "x-amz-request-charged"),
    parts: blocksOf(xml, "Part").map((block) => ({
      ...checksumFieldsFromXml(block),
      partNumber: numberOf(block, "PartNumber") ?? 0,
      lastModified: textOf(block, "LastModified"),
      eTag: textOf(block, "ETag"),
      size: numberOf(block, "Size"),
    })),
    rawXml: xml,
  };
}

function parseListMultipartUploads(
  xml: string,
  headers: Headers
): S3ListMultipartUploadsResponse {
  return {
    bucket: textOf(xml, "Bucket"),
    keyMarker: textOf(xml, "KeyMarker"),
    uploadIdMarker: textOf(xml, "UploadIdMarker"),
    nextKeyMarker: textOf(xml, "NextKeyMarker"),
    nextUploadIdMarker: textOf(xml, "NextUploadIdMarker"),
    delimiter: textOf(xml, "Delimiter"),
    prefix: textOf(xml, "Prefix"),
    encodingType: textOf(xml, "EncodingType"),
    maxUploads: numberOf(xml, "MaxUploads"),
    isTruncated: boolOf(xml, "IsTruncated") ?? false,
    requestCharged: getHeader(headers, "x-amz-request-charged"),
    uploads: blocksOf(xml, "Upload").map((block) => {
      const initiatorBlock = blocksOf(block, "Initiator")[0];
      const ownerBlock = blocksOf(block, "Owner")[0];
      return {
        key: textOf(block, "Key") ?? "",
        uploadId: textOf(block, "UploadId") ?? "",
        initiated: textOf(block, "Initiated"),
        initiator: initiatorBlock ? parseOwner(initiatorBlock) : undefined,
        owner: ownerBlock ? parseOwner(ownerBlock) : undefined,
        storageClass: textOf(block, "StorageClass"),
        checksumAlgorithms: textsOf(block, "ChecksumAlgorithm"),
        checksumType: textOf(block, "ChecksumType"),
      };
    }),
    commonPrefixes: blocksOf(xml, "CommonPrefixes").map((block) => ({
      prefix: textOf(block, "Prefix") ?? "",
    })),
    rawXml: xml,
  };
}

function bucketRequestHeaders(
  expectedBucketOwner: string | undefined
): Record<string, string> {
  if (!expectedBucketOwner) return {};
  return { "x-amz-expected-bucket-owner": expectedBucketOwner };
}

function bucketConfigHeaders(
  req: S3BucketConfigRequest
): Record<string, string> {
  return bucketRequestHeaders(req.expectedBucketOwner);
}

function bucketConfigWithPayerHeaders(
  req: S3BucketConfigWithPayerRequest
): Record<string, string> {
  const headers: Record<string, string> = {};
  addOwnerAndPayerHeaders(headers, req.expectedBucketOwner, req.requestPayer);
  return headers;
}

function bucketPutConfigHeaders(
  req: {
    checksumAlgorithm?: string;
    contentMD5?: string;
    expectedBucketOwner?: string;
  },
  body: string,
  contentType: string
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-MD5": req.contentMD5 ?? md5Base64(new TextEncoder().encode(body)),
    "Content-Type": contentType,
  };
  if (req.expectedBucketOwner) {
    headers["x-amz-expected-bucket-owner"] = req.expectedBucketOwner;
  }
  if (req.checksumAlgorithm) {
    headers["x-amz-sdk-checksum-algorithm"] = req.checksumAlgorithm;
  }
  return headers;
}

function directoryBucketZoneId(bucket: string): string | undefined {
  return bucket.match(/--([a-z0-9-]+)--x-s3$/i)?.[1];
}

function s3ExpressZonalBase(
  bucket: string,
  region: string,
  endpointOverride: string | undefined
): string {
  if (endpointOverride) return endpointOverride;
  const zoneId = directoryBucketZoneId(bucket);
  if (!zoneId) {
    throw new S3Error(
      "S3 Express directory bucket names must end with --zone-id--x-s3 when no endpoint override is configured.",
      400
    );
  }
  return `https://s3express-${zoneId}.${region}.amazonaws.com`;
}

function createSessionHeaders(
  req: S3CreateSessionRequest
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (req.sessionMode) {
    headers["x-amz-create-session-mode"] = req.sessionMode;
  }
  if (req.serverSideEncryption) {
    headers["x-amz-server-side-encryption"] = req.serverSideEncryption;
  }
  if (req.sseKmsKeyId) {
    headers["x-amz-server-side-encryption-aws-kms-key-id"] = req.sseKmsKeyId;
  }
  if (req.sseKmsEncryptionContext) {
    headers["x-amz-server-side-encryption-context"] =
      req.sseKmsEncryptionContext;
  }
  if (req.bucketKeyEnabled !== undefined) {
    headers["x-amz-server-side-encryption-bucket-key-enabled"] = String(
      req.bucketKeyEnabled
    );
  }
  return headers;
}

function renameObjectHeaders(
  req: S3RenameObjectRequest
): Record<string, string> {
  const headers: Record<string, string> = {
    "x-amz-rename-source": `/${encodeS3Key(req.sourceKey)}`,
  };
  if (req.clientToken) headers["x-amz-client-token"] = req.clientToken;
  if (req.s3SessionToken) {
    headers["x-amz-s3session-token"] = req.s3SessionToken;
  }
  if (req.destinationIfMatch) {
    headers["If-Match"] = req.destinationIfMatch;
  }
  if (req.destinationIfModifiedSince) {
    headers["If-Modified-Since"] = req.destinationIfModifiedSince;
  }
  if (req.destinationIfNoneMatch) {
    headers["If-None-Match"] = req.destinationIfNoneMatch;
  }
  if (req.destinationIfUnmodifiedSince) {
    headers["If-Unmodified-Since"] = req.destinationIfUnmodifiedSince;
  }
  if (req.sourceIfMatch) {
    headers["x-amz-rename-source-if-match"] = req.sourceIfMatch;
  }
  if (req.sourceIfModifiedSince) {
    headers["x-amz-rename-source-if-modified-since"] =
      req.sourceIfModifiedSince;
  }
  if (req.sourceIfNoneMatch) {
    headers["x-amz-rename-source-if-none-match"] = req.sourceIfNoneMatch;
  }
  if (req.sourceIfUnmodifiedSince) {
    headers["x-amz-rename-source-if-unmodified-since"] =
      req.sourceIfUnmodifiedSince;
  }
  return headers;
}

function addForwardedResponseHeaders(
  headers: Record<string, string>,
  req: S3WriteGetObjectResponseRequest
): void {
  headers["x-amz-request-route"] = req.requestRoute;
  headers["x-amz-request-token"] = req.requestToken;
  if (req.statusCode !== undefined) {
    headers["x-amz-fwd-status"] = String(req.statusCode);
  }
  if (req.errorCode) headers["x-amz-fwd-error-code"] = req.errorCode;
  if (req.errorMessage) {
    headers["x-amz-fwd-error-message"] = req.errorMessage;
  }
  for (const [name, value] of Object.entries(req.headers ?? {})) {
    const headerName = name.toLowerCase().startsWith("x-amz-fwd-")
      ? name
      : `x-amz-fwd-header-${name}`;
    headers[headerName] = value;
  }
  for (const [name, value] of Object.entries(req.metadata ?? {})) {
    headers[`x-amz-fwd-header-x-amz-meta-${name.toLowerCase()}`] = value;
  }
}

function objectGovernanceHeaders(
  req: S3ObjectGovernanceRequest
): Record<string, string> {
  const headers: Record<string, string> = {};
  addOwnerAndPayerHeaders(headers, req.expectedBucketOwner, req.requestPayer);
  return headers;
}

function objectPutConfigHeaders(
  req: {
    checksumAlgorithm?: string;
    contentMD5?: string;
    expectedBucketOwner?: string;
    requestPayer?: string;
  },
  body: string
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-MD5": req.contentMD5 ?? md5Base64(new TextEncoder().encode(body)),
    "Content-Type": "application/xml",
  };
  addOwnerAndPayerHeaders(headers, req.expectedBucketOwner, req.requestPayer);
  if (req.checksumAlgorithm) {
    headers["x-amz-sdk-checksum-algorithm"] = req.checksumAlgorithm;
  }
  return headers;
}

function addSseCustomerHeaders(
  headers: Record<string, string>,
  req: {
    sseCustomerAlgorithm?: string;
    sseCustomerKey?: string;
    sseCustomerKeyMD5?: string;
  }
): void {
  if (req.sseCustomerAlgorithm) {
    headers["x-amz-server-side-encryption-customer-algorithm"] =
      req.sseCustomerAlgorithm;
  }
  if (req.sseCustomerKey) {
    headers["x-amz-server-side-encryption-customer-key"] = req.sseCustomerKey;
  }
  if (req.sseCustomerKeyMD5) {
    headers["x-amz-server-side-encryption-customer-key-MD5"] =
      req.sseCustomerKeyMD5;
  }
}

function addOwnerAndPayerHeaders(
  headers: Record<string, string>,
  expectedBucketOwner: string | undefined,
  requestPayer: string | undefined
): void {
  if (expectedBucketOwner) {
    headers["x-amz-expected-bucket-owner"] = expectedBucketOwner;
  }
  if (requestPayer) {
    headers["x-amz-request-payer"] = requestPayer;
  }
}

function addObjectContentHeaders(
  headers: Record<string, string>,
  req: {
    cacheControl?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    contentLanguage?: string;
    contentType?: string;
  }
): void {
  if (req.contentType) headers["Content-Type"] = req.contentType;
  if (req.cacheControl) headers["Cache-Control"] = req.cacheControl;
  if (req.contentDisposition) {
    headers["Content-Disposition"] = req.contentDisposition;
  }
  if (req.contentEncoding) headers["Content-Encoding"] = req.contentEncoding;
  if (req.contentLanguage) headers["Content-Language"] = req.contentLanguage;
}

function addMetadataHeaders(
  headers: Record<string, string>,
  metadata: Record<string, string> | undefined
): void {
  for (const [name, value] of Object.entries(metadata ?? {})) {
    headers[`x-amz-meta-${name.toLowerCase()}`] = value;
  }
}

function addChecksumRequestHeaders(
  headers: Record<string, string>,
  req: S3ChecksumFields & {
    checksumAlgorithm?: string;
    contentMD5?: string;
  }
): void {
  if (req.contentMD5) headers["Content-MD5"] = req.contentMD5;
  if (req.checksumAlgorithm) {
    headers["x-amz-checksum-algorithm"] = req.checksumAlgorithm;
  }
  if (req.checksumCRC32) headers["x-amz-checksum-crc32"] = req.checksumCRC32;
  if (req.checksumCRC32C) {
    headers["x-amz-checksum-crc32c"] = req.checksumCRC32C;
  }
  if (req.checksumCRC64NVME) {
    headers["x-amz-checksum-crc64nvme"] = req.checksumCRC64NVME;
  }
  if (req.checksumMD5) headers["x-amz-checksum-md5"] = req.checksumMD5;
  if (req.checksumSHA1) headers["x-amz-checksum-sha1"] = req.checksumSHA1;
  if (req.checksumSHA256) {
    headers["x-amz-checksum-sha256"] = req.checksumSHA256;
  }
  if (req.checksumSHA512) {
    headers["x-amz-checksum-sha512"] = req.checksumSHA512;
  }
  if (req.checksumType) headers["x-amz-checksum-type"] = req.checksumType;
}

function presignQuery(req: S3PresignObjectRequest, method: HttpMethod): string {
  if (method !== "GET" && method !== "HEAD") {
    return queryForVersion(req.versionId);
  }
  return buildQuery({
    versionId: req.versionId,
    "response-cache-control": req.responseCacheControl,
    "response-content-disposition": req.responseContentDisposition,
    "response-content-encoding": req.responseContentEncoding,
    "response-content-language": req.responseContentLanguage,
    "response-content-type": req.responseContentType,
    "response-expires": req.responseExpires,
  });
}

function presignHeaders(
  req: S3PresignObjectRequest,
  method: HttpMethod
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (method === "GET" || method === "HEAD") {
    if (req.range) headers.Range = req.range;
    return headers;
  }
  if (method === "PUT") {
    addObjectContentHeaders(headers, req);
    if (req.storageClass) headers["x-amz-storage-class"] = req.storageClass;
    addMetadataHeaders(headers, req.metadata);
    addChecksumRequestHeaders(headers, req);
  }
  return headers;
}

function canonicalPresignHeaders(
  headers: Record<string, string>,
  url: URL
): { canonicalHeaders: string; signedHeaders: string } {
  const values: Record<string, string> = { host: url.host };
  for (const [name, value] of Object.entries(headers)) {
    values[name.toLowerCase()] = value;
  }
  const names = Object.keys(values).sort();
  return {
    canonicalHeaders: names
      .map((name) => `${name}:${normalizeHeaderValue(values[name])}\n`)
      .join(""),
    signedHeaders: names.join(";"),
  };
}

function createBucketBody(locationConstraint: string | undefined): string {
  if (!locationConstraint) return "";
  return [
    '<CreateBucketConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
    `<LocationConstraint>${xmlEscape(locationConstraint)}</LocationConstraint>`,
    "</CreateBucketConfiguration>",
  ].join("");
}

function createCompleteMultipartUploadBody(
  parts: S3CompleteMultipartUploadRequest["parts"]
): string {
  const body = parts
    .map((part) => {
      const fields = [
        ["ChecksumCRC32", part.checksumCRC32],
        ["ChecksumCRC32C", part.checksumCRC32C],
        ["ChecksumCRC64NVME", part.checksumCRC64NVME],
        ["ChecksumSHA1", part.checksumSHA1],
        ["ChecksumSHA256", part.checksumSHA256],
        ["ChecksumSHA512", part.checksumSHA512],
        ["ETag", part.eTag],
        ["PartNumber", String(part.partNumber)],
      ]
        .filter(([, value]) => value !== undefined)
        .map(([tag, value]) => `<${tag}>${xmlEscape(value ?? "")}</${tag}>`)
        .join("");
      return `<Part>${fields}</Part>`;
    })
    .join("");
  return [
    '<CompleteMultipartUpload xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
    body,
    "</CompleteMultipartUpload>",
  ].join("");
}

function createDeleteObjectsBody(req: S3DeleteObjectsRequest): string {
  const objects = req.objects
    .map((object) => {
      const fields = [
        ["ETag", object.eTag],
        ["Key", object.key],
        ["LastModifiedTime", object.lastModifiedTime],
        ["Size", object.size === undefined ? undefined : String(object.size)],
        ["VersionId", object.versionId],
      ]
        .filter(([, value]) => value !== undefined)
        .map(([tag, value]) => `<${tag}>${xmlEscape(value ?? "")}</${tag}>`)
        .join("");
      return `<Object>${fields}</Object>`;
    })
    .join("");
  const quiet =
    req.quiet === undefined ? "" : `<Quiet>${String(req.quiet)}</Quiet>`;
  return [
    '<Delete xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
    objects,
    quiet,
    "</Delete>",
  ].join("");
}

function createBucketVersioningBody(req: S3PutBucketVersioningRequest): string {
  const status = req.status ? `<Status>${xmlEscape(req.status)}</Status>` : "";
  const mfaDelete = req.mfaDelete
    ? `<MfaDelete>${xmlEscape(req.mfaDelete)}</MfaDelete>`
    : "";
  return [
    '<VersioningConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
    status,
    mfaDelete,
    "</VersioningConfiguration>",
  ].join("");
}

function createTaggingBody(
  tagSet: S3PutObjectTaggingRequest["tagSet"]
): string {
  const tags = tagSet
    .map((tag) =>
      [
        "<Tag>",
        `<Key>${xmlEscape(tag.key)}</Key>`,
        `<Value>${xmlEscape(tag.value)}</Value>`,
        "</Tag>",
      ].join("")
    )
    .join("");
  return [
    '<Tagging xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
    "<TagSet>",
    tags,
    "</TagSet>",
    "</Tagging>",
  ].join("");
}

function createRequestPaymentBody(
  req: S3PutBucketRequestPaymentRequest
): string {
  return [
    '<RequestPaymentConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
    `<Payer>${xmlEscape(req.payer)}</Payer>`,
    "</RequestPaymentConfiguration>",
  ].join("");
}

function createLegalHoldBody(req: S3PutObjectLegalHoldRequest): string {
  return [
    '<LegalHold xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
    `<Status>${xmlEscape(req.status)}</Status>`,
    "</LegalHold>",
  ].join("");
}

function createRetentionBody(req: S3PutObjectRetentionRequest): string {
  return [
    '<Retention xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
    `<Mode>${xmlEscape(req.mode)}</Mode>`,
    `<RetainUntilDate>${xmlEscape(req.retainUntilDate)}</RetainUntilDate>`,
    "</Retention>",
  ].join("");
}

function formatErrorMessage(status: number, parsed: ParsedS3Error): string {
  if (parsed.message && parsed.code) {
    return `S3 API error ${status} ${parsed.code}: ${parsed.message}`;
  }
  if (parsed.message) {
    return `S3 API error ${status}: ${parsed.message}`;
  }
  return `S3 API error: ${status}`;
}

export function createS3(opts: S3Options): S3Provider {
  const baseURL = "https://s3.us-east-1.amazonaws.com";
  const endpoint = (
    opts.endpoint ?? endpointForRegion(opts.region, baseURL)
  ).replace(/\/+$/, "");
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  function readErrorFromBody(res: Response, body: string): S3Error {
    const parsed = parseS3Error(body);
    return new S3Error(
      formatErrorMessage(res.status, parsed),
      res.status,
      body,
      parsed.code,
      parsed.requestId,
      parsed.hostId
    );
  }

  async function readError(res: Response): Promise<S3Error> {
    let body = "";
    try {
      body = await res.text();
    } catch {
      // ignore parse errors
    }
    return readErrorFromBody(res, body);
  }

  function shouldRetryWithBucketRegion(
    res: Response,
    config: SignedRequestConfig
  ): boolean {
    if (!config.bucket || config.baseOverride || opts.endpoint) return false;
    return res.status === 301 || res.status === 307 || res.status === 400;
  }

  async function makeSignedRequest(
    method: HttpMethod,
    path: string,
    config: SignedRequestConfig = {},
    signal?: AbortSignal
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const bodyBytes = await bodyToBytes(config.body);
      const payloadHash = bodyBytes ? sha256Hex(bodyBytes) : EMPTY_HASH;
      const send = async (
        requestEndpoint: string,
        signingRegion?: string
      ): Promise<Response> => {
        const url = buildRequestUrl(
          requestEndpoint,
          path,
          config.bucket,
          opts.forcePathStyle
        );
        const headers = signHeaders(
          opts,
          method,
          url,
          config.headers ?? {},
          payloadHash,
          new Date(),
          config.signingService,
          signingRegion ?? config.signingRegion
        );
        const init: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };
        if (bodyBytes) init.body = bodyBytes as BodyInit;
        return doFetch(url, init);
      };

      let res = await send(config.baseOverride ?? endpoint);
      if (!res.ok && shouldRetryWithBucketRegion(res, config)) {
        const redirectRegion = getHeader(res.headers, "x-amz-bucket-region");
        if (redirectRegion && redirectRegion !== opts.region) {
          res = await send(
            endpointForRegion(redirectRegion, baseURL),
            redirectRegion
          );
        }
      }

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw await readError(res);
      }

      return res;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof S3Error) throw error;
      throw new S3Error(`S3 request failed: ${error}`, 500);
    }
  }

  function presignObjectUrl(
    method: HttpMethod,
    req: S3PresignObjectRequest
  ): S3PresignedUrl {
    const expiresIn = req.expiresIn ?? 900;
    if (!Number.isInteger(expiresIn) || expiresIn < 1 || expiresIn > 604800) {
      throw new S3Error(
        "S3 presigned URLs require expiresIn from 1 to 604800 seconds.",
        400
      );
    }

    const bucket = awsEncode(req.bucket);
    const key = encodeS3Key(req.key);
    const url = buildRequestUrl(
      endpoint,
      `/${bucket}/${key}${presignQuery(req, method)}`,
      req.bucket,
      opts.forcePathStyle
    );
    const now = new Date();
    const { amzDate, dateStamp } = formatAmzDate(now);
    const signingService = opts.signingService ?? "s3";
    const credentialScope = `${dateStamp}/${opts.region}/${signingService}/aws4_request`;
    const headers = presignHeaders(req, method);
    const { canonicalHeaders, signedHeaders } = canonicalPresignHeaders(
      headers,
      url
    );

    url.searchParams.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
    url.searchParams.set(
      "X-Amz-Credential",
      `${opts.accessKeyId}/${credentialScope}`
    );
    url.searchParams.set("X-Amz-Date", amzDate);
    url.searchParams.set("X-Amz-Expires", String(expiresIn));
    url.searchParams.set("X-Amz-SignedHeaders", signedHeaders);
    if (opts.sessionToken) {
      url.searchParams.set("X-Amz-Security-Token", opts.sessionToken);
    }

    const canonicalRequest = [
      method,
      url.pathname || "/",
      canonicalQuery(url),
      canonicalHeaders,
      signedHeaders,
      "UNSIGNED-PAYLOAD",
    ].join("\n");
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      sha256Hex(new TextEncoder().encode(canonicalRequest)),
    ].join("\n");
    const signature = createHmac(
      "sha256",
      signingKey(opts.secretAccessKey, dateStamp, opts.region, signingService)
    )
      .update(stringToSign, "utf8")
      .digest("hex");
    url.searchParams.set("X-Amz-Signature", signature);

    return {
      expiresAt: new Date(now.getTime() + expiresIn * 1000).toISOString(),
      headers,
      url: url.toString(),
    };
  }

  // sig-ok: action namespace over S3 service root
  // GET https://s3.us-east-1.amazonaws.com/
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBuckets.html
  const bucketsList = Object.assign(
    async (
      _req?: S3ListBucketsRequest,
      signal?: AbortSignal
    ): Promise<S3ListBucketsResponse> => {
      const res = await makeSignedRequest("GET", "/", undefined, signal);
      return parseListBuckets(await res.text());
    },
    { schema: S3ListBucketsRequestSchema }
  );

  // sig-ok: action namespace over S3 Express control root
  // GET https://s3express-control.{param}.amazonaws.com/{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListDirectoryBuckets.html
  const bucketsListDirectory = Object.assign(
    async (
      req?: S3ListDirectoryBucketsRequest,
      signal?: AbortSignal
    ): Promise<S3ListDirectoryBucketsResponse> => {
      const params = req ?? {};
      const query = buildQuery({
        "continuation-token": params.continuationToken,
        "max-directory-buckets": params.maxDirectoryBuckets,
      });
      const res = await makeSignedRequest(
        "GET",
        `/${query}`,
        {
          baseOverride: `https://s3express-control.${opts.region}.amazonaws.com`,
          signingService: "s3express",
        },
        signal
      );
      return parseListDirectoryBuckets(await res.text());
    },
    { schema: S3ListDirectoryBucketsRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CreateBucket.html
  const bucketsCreate = Object.assign(
    async (
      req: S3CreateBucketRequest,
      signal?: AbortSignal
    ): Promise<S3CreateBucketResponse> => {
      const bucket = awsEncode(req.bucket);
      const locationConstraint =
        req.locationConstraint ??
        (opts.region === "us-east-1" ? undefined : opts.region);
      const body = createBucketBody(locationConstraint);
      const headers: Record<string, string> = {};
      if (body) headers["Content-Type"] = "application/xml";
      if (req.acl) headers["x-amz-acl"] = req.acl;
      if (req.objectOwnership) {
        headers["x-amz-object-ownership"] = req.objectOwnership;
      }
      if (req.objectLockEnabledForBucket !== undefined) {
        headers["x-amz-bucket-object-lock-enabled"] = String(
          req.objectLockEnabledForBucket
        );
      }
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}`,
        {
          bucket: req.bucket,
          body: body || undefined,
          headers,
        },
        signal
      );
      return {
        location: getHeader(res.headers, "location"),
        headers: collectHeaders(res.headers),
      };
    },
    { schema: S3CreateBucketRequestSchema }
  );

  // sig-ok: action namespace over S3 Express zonal bucket session path
  // GET https://s3express-{param}.{param}.amazonaws.com/{bucket}?session
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CreateSession.html
  const bucketsCreateSession = Object.assign(
    async (
      req: S3CreateSessionRequest,
      signal?: AbortSignal
    ): Promise<S3CreateSessionResponse> => {
      if (!opts.endpoint) {
        s3ExpressZonalBase(req.bucket, opts.region, opts.endpoint);
      }
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?session`,
        {
          bucket: req.bucket,
          baseOverride:
            opts.endpoint ??
            `https://s3express-${directoryBucketZoneId(req.bucket)}.${opts.region}.amazonaws.com`,
          headers: createSessionHeaders(req),
          signingService: "s3express",
        },
        signal
      );
      return parseCreateSession(await res.text(), res.headers);
    },
    { schema: S3CreateSessionRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucket.html
  const bucketsDel = Object.assign(
    async (
      req: S3BucketRequest,
      signal?: AbortSignal
    ): Promise<S3DeleteBucketResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}`,
        {
          bucket: req.bucket,
          headers: bucketRequestHeaders(req.expectedBucketOwner),
        },
        signal
      );
      return { headers: collectHeaders(res.headers) };
    },
    { schema: S3BucketRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket path
  // HEAD https://s3.us-east-1.amazonaws.com/{bucket}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadBucket.html
  const bucketsHead = Object.assign(
    async (
      req: S3BucketRequest,
      signal?: AbortSignal
    ): Promise<S3HeadBucketResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "HEAD",
        `/${bucket}`,
        {
          bucket: req.bucket,
          headers: bucketRequestHeaders(req.expectedBucketOwner),
        },
        signal
      );
      return {
        bucketArn: getHeader(res.headers, "x-amz-bucket-arn"),
        bucketLocationType: getHeader(
          res.headers,
          "x-amz-bucket-location-type"
        ),
        bucketLocationName: getHeader(
          res.headers,
          "x-amz-bucket-location-name"
        ),
        bucketRegion: getHeader(res.headers, "x-amz-bucket-region"),
        accessPointAlias: booleanHeader(
          res.headers,
          "x-amz-access-point-alias"
        ),
        headers: collectHeaders(res.headers),
      };
    },
    { schema: S3BucketRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket location path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?location
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketLocation.html
  const bucketsLocation = Object.assign(
    async (
      req: S3BucketRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketLocationResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?location`,
        {
          bucket: req.bucket,
          headers: bucketRequestHeaders(req.expectedBucketOwner),
        },
        signal
      );
      return parseBucketLocation(await res.text());
    },
    { schema: S3BucketRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket versioning path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?versioning
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketVersioning.html
  const bucketsGetVersioning = Object.assign(
    async (
      req: S3GetBucketVersioningRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketVersioningResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?versioning`,
        {
          bucket: req.bucket,
          headers: bucketRequestHeaders(req.expectedBucketOwner),
        },
        signal
      );
      return parseBucketVersioning(await res.text());
    },
    { schema: S3GetBucketVersioningRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket versioning path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?versioning
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketVersioning.html
  const bucketsPutVersioning = Object.assign(
    async (
      req: S3PutBucketVersioningRequest,
      signal?: AbortSignal
    ): Promise<S3PutBucketVersioningResponse> => {
      const bucket = awsEncode(req.bucket);
      const body = createBucketVersioningBody(req);
      const headers: Record<string, string> = {
        "Content-MD5":
          req.contentMD5 ?? md5Base64(new TextEncoder().encode(body)),
        "Content-Type": "application/xml",
      };
      if (req.expectedBucketOwner) {
        headers["x-amz-expected-bucket-owner"] = req.expectedBucketOwner;
      }
      if (req.checksumAlgorithm) {
        headers["x-amz-sdk-checksum-algorithm"] = req.checksumAlgorithm;
      }
      if (req.mfa) headers["x-amz-mfa"] = req.mfa;
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?versioning`,
        { bucket: req.bucket, body, headers },
        signal
      );
      return {
        requestCharged: getHeader(res.headers, "x-amz-request-charged"),
        headers: collectHeaders(res.headers),
      };
    },
    { schema: S3PutBucketVersioningRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket object lock path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?object-lock
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectLockConfiguration.html
  const bucketsGetObjectLockConfiguration = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetObjectLockConfigurationResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?object-lock`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return parseObjectLockConfiguration(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket object lock path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?object-lock
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObjectLockConfiguration.html
  const bucketsPutObjectLockConfiguration = Object.assign(
    async (
      req: S3PutObjectLockConfigurationRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const headers = objectPutConfigHeaders(req, req.body);
      if (req.objectLockToken) {
        headers["x-amz-bucket-object-lock-token"] = req.objectLockToken;
      }
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?object-lock`,
        { bucket: req.bucket, body: req.body, headers },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutObjectLockConfigurationRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket CORS path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?cors
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketCors.html
  const bucketsGetCors = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?cors`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket CORS path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?cors
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketCors.html
  const bucketsPutCors = Object.assign(
    async (
      req: S3PutBucketXmlConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?cors`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket CORS path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}?cors
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketCors.html
  const bucketsDelCors = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}?cors`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket lifecycle path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?lifecycle
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketLifecycleConfiguration.html
  const bucketsGetLifecycle = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?lifecycle`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket lifecycle path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?lifecycle
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketLifecycleConfiguration.html
  const bucketsPutLifecycle = Object.assign(
    async (
      req: S3PutBucketXmlConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?lifecycle`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket lifecycle path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?lifecycle
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketLifecycle.html
  const bucketsGetLifecycleLegacy = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?lifecycle`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket lifecycle path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?lifecycle
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketLifecycle.html
  const bucketsPutLifecycleLegacy = Object.assign(
    async (
      req: S3PutBucketXmlConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?lifecycle`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket lifecycle path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}?lifecycle
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketLifecycle.html
  const bucketsDelLifecycle = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}?lifecycle`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket encryption path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?encryption
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketEncryption.html
  const bucketsGetEncryption = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?encryption`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket encryption path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?encryption
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketEncryption.html
  const bucketsPutEncryption = Object.assign(
    async (
      req: S3PutBucketXmlConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?encryption`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket encryption path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}?encryption
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketEncryption.html
  const bucketsDelEncryption = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}?encryption`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket policy path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?policy
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketPolicy.html
  const bucketsGetPolicy = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketPolicyResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?policy`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return parseBucketPolicy(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket policy path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?policy
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketPolicy.html
  const bucketsPutPolicy = Object.assign(
    async (
      req: S3PutBucketPolicyRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const headers = bucketPutConfigHeaders(
        req,
        req.policy,
        "application/json"
      );
      if (req.confirmRemoveSelfBucketAccess !== undefined) {
        headers["x-amz-confirm-remove-self-bucket-access"] = String(
          req.confirmRemoveSelfBucketAccess
        );
      }
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?policy`,
        { bucket: req.bucket, body: req.policy, headers },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketPolicyRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket policy path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}?policy
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketPolicy.html
  const bucketsDelPolicy = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}?policy`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket policy status path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?policyStatus
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketPolicyStatus.html
  const bucketsGetPolicyStatus = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketPolicyStatusResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?policyStatus`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return parseBucketPolicyStatus(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket tagging path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?tagging
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketTagging.html
  const bucketsGetTagging = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketTaggingResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?tagging`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return parseBucketTagging(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket tagging path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?tagging
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketTagging.html
  const bucketsPutTagging = Object.assign(
    async (
      req: S3PutBucketTaggingRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const body = createTaggingBody(req.tagSet);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?tagging`,
        {
          bucket: req.bucket,
          body,
          headers: bucketPutConfigHeaders(req, body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketTaggingRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket tagging path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}?tagging
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketTagging.html
  const bucketsDelTagging = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}?tagging`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket public access block path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?publicAccessBlock
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetPublicAccessBlock.html
  const bucketsGetPublicAccessBlock = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?publicAccessBlock`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket public access block path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?publicAccessBlock
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutPublicAccessBlock.html
  const bucketsPutPublicAccessBlock = Object.assign(
    async (
      req: S3PutBucketXmlConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?publicAccessBlock`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket public access block path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}?publicAccessBlock
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeletePublicAccessBlock.html
  const bucketsDelPublicAccessBlock = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}?publicAccessBlock`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket ownership controls path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?ownershipControls
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketOwnershipControls.html
  const bucketsGetOwnershipControls = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?ownershipControls`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket ownership controls path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?ownershipControls
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketOwnershipControls.html
  const bucketsPutOwnershipControls = Object.assign(
    async (
      req: S3PutBucketXmlConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?ownershipControls`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket ownership controls path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}?ownershipControls
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketOwnershipControls.html
  const bucketsDelOwnershipControls = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}?ownershipControls`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket website path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?website
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketWebsite.html
  const bucketsGetWebsite = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?website`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket website path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?website
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketWebsite.html
  const bucketsPutWebsite = Object.assign(
    async (
      req: S3PutBucketXmlConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?website`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket website path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}?website
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketWebsite.html
  const bucketsDelWebsite = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}?website`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket logging path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?logging
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketLogging.html
  const bucketsGetLogging = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?logging`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket logging path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?logging
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketLogging.html
  const bucketsPutLogging = Object.assign(
    async (
      req: S3PutBucketXmlConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?logging`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket notification path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?notification
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketNotificationConfiguration.html
  const bucketsGetNotification = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?notification`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket notification path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?notification
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketNotificationConfiguration.html
  const bucketsPutNotification = Object.assign(
    async (
      req: S3PutBucketXmlConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?notification`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket notification path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?notification
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketNotification.html
  const bucketsGetNotificationLegacy = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?notification`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket notification path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?notification
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketNotification.html
  const bucketsPutNotificationLegacy = Object.assign(
    async (
      req: S3PutBucketXmlConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?notification`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket replication path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?replication
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketReplication.html
  const bucketsGetReplication = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?replication`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket replication path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?replication
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketReplication.html
  const bucketsPutReplication = Object.assign(
    async (
      req: S3PutBucketXmlConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?replication`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket replication path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}?replication
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketReplication.html
  const bucketsDelReplication = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}?replication`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket request payment path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?requestPayment
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketRequestPayment.html
  const bucketsGetRequestPayment = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketRequestPaymentResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?requestPayment`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return parseBucketRequestPayment(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket request payment path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?requestPayment
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketRequestPayment.html
  const bucketsPutRequestPayment = Object.assign(
    async (
      req: S3PutBucketRequestPaymentRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const body = createRequestPaymentBody(req);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?requestPayment`,
        {
          bucket: req.bucket,
          body,
          headers: bucketPutConfigHeaders(req, body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketRequestPaymentRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket ABAC path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?abac
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketAbac.html
  const bucketsGetAbac = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketAbacResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?abac`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return parseBucketAbac(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket ABAC path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?abac
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketAbac.html
  const bucketsPutAbac = Object.assign(
    async (
      req: S3PutBucketXmlConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?abac`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket accelerate path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?accelerate
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketAccelerateConfiguration.html
  const bucketsGetAccelerateConfiguration = Object.assign(
    async (
      req: S3BucketConfigWithPayerRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketAccelerateConfigurationResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?accelerate`,
        { bucket: req.bucket, headers: bucketConfigWithPayerHeaders(req) },
        signal
      );
      return parseBucketAccelerateConfiguration(await res.text(), res.headers);
    },
    { schema: S3BucketConfigWithPayerRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket accelerate path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?accelerate
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketAccelerateConfiguration.html
  const bucketsPutAccelerateConfiguration = Object.assign(
    async (
      req: S3PutBucketXmlConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?accelerate`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket ACL path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?acl
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketAcl.html
  const bucketsGetAcl = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketAclResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?acl`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return parseBucketAcl(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket ACL path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?acl
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketAcl.html
  const bucketsPutAcl = Object.assign(
    async (
      req: S3PutBucketAclRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const headers = bucketConfigHeaders(req);
      if (req.acl) headers["x-amz-acl"] = req.acl;
      if (req.grantFullControl) {
        headers["x-amz-grant-full-control"] = req.grantFullControl;
      }
      if (req.grantRead) headers["x-amz-grant-read"] = req.grantRead;
      if (req.grantReadAcp) {
        headers["x-amz-grant-read-acp"] = req.grantReadAcp;
      }
      if (req.grantWrite) headers["x-amz-grant-write"] = req.grantWrite;
      if (req.grantWriteAcp) {
        headers["x-amz-grant-write-acp"] = req.grantWriteAcp;
      }
      if (req.accessControlPolicy !== undefined) {
        headers["Content-MD5"] =
          req.contentMD5 ??
          md5Base64(new TextEncoder().encode(req.accessControlPolicy));
        headers["Content-Type"] = "application/xml";
      } else if (req.contentMD5) {
        headers["Content-MD5"] = req.contentMD5;
      }
      if (req.checksumAlgorithm) {
        headers["x-amz-sdk-checksum-algorithm"] = req.checksumAlgorithm;
      }
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?acl`,
        {
          bucket: req.bucket,
          body: req.accessControlPolicy,
          headers,
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketAclRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket metadata path
  // POST https://s3.us-east-1.amazonaws.com/{bucket}?metadataConfiguration
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CreateBucketMetadataConfiguration.html
  const bucketsCreateMetadataConfiguration = Object.assign(
    async (
      req: S3PutBucketMetadataConfigurationRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "POST",
        `/${bucket}?metadataConfiguration`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketMetadataConfigurationRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket metadata path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?metadataConfiguration
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketMetadataConfiguration.html
  const bucketsGetMetadataConfiguration = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?metadataConfiguration`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket metadata path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}?metadataConfiguration
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketMetadataConfiguration.html
  const bucketsDelMetadataConfiguration = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}?metadataConfiguration`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket metadata table path
  // POST https://s3.us-east-1.amazonaws.com/{bucket}?metadataTable
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CreateBucketMetadataTableConfiguration.html
  const bucketsCreateMetadataTableConfiguration = Object.assign(
    async (
      req: S3PutBucketMetadataConfigurationRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "POST",
        `/${bucket}?metadataTable`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketMetadataConfigurationRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket metadata table path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?metadataTable
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketMetadataTableConfiguration.html
  const bucketsGetMetadataTableConfiguration = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?metadataTable`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket metadata table path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}?metadataTable
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketMetadataTableConfiguration.html
  const bucketsDelMetadataTableConfiguration = Object.assign(
    async (
      req: S3BucketConfigRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}?metadataTable`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3BucketConfigRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket metadata inventory path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?metadataInventoryTable
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_UpdateBucketMetadataInventoryTableConfiguration.html
  const bucketsUpdateMetadataInventoryTable = Object.assign(
    async (
      req: S3PutBucketMetadataConfigurationRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?metadataInventoryTable`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketMetadataConfigurationRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket metadata journal path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?metadataJournalTable
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_UpdateBucketMetadataJournalTableConfiguration.html
  const bucketsUpdateMetadataJournalTable = Object.assign(
    async (
      req: S3PutBucketMetadataConfigurationRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?metadataJournalTable`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketMetadataConfigurationRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket intelligent-tiering path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?intelligent-tiering{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBucketIntelligentTieringConfigurations.html
  const bucketsListIntelligentTiering = Object.assign(
    async (
      req: S3ListBucketConfigsRequest,
      signal?: AbortSignal
    ): Promise<S3ListBucketConfigsResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery(
        { "continuation-token": req.continuationToken },
        "&"
      );
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?intelligent-tiering${query}`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3ListBucketConfigsRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket intelligent-tiering path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?intelligent-tiering{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketIntelligentTieringConfiguration.html
  const bucketsGetIntelligentTiering = Object.assign(
    async (
      req: S3BucketConfigWithIdRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery({ id: req.id }, "&");
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?intelligent-tiering${query}`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigWithIdRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket intelligent-tiering path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?intelligent-tiering{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketIntelligentTieringConfiguration.html
  const bucketsPutIntelligentTiering = Object.assign(
    async (
      req: S3PutBucketXmlConfigWithIdRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery({ id: req.id }, "&");
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?intelligent-tiering${query}`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigWithIdRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket intelligent-tiering path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}?intelligent-tiering{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketIntelligentTieringConfiguration.html
  const bucketsDelIntelligentTiering = Object.assign(
    async (
      req: S3BucketConfigWithIdRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery({ id: req.id }, "&");
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}?intelligent-tiering${query}`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3BucketConfigWithIdRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket metrics path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?metrics{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBucketMetricsConfigurations.html
  const bucketsListMetrics = Object.assign(
    async (
      req: S3ListBucketConfigsRequest,
      signal?: AbortSignal
    ): Promise<S3ListBucketConfigsResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery(
        { "continuation-token": req.continuationToken },
        "&"
      );
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?metrics${query}`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3ListBucketConfigsRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket metrics path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?metrics{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketMetricsConfiguration.html
  const bucketsGetMetrics = Object.assign(
    async (
      req: S3BucketConfigWithIdRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery({ id: req.id }, "&");
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?metrics${query}`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigWithIdRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket metrics path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?metrics{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketMetricsConfiguration.html
  const bucketsPutMetrics = Object.assign(
    async (
      req: S3PutBucketXmlConfigWithIdRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery({ id: req.id }, "&");
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?metrics${query}`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigWithIdRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket metrics path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}?metrics{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketMetricsConfiguration.html
  const bucketsDelMetrics = Object.assign(
    async (
      req: S3BucketConfigWithIdRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery({ id: req.id }, "&");
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}?metrics${query}`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3BucketConfigWithIdRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket inventory path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?inventory{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBucketInventoryConfigurations.html
  const bucketsListInventory = Object.assign(
    async (
      req: S3ListBucketConfigsRequest,
      signal?: AbortSignal
    ): Promise<S3ListBucketConfigsResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery(
        { "continuation-token": req.continuationToken },
        "&"
      );
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?inventory${query}`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3ListBucketConfigsRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket inventory path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?inventory{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketInventoryConfiguration.html
  const bucketsGetInventory = Object.assign(
    async (
      req: S3BucketConfigWithIdRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery({ id: req.id }, "&");
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?inventory${query}`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigWithIdRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket inventory path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?inventory{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketInventoryConfiguration.html
  const bucketsPutInventory = Object.assign(
    async (
      req: S3PutBucketXmlConfigWithIdRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery({ id: req.id }, "&");
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?inventory${query}`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigWithIdRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket inventory path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}?inventory{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketInventoryConfiguration.html
  const bucketsDelInventory = Object.assign(
    async (
      req: S3BucketConfigWithIdRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery({ id: req.id }, "&");
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}?inventory${query}`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3BucketConfigWithIdRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket analytics path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?analytics{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBucketAnalyticsConfigurations.html
  const bucketsListAnalytics = Object.assign(
    async (
      req: S3ListBucketConfigsRequest,
      signal?: AbortSignal
    ): Promise<S3ListBucketConfigsResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery(
        { "continuation-token": req.continuationToken },
        "&"
      );
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?analytics${query}`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3ListBucketConfigsRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket analytics path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?analytics{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketAnalyticsConfiguration.html
  const bucketsGetAnalytics = Object.assign(
    async (
      req: S3BucketConfigWithIdRequest,
      signal?: AbortSignal
    ): Promise<S3GetBucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery({ id: req.id }, "&");
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?analytics${query}`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketXmlConfigResponse(await res.text(), res.headers);
    },
    { schema: S3BucketConfigWithIdRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket analytics path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}?analytics{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketAnalyticsConfiguration.html
  const bucketsPutAnalytics = Object.assign(
    async (
      req: S3PutBucketXmlConfigWithIdRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery({ id: req.id }, "&");
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}?analytics${query}`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: bucketPutConfigHeaders(req, req.body, "application/xml"),
        },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3PutBucketXmlConfigWithIdRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket analytics path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}?analytics{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucketAnalyticsConfiguration.html
  const bucketsDelAnalytics = Object.assign(
    async (
      req: S3BucketConfigWithIdRequest,
      signal?: AbortSignal
    ): Promise<S3BucketConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery({ id: req.id }, "&");
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}?analytics${query}`,
        { bucket: req.bucket, headers: bucketConfigHeaders(req) },
        signal
      );
      return bucketConfigResponse(res);
    },
    { schema: S3BucketConfigWithIdRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjects.html
  const objectsListLegacy = Object.assign(
    async (
      req: S3ListObjectsRequest,
      signal?: AbortSignal
    ): Promise<S3ListObjectsResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery({
        delimiter: req.delimiter,
        "encoding-type": req.encodingType,
        marker: req.marker,
        "max-keys": req.maxKeys,
        prefix: req.prefix,
      });
      const headers: Record<string, string> = {};
      addOwnerAndPayerHeaders(
        headers,
        req.expectedBucketOwner,
        req.requestPayer
      );
      if (req.optionalObjectAttributes?.length) {
        headers["x-amz-optional-object-attributes"] =
          req.optionalObjectAttributes.join(",");
      }
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}${query}`,
        { bucket: req.bucket, headers },
        signal
      );
      return parseListObjects(await res.text(), res.headers);
    },
    { schema: S3ListObjectsRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?list-type=2{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html
  const objectsList = Object.assign(
    async (
      req: S3ListObjectsV2Request,
      signal?: AbortSignal
    ): Promise<S3ListObjectsV2Response> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery(
        {
          prefix: req.prefix,
          delimiter: req.delimiter,
          "continuation-token": req.continuationToken,
          "max-keys": req.maxKeys,
          "start-after": req.startAfter,
          "encoding-type": req.encodingType,
          "fetch-owner": req.fetchOwner,
        },
        "&"
      );
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?list-type=2${query}`,
        { bucket: req.bucket },
        signal
      );
      return parseListObjectsV2(await res.text());
    },
    { schema: S3ListObjectsV2RequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket versions path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?versions{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectVersions.html
  const objectsListVersions = Object.assign(
    async (
      req: S3ListObjectVersionsRequest,
      signal?: AbortSignal
    ): Promise<S3ListObjectVersionsResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery(
        {
          delimiter: req.delimiter,
          "encoding-type": req.encodingType,
          "key-marker": req.keyMarker,
          "max-keys": req.maxKeys,
          prefix: req.prefix,
          "version-id-marker": req.versionIdMarker,
        },
        "&"
      );
      const headers: Record<string, string> = {};
      addOwnerAndPayerHeaders(
        headers,
        req.expectedBucketOwner,
        req.requestPayer
      );
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?versions${query}`,
        { bucket: req.bucket, headers },
        signal
      );
      return parseListObjectVersions(await res.text(), res.headers);
    },
    { schema: S3ListObjectVersionsRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObject.html
  const objectsPut = Object.assign(
    async (
      req: S3PutObjectRequest,
      signal?: AbortSignal
    ): Promise<S3PutObjectResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const headers: Record<string, string> = {};
      const bodyType = req.body instanceof Blob ? req.body.type : undefined;
      const contentType = req.contentType ?? bodyType;
      addObjectContentHeaders(headers, { ...req, contentType });
      if (req.storageClass) headers["x-amz-storage-class"] = req.storageClass;
      addMetadataHeaders(headers, req.metadata);
      addChecksumRequestHeaders(headers, req);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}/${key}`,
        { bucket: req.bucket, body: req.body, headers },
        signal
      );
      return {
        eTag: getHeader(res.headers, "etag"),
        versionId: getHeader(res.headers, "x-amz-version-id"),
        serverSideEncryption: getHeader(
          res.headers,
          "x-amz-server-side-encryption"
        ),
        requestCharged: getHeader(res.headers, "x-amz-request-charged"),
      };
    },
    { schema: S3PutObjectRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CopyObject.html
  const objectsCopy = Object.assign(
    async (
      req: S3CopyObjectRequest,
      signal?: AbortSignal
    ): Promise<S3CopyObjectResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const headers: Record<string, string> = {
        "x-amz-copy-source": encodeCopySource(
          req.sourceBucket,
          req.sourceKey,
          req.sourceVersionId
        ),
      };
      addObjectContentHeaders(headers, req);
      const hasReplacementMetadata =
        req.contentType !== undefined ||
        req.cacheControl !== undefined ||
        req.contentDisposition !== undefined ||
        req.contentEncoding !== undefined ||
        req.contentLanguage !== undefined ||
        Object.keys(req.metadata ?? {}).length > 0;
      const metadataDirective =
        req.metadataDirective ??
        (hasReplacementMetadata ? "REPLACE" : undefined);
      if (metadataDirective) {
        headers["x-amz-metadata-directive"] = metadataDirective;
      }
      if (req.taggingDirective) {
        headers["x-amz-tagging-directive"] = req.taggingDirective;
      }
      if (req.storageClass) headers["x-amz-storage-class"] = req.storageClass;
      if (req.expectedBucketOwner) {
        headers["x-amz-expected-bucket-owner"] = req.expectedBucketOwner;
      }
      if (req.sourceExpectedBucketOwner) {
        headers["x-amz-source-expected-bucket-owner"] =
          req.sourceExpectedBucketOwner;
      }
      addMetadataHeaders(headers, req.metadata);
      if (req.checksumAlgorithm) {
        headers["x-amz-checksum-algorithm"] = req.checksumAlgorithm;
      }
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}/${key}`,
        { bucket: req.bucket, headers },
        signal
      );
      return parseCopyObject(await res.text(), res.headers);
    },
    { schema: S3CopyObjectRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 Express object rename path
  // PUT https://s3express-{param}.{param}.amazonaws.com/{bucket}/{key}?renameObject
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_RenameObject.html
  const objectsRename = Object.assign(
    async (
      req: S3RenameObjectRequest,
      signal?: AbortSignal
    ): Promise<S3RenameObjectResponse> => {
      if (!opts.endpoint) {
        s3ExpressZonalBase(req.bucket, opts.region, opts.endpoint);
      }
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}/${key}?renameObject`,
        {
          bucket: req.bucket,
          baseOverride:
            opts.endpoint ??
            `https://s3express-${directoryBucketZoneId(req.bucket)}.${opts.region}.amazonaws.com`,
          headers: renameObjectHeaders(req),
          signingService: "s3express",
        },
        signal
      );
      return objectConfigResponse(res);
    },
    { schema: S3RenameObjectRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html
  const objectsGet = Object.assign(
    async (
      req: S3GetObjectRequest,
      signal?: AbortSignal
    ): Promise<S3GetObjectResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const headers: Record<string, string> = {};
      if (req.range) headers.Range = req.range;
      const query = queryForVersion(req.versionId);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}/${key}${query}`,
        { bucket: req.bucket, headers },
        signal
      );
      return {
        ...objectHeaders(res),
        body: await res.arrayBuffer(),
      };
    },
    { schema: S3GetObjectRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html
  const objectsGetStream = Object.assign(
    async (
      req: S3GetObjectRequest,
      signal?: AbortSignal
    ): Promise<S3GetObjectStreamResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const headers: Record<string, string> = {};
      if (req.range) headers.Range = req.range;
      const query = queryForVersion(req.versionId);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}/${key}${query}`,
        { bucket: req.bucket, headers },
        signal
      );
      return {
        ...objectHeaders(res),
        body: res.body,
      };
    },
    { schema: S3GetObjectRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object path
  // HEAD https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html
  const objectsHead = Object.assign(
    async (
      req: S3HeadObjectRequest,
      signal?: AbortSignal
    ): Promise<S3HeadObjectResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const headers: Record<string, string> = {};
      if (req.range) headers.Range = req.range;
      const query = queryForVersion(req.versionId);
      const res = await makeSignedRequest(
        "HEAD",
        `/${bucket}/${key}${query}`,
        { bucket: req.bucket, headers },
        signal
      );
      return objectHeaders(res);
    },
    { schema: S3HeadObjectRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObject.html
  const objectsDel = Object.assign(
    async (
      req: S3DeleteObjectRequest,
      signal?: AbortSignal
    ): Promise<S3DeleteObjectResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = queryForVersion(req.versionId);
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}/${key}${query}`,
        { bucket: req.bucket },
        signal
      );
      return {
        deleteMarker: booleanHeader(res.headers, "x-amz-delete-marker"),
        versionId: getHeader(res.headers, "x-amz-version-id"),
        requestCharged: getHeader(res.headers, "x-amz-request-charged"),
      };
    },
    { schema: S3DeleteObjectRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket delete path
  // POST https://s3.us-east-1.amazonaws.com/{bucket}?delete
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObjects.html
  const objectsDelMany = Object.assign(
    async (
      req: S3DeleteObjectsRequest,
      signal?: AbortSignal
    ): Promise<S3DeleteObjectsResponse> => {
      const bucket = awsEncode(req.bucket);
      const body = createDeleteObjectsBody(req);
      const bodyBytes = new TextEncoder().encode(body);
      const headers: Record<string, string> = {
        "Content-MD5": req.contentMD5 ?? md5Base64(bodyBytes),
        "Content-Type": "application/xml",
      };
      addOwnerAndPayerHeaders(
        headers,
        req.expectedBucketOwner,
        req.requestPayer
      );
      if (req.bypassGovernanceRetention !== undefined) {
        headers["x-amz-bypass-governance-retention"] = String(
          req.bypassGovernanceRetention
        );
      }
      if (req.checksumAlgorithm) {
        headers["x-amz-sdk-checksum-algorithm"] = req.checksumAlgorithm;
      }
      if (req.mfa) headers["x-amz-mfa"] = req.mfa;
      const res = await makeSignedRequest(
        "POST",
        `/${bucket}?delete`,
        { bucket: req.bucket, body: bodyBytes, headers },
        signal
      );
      return parseDeleteObjects(await res.text(), res.headers);
    },
    { schema: S3DeleteObjectsRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object tagging path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}?tagging{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectTagging.html
  const objectsGetTagging = Object.assign(
    async (
      req: S3ObjectTaggingRequest,
      signal?: AbortSignal
    ): Promise<S3GetObjectTaggingResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery({ versionId: req.versionId }, "&");
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}/${key}?tagging${query}`,
        {
          bucket: req.bucket,
          headers: bucketRequestHeaders(req.expectedBucketOwner),
        },
        signal
      );
      return parseObjectTagging(await res.text(), res.headers);
    },
    { schema: S3ObjectTaggingRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object tagging path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}?tagging{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObjectTagging.html
  const objectsPutTagging = Object.assign(
    async (
      req: S3PutObjectTaggingRequest,
      signal?: AbortSignal
    ): Promise<S3PutObjectTaggingResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery({ versionId: req.versionId }, "&");
      const body = createTaggingBody(req.tagSet);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}/${key}?tagging${query}`,
        {
          bucket: req.bucket,
          body,
          headers: {
            "Content-Type": "application/xml",
            ...bucketRequestHeaders(req.expectedBucketOwner),
          },
        },
        signal
      );
      return {
        versionId: getHeader(res.headers, "x-amz-version-id"),
      };
    },
    { schema: S3PutObjectTaggingRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object tagging path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}/{key}?tagging{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObjectTagging.html
  const objectsDelTagging = Object.assign(
    async (
      req: S3ObjectTaggingRequest,
      signal?: AbortSignal
    ): Promise<S3DeleteObjectTaggingResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery({ versionId: req.versionId }, "&");
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}/${key}?tagging${query}`,
        {
          bucket: req.bucket,
          headers: bucketRequestHeaders(req.expectedBucketOwner),
        },
        signal
      );
      return {
        versionId: getHeader(res.headers, "x-amz-version-id"),
      };
    },
    { schema: S3ObjectTaggingRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object ACL path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}?acl{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectAcl.html
  const objectsGetAcl = Object.assign(
    async (
      req: S3ObjectGovernanceRequest,
      signal?: AbortSignal
    ): Promise<S3GetObjectAclResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery({ versionId: req.versionId }, "&");
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}/${key}?acl${query}`,
        { bucket: req.bucket, headers: objectGovernanceHeaders(req) },
        signal
      );
      return parseObjectAcl(await res.text(), res.headers);
    },
    { schema: S3ObjectGovernanceRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object ACL path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}?acl{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObjectAcl.html
  const objectsPutAcl = Object.assign(
    async (
      req: S3PutObjectAclRequest,
      signal?: AbortSignal
    ): Promise<S3ObjectConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery({ versionId: req.versionId }, "&");
      const headers = objectGovernanceHeaders(req);
      if (req.acl) headers["x-amz-acl"] = req.acl;
      if (req.grantFullControl) {
        headers["x-amz-grant-full-control"] = req.grantFullControl;
      }
      if (req.grantRead) headers["x-amz-grant-read"] = req.grantRead;
      if (req.grantReadAcp) {
        headers["x-amz-grant-read-acp"] = req.grantReadAcp;
      }
      if (req.grantWriteAcp) {
        headers["x-amz-grant-write-acp"] = req.grantWriteAcp;
      }
      if (req.accessControlPolicy !== undefined) {
        headers["Content-MD5"] =
          req.contentMD5 ??
          md5Base64(new TextEncoder().encode(req.accessControlPolicy));
        headers["Content-Type"] = "application/xml";
      } else if (req.contentMD5) {
        headers["Content-MD5"] = req.contentMD5;
      }
      if (req.checksumAlgorithm) {
        headers["x-amz-sdk-checksum-algorithm"] = req.checksumAlgorithm;
      }
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}/${key}?acl${query}`,
        {
          bucket: req.bucket,
          body: req.accessControlPolicy,
          headers,
        },
        signal
      );
      return objectConfigResponse(res);
    },
    { schema: S3PutObjectAclRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object attributes path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}?attributes{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectAttributes.html
  const objectsGetAttributes = Object.assign(
    async (
      req: S3GetObjectAttributesRequest,
      signal?: AbortSignal
    ): Promise<S3ObjectAttributesResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery(
        {
          versionId: req.versionId,
          "max-parts": req.maxParts,
          "part-number-marker": req.partNumberMarker,
        },
        "&"
      );
      const headers = objectGovernanceHeaders(req);
      headers["x-amz-object-attributes"] = req.objectAttributes.join(",");
      addSseCustomerHeaders(headers, req);
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}/${key}?attributes${query}`,
        { bucket: req.bucket, headers },
        signal
      );
      return parseObjectAttributes(await res.text(), res.headers);
    },
    { schema: S3GetObjectAttributesRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object restore path
  // POST https://s3.us-east-1.amazonaws.com/{bucket}/{key}?restore{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_RestoreObject.html
  const objectsRestore = Object.assign(
    async (
      req: S3RestoreObjectRequest,
      signal?: AbortSignal
    ): Promise<S3RestoreObjectResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery({ versionId: req.versionId }, "&");
      const headers = objectGovernanceHeaders(req);
      if (req.body !== undefined) {
        headers["Content-MD5"] =
          req.contentMD5 ?? md5Base64(new TextEncoder().encode(req.body));
        headers["Content-Type"] = "application/xml";
      } else if (req.contentMD5) {
        headers["Content-MD5"] = req.contentMD5;
      }
      if (req.checksumAlgorithm) {
        headers["x-amz-sdk-checksum-algorithm"] = req.checksumAlgorithm;
      }
      const res = await makeSignedRequest(
        "POST",
        `/${bucket}/${key}?restore${query}`,
        { bucket: req.bucket, body: req.body, headers },
        signal
      );
      return objectConfigResponse(res);
    },
    { schema: S3RestoreObjectRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object legal hold path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}?legal-hold{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectLegalHold.html
  const objectsGetLegalHold = Object.assign(
    async (
      req: S3ObjectGovernanceRequest,
      signal?: AbortSignal
    ): Promise<S3GetObjectLegalHoldResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery({ versionId: req.versionId }, "&");
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}/${key}?legal-hold${query}`,
        { bucket: req.bucket, headers: objectGovernanceHeaders(req) },
        signal
      );
      return parseObjectLegalHold(await res.text(), res.headers);
    },
    { schema: S3ObjectGovernanceRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object legal hold path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}?legal-hold{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObjectLegalHold.html
  const objectsPutLegalHold = Object.assign(
    async (
      req: S3PutObjectLegalHoldRequest,
      signal?: AbortSignal
    ): Promise<S3ObjectConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery({ versionId: req.versionId }, "&");
      const body = createLegalHoldBody(req);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}/${key}?legal-hold${query}`,
        {
          bucket: req.bucket,
          body,
          headers: objectPutConfigHeaders(req, body),
        },
        signal
      );
      return objectConfigResponse(res);
    },
    { schema: S3PutObjectLegalHoldRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object retention path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}?retention{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectRetention.html
  const objectsGetRetention = Object.assign(
    async (
      req: S3ObjectGovernanceRequest,
      signal?: AbortSignal
    ): Promise<S3GetObjectRetentionResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery({ versionId: req.versionId }, "&");
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}/${key}?retention${query}`,
        { bucket: req.bucket, headers: objectGovernanceHeaders(req) },
        signal
      );
      return parseObjectRetention(await res.text(), res.headers);
    },
    { schema: S3ObjectGovernanceRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object retention path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}?retention{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObjectRetention.html
  const objectsPutRetention = Object.assign(
    async (
      req: S3PutObjectRetentionRequest,
      signal?: AbortSignal
    ): Promise<S3ObjectConfigResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery({ versionId: req.versionId }, "&");
      const body = createRetentionBody(req);
      const headers = objectPutConfigHeaders(req, body);
      if (req.bypassGovernanceRetention !== undefined) {
        headers["x-amz-bypass-governance-retention"] = String(
          req.bypassGovernanceRetention
        );
      }
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}/${key}?retention${query}`,
        { bucket: req.bucket, body, headers },
        signal
      );
      return objectConfigResponse(res);
    },
    { schema: S3PutObjectRetentionRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object torrent path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}?torrent{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObjectTorrent.html
  const objectsGetTorrent = Object.assign(
    async (
      req: S3ObjectGovernanceRequest,
      signal?: AbortSignal
    ): Promise<S3GetObjectTorrentResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery({ versionId: req.versionId }, "&");
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}/${key}?torrent${query}`,
        { bucket: req.bucket, headers: objectGovernanceHeaders(req) },
        signal
      );
      return {
        ...objectConfigResponse(res),
        body: await res.arrayBuffer(),
      };
    },
    { schema: S3ObjectGovernanceRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object select path
  // POST https://s3.us-east-1.amazonaws.com/{bucket}/{key}?select&select-type=2
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_SelectObjectContent.html
  const objectsSelectContent = Object.assign(
    async (
      req: S3SelectObjectContentRequest,
      signal?: AbortSignal
    ): Promise<S3SelectObjectContentResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const headers: Record<string, string> = {
        "Content-Type": "application/xml",
      };
      if (req.expectedBucketOwner) {
        headers["x-amz-expected-bucket-owner"] = req.expectedBucketOwner;
      }
      addSseCustomerHeaders(headers, req);
      const res = await makeSignedRequest(
        "POST",
        `/${bucket}/${key}?select&select-type=2`,
        { bucket: req.bucket, body: req.body, headers },
        signal
      );
      return {
        ...objectConfigResponse(res),
        body: await res.arrayBuffer(),
      };
    },
    { schema: S3SelectObjectContentRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 object encryption path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}?encryption{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_UpdateObjectEncryption.html
  const objectsUpdateEncryption = Object.assign(
    async (
      req: S3UpdateObjectEncryptionRequest,
      signal?: AbortSignal
    ): Promise<S3UpdateObjectEncryptionResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery({ versionId: req.versionId }, "&");
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}/${key}?encryption${query}`,
        {
          bucket: req.bucket,
          body: req.body,
          headers: objectPutConfigHeaders(req, req.body),
        },
        signal
      );
      return objectConfigResponse(res);
    },
    { schema: S3UpdateObjectEncryptionRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 multipart object path
  // POST https://s3.us-east-1.amazonaws.com/{bucket}/{key}?uploads
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CreateMultipartUpload.html
  const objectsCreateMultipartUpload = Object.assign(
    async (
      req: S3CreateMultipartUploadRequest,
      signal?: AbortSignal
    ): Promise<S3CreateMultipartUploadResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const headers: Record<string, string> = {};
      addObjectContentHeaders(headers, req);
      addMetadataHeaders(headers, req.metadata);
      addOwnerAndPayerHeaders(
        headers,
        req.expectedBucketOwner,
        req.requestPayer
      );
      addChecksumRequestHeaders(headers, req);
      if (req.acl) headers["x-amz-acl"] = req.acl;
      if (req.bucketKeyEnabled !== undefined) {
        headers["x-amz-server-side-encryption-bucket-key-enabled"] = String(
          req.bucketKeyEnabled
        );
      }
      if (req.objectLockLegalHold) {
        headers["x-amz-object-lock-legal-hold"] = req.objectLockLegalHold;
      }
      if (req.objectLockMode) {
        headers["x-amz-object-lock-mode"] = req.objectLockMode;
      }
      if (req.objectLockRetainUntilDate) {
        headers["x-amz-object-lock-retain-until-date"] =
          req.objectLockRetainUntilDate;
      }
      if (req.serverSideEncryption) {
        headers["x-amz-server-side-encryption"] = req.serverSideEncryption;
      }
      if (req.sseKmsEncryptionContext) {
        headers["x-amz-server-side-encryption-context"] =
          req.sseKmsEncryptionContext;
      }
      if (req.sseKmsKeyId) {
        headers["x-amz-server-side-encryption-aws-kms-key-id"] =
          req.sseKmsKeyId;
      }
      if (req.storageClass) headers["x-amz-storage-class"] = req.storageClass;
      if (req.tagging) headers["x-amz-tagging"] = req.tagging;
      if (req.websiteRedirectLocation) {
        headers["x-amz-website-redirect-location"] =
          req.websiteRedirectLocation;
      }
      const res = await makeSignedRequest(
        "POST",
        `/${bucket}/${key}?uploads`,
        { bucket: req.bucket, headers },
        signal
      );
      return parseCreateMultipartUpload(await res.text(), res.headers);
    },
    { schema: S3CreateMultipartUploadRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 multipart object path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_UploadPart.html
  const objectsUploadPart = Object.assign(
    async (
      req: S3UploadPartRequest,
      signal?: AbortSignal
    ): Promise<S3UploadPartResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery({
        partNumber: req.partNumber,
        uploadId: req.uploadId,
      });
      const headers: Record<string, string> = {};
      addOwnerAndPayerHeaders(
        headers,
        req.expectedBucketOwner,
        req.requestPayer
      );
      addChecksumRequestHeaders(headers, req);
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}/${key}${query}`,
        {
          bucket: req.bucket,
          body: req.body,
          headers,
        },
        signal
      );
      return {
        ...checksumFieldsFromHeaders(res.headers),
        eTag: getHeader(res.headers, "etag"),
        requestCharged: getHeader(res.headers, "x-amz-request-charged"),
        serverSideEncryption: getHeader(
          res.headers,
          "x-amz-server-side-encryption"
        ),
        sseKmsKeyId: getHeader(
          res.headers,
          "x-amz-server-side-encryption-aws-kms-key-id"
        ),
      };
    },
    { schema: S3UploadPartRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 multipart object path
  // PUT https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_UploadPartCopy.html
  const objectsUploadPartCopy = Object.assign(
    async (
      req: S3UploadPartCopyRequest,
      signal?: AbortSignal
    ): Promise<S3UploadPartCopyResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery({
        partNumber: req.partNumber,
        uploadId: req.uploadId,
      });
      const headers: Record<string, string> = {
        "x-amz-copy-source": encodeCopySource(
          req.sourceBucket,
          req.sourceKey,
          req.sourceVersionId
        ),
      };
      addOwnerAndPayerHeaders(
        headers,
        req.expectedBucketOwner,
        req.requestPayer
      );
      if (req.copySourceIfMatch) {
        headers["x-amz-copy-source-if-match"] = req.copySourceIfMatch;
      }
      if (req.copySourceIfModifiedSince) {
        headers["x-amz-copy-source-if-modified-since"] =
          req.copySourceIfModifiedSince;
      }
      if (req.copySourceIfNoneMatch) {
        headers["x-amz-copy-source-if-none-match"] = req.copySourceIfNoneMatch;
      }
      if (req.copySourceIfUnmodifiedSince) {
        headers["x-amz-copy-source-if-unmodified-since"] =
          req.copySourceIfUnmodifiedSince;
      }
      if (req.copySourceRange) {
        headers["x-amz-copy-source-range"] = req.copySourceRange;
      }
      if (req.sourceExpectedBucketOwner) {
        headers["x-amz-source-expected-bucket-owner"] =
          req.sourceExpectedBucketOwner;
      }
      const res = await makeSignedRequest(
        "PUT",
        `/${bucket}/${key}${query}`,
        { bucket: req.bucket, headers },
        signal
      );
      return parseUploadPartCopy(await res.text(), res.headers);
    },
    { schema: S3UploadPartCopyRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 multipart object path
  // POST https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CompleteMultipartUpload.html
  const objectsCompleteMultipartUpload = Object.assign(
    async (
      req: S3CompleteMultipartUploadRequest,
      signal?: AbortSignal
    ): Promise<S3CompleteMultipartUploadResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery({ uploadId: req.uploadId });
      const headers: Record<string, string> = {
        "Content-Type": "application/xml",
      };
      addOwnerAndPayerHeaders(
        headers,
        req.expectedBucketOwner,
        req.requestPayer
      );
      addChecksumRequestHeaders(headers, req);
      if (req.ifMatch) headers["If-Match"] = req.ifMatch;
      if (req.ifNoneMatch) headers["If-None-Match"] = req.ifNoneMatch;
      if (req.mpuObjectSize !== undefined) {
        headers["x-amz-mp-object-size"] = String(req.mpuObjectSize);
      }
      const res = await makeSignedRequest(
        "POST",
        `/${bucket}/${key}${query}`,
        {
          bucket: req.bucket,
          body: createCompleteMultipartUploadBody(req.parts),
          headers,
        },
        signal
      );
      return parseCompleteMultipartUpload(await res.text(), res.headers);
    },
    { schema: S3CompleteMultipartUploadRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 multipart object path
  // DELETE https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_AbortMultipartUpload.html
  const objectsAbortMultipartUpload = Object.assign(
    async (
      req: S3AbortMultipartUploadRequest,
      signal?: AbortSignal
    ): Promise<S3AbortMultipartUploadResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery({ uploadId: req.uploadId });
      const headers: Record<string, string> = {};
      addOwnerAndPayerHeaders(
        headers,
        req.expectedBucketOwner,
        req.requestPayer
      );
      const res = await makeSignedRequest(
        "DELETE",
        `/${bucket}/${key}${query}`,
        { bucket: req.bucket, headers },
        signal
      );
      return {
        requestCharged: getHeader(res.headers, "x-amz-request-charged"),
        headers: collectHeaders(res.headers),
      };
    },
    { schema: S3AbortMultipartUploadRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 multipart object path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}/{key}{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListParts.html
  const objectsListParts = Object.assign(
    async (
      req: S3ListPartsRequest,
      signal?: AbortSignal
    ): Promise<S3ListPartsResponse> => {
      const bucket = awsEncode(req.bucket);
      const key = encodeS3Key(req.key);
      const query = buildQuery(
        {
          uploadId: req.uploadId,
          "max-parts": req.maxParts,
          "part-number-marker": req.partNumberMarker,
        },
        "?"
      );
      const headers: Record<string, string> = {};
      addOwnerAndPayerHeaders(
        headers,
        req.expectedBucketOwner,
        req.requestPayer
      );
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}/${key}${query}`,
        { bucket: req.bucket, headers },
        signal
      );
      return parseListParts(await res.text(), res.headers);
    },
    { schema: S3ListPartsRequestSchema }
  );

  // sig-ok: action namespace over dynamic S3 bucket multipart path
  // GET https://s3.us-east-1.amazonaws.com/{bucket}?uploads{query}
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListMultipartUploads.html
  const objectsListMultipartUploads = Object.assign(
    async (
      req: S3ListMultipartUploadsRequest,
      signal?: AbortSignal
    ): Promise<S3ListMultipartUploadsResponse> => {
      const bucket = awsEncode(req.bucket);
      const query = buildQuery(
        {
          delimiter: req.delimiter,
          "encoding-type": req.encodingType,
          "key-marker": req.keyMarker,
          "max-uploads": req.maxUploads,
          prefix: req.prefix,
          "upload-id-marker": req.uploadIdMarker,
        },
        "&"
      );
      const headers: Record<string, string> = {};
      addOwnerAndPayerHeaders(
        headers,
        req.expectedBucketOwner,
        req.requestPayer
      );
      const res = await makeSignedRequest(
        "GET",
        `/${bucket}?uploads${query}`,
        { bucket: req.bucket, headers },
        signal
      );
      return parseListMultipartUploads(await res.text(), res.headers);
    },
    { schema: S3ListMultipartUploadsRequestSchema }
  );

  // sig-ok: action namespace over S3 Object Lambda response path
  // POST https://{param}.s3-object-lambda.{param}.amazonaws.com/WriteGetObjectResponse
  // Docs: https://docs.aws.amazon.com/AmazonS3/latest/API/API_WriteGetObjectResponse.html
  const objectLambdaWriteGetObjectResponse = Object.assign(
    async (
      req: S3WriteGetObjectResponseRequest,
      signal?: AbortSignal
    ): Promise<S3WriteGetObjectResponseResult> => {
      const headers: Record<string, string> = {};
      addForwardedResponseHeaders(headers, req);
      const res = await makeSignedRequest(
        "POST",
        "/WriteGetObjectResponse",
        {
          baseOverride:
            opts.endpoint ??
            `https://${req.requestRoute}.s3-object-lambda.${opts.region}.amazonaws.com`,
          body: req.body,
          headers,
          signingService: "s3-object-lambda",
        },
        signal
      );
      return objectConfigResponse(res);
    },
    { schema: S3WriteGetObjectResponseRequestSchema }
  );

  const presignGetObject = Object.assign(
    (req: S3PresignObjectRequest): S3PresignedUrl =>
      presignObjectUrl("GET", req),
    { schema: S3PresignObjectRequestSchema }
  );

  const presignPutObject = Object.assign(
    (req: S3PresignObjectRequest): S3PresignedUrl =>
      presignObjectUrl("PUT", req),
    { schema: S3PresignObjectRequestSchema }
  );

  const presignHeadObject = Object.assign(
    (req: S3PresignObjectRequest): S3PresignedUrl =>
      presignObjectUrl("HEAD", req),
    { schema: S3PresignObjectRequestSchema }
  );

  const presignDeleteObject = Object.assign(
    (req: S3PresignObjectRequest): S3PresignedUrl =>
      presignObjectUrl("DELETE", req),
    { schema: S3PresignObjectRequestSchema }
  );

  return {
    buckets: {
      create: bucketsCreate,
      createMetadataConfiguration: bucketsCreateMetadataConfiguration,
      createMetadataTableConfiguration: bucketsCreateMetadataTableConfiguration,
      createSession: bucketsCreateSession,
      del: bucketsDel,
      delAnalytics: bucketsDelAnalytics,
      delCors: bucketsDelCors,
      delEncryption: bucketsDelEncryption,
      delIntelligentTiering: bucketsDelIntelligentTiering,
      delInventory: bucketsDelInventory,
      delLifecycle: bucketsDelLifecycle,
      delMetadataConfiguration: bucketsDelMetadataConfiguration,
      delMetadataTableConfiguration: bucketsDelMetadataTableConfiguration,
      delMetrics: bucketsDelMetrics,
      delOwnershipControls: bucketsDelOwnershipControls,
      delPolicy: bucketsDelPolicy,
      delPublicAccessBlock: bucketsDelPublicAccessBlock,
      delReplication: bucketsDelReplication,
      delTagging: bucketsDelTagging,
      delWebsite: bucketsDelWebsite,
      getAbac: bucketsGetAbac,
      getAccelerateConfiguration: bucketsGetAccelerateConfiguration,
      getAcl: bucketsGetAcl,
      getAnalytics: bucketsGetAnalytics,
      getCors: bucketsGetCors,
      getEncryption: bucketsGetEncryption,
      getIntelligentTiering: bucketsGetIntelligentTiering,
      getInventory: bucketsGetInventory,
      getLifecycle: bucketsGetLifecycle,
      getLifecycleLegacy: bucketsGetLifecycleLegacy,
      getLogging: bucketsGetLogging,
      getMetadataConfiguration: bucketsGetMetadataConfiguration,
      getMetadataTableConfiguration: bucketsGetMetadataTableConfiguration,
      getMetrics: bucketsGetMetrics,
      getNotification: bucketsGetNotification,
      getNotificationLegacy: bucketsGetNotificationLegacy,
      getObjectLockConfiguration: bucketsGetObjectLockConfiguration,
      getOwnershipControls: bucketsGetOwnershipControls,
      getPolicy: bucketsGetPolicy,
      getPolicyStatus: bucketsGetPolicyStatus,
      getPublicAccessBlock: bucketsGetPublicAccessBlock,
      getReplication: bucketsGetReplication,
      getRequestPayment: bucketsGetRequestPayment,
      getTagging: bucketsGetTagging,
      getVersioning: bucketsGetVersioning,
      getWebsite: bucketsGetWebsite,
      head: bucketsHead,
      listAnalytics: bucketsListAnalytics,
      listDirectory: bucketsListDirectory,
      listIntelligentTiering: bucketsListIntelligentTiering,
      listInventory: bucketsListInventory,
      list: bucketsList,
      listMetrics: bucketsListMetrics,
      location: bucketsLocation,
      putAbac: bucketsPutAbac,
      putAccelerateConfiguration: bucketsPutAccelerateConfiguration,
      putAcl: bucketsPutAcl,
      putAnalytics: bucketsPutAnalytics,
      putCors: bucketsPutCors,
      putEncryption: bucketsPutEncryption,
      putIntelligentTiering: bucketsPutIntelligentTiering,
      putInventory: bucketsPutInventory,
      putLifecycle: bucketsPutLifecycle,
      putLifecycleLegacy: bucketsPutLifecycleLegacy,
      putLogging: bucketsPutLogging,
      putMetrics: bucketsPutMetrics,
      putNotification: bucketsPutNotification,
      putNotificationLegacy: bucketsPutNotificationLegacy,
      putObjectLockConfiguration: bucketsPutObjectLockConfiguration,
      putOwnershipControls: bucketsPutOwnershipControls,
      putPolicy: bucketsPutPolicy,
      putPublicAccessBlock: bucketsPutPublicAccessBlock,
      putReplication: bucketsPutReplication,
      putRequestPayment: bucketsPutRequestPayment,
      putTagging: bucketsPutTagging,
      putVersioning: bucketsPutVersioning,
      putWebsite: bucketsPutWebsite,
      updateMetadataInventoryTable: bucketsUpdateMetadataInventoryTable,
      updateMetadataJournalTable: bucketsUpdateMetadataJournalTable,
    },
    objectLambda: {
      writeGetObjectResponse: objectLambdaWriteGetObjectResponse,
    },
    objects: {
      abortMultipartUpload: objectsAbortMultipartUpload,
      completeMultipartUpload: objectsCompleteMultipartUpload,
      copy: objectsCopy,
      createMultipartUpload: objectsCreateMultipartUpload,
      del: objectsDel,
      delMany: objectsDelMany,
      delTagging: objectsDelTagging,
      get: objectsGet,
      getAcl: objectsGetAcl,
      getAttributes: objectsGetAttributes,
      getLegalHold: objectsGetLegalHold,
      getRetention: objectsGetRetention,
      getStream: objectsGetStream,
      getTagging: objectsGetTagging,
      getTorrent: objectsGetTorrent,
      head: objectsHead,
      listMultipartUploads: objectsListMultipartUploads,
      listVersions: objectsListVersions,
      list: objectsList,
      listLegacy: objectsListLegacy,
      listParts: objectsListParts,
      put: objectsPut,
      putAcl: objectsPutAcl,
      putLegalHold: objectsPutLegalHold,
      putRetention: objectsPutRetention,
      putTagging: objectsPutTagging,
      rename: objectsRename,
      restore: objectsRestore,
      selectContent: objectsSelectContent,
      updateEncryption: objectsUpdateEncryption,
      uploadPart: objectsUploadPart,
      uploadPartCopy: objectsUploadPartCopy,
    },
    presign: {
      deleteObject: presignDeleteObject,
      getObject: presignGetObject,
      headObject: presignHeadObject,
      putObject: presignPutObject,
    },
  };
}
