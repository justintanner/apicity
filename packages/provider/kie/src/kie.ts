import {
  MediaGenerationRequest,
  TaskResponse,
  KieOptions,
  KieProvider,
  KieError,
  KieCreditsResponse,
  KieApiEnvelope,
  DownloadUrlRequest,
  DownloadUrlResponse,
  Gpt4oImageDownloadUrlRequest,
  Gpt4oImageDownloadUrlResponse,
  UploadMediaRequest,
  UploadMediaResponse,
  FileUrlUploadRequest,
  FileBase64UploadRequest,
  KieTaskInfo,
  Gpt4oImageRecordInfo,
  MjRecordInfoResponse,
  GeminiOmniAudioCreateRequest,
  GeminiOmniAudioCreateResponse,
  GeminiOmniCharacterCreateRequest,
  GeminiOmniCharacterCreateResponse,
  FluxKontextGenerateRequest,
  Gpt4oImageGenerateRequest,
  MjGenerateRequest,
  RunwayGenerateRequest,
  RunwayExtendRequest,
  RunwayRecordDetail,
  AlephGenerateRequest,
  AlephRecordInfo,
} from "./types";
import type { z } from "zod";
import type { FluxKontextRecordInfoResponse, KieMediaModel } from "./zod";
import {
  CreateTaskRequestSchema,
  DownloadUrlRequestSchema,
  Gpt4oImageDownloadUrlRequestSchema,
  UploadMediaRequestSchema,
  FileUrlUploadRequestSchema,
  FileBase64UploadRequestSchema,
  GeminiOmniVideoRequestSchema,
  GeminiOmniAudioCreateRequestSchema,
  GeminiOmniCharacterCreateRequestSchema,
  GeminiOmniCharacterCreateResponseSchema,
  FluxKontextGenerateRequestSchema,
  Gpt4oImageGenerateRequestSchema,
  MjGenerateRequestSchema,
  MjRecordInfoRequestSchema,
  MjRecordInfoResponseSchema,
  RunwayGenerateRequestSchema,
  RunwayExtendRequestSchema,
  RunwayRecordDetailResponseSchema,
  AlephGenerateRequestSchema,
  AlephRecordInfoResponseSchema,
  FluxKontextRecordInfoRequestSchema,
  FluxKontextRecordInfoResponseSchema,
  GrokImageToVideoRequestSchema,
  RecordInfoRequestSchema,
  Gpt4oImageRecordInfoResponseSchema,
  Seedance2MiniRecordInfoResponseSchema,
  Seedance2MiniRequestSchema,
  Seedance2FastRequestSchema,
  Seedance2RequestSchema,
  Seedance15ProRequestSchema,
  BytedanceSeedreamRequestSchema,
  BytedanceSeedreamV4EditRequestSchema,
  BytedanceSeedreamV4TextToImageRequestSchema,
  BytedanceV1LiteImageToVideoRequestSchema,
  BytedanceV1LiteTextToVideoRequestSchema,
  BytedanceV1ProFastImageToVideoRequestSchema,
  BytedanceV1ProImageToVideoRequestSchema,
  BytedanceV1ProTextToVideoRequestSchema,
  PixverseV6TextToVideoRequestSchema,
  PixverseV6ImageToVideoRequestSchema,
  PixverseV6TransitionRequestSchema,
  PixverseV6ExtendRequestSchema,
  PixverseV6ReferenceToVideoRequestSchema,
  MiniMaxH3TextToVideoRequestSchema,
  MiniMaxH3ImageToVideoRequestSchema,
  MiniMaxH3ReferenceToVideoRequestSchema,
  GoogleGemini25ProTtsRequestSchema,
  GoogleGemini31FlashTtsRequestSchema,
  GoogleImagen4RequestSchema,
  GoogleImagen4FastRequestSchema,
  GoogleImagen4UltraRequestSchema,
  GoogleNanoBananaRequestSchema,
  GoogleNanoBananaEditRequestSchema,
  TopazImageUpscaleRequestSchema,
  TopazVideoUpscaleRequestSchema,
  InfinitalkFromAudioRequestSchema,
  ZImageRequestSchema,
  Flux2ProTextToImageRequestSchema,
  Flux2FlexTextToImageRequestSchema,
  Flux2ProImageToImageRequestSchema,
  Flux2FlexImageToImageRequestSchema,
  Hailuo02TextToVideoProRequestSchema,
  Hailuo02TextToVideoStandardRequestSchema,
  Hailuo02ImageToVideoProRequestSchema,
  Hailuo02ImageToVideoStandardRequestSchema,
  Hailuo23ImageToVideoProRequestSchema,
  Hailuo23ImageToVideoStandardRequestSchema,
  Omnihuman15HumanIdentificationRequestSchema,
  Omnihuman15SubjectDetectionRequestSchema,
  IdeogramV3TextToImageRequestSchema,
  IdeogramV3EditRequestSchema,
  IdeogramV3RemixRequestSchema,
  IdeogramCharacterRequestSchema,
  IdeogramCharacterEditRequestSchema,
  IdeogramCharacterRemixRequestSchema,
  Wan27ImageToVideoRequestSchema,
  Wan27TextToVideoRequestSchema,
  Wan27RefToVideoRequestSchema,
  Wan27VideoEditRequestSchema,
  Wan27ImageRequestSchema,
  Wan27ImageProRequestSchema,
  Wan26FlashImageToVideoRequestSchema,
  Wan26FlashVideoToVideoRequestSchema,
  Wan26ImageToVideoRequestSchema,
  Wan26TextToVideoRequestSchema,
  Wan26VideoToVideoRequestSchema,
  GrokTextToImageRequestSchema,
  GrokImageToImageRequestSchema,
  GrokTextToVideoRequestSchema,
  GrokVideo15PreviewRequestSchema,
  GrokVideoExtendRequestSchema,
  GrokVideoUpscaleRequestSchema,
  KlingVideoRequestSchema,
  KlingMotionControlRequestSchema,
  KlingV3TurboImageToVideoRequestSchema,
  KlingV3TurboTextToVideoRequestSchema,
  Kling26TextToVideoRequestSchema,
  Kling26ImageToVideoRequestSchema,
  Kling26MotionControlRequestSchema,
  KlingAiAvatarProRequestSchema,
  KlingAiAvatarStandardRequestSchema,
  KlingV21MasterImageToVideoRequestSchema,
  KlingV21MasterTextToVideoRequestSchema,
  KlingV21ProRequestSchema,
  KlingV21StandardRequestSchema,
  KlingV25TurboImageToVideoProRequestSchema,
  KlingV25TurboTextToVideoProRequestSchema,
  NanoBananaProRequestSchema,
  NanoBanana2RequestSchema,
  NanoBanana2LiteRequestSchema,
  GptImageToImageRequestSchema,
  GptImage15TextToImageRequestSchema,
  GptImage2ImageToImageRequestSchema,
  GptImage2TextToImageRequestSchema,
  Seedream45EditRequestSchema,
  Seedream45TextToImageRequestSchema,
  SeedreamImageToImageRequestSchema,
  SeedreamTextToImageRequestSchema,
  SeedreamProImageToImageRequestSchema,
  SeedreamProTextToImageRequestSchema,
  Qwen2TextToImageRequestSchema,
  Qwen2ImageEditRequestSchema,
  QwenTextToImageRequestSchema,
  QwenImageEditRequestSchema,
  QwenImageToImageRequestSchema,
  HappyHorseTextToVideoRequestSchema,
  HappyHorseImageToVideoRequestSchema,
  HappyHorseReferenceToVideoRequestSchema,
  HappyHorseVideoEditRequestSchema,
  HappyHorse11TextToVideoRequestSchema,
  HappyHorse11ImageToVideoRequestSchema,
  HappyHorse11ReferenceToVideoRequestSchema,
  ElevenLabsAudioIsolationRequestSchema,
  ElevenLabsTextToDialogueV3RequestSchema,
  ElevenLabsTextToSpeechMultilingualV2RequestSchema,
  ElevenLabsTextToSpeechTurbo25RequestSchema,
  ElevenLabsSoundEffectV2RequestSchema,
  Omnihuman15RequestSchema,
  VolcengineVideoToVideoLipSyncRequestSchema,
  SoraWatermarkRequestSchema,
  RecraftCrispUpscaleRequestSchema,
  RecraftRemoveBackgroundRequestSchema,
} from "./zod";
import { modelInputSchemas } from "./model-schemas";
import { createVeoProvider } from "./veo";
import { createSunoProvider } from "./suno";
import { createChatProvider } from "./chat";
import { createClaudeProvider } from "./claude";
import { createGeminiProvider } from "./gemini";
import { createResponsesProvider } from "./responses";
import { createGemini31ProProvider } from "./gemini-31-pro";
import { createGemini25FlashProvider } from "./gemini-25-flash";
import { createGemini3FlashProvider } from "./gemini-3-flash";
import { createGemini35FlashOpenaiProvider } from "./gemini-35-flash-openai";
import { createGemini36FlashOpenaiProvider } from "./gemini-36-flash-openai";
import { createGemini3ProProvider } from "./gemini-3-pro";
import { createGemini25ProProvider } from "./gemini-25-pro";
import { attachExamples } from "./example";
import { createReplayStore } from "./paygate";
import { withPaidGate } from "./with-paid-gate";
import { createKieTransport, kieRequest } from "./request";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  aac: "audio/aac",
  m4a: "audio/mp4",
};

