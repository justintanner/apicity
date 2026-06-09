import type {
  S3BucketsNamespace,
  S3ObjectsNamespace,
  S3PresignNamespace,
} from "@apicity/s3";

export { S3Error, S3Error as B2Error } from "@apicity/s3";

export interface B2Options {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  timeout?: number;
  fetch?: typeof fetch;
}

export type B2BucketsNamespace = Pick<
  S3BucketsNamespace,
  | "create"
  | "del"
  | "delCors"
  | "delEncryption"
  | "getAcl"
  | "getCors"
  | "getEncryption"
  | "getObjectLockConfiguration"
  | "getVersioning"
  | "head"
  | "list"
  | "location"
  | "putAcl"
  | "putCors"
  | "putEncryption"
  | "putObjectLockConfiguration"
>;

export type B2ObjectsNamespace = Pick<
  S3ObjectsNamespace,
  | "abortMultipartUpload"
  | "completeMultipartUpload"
  | "copy"
  | "createMultipartUpload"
  | "del"
  | "delMany"
  | "get"
  | "getAcl"
  | "getLegalHold"
  | "getRetention"
  | "getStream"
  | "head"
  | "list"
  | "listLegacy"
  | "listMultipartUploads"
  | "listParts"
  | "listVersions"
  | "put"
  | "putAcl"
  | "putLegalHold"
  | "putRetention"
  | "uploadPart"
  | "uploadPartCopy"
>;

export type B2PresignNamespace = Pick<
  S3PresignNamespace,
  "deleteObject" | "getObject" | "headObject" | "putObject"
>;

export interface B2Provider {
  buckets: B2BucketsNamespace;
  objects: B2ObjectsNamespace;
  presign: B2PresignNamespace;
}
