import {
  ElevenLabsDocsRedirectResponse,
  ElevenLabsListModelsResponse,
  ElevenLabsUsageCharacterStatsRequest,
  ElevenLabsUsageCharacterStatsResponse,
} from "./types";
import { ElevenLabsUsageCharacterStatsRequestSchema } from "./zod";
import type { ElevenLabsContext } from "./transport";

export function createModelsEndpoints(ctx: ElevenLabsContext) {
  const { makeJsonRequest, makeRedirectRequest, buildQueryString } = ctx;

  // GET https://api.elevenlabs.io/docs
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-speech
  const docs = Object.assign(
    async (signal?: AbortSignal): Promise<ElevenLabsDocsRedirectResponse> => {
      return makeRedirectRequest("GET", "/docs", signal);
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/models
  // Docs: https://elevenlabs.io/docs/api-reference/models/list
  const models = Object.assign(
    async (signal?: AbortSignal): Promise<ElevenLabsListModelsResponse> => {
      return makeJsonRequest<ElevenLabsListModelsResponse>(
        "GET",
        "/v1/models",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/usage/character-stats
  // Docs: https://elevenlabs.io/docs/api-reference/usage/get
  const characterStats = Object.assign(
    async (
      req: ElevenLabsUsageCharacterStatsRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsUsageCharacterStatsResponse> => {
      return makeJsonRequest<ElevenLabsUsageCharacterStatsResponse>(
        "GET",
        "/v1/usage/character-stats",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsUsageCharacterStatsRequestSchema }
  );

  const usage = {
    characterStats,
  };

  return {
    docs,
    v1: { models, usage },
    get: { docs, v1: { models, usage } },
  };
}
