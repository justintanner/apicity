import {
  XaiOptions,
  XaiChatRequest,
  XaiChatResponse,
  XaiImageGenerateRequest,
  XaiImageEditRequest,
  XaiImageResponse,
  XaiVideoGenerateRequest,
  XaiVideoExtendRequest,
  XaiVideoAsyncResponse,
  XaiVideoResult,
  XaiFileObject,
  XaiFileListResponse,
  XaiProvider,
  XaiError,
} from "./types";

export function xai(opts: XaiOptions): XaiProvider {
  const baseURL = opts.baseURL ?? "https://api.x.ai/v1";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;

  async function makeRequest<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${opts.apiKey}`,
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
        let message = `XAI API error: ${res.status}`;
        let body: unknown = null;
        try {
          body = await res.json();
          if (typeof body === "object" && body !== null && "error" in body) {
            const err = (body as { error: { message?: string } }).error;
            if (err?.message) {
              message = `XAI API error ${res.status}: ${err.message}`;
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new XaiError(message, res.status, body);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof XaiError) throw error;
      throw new XaiError(`XAI request failed: ${error}`, 500);
    }
  }

  const videos = Object.assign(
    async function videos(
      requestId: string,
      signal?: AbortSignal
    ): Promise<XaiVideoResult> {
      return await makeRequest(
        "GET",
        `/videos/${requestId}`,
        undefined,
        signal
      );
    },
    {
      async generations(
        req: XaiVideoGenerateRequest,
        signal?: AbortSignal
      ): Promise<XaiVideoAsyncResponse> {
        return await makeRequest("POST", "/videos/generations", req, signal);
      },

      async extensions(
        req: XaiVideoExtendRequest,
        signal?: AbortSignal
      ): Promise<XaiVideoAsyncResponse> {
        return await makeRequest("POST", "/videos/extensions", req, signal);
      },
    }
  );

  const files = {
    async upload(
      file: Blob,
      filename: string,
      purpose?: string,
      signal?: AbortSignal
    ): Promise<XaiFileObject> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      if (signal) {
        signal.addEventListener("abort", () => controller.abort());
      }

      try {
        const formData = new FormData();
        formData.append("file", file, filename);
        if (purpose !== undefined) formData.append("purpose", purpose);

        const res = await doFetch(`${baseURL}/files`, {
          method: "POST",
          headers: { Authorization: `Bearer ${opts.apiKey}` },
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let message = `XAI API error: ${res.status}`;
          let body: unknown = null;
          try {
            body = await res.json();
            if (typeof body === "object" && body !== null && "error" in body) {
              const err = (body as { error: { message?: string } }).error;
              if (err?.message) {
                message = `XAI API error ${res.status}: ${err.message}`;
              }
            }
          } catch {
            // ignore parse errors
          }
          throw new XaiError(message, res.status, body);
        }

        return (await res.json()) as XaiFileObject;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof XaiError) throw error;
        throw new XaiError(`XAI request failed: ${error}`, 500);
      }
    },

    async list(signal?: AbortSignal): Promise<XaiFileListResponse> {
      return await makeRequest("GET", "/files", undefined, signal);
    },

    async get(fileId: string, signal?: AbortSignal): Promise<XaiFileObject> {
      return await makeRequest("GET", `/files/${fileId}`, undefined, signal);
    },

    async delete(
      fileId: string,
      signal?: AbortSignal
    ): Promise<{ id: string; deleted: boolean }> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      if (signal) {
        signal.addEventListener("abort", () => controller.abort());
      }

      try {
        const res = await doFetch(`${baseURL}/files/${fileId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${opts.apiKey}` },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let deleteBody: unknown = null;
          try {
            deleteBody = await res.json();
          } catch {
            // ignore parse errors
          }
          throw new XaiError(
            `XAI API error: ${res.status}`,
            res.status,
            deleteBody
          );
        }

        return (await res.json()) as { id: string; deleted: boolean };
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof XaiError) throw error;
        throw new XaiError(`XAI request failed: ${error}`, 500);
      }
    },
  };

  return {
    v1: {
      chat: {
        async completions(
          req: XaiChatRequest,
          signal?: AbortSignal
        ): Promise<XaiChatResponse> {
          return await makeRequest<XaiChatResponse>(
            "POST",
            "/chat/completions",
            req,
            signal
          );
        },
      },
      images: {
        async generations(
          req: XaiImageGenerateRequest,
          signal?: AbortSignal
        ): Promise<XaiImageResponse> {
          return await makeRequest("POST", "/images/generations", req, signal);
        },

        async edits(
          req: XaiImageEditRequest,
          signal?: AbortSignal
        ): Promise<XaiImageResponse> {
          return await makeRequest("POST", "/images/edits", req, signal);
        },
      },
      videos,
      files,
    },
  };
}
