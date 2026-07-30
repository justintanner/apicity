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
} from "./types";
import type { z } from "zod";
import type { FluxKontextRecordInfoResponse, KieMediaModel } from "./zod";
import {
  CreateTaskRequestSchema,
  DownloadUrlRequestSchema,
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
  FluxKontextRecordInfoRequestSchema,
  FluxKontextRecordInfoResponseSchema,
  KlingVideoRequestSchema,
  KlingMotionControlRequestSchema,
  KlingV3TurboImageToVideoRequestSchema,
  KlingV3TurboTextToVideoRequestSchema,
  GrokTextToImageRequestSchema,
  GrokImageToImageRequestSchema,
  GrokTextToVideoRequestSchema,
  GrokImageToVideoRequestSchema,
  GrokVideo15PreviewRequestSchema,
  NanoBananaProRequestSchema,
  NanoBanana2RequestSchema,
  GptImageToImageRequestSchema,
  GptImage2ImageToImageRequestSchema,
  GptImage2TextToImageRequestSchema,
  GrokVideoExtendRequestSchema,
  GrokVideoUpscaleRequestSchema,
  RecordInfoRequestSchema,
  Gpt4oImageRecordInfoResponseSchema,
  Seedance2MiniRecordInfoResponseSchema,
  Seedance2MiniRequestSchema,
  PixverseV6TextToVideoRequestSchema,
  PixverseV6ImageToVideoRequestSchema,
  PixverseV6TransitionRequestSchema,
  PixverseV6ExtendRequestSchema,
  PixverseV6ReferenceToVideoRequestSchema,
  SeedreamImageToImageRequestSchema,
  SeedreamTextToImageRequestSchema,
  SeedreamProImageToImageRequestSchema,
  SeedreamProTextToImageRequestSchema,
  Qwen2TextToImageRequestSchema,
  Qwen2ImageEditRequestSchema,
  Seedance2FastRequestSchema,
  Seedance2RequestSchema,
  Wan27ImageToVideoRequestSchema,
  Wan27TextToVideoRequestSchema,
  Wan27RefToVideoRequestSchema,
  Wan27VideoEditRequestSchema,
  Wan27ImageRequestSchema,
  Wan27ImageProRequestSchema,
  HappyHorseTextToVideoRequestSchema,
  HappyHorseImageToVideoRequestSchema,
  HappyHorseReferenceToVideoRequestSchema,
  HappyHorseVideoEditRequestSchema,
  HappyHorse11TextToVideoRequestSchema,
  HappyHorse11ImageToVideoRequestSchema,
  HappyHorse11ReferenceToVideoRequestSchema,
  Omnihuman15RequestSchema,
  VolcengineVideoToVideoLipSyncRequestSchema,
  ElevenLabsAudioIsolationRequestSchema,
  ElevenLabsTextToDialogueV3RequestSchema,
  ElevenLabsTextToSpeechMultilingualV2RequestSchema,
  ElevenLabsTextToSpeechTurbo25RequestSchema,
  ElevenLabsSoundEffectV2RequestSchema,
  SoraWatermarkRequestSchema,
} from "./zod";
import { modelInputSchemas } from "./model-schemas";
import { createVeoProvider } from "./veo";
import { createSunoProvider } from "./suno";
import { createChatProvider } from "./chat";
import { createClaudeProvider } from "./claude";
import { createGeminiProvider } from "./gemini";
import { createResponsesProvider } from "./responses";
import { createGemini31ProProvider } from "./gemini-31-pro";
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
// process. Each row is a model id and the schema that rejects a malformed
// payload for it; a model with no row here is passed through untouched.
//
// The key is KieMediaModel, not string, so a mistyped id fails tsc here rather
// than silently never matching the .find() below — which would leave the guard
// dormant and let an unvalidated payload reach the network.
//
// Membership rule, readable from this one list: every id in KIE_MEDIA_MODELS
// has a row here. There is no second list and no exemption map — a model is
// either in the catalogue and guarded, or not in the catalogue.
// `EveryKieMediaModelIsDecided` below is what enforces it: a catalogue id with
// no row stops that type from compiling and tsc names the id. So a new model
// cannot be added to KIE_MEDIA_MODELS and left unvalidated by omission.
//
// The rule was previously "in exactly one of this table or
// CREATE_TASK_GUARD_EXEMPTIONS", with the exemption entry pointing at a
// reviewed reason key. Both are gone: the last exempt id gained its row in the
// same commit that deleted them, and an empty map left standing would
// pre-authorise the next exemption instead of forcing it through review. If a
// model genuinely must reach kie.ai unvalidated, that needs a new mechanism
// argued for in its own diff — not a one-line entry in scaffolding that was
// already there.
//
// `as const satisfies` rather than a `:` annotation: the annotation checks the
// rows but erases their literals, and the pin needs to read the guarded ids
// back out. The per-row check on the id is unchanged.
//
// A row's schema may be `.refine`-wrapped — the two bytedance/seedance-2 rows
// are the first such rows the table holds, and three of the six wan/2-7 rows
// are the next. Two things were measured on them rather than assumed:
// `z.ZodType` in the `satisfies` clause accepts the wrapped schema, because
// zod 4 keeps `.refine()` a `ZodObject` carrying a check rather than the
// `ZodEffects` zod 3 returned, so no row needs unwrapping to an inner
// `*RequestObjectSchema`; and `.safeParse` still reports the refinement's own
// `path`, so a cross-field failure reaches the `KieError` message with the
// field named (`input.first_frame_url: …`) rather than as a pathless string.
export const CREATE_TASK_GUARDS = [
  ["kling-3.0/video", KlingVideoRequestSchema],
  ["kling-3.0/motion-control", KlingMotionControlRequestSchema],
  ["kling/v3-turbo-image-to-video", KlingV3TurboImageToVideoRequestSchema],
  ["kling/v3-turbo-text-to-video", KlingV3TurboTextToVideoRequestSchema],
  ["grok-imagine/text-to-image", GrokTextToImageRequestSchema],
  ["grok-imagine/image-to-image", GrokImageToImageRequestSchema],
  ["grok-imagine/text-to-video", GrokTextToVideoRequestSchema],
  ["grok-imagine/image-to-video", GrokImageToVideoRequestSchema],
  ["grok-imagine-video-1-5-preview", GrokVideo15PreviewRequestSchema],
  ["nano-banana-pro", NanoBananaProRequestSchema],
  ["nano-banana-2", NanoBanana2RequestSchema],
  ["gpt-image/1.5-image-to-image", GptImageToImageRequestSchema],
  ["gpt-image-2-image-to-image", GptImage2ImageToImageRequestSchema],
  ["gpt-image-2-text-to-image", GptImage2TextToImageRequestSchema],
  ["seedream/5-lite-image-to-image", SeedreamImageToImageRequestSchema],
  ["seedream/5-lite-text-to-image", SeedreamTextToImageRequestSchema],
  ["seedream/5-pro-image-to-image", SeedreamProImageToImageRequestSchema],
  ["seedream/5-pro-text-to-image", SeedreamProTextToImageRequestSchema],
  ["grok-imagine/extend", GrokVideoExtendRequestSchema],
  ["grok-imagine/upscale", GrokVideoUpscaleRequestSchema],
  ["qwen2/text-to-image", Qwen2TextToImageRequestSchema],
  ["qwen2/image-edit", Qwen2ImageEditRequestSchema],
  ["bytedance/seedance-2-fast", Seedance2FastRequestSchema],
  ["bytedance/seedance-2", Seedance2RequestSchema],
  ["bytedance/seedance-2-mini", Seedance2MiniRequestSchema],
  ["wan/2-7-image-to-video", Wan27ImageToVideoRequestSchema],
  ["wan/2-7-text-to-video", Wan27TextToVideoRequestSchema],
  ["wan/2-7-r2v", Wan27RefToVideoRequestSchema],
  ["wan/2-7-videoedit", Wan27VideoEditRequestSchema],
  ["wan/2-7-image", Wan27ImageRequestSchema],
  ["wan/2-7-image-pro", Wan27ImageProRequestSchema],
  ["happyhorse/text-to-video", HappyHorseTextToVideoRequestSchema],
  ["happyhorse/image-to-video", HappyHorseImageToVideoRequestSchema],
  ["happyhorse/reference-to-video", HappyHorseReferenceToVideoRequestSchema],
  ["happyhorse/video-edit", HappyHorseVideoEditRequestSchema],
  ["happyhorse-1-1/text-to-video", HappyHorse11TextToVideoRequestSchema],
  ["happyhorse-1-1/image-to-video", HappyHorse11ImageToVideoRequestSchema],
  [
    "happyhorse-1-1/reference-to-video",
    HappyHorse11ReferenceToVideoRequestSchema,
  ],
  ["omnihuman-1-5", Omnihuman15RequestSchema],
  [
    "volcengine/video-to-video-lip-sync",
    VolcengineVideoToVideoLipSyncRequestSchema,
  ],
  ["gemini-omni-video", GeminiOmniVideoRequestSchema],
  ["elevenlabs/audio-isolation", ElevenLabsAudioIsolationRequestSchema],
  ["elevenlabs/text-to-dialogue-v3", ElevenLabsTextToDialogueV3RequestSchema],
  [
    "elevenlabs/text-to-speech-multilingual-v2",
    ElevenLabsTextToSpeechMultilingualV2RequestSchema,
  ],
  [
    "elevenlabs/text-to-speech-turbo-2-5",
    ElevenLabsTextToSpeechTurbo25RequestSchema,
  ],
  ["elevenlabs/sound-effect-v2", ElevenLabsSoundEffectV2RequestSchema],
  ["sora-watermark-remover", SoraWatermarkRequestSchema],
  ["pixverse-v6/text-to-video", PixverseV6TextToVideoRequestSchema],
  ["pixverse-v6/image-to-video", PixverseV6ImageToVideoRequestSchema],
  ["pixverse-v6/transition", PixverseV6TransitionRequestSchema],
  ["pixverse-v6/extend", PixverseV6ExtendRequestSchema],
  ["pixverse-v6/reference-to-video", PixverseV6ReferenceToVideoRequestSchema],
] as const satisfies ReadonlyArray<readonly [KieMediaModel, z.ZodType]>;

