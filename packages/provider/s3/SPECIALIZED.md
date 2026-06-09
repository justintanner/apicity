# Specialized S3 APIs

`@apicity/s3` includes raw REST coverage for specialized AWS S3 surfaces that
need non-default hosts or account resources:

- `buckets.listDirectory` calls the regional S3 Express control host and signs
  requests with the `s3express` service name.
- `buckets.createSession` and `objects.rename` use S3 Express zonal hosts
  derived from directory bucket names ending in `--zone-id--x-s3`. Set
  `endpoint` when using a custom endpoint, partition, or test host.
- `objectLambda.writeGetObjectResponse` derives the Object Lambda host from
  `requestRoute` and signs with the `s3-object-lambda` service name.
- Metadata table configuration and `objects.updateEncryption` use the standard
  S3 host with XML bodies supplied by the caller.

These surfaces are covered by unit tests instead of shared live fixtures because
the project fixture bucket is a general purpose S3 bucket and does not provide
directory bucket, S3 Metadata table, or Object Lambda resources.
