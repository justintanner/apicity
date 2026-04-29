export { free } from "./free";

export { uploadToAnyHost } from "./uploadToAnyHost";
export type { FreeHost, UploadToAnyHostRequest } from "./uploadToAnyHost";

export { FreeError } from "./types";

export {
  withRetry,
  withFallback,
  withRateLimit,
  createRateLimiter,
} from "./middleware";
export type {
  RetryOptions,
  FallbackOptions,
  RateLimiterOptions,
  RateLimiter,
  RateLimitOptions,
} from "./middleware";

export { sseToIterable } from "./sse";

export type {
  FreeOptions,
  TmpfilesUploadRequest,
  TmpfilesUploadData,
  TmpfilesUploadResponse,
  UguuUploadRequest,
  UguuFileEntry,
  UguuUploadResponse,
  CatboxUploadRequest,
  LitterboxUploadRequest,
  GofileUploadRequest,
  GofileUploadData,
  GofileUploadResponse,
  FilebinUploadRequest,
  FilebinBin,
  FilebinFile,
  FilebinUploadResponse,
  TempshUploadRequest,
  TflinkUploadRequest,
  TflinkUploadResponse,
  TmpfilesUploadMethod,
  UguuUploadMethod,
  CatboxUploadMethod,
  LitterboxUploadMethod,
  GofileUploadMethod,
  FilebinUploadMethod,
  TempshUploadMethod,
  TflinkUploadMethod,
  TmpfilesApiV1Namespace,
  TmpfilesApiNamespace,
  TmpfilesNamespace,
  UguuNamespace,
  CatboxNamespace,
  LitterboxNamespace,
  GofileNamespace,
  FilebinNamespace,
  TempshNamespace,
  TflinkNamespace,
  FreeProvider,
} from "./types";
