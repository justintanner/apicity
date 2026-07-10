import {
  MetaOptions,
  MetaMediaCreateRequest,
  MetaMediaCreateResponse,
  MetaContainerStatusQuery,
  MetaContainerStatusResponse,
  MetaMediaPublishRequest,
  MetaMediaPublishResponse,
  MetaProvider,
  MetaError,
} from "./types";
import {
  MetaMediaCreateRequestSchema,
  MetaMediaPublishRequestSchema,
} from "./zod";
import { attachExamples } from "./example";
import { createTransport } from "./transport";

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

export function createMeta(opts: MetaOptions): MetaProvider {
  const baseURL = opts.baseURL ?? "https://graph.instagram.com";
  const timeout = opts.timeout ?? 30000;

  const transport = createTransport({
    baseUrl: baseURL,
    timeoutMs: timeout,
    fetchImpl: opts.fetch,
    defaultHeaders: () => ({ Authorization: `Bearer ${opts.accessToken}` }),
    parseErrorBody: (status, body) => ({
      message: formatErrorMessage(status, body),
    }),
    errorClass: MetaError,
    requestFailedPrefix: "IG request failed",
  });

  // sig-ok: numeric URL segments (`/v25.0/`) become identifier-safe (`v25`)
  // POST https://graph.instagram.com/v25.0/{igUserId}/media
  // Docs: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/
  const mediaCreate = Object.assign(
    async (
      igUserId: string,
      req: MetaMediaCreateRequest,
      signal?: AbortSignal
    ): Promise<MetaMediaCreateResponse> => {
      return transport.postJson<MetaMediaCreateResponse>(
        `/v25.0/${encodeURIComponent(igUserId)}/media`,
        req,
        { signal }
      );
    },
    { schema: MetaMediaCreateRequestSchema }
  );

  // sig-ok: numeric URL segments (`/v25.0/`) become identifier-safe (`v25`)
  // GET https://graph.instagram.com/v25.0/{containerId}{query}
  // Docs: https://developers.facebook.com/docs/instagram-platform/reference/ig-container/
  async function containerStatus(
    containerId: string,
    params?: MetaContainerStatusQuery,
    signal?: AbortSignal
  ): Promise<MetaContainerStatusResponse> {
    const query = params?.fields
      ? `?fields=${encodeURIComponent(params.fields)}`
      : "";
    return transport.getJson<MetaContainerStatusResponse>(
      `/v25.0/${encodeURIComponent(containerId)}${query}`,
      { signal }
    );
  }

  // sig-ok: numeric URL segments (`/v25.0/`) become identifier-safe (`v25`)
  // POST https://graph.instagram.com/v25.0/{igUserId}/media_publish
  // Docs: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media_publish/
  const mediaPublish = Object.assign(
    async (
      igUserId: string,
      req: MetaMediaPublishRequest,
      signal?: AbortSignal
    ): Promise<MetaMediaPublishResponse> => {
      return transport.postJson<MetaMediaPublishResponse>(
        `/v25.0/${encodeURIComponent(igUserId)}/media_publish`,
        req,
        { signal }
      );
    },
    { schema: MetaMediaPublishRequestSchema }
  );

  return attachExamples({
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
  });
}
