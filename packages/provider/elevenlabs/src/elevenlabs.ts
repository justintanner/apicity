import {
  ElevenLabsOptions,
  ElevenLabsSoundGenerationRequest,
  ElevenLabsTextToDialogueRequest,
  ElevenLabsTextToSpeechRequest,
  ElevenLabsSpeechToTextRequest,
  ElevenLabsSpeechToTextResponse,
  ElevenLabsUserSubscriptionResponse,
  ElevenLabsProvider,
  ElevenLabsError,
} from "./types";
import {
  ElevenLabsSoundGenerationRequestSchema,
  ElevenLabsTextToDialogueRequestSchema,
  ElevenLabsTextToSpeechRequestSchema,
  ElevenLabsSpeechToTextRequestSchema,
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
    signal?: AbortSignal
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

      const res = await doFetch(`${baseURL}${path}`, init);

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

  // -- Endpoints -------------------------------------------------------------

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

  const user = {
    subscription: userSubscription,
  };
  const postV1 = {
    soundGeneration,
    textToSpeech,
    textToDialogue,
    speechToText,
  };
  const v1 = {
    soundGeneration,
    textToSpeech,
    textToDialogue,
    speechToText,
    user,
  };

  return attachExamples({
    v1,
    get: { v1: { user } },
    post: { v1: postV1 },
  });
}
