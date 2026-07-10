import {
  XOptions,
  XMediaUploadInitializeRequest,
  XMediaUploadInitializeResponse,
  XMediaUploadAppendRequest,
  XMediaUploadAppendResponse,
  XMediaUploadFinalizeResponse,
  XMediaUploadStatusResponse,
  XUsersMeRequest,
  XUsersMeResponse,
  XTweetCreateRequest,
  XTweetCreateResponse,
  XProvider,
  XError,
} from "./types";
import {
  XMediaUploadInitializeRequestSchema,
  XMediaUploadAppendRequestSchema,
  XUsersMeRequestSchema,
  XTweetCreateRequestSchema,
} from "./zod";
import { attachExamples } from "./example";
import { createTransport } from "./transport";

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

export function createX(opts: XOptions): XProvider {
  const baseURL = opts.baseURL ?? "https://api.x.com";
  const timeout = opts.timeout ?? 30000;

  const transport = createTransport({
    baseUrl: baseURL,
    timeoutMs: timeout,
    fetchImpl: opts.fetch,
    defaultHeaders: () => ({ Authorization: `Bearer ${opts.accessToken}` }),
    parseErrorBody: (status, body) => ({
      message: formatErrorMessage(status, body),
    }),
    errorClass: XError,
  });

  // Finalize is a POST with no body and no Content-Type header; use raw() so
  // the request stays byte-identical to the recorded fixture.
  async function makeEmptyPost<T>(
    path: string,
    signal?: AbortSignal
  ): Promise<T> {
    try {
      const res = await transport.raw(path, { method: "POST", signal });
      return (await res.json()) as T;
    } catch (error) {
      if (error instanceof XError) throw error;
      throw new XError(`X request failed: ${error}`, 500);
    }
  }

  function appendArrayQuery(
    params: URLSearchParams,
    key: string,
    values: readonly string[] | undefined
  ): void {
    if (values && values.length > 0) {
      params.set(key, values.join(","));
    }
  }

  function makeUsersMeQuery(req: XUsersMeRequest | undefined): string {
    const params = new URLSearchParams();
    appendArrayQuery(params, "user.fields", req?.["user.fields"]);
    appendArrayQuery(params, "expansions", req?.expansions);
    appendArrayQuery(params, "tweet.fields", req?.["tweet.fields"]);

    const query = params.toString();
    return query ? `?${query}` : "";
  }

  // sig-ok: numeric URL segments (`/2/`) become identifier-safe (`v2`)
  // POST https://api.x.com/2/media/upload/initialize
  // Docs: https://docs.x.com/x-api/media/media-upload-initialize
  const mediaUploadInitialize = Object.assign(
    async (
      req: XMediaUploadInitializeRequest,
      signal?: AbortSignal
    ): Promise<XMediaUploadInitializeResponse> => {
      return transport.postJson<XMediaUploadInitializeResponse>(
        "/2/media/upload/initialize",
        req,
        { signal }
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
      return transport.postForm<XMediaUploadAppendResponse>(
        `/2/media/upload/${encodeURIComponent(id)}/append`,
        form,
        { signal }
      );
    },
    { schema: XMediaUploadAppendRequestSchema }
  );

  // schema-ok: body-less POST (no request payload)
  // sig-ok: numeric URL segments (`/2/`) become identifier-safe (`v2`)
  // POST https://api.x.com/2/media/upload/{id}/finalize
  // Docs: https://docs.x.com/x-api/media/finalize-media-upload
  async function mediaUploadFinalize(
    id: string,
    signal?: AbortSignal
  ): Promise<XMediaUploadFinalizeResponse> {
    return makeEmptyPost<XMediaUploadFinalizeResponse>(
      `/2/media/upload/${encodeURIComponent(id)}/finalize`,
      signal
    );
  }

  // sig-ok: numeric URL segments (`/2/`) become identifier-safe (`v2`)
  // GET https://api.x.com/2/media/upload{query}
  // Docs: https://docs.x.com/x-api/media/get-media-upload-status
  async function mediaUploadStatus(
    mediaId: string,
    signal?: AbortSignal
  ): Promise<XMediaUploadStatusResponse> {
    const query = `?media_id=${encodeURIComponent(mediaId)}&command=STATUS`;
    return transport.getJson<XMediaUploadStatusResponse>(
      `/2/media/upload${query}`,
      { signal }
    );
  }

  // sig-ok: numeric URL segments (`/2/`) become identifier-safe (`v2`)
  // GET https://api.x.com/2/users/me{query}
  // Docs: https://docs.x.com/x-api/users/get-my-user
  const usersMe = Object.assign(
    async (
      req?: XUsersMeRequest,
      signal?: AbortSignal
    ): Promise<XUsersMeResponse> => {
      const query = makeUsersMeQuery(req);
      return transport.getJson<XUsersMeResponse>(`/2/users/me${query}`, {
        signal,
      });
    },
    { schema: XUsersMeRequestSchema }
  );

  // sig-ok: numeric URL segments (`/2/`) become identifier-safe (`v2`)
  // POST https://api.x.com/2/tweets
  // Docs: https://docs.x.com/x-api/posts/create-post
  const tweetsCreate = Object.assign(
    async (
      req: XTweetCreateRequest,
      signal?: AbortSignal
    ): Promise<XTweetCreateResponse> => {
      return transport.postJson<XTweetCreateResponse>("/2/tweets", req, {
        signal,
      });
    },
    { schema: XTweetCreateRequestSchema }
  );

  return attachExamples({
    post: {
      v2: {
        media: {
          upload: {
            initialize: mediaUploadInitialize,
            append: mediaUploadAppend,
            finalize: mediaUploadFinalize,
          },
        },
        tweets: tweetsCreate,
      },
    },
    get: {
      v2: {
        media: {
          upload: mediaUploadStatus,
        },
        users: {
          me: usersMe,
        },
      },
    },
  });
}
