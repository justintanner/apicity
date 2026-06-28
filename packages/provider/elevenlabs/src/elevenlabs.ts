import {
  ElevenLabsCreatePvcVoiceResponse,
  ElevenLabsDeleteVoiceSampleResponse,
  ElevenLabsDocsRedirectResponse,
  ElevenLabsGetPvcVoiceCaptchaResponse,
  ElevenLabsGetVoiceRequest,
  ElevenLabsListModelsResponse,
  ElevenLabsListVoicesRequest,
  ElevenLabsListVoicesResponse,
  ElevenLabsOptions,
  ElevenLabsCreatePvcVoiceRequest,
  ElevenLabsPvcTrainRequest,
  ElevenLabsPvcTrainResponse,
  ElevenLabsPvcVoiceCaptchaRequest,
  ElevenLabsPvcVoiceCaptchaResponse,
  ElevenLabsPvcManualVerificationRequest,
  ElevenLabsPvcManualVerificationResponse,
  ElevenLabsPvcVoiceSampleWaveformResponse,
  ElevenLabsSpeakerAudioResponse,
  ElevenLabsSoundGenerationRequest,
  ElevenLabsTextToDialogueRequest,
  ElevenLabsTextToSpeechRequest,
  ElevenLabsSpeechToTextRequest,
  ElevenLabsSpeechToTextResponse,
  ElevenLabsStartSpeakerSeparationResponse,
  ElevenLabsUpdatePvcVoiceSampleRequest,
  ElevenLabsUpdatePvcVoiceSampleResponse,
  ElevenLabsUserSubscriptionResponse,
  ElevenLabsVoice,
  ElevenLabsVoiceSettings,
  ElevenLabsWorkspaceAnalyticsQueryResponse,
  ElevenLabsWorkspaceAnalyticsRequestsRequest,
  ElevenLabsWorkspaceAnalyticsRequestsResponse,
  ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequest,
  ElevenLabsCreateAgentRequest,
  ElevenLabsCreateAgentResponse,
  ElevenLabsGetAgentRequest,
  ElevenLabsGetAgentResponse,
  ElevenLabsListAgentsRequest,
  ElevenLabsListAgentsResponse,
  ElevenLabsUpdateAgentRequest,
  ElevenLabsDeleteAgentResponse,
  ElevenLabsGetAgentWidgetRequest,
  ElevenLabsGetAgentWidgetResponse,
  ElevenLabsGetAgentLinkResponse,
  ElevenLabsCreateToolRequest,
  ElevenLabsCreateToolResponse,
  ElevenLabsListToolsRequest,
  ElevenLabsListToolsResponse,
  ElevenLabsToolResponse,
  ElevenLabsUpdateToolRequest,
  ElevenLabsDeleteToolResponse,
  ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromUrlResponse,
  ElevenLabsCreateKnowledgeBaseDocumentFromTextRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromTextResponse,
  ElevenLabsCreateKnowledgeBaseDocumentFromFileRequest,
  ElevenLabsCreateKnowledgeBaseDocumentFromFileResponse,
  ElevenLabsListKnowledgeBaseDocumentsRequest,
  ElevenLabsListKnowledgeBaseDocumentsResponse,
  ElevenLabsGetKnowledgeBaseDocumentRequest,
  ElevenLabsGetKnowledgeBaseDocumentResponse,
  ElevenLabsDeleteKnowledgeBaseDocumentRequest,
  ElevenLabsDeleteKnowledgeBaseDocumentResponse,
  ElevenLabsListConversationsRequest,
  ElevenLabsListConversationsResponse,
  ElevenLabsGetConversationRequest,
  ElevenLabsGetConversationResponse,
  ElevenLabsDeleteConversationResponse,
  ElevenLabsGetSignedUrlRequest,
  ElevenLabsGetSignedUrlResponse,
  ElevenLabsProvider,
  ElevenLabsError,
} from "./types";
import {
  ElevenLabsCreatePvcVoiceRequestSchema,
  ElevenLabsGetVoiceRequestSchema,
  ElevenLabsListVoicesRequestSchema,
  ElevenLabsPvcTrainRequestSchema,
  ElevenLabsPvcVoiceCaptchaRequestSchema,
  ElevenLabsPvcManualVerificationRequestSchema,
  ElevenLabsSoundGenerationRequestSchema,
  ElevenLabsTextToDialogueRequestSchema,
  ElevenLabsTextToSpeechRequestSchema,
  ElevenLabsSpeechToTextRequestSchema,
  ElevenLabsUpdatePvcVoiceSampleRequestSchema,
  ElevenLabsWorkspaceAnalyticsRequestsRequestSchema,
  ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequestSchema,
  ElevenLabsCreateAgentRequestSchema,
  ElevenLabsGetAgentRequestSchema,
  ElevenLabsListAgentsRequestSchema,
  ElevenLabsUpdateAgentRequestSchema,
  ElevenLabsGetAgentWidgetRequestSchema,
  ElevenLabsCreateToolRequestSchema,
  ElevenLabsListToolsRequestSchema,
  ElevenLabsUpdateToolRequestSchema,
  ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequestSchema,
  ElevenLabsCreateKnowledgeBaseDocumentFromTextRequestSchema,
  ElevenLabsCreateKnowledgeBaseDocumentFromFileRequestSchema,
  ElevenLabsListKnowledgeBaseDocumentsRequestSchema,
  ElevenLabsGetKnowledgeBaseDocumentRequestSchema,
  ElevenLabsDeleteKnowledgeBaseDocumentRequestSchema,
  ElevenLabsListConversationsRequestSchema,
  ElevenLabsGetConversationRequestSchema,
  ElevenLabsGetSignedUrlRequestSchema,
} from "./zod";
import { attachExamples } from "./example";

