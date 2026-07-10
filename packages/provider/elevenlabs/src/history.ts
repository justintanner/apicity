import {
  ElevenLabsHistoryDeleteResponse,
  ElevenLabsHistoryDownloadRequest,
  ElevenLabsHistoryItem,
  ElevenLabsHistoryListRequest,
  ElevenLabsHistoryListResponse,
} from "./types";
import {
  ElevenLabsHistoryDownloadRequestSchema,
  ElevenLabsHistoryListRequestSchema,
} from "./zod";
import type { ElevenLabsContext } from "./transport";

export function createHistoryEndpoints(ctx: ElevenLabsContext) {
  const {
    makeBinaryRequest,
    makeGetBinaryRequest,
    makeJsonRequest,
    makeJsonRequestAllowEmpty,
    buildQueryString,
  } = ctx;

  // GET https://api.elevenlabs.io/v1/history
  // Docs: https://elevenlabs.io/docs/api-reference/history/get-generated-items
  const listHistory = Object.assign(
    async (
      req: ElevenLabsHistoryListRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsHistoryListResponse> => {
      return makeJsonRequest<ElevenLabsHistoryListResponse>(
        "GET",
        "/v1/history",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsHistoryListRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/history/{historyItemId}
  // Docs: https://elevenlabs.io/docs/api-reference/history/get-history-item-by-id
  const getHistoryItem = Object.assign(
    async (
      historyItemId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsHistoryItem> => {
      return makeJsonRequest<ElevenLabsHistoryItem>(
        "GET",
        `/v1/history/${encodeURIComponent(historyItemId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // DELETE https://api.elevenlabs.io/v1/history/{historyItemId}
  // Docs: https://elevenlabs.io/docs/api-reference/history/delete-history-item
  const deleteHistoryItem = Object.assign(
    async (
      historyItemId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsHistoryDeleteResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsHistoryDeleteResponse>(
        "DELETE",
        `/v1/history/${encodeURIComponent(historyItemId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/history/{historyItemId}/audio
  // Docs: https://elevenlabs.io/docs/api-reference/history/get-audio-from-history-item
  const getHistoryItemAudio = Object.assign(
    async (
      historyItemId: string,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeGetBinaryRequest(
        `/v1/history/${encodeURIComponent(historyItemId)}/audio`,
        "",
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/history/download
  // Docs: https://elevenlabs.io/docs/api-reference/history/download-history-items
  const downloadHistory = Object.assign(
    async (
      req: ElevenLabsHistoryDownloadRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeBinaryRequest("/v1/history/download", req, undefined, signal);
    },
    { schema: ElevenLabsHistoryDownloadRequestSchema }
  );

  return {
    v1: {
      history: {
        list: listHistory,
        get: getHistoryItem,
        delete: deleteHistoryItem,
        audio: getHistoryItemAudio,
        download: downloadHistory,
      },
    },
    get: {
      v1: {
        history: {
          list: listHistory,
          get: getHistoryItem,
          audio: getHistoryItemAudio,
        },
      },
    },
    post: { v1: { history: { download: downloadHistory } } },
    delete: { v1: { history: { delete: deleteHistoryItem } } },
  };
}
