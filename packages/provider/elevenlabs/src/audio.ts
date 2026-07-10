import {
  ElevenLabsAudioIsolationDeleteHistoryResponse,
  ElevenLabsAudioIsolationHistoryListRequest,
  ElevenLabsAudioIsolationHistoryListResponse,
  ElevenLabsAudioIsolationRequest,
  ElevenLabsAudioIsolationStreamRequest,
  ElevenLabsAudioNativeCreateProjectRequest,
  ElevenLabsAudioNativeCreateProjectResponse,
  ElevenLabsAudioNativeEditContentResponse,
  ElevenLabsAudioNativeProjectSettingsResponse,
  ElevenLabsAudioNativeUpdateContentFromUrlRequest,
  ElevenLabsAudioNativeUpdateProjectContentRequest,
  ElevenLabsSoundGenerationRequest,
} from "./types";
import {
  ElevenLabsAudioIsolationHistoryListRequestSchema,
  ElevenLabsAudioIsolationRequestSchema,
  ElevenLabsAudioIsolationStreamRequestSchema,
  ElevenLabsAudioNativeCreateProjectRequestSchema,
  ElevenLabsAudioNativeUpdateContentFromUrlRequestSchema,
  ElevenLabsAudioNativeUpdateProjectContentRequestSchema,
  ElevenLabsSoundGenerationRequestSchema,
} from "./zod";
import type { ElevenLabsContext } from "./transport";

export function createAudioEndpoints(ctx: ElevenLabsContext) {
  const {
    makeBinaryRequest,
    makeJsonRequest,
    makeJsonRequestAllowEmpty,
    makeMultipartJsonRequest,
    makeMultipartBinaryRequest,
    appendFormField,
    buildQueryString,
  } = ctx;

  // POST https://api.elevenlabs.io/v1/sound-generation
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert
  const soundGeneration = Object.assign(
    async (
      req: ElevenLabsSoundGenerationRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, ...body } = req;
      const query = output_format ? { output_format } : undefined;
      return makeBinaryRequest("/v1/sound-generation", body, query, signal);
    },
    { schema: ElevenLabsSoundGenerationRequestSchema }
  );

  // sig-ok: intentional
  // POST https://api.elevenlabs.io/v1/audio-isolation/stream
  // Docs: https://elevenlabs.io/docs/api-reference/audio-isolation/stream
  const audioIsolationStream = Object.assign(
    async (
      req: ElevenLabsAudioIsolationStreamRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }

      return makeMultipartBinaryRequest(
        "/v1/audio-isolation/stream",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsAudioIsolationStreamRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/audio-isolation/history
  // Docs: https://elevenlabs.io/docs/api-reference/audio-isolation/list
  const listAudioIsolationHistory = Object.assign(
    async (
      req: ElevenLabsAudioIsolationHistoryListRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsAudioIsolationHistoryListResponse> => {
      return makeJsonRequest<ElevenLabsAudioIsolationHistoryListResponse>(
        "GET",
        "/v1/audio-isolation/history",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsAudioIsolationHistoryListRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/audio-isolation/history/{historyItemId}
  // Docs: https://elevenlabs.io/docs/api-reference/audio-isolation/delete
  const deleteAudioIsolationHistoryItem = Object.assign(
    async (
      historyItemId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsAudioIsolationDeleteHistoryResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsAudioIsolationDeleteHistoryResponse>(
        "DELETE",
        `/v1/audio-isolation/history/${encodeURIComponent(historyItemId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/audio-isolation
  // Docs: https://elevenlabs.io/docs/api-reference/audio-isolation/convert
  const audioIsolation = Object.assign(
    async (
      req: ElevenLabsAudioIsolationRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }

      return makeMultipartBinaryRequest(
        "/v1/audio-isolation",
        form,
        undefined,
        signal
      );
    },
    {
      schema: ElevenLabsAudioIsolationRequestSchema,
      stream: audioIsolationStream,
      history: {
        list: listAudioIsolationHistory,
        delete: deleteAudioIsolationHistoryItem,
      },
    }
  );

  // sig-ok: intentional
  // POST https://api.elevenlabs.io/v1/audio-native/content
  // Docs: https://elevenlabs.io/docs/api-reference/audio-native/update-content
  const updateAudioNativeContentFromUrl = Object.assign(
    async (
      req: ElevenLabsAudioNativeUpdateContentFromUrlRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAudioNativeEditContentResponse> => {
      return makeJsonRequest<ElevenLabsAudioNativeEditContentResponse>(
        "POST",
        "/v1/audio-native/content",
        req,
        signal
      );
    },
    { schema: ElevenLabsAudioNativeUpdateContentFromUrlRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/audio-native/{projectId}/content
  // Docs: https://elevenlabs.io/docs/api-reference/audio-native/update-content
  const updateAudioNativeProjectContent = Object.assign(
    async (
      projectId: string,
      req: ElevenLabsAudioNativeUpdateProjectContentRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsAudioNativeEditContentResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsAudioNativeEditContentResponse>(
        `/v1/audio-native/${encodeURIComponent(projectId)}/content`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsAudioNativeUpdateProjectContentRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/audio-native/{projectId}/settings
  // Docs: https://elevenlabs.io/docs/api-reference/audio-native/get-settings
  const getAudioNativeProjectSettings = Object.assign(
    async (
      projectId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsAudioNativeProjectSettingsResponse> => {
      return makeJsonRequest<ElevenLabsAudioNativeProjectSettingsResponse>(
        "GET",
        `/v1/audio-native/${encodeURIComponent(projectId)}/settings`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/audio-native
  // Docs: https://elevenlabs.io/docs/api-reference/audio-native/create
  const audioNative = Object.assign(
    async (
      req: ElevenLabsAudioNativeCreateProjectRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAudioNativeCreateProjectResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsAudioNativeCreateProjectResponse>(
        "/v1/audio-native",
        form,
        undefined,
        signal
      );
    },
    {
      schema: ElevenLabsAudioNativeCreateProjectRequestSchema,
      content: {
        fromUrl: updateAudioNativeContentFromUrl,
        update: updateAudioNativeProjectContent,
      },
      settings: getAudioNativeProjectSettings,
    }
  );

  return {
    v1: { soundGeneration, audioIsolation, audioNative },
    get: {
      v1: {
        audioIsolation: { history: { list: listAudioIsolationHistory } },
        audioNative: { settings: getAudioNativeProjectSettings },
      },
    },
    post: { v1: { soundGeneration, audioIsolation, audioNative } },
    delete: {
      v1: {
        audioIsolation: {
          history: { delete: deleteAudioIsolationHistoryItem },
        },
      },
    },
  };
}