export function createElevenLabs(opts: ElevenLabsOptions): ElevenLabsProvider {
  const baseURL = opts.baseURL ?? "https://api.elevenlabs.io";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  interface ElevenLabsSubscriptionPayload extends Record<string, unknown> {
    tier: string;
    character_count: number;
    character_limit: number;
    remaining_character_count?: number;
  }

  function attachAbortHandler(
    signal: AbortSignal,
    controller: AbortController
  ): void {
    if (signal.aborted) {
      controller.abort();
      return;
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  // ElevenLabs returns either FastAPI 422 `{ detail: [{loc,msg,type}, ...] }` or
  // the wider `{ detail: { status, message } }` shape. Surface whichever the
  // server sent so the caller sees the real reason.
  function formatErrorMessage(status: number, body: unknown): string {
    if (typeof body === "object" && body !== null && "detail" in body) {
      const detail = (body as { detail: unknown }).detail;
      if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0] as { msg?: string };
        if (first?.msg) {
          return `ElevenLabs API error ${status}: ${first.msg}`;
        }
      }
      if (typeof detail === "object" && detail !== null) {
        const d = detail as { message?: string; status?: string };
        if (d.message) {
          return `ElevenLabs API error ${status}: ${d.message}`;
        }
      }
      if (typeof detail === "string") {
        return `ElevenLabs API error ${status}: ${detail}`;
      }
    }
    return `ElevenLabs API error: ${status}`;
  }

  function extractErrorCode(body: unknown): string | undefined {
    if (typeof body === "object" && body !== null && "detail" in body) {
      const detail = (body as { detail: unknown }).detail;
      if (typeof detail === "object" && detail !== null) {
        const d = detail as { status?: string };
        if (typeof d.status === "string") return d.status;
      }
    }
    return undefined;
  }

  async function makeBinaryRequest(
    path: string,
    body: unknown,
    query: Record<string, string> | undefined,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    const qs = query ? `?${new URLSearchParams(query).toString()}` : "";

    try {
      const res = await doFetch(`${baseURL}${path}${qs}`, {
        method: "POST",
        headers: {
          "xi-api-key": opts.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return await res.arrayBuffer();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  // GET variant of makeBinaryRequest: fetches an endpoint that responds with
  // raw bytes (e.g. the conversation audio recording) and returns the buffer.
  async function makeGetBinaryRequest(
    path: string,
    queryString = "",
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}${queryString}`, {
        method: "GET",
        headers: {
          "xi-api-key": opts.apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return await res.arrayBuffer();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  async function makeJsonRequest<T>(
    method: "GET" | "POST" | "DELETE" | "PATCH",
    path: string,
    body?: unknown,
    signal?: AbortSignal,
    queryString = ""
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {
        "xi-api-key": opts.apiKey,
      };
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const res = await doFetch(`${baseURL}${path}${queryString}`, init);

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  // Like makeJsonRequest, but tolerates an empty success body (HTTP 204 / 200
  // with no content), which the agent DELETE endpoint returns. Parses JSON when
  // present, otherwise resolves to an empty object.
  async function makeJsonRequestAllowEmpty<T>(
    method: "GET" | "POST" | "DELETE" | "PATCH",
    path: string,
    body?: unknown,
    signal?: AbortSignal,
    queryString = ""
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {
        "xi-api-key": opts.apiKey,
      };
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(body);
      }

      const res = await doFetch(`${baseURL}${path}${queryString}`, init);

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      const text = await res.text();
      return (text ? JSON.parse(text) : {}) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  async function makeMultipartJsonRequest<T>(
    path: string,
    form: FormData,
    query: Record<string, string> | undefined,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    const qs = query ? `?${new URLSearchParams(query).toString()}` : "";

    try {
      const res = await doFetch(`${baseURL}${path}${qs}`, {
        method: "POST",
        headers: {
          "xi-api-key": opts.apiKey,
        },
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  async function makeRedirectRequest(
    method: "GET",
    path: string,
    signal?: AbortSignal
  ): Promise<ElevenLabsDocsRedirectResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method,
        headers: {
          "xi-api-key": opts.apiKey,
        },
        redirect: "manual",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok && (res.status < 300 || res.status >= 400)) {
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new ElevenLabsError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody,
          extractErrorCode(resBody)
        );
      }

      return {
        status: res.status,
        location: res.headers.get("location"),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ElevenLabsError) throw error;
      throw new ElevenLabsError(`ElevenLabs request failed: ${error}`, 500);
    }
  }

  function appendFormField(form: FormData, key: string, value: unknown): void {
    if (value === undefined || value === null) return;
    if (value instanceof Blob) {
      form.append(key, value);
      return;
    }
    if (typeof value === "string") {
      form.append(key, value);
      return;
    }
    if (typeof value === "boolean" || typeof value === "number") {
      form.append(key, String(value));
      return;
    }
    form.append(key, JSON.stringify(value));
  }

  function optionalQuery(
    pairs: Record<string, string | undefined>
  ): Record<string, string> | undefined {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(pairs)) {
      if (value !== undefined) {
        query[key] = value;
      }
    }
    return Object.keys(query).length > 0 ? query : undefined;
  }

  function buildQueryString(params: object): string {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item !== undefined && item !== null) {
            query.append(key, String(item));
          }
        }
        continue;
      }
      query.append(key, String(value));
    }

    const serialized = query.toString();
    return serialized ? `?${serialized}` : "";
  }

  // -- Endpoints -------------------------------------------------------------

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

  // GET https://api.elevenlabs.io/v1/voices/{voiceId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/get
  const getVoice = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsGetVoiceRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsVoice> => {
      return makeJsonRequest<ElevenLabsVoice>(
        "GET",
        `/v1/voices/${encodeURIComponent(voiceId)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetVoiceRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/voices/{voiceId}/settings
  // Docs: https://elevenlabs.io/docs/api-reference/voices/get-settings
  const getVoiceSettings = Object.assign(
    async (
      voiceId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsVoiceSettings> => {
      return makeJsonRequest<ElevenLabsVoiceSettings>(
        "GET",
        `/v1/voices/${encodeURIComponent(voiceId)}/settings`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/create
  const createPvcVoice = Object.assign(
    async (
      req: ElevenLabsCreatePvcVoiceRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreatePvcVoiceResponse> => {
      return makeJsonRequest<ElevenLabsCreatePvcVoiceResponse>(
        "POST",
        "/v1/voices/pvc",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreatePvcVoiceRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/captcha
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/verification/captcha/verify
  const pvcVoiceCaptcha = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsPvcVoiceCaptchaRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsPvcVoiceCaptchaResponse> => {
      const form = new FormData();
      appendFormField(form, "recording", req.recording);

      return makeMultipartJsonRequest<ElevenLabsPvcVoiceCaptchaResponse>(
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}/captcha`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsPvcVoiceCaptchaRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/captcha
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/verification/captcha
  const getPvcVoiceCaptcha = Object.assign(
    async (
      voiceId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetPvcVoiceCaptchaResponse> => {
      return makeJsonRequest<ElevenLabsGetPvcVoiceCaptchaResponse>(
        "GET",
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}/captcha`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/update
  const updatePvcVoiceSample = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      req: ElevenLabsUpdatePvcVoiceSampleRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdatePvcVoiceSampleResponse> => {
      return makeJsonRequest<ElevenLabsUpdatePvcVoiceSampleResponse>(
        "POST",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdatePvcVoiceSampleRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/separate-speakers
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/separate-speakers
  const startSpeakerSeparation = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsStartSpeakerSeparationResponse> => {
      return makeJsonRequest<ElevenLabsStartSpeakerSeparationResponse>(
        "POST",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}/separate-speakers`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/speakers/{speakerId}/audio
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/get-separated-speaker-audio
  const getSeparatedSpeakerAudio = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      speakerId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsSpeakerAudioResponse> => {
      return makeJsonRequest<ElevenLabsSpeakerAudioResponse>(
        "GET",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(
          sampleId
        )}/speakers/${encodeURIComponent(speakerId)}/audio`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/waveform
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/get-waveform
  const getPvcVoiceSampleWaveform = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsPvcVoiceSampleWaveformResponse> => {
      return makeJsonRequest<ElevenLabsPvcVoiceSampleWaveformResponse>(
        "GET",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}/waveform`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // DELETE https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/delete
  const deletePvcVoiceSample = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteVoiceSampleResponse> => {
      return makeJsonRequest<ElevenLabsDeleteVoiceSampleResponse>(
        "DELETE",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/train
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/train
  const pvcTrain = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsPvcTrainRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsPvcTrainResponse> => {
      return makeJsonRequest<ElevenLabsPvcTrainResponse>(
        "POST",
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}/train`,
        req,
        signal
      );
    },
    { schema: ElevenLabsPvcTrainRequestSchema }
  );

  // GET https://api.elevenlabs.io/v2/voices
  // Docs: https://elevenlabs.io/docs/api-reference/voices/search
  const voices = Object.assign(
    async (
      req: ElevenLabsListVoicesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListVoicesResponse> => {
      return makeJsonRequest<ElevenLabsListVoicesResponse>(
        "GET",
        "/v2/voices",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListVoicesRequestSchema }
  );

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
    { schema: ElevenLabsTextToSpeechRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/text-to-dialogue
  // Docs: https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert
  const textToDialogue = Object.assign(
    async (
      req: ElevenLabsTextToDialogueRequest,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      const { output_format, ...body } = req;
      const query = optionalQuery({ output_format });
      return makeBinaryRequest("/v1/text-to-dialogue", body, query, signal);
    },
    { schema: ElevenLabsTextToDialogueRequestSchema }
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
    { schema: ElevenLabsSpeechToTextRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/workspace/analytics/query/usage-by-product-over-time
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/usage/get-usage-by-product-over-time
  const usageByProductOverTime = Object.assign(
    async (
      req: ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsWorkspaceAnalyticsQueryResponse> => {
      return makeJsonRequest<ElevenLabsWorkspaceAnalyticsQueryResponse>(
        "POST",
        "/v1/workspace/analytics/query/usage-by-product-over-time",
        req,
        signal
      );
    },
    {
      schema: ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequestSchema,
    }
  );

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/verification
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/verification/request
  const pvcManualVerification = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsPvcManualVerificationRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsPvcManualVerificationResponse> => {
      const form = new FormData();
      for (const file of req.files) {
        form.append("files", file);
      }
      appendFormField(form, "extra_text", req.extra_text);

      return makeMultipartJsonRequest<ElevenLabsPvcManualVerificationResponse>(
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}/verification`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsPvcManualVerificationRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/user/subscription
  // Docs: https://elevenlabs.io/docs/api-reference/user/subscription/get
  const userSubscription = Object.assign(
    async (
      signal?: AbortSignal
    ): Promise<ElevenLabsUserSubscriptionResponse> => {
      const subscription = await makeJsonRequest<ElevenLabsSubscriptionPayload>(
        "GET",
        "/v1/user/subscription",
        undefined,
        signal
      );

      return {
        ...subscription,
        remaining_character_count: Math.max(
          0,
          subscription.character_limit - subscription.character_count
        ),
      };
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/workspace/analytics/requests
  // Docs: https://elevenlabs.io/docs/api-reference/workspace/analytics/requests/get
  const workspaceAnalyticsRequests = Object.assign(
    async (
      req: ElevenLabsWorkspaceAnalyticsRequestsRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsWorkspaceAnalyticsRequestsResponse> => {
      return makeJsonRequest<ElevenLabsWorkspaceAnalyticsRequestsResponse>(
        "POST",
        "/v1/workspace/analytics/requests",
        req,
        signal
      );
    },
    { schema: ElevenLabsWorkspaceAnalyticsRequestsRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/agents/create
  // Docs: https://elevenlabs.io/docs/api-reference/agents/create
  const createAgent = Object.assign(
    async (
      req: ElevenLabsCreateAgentRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateAgentResponse> => {
      const { enable_versioning, ...body } = req;
      const query = buildQueryString({ enable_versioning });
      return makeJsonRequest<ElevenLabsCreateAgentResponse>(
        "POST",
        "/v1/convai/agents/create",
        body,
        signal,
        query
      );
    },
    { schema: ElevenLabsCreateAgentRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/agents
  // Docs: https://elevenlabs.io/docs/api-reference/agents/list
  const listAgents = Object.assign(
    async (
      req: ElevenLabsListAgentsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListAgentsResponse> => {
      return makeJsonRequest<ElevenLabsListAgentsResponse>(
        "GET",
        "/v1/convai/agents",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListAgentsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/agents/{agentId}
  // Docs: https://elevenlabs.io/docs/api-reference/agents/get
  const getAgent = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsGetAgentRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetAgentResponse> => {
      return makeJsonRequest<ElevenLabsGetAgentResponse>(
        "GET",
        `/v1/convai/agents/${encodeURIComponent(agentId)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetAgentRequestSchema }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/agents/{agentId}
  // Docs: https://elevenlabs.io/docs/api-reference/agents/update
  const updateAgent = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsUpdateAgentRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetAgentResponse> => {
      const { enable_versioning_if_not_enabled, branch_id, ...body } = req;
      const query = buildQueryString({
        enable_versioning_if_not_enabled,
        branch_id,
      });
      return makeJsonRequest<ElevenLabsGetAgentResponse>(
        "PATCH",
        `/v1/convai/agents/${encodeURIComponent(agentId)}`,
        body,
        signal,
        query
      );
    },
    { schema: ElevenLabsUpdateAgentRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/agents/{agentId}
  // Docs: https://elevenlabs.io/docs/api-reference/agents/delete
  const deleteAgent = Object.assign(
    async (
      agentId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteAgentResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteAgentResponse>(
        "DELETE",
        `/v1/convai/agents/${encodeURIComponent(agentId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/widget
  // Docs: https://elevenlabs.io/docs/api-reference/widget/get
  const getAgentWidget = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsGetAgentWidgetRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetAgentWidgetResponse> => {
      return makeJsonRequest<ElevenLabsGetAgentWidgetResponse>(
        "GET",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/widget`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetAgentWidgetRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/link
  // Docs: https://elevenlabs.io/docs/api-reference/agents/get-link
  const getAgentLink = Object.assign(
    async (
      agentId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetAgentLinkResponse> => {
      return makeJsonRequest<ElevenLabsGetAgentLinkResponse>(
        "GET",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/link`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  const convaiAgents = {
    create: createAgent,
    list: listAgents,
    get: getAgent,
    update: updateAgent,
    delete: deleteAgent,
    widget: getAgentWidget,
    link: getAgentLink,
  };

  // POST https://api.elevenlabs.io/v1/convai/tools
  // Docs: https://elevenlabs.io/docs/api-reference/tools/create
  const createTool = Object.assign(
    async (
      req: ElevenLabsCreateToolRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateToolResponse> => {
      return makeJsonRequest<ElevenLabsCreateToolResponse>(
        "POST",
        "/v1/convai/tools",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateToolRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/tools
  // Docs: https://elevenlabs.io/docs/api-reference/tools/list
  const listTools = Object.assign(
    async (
      req: ElevenLabsListToolsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListToolsResponse> => {
      return makeJsonRequest<ElevenLabsListToolsResponse>(
        "GET",
        "/v1/convai/tools",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListToolsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/tools/{toolId}
  // Docs: https://elevenlabs.io/docs/api-reference/tools/get
  const getTool = Object.assign(
    async (
      toolId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsToolResponse> => {
      return makeJsonRequest<ElevenLabsToolResponse>(
        "GET",
        `/v1/convai/tools/${encodeURIComponent(toolId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/tools/{toolId}
  // Docs: https://elevenlabs.io/docs/api-reference/tools/update
  const updateTool = Object.assign(
    async (
      toolId: string,
      req: ElevenLabsUpdateToolRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsToolResponse> => {
      return makeJsonRequest<ElevenLabsToolResponse>(
        "PATCH",
        `/v1/convai/tools/${encodeURIComponent(toolId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdateToolRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/tools/{toolId}
  // Docs: https://elevenlabs.io/docs/api-reference/tools/delete
  const deleteTool = Object.assign(
    async (
      toolId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteToolResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteToolResponse>(
        "DELETE",
        `/v1/convai/tools/${encodeURIComponent(toolId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/conversations
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/list
  const listConversations = Object.assign(
    async (
      req: ElevenLabsListConversationsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListConversationsResponse> => {
      return makeJsonRequest<ElevenLabsListConversationsResponse>(
        "GET",
        "/v1/convai/conversations",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListConversationsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/conversations/{conversationId}
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/get
  const getConversation = Object.assign(
    async (
      conversationId: string,
      req: ElevenLabsGetConversationRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetConversationResponse> => {
      return makeJsonRequest<ElevenLabsGetConversationResponse>(
        "GET",
        `/v1/convai/conversations/${encodeURIComponent(conversationId)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetConversationRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/conversations/{conversationId}
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/delete
  const deleteConversation = Object.assign(
    async (
      conversationId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteConversationResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteConversationResponse>(
        "DELETE",
        `/v1/convai/conversations/${encodeURIComponent(conversationId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/conversations/{conversationId}/audio
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/get-audio
  const getConversationAudio = Object.assign(
    async (
      conversationId: string,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeGetBinaryRequest(
        `/v1/convai/conversations/${encodeURIComponent(conversationId)}/audio`,
        "",
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/convai/conversation/get-signed-url
  // Docs: https://elevenlabs.io/docs/api-reference/conversations/get-signed-url
  const getSignedUrl = Object.assign(
    async (
      req: ElevenLabsGetSignedUrlRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetSignedUrlResponse> => {
      return makeJsonRequest<ElevenLabsGetSignedUrlResponse>(
        "GET",
        "/v1/convai/conversation/get-signed-url",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetSignedUrlRequestSchema }
  );

  const convaiTools = {
    create: createTool,
    list: listTools,
    get: getTool,
    update: updateTool,
    delete: deleteTool,
  };

  // POST https://api.elevenlabs.io/v1/convai/knowledge-base/url
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/create-from-url
  const createKnowledgeBaseDocumentFromUrl = Object.assign(
    async (
      req: ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateKnowledgeBaseDocumentFromUrlResponse> => {
      return makeJsonRequest<ElevenLabsCreateKnowledgeBaseDocumentFromUrlResponse>(
        "POST",
        "/v1/convai/knowledge-base/url",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateKnowledgeBaseDocumentFromUrlRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/knowledge-base/text
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/create-from-text
  const createKnowledgeBaseDocumentFromText = Object.assign(
    async (
      req: ElevenLabsCreateKnowledgeBaseDocumentFromTextRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateKnowledgeBaseDocumentFromTextResponse> => {
      return makeJsonRequest<ElevenLabsCreateKnowledgeBaseDocumentFromTextResponse>(
        "POST",
        "/v1/convai/knowledge-base/text",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreateKnowledgeBaseDocumentFromTextRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/knowledge-base/file
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/create-from-file
  const createKnowledgeBaseDocumentFromFile = Object.assign(
    async (
      req: ElevenLabsCreateKnowledgeBaseDocumentFromFileRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreateKnowledgeBaseDocumentFromFileResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }
      return makeMultipartJsonRequest<ElevenLabsCreateKnowledgeBaseDocumentFromFileResponse>(
        "/v1/convai/knowledge-base/file",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsCreateKnowledgeBaseDocumentFromFileRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/knowledge-base
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/list
  const listKnowledgeBaseDocuments = Object.assign(
    async (
      req: ElevenLabsListKnowledgeBaseDocumentsRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListKnowledgeBaseDocumentsResponse> => {
      return makeJsonRequest<ElevenLabsListKnowledgeBaseDocumentsResponse>(
        "GET",
        "/v1/convai/knowledge-base",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListKnowledgeBaseDocumentsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/get-document
  const getKnowledgeBaseDocument = Object.assign(
    async (
      documentationId: string,
      req: ElevenLabsGetKnowledgeBaseDocumentRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsGetKnowledgeBaseDocumentResponse> => {
      return makeJsonRequest<ElevenLabsGetKnowledgeBaseDocumentResponse>(
        "GET",
        `/v1/convai/knowledge-base/${encodeURIComponent(documentationId)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetKnowledgeBaseDocumentRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/knowledge-base/{documentationId}
  // Docs: https://elevenlabs.io/docs/api-reference/knowledge-base/delete
  const deleteKnowledgeBaseDocument = Object.assign(
    async (
      documentationId: string,
      req: ElevenLabsDeleteKnowledgeBaseDocumentRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteKnowledgeBaseDocumentResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeleteKnowledgeBaseDocumentResponse>(
        "DELETE",
        `/v1/convai/knowledge-base/${encodeURIComponent(documentationId)}`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsDeleteKnowledgeBaseDocumentRequestSchema }
  );

  const convaiKnowledgeBase = {
    url: createKnowledgeBaseDocumentFromUrl,
    text: createKnowledgeBaseDocumentFromText,
    file: createKnowledgeBaseDocumentFromFile,
    list: listKnowledgeBaseDocuments,
    get: getKnowledgeBaseDocument,
    delete: deleteKnowledgeBaseDocument,
  };
  const convaiConversations = {
    list: listConversations,
    get: getConversation,
    delete: deleteConversation,
    audio: getConversationAudio,
  };
  const convaiConversation = {
    getSignedUrl,
  };
  const convai = {
    agents: convaiAgents,
    tools: convaiTools,
    knowledgeBase: convaiKnowledgeBase,
    conversations: convaiConversations,
    conversation: convaiConversation,
  };

  const user = {
    subscription: userSubscription,
  };
  const pvcSamplesSpeakers = {
    audio: getSeparatedSpeakerAudio,
  };
  const pvcVoiceSamples = Object.assign(updatePvcVoiceSample, {
    delete: deletePvcVoiceSample,
    separateSpeakers: startSpeakerSeparation,
    speakers: pvcSamplesSpeakers,
    waveform: getPvcVoiceSampleWaveform,
  });
  const postPvcVoiceSamples = Object.assign(updatePvcVoiceSample, {
    separateSpeakers: startSpeakerSeparation,
  });
  const pvcVoiceCaptchaWithGet = Object.assign(pvcVoiceCaptcha, {
    get: getPvcVoiceCaptcha,
  });
  const pvcVoices = Object.assign(createPvcVoice, {
    captcha: pvcVoiceCaptchaWithGet,
    samples: pvcVoiceSamples,
    train: pvcTrain,
    verification: pvcManualVerification,
  });
  const postPvcVoices = Object.assign(createPvcVoice, {
    captcha: pvcVoiceCaptchaWithGet,
    samples: postPvcVoiceSamples,
    train: pvcTrain,
    verification: pvcManualVerification,
  });
  const workspace = {
    analytics: {
      requests: workspaceAnalyticsRequests,
      query: {
        usageByProductOverTime,
      },
    },
  };
  const v1Voices = Object.assign(getVoice, {
    settings: getVoiceSettings,
    pvc: pvcVoices,
  });
  const v2 = {
    voices,
  };
  const postV1 = {
    soundGeneration,
    textToSpeech,
    textToDialogue,
    speechToText,
    voices: {
      pvc: postPvcVoices,
    },
    workspace,
    convai: {
      agents: { create: createAgent },
      tools: { create: createTool },
      knowledgeBase: {
        url: createKnowledgeBaseDocumentFromUrl,
        text: createKnowledgeBaseDocumentFromText,
        file: createKnowledgeBaseDocumentFromFile,
      },
    },
  };
  const patchV1 = {
    convai: {
      agents: { update: updateAgent },
      tools: { update: updateTool },
    },
  };
  const deleteV1 = {
    voices: {
      pvc: {
        samples: {
          delete: deletePvcVoiceSample,
        },
      },
    },
    convai: {
      agents: { delete: deleteAgent },
      tools: { delete: deleteTool },
      knowledgeBase: { delete: deleteKnowledgeBaseDocument },
      conversations: { delete: deleteConversation },
    },
  };
  const v1 = {
    models,
    voices: v1Voices,
    soundGeneration,
    textToSpeech,
    textToDialogue,
    speechToText,
    user,
    workspace,
    convai,
  };

  return attachExamples({
    docs,
    v1,
    v2,
    get: {
      docs,
      v1: {
        models,
        voices: v1Voices,
        user,
        convai: {
          agents: {
            list: listAgents,
            get: getAgent,
            widget: getAgentWidget,
            link: getAgentLink,
          },
          tools: {
            list: listTools,
            get: getTool,
          },
          knowledgeBase: {
            list: listKnowledgeBaseDocuments,
            get: getKnowledgeBaseDocument,
          },
          conversations: {
            list: listConversations,
            get: getConversation,
            audio: getConversationAudio,
          },
          conversation: {
            getSignedUrl,
          },
        },
      },
      v2,
    },
    post: { v1: postV1 },
    patch: { v1: patchV1 },
    delete: { v1: deleteV1 },
  });
}
