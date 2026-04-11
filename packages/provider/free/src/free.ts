import {
  FreeOptions,
  TmpfilesUploadRequest,
  TmpfilesUploadResponse,
  UguuUploadRequest,
  UguuUploadResponse,
  CatboxUploadRequest,
  LitterboxUploadRequest,
  GofileUploadRequest,
  GofileUploadResponse,
  FilebinUploadRequest,
  FilebinUploadResponse,
  TempshUploadRequest,
  TflinkUploadRequest,
  TflinkUploadResponse,
  FreeProvider,
  FreeError,
} from "./types";
import type { ValidationResult } from "./types";
import {
  tmpfilesUploadSchema,
  uguuUploadSchema,
  catboxUploadSchema,
  litterboxUploadSchema,
  gofileUploadSchema,
  filebinUploadSchema,
  tempshUploadSchema,
  tflinkUploadSchema,
} from "./schemas";
import { validatePayload } from "./validate";

export function free(opts?: FreeOptions): FreeProvider {
  const doFetch = opts?.fetch ?? fetch;
  const timeout = opts?.timeout ?? 30000;

  function attachAbortHandler(
    signal: AbortSignal,
    controller: AbortController
  ): void {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  async function makeFormRequest<T>(
    url: string,
    form: FormData,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(url, {
        method: "POST",
        headers: {},
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const message = `Free API error: ${res.status}`;
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new FreeError(message, res.status, resBody);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof FreeError) throw error;
      throw new FreeError(`Free request failed: ${error}`, 500);
    }
  }

  async function makeFormRequestText(
    url: string,
    form: FormData,
    signal?: AbortSignal
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(url, {
        method: "POST",
        headers: {},
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const message = `Free API error: ${res.status}`;
        let resBody: unknown = null;
        try {
          resBody = await res.text();
        } catch {
          // ignore parse errors
        }
        throw new FreeError(message, res.status, resBody);
      }

      return (await res.text()).trim();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof FreeError) throw error;
      throw new FreeError(`Free request failed: ${error}`, 500);
    }
  }

  async function makeBinaryPostRequest<T>(
    url: string,
    body: Blob,
    headers: Record<string, string>,
    signal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const message = `Free API error: ${res.status}`;
        let resBody: unknown = null;
        try {
          resBody = await res.json();
        } catch {
          // ignore parse errors
        }
        throw new FreeError(message, res.status, resBody);
      }

      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof FreeError) throw error;
      throw new FreeError(`Free request failed: ${error}`, 500);
    }
  }

  // -- tmpfiles.org -----------------------------------------------------------

  const tmpfilesApiV1 = {
    upload: Object.assign(
      async (
        req: TmpfilesUploadRequest,
        signal?: AbortSignal
      ): Promise<TmpfilesUploadResponse> => {
        const form = new FormData();
        form.append("file", req.file, req.filename ?? "upload");
        return makeFormRequest<TmpfilesUploadResponse>(
          "https://tmpfiles.org/api/v1/upload",
          form,
          signal
        );
      },
      {
        payloadSchema: tmpfilesUploadSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, tmpfilesUploadSchema);
        },
      }
    ),
  };

  // -- uguu.se ----------------------------------------------------------------

  const uguu = {
    upload: Object.assign(
      async (
        req: UguuUploadRequest,
        signal?: AbortSignal
      ): Promise<UguuUploadResponse> => {
        const form = new FormData();
        form.append("files[]", req.file, req.filename ?? "upload");
        return makeFormRequest<UguuUploadResponse>(
          "https://uguu.se/upload",
          form,
          signal
        );
      },
      {
        payloadSchema: uguuUploadSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, uguuUploadSchema);
        },
      }
    ),
  };

  // -- catbox.moe -------------------------------------------------------------

  const catbox = {
    upload: Object.assign(
      async (
        req: CatboxUploadRequest,
        signal?: AbortSignal
      ): Promise<string> => {
        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", req.file, req.filename ?? "upload");
        return makeFormRequestText(
          "https://catbox.moe/user/api.php",
          form,
          signal
        );
      },
      {
        payloadSchema: catboxUploadSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, catboxUploadSchema);
        },
      }
    ),
  };

  // -- litterbox.catbox.moe ---------------------------------------------------

  const litterbox = {
    upload: Object.assign(
      async (
        req: LitterboxUploadRequest,
        signal?: AbortSignal
      ): Promise<string> => {
        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("time", req.time ?? "1h");
        form.append("fileToUpload", req.file, req.filename ?? "upload");
        return makeFormRequestText(
          "https://litterbox.catbox.moe/resources/internals/api.php",
          form,
          signal
        );
      },
      {
        payloadSchema: litterboxUploadSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, litterboxUploadSchema);
        },
      }
    ),
  };

  // -- gofile.io --------------------------------------------------------------

  const gofile = {
    upload: Object.assign(
      async (
        req: GofileUploadRequest,
        signal?: AbortSignal
      ): Promise<GofileUploadResponse> => {
        const form = new FormData();
        form.append("file", req.file, req.filename ?? "upload");
        return makeFormRequest<GofileUploadResponse>(
          "https://upload.gofile.io/uploadfile",
          form,
          signal
        );
      },
      {
        payloadSchema: gofileUploadSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, gofileUploadSchema);
        },
      }
    ),
  };

  // -- filebin.net ------------------------------------------------------------

  const filebin = {
    upload: Object.assign(
      async (
        req: FilebinUploadRequest,
        signal?: AbortSignal
      ): Promise<FilebinUploadResponse> => {
        const bin =
          req.bin ??
          `apicity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const filename = req.filename ?? "upload";
        return makeBinaryPostRequest<FilebinUploadResponse>(
          `https://filebin.net/${bin}/${filename}`,
          req.file,
          { Accept: "application/json" },
          signal
        );
      },
      {
        payloadSchema: filebinUploadSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, filebinUploadSchema);
        },
      }
    ),
  };

  // -- temp.sh ----------------------------------------------------------------

  const tempsh = {
    upload: Object.assign(
      async (
        req: TempshUploadRequest,
        signal?: AbortSignal
      ): Promise<string> => {
        const form = new FormData();
        form.append("file", req.file, req.filename ?? "upload");
        return makeFormRequestText("https://temp.sh/upload", form, signal);
      },
      {
        payloadSchema: tempshUploadSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, tempshUploadSchema);
        },
      }
    ),
  };

  // -- tmpfile.link (tfLink) --------------------------------------------------

  const tflink = {
    upload: Object.assign(
      async (
        req: TflinkUploadRequest,
        signal?: AbortSignal
      ): Promise<TflinkUploadResponse> => {
        const form = new FormData();
        form.append("file", req.file, req.filename ?? "upload");
        return makeFormRequest<TflinkUploadResponse>(
          "https://tmpfile.link/api/upload",
          form,
          signal
        );
      },
      {
        payloadSchema: tflinkUploadSchema,
        validatePayload(data: unknown): ValidationResult {
          return validatePayload(data, tflinkUploadSchema);
        },
      }
    ),
  };

  // -- Provider ---------------------------------------------------------------

  return {
    tmpfiles: { api: { v1: tmpfilesApiV1 } },
    uguu,
    catbox,
    litterbox,
    gofile,
    filebin,
    tempsh,
    tflink,
  };
}
