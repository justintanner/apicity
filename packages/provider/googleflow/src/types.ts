import type { z } from "zod";
import type {
  GoogleFlowAccountsCreateRequest,
  GoogleFlowAssetUploadRequest,
  GoogleFlowCaptchaProvidersRequest,
  GoogleFlowCaptchaStatsRequest,
  GoogleFlowCharactersCreateRequest,
  GoogleFlowCharactersListRequest,
  GoogleFlowEmailRequest,
  GoogleFlowImagesRequest,
  GoogleFlowImagesUpscaleRequest,
  GoogleFlowJobIdRequest,
  GoogleFlowJobsRequest,
  GoogleFlowMediaGenerationIdRequest,
  GoogleFlowNoRequest,
  GoogleFlowRefRequest,
  GoogleFlowVideosConcatenateRequest,
  GoogleFlowVideosExtendRequest,
  GoogleFlowVideosGifRequest,
  GoogleFlowVideosRequest,
  GoogleFlowVideosUpscaleRequest,
  GoogleFlowVoicesCreateRequest,
  GoogleFlowVoicesListRequest,
} from "./zod";

export type {
  GoogleFlowOptions,
  GoogleFlowNoRequest,
  GoogleFlowEmailRequest,
  GoogleFlowMediaGenerationIdRequest,
  GoogleFlowRefRequest,
  GoogleFlowJobIdRequest,
  GoogleFlowAccountsCreateRequest,
  GoogleFlowCaptchaProvidersRequest,
  GoogleFlowCaptchaStatsRequest,
  GoogleFlowAssetUploadRequest,
  GoogleFlowCharactersCreateRequest,
  GoogleFlowCharactersListRequest,
  GoogleFlowVoicesCreateRequest,
  GoogleFlowVoicesListRequest,
  GoogleFlowImagesRequest,
  GoogleFlowImagesUpscaleRequest,
  GoogleFlowVideosRequest,
  GoogleFlowVideosUpscaleRequest,
  GoogleFlowVideosGifRequest,
  GoogleFlowVideosExtendRequest,
  GoogleFlowVideosConcatenateRequest,
  GoogleFlowJobsRequest,
} from "./zod";

export interface GoogleFlowResponse {
  [key: string]: unknown;
}

export class GoogleFlowError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "GoogleFlowError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}

export interface GoogleFlowMethod<TRequest extends Record<string, unknown>> {
  (req: TRequest, signal?: AbortSignal): Promise<GoogleFlowResponse>;
  schema: z.ZodType<TRequest>;
}

export interface GoogleFlowPostAccountsMethod extends GoogleFlowMethod<GoogleFlowAccountsCreateRequest> {
  captchaProviders: GoogleFlowMethod<GoogleFlowCaptchaProvidersRequest>;
}

export interface GoogleFlowPostImagesMethod extends GoogleFlowMethod<GoogleFlowImagesRequest> {
  upscale: GoogleFlowMethod<GoogleFlowImagesUpscaleRequest>;
}

export interface GoogleFlowPostVideosMethod extends GoogleFlowMethod<GoogleFlowVideosRequest> {
  upscale: GoogleFlowMethod<GoogleFlowVideosUpscaleRequest>;
  gif: GoogleFlowMethod<GoogleFlowVideosGifRequest>;
  extend: GoogleFlowMethod<GoogleFlowVideosExtendRequest>;
  concatenate: GoogleFlowMethod<GoogleFlowVideosConcatenateRequest>;
}

export interface GoogleFlowPostV1Namespace {
  accounts: GoogleFlowPostAccountsMethod;
  assets: GoogleFlowMethod<GoogleFlowAssetUploadRequest>;
  characters: GoogleFlowMethod<GoogleFlowCharactersCreateRequest>;
  voices: GoogleFlowMethod<GoogleFlowVoicesCreateRequest>;
  images: GoogleFlowPostImagesMethod;
  videos: GoogleFlowPostVideosMethod;
}

export interface GoogleFlowGetAccountsMethod extends GoogleFlowMethod<GoogleFlowNoRequest> {
  retrieve: GoogleFlowMethod<GoogleFlowEmailRequest>;
  captchaProviders: GoogleFlowMethod<GoogleFlowNoRequest>;
  captchaStats: GoogleFlowMethod<GoogleFlowCaptchaStatsRequest>;
}

export interface GoogleFlowGetAssetsNamespace {
  retrieve: GoogleFlowMethod<GoogleFlowMediaGenerationIdRequest>;
}

export interface GoogleFlowGetCharactersMethod extends GoogleFlowMethod<GoogleFlowCharactersListRequest> {
  retrieve: GoogleFlowMethod<GoogleFlowRefRequest>;
}

export interface GoogleFlowGetVoicesMethod extends GoogleFlowMethod<GoogleFlowVoicesListRequest> {
  retrieve: GoogleFlowMethod<GoogleFlowRefRequest>;
}

export interface GoogleFlowGetJobsMethod extends GoogleFlowMethod<GoogleFlowJobsRequest> {
  retrieve: GoogleFlowMethod<GoogleFlowJobIdRequest>;
}

export interface GoogleFlowGetV1Namespace {
  accounts: GoogleFlowGetAccountsMethod;
  assets: GoogleFlowGetAssetsNamespace;
  characters: GoogleFlowGetCharactersMethod;
  voices: GoogleFlowGetVoicesMethod;
  jobs: GoogleFlowGetJobsMethod;
}

export interface GoogleFlowDeleteV1Namespace {
  accounts: GoogleFlowMethod<GoogleFlowEmailRequest>;
  characters: GoogleFlowMethod<GoogleFlowRefRequest>;
  voices: GoogleFlowMethod<GoogleFlowRefRequest>;
}

export interface GoogleFlowPostNamespace {
  v1: GoogleFlowPostV1Namespace;
}

export interface GoogleFlowGetNamespace {
  v1: GoogleFlowGetV1Namespace;
}

export interface GoogleFlowDeleteNamespace {
  v1: GoogleFlowDeleteV1Namespace;
}

export interface GoogleFlowProvider {
  v1: GoogleFlowPostV1Namespace;
  post: GoogleFlowPostNamespace;
  get: GoogleFlowGetNamespace;
  delete: GoogleFlowDeleteNamespace;
}
