import {
  ElevenLabsCreateSpeechEngineRequest,
  ElevenLabsDeleteSpeechEngineResponse,
  ElevenLabsListSpeechEnginesRequest,
  ElevenLabsListSpeechEnginesResponse,
  ElevenLabsSpeechEngineResponse,
  ElevenLabsUpdateSpeechEngineRequest,
} from "./types";
import {
  ElevenLabsCreateSpeechEngineRequestSchema,
  ElevenLabsListSpeechEnginesRequestSchema,
  ElevenLabsUpdateSpeechEngineRequestSchema,
} from "./zod";
import type { ElevenLabsContext } from "./transport";

export function createSpeechEngineEndpoints(ctx: ElevenLabsContext) {
  const { makeJsonRequest, makeJsonRequestAllowEmpty, buildQueryString } = ctx;

  // GET https://api.elevenlabs.io/v1/speech-engine
  // Docs: https://elevenlabs.io/docs/api-reference/speech-engine/list
  const listSpeechEngines = Object.assign(
    async (
      req: ElevenLabsListSpeechEnginesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListSpeechEnginesResponse> => {
      return makeJsonRequest<ElevenLabsListSpeechEnginesResponse>(
        "GET",
        "/v1/speech-engine",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListSpeechEnginesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/speech-engine
  // Docs: https://elevenlabs.io/docs/api-reference/speech-engine/create
  const createSpeechEngine = Object.assign(
    async (
      req: ElevenLabsCreateSpeechEngineRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsSpeechEngineResponse> => {
      return makeJsonRequest<ElevenLabsSpeechEngineResponse>(
        "POST",
        "/v1/speech-engine",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateSpeechEngineRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/speech-engine/{speechEngineId}
  // Docs: https://elevenlabs.io/docs/api-reference/speech-engine/get
  const getSpeechEngine = Object.assign(
    async (
      speechEngineId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsSpeechEngineResponse> => {
      return makeJsonRequest<ElevenLabsSpeechEngineResponse>(
        "GET",
        `/v1/speech-engine/${encodeURIComponent(speechEngineId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/speech-engine/{speechEngineId}
  // Docs: https://elevenlabs.io/docs/api-reference/speech-engine/update
  const updateSpeechEngine = Object.assign(
    async (
      speechEngineId: string,
      req: ElevenLabsUpdateSpeechEngineRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsSpeechEngineResponse> => {
      return makeJsonRequest<ElevenLabsSpeechEngineResponse>(
        "PATCH",
        `/v1/speech-engine/${encodeURIComponent(speechEngineId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateSpeechEngineRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/speech-engine/{speechEngineId}
  // Docs: https://elevenlabs.io/docs/api-reference/speech-engine/delete
  const deleteSpeechEngine = Object.assign(
    async (
      speechEngineId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteSpeechEngineResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteSpeechEngineResponse>(
        "DELETE",
        `/v1/speech-engine/${encodeURIComponent(speechEngineId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  const speechEngine = {
    list: listSpeechEngines,
    create: createSpeechEngine,
    get: getSpeechEngine,
    update: updateSpeechEngine,
    delete: deleteSpeechEngine,
  };

  return {
    v1: { speechEngine },
    get: {
      v1: { speechEngine: { list: listSpeechEngines, get: getSpeechEngine } },
    },
    post: { v1: { speechEngine: { create: createSpeechEngine } } },
    patch: { v1: { speechEngine: { update: updateSpeechEngine } } },
    delete: { v1: { speechEngine: { delete: deleteSpeechEngine } } },
  };
}
