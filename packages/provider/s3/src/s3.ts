import { createHash, createHmac } from "node:crypto";

import { S3Error } from "./types";
import type {
  S3AbortMultipartUploadRequest,
  S3AbortMultipartUploadResponse,
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
  S3DeleteBucketResponse,
  S3DeleteObjectRequest,
  S3DeleteObjectResponse,
  S3DeleteObjectsRequest,
  S3DeleteObjectsResponse,
  S3GetBucketVersioningRequest,
  S3GetBucketVersioningResponse,
  S3DeleteObjectTaggingResponse,
  S3GetBucketLocationResponse,
  S3GetObjectRequest,
  S3GetObjectResponse,
  S3GetObjectTaggingResponse,
  S3HeadBucketResponse,
  S3HeadObjectRequest,
  S3HeadObjectResponse,
  S3ListBucketsRequest,
  S3ListBucketsResponse,
  S3ListMultipartUploadsRequest,
  S3ListMultipartUploadsResponse,
  S3ListObjectVersionsRequest,
  S3ListObjectVersionsResponse,
  S3ListObjectsV2Request,
  S3ListObjectsV2Response,
  S3ListPartsRequest,
  S3ListPartsResponse,
  S3ObjectTaggingRequest,
  S3ObjectHeaders,
  S3Options,
  S3Provider,
  S3PutBucketVersioningRequest,
  S3PutBucketVersioningResponse,
  S3PutObjectTaggingRequest,
  S3PutObjectTaggingResponse,
  S3PutObjectRequest,
  S3PutObjectResponse,
  S3UploadPartCopyRequest,
  S3UploadPartCopyResponse,
  S3UploadPartRequest,
  S3UploadPartResponse,
} from "./types";
import {
  S3AbortMultipartUploadRequestSchema,
  S3BucketRequestSchema,
  S3CompleteMultipartUploadRequestSchema,
  S3CopyObjectRequestSchema,
  S3CreateMultipartUploadRequestSchema,
  S3CreateBucketRequestSchema,
  S3DeleteObjectRequestSchema,
  S3DeleteObjectsRequestSchema,
  S3GetBucketVersioningRequestSchema,
  S3GetObjectRequestSchema,
  S3HeadObjectRequestSchema,
  S3ListBucketsRequestSchema,
  S3ListMultipartUploadsRequestSchema,
  S3ListObjectVersionsRequestSchema,
  S3ListObjectsV2RequestSchema,
  S3ListPartsRequestSchema,
  S3ObjectTaggingRequestSchema,
  S3PutBucketVersioningRequestSchema,
  S3PutObjectTaggingRequestSchema,
  S3PutObjectRequestSchema,
  S3UploadPartCopyRequestSchema,
  S3UploadPartRequestSchema,
} from "./zod";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD";

interface SignedRequestConfig {
  bucket?: string;
  body?: string | Blob | ArrayBuffer | Uint8Array;
  headers?: Record<string, string>;
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
  region: string
): Buffer {
  const kDate = hmac(`AWS4${secretAccessKey}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
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
  now: Date
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
  const credentialScope = `${dateStamp}/${opts.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(new TextEncoder().encode(canonicalRequest)),
  ].join("\n");
  const signature = createHmac(
    "sha256",
    signingKey(opts.secretAccessKey, dateStamp, opts.region)
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

function textOf(xml: string, tag: string): string | undefined {
  const match = xml.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`)
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
  return text === "true";
}

function blocksOf(xml: string, tag: string): string[] {
  const blocks: string[] = [];
  const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "g");
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

  async function readError(res: Response): Promise<S3Error> {
    let body = "";
    try {
      body = await res.text();
    } catch {
      // ignore parse errors
    }
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
      const url = buildRequestUrl(
        endpoint,
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
        new Date()
      );
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };
      if (bodyBytes) init.body = bodyBytes as BodyInit;

      const res = await doFetch(url, init);
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
      if (contentType) headers["Content-Type"] = contentType;
      if (req.cacheControl) headers["Cache-Control"] = req.cacheControl;
      if (req.contentDisposition) {
        headers["Content-Disposition"] = req.contentDisposition;
      }
      if (req.contentEncoding)
        headers["Content-Encoding"] = req.contentEncoding;
      if (req.contentLanguage)
        headers["Content-Language"] = req.contentLanguage;
      if (req.storageClass) headers["x-amz-storage-class"] = req.storageClass;
      for (const [name, value] of Object.entries(req.metadata ?? {})) {
        headers[`x-amz-meta-${name.toLowerCase()}`] = value;
      }
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
      if (req.contentType) headers["Content-Type"] = req.contentType;
      if (req.cacheControl) headers["Cache-Control"] = req.cacheControl;
      if (req.contentDisposition) {
        headers["Content-Disposition"] = req.contentDisposition;
      }
      if (req.contentEncoding)
        headers["Content-Encoding"] = req.contentEncoding;
      if (req.contentLanguage)
        headers["Content-Language"] = req.contentLanguage;
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
      for (const [name, value] of Object.entries(req.metadata ?? {})) {
        headers[`x-amz-meta-${name.toLowerCase()}`] = value;
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

  return {
    buckets: {
      create: bucketsCreate,
      del: bucketsDel,
      getVersioning: bucketsGetVersioning,
      head: bucketsHead,
      list: bucketsList,
      location: bucketsLocation,
      putVersioning: bucketsPutVersioning,
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
      getTagging: objectsGetTagging,
      head: objectsHead,
      listMultipartUploads: objectsListMultipartUploads,
      listVersions: objectsListVersions,
      list: objectsList,
      listParts: objectsListParts,
      put: objectsPut,
      putTagging: objectsPutTagging,
      uploadPart: objectsUploadPart,
      uploadPartCopy: objectsUploadPartCopy,
    },
  };
}
