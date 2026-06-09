# S3 Hardening Helpers

`@apicity/s3` keeps endpoint methods close to the upstream S3 API and adds a
small set of provider-level helpers for operational use.

## Presigned Object URLs

Use `s3.presign.getObject`, `s3.presign.putObject`,
`s3.presign.headObject`, or `s3.presign.deleteObject` to create SigV4
query-authenticated URLs without making a network request.

```typescript
const upload = s3.presign.putObject({
  bucket: "bucket-name",
  key: "path/file.txt",
  expiresIn: 900,
  contentType: "text/plain",
  metadata: { source: "app" },
});

// Send `upload.headers` with the PUT request to `upload.url`.
```

`expiresIn` is limited to the S3 SigV4 maximum of seven days. PUT presigns
return headers that must be sent with the eventual upload when content,
metadata, or checksum fields are signed.

## Streaming Downloads

`s3.objects.get` buffers the object into an `ArrayBuffer`. Use
`s3.objects.getStream` when callers should consume the response as a web
`ReadableStream<Uint8Array>`:

```typescript
const object = await s3.objects.getStream({
  bucket: "bucket-name",
  key: "large.bin",
});

const stream = object.body;
```

The returned object includes the same response headers and metadata fields as
`s3.objects.get`.

## Region Redirects

For AWS endpoints created without an explicit `endpoint` override, bucket
requests retry once when S3 returns `x-amz-bucket-region` with a 301, 307, or
400 response. The retry targets the regional S3 endpoint and signs with the
redirected region.

Custom S3-compatible endpoints are not region-redirected because their host and
signing-region rules are provider-specific.

## Checksums And MD5

Object PUT requests accept `contentMD5`, `checksumAlgorithm`, and explicit
checksum fields such as `checksumSHA256`. CopyObject accepts
`checksumAlgorithm`. Multipart and governance endpoints retain their existing
checksum support.

## XML Parsing

S3 XML parsing accepts both default-namespace XML and namespace-prefixed XML
tags, so S3-compatible services that return prefixed tags can be parsed without
changing response shapes.

## Retry And Fallback Composition

The provider exports `withRetry` and `withFallback` middleware. Compose them
around endpoint methods when callers need retry/backoff or endpoint failover:

```typescript
const getWithRetry = withRetry(s3.objects.get, {
  retries: 3,
  baseMs: 250,
  jitter: true,
});
```
