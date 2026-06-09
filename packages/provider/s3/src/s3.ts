import { createHash, createHmac } from "node:crypto";

import { S3Error } from "./types";
import type {
  S3BucketRequest,
  S3CreateBucketRequest,
  S3CreateBucketResponse,
  S3DeleteBucketResponse,
  S3DeleteObjectRequest,
  S3DeleteObjectResponse,
  S3GetBucketLocationResponse,
  S3GetObjectRequest,
  S3GetObjectResponse,
  S3HeadBucketResponse,
  S3HeadObjectRequest,
  S3HeadObjectResponse,
  S3ListBucketsRequest,
  S3ListBucketsResponse,
  S3ListObjectsV2Request,
  S3ListObjectsV2Response,
  S3ObjectHeaders,
  S3Options,
  S3Provider,
  S3PutObjectRequest,
  S3PutObjectResponse,
} from "./types";
import {
  S3BucketRequestSchema,
  S3CreateBucketRequestSchema,
  S3DeleteObjectRequestSchema,
  S3GetObjectRequestSchema,
  S3HeadObjectRequestSchema,
  S3ListBucketsRequestSchema,
  S3ListObjectsV2RequestSchema,
  S3PutObjectRequestSchema,
} from "./zod";

type HttpMethod = "GET" | "PUT" | "DELETE" | "HEAD";

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
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
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

function bucketRequestHeaders(
  expectedBucketOwner: string | undefined
): Record<string, string> {
  if (!expectedBucketOwner) return {};
  return { "x-amz-expected-bucket-owner": expectedBucketOwner };
}

function createBucketBody(locationConstraint: string | undefined): string {
  if (!locationConstraint) return "";
  return [
    '<CreateBucketConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">',
    `<LocationConstraint>${locationConstraint}</LocationConstraint>`,
    "</CreateBucketConfiguration>",
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

  return {
    buckets: {
      create: bucketsCreate,
      del: bucketsDel,
      head: bucketsHead,
      list: bucketsList,
      location: bucketsLocation,
    },
    objects: {
      del: objectsDel,
      get: objectsGet,
      head: objectsHead,
      list: objectsList,
      put: objectsPut,
    },
  };
}
