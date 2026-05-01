import {
  IgOptions,
  IgMediaCreateRequest,
  IgMediaCreateResponse,
  IgContainerStatusQuery,
  IgContainerStatusResponse,
  IgMediaPublishRequest,
  IgMediaPublishResponse,
  IgProvider,
  IgError,
} from "./types";
import { IgMediaCreateRequestSchema, IgMediaPublishRequestSchema } from "./zod";

export function ig(opts: IgOptions): IgProvider {
  const baseURL = opts.baseURL ?? "https://graph.instagram.com";
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

  // Meta Graph API errors come as `{ error: { message, type, code, ... } }`
  // for the legacy shape, with a top-level `error_user_msg` available on
  // some validation failures. Surface whichever the server sent so the
  // caller sees the actual reason rather than a generic "IG API error: 400".
  function formatErrorMessage(status: number, body: unknown): string {
    if (typeof body === "object" && body !== null) {
      const b = body as {
        error?: {
          message?: string;
          error_user_msg?: string;
          error_user_title?: string;
          type?: string;
        };
      };
      if (b.error?.error_user_msg)
        return `IG API error ${status}: ${b.error.error_user_msg}`;
      if (b.error?.message) return `IG API error ${status}: ${b.error.message}`;
    }
    return `IG API error: ${status}`;
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
        throw new IgError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof IgError) throw error;
      throw new IgError(`IG request failed: ${error}`, 500);
    }
  }

  // sig-ok: numeric URL segments (`/v25.0/`) become identifier-safe (`v25`)
  // POST https://graph.instagram.com/v25.0/{igUserId}/media
  // Docs: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/
  const mediaCreate = Object.assign(
    async (
      igUserId: string,
      req: IgMediaCreateRequest,
      signal?: AbortSignal
    ): Promise<IgMediaCreateResponse> => {
      return makeJsonRequest<IgMediaCreateResponse>(
        "POST",
        `/v25.0/${encodeURIComponent(igUserId)}/media`,
        req,
        signal
      );
    },
    { schema: IgMediaCreateRequestSchema }
  );

  // sig-ok: numeric URL segments (`/v25.0/`) become identifier-safe (`v25`)
  // GET https://graph.instagram.com/v25.0/{containerId}{query}
  // Docs: https://developers.facebook.com/docs/instagram-platform/reference/ig-container/
  async function containerStatus(
    containerId: string,
    params?: IgContainerStatusQuery,
    signal?: AbortSignal
  ): Promise<IgContainerStatusResponse> {
    const query = params?.fields
      ? `?fields=${encodeURIComponent(params.fields)}`
      : "";
    return makeJsonRequest<IgContainerStatusResponse>(
      "GET",
      `/v25.0/${encodeURIComponent(containerId)}${query}`,
      undefined,
      signal
    );
  }

  // sig-ok: numeric URL segments (`/v25.0/`) become identifier-safe (`v25`)
  // POST https://graph.instagram.com/v25.0/{igUserId}/media_publish
  // Docs: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media_publish/
  const mediaPublish = Object.assign(
    async (
      igUserId: string,
      req: IgMediaPublishRequest,
      signal?: AbortSignal
    ): Promise<IgMediaPublishResponse> => {
      return makeJsonRequest<IgMediaPublishResponse>(
        "POST",
        `/v25.0/${encodeURIComponent(igUserId)}/media_publish`,
        req,
        signal
      );
    },
    { schema: IgMediaPublishRequestSchema }
  );

  return {
    post: {
      v25: {
        media: mediaCreate,
        mediaPublish,
      },
    },
    get: {
      v25: {
        container: containerStatus,
      },
    },
  };
}
