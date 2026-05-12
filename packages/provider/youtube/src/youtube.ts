import { YouTubeOptions, YouTubeProvider, YouTubeError } from "./types";

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Endpoints will be added by subsequent tasks.
  // See parent epic for planned endpoints:
  //   videos.insert (resumable upload)
  //   commentThreads.insert
  //   comments.insert
  //   playlists.insert
  //   playlistItems.insert

  return {} as YouTubeProvider;
}
