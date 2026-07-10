import {
  ElevenLabsDeleteTranscriptResponse,
  ElevenLabsForcedAlignmentRequest,
  ElevenLabsForcedAlignmentResponse,
  ElevenLabsGetTranscriptResponse,
  ElevenLabsSpeechToTextRequest,
  ElevenLabsSpeechToTextResponse,
} from "./types";
import {
  ElevenLabsForcedAlignmentRequestSchema,
  ElevenLabsSpeechToTextRequestSchema,
} from "./zod";
import type { ElevenLabsContext } from "./transport";

export function createSpeechToTextEndpoints(ctx: ElevenLabsContext) {
  const {
    makeJsonRequest,
    makeJsonRequestAllowEmpty,
    makeMultipartJsonRequest,
    appendFormField,
  } = ctx;

  // POST https://api.elevenlabs.io/v1/forced-alignment
  // Docs: https://elevenlabs.io/docs/api-reference/forced-alignment/create
  const forcedAlignment = Object.assign(
    async (
      req: ElevenLabsForcedAlignmentRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsForcedAlignmentResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsForcedAlignmentResponse>(
        "/v1/forced-alignment",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsForcedAlignmentRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/speech-to-text/transcripts/{transcriptionId}
  // Docs: https://elevenlabs.io/docs/api-reference/speech-to-text/transcripts/get
  const getTranscript = Object.assign(
    async (
      transcriptionId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetTranscriptResponse> => {
      return makeJsonRequest<ElevenLabsGetTranscriptResponse>(
        "GET",
        `/v1/speech-to-text/transcripts/${encodeURIComponent(transcriptionId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // DELETE https://api.elevenlabs.io/v1/speech-to-text/transcripts/{transcriptionId}
  // Docs: https://elevenlabs.io/docs/api-reference/speech-to-text/transcripts/delete
  const deleteTranscript = Object.assign(
    async (
      transcriptionId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteTranscriptResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteTranscriptResponse>(
        "DELETE",
        `/v1/speech-to-text/transcripts/${encodeURIComponent(transcriptionId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/speech-to-text
  // Docs: https://elevenlabs.io/docs/api-reference/speech-to-text/convert
  const speechToText = Object.assign(
    async (
      req: ElevenLabsSpeechToTextRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsSpeechToTextResponse> => {
      const { enable_logging, ...body } = req;
      const query =
        enable_logging !== undefined
          ? { enable_logging: String(enable_logging) }
          : undefined;

      const form = new FormData();
      for (const [key, value] of Object.entries(body)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsSpeechToTextResponse>(
        "/v1/speech-to-text",
        form,
        query,
        signal
      );
    },
    {
      schema: ElevenLabsSpeechToTextRequestSchema,
      transcripts: {
        get: getTranscript,
        delete: deleteTranscript,
      },
    }
  );

  return {
    v1: { forcedAlignment, speechToText },
    post: { v1: { forcedAlignment, speechToText } },
  };
}
