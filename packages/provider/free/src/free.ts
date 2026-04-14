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
import {
  TmpfilesUploadRequestSchema,
  UguuUploadRequestSchema,
  CatboxUploadRequestSchema,
  LitterboxUploadRequestSchema,
  GofileUploadRequestSchema,
  FilebinUploadRequestSchema,
  TempshUploadRequestSchema,
  TflinkUploadRequestSchema,
} from "./zod";

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
    // sig-ok: service-name grouping (multi-host wrapper)
    // POST https://tmpfiles.org/api/v1/upload
    // Docs: https://tmpfiles.org/
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
        schema: TmpfilesUploadRequestSchema,
      }
    ),
  };

  // -- uguu.se ----------------------------------------------------------------

  const uguu = {
    // sig-ok: service-name grouping (multi-host wrapper)
    // POST https://uguu.se/upload
    // Docs: https://uguu.se/
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
        schema: UguuUploadRequestSchema,
      }
    ),
  };

  // -- catbox.moe -------------------------------------------------------------

  const catbox = {
    // sig-ok: service-name grouping (multi-host wrapper)
    // POST https://catbox.moe/user/api.php
    // Docs: https://catbox.moe/tools.php
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
        schema: CatboxUploadRequestSchema,
      }
    ),
  };

  // -- litterbox.catbox.moe ---------------------------------------------------

  const litterbox = {
    // sig-ok: service-name grouping (multi-host wrapper)
    // POST https://litterbox.catbox.moe/resources/internals/api.php
    // Docs: https://litterbox.catbox.moe/
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
        schema: LitterboxUploadRequestSchema,
      }
    ),
  };

  // -- gofile.io --------------------------------------------------------------

  const gofile = {
    // sig-ok: service-name grouping (multi-host wrapper)
    // POST https://upload.gofile.io/uploadfile
    // Docs: https://gofile.io/api
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
        schema: GofileUploadRequestSchema,
      }
    ),
  };

  // -- filebin.net ------------------------------------------------------------

  const filebin = {
    // sig-ok: service-name grouping (multi-host wrapper)
    // POST https://filebin.net/{bin}/{filename}
    // Docs: https://filebin.net/
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
        schema: FilebinUploadRequestSchema,
      }
    ),
  };

  // -- temp.sh ----------------------------------------------------------------

  const tempsh = {
    // sig-ok: service-name grouping (multi-host wrapper)
    // POST https://temp.sh/upload
    // Docs: https://temp.sh/
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
        schema: TempshUploadRequestSchema,
      }
    ),
  };

  // -- tmpfile.link (tfLink) --------------------------------------------------

  const tflink = {
    // sig-ok: service-name grouping (multi-host wrapper)
    // POST https://tmpfile.link/api/upload
    // Docs: https://tmpfile.link/
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
        schema: TflinkUploadRequestSchema,
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
