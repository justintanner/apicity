import type { KieMediaModel } from "./zod";

export interface ApicitySchemaIssue {
  path: readonly PropertyKey[];
  message: string;
  code?: string;
}

export interface ApicitySchemaError {
  issues: readonly ApicitySchemaIssue[];
}

export type ApicitySafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApicitySchemaError };

export interface ApicitySchema<T = unknown> {
  parse(data: unknown): T;
  safeParse(data: unknown): ApicitySafeParseResult<T>;
  description?: string;
}

// ---------------------------------------------------------------------------
// Request types — derived from Zod schemas (source of truth in zod.ts)
// ---------------------------------------------------------------------------

export type {
  KieMediaModel,
  MediaType,
  KlingElement,
  MultiShotPrompt,
  KlingVideoRequest,
  KlingVideoRequestInput,
  KlingVideoParsedRequest,
  KlingMotionControlRequest,
  KlingMotionControlRequestInput,
  KlingMotionControlParsedRequest,
  KlingV3TurboImageToVideoRequest,
  KlingV3TurboImageToVideoRequestInput,
  KlingV3TurboImageToVideoParsedRequest,
  KlingV3TurboTextToVideoRequest,
  KlingV3TurboTextToVideoRequestInput,
  KlingV3TurboTextToVideoParsedRequest,
  GrokTextToImageRequest,
  GrokTextToImageRequestInput,
  GrokTextToImageParsedRequest,
  GrokImageToImageRequest,
  GrokImageToImageRequestInput,
  GrokImageToImageParsedRequest,
  GrokTextToVideoRequest,
  GrokTextToVideoRequestInput,
  GrokTextToVideoParsedRequest,
  GrokImageToVideoRequest,
  GrokImageToVideoRequestInput,
  GrokImageToVideoParsedRequest,
  GrokVideo15PreviewRequest,
  GrokVideo15PreviewRequestInput,
  GrokVideo15PreviewParsedRequest,
  GrokVideoExtendRequest,
  GrokVideoExtendRequestInput,
  GrokVideoExtendParsedRequest,
  GrokVideoUpscaleRequest,
  GrokVideoUpscaleRequestInput,
  GrokVideoUpscaleParsedRequest,
  NanoBananaProRequest,
  NanoBananaProRequestInput,
  NanoBananaProParsedRequest,
  NanoBanana2Request,
  NanoBanana2RequestInput,
  NanoBanana2ParsedRequest,
  NanoBanana2LiteAspectRatio,
  NanoBanana2LiteRequest,
  NanoBanana2LiteRequestInput,
  NanoBanana2LiteParsedRequest,
  GptImageToImageRequest,
  GptImageToImageRequestInput,
  GptImageToImageParsedRequest,
  GptImage15TextToImageAspectRatio,
  GptImage15TextToImageRequest,
  GptImage15TextToImageRequestInput,
  GptImage15TextToImageParsedRequest,
  GptImage2ImageToImageRequest,
  GptImage2ImageToImageRequestInput,
  GptImage2ImageToImageParsedRequest,
  GptImage2TextToImageRequest,
  GptImage2TextToImageRequestInput,
  GptImage2TextToImageParsedRequest,
  SeedreamImageToImageRequest,
  SeedreamImageToImageRequestInput,
  SeedreamImageToImageParsedRequest,
  SeedreamTextToImageRequest,
  SeedreamTextToImageRequestInput,
  SeedreamTextToImageParsedRequest,
  SeedreamProImageToImageRequest,
  SeedreamProImageToImageRequestInput,
  SeedreamProImageToImageParsedRequest,
  SeedreamProTextToImageRequest,
  SeedreamProTextToImageRequestInput,
  SeedreamProTextToImageParsedRequest,
  Seedream45TextToImageRequest,
  Seedream45TextToImageRequestInput,
  Seedream45TextToImageParsedRequest,
  Seedream45EditRequest,
  Seedream45EditRequestInput,
  Seedream45EditParsedRequest,
  Qwen2TextToImageRequest,
  Qwen2TextToImageRequestInput,
  Qwen2TextToImageParsedRequest,
  Qwen2ImageEditRequest,
  Qwen2ImageEditRequestInput,
  Qwen2ImageEditParsedRequest,
  QwenImageSize,
  QwenAcceleration,
  QwenImageEditNumImages,
  QwenTextToImageRequest,
  QwenTextToImageRequestInput,
  QwenTextToImageParsedRequest,
  QwenImageEditRequest,
  QwenImageEditRequestInput,
  QwenImageEditParsedRequest,
  QwenImageToImageRequest,
  QwenImageToImageRequestInput,
  QwenImageToImageParsedRequest,
  Seedance2FastRequest,
  Seedance2FastRequestInput,
  Seedance2FastParsedRequest,
  Seedance2Request,
  Seedance2RequestInput,
  Seedance2ParsedRequest,
  Seedance2MiniInput,
  Seedance2MiniRequest,
  Seedance2MiniRequestInput,
  Seedance2MiniParsedRequest,
  Seedance15ProAspectRatio,
  Seedance15ProResolution,
  Seedance15ProInput,
  Seedance15ProRequest,
  Seedance15ProRequestInput,
  Seedance15ProParsedRequest,
  Seedance2MiniTaskResultJson,
  Seedance2MiniRecordInfoData,
  Seedance2MiniRecordInfoResponse,
  Wan27ImageToVideoRequest,
  Wan27ImageToVideoRequestInput,
  Wan27ImageToVideoParsedRequest,
  Wan27TextToVideoRequest,
  Wan27TextToVideoRequestInput,
  Wan27TextToVideoParsedRequest,
  Wan27RefToVideoRequest,
  Wan27RefToVideoRequestInput,
  Wan27RefToVideoParsedRequest,
  Wan27VideoEditRequest,
  Wan27VideoEditRequestInput,
  Wan27VideoEditParsedRequest,
  Wan27ImageColorPalette,
  Wan27ImageRequest,
  Wan27ImageRequestInput,
  Wan27ImageParsedRequest,
  Wan27ImageProRequest,
  Wan27ImageProRequestInput,
  Wan27ImageProParsedRequest,
  Wan27TaskResultJson,
  Wan27VideoResult,
  Wan27ImageResult,
  SoraWatermarkRequest,
  SoraWatermarkRequestInput,
  SoraWatermarkParsedRequest,
  MiniMaxH3TextToVideoInput,
  MiniMaxH3TextToVideoParsedInput,
  MiniMaxH3TextToVideoRequest,
  MiniMaxH3TextToVideoRequestInput,
  MiniMaxH3TextToVideoParsedRequest,
  MiniMaxH3ImageToVideoInput,
  MiniMaxH3ImageToVideoParsedInput,
  MiniMaxH3ImageToVideoRequest,
  MiniMaxH3ImageToVideoRequestInput,
  MiniMaxH3ImageToVideoParsedRequest,
  MiniMaxH3ReferenceToVideoInput,
  MiniMaxH3ReferenceToVideoParsedInput,
  MiniMaxH3ReferenceToVideoRequest,
  MiniMaxH3ReferenceToVideoRequestInput,
  MiniMaxH3ReferenceToVideoParsedRequest,
  GoogleGeminiTtsInput,
  GoogleGeminiTtsParsedInput,
  GoogleGemini25ProTtsRequest,
  GoogleGemini25ProTtsRequestInput,
  GoogleGemini25ProTtsParsedRequest,
  GoogleGemini31FlashTtsRequest,
  GoogleGemini31FlashTtsRequestInput,
  GoogleGemini31FlashTtsParsedRequest,
  TopazUpscaleFactor,
  TopazImageUpscaleRequest,
  TopazImageUpscaleRequestInput,
  TopazImageUpscaleParsedRequest,
  TopazVideoUpscaleRequest,
  TopazVideoUpscaleRequestInput,
  TopazVideoUpscaleParsedRequest,
  InfinitalkFromAudioResolution,
  InfinitalkFromAudioRequest,
  InfinitalkFromAudioRequestInput,
  InfinitalkFromAudioParsedRequest,
  ZImageAspectRatio,
  ZImageRequest,
  ZImageRequestInput,
  ZImageParsedRequest,
  Flux2TextToImageAspectRatio,
  Flux2ImageToImageAspectRatio,
  Flux2Resolution,
  Flux2ProTextToImageRequest,
  Flux2ProTextToImageRequestInput,
  Flux2ProTextToImageParsedRequest,
  Flux2FlexTextToImageRequest,
  Flux2FlexTextToImageRequestInput,
  Flux2FlexTextToImageParsedRequest,
  Flux2ProImageToImageRequest,
  Flux2ProImageToImageRequestInput,
  Flux2ProImageToImageParsedRequest,
  Flux2FlexImageToImageRequest,
  Flux2FlexImageToImageRequestInput,
  Flux2FlexImageToImageParsedRequest,
  MediaGenerationRequest,
  MediaGenerationRequestInput,
  MediaGenerationParsedRequest,
  RecordInfoRequest,
  RecordInfoRequestInput,
  TaskResponseParsed,
  UploadMediaRequest,
  UploadMediaRequestInput,
  UploadMediaParsedRequest,
  FileUrlUploadRequest,
  FileUrlUploadRequestInput,
  FileUrlUploadParsedRequest,
  FileBase64UploadRequest,
  FileBase64UploadRequestInput,
  FileBase64UploadParsedRequest,
  DownloadUrlRequest,
  DownloadUrlRequestInput,
  DownloadUrlParsedRequest,
  Gpt4oImageDownloadUrlRequest,
  Gpt4oImageDownloadUrlRequestInput,
  Gpt4oImageDownloadUrlParsedRequest,
  KieOptions,
  // Standalone parameter union types
  KlingDuration,
  KlingAspectRatio,
  KlingMode,
  KlingV3TurboDuration,
  KlingV3TurboTextToVideoDuration,
  KlingV3TurboResolution,
  KlingV3TurboAspectRatio,
  GrokImagineMode,
  GrokTextToVideoMode,
  GrokImageToVideoMode,
  GrokTextToVideoAspectRatio,
  GrokImageToVideoAspectRatio,
  GrokTextToVideoDuration,
  GrokImagineDuration,
  GrokImageToVideoDuration,
  GrokImagineResolution,
  GrokVideo15AspectRatio,
  NanoBananaResolution,
  NanoBananaOutputFormat,
  GptImageQuality,
  GptImage2ImageToImageAspectRatio,
  GptImage2ImageToImageResolution,
  GptImage2TextToImageAspectRatio,
  GptImage2TextToImageResolution,
  Wan27Resolution,
  Wan27AspectRatio,
  Wan27AudioSetting,
  Wan27ImageResolution,
  Wan27ImageAspectRatio,
  Wan27VideoEditDuration,
  Seedance2MiniResolution,
  Seedance2MiniAspectRatio,
  Seedance2MiniTaskState,
  MiniMaxH3Prompt,
  MiniMaxH3Duration,
  MiniMaxH3Resolution,
  MiniMaxH3FixedAspectRatio,
  MiniMaxH3ReferenceAspectRatio,
  MiniMaxH3MediaAddress,
  GoogleGeminiTtsVoiceName,
  GoogleGeminiTtsAccent,
  GoogleGeminiTtsStyle,
  GoogleGeminiTtsPace,
  GoogleGeminiTtsSpeakerId,
  GoogleGeminiTtsSpeaker,
  GoogleGeminiTtsDialogueTurn,
  HappyHorseResolution,
  HappyHorseAspectRatio,
  HappyHorse11AspectRatio,
  HappyHorseAudioSetting,
  HappyHorseDuration,
  Omnihuman15OutputResolution,
  VolcengineVideoToVideoLipSyncMode,
  GeminiOmniVideoDuration,
  GeminiOmniVideoAspectRatio,
  GeminiOmniVideoResolution,
  HappyHorseTextToVideoRequest,
  HappyHorseTextToVideoRequestInput,
  HappyHorseTextToVideoParsedRequest,
  HappyHorseImageToVideoRequest,
  HappyHorseImageToVideoRequestInput,
  HappyHorseImageToVideoParsedRequest,
  HappyHorseReferenceToVideoRequest,
  HappyHorseReferenceToVideoRequestInput,
  HappyHorseReferenceToVideoParsedRequest,
  HappyHorseVideoEditRequest,
  HappyHorseVideoEditRequestInput,
  HappyHorseVideoEditParsedRequest,
  HappyHorse11TextToVideoRequest,
  HappyHorse11TextToVideoRequestInput,
  HappyHorse11TextToVideoParsedRequest,
  HappyHorse11ImageToVideoRequest,
  HappyHorse11ImageToVideoRequestInput,
  HappyHorse11ImageToVideoParsedRequest,
  HappyHorse11ReferenceToVideoRequest,
  HappyHorse11ReferenceToVideoRequestInput,
  HappyHorse11ReferenceToVideoParsedRequest,
  HappyHorse11CreateTaskResponse,
  Omnihuman15Request,
  Omnihuman15RequestInput,
  Omnihuman15ParsedRequest,
  VolcengineVideoToVideoLipSyncRequest,
  VolcengineVideoToVideoLipSyncRequestInput,
  VolcengineVideoToVideoLipSyncParsedRequest,
  GeminiOmniVideoRequest,
  GeminiOmniVideoRequestInput,
  GeminiOmniVideoParsedRequest,
  ElevenLabsAudioIsolationRequest,
  ElevenLabsAudioIsolationRequestInput,
  ElevenLabsAudioIsolationParsedRequest,
  ElevenLabsTextToDialogueV3Request,
  ElevenLabsTextToDialogueV3RequestInput,
  ElevenLabsTextToDialogueV3ParsedRequest,
  ElevenLabsTextToSpeechMultilingualV2Request,
  ElevenLabsTextToSpeechMultilingualV2RequestInput,
  ElevenLabsTextToSpeechMultilingualV2ParsedRequest,
  ElevenLabsTextToSpeechTurbo25Request,
  ElevenLabsTextToSpeechTurbo25RequestInput,
  ElevenLabsTextToSpeechTurbo25ParsedRequest,
  ElevenLabsSoundEffectV2Request,
  ElevenLabsSoundEffectV2RequestInput,
  ElevenLabsSoundEffectV2ParsedRequest,
  GeminiOmniAudioVoiceId,
  GeminiOmniAudioCreateRequest,
  GeminiOmniAudioCreateRequestInput,
  GeminiOmniAudioCreateParsedRequest,
  GeminiOmniCharacterCreateRequest,
  GeminiOmniCharacterCreateRequestInput,
  GeminiOmniCharacterCreateParsedRequest,
  GeminiOmniCharacterCreateData,
  GeminiOmniCharacterCreateResponse,
  FluxKontextGenerateRequest,
  FluxKontextGenerateRequestInput,
  FluxKontextGenerateParsedRequest,
  FluxKontextModel,
  FluxKontextAspectRatio,
  Gpt4oImageGenerateRequest,
  Gpt4oImageGenerateRequestInput,
  Gpt4oImageGenerateParsedRequest,
  Gpt4oImageSize,
  Gpt4oImageFallbackModel,
  MjGenerateRequest,
  MjGenerateRequestInput,
  MjGenerateParsedRequest,
  MjTaskType,
  MjSpeed,
  MjVersion,
  MjAspectRatio,
  MjMotion,
  MjRecordInfoRequest,
  MjRecordInfoRequestInput,
  MjRecordInfoSuccessFlag,
  MjRecordInfoResultInfo,
  MjRecordInfoData,
  MjRecordInfoResponse,
  RunwayGenerateRequest,
  RunwayGenerateRequestInput,
  RunwayGenerateParsedRequest,
  RunwayExtendRequest,
  RunwayExtendRequestInput,
  RunwayExtendParsedRequest,
  RunwayQuality,
  RunwayAspectRatio,
  RunwayDuration,
  FluxKontextRecordInfoRequest,
  FluxKontextRecordInfoRequestInput,
  FluxKontextSuccessFlag,
  FluxKontextRecordInfoData,
  FluxKontextRecordInfoResponse,
  KieGeminiRole,
  KieGeminiThinkingLevel,
  KieGeminiInlineData,
  KieGeminiFileData,
  KieGeminiPart,
  KieGeminiContent,
  KieGeminiFunctionParameters,
  KieGeminiFunctionDeclaration,
  KieGeminiGoogleSearch,
  KieGeminiGoogleSearchTool,
  KieGeminiFunctionDeclarationsTool,
  KieGeminiTool,
  KieGeminiThinkingConfig,
  KieGeminiGenerationConfig,
  KieGemini35FlashStreamGenerateContentRequest,
  KieGemini35FlashStreamGenerateContentParsedRequest,
  KieResponsesModel,
  KieResponsesReasoningEffort,
  KieResponsesMessageRole,
  KieResponsesInputText,
  KieResponsesInputImage,
  KieResponsesInputFile,
  KieResponsesInputContent,
  KieResponsesInputMessage,
  KieResponsesReasoning,
  KieResponsesWebSearchTool,
  KieResponsesFunctionTool,
  KieResponsesTool,
  KieResponsesRequest,
  KieResponsesParsedRequest,
  KieGrokResponsesModel,
  KieGrokResponsesRequest,
} from "./zod";

