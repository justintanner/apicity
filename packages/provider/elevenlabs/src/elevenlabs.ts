import {
  ElevenLabsOptions,
  ElevenLabsSoundGenerationRequest,
  ElevenLabsProvider,
  ElevenLabsError,
} from "./types";
import { ElevenLabsSoundGenerationRequestSchema } from "./zod";

export function elevenlabs(opts: ElevenLabsOptions): ElevenLabsProvider {
  const baseURL = opts.baseURL ?? "https://api.elevenlabs.io";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

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

  const postV1 = { soundGeneration };
  const v1 = { soundGeneration };

  return {
    v1,
    post: { v1: postV1 },
  };
}