type GuardedKieMediaModel = (typeof CREATE_TASK_GUARDS)[number][0];
type UndecidedKieMediaModel = Exclude<KieMediaModel, GuardedKieMediaModel>;

type AssertTrue<T extends true> = T;

// The compile pin. While the table above covers KIE_MEDIA_MODELS exactly,
// UndecidedKieMediaModel is `never` and the argument resolves to `true`. Add a
// model to KIE_MEDIA_MODELS and give it no row and it resolves to that model's
// literal type instead, which fails AssertTrue's `extends true` constraint, so
// this type stops compiling and tsc names the id:
//   Type '"pixverse-v7/text-to-video"' does not satisfy the constraint 'true'.
// The AssertTrue wrapper is load-bearing — a bare type alias resolving to a
// model literal is not by itself an error. Same idiom as zod.ts's catalogue
// pins and responses.ts's model-passthrough pins, five of which likewise have
// no importer.
//
// The `export` is also load-bearing, and not for consumers: nothing imports
// this. Drop it and @typescript-eslint/no-unused-vars fails the build, which
// invites deleting the pin instead — and deleting it is silent, because no
// test imports it either. Leave it exported.
export type EveryKieMediaModelIsDecided = AssertTrue<
  [UndecidedKieMediaModel] extends [never] ? true : UndecidedKieMediaModel
>;

function validateCreateTaskRequest(req: MediaGenerationRequest): void {
  const guard = CREATE_TASK_GUARDS.find(([model]) => model === req.model);
  if (!guard) {
    return;
  }

  const parsed = guard[1].safeParse(req);
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
        suno: createSunoProvider(baseURL, opts.apiKey, doFetch, timeout),
        chat: createChatProvider(baseURL, opts.apiKey, doFetch, timeout),
        ...createClaudeProvider(baseURL, opts.apiKey, doFetch, timeout),
        ...createGeminiProvider(baseURL, opts.apiKey, doFetch, timeout),
        ...createGemini31ProProvider(baseURL, opts.apiKey, doFetch, timeout),
        modelInputSchemas,
        post: {
          ...createResponsesProvider(baseURL, opts.apiKey, doFetch, timeout),
          api: {
            v1: {
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
        },
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
