import { ElevenLabsSpeechToSpeechRequest } from "./types";
import { ElevenLabsSpeechToSpeechRequestSchema } from "./zod";
import type { ElevenLabsContext } from "./transport";

export function createSpeechToSpeechEndpoints(ctx: ElevenLabsContext) {
  const { makeMultipartBinaryRequest, appendFormField, optionalQuery } = ctx;

  // POST https://api.elevenlabs.io/v1/speech-to-speech/{voiceId}/stream
  // Docs: https://elevenlabs.io/docs/api-reference/speech-to-speech/stream
  const speechToSpeechStream = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsSpeechToSpeechRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, enable_logging, ...body } = req;
      const query = optionalQuery({
        output_format,
        enable_logging:
          enable_logging === undefined ? undefined : String(enable_logging),
      });

      const form = new FormData();
      for (const [key, value] of Object.entries(body)) {
        appendFormField(form, key, value);
      }

      return makeMultipartBinaryRequest(
        `/v1/speech-to-speech/${encodeURIComponent(voiceId)}/stream`,
        form,
        query,
        signal
      );
    },
    { schema: ElevenLabsSpeechToSpeechRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/speech-to-speech/{voiceId}
  // Docs: https://elevenlabs.io/docs/api-reference/speech-to-speech/convert
  const speechToSpeech = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsSpeechToSpeechRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, enable_logging, ...body } = req;
      const query = optionalQuery({
        output_format,
        enable_logging:
          enable_logging === undefined ? undefined : String(enable_logging),
      });

      const form = new FormData();
      for (const [key, value] of Object.entries(body)) {
        appendFormField(form, key, value);
      }

      return makeMultipartBinaryRequest(
        `/v1/speech-to-speech/${encodeURIComponent(voiceId)}`,
        form,
        query,
        signal
      );
    },
    {
      schema: ElevenLabsSpeechToSpeechRequestSchema,
      stream: speechToSpeechStream,
    }
  );

  return {
    v1: { speechToSpeech },
    post: { v1: { speechToSpeech } },
  };
}
