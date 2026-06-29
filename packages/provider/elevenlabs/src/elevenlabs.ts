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
  ElevenLabsEditPvcVoiceRequest,
  ElevenLabsEditPvcVoiceResponse,
  ElevenLabsAddPvcSamplesRequest,
  ElevenLabsAddPvcSamplesResponse,
  ElevenLabsGetPvcSampleAudioRequest,
  ElevenLabsVoiceSamplePreviewResponse,
  ElevenLabsSpeakerSeparation,
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
  ElevenLabsAudioWithTimestampsResponse,
  ElevenLabsStreamingAudioChunkWithTimestampsResponse,
  ElevenLabsSpeechToTextRequest,
  ElevenLabsSpeechToTextResponse,
  ElevenLabsGetTranscriptResponse,
  ElevenLabsDeleteTranscriptResponse,
  ElevenLabsSpeechToSpeechRequest,
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
  ElevenLabsListAgentBranchesRequest,
  ElevenLabsListAgentBranchesResponse,
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
  ElevenLabsCreatePhoneNumberRequest,
  ElevenLabsCreatePhoneNumberResponse,
  ElevenLabsListPhoneNumbersRequest,
  ElevenLabsListPhoneNumbersResponse,
  ElevenLabsGetPhoneNumberResponse,
  ElevenLabsUpdatePhoneNumberRequest,
  ElevenLabsUpdatePhoneNumberResponse,
  ElevenLabsDeletePhoneNumberResponse,
  ElevenLabsTwilioOutboundCallRequest,
  ElevenLabsTwilioOutboundCallResponse,
  ElevenLabsSipTrunkOutboundCallRequest,
  ElevenLabsSipTrunkOutboundCallResponse,
  ElevenLabsCreateVoiceFromPreviewRequest,
  ElevenLabsVoiceDesignRequest,
  ElevenLabsVoicePreviewsResponse,
  ElevenLabsVoiceRemixRequest,
  ElevenLabsListV1VoicesRequest,
  ElevenLabsListV1VoicesResponse,
  ElevenLabsDeleteVoiceResponse,
  ElevenLabsAddVoiceRequest,
  ElevenLabsAddVoiceResponse,
  ElevenLabsEditVoiceRequest,
  ElevenLabsEditVoiceResponse,
  ElevenLabsEditVoiceSettingsRequest,
  ElevenLabsEditVoiceSettingsResponse,
  ElevenLabsAddSharedVoiceRequest,
  ElevenLabsAddSharedVoiceResponse,
  ElevenLabsSharedVoicesRequest,
  ElevenLabsSimilarVoicesRequest,
  ElevenLabsLibraryVoicesResponse,
  ElevenLabsHistoryListRequest,
  ElevenLabsHistoryListResponse,
  ElevenLabsHistoryItem,
  ElevenLabsHistoryDeleteResponse,
  ElevenLabsHistoryDownloadRequest,
  ElevenLabsListDubbingRequest,
  ElevenLabsListDubbingResponse,
  ElevenLabsCreateDubbingRequest,
  ElevenLabsCreateDubbingResponse,
  ElevenLabsDubbingMetadata,
  ElevenLabsDeleteDubbingResponse,
  ElevenLabsDubbingTranscriptsResponse,
  ElevenLabsProvider,
  ElevenLabsError,
} from "./types";
import {
  ElevenLabsCreatePvcVoiceRequestSchema,
  ElevenLabsEditPvcVoiceRequestSchema,
  ElevenLabsAddPvcSamplesRequestSchema,
  ElevenLabsGetPvcSampleAudioRequestSchema,
  ElevenLabsGetVoiceRequestSchema,
  ElevenLabsListVoicesRequestSchema,
  ElevenLabsPvcTrainRequestSchema,
  ElevenLabsPvcVoiceCaptchaRequestSchema,
  ElevenLabsPvcManualVerificationRequestSchema,
  ElevenLabsSoundGenerationRequestSchema,
  ElevenLabsTextToDialogueRequestSchema,
  ElevenLabsTextToSpeechRequestSchema,
  ElevenLabsSpeechToTextRequestSchema,
  ElevenLabsSpeechToSpeechRequestSchema,
  ElevenLabsUpdatePvcVoiceSampleRequestSchema,
  ElevenLabsWorkspaceAnalyticsRequestsRequestSchema,
  ElevenLabsWorkspaceAnalyticsUsageByProductOverTimeRequestSchema,
  ElevenLabsCreateAgentRequestSchema,
  ElevenLabsGetAgentRequestSchema,
  ElevenLabsListAgentsRequestSchema,
  ElevenLabsUpdateAgentRequestSchema,
  ElevenLabsGetAgentWidgetRequestSchema,
  ElevenLabsListAgentBranchesRequestSchema,
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
  ElevenLabsCreatePhoneNumberRequestSchema,
  ElevenLabsListPhoneNumbersRequestSchema,
  ElevenLabsUpdatePhoneNumberRequestSchema,
  ElevenLabsTwilioOutboundCallRequestSchema,
  ElevenLabsSipTrunkOutboundCallRequestSchema,
  ElevenLabsCreateVoiceFromPreviewRequestSchema,
  ElevenLabsVoiceDesignRequestSchema,
  ElevenLabsVoiceRemixRequestSchema,
  ElevenLabsListV1VoicesRequestSchema,
  ElevenLabsAddVoiceRequestSchema,
  ElevenLabsEditVoiceRequestSchema,
  ElevenLabsEditVoiceSettingsRequestSchema,
  ElevenLabsAddSharedVoiceRequestSchema,
  ElevenLabsSharedVoicesRequestSchema,
  ElevenLabsSimilarVoicesRequestSchema,
  ElevenLabsHistoryListRequestSchema,
  ElevenLabsHistoryDownloadRequestSchema,
  ElevenLabsListDubbingRequestSchema,
  ElevenLabsCreateDubbingRequestSchema,
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

  // Like makeMultipartJsonRequest, but for endpoints that respond with raw
  // audio bytes (e.g. the speech-to-speech voice changer) — uploads a multipart
  // form and returns the response buffer.
  async function makeMultipartBinaryRequest(
    path: string,
    form: FormData,
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

      return await res.arrayBuffer();
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

  // Parse a newline-delimited JSON (NDJSON) response body into an array of
  // chunk objects. The streaming text-to-speech-with-timestamps endpoint emits
  // one JSON object per line as audio is generated.
  function decodeNdjson<T>(buffer: ArrayBuffer): T[] {
    const text = new TextDecoder().decode(buffer);
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as T);
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

  // GET https://api.elevenlabs.io/v1/voices
  // Docs: https://elevenlabs.io/docs/api-reference/voices/get-all
  const listV1Voices = Object.assign(
    async (
      req: ElevenLabsListV1VoicesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListV1VoicesResponse> => {
      return makeJsonRequest<ElevenLabsListV1VoicesResponse>(
        "GET",
        "/v1/voices",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListV1VoicesRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/voices/{voiceId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/delete
  const deleteVoice = Object.assign(
    async (
      voiceId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteVoiceResponse> => {
      return makeJsonRequest<ElevenLabsDeleteVoiceResponse>(
        "DELETE",
        `/v1/voices/${encodeURIComponent(voiceId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/voices/add
  // Docs: https://elevenlabs.io/docs/api-reference/voices/ivc/create
  const addVoice = async (
    req: ElevenLabsAddVoiceRequest,
    signal?: AbortSignal
  ): Promise<ElevenLabsAddVoiceResponse> => {
    const { files, ...rest } = req;
    const form = new FormData();
    for (const file of files) {
      form.append("files", file);
    }
    for (const [key, value] of Object.entries(rest)) {
      appendFormField(form, key, value);
    }

    return makeMultipartJsonRequest<ElevenLabsAddVoiceResponse>(
      "/v1/voices/add",
      form,
      undefined,
      signal
    );
  };

  // POST https://api.elevenlabs.io/v1/voices/add/{publicUserId}/{voiceId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/share
  const addSharedVoice = Object.assign(
    async (
      publicUserId: string,
      voiceId: string,
      req: ElevenLabsAddSharedVoiceRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAddSharedVoiceResponse> => {
      return makeJsonRequest<ElevenLabsAddSharedVoiceResponse>(
        "POST",
        `/v1/voices/add/${encodeURIComponent(
          publicUserId
        )}/${encodeURIComponent(voiceId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsAddSharedVoiceRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/{voiceId}/edit
  // Docs: https://elevenlabs.io/docs/api-reference/voices/edit
  const editVoice = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsEditVoiceRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsEditVoiceResponse> => {
      const { files, ...rest } = req;
      const form = new FormData();
      if (files) {
        for (const file of files) {
          form.append("files", file);
        }
      }
      for (const [key, value] of Object.entries(rest)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsEditVoiceResponse>(
        `/v1/voices/${encodeURIComponent(voiceId)}/edit`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsEditVoiceRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/voices/{voiceId}/settings/edit
  // Docs: https://elevenlabs.io/docs/api-reference/voices/settings/update
  const editVoiceSettings = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsEditVoiceSettingsRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsEditVoiceSettingsResponse> => {
      return makeJsonRequest<ElevenLabsEditVoiceSettingsResponse>(
        "POST",
        `/v1/voices/${encodeURIComponent(voiceId)}/settings/edit`,
        req,
        signal
      );
    },
    { schema: ElevenLabsEditVoiceSettingsRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/voices/settings/default
  // Docs: https://elevenlabs.io/docs/api-reference/voices/settings/get-default
  const getDefaultVoiceSettings = Object.assign(
    async (signal?: AbortSignal): Promise<ElevenLabsVoiceSettings> => {
      return makeJsonRequest<ElevenLabsVoiceSettings>(
        "GET",
        "/v1/voices/settings/default",
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // DELETE https://api.elevenlabs.io/v1/voices/{voiceId}/samples/{sampleId}
  // Docs: https://elevenlabs.io/docs/api-reference/samples/delete
  const deleteVoiceSample = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeleteVoiceSampleResponse> => {
      return makeJsonRequest<ElevenLabsDeleteVoiceSampleResponse>(
        "DELETE",
        `/v1/voices/${encodeURIComponent(voiceId)}/samples/${encodeURIComponent(
          sampleId
        )}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/voices/{voiceId}/samples/{sampleId}/audio
  // Docs: https://elevenlabs.io/docs/api-reference/samples/audio
  const getVoiceSampleAudio = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ArrayBuffer> => {
      return makeGetBinaryRequest(
        `/v1/voices/${encodeURIComponent(voiceId)}/samples/${encodeURIComponent(
          sampleId
        )}/audio`,
        "",
        signal
      );
    },
    { schema: undefined }
  );

  // GET https://api.elevenlabs.io/v1/shared-voices
  // Docs: https://elevenlabs.io/docs/api-reference/voices/get-shared
  const getSharedVoices = Object.assign(
    async (
      req: ElevenLabsSharedVoicesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsLibraryVoicesResponse> => {
      return makeJsonRequest<ElevenLabsLibraryVoicesResponse>(
        "GET",
        "/v1/shared-voices",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsSharedVoicesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/similar-voices
  // Docs: https://elevenlabs.io/docs/api-reference/voices/find-similar-voices
  const getSimilarVoices = Object.assign(
    async (
      req: ElevenLabsSimilarVoicesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsLibraryVoicesResponse> => {
      const form = new FormData();
      for (const [key, value] of Object.entries(req)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsLibraryVoicesResponse>(
        "/v1/similar-voices",
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsSimilarVoicesRequestSchema }
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

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/edit
  const editPvcVoice = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsEditPvcVoiceRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsEditPvcVoiceResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsEditPvcVoiceResponse>(
        "POST",
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsEditPvcVoiceRequestSchema }
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

  // POST https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/create
  const addPvcSamples = Object.assign(
    async (
      voiceId: string,
      req: ElevenLabsAddPvcSamplesRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsAddPvcSamplesResponse> => {
      const { files, ...rest } = req;
      const form = new FormData();
      for (const file of files) {
        form.append("files", file);
      }
      for (const [key, value] of Object.entries(rest)) {
        appendFormField(form, key, value);
      }

      return makeMultipartJsonRequest<ElevenLabsAddPvcSamplesResponse>(
        `/v1/voices/pvc/${encodeURIComponent(voiceId)}/samples`,
        form,
        undefined,
        signal
      );
    },
    { schema: ElevenLabsAddPvcSamplesRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/audio
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/audio
  const getPvcSampleAudio = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      req: ElevenLabsGetPvcSampleAudioRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsVoiceSamplePreviewResponse> => {
      return makeJsonRequest<ElevenLabsVoiceSamplePreviewResponse>(
        "GET",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}/audio`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsGetPvcSampleAudioRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/voices/pvc/{voiceId}/samples/{sampleId}/speakers
  // Docs: https://elevenlabs.io/docs/api-reference/voices/pvc/samples/speakers
  const getPvcSampleSpeakers = Object.assign(
    async (
      voiceId: string,
      sampleId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsSpeakerSeparation> => {
      return makeJsonRequest<ElevenLabsSpeakerSeparation>(
        "GET",
        `/v1/voices/pvc/${encodeURIComponent(
          voiceId
        )}/samples/${encodeURIComponent(sampleId)}/speakers`,
        undefined,
        signal
      );
    },
    { schema: undefined }
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
    transcripts: {
      get: getDubbingTranscript,
    },
  };

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

  // GET https://api.elevenlabs.io/v1/convai/agents/{agentId}/branches
  // Docs: https://elevenlabs.io/docs/api-reference/agents/branches
  const listAgentBranches = Object.assign(
    async (
      agentId: string,
      req: ElevenLabsListAgentBranchesRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListAgentBranchesResponse> => {
      return makeJsonRequest<ElevenLabsListAgentBranchesResponse>(
        "GET",
        `/v1/convai/agents/${encodeURIComponent(agentId)}/branches`,
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListAgentBranchesRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/phone-numbers
  // Docs: https://elevenlabs.io/docs/api-reference/phone-numbers/create
  const createPhoneNumber = Object.assign(
    async (
      req: ElevenLabsCreatePhoneNumberRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsCreatePhoneNumberResponse> => {
      return makeJsonRequest<ElevenLabsCreatePhoneNumberResponse>(
        "POST",
        "/v1/convai/phone-numbers",
        req,
        signal
      );
    },
    { schema: ElevenLabsCreatePhoneNumberRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/phone-numbers
  // Docs: https://elevenlabs.io/docs/api-reference/phone-numbers/list
  const listPhoneNumbers = Object.assign(
    async (
      req: ElevenLabsListPhoneNumbersRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsListPhoneNumbersResponse> => {
      return makeJsonRequest<ElevenLabsListPhoneNumbersResponse>(
        "GET",
        "/v1/convai/phone-numbers",
        undefined,
        signal,
        buildQueryString(req)
      );
    },
    { schema: ElevenLabsListPhoneNumbersRequestSchema }
  );

  // GET https://api.elevenlabs.io/v1/convai/phone-numbers/{phoneNumberId}
  // Docs: https://elevenlabs.io/docs/api-reference/phone-numbers/get
  const getPhoneNumber = Object.assign(
    async (
      phoneNumberId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsGetPhoneNumberResponse> => {
      return makeJsonRequest<ElevenLabsGetPhoneNumberResponse>(
        "GET",
        `/v1/convai/phone-numbers/${encodeURIComponent(phoneNumberId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // PATCH https://api.elevenlabs.io/v1/convai/phone-numbers/{phoneNumberId}
  // Docs: https://elevenlabs.io/docs/api-reference/phone-numbers/update
  const updatePhoneNumber = Object.assign(
    async (
      phoneNumberId: string,
      req: ElevenLabsUpdatePhoneNumberRequest = {},
      signal?: AbortSignal
    ): Promise<ElevenLabsUpdatePhoneNumberResponse> => {
      return makeJsonRequest<ElevenLabsUpdatePhoneNumberResponse>(
        "PATCH",
        `/v1/convai/phone-numbers/${encodeURIComponent(phoneNumberId)}`,
        req,
        signal
      );
    },
    { schema: ElevenLabsUpdatePhoneNumberRequestSchema }
  );

  // DELETE https://api.elevenlabs.io/v1/convai/phone-numbers/{phoneNumberId}
  // Docs: https://elevenlabs.io/docs/api-reference/phone-numbers/delete
  const deletePhoneNumber = Object.assign(
    async (
      phoneNumberId: string,
      signal?: AbortSignal
    ): Promise<ElevenLabsDeletePhoneNumberResponse> => {
      return makeJsonRequestAllowEmpty<ElevenLabsDeletePhoneNumberResponse>(
        "DELETE",
        `/v1/convai/phone-numbers/${encodeURIComponent(phoneNumberId)}`,
        undefined,
        signal
      );
    },
    { schema: undefined }
  );

  // POST https://api.elevenlabs.io/v1/convai/twilio/outbound-call
  // Docs: https://elevenlabs.io/docs/api-reference/twilio/outbound-call
  const twilioOutboundCall = Object.assign(
    async (
      req: ElevenLabsTwilioOutboundCallRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsTwilioOutboundCallResponse> => {
      return makeJsonRequest<ElevenLabsTwilioOutboundCallResponse>(
        "POST",
        "/v1/convai/twilio/outbound-call",
        req,
        signal
      );
    },
    { schema: ElevenLabsTwilioOutboundCallRequestSchema }
  );

  // POST https://api.elevenlabs.io/v1/convai/sip-trunk/outbound-call
  // Docs: https://elevenlabs.io/docs/api-reference/sip-trunk/outbound-call
  const sipTrunkOutboundCall = Object.assign(
    async (
      req: ElevenLabsSipTrunkOutboundCallRequest,
      signal?: AbortSignal
    ): Promise<ElevenLabsSipTrunkOutboundCallResponse> => {
      return makeJsonRequest<ElevenLabsSipTrunkOutboundCallResponse>(
        "POST",
        "/v1/convai/sip-trunk/outbound-call",
        req,
        signal
      );
    },
    { schema: ElevenLabsSipTrunkOutboundCallRequestSchema }
  );

  const convaiAgents = {
    create: createAgent,
    list: listAgents,
    get: getAgent,
    update: updateAgent,
    delete: deleteAgent,
    widget: getAgentWidget,
    link: getAgentLink,
    branches: listAgentBranches,
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
  const convaiPhoneNumbers = {
    create: createPhoneNumber,
    list: listPhoneNumbers,
    get: getPhoneNumber,
    update: updatePhoneNumber,
    delete: deletePhoneNumber,
  };
  const convaiTwilio = { outboundCall: twilioOutboundCall };
  const convaiSipTrunk = { outboundCall: sipTrunkOutboundCall };
  const convai = {
    agents: convaiAgents,
    tools: convaiTools,
    knowledgeBase: convaiKnowledgeBase,
    conversations: convaiConversations,
    conversation: convaiConversation,
    phoneNumbers: convaiPhoneNumbers,
    twilio: convaiTwilio,
    sipTrunk: convaiSipTrunk,
  };

  const user = {
    subscription: userSubscription,
  };
  const pvcSamplesSpeakers = Object.assign(getPvcSampleSpeakers, {
    audio: getSeparatedSpeakerAudio,
  });
  const pvcVoiceSamples = Object.assign(updatePvcVoiceSample, {
    add: addPvcSamples,
    audio: getPvcSampleAudio,
    delete: deletePvcVoiceSample,
    separateSpeakers: startSpeakerSeparation,
    speakers: pvcSamplesSpeakers,
    waveform: getPvcVoiceSampleWaveform,
  });
  const postPvcVoiceSamples = Object.assign(updatePvcVoiceSample, {
    add: addPvcSamples,
    separateSpeakers: startSpeakerSeparation,
  });
  const pvcVoiceCaptchaWithGet = Object.assign(pvcVoiceCaptcha, {
    get: getPvcVoiceCaptcha,
  });
  const pvcVoices = Object.assign(createPvcVoice, {
    edit: editPvcVoice,
    captcha: pvcVoiceCaptchaWithGet,
    samples: pvcVoiceSamples,
    train: pvcTrain,
    verification: pvcManualVerification,
  });
  const postPvcVoices = Object.assign(createPvcVoice, {
    edit: editPvcVoice,
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
  const v1VoicesAdd = Object.assign(addVoice, {
    schema: ElevenLabsAddVoiceRequestSchema,
    share: addSharedVoice,
  });
  const v1VoiceSettings = Object.assign(getVoiceSettings, {
    default: getDefaultVoiceSettings,
    edit: editVoiceSettings,
  });
  const v1VoiceSamples = {
    delete: deleteVoiceSample,
    audio: getVoiceSampleAudio,
  };
  const v1Voices = Object.assign(getVoice, {
    list: listV1Voices,
    delete: deleteVoice,
    add: v1VoicesAdd,
    edit: editVoice,
    settings: v1VoiceSettings,
    samples: v1VoiceSamples,
    pvc: pvcVoices,
  });
  const v2 = {
    voices,
  };
  const postV1 = {
    soundGeneration,
    textToSpeech,
    textToDialogue,
    textToVoice,
    speechToText,
    speechToSpeech,
    similarVoices: getSimilarVoices,
    voices: {
      add: v1VoicesAdd,
      edit: editVoice,
      settings: {
        edit: editVoiceSettings,
      },
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
      phoneNumbers: { create: createPhoneNumber },
      twilio: convaiTwilio,
      sipTrunk: convaiSipTrunk,
    },
    history: {
      download: downloadHistory,
    },
  };
  const patchV1 = {
    convai: {
      agents: { update: updateAgent },
      tools: { update: updateTool },
      phoneNumbers: { update: updatePhoneNumber },
    },
  };
  const deleteV1 = {
    voices: {
      delete: deleteVoice,
      samples: {
        delete: deleteVoiceSample,
      },
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
      phoneNumbers: { delete: deletePhoneNumber },
    },
    history: {
      delete: deleteHistoryItem,
    },
  };
  const v1 = {
    models,
    voices: v1Voices,
    sharedVoices: getSharedVoices,
    similarVoices: getSimilarVoices,
    soundGeneration,
    textToSpeech,
    textToDialogue,
    textToVoice,
    speechToText,
    speechToSpeech,
    dubbing,
    user,
    workspace,
    convai,
    history: {
      list: listHistory,
      get: getHistoryItem,
      delete: deleteHistoryItem,
      audio: getHistoryItemAudio,
      download: downloadHistory,
    },
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
        sharedVoices: getSharedVoices,
        user,
        textToVoice: {
          stream: textToVoiceStream,
        },
        convai: {
          agents: {
            list: listAgents,
            get: getAgent,
            widget: getAgentWidget,
            link: getAgentLink,
            branches: listAgentBranches,
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
          phoneNumbers: {
            list: listPhoneNumbers,
            get: getPhoneNumber,
          },
        },
        history: {
          list: listHistory,
          get: getHistoryItem,
          audio: getHistoryItemAudio,
        },
      },
      v2,
    },
    post: { v1: postV1 },
    patch: { v1: patchV1 },
    delete: { v1: deleteV1 },
  });
}
