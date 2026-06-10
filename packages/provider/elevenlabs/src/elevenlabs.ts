import {
  ElevenLabsDocsRedirectResponse,
  ElevenLabsGetPvcVoiceCaptchaResponse,
  ElevenLabsGetVoiceRequest,
  ElevenLabsListModelsResponse,
  ElevenLabsListVoicesRequest,
  ElevenLabsListVoicesResponse,
  ElevenLabsOptions,
  ElevenLabsPvcVoiceCaptchaRequest,
  ElevenLabsPvcVoiceCaptchaResponse,
  ElevenLabsSoundGenerationRequest,
  ElevenLabsTextToDialogueRequest,
  ElevenLabsTextToSpeechRequest,
  ElevenLabsSpeechToTextRequest,
  ElevenLabsSpeechToTextResponse,
  ElevenLabsStartSpeakerSeparationResponse,
  ElevenLabsUserSubscriptionResponse,
  ElevenLabsVoice,
  ElevenLabsVoiceSettings,
  ElevenLabsWorkspaceAnalyticsRequestsRequest,
  ElevenLabsWorkspaceAnalyticsRequestsResponse,
  ElevenLabsProvider,
  ElevenLabsError,
} from "./types";
import {
  ElevenLabsGetVoiceRequestSchema,
  ElevenLabsListVoicesRequestSchema,
  ElevenLabsPvcVoiceCaptchaRequestSchema,
  ElevenLabsSoundGenerationRequestSchema,
  ElevenLabsTextToDialogueRequestSchema,
  ElevenLabsTextToSpeechRequestSchema,
  ElevenLabsSpeechToTextRequestSchema,
  ElevenLabsWorkspaceAnalyticsRequestsRequestSchema,
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

  async function makeJsonRequest<T>(
    method: "GET" | "POST",
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

  const user = {
    subscription: userSubscription,
  };
  const pvcVoiceSamples = {
    separateSpeakers: startSpeakerSeparation,
  };
  const pvcVoices = {
    captcha: Object.assign(pvcVoiceCaptcha, {
      get: getPvcVoiceCaptcha,
    }),
    samples: pvcVoiceSamples,
  };
  const workspace = {
    analytics: {
      requests: workspaceAnalyticsRequests,
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
      pvc: pvcVoices,
    },
    workspace,
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
  };

  return attachExamples({
    docs,
    v1,
    v2,
    get: { docs, v1: { models, voices: v1Voices, user }, v2 },
    post: { v1: postV1 },
  });
}
