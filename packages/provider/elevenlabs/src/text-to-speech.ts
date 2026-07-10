import {
  ElevenLabsAudioWithTimestampsResponse,
  ElevenLabsCreateVoiceFromPreviewRequest,
  ElevenLabsStreamingAudioChunkWithTimestampsResponse,
  ElevenLabsTextToDialogueRequest,
  ElevenLabsTextToSpeechRequest,
  ElevenLabsVoice,
  ElevenLabsVoiceDesignRequest,
  ElevenLabsVoicePreviewsResponse,
  ElevenLabsVoiceRemixRequest,
} from "./types";
import {
  ElevenLabsCreateVoiceFromPreviewRequestSchema,
  ElevenLabsTextToDialogueRequestSchema,
  ElevenLabsTextToSpeechRequestSchema,
  ElevenLabsVoiceDesignRequestSchema,
  ElevenLabsVoiceRemixRequestSchema,
} from "./zod";
import type { ElevenLabsContext } from "./transport";

export function createTextToSpeechEndpoints(ctx: ElevenLabsContext) {
  const {
    makeBinaryRequest,
    makeGetBinaryRequest,
    makeJsonRequest,
    optionalQuery,
    decodeNdjson,
    buildQueryString,
  } = ctx;

  // sig-ok: intentional
  // POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream/with-timestamps
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-speech/stream-with-timestamps
  const textToSpeechStreamWithTimestamps = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsTextToSpeechRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsStreamingAudioChunkWithTimestampsResponse[]> => {
      const { output_format, enable_logging, ...body } = req;
      const query = optionalQuery({
        output_format,
        enable_logging:
          enable_logging === undefined ? undefined : String(enable_logging),
      });
      const buffer = await makeBinaryRequest(
        `/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream/with-timestamps`,
        body,
        query,
        signal
      );
      return decodeNdjson<ElevenLabsStreamingAudioChunkWithTimestampsResponse>(
        buffer
      );
    },
    { schema: ElevenLabsTextToSpeechRequestSchema }
  );

  // sig-ok: intentional
  // POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-speech/stream
  const textToSpeechStream = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsTextToSpeechRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, enable_logging, ...body } = req;
      const query = optionalQuery({
        output_format,
        enable_logging:
          enable_logging === undefined ? undefined : String(enable_logging),
      });
      return makeBinaryRequest(
        `/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream`,
        body,
        query,
        signal
      );
    },
    {
      schema: ElevenLabsTextToSpeechRequestSchema,
      withTimestamps: textToSpeechStreamWithTimestamps,
    }
  );

  // POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/with-timestamps
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
  const textToSpeechWithTimestamps = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsTextToSpeechRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAudioWithTimestampsResponse> => {
      const { output_format, enable_logging, ...body } = req;
      const query = buildQueryString({ output_format, enable_logging });
      return makeJsonRequest<ElevenLabsAudioWithTimestampsResponse>(
        "POST",
        `/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps`,
        body,
        signal,
        query
      );
    },
    { schema: ElevenLabsTextToSpeechRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-speech/convert
  const textToSpeech = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsTextToSpeechRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, enable_logging, ...body } = req;
      const query = optionalQuery({
        output_format,
        enable_logging:
          enable_logging === undefined ? undefined : String(enable_logging),
      });
      return makeBinaryRequest(
        `/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
        body,
        query,
        signal
      );
    },
    {
      schema: ElevenLabsTextToSpeechRequestSchema,
      stream: textToSpeechStream,
      withTimestamps: textToSpeechWithTimestamps,
    }
  );

  // sig-ok: intentional
  // POST https://api.elevenlabs.io/v1/text-to-dialogue/stream/with-timestamps
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-dialogue/stream-with-timestamps
  const textToDialogueStreamWithTimestamps = Object.assign(
    async (
      req: ElevenLabsTextToDialogueRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsStreamingAudioChunkWithTimestampsResponse[]> => {
      const { output_format, enable_logging, ...body } = req;
      const query = optionalQuery({
        output_format,
        enable_logging:
          enable_logging === undefined ? undefined : String(enable_logging),
      });
      const buffer = await makeBinaryRequest(
        "/v1/text-to-dialogue/stream/with-timestamps",
        body,
        query,
        signal
      );
      return decodeNdjson<ElevenLabsStreamingAudioChunkWithTimestampsResponse>(
        buffer
      );
    },
    { schema: ElevenLabsTextToDialogueRequestSchema }
  );

  // sig-ok: intentional
  // POST https://api.elevenlabs.io/v1/text-to-dialogue/stream
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-dialogue/stream
  const textToDialogueStream = Object.assign(
    async (
      req: ElevenLabsTextToDialogueRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, enable_logging, ...body } = req;
      const query = optionalQuery({
        output_format,
        enable_logging:
          enable_logging === undefined ? undefined : String(enable_logging),
      });
      return makeBinaryRequest(
        "/v1/text-to-dialogue/stream",
        body,
        query,
        signal
      );
    },
    {
      schema: ElevenLabsTextToDialogueRequestSchema,
      withTimestamps: textToDialogueStreamWithTimestamps,
    }
  );

  // POST https://api.elevenlabs.io/v1/text-to-dialogue/with-timestamps
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert-with-timestamps
  const textToDialogueWithTimestamps = Object.assign(
    async (
      req: ElevenLabsTextToDialogueRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAudioWithTimestampsResponse> => {
      const { output_format, enable_logging, ...body } = req;
      const query = buildQueryString({ output_format, enable_logging });
      return makeJsonRequest<ElevenLabsAudioWithTimestampsResponse>(
        "POST",
        "/v1/text-to-dialogue/with-timestamps",
        body,
        signal,
        query
      );
    },
    { schema: ElevenLabsTextToDialogueRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/text-to-dialogue
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert
  const textToDialogue = Object.assign(
    async (
      req: ElevenLabsTextToDialogueRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, enable_logging, ...body } = req;
      const query = optionalQuery({
        output_format,
        enable_logging:
          enable_logging === undefined ? undefined : String(enable_logging),
      });
      return makeBinaryRequest("/v1/text-to-dialogue", body, query, signal);
    },
    {
      schema: ElevenLabsTextToDialogueRequestSchema,
      stream: textToDialogueStream,
      withTimestamps: textToDialogueWithTimestamps,
    }
  );

  // POST https://api.elevenlabs.io/v1/text-to-voice
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-voice/create
  const textToVoiceCreateVoice = Object.assign(
    async (
      req: ElevenLabsCreateVoiceFromPreviewRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsVoice> => {
      return makeJsonRequest<ElevenLabsVoice>(
        "POST",
        "/v1/text-to-voice",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateVoiceFromPreviewRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/text-to-voice/design
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-voice/design
  const textToVoiceDesign = Object.assign(
    async (
      req: ElevenLabsVoiceDesignRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsVoicePreviewsResponse> => {
      const { output_format, ...body } = req;
      const query = optionalQuery({ output_format });
      return makeJsonRequest<ElevenLabsVoicePreviewsResponse>(
        "POST",
        "/v1/text-to-voice/design",
        Object.keys(body).length > 0 ? body : undefined,
        signal,
        query ? buildQueryString(query) : ""
      );
    },
    { schema: ElevenLabsVoiceDesignRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/text-to-voice/{voiceId}/remix
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-voice/remix
  const textToVoiceRemix = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsVoiceRemixRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsVoicePreviewsResponse> => {
      const { output_format, ...body } = req;
      const query = optionalQuery({ output_format });
      return makeJsonRequest<ElevenLabsVoicePreviewsResponse>(
        "POST",
        `/v1/text-to-voice/${encodeURIComponent(voiceId)}/remix`,
        Object.keys(body).length > 0 ? body : undefined,
        signal,
        query ? buildQueryString(query) : ""
      );
    },
    { schema: ElevenLabsVoiceRemixRequestSchema }
  );

  // sig-ok: intentional
  // GET https://api.elevenlabs.io/v1/text-to-voice/{generatedVoiceId}/stream
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-voice/stream
  const textToVoiceStream = Object.assign(
    async (
      generatedVoiceId: string,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeGetBinaryRequest(
        `/v1/text-to-voice/${encodeURIComponent(generatedVoiceId)}/stream`,
        "",
        signal
      );
    },
    { schema: undefined }
  );

  // Callable text-to-voice namespace: create (POST) is the base call, with
  // design/remix (POST) and stream (GET) attached as sub-methods.
  const textToVoice = Object.assign(textToVoiceCreateVoice, {
    design: textToVoiceDesign,
    remix: textToVoiceRemix,
    stream: textToVoiceStream,
  });

  return {
    v1: { textToSpeech, textToDialogue, textToVoice },
    get: { v1: { textToVoice: { stream: textToVoiceStream } } },
    post: { v1: { textToSpeech, textToDialogue, textToVoice } },
  };
}
