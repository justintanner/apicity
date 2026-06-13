import { createS3 } from "./s3";

import { attachExamples } from "./example";
import type { B2Options, B2Provider } from "./types";

function endpointForRegion(region: string): string {
  return `https://s3.${region}.backblazeb2.com`;
}

export function createB2(opts: B2Options): B2Provider {
  const s3 = createS3({
    accessKeyId: opts.accessKeyId,
    secretAccessKey: opts.secretAccessKey,
    region: opts.region,
    endpoint: opts.endpoint ?? endpointForRegion(opts.region),
    forcePathStyle: opts.forcePathStyle ?? true,
    signingService: "s3",
    timeout: opts.timeout,
    fetch: opts.fetch,
  });

  return attachExamples({
    buckets: {
      create: s3.buckets.create,
      del: s3.buckets.del,
      delCors: s3.buckets.delCors,
      delEncryption: s3.buckets.delEncryption,
      getAcl: s3.buckets.getAcl,
      getCors: s3.buckets.getCors,
      getEncryption: s3.buckets.getEncryption,
      getObjectLockConfiguration: s3.buckets.getObjectLockConfiguration,
      getVersioning: s3.buckets.getVersioning,
      head: s3.buckets.head,
      list: s3.buckets.list,
      location: s3.buckets.location,
      putAcl: s3.buckets.putAcl,
      putCors: s3.buckets.putCors,
      putEncryption: s3.buckets.putEncryption,
      putObjectLockConfiguration: s3.buckets.putObjectLockConfiguration,
    },
    objects: {
      abortMultipartUpload: s3.objects.abortMultipartUpload,
      completeMultipartUpload: s3.objects.completeMultipartUpload,
      copy: s3.objects.copy,
      createMultipartUpload: s3.objects.createMultipartUpload,
      del: s3.objects.del,
      delMany: s3.objects.delMany,
      get: s3.objects.get,
      getAcl: s3.objects.getAcl,
      getLegalHold: s3.objects.getLegalHold,
      getRetention: s3.objects.getRetention,
      getStream: s3.objects.getStream,
      head: s3.objects.head,
      list: s3.objects.list,
      listLegacy: s3.objects.listLegacy,
      listMultipartUploads: s3.objects.listMultipartUploads,
      listParts: s3.objects.listParts,
      listVersions: s3.objects.listVersions,
      put: s3.objects.put,
      putAcl: s3.objects.putAcl,
      putLegalHold: s3.objects.putLegalHold,
      putRetention: s3.objects.putRetention,
      uploadPart: s3.objects.uploadPart,
      uploadPartCopy: s3.objects.uploadPartCopy,
    },
    presign: {
      deleteObject: s3.presign.deleteObject,
      getObject: s3.presign.getObject,
      headObject: s3.presign.headObject,
      putObject: s3.presign.putObject,
    },
  });
}
