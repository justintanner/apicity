import {
  XOptions,
  XMediaUploadInitializeRequest,
  XMediaUploadInitializeResponse,
  XMediaUploadAppendRequest,
  XMediaUploadAppendResponse,
  XMediaUploadFinalizeResponse,
  XProvider,
  XError,
} from "./types";
import {
  XMediaUploadInitializeRequestSchema,
  XMediaUploadAppendRequestSchema,
} from "./zod";

export function x(opts: XOptions): XProvider {
  const baseURL = opts.baseURL ?? "https://api.x.com";
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

  // X v2 errors come in two shapes: `{ errors: [{ message, code, ... }] }`
  // for batched/validation failures, or `{ title, detail, status, type }` for
  // single problems. Surface whichever the server sent so the caller sees the
  // actual reason rather than a generic "X API error: 400".
  function formatErrorMessage(status: number, body: unknown): string {
    if (typeof body === "object" && body !== null) {
      const b = body as {
        errors?: Array<{ message?: string }>;
        title?: string;
        detail?: string;
      };
      if (Array.isArray(b.errors) && b.errors.length > 0) {
        const first = b.errors[0];
        if (first?.message) {
          return `X API error ${status}: ${first.message}`;
        }
      }
      if (b.detail) return `X API error ${status}: ${b.detail}`;
      if (b.title) return `X API error ${status}: ${b.title}`;
    }
    return `X API error: ${status}`;
  }

  async function makeJsonRequest<T>(
    method: "GET" | "POST" | "DELETE",
    path: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${opts.accessToken}`,
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
        throw new XError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof XError) throw error;
      throw new XError(`X request failed: ${error}`, 500);
    }
  }

  async function makeFormRequest<T>(
    path: string,
    form: FormData,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${opts.accessToken}` },
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
        throw new XError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof XError) throw error;
      throw new XError(`X request failed: ${error}`, 500);
    }
  }

  // sig-ok: numeric URL segments (`/2/`) become identifier-safe (`v2`)
  // POST https://api.x.com/2/media/upload/initialize
  // Docs: https://docs.x.com/x-api/media/media-upload-initialize
  const mediaUploadInitialize = Object.assign(
    async (
      req: XMediaUploadInitializeRequest,
      signal?: AbortSignal
    ): Promise<XMediaUploadInitializeResponse> => {
      return makeJsonRequest<XMediaUploadInitializeResponse>(
        "POST",
        "/2/media/upload/initialize",
        req,
        signal
      );
    },
    { schema: XMediaUploadInitializeRequestSchema }
  );

  // sig-ok: numeric URL segments (`/2/`) become identifier-safe (`v2`)
  // POST https://api.x.com/2/media/upload/{id}/append
  // Docs: https://docs.x.com/x-api/media/append-media-upload
  const mediaUploadAppend = Object.assign(
    async (
      id: string,
      req: XMediaUploadAppendRequest,
      signal?: AbortSignal
    ): Promise<XMediaUploadAppendResponse> => {
      const form = new FormData();
      form.append("media", req.media);
      form.append("segment_index", String(req.segment_index));
      return makeFormRequest<XMediaUploadAppendResponse>(
        `/2/media/upload/${encodeURIComponent(id)}/append`,
        form,
        signal
      );
    },
    { schema: XMediaUploadAppendRequestSchema }
  );

  // sig-ok: numeric URL segments (`/2/`) become identifier-safe (`v2`)
  // POST https://api.x.com/2/media/upload/{id}/finalize
  // Docs: https://docs.x.com/x-api/media/finalize-media-upload
  async function mediaUploadFinalize(
    id: string,
    signal?: AbortSignal
  ): Promise<XMediaUploadFinalizeResponse> {
    return makeJsonRequest<XMediaUploadFinalizeResponse>(
      "POST",
      `/2/media/upload/${encodeURIComponent(id)}/finalize`,
      undefined,
      signal
    );
  }

  return {
    post: {
      v2: {
        media: {
          upload: {
            initialize: mediaUploadInitialize,
            append: mediaUploadAppend,
            finalize: mediaUploadFinalize,
          },
        },
      },
    },
  };
}
