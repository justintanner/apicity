import { z } from "zod";

const objectBodySchema = z.union([
  z.string(),
  z.instanceof(Blob),
  z.instanceof(ArrayBuffer),
  z.instanceof(Uint8Array),
]);

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

export const S3PutObjectRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  body: objectBodySchema,
  contentType: z.string().optional(),
  cacheControl: z.string().optional(),
  contentDisposition: z.string().optional(),
  contentEncoding: z.string().optional(),
  contentLanguage: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  storageClass: z.string().optional(),
});

export type S3PutObjectRequest = z.infer<typeof S3PutObjectRequestSchema>;

export const S3GetObjectRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  range: z.string().optional(),
  versionId: z.string().optional(),
});

export type S3GetObjectRequest = z.infer<typeof S3GetObjectRequestSchema>;

export const S3HeadObjectRequestSchema = S3GetObjectRequestSchema;

export type S3HeadObjectRequest = z.infer<typeof S3HeadObjectRequestSchema>;

export const S3DeleteObjectRequestSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  versionId: z.string().optional(),
});

export type S3DeleteObjectRequest = z.infer<typeof S3DeleteObjectRequestSchema>;
