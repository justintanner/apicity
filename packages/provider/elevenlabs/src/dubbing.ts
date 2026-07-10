import {
  ElevenLabsCreateDubbingRequest,
  ElevenLabsCreateDubbingResponse,
  ElevenLabsDeleteDubbingResponse,
  ElevenLabsDubbingMetadata,
  ElevenLabsDubbingResourceResponse,
  ElevenLabsDubbingTranscriptsResponse,
  ElevenLabsListDubbingRequest,
  ElevenLabsListDubbingResponse,
} from "./types";
import {
  ElevenLabsCreateDubbingRequestSchema,
  ElevenLabsListDubbingRequestSchema,
} from "./zod";
import type { ElevenLabsContext } from "./transport";

export function createDubbingEndpoints(ctx: ElevenLabsContext) {
  const {
    makeGetBinaryRequest,
    makeJsonRequest,
    makeMultipartJsonRequest,
    appendFormField,
    buildQueryString,
  } = ctx;

  // GET https://api.elevenlabs.io/v1/dubbing
  // Docs: https://elevenlabs.io/docs/api-reference/dubbing/list
  const listDubbing = Object.assign(
    async (
      req: ElevenLabsListDubbingRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListDubbingResponse> => {
      return makeJsonRequest<ElevenLabsListDubbingResponse>(
        "GET",
        "/v1/dubbing",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListDubbingRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/dubbing
  // Docs: https://elevenlabs.io/docs/api-reference/dubbing/create
  const createDubbing = Object.assign(
    async (
      req: ElevenLabsCreateDubbingRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateDubbingResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsCreateDubbingResponse>(
        "/v1/dubbing",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsCreateDubbingRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/dubbing/{dubbingId}
  // Docs: https://elevenlabs.io/docs/api-reference/dubbing/get
  const getDubbing = Object.assign(
    async (
      dubbingId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDubbingMetadata> => {
      return makeJsonRequest<ElevenLabsDubbingMetadata>(
        "GET",
        `/v1/dubbing/${encodeURIComponent(dubbingId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // DELETE https://api.elevenlabs.io/v1/dubbing/{dubbingId}
  // Docs: https://elevenlabs.io/docs/api-reference/dubbing/delete
  const deleteDubbing = Object.assign(
    async (
      dubbingId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteDubbingResponse> => {
      return makeJsonRequest<ElevenLabsDeleteDubbingResponse>(
        "DELETE",
        `/v1/dubbing/${encodeURIComponent(dubbingId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/dubbing/resource/{dubbingId}
  // Docs: https://elevenlabs.io/docs/api-reference/dubbing/resources/get-resource
  const getDubbingResource = Object.assign(
    async (
      dubbingId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDubbingResourceResponse> => {
      return makeJsonRequest<ElevenLabsDubbingResourceResponse>(
        "GET",
        `/v1/dubbing/resource/${encodeURIComponent(dubbingId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/dubbing/{dubbingId}/audio/{languageCode}
  // Docs: https://elevenlabs.io/docs/api-reference/dubbing/audio/get
  const getDubbingAudio = Object.assign(
    async (
      dubbingId: string,
      languageCode: string,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeGetBinaryRequest(
        `/v1/dubbing/${encodeURIComponent(dubbingId)}/audio/${encodeURIComponent(
          languageCode
        )}`,
        "",
        signal
      );
    },
    { schema: undefined }
  );

  // sig-ok: intentional
  // GET https://api.elevenlabs.io/v1/dubbing/{dubbingId}/transcripts/{languageCode}/format/{formatType}
  // Docs: https://elevenlabs.io/docs/api-reference/dubbing/transcripts/get
  const getDubbingTranscript = Object.assign(
    async (
      dubbingId: string,
      languageCode: string,
      formatType: "srt" | "webvtt" | "json",
      signal?: AbortSignal
    ): Promise<ElevenLabsDubbingTranscriptsResponse> => {
      return makeJsonRequest<ElevenLabsDubbingTranscriptsResponse>(
        "GET",
        `/v1/dubbing/${encodeURIComponent(dubbingId)}/transcripts/${encodeURIComponent(
          languageCode
        )}/format/${encodeURIComponent(formatType)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  const dubbing = {
    list: listDubbing,
    create: createDubbing,
    get: getDubbing,
    delete: deleteDubbing,
    audio: {
      get: getDubbingAudio,
    },
    resource: {
      get: getDubbingResource,
    },
    transcripts: {
      get: getDubbingTranscript,
    },
  };

  return {
    v1: { dubbing },
  };
}