// Models whose createTask payload is validated before the request leaves the
// process. Each entry is a model id and the schema that rejects a malformed
// payload for it. Every KIE_MEDIA_MODELS id carries an entry here — not most
// of them, not the ones that happened to get recorded — and the table's
// `satisfies Record<KieMediaModel, z.ZodType>` clause enforces that membership
// rule. Tsc names every missing id up to five; at six or more it names the
// first four and reports the remainder as `and N more.`
//
// The key is KieMediaModel, not string, so a mistyped id fails at the table
// with TS2353 rather than becoming an unreachable guard. Duplicate keys fail
// at the repeated entry with TS1117.
//
// If a future model genuinely cannot be guarded, reintroduce an exemption
// table and its reason map together in one visible, reviewable diff; an empty
// exemption table would silently pre-authorize bypasses.
//
// `as const` keeps readonly, per-key concrete schema types; `satisfies` checks
// the total mapping without erasing those value types to `z.ZodType`.
// validateCreateTaskRequest uses an own-property lookup so an untyped or MCP
// caller's non-catalogue id still falls through unvalidated.
export const CREATE_TASK_GUARDS = {
  "kling-3.0/video": KlingVideoRequestSchema,
  "kling-3.0/motion-control": KlingMotionControlRequestSchema,
  "kling/v3-turbo-image-to-video": KlingV3TurboImageToVideoRequestSchema,
  "kling/v3-turbo-text-to-video": KlingV3TurboTextToVideoRequestSchema,
  "kling-2.6/image-to-video": Kling26ImageToVideoRequestSchema,
  "kling-2.6/motion-control": Kling26MotionControlRequestSchema,
  "kling-2.6/text-to-video": Kling26TextToVideoRequestSchema,
  "kling/ai-avatar-pro": KlingAiAvatarProRequestSchema,
  "kling/ai-avatar-standard": KlingAiAvatarStandardRequestSchema,
  "kling/v2-1-master-image-to-video": KlingV21MasterImageToVideoRequestSchema,
  "kling/v2-1-master-text-to-video": KlingV21MasterTextToVideoRequestSchema,
  "kling/v2-1-pro": KlingV21ProRequestSchema,
  "kling/v2-1-standard": KlingV21StandardRequestSchema,
  "kling/v2-5-turbo-image-to-video-pro":
    KlingV25TurboImageToVideoProRequestSchema,
  "kling/v2-5-turbo-text-to-video-pro":
    KlingV25TurboTextToVideoProRequestSchema,
  "grok-imagine/text-to-image": GrokTextToImageRequestSchema,
  "grok-imagine/image-to-image": GrokImageToImageRequestSchema,
  "grok-imagine/text-to-video": GrokTextToVideoRequestSchema,
  "grok-imagine/image-to-video": GrokImageToVideoRequestSchema,
  "grok-imagine-video-1-5-preview": GrokVideo15PreviewRequestSchema,
  "nano-banana-pro": NanoBananaProRequestSchema,
  "nano-banana-2": NanoBanana2RequestSchema,
  "nano-banana-2-lite": NanoBanana2LiteRequestSchema,
  "gpt-image/1.5-image-to-image": GptImageToImageRequestSchema,
  "gpt-image/1.5-text-to-image": GptImage15TextToImageRequestSchema,
  "gpt-image-2-image-to-image": GptImage2ImageToImageRequestSchema,
  "gpt-image-2-text-to-image": GptImage2TextToImageRequestSchema,
  "seedream/5-lite-image-to-image": SeedreamImageToImageRequestSchema,
  "seedream/5-lite-text-to-image": SeedreamTextToImageRequestSchema,
  "seedream/5-pro-image-to-image": SeedreamProImageToImageRequestSchema,
  "seedream/5-pro-text-to-image": SeedreamProTextToImageRequestSchema,
  "seedream/4.5-text-to-image": Seedream45TextToImageRequestSchema,
  "seedream/4.5-edit": Seedream45EditRequestSchema,
  "grok-imagine/extend": GrokVideoExtendRequestSchema,
  "grok-imagine/upscale": GrokVideoUpscaleRequestSchema,
  "qwen2/text-to-image": Qwen2TextToImageRequestSchema,
  "qwen2/image-edit": Qwen2ImageEditRequestSchema,
  "qwen/text-to-image": QwenTextToImageRequestSchema,
  "qwen/image-edit": QwenImageEditRequestSchema,
  "qwen/image-to-image": QwenImageToImageRequestSchema,
  "bytedance/seedance-2-fast": Seedance2FastRequestSchema,
  "bytedance/seedance-2": Seedance2RequestSchema,
  "bytedance/seedance-2-mini": Seedance2MiniRequestSchema,
  "bytedance/seedance-1.5-pro": Seedance15ProRequestSchema,
  "bytedance/seedream": BytedanceSeedreamRequestSchema,
  "bytedance/seedream-v4-edit": BytedanceSeedreamV4EditRequestSchema,
  "bytedance/seedream-v4-text-to-image":
    BytedanceSeedreamV4TextToImageRequestSchema,
  "bytedance/v1-lite-image-to-video": BytedanceV1LiteImageToVideoRequestSchema,
  "bytedance/v1-lite-text-to-video": BytedanceV1LiteTextToVideoRequestSchema,
  "bytedance/v1-pro-fast-image-to-video":
    BytedanceV1ProFastImageToVideoRequestSchema,
  "bytedance/v1-pro-image-to-video": BytedanceV1ProImageToVideoRequestSchema,
  "bytedance/v1-pro-text-to-video": BytedanceV1ProTextToVideoRequestSchema,
  "wan/2-7-image-to-video": Wan27ImageToVideoRequestSchema,
  "wan/2-7-text-to-video": Wan27TextToVideoRequestSchema,
  "wan/2-7-r2v": Wan27RefToVideoRequestSchema,
  "wan/2-7-videoedit": Wan27VideoEditRequestSchema,
  "wan/2-7-image": Wan27ImageRequestSchema,
  "wan/2-7-image-pro": Wan27ImageProRequestSchema,
  "wan/2-6-flash-image-to-video": Wan26FlashImageToVideoRequestSchema,
  "wan/2-6-flash-video-to-video": Wan26FlashVideoToVideoRequestSchema,
  "wan/2-6-image-to-video": Wan26ImageToVideoRequestSchema,
  "wan/2-6-text-to-video": Wan26TextToVideoRequestSchema,
  "wan/2-6-video-to-video": Wan26VideoToVideoRequestSchema,
  "happyhorse/text-to-video": HappyHorseTextToVideoRequestSchema,
  "happyhorse/image-to-video": HappyHorseImageToVideoRequestSchema,
  "happyhorse/reference-to-video": HappyHorseReferenceToVideoRequestSchema,
  "happyhorse/video-edit": HappyHorseVideoEditRequestSchema,
  "happyhorse-1-1/text-to-video": HappyHorse11TextToVideoRequestSchema,
  "happyhorse-1-1/image-to-video": HappyHorse11ImageToVideoRequestSchema,
  "happyhorse-1-1/reference-to-video":
    HappyHorse11ReferenceToVideoRequestSchema,
  "omnihuman-1-5": Omnihuman15RequestSchema,
  "omnihuman-1-5/human-identification":
    Omnihuman15HumanIdentificationRequestSchema,
  "omnihuman-1-5/subject-detection": Omnihuman15SubjectDetectionRequestSchema,
  "volcengine/video-to-video-lip-sync":
    VolcengineVideoToVideoLipSyncRequestSchema,
  "gemini-omni-video": GeminiOmniVideoRequestSchema,
  "elevenlabs/audio-isolation": ElevenLabsAudioIsolationRequestSchema,
  "elevenlabs/text-to-dialogue-v3": ElevenLabsTextToDialogueV3RequestSchema,
  "elevenlabs/text-to-speech-multilingual-v2":
    ElevenLabsTextToSpeechMultilingualV2RequestSchema,
  "elevenlabs/text-to-speech-turbo-2-5":
    ElevenLabsTextToSpeechTurbo25RequestSchema,
  "elevenlabs/sound-effect-v2": ElevenLabsSoundEffectV2RequestSchema,
  "sora-watermark-remover": SoraWatermarkRequestSchema,
  "recraft/crisp-upscale": RecraftCrispUpscaleRequestSchema,
  "recraft/remove-background": RecraftRemoveBackgroundRequestSchema,
  "pixverse-v6/text-to-video": PixverseV6TextToVideoRequestSchema,
  "pixverse-v6/image-to-video": PixverseV6ImageToVideoRequestSchema,
  "pixverse-v6/transition": PixverseV6TransitionRequestSchema,
  "pixverse-v6/extend": PixverseV6ExtendRequestSchema,
  "pixverse-v6/reference-to-video": PixverseV6ReferenceToVideoRequestSchema,
  "minimax-h3/text-to-video": MiniMaxH3TextToVideoRequestSchema,
  "minimax-h3/image-to-video": MiniMaxH3ImageToVideoRequestSchema,
  "minimax-h3/reference-to-video": MiniMaxH3ReferenceToVideoRequestSchema,
  "google/gemini-2-5-pro-tts": GoogleGemini25ProTtsRequestSchema,
  "google/gemini-3-1-flash-tts": GoogleGemini31FlashTtsRequestSchema,
  "google/imagen4": GoogleImagen4RequestSchema,
  "google/imagen4-fast": GoogleImagen4FastRequestSchema,
  "google/imagen4-ultra": GoogleImagen4UltraRequestSchema,
  "google/nano-banana": GoogleNanoBananaRequestSchema,
  "google/nano-banana-edit": GoogleNanoBananaEditRequestSchema,
  "topaz/image-upscale": TopazImageUpscaleRequestSchema,
  "topaz/video-upscale": TopazVideoUpscaleRequestSchema,
  "infinitalk/from-audio": InfinitalkFromAudioRequestSchema,
  "z-image": ZImageRequestSchema,
  "flux-2/flex-image-to-image": Flux2FlexImageToImageRequestSchema,
  "flux-2/flex-text-to-image": Flux2FlexTextToImageRequestSchema,
  "flux-2/pro-image-to-image": Flux2ProImageToImageRequestSchema,
  "flux-2/pro-text-to-image": Flux2ProTextToImageRequestSchema,
  "ideogram/character": IdeogramCharacterRequestSchema,
  "ideogram/character-edit": IdeogramCharacterEditRequestSchema,
  "ideogram/character-remix": IdeogramCharacterRemixRequestSchema,
  "ideogram/v3-edit": IdeogramV3EditRequestSchema,
  "ideogram/v3-remix": IdeogramV3RemixRequestSchema,
  "ideogram/v3-text-to-image": IdeogramV3TextToImageRequestSchema,
  "hailuo/02-image-to-video-pro": Hailuo02ImageToVideoProRequestSchema,
  "hailuo/02-image-to-video-standard":
    Hailuo02ImageToVideoStandardRequestSchema,
  "hailuo/02-text-to-video-pro": Hailuo02TextToVideoProRequestSchema,
  "hailuo/02-text-to-video-standard": Hailuo02TextToVideoStandardRequestSchema,
  "hailuo/2-3-image-to-video-pro": Hailuo23ImageToVideoProRequestSchema,
  "hailuo/2-3-image-to-video-standard":
    Hailuo23ImageToVideoStandardRequestSchema,
} as const satisfies Record<KieMediaModel, z.ZodType>;