// ---------------------------------------------------------------------------
// Response types (hand-written — not schema-ified yet)
// ---------------------------------------------------------------------------

export interface KieApiEnvelope<T = Record<string, unknown>> {
  code: number;
  msg: string;
  data?: T;
}

export type TaskResponse = KieApiEnvelope<{ taskId: string }>;

export interface UploadFileData {
  fileName: string;
  filePath: string;
  downloadUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface UploadMediaResponse {
  success: boolean;
  code: number;
  msg: string;
  data?: UploadFileData;
}

export type DownloadUrlResponse = KieApiEnvelope<string>;

/** Same envelope as common download-url: `data` is the temporary URL string. */
export type Gpt4oImageDownloadUrlResponse = KieApiEnvelope<string>;

export type KieTaskState =
  | "waiting"
  | "queuing"
  | "generating"
  | "success"
  | "fail";

export interface KieTaskInfoData {
  taskId?: string;
  model?: string;
  state?: string;
  param?: string;
  resultJson?: string;
  failCode?: string;
  failMsg?: string;
  costTime?: number;
  completeTime?: number;
  createTime?: number;
  updateTime?: number;
  progress?: number;
}

export type KieTaskInfo = KieApiEnvelope<KieTaskInfoData>;
export type KieCreditsResponse = KieApiEnvelope<number>;

export type Gpt4oImageStatus =
  | "GENERATING"
  | "SUCCESS"
  | "CREATE_TASK_FAILED"
  | "GENERATE_FAILED";

export interface Gpt4oImageRecordInfoData {
  taskId?: string;
  paramJson?: string;
  completeTime?: number | null;
  response?: {
    resultUrls?: string[];
  } | null;
  successFlag?: number;
  status?: Gpt4oImageStatus;
  errorCode?: number | null;
  errorMessage?: string | null;
  createTime?: number | null;
  progress?: string | null;
}

export interface Gpt4oImageRecordInfo {
  code: number;
  msg: string;
  data?: Gpt4oImageRecordInfoData | null;
}

export interface RunwayVideoInfo {
  videoId?: string;
  taskId?: string;
  videoUrl?: string;
  imageUrl?: string;
}

export interface RunwayGenerateParam {
  prompt?: string;
  imageUrl?: string;
  expandPrompt?: boolean;
  [key: string]: unknown;
}

export interface RunwayRecordDetailData {
  taskId?: string;
  parentTaskId?: string | null;
  generateParam?: RunwayGenerateParam | null;
  state?: string;
  generateTime?: string | null;
  videoInfo?: RunwayVideoInfo | null;
  failCode?: number | null;
  failMsg?: string | null;
  expireFlag?: number | null;
}

export interface RunwayRecordDetail {
  code: number;
  msg: string;
  data?: RunwayRecordDetailData | null;
}

export interface AlephRecordInfoResponseResult {
  taskId?: string;
  resultVideoUrl?: string;
  resultImageUrl?: string;
  [key: string]: unknown;
}

export interface AlephRecordInfoData {
  taskId: string;
  paramJson?: string;
  response?: AlephRecordInfoResponseResult | null;
  completeTime?: string | null;
  createTime?: string;
  successFlag?: 0 | 1 | number;
  errorCode?: number | null;
  errorMessage?: string | null;
  [key: string]: unknown;
}

export interface AlephRecordInfo {
  code: number;
  msg: string;
  data?: AlephRecordInfoData | null;
}

export interface GeminiOmniAudioCreateData {
  audioId: string;
  kieAudioId: string;
  name: string;
}

export type GeminiOmniAudioCreateResponse =
  KieApiEnvelope<GeminiOmniAudioCreateData>;

// ---------------------------------------------------------------------------
// Model input schema types (for parameter discovery / UI generation)
// ---------------------------------------------------------------------------

export type PayloadFieldType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "array"
  | "object";

export interface PayloadFieldSchema {
  type: PayloadFieldType;
  acceptedTypes?: readonly PayloadFieldType[];
  required?: boolean;
  description?: string;
  enum?: readonly (string | number | boolean)[];
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  default?: string | number | boolean | null | readonly unknown[];
  items?: PayloadFieldSchema;
  properties?: Record<string, PayloadFieldSchema>;
}

export interface ModelInputSchema {
  type: "image" | "video" | "audio" | "transcription";
  fields: Record<string, PayloadFieldSchema>;
}

// ---------------------------------------------------------------------------
// Method interface types (endpoint shapes with .schema)
// ---------------------------------------------------------------------------

import type {
  MediaGenerationRequest,
  DownloadUrlRequest,
  Gpt4oImageDownloadUrlRequest,
  UploadMediaRequest,
  FileUrlUploadRequest,
  FileBase64UploadRequest,
  GeminiOmniAudioCreateRequest,
  GeminiOmniCharacterCreateRequest,
  GeminiOmniCharacterCreateResponse,
  FluxKontextGenerateRequest,
  Gpt4oImageGenerateRequest,
  MjGenerateRequest,
  MjRecordInfoRequest,
  MjRecordInfoResponse,
  RunwayGenerateRequest,
  RunwayExtendRequest,
  FluxKontextRecordInfoRequest,
  FluxKontextRecordInfoResponse,
  RecordInfoRequest,
  Seedance2MiniRecordInfoResponse,
} from "./zod";

export type { PayGateApproval as KieApproval } from "./paygate";
import type { PayGateApproval as KieApproval } from "./paygate";

interface KieCreateTaskMethod {
  (req: MediaGenerationRequest, approval?: KieApproval): Promise<TaskResponse>;
  schema: ApicitySchema<MediaGenerationRequest>;
}

interface KieDownloadUrlMethod {
  (req: DownloadUrlRequest): Promise<DownloadUrlResponse>;
  schema: ApicitySchema<DownloadUrlRequest>;
}

interface KieGpt4oImageDownloadUrlMethod {
  (req: Gpt4oImageDownloadUrlRequest): Promise<Gpt4oImageDownloadUrlResponse>;
  schema: ApicitySchema<Gpt4oImageDownloadUrlRequest>;
}

interface KieFileStreamUploadMethod {
  (req: UploadMediaRequest): Promise<UploadMediaResponse>;
  schema: ApicitySchema<UploadMediaRequest>;
}

interface KieFileUrlUploadMethod {
  (req: FileUrlUploadRequest): Promise<UploadMediaResponse>;
  schema: ApicitySchema<FileUrlUploadRequest>;
}

interface KieFileBase64UploadMethod {
  (req: FileBase64UploadRequest): Promise<UploadMediaResponse>;
  schema: ApicitySchema<FileBase64UploadRequest>;
}

interface KieGeminiOmniAudioCreateMethod {
  (
    req: GeminiOmniAudioCreateRequest,
    approval?: KieApproval
  ): Promise<GeminiOmniAudioCreateResponse>;
  schema: ApicitySchema<GeminiOmniAudioCreateRequest>;
}

interface KieGeminiOmniCharacterCreateMethod {
  (
    req: GeminiOmniCharacterCreateRequest,
    approval?: KieApproval
  ): Promise<GeminiOmniCharacterCreateResponse>;
  schema: ApicitySchema<GeminiOmniCharacterCreateRequest>;
  responseSchema: ApicitySchema<GeminiOmniCharacterCreateResponse>;
}

interface KieFluxKontextGenerateMethod {
  (
    req: FluxKontextGenerateRequest,
    approval?: KieApproval
  ): Promise<TaskResponse>;
  schema: ApicitySchema<FluxKontextGenerateRequest>;
}

interface KieGpt4oImageGenerateMethod {
  (
    req: Gpt4oImageGenerateRequest,
    approval?: KieApproval
  ): Promise<TaskResponse>;
  schema: ApicitySchema<Gpt4oImageGenerateRequest>;
}

interface KieMjGenerateMethod {
  (req: MjGenerateRequest, approval?: KieApproval): Promise<TaskResponse>;
  schema: ApicitySchema<MjGenerateRequest>;
}

interface KieMjRecordInfoMethod {
  (taskId: string): Promise<MjRecordInfoResponse>;
  schema: ApicitySchema<MjRecordInfoRequest>;
  responseSchema: ApicitySchema<MjRecordInfoResponse>;
}

interface KieRecordInfoMethod {
  (taskId: string): Promise<KieTaskInfo>;
  schema: ApicitySchema<RecordInfoRequest>;
  seedance2MiniResponseSchema: ApicitySchema<Seedance2MiniRecordInfoResponse>;
}

interface KieGpt4oImageRecordInfoMethod {
  (taskId: string): Promise<Gpt4oImageRecordInfo>;
  schema: ApicitySchema<RecordInfoRequest>;
  responseSchema: ApicitySchema<Gpt4oImageRecordInfo>;
}

interface KieRunwayGenerateMethod {
  (req: RunwayGenerateRequest, approval?: KieApproval): Promise<TaskResponse>;
  schema: ApicitySchema<RunwayGenerateRequest>;
}

interface KieRunwayExtendMethod {
  (req: RunwayExtendRequest, approval?: KieApproval): Promise<TaskResponse>;
  schema: ApicitySchema<RunwayExtendRequest>;
}

interface KieRunwayRecordDetailMethod {
  (taskId: string): Promise<RunwayRecordDetail>;
  schema: ApicitySchema<RecordInfoRequest>;
  responseSchema: ApicitySchema<RunwayRecordDetail>;
}

interface KieAlephRecordInfoMethod {
  (taskId: string): Promise<AlephRecordInfo>;
  schema: ApicitySchema<RecordInfoRequest>;
  responseSchema: ApicitySchema<AlephRecordInfo>;
}

interface KieFluxKontextRecordInfoMethod {
  (taskId: string): Promise<FluxKontextRecordInfoResponse>;
  schema: ApicitySchema<FluxKontextRecordInfoRequest>;
  responseSchema: ApicitySchema<FluxKontextRecordInfoResponse>;
}

// POST namespace
interface KiePostApiNamespace {
  v1: {
    jobs: { createTask: KieCreateTaskMethod };
    common: { downloadUrl: KieDownloadUrlMethod };
    omni: {
      audio: {
        create: KieGeminiOmniAudioCreateMethod;
      };
      character: {
        create: KieGeminiOmniCharacterCreateMethod;
      };
    };
    flux: {
      kontext: {
        generate: KieFluxKontextGenerateMethod;
      };
    };
    gpt4oImage: {
      generate: KieGpt4oImageGenerateMethod;
      downloadUrl: KieGpt4oImageDownloadUrlMethod;
    };
    mj: {
      generate: KieMjGenerateMethod;
    };
    runway: {
      generate: KieRunwayGenerateMethod;
      extend: KieRunwayExtendMethod;
    };
  };
  fileStreamUpload: KieFileStreamUploadMethod;
  fileUrlUpload: KieFileUrlUploadMethod;
  fileBase64Upload: KieFileBase64UploadMethod;
}

// GET namespace
interface KieGetApiNamespace {
  v1: {
    jobs: { recordInfo: KieRecordInfoMethod };
    gpt4oImage: { recordInfo: KieGpt4oImageRecordInfoMethod };
    mj: { recordInfo: KieMjRecordInfoMethod };
    runway: { recordDetail: KieRunwayRecordDetailMethod };
    aleph: { recordInfo: KieAlephRecordInfoMethod };
    flux: {
      kontext: {
        recordInfo: KieFluxKontextRecordInfoMethod;
      };
    };
    chat: { credit(): Promise<KieCreditsResponse> };
  };
}

// Provider interface (sub-provider types imported in index.ts)
export interface KieProvider {
  post: {
    api: KiePostApiNamespace;
    codex: import("./responses").KieResponsesProvider["codex"];
    grok: import("./responses").KieResponsesProvider["grok"];
  };
  get: { api: KieGetApiNamespace };
  modelInputSchemas: Record<KieMediaModel, ModelInputSchema>;
  veo: import("./veo").VeoProvider;
  suno: import("./suno").SunoProvider;
  chat: import("./chat").KieChatProvider;
  claude: import("./claude").KieClaudeProvider["claude"];
  gemini: import("./gemini").KieGeminiProvider["gemini"];
  gemini31Pro: import("./gemini-31-pro").KieGemini31ProProvider["gemini31Pro"];
  gemini25Flash: import("./gemini-25-flash").KieGemini25FlashProvider["gemini25Flash"];
  gemini3Flash: import("./gemini-3-flash").KieGemini3FlashProvider["gemini3Flash"];
  gemini3Pro: import("./gemini-3-pro").KieGemini3ProProvider["gemini3Pro"];
  gemini25Pro: import("./gemini-25-pro").KieGemini25ProProvider["gemini25Pro"];
}

// Error class
export class KieError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly code?: string;

  constructor(message: string, status: number, body?: unknown, code?: string) {
    super(message);
    this.name = "KieError";
    this.status = status;
    this.body = body ?? null;
    this.code = code;
  }
}
export type {
  VeoGenerateRequestInput,
  VeoExtendRequestInput,
  VeoGet1080pVideoRequestInput,
  VeoRecordInfoRequestInput,
  VeoRecordInfoParsedRequest,
  VeoSuccessFlag,
  SunoGenerateRequestInput,
  KieChatRequestInput,
  KieClaudeRequestInput,
} from "./zod";
