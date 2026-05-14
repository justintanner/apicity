import {
  YouTubeOptions,
  YouTubeProvider,
  YouTubeError,
  YouTubeVideosListRequest,
  YouTubeVideosListResponse,
} from "./types";
import {
  YouTubeChannelsListRequestSchema,
  YouTubeVideosInsertRequestSchema,
} from "./zod";

export function youtube(opts: YouTubeOptions): YouTubeProvider {
  const baseURL = opts.baseURL ?? "https://www.googleapis.com/youtube/v3";
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

  // YouTube Data API errors come as
  // `{ error: { code, message, errors: [...], status } }`.
  function formatErrorMessage(status: number, body: unknown): string {
    if (typeof body === "object" && body !== null) {
      const b = body as {
        error?: {
          message?: string;
          errors?: Array<{ message?: string; reason?: string }>;
        };
      };
      if (b.error?.errors && b.error.errors.length > 0) {
        const first = b.error.errors[0];
        if (first?.message) {
          return `YouTube API error ${status}: ${first.message}`;
        }
      }
      if (b.error?.message) {
        return `YouTube API error ${status}: ${b.error.message}`;
      }
    }
    return `YouTube API error: ${status}`;
  }

  async function makeJsonRequest<T>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
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
        throw new YouTubeError(
          formatErrorMessage(res.status, resBody),
          res.status,
          resBody
        );
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof YouTubeError) throw error;
      throw new YouTubeError(`YouTube request failed: ${error}`, 500);
    }
  }

  function buildQuery(
    params: Record<string, string | number | undefined>
  ): string {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        qs.append(key, String(value));
      }
    }
    const query = qs.toString();
    return query ? `?${query}` : "";
  }

  // sig-ok: namespace follows YouTube API method naming (`videos.list`)
  // GET https://www.googleapis.com/youtube/v3/videos{query}
  // Docs: https://developers.google.com/youtube/v3/docs/videos/list
  async function videosList(
    req: YouTubeVideosListRequest,
    signal?: AbortSignal
  ): Promise<YouTubeVideosListResponse> {
    const query = buildQuery({
      part: req.part,
      id: req.id,
      chart: req.chart,
      maxResults: req.maxResults,
      pageToken: req.pageToken,
    });
    return makeJsonRequest<YouTubeVideosListResponse>(
      "GET",
      `/videos${query}`,
      undefined,
      signal
    );
  }

  // sig-ok: namespace follows YouTube API method naming (`videos.insert`)
  // POST https://www.googleapis.com/youtube/v3/videos{query}
  // Docs: https://developers.google.com/youtube/v3/docs/videos/insert
  const videosInsert = Object.assign(
    async (
      req: import("./zod").YouTubeVideosInsertRequest,
      signal?: AbortSignal
    ): Promise<import("./types").YouTubeVideosInsertResponse> => {
      const boundary = "foo_bar_baz";

      const resource: Record<string, unknown> = {};
      if (req.snippet !== undefined) resource.snippet = req.snippet;
      if (req.status !== undefined) resource.status = req.status;
      if (req.recordingDetails !== undefined)
        resource.recordingDetails = req.recordingDetails;
      if (req.localizations !== undefined)
        resource.localizations = req.localizations;

      const parts: string[] = [];
      if (req.snippet !== undefined) parts.push("snippet");
      if (req.status !== undefined) parts.push("status");
      if (req.recordingDetails !== undefined) parts.push("recordingDetails");
      if (req.localizations !== undefined) parts.push("localizations");

      const metadataPart = new Blob([
        `--${boundary}\r\n`,
        `Content-Type: application/json; charset=UTF-8\r\n\r\n`,
        JSON.stringify(resource),
        `\r\n`,
      ]);

      const mediaPartHeader = new Blob([
        `--${boundary}\r\n`,
        `Content-Type: ${req.video.type || "application/octet-stream"}\r\n\r\n`,
      ]);

      const closingPart = new Blob([`\r\n--${boundary}--`]);

      const body = new Blob([
        metadataPart,
        mediaPartHeader,
        req.video,
        closingPart,
      ]);

      const query = buildQuery({
        uploadType: "multipart",
        part: parts.join(","),
        notifySubscribers:
          req.notifySubscribers === undefined
            ? undefined
            : String(req.notifySubscribers),
        onBehalfOfContentOwner: req.onBehalfOfContentOwner,
        onBehalfOfContentOwnerChannel: req.onBehalfOfContentOwnerChannel,
      });

      const uploadBaseURL = baseURL.replace(
        "/youtube/v3",
        "/upload/youtube/v3"
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (signal) {
        attachAbortHandler(signal, controller);
      }

      try {
        const res = await doFetch(`${uploadBaseURL}/videos${query}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${opts.accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body,
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
          throw new YouTubeError(
            formatErrorMessage(res.status, resBody),
            res.status,
            resBody
          );
        }

        return (await res.json()) as import("./types").YouTubeVideosInsertResponse;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof YouTubeError) throw error;
        throw new YouTubeError(`YouTube request failed: ${error}`, 500);
      }
    },
    { schema: YouTubeVideosInsertRequestSchema }
  );

  // sig-ok: namespace follows YouTube API method naming (`channels.list`)
  // GET https://www.googleapis.com/youtube/v3/channels{query}
  // Docs: https://developers.google.com/youtube/v3/docs/channels/list
  const channelsList = Object.assign(
    async (
      req: import("./zod").YouTubeChannelsListRequest,
      signal?: AbortSignal
    ): Promise<import("./types").YouTubeChannelsListResponse> => {
      const query = buildQuery({
        part: req.part,
        id: req.id,
        mine: req.mine === undefined ? undefined : String(req.mine),
        forUsername: req.forUsername,
        maxResults: req.maxResults,
        pageToken: req.pageToken,
      });
      return makeJsonRequest<import("./types").YouTubeChannelsListResponse>(
        "GET",
        `/channels${query}`,
        undefined,
        signal
      );
    },
    { schema: YouTubeChannelsListRequestSchema }
  );

  return {
    videos: {
      list: videosList,
      insert: videosInsert,
    },
    channels: {
      list: channelsList,
    },
  };
}