function validateCreateTaskRequest(req: MediaGenerationRequest): void {
  // MediaGenerationRequest includes alias-only model ids that have request
  // schemas but are not KIE_MEDIA_MODELS entries (e.g. wan/2-5-*). Those
  // fall through unvalidated here; only catalogue ids have CREATE_TASK_GUARDS
  // entries. Index after the own-property check via KieMediaModel so the wider
  // MediaGenerationRequest model union does not fail tsc on the lookup.
  const model = req.model;
  const guard: z.ZodType | undefined = Object.prototype.hasOwnProperty.call(
    CREATE_TASK_GUARDS,
    model
  )
    ? CREATE_TASK_GUARDS[model as KieMediaModel]
    : undefined;
  if (!guard) {
    return;
  }

  const parsed = guard.safeParse(req);
  if (parsed.success) {
    return;
  }

  const message = parsed.error.issues
    .map((issue) => {
      const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    })
    .join("; ");

  throw new KieError(`Invalid Kie createTask request: ${message}`, 400, {
    issues: parsed.error.issues,
  });
}

function inferMimeType(filename: string): string | undefined {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? MIME_TYPES[ext] : undefined;
}

export function createKie(opts: KieOptions): KieProvider {
  const baseURL = opts.baseURL ?? "https://api.kie.ai";
  const uploadBaseURL = opts.uploadBaseURL ?? "https://kieai.redpandaai.co";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;
  const transport = createKieTransport({
    baseURL,
    apiKey: opts.apiKey,
    doFetch,
    timeout,
    requestFailedPrefix: "Kie request failed",
  });
  const uploadTransport = createKieTransport({
    baseURL: uploadBaseURL,
    apiKey: opts.apiKey,
    doFetch,
    timeout,
    errorPrefix: "Kie upload error",
    requestFailedPrefix: "Kie upload failed",
    jsonContentType: false,
  });
  const paygate = opts.paygate
    ? {
        ...opts.paygate,
        replayStore: opts.paygate.replayStore ?? createReplayStore(),
      }
    : undefined;
  // POST https://api.kie.ai/api/v1/jobs/createTask
  // Docs: https://docs.kie.ai/market/quickstart
  async function createTask(
    req: MediaGenerationRequest
  ): Promise<TaskResponse> {
    validateCreateTaskRequest(req);

    return await transport.postJson<TaskResponse>(
      "/api/v1/jobs/createTask",
      req
    );
  }

  // GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId={taskId}
  // Docs: https://docs.kie.ai/market/common/get-task-detail
  async function recordInfo(taskId: string): Promise<KieTaskInfo> {
    return await transport.getJson<KieTaskInfo>(
      `/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`
    );
  }

  // GET https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId={taskId}
  // Docs: https://docs.kie.ai/4o-image-api/get-4-o-image-details
  async function gpt4oImageRecordInfo(
    taskId: string
  ): Promise<Gpt4oImageRecordInfo> {
    return await transport.getJson<Gpt4oImageRecordInfo>(
      `/api/v1/gpt4o-image/record-info?taskId=${encodeURIComponent(taskId)}`
    );
  }

  // POST https://kieai.redpandaai.co/api/file-stream-upload
  // Docs: https://docs.kie.ai/file-upload-api/upload-file-stream
  async function fileStreamUpload(
    req: UploadMediaRequest
  ): Promise<UploadMediaResponse> {
    const mimeType = req.mimeType ?? inferMimeType(req.filename);
    if (!mimeType) {
      throw new KieError(
        `Cannot determine MIME type for: ${req.filename}`,
        400
      );
    }

    const formData = new FormData();
    const file = new File([req.file], req.filename, { type: mimeType });
    formData.append("file", file);
    formData.append("uploadPath", req.uploadPath);
    if (req.fileName) {
      formData.append("fileName", req.fileName);
    }

    return await uploadTransport.postForm<UploadMediaResponse>(
      "/api/file-stream-upload",
      formData
    );
  }

  // POST https://kieai.redpandaai.co/api/file-url-upload
  // Docs: https://docs.kie.ai/file-upload-api/upload-file-url
  async function fileUrlUpload(
    req: FileUrlUploadRequest
  ): Promise<UploadMediaResponse> {
    return await uploadTransport.postJson<UploadMediaResponse>(
      "/api/file-url-upload",
      {
        fileUrl: req.fileUrl,
        uploadPath: req.uploadPath,
        ...(req.fileName ? { fileName: req.fileName } : {}),
      }
    );
  }

  // POST https://kieai.redpandaai.co/api/file-base64-upload
  // Docs: https://docs.kie.ai/file-upload-api/upload-file-base-64
  async function fileBase64Upload(
    req: FileBase64UploadRequest
  ): Promise<UploadMediaResponse> {
    return await uploadTransport.postJson<UploadMediaResponse>(
      "/api/file-base64-upload",
      {
        base64Data: req.base64Data,
        uploadPath: req.uploadPath,
        ...(req.fileName ? { fileName: req.fileName } : {}),
        ...(req.mimeType ? { mimeType: req.mimeType } : {}),
      }
    );
  }

  // POST https://api.kie.ai/api/v1/common/download-url
  // Docs: https://docs.kie.ai/common-api/download-url
  async function downloadUrl(
    req: DownloadUrlRequest
  ): Promise<DownloadUrlResponse> {
    return await transport.postJson<DownloadUrlResponse>(
      "/api/v1/common/download-url",
      req
    );
  }

  // POST https://api.kie.ai/api/v1/omni/audio/create
  // Docs: https://docs.kie.ai/market/gemini-omni-audio
  async function omniAudioCreate(
    req: GeminiOmniAudioCreateRequest
  ): Promise<GeminiOmniAudioCreateResponse> {
    const response = await kieRequest<
      KieApiEnvelope<{
        audioId?: string;
        kieAudioId?: string;
        name: string;
      }>
    >(transport, {
      method: "POST",
      path: "/api/v1/omni/audio/create",
      body: req,
    });

    if (!response.data) {
      return response as GeminiOmniAudioCreateResponse;
    }

    const id = response.data.audioId ?? response.data.kieAudioId;

    if (!id) {
      return response as GeminiOmniAudioCreateResponse;
    }

    return {
      ...response,
      data: {
        ...response.data,
        audioId: response.data.audioId ?? id,
        kieAudioId: response.data.kieAudioId ?? id,
      },
    };
  }

  // POST https://api.kie.ai/api/v1/omni/character/create
  // Docs: https://docs.kie.ai/market/gemini-omni-character
  async function omniCharacterCreate(
    req: GeminiOmniCharacterCreateRequest
  ): Promise<GeminiOmniCharacterCreateResponse> {
    return kieRequest<GeminiOmniCharacterCreateResponse>(transport, {
      method: "POST",
      path: "/api/v1/omni/character/create",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/flux/kontext/generate
  // Docs: https://docs.kie.ai/flux-kontext-api/generate-or-edit-image
  async function fluxKontextGenerate(
    req: FluxKontextGenerateRequest
  ): Promise<TaskResponse> {
    return kieRequest<TaskResponse>(transport, {
      method: "POST",
      path: "/api/v1/flux/kontext/generate",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/gpt4o-image/generate
  // Docs: https://docs.kie.ai/4o-image-api/generate-4-o-image
  async function gpt4oImageGenerate(
    req: Gpt4oImageGenerateRequest
  ): Promise<TaskResponse> {
    return kieRequest<TaskResponse>(transport, {
      method: "POST",
      path: "/api/v1/gpt4o-image/generate",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/gpt4o-image/download-url
  // Docs: https://docs.kie.ai/4o-image-api/get-4-o-image-download-url
  async function gpt4oImageDownloadUrl(
    req: Gpt4oImageDownloadUrlRequest
  ): Promise<Gpt4oImageDownloadUrlResponse> {
    return await transport.postJson<Gpt4oImageDownloadUrlResponse>(
      "/api/v1/gpt4o-image/download-url",
      req
    );
  }

  // POST https://api.kie.ai/api/v1/mj/generate
  // Docs: https://docs.kie.ai/mj-api/generate-mj-image
  async function mjGenerate(req: MjGenerateRequest): Promise<TaskResponse> {
    return kieRequest<TaskResponse>(transport, {
      method: "POST",
      path: "/api/v1/mj/generate",
      body: req,
    });
  }

  // GET https://api.kie.ai/api/v1/mj/record-info?taskId={taskId}
  // Docs: https://docs.kie.ai/mj-api/get-mj-task-details
  async function mjRecordInfo(taskId: string): Promise<MjRecordInfoResponse> {
    return kieRequest<MjRecordInfoResponse>(
      `${baseURL}/api/v1/mj/record-info?taskId=${encodeURIComponent(taskId)}`,
      {
        method: "GET",
        apiKey: opts.apiKey,
        doFetch,
        timeout,
      }
    );
  }

  // POST https://api.kie.ai/api/v1/runway/generate
  // Docs: https://docs.kie.ai/runway-api/generate-ai-video
  async function runwayGenerate(
    req: RunwayGenerateRequest
  ): Promise<TaskResponse> {
    return kieRequest<TaskResponse>(transport, {
      method: "POST",
      path: "/api/v1/runway/generate",
      body: req,
    });
  }

  // POST https://api.kie.ai/api/v1/runway/extend
  // Docs: https://docs.kie.ai/runway-api/extend-ai-video
  async function runwayExtend(req: RunwayExtendRequest): Promise<TaskResponse> {
    return kieRequest<TaskResponse>(transport, {
      method: "POST",
      path: "/api/v1/runway/extend",
      body: req,
    });
  }

  // GET https://api.kie.ai/api/v1/runway/record-detail?taskId={taskId}
  // Docs: https://docs.kie.ai/runway-api/get-ai-video-details
  async function runwayRecordDetail(
    taskId: string
  ): Promise<RunwayRecordDetail> {
    return await transport.getJson<RunwayRecordDetail>(
      `/api/v1/runway/record-detail?taskId=${encodeURIComponent(taskId)}`
    );
  }

  // POST https://api.kie.ai/api/v1/aleph/generate
  // Docs: https://docs.kie.ai/runway-api/generate-aleph-video
  async function alephGenerate(
    req: AlephGenerateRequest
  ): Promise<TaskResponse> {
    return kieRequest<TaskResponse>(transport, {
      method: "POST",
      path: "/api/v1/aleph/generate",
      body: req,
    });
  }

  // GET https://api.kie.ai/api/v1/aleph/record-info?taskId={taskId}
  // Docs: https://docs.kie.ai/runway-api/get-aleph-video-details
  async function alephRecordInfo(taskId: string): Promise<AlephRecordInfo> {
    return await transport.getJson<AlephRecordInfo>(
      `/api/v1/aleph/record-info?taskId=${encodeURIComponent(taskId)}`
    );
  }

  // GET https://api.kie.ai/api/v1/flux/kontext/record-info?taskId={taskId}
  // Docs: https://docs.kie.ai/flux-kontext-api/get-image-details
  async function fluxKontextRecordInfo(
    taskId: string
  ): Promise<FluxKontextRecordInfoResponse> {
    return await transport.getJson<FluxKontextRecordInfoResponse>(
      `/api/v1/flux/kontext/record-info?taskId=${encodeURIComponent(taskId)}`
    );
  }

  // GET https://api.kie.ai/api/v1/chat/credit
  // Docs: https://docs.kie.ai/common-api/get-account-credits
  async function credit(): Promise<KieCreditsResponse> {
    try {
      return await transport.getJson<KieCreditsResponse>("/api/v1/chat/credit");
    } catch (error) {
      if (error instanceof KieError) {
        throw new KieError(
          `Failed to get credits: ${error.status}`,
          error.status,
          error.body,
          error.code
        );
      }
      throw error;
    }
  }

  return attachExamples(
    withPaidGate(
      "kie",
      {
        veo: withPaidGate(
          "kie",
          createVeoProvider(baseURL, opts.apiKey, doFetch, timeout),
          { config: paygate }
        ),
        // Nested gate so Suno task-creating leaves (api.v1.generate, wav,
        // mp4, vocalRemoval, midi, voice.generate, voice.validate,
        // voice.regenerate) match PAID_ENDPOINTS exact keys. Free
        // record-info / style helpers stay unlisted and unblocked.
        suno: withPaidGate(
          "kie",
          createSunoProvider(baseURL, opts.apiKey, doFetch, timeout),
          { config: paygate }
        ),
        chat: createChatProvider(baseURL, opts.apiKey, doFetch, timeout),
        ...createClaudeProvider(baseURL, opts.apiKey, doFetch, timeout),
        ...createGeminiProvider(baseURL, opts.apiKey, doFetch, timeout),
        ...createGemini31ProProvider(baseURL, opts.apiKey, doFetch, timeout),
        ...createGemini25FlashProvider(baseURL, opts.apiKey, doFetch, timeout),
        ...createGemini3FlashProvider(baseURL, opts.apiKey, doFetch, timeout),
        ...createGemini35FlashOpenaiProvider(
          baseURL,
          opts.apiKey,
          doFetch,
          timeout
        ),
        ...createGemini36FlashOpenaiProvider(
          baseURL,
          opts.apiKey,
          doFetch,
          timeout
        ),
        ...createGemini3ProProvider(baseURL, opts.apiKey, doFetch, timeout),
        ...createGemini25ProProvider(baseURL, opts.apiKey, doFetch, timeout),
        modelInputSchemas,
        post: (() => {
          // codex / grok / api.v1.responses share createResponsesProvider.
          // Merge api.v1.responses into the existing api.v1 namespace so the
          // explicit `api: { v1: { … } }` object does not overwrite it.
          const responses = createResponsesProvider(
            baseURL,
            opts.apiKey,
            doFetch,
            timeout
          );
          return {
            codex: responses.codex,
            grok: responses.grok,
            api: {
              v1: {
                responses: responses.api.v1.responses,
                jobs: {
                  createTask: Object.assign(createTask, {
                    schema: CreateTaskRequestSchema,
                  }),
                },
                common: {
                  downloadUrl: Object.assign(downloadUrl, {
                    schema: DownloadUrlRequestSchema,
                  }),
                },
                omni: {
                  audio: {
                    create: Object.assign(omniAudioCreate, {
                      schema: GeminiOmniAudioCreateRequestSchema,
                    }),
                  },
                  character: {
                    create: Object.assign(omniCharacterCreate, {
                      schema: GeminiOmniCharacterCreateRequestSchema,
                      responseSchema: GeminiOmniCharacterCreateResponseSchema,
                    }),
                  },
                },
                flux: {
                  kontext: {
                    generate: Object.assign(fluxKontextGenerate, {
                      schema: FluxKontextGenerateRequestSchema,
                    }),
                  },
                },
                gpt4oImage: {
                  generate: Object.assign(gpt4oImageGenerate, {
                    schema: Gpt4oImageGenerateRequestSchema,
                  }),
                  downloadUrl: Object.assign(gpt4oImageDownloadUrl, {
                    schema: Gpt4oImageDownloadUrlRequestSchema,
                  }),
                },
                mj: {
                  generate: Object.assign(mjGenerate, {
                    schema: MjGenerateRequestSchema,
                  }),
                },
                runway: {
                  generate: Object.assign(runwayGenerate, {
                    schema: RunwayGenerateRequestSchema,
                  }),
                  extend: Object.assign(runwayExtend, {
                    schema: RunwayExtendRequestSchema,
                  }),
                },
                aleph: {
                  generate: Object.assign(alephGenerate, {
                    schema: AlephGenerateRequestSchema,
                  }),
                },
              },
              fileStreamUpload: Object.assign(fileStreamUpload, {
                schema: UploadMediaRequestSchema,
              }),
              fileUrlUpload: Object.assign(fileUrlUpload, {
                schema: FileUrlUploadRequestSchema,
              }),
              fileBase64Upload: Object.assign(fileBase64Upload, {
                schema: FileBase64UploadRequestSchema,
              }),
            },
          };
        })(),
        get: {
          api: {
            v1: {
              jobs: {
                recordInfo: Object.assign(recordInfo, {
                  schema: RecordInfoRequestSchema,
                  seedance2MiniResponseSchema:
                    Seedance2MiniRecordInfoResponseSchema,
                }),
              },
              gpt4oImage: {
                recordInfo: Object.assign(gpt4oImageRecordInfo, {
                  schema: RecordInfoRequestSchema,
                  responseSchema: Gpt4oImageRecordInfoResponseSchema,
                }),
              },
              mj: {
                recordInfo: Object.assign(mjRecordInfo, {
                  schema: MjRecordInfoRequestSchema,
                  responseSchema: MjRecordInfoResponseSchema,
                }),
              },
              runway: {
                recordDetail: Object.assign(runwayRecordDetail, {
                  schema: RecordInfoRequestSchema,
                  responseSchema: RunwayRecordDetailResponseSchema,
                }),
              },
              aleph: {
                recordInfo: Object.assign(alephRecordInfo, {
                  schema: RecordInfoRequestSchema,
                  responseSchema: AlephRecordInfoResponseSchema,
                }),
              },
              flux: {
                kontext: {
                  recordInfo: Object.assign(fluxKontextRecordInfo, {
                    schema: FluxKontextRecordInfoRequestSchema,
                    responseSchema: FluxKontextRecordInfoResponseSchema,
                  }),
                },
              },
              chat: { credit },
            },
          },
        },
      },
      { config: paygate }
    )
  );
}

export async function submitMediaJob(
  provider: KieProvider,
  request: MediaGenerationRequest,
  approval?: import("./types").KieApproval
): Promise<string> {
  const result = await provider.post.api.v1.jobs.createTask(request, approval);
  if (!result.data?.taskId) {
    throw new KieError(
      `createTask failed: ${result.msg ?? "no taskId in response"}`,
      result.code
    );
  }
  return result.data.taskId;
}

export async function uploadFile(
  provider: KieProvider,
  file: Blob,
  filename: string,
  uploadPath: string = "uploads"
): Promise<string> {
  const result = await provider.post.api.fileStreamUpload({
    file,
    filename,
    uploadPath,
  });
  if (!result.data?.downloadUrl) {
    throw new KieError(
      `upload failed: no downloadUrl in response`,
      result.code
    );
  }
  return result.data.downloadUrl;
}
