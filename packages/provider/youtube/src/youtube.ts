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
  YouTubeGetTranscriptRequestSchema,
  YouTubeGetVideoMetadataRequestSchema,
} from "./zod";

export function buildQuery(
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

export function extractVideoId(input: string): string | null {
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  const match = input.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

export function parseTranscriptXml(
  xml: string
): import("./types").YouTubeTranscriptSegment[] {
  const segments: import("./types").YouTubeTranscriptSegment[] = [];
  const regex =
    /<text[^>]*start="([0-9.]+)"[^>]*dur="([0-9.]+)"[^>]*>([^<]*)<\/text>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    segments.push({
      start: parseFloat(match[1]),
      duration: parseFloat(match[2]),
      text: decodeHtmlEntities(match[3]),
    });
  }
  return segments;
}

export function createYouTube(opts?: YouTubeOptions): YouTubeProvider {
  const baseURL = opts?.baseURL ?? "https://www.googleapis.com/youtube/v3";
  const doFetch = opts?.fetch ?? fetch;
  const timeout = opts?.timeout ?? 30000;

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
      const headers: Record<string, string> = {};
      if (opts?.accessToken) {
        headers.Authorization = `Bearer ${opts.accessToken}`;
      }
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
            Authorization: `Bearer ${opts?.accessToken ?? ""}`,
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

  // -- transcripts.get (keyless) -------------------------------------------

  function extractPlayerResponse(html: string): unknown | null {
    // Find the assignment manually and count braces. Regex approaches fail on
    // nested JSON because lazy quantifiers stop at the first '}' they see.
    const marker = "ytInitialPlayerResponse";
    const idx = html.indexOf(marker);
    if (idx === -1) return null;
    const start = html.indexOf("{", idx);
    if (start === -1) return null;
    let depth = 0;
    let end = start;
    while (end < html.length) {
      const ch = html[end];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      if (depth === 0) break;
      end++;
    }
    if (depth !== 0) return null;
    try {
      return JSON.parse(html.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  // GET https://www.youtube.com/watch?v={videoId}
  // Docs: https://github.com/jdepoix/youtube-transcript-api
  const getTranscript = Object.assign(
    async (
      req: import("./zod").YouTubeGetTranscriptRequest,
      signal?: AbortSignal
    ): Promise<import("./types").YouTubeGetTranscriptResponse> => {
      const videoId = extractVideoId(req.videoId);
      if (!videoId) {
        throw new YouTubeError(
          "Invalid videoId: must be an 11-character YouTube video ID or a full URL",
          400
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (signal) {
        attachAbortHandler(signal, controller);
      }

      let watchHtml: string;
      try {
        const watchRes = await doFetch(
          `https://www.youtube.com/watch?v=${videoId}`,
          {
            method: "GET",
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
            signal: controller.signal,
          }
        );
        if (!watchRes.ok) {
          throw new YouTubeError(
            `Failed to fetch watch page: ${watchRes.status}`,
            watchRes.status
          );
        }
        watchHtml = await watchRes.text();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof YouTubeError) throw error;
        throw new YouTubeError(
          `YouTube watch page request failed: ${error}`,
          500
        );
      }

      let playerResponse: unknown;
      try {
        playerResponse = extractPlayerResponse(watchHtml);
      } catch {
        clearTimeout(timeoutId);
        throw new YouTubeError(
          "Could not extract player response from watch page. The video may be private, unavailable, or age-restricted.",
          404
        );
      }
      if (!playerResponse) {
        clearTimeout(timeoutId);
        throw new YouTubeError(
          "Could not extract player response from watch page. The video may be private, unavailable, or age-restricted.",
          404
        );
      }

      const captions = (
        playerResponse as {
          captions?: {
            playerCaptionsTracklistRenderer?: {
              captionTracks?: Array<{
                baseUrl: string;
                name?: { simpleText?: string };
                languageCode?: string;
                kind?: string;
              }>;
            };
          };
        }
      )?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

      if (!captions || captions.length === 0) {
        clearTimeout(timeoutId);
        throw new YouTubeError(
          "No captions available for this video. Captions may be disabled or the video may not have any.",
          404
        );
      }

      let track = captions[0];
      if (req.lang) {
        const preferred = captions.find((c) => c.languageCode === req.lang);
        if (preferred) track = preferred;
      }

      let xmlText: string;
      try {
        const captionRes = await doFetch(track.baseUrl, {
          method: "GET",
          signal: controller.signal,
        });
        if (!captionRes.ok) {
          throw new YouTubeError(
            `Failed to fetch captions: ${captionRes.status}`,
            captionRes.status
          );
        }
        xmlText = await captionRes.text();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof YouTubeError) throw error;
        throw new YouTubeError(`YouTube caption request failed: ${error}`, 500);
      }

      clearTimeout(timeoutId);

      const segments = parseTranscriptXml(xmlText);
      const plainText = segments.map((s) => s.text).join(" ");

      return { segments, plainText };
    },
    { schema: YouTubeGetTranscriptRequestSchema }
  );

  // GET https://www.youtube.com/oembed?url={videoUrl}&format=json
  // Docs: https://developers.google.com/youtube/player_parameters
  const getVideoMetadata = Object.assign(
    async (
      req: import("./zod").YouTubeGetVideoMetadataRequest,
      signal?: AbortSignal
    ): Promise<import("./types").YouTubeGetVideoMetadataResponse> => {
      const videoId = extractVideoId(req.videoId);
      if (!videoId) {
        throw new YouTubeError(
          "Invalid videoId: must be an 11-character YouTube video ID or a full URL",
          400
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (signal) {
        attachAbortHandler(signal, controller);
      }

      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const res = await doFetch(oembedUrl, {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
          throw new YouTubeError(
            `oEmbed request failed: ${res.status}`,
            res.status,
            resBody
          );
        }

        const data = (await res.json()) as Record<string, unknown>;

        return {
          title: String(data.title ?? ""),
          authorName: String(data.author_name ?? ""),
          authorUrl: String(data.author_url ?? ""),
          type: String(data.type ?? ""),
          html: String(data.html ?? ""),
          width: Number(data.width ?? 0),
          height: Number(data.height ?? 0),
          thumbnailUrl: String(data.thumbnail_url ?? ""),
          thumbnailWidth: Number(data.thumbnail_width ?? 0),
          thumbnailHeight: Number(data.thumbnail_height ?? 0),
          providerName: String(data.provider_name ?? ""),
          providerUrl: String(data.provider_url ?? ""),
        };
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof YouTubeError) throw error;
        throw new YouTubeError(
          `YouTube metadata request failed: ${error}`,
          500
        );
      }
    },
    { schema: YouTubeGetVideoMetadataRequestSchema }
  );

  return {
    videos: {
      list: videosList,
      insert: videosInsert,
    },
    channels: {
      list: channelsList,
    },
    transcripts: {
      get: getTranscript,
    },
    videoMetadata: getVideoMetadata,
  };
}
