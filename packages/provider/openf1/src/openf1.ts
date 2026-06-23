import { attachExamples } from "./example";
import { OpenF1Error } from "./types";
import type {
  OpenF1FilterScalar,
  OpenF1MeetingsFilter,
  OpenF1MeetingsMethod,
  OpenF1MeetingsRequest,
  OpenF1MeetingsResponse,
  OpenF1Options,
  OpenF1Provider,
} from "./types";
import { OpenF1MeetingsRequestSchema } from "./zod";

const MEETINGS_QUERY_FIELDS = [
  "circuit_key",
  "circuit_image",
  "circuit_info_url",
  "circuit_short_name",
  "circuit_type",
  "country_code",
  "country_flag",
  "country_key",
  "country_name",
  "date_end",
  "date_start",
  "gmt_offset",
  "is_cancelled",
  "location",
  "meeting_key",
  "meeting_name",
  "meeting_official_name",
  "year",
] as const satisfies readonly (keyof OpenF1MeetingsRequest)[];

type OpenF1QueryValue =
  | OpenF1FilterScalar
  | readonly OpenF1FilterScalar[]
  | undefined;

interface OpenF1ErrorBody {
  error?: string;
  detail?: string;
  message?: string;
  title?: string;
}

function isErrorBody(value: unknown): value is OpenF1ErrorBody {
  return typeof value === "object" && value !== null;
}

function formatErrorMessage(status: number, body: unknown): string {
  if (isErrorBody(body)) {
    const message = body.detail ?? body.error ?? body.message ?? body.title;
    if (message) {
      return `OpenF1 API error ${status}: ${message}`;
    }
  }
  if (typeof body === "string" && body.length > 0) {
    return `OpenF1 API error ${status}: ${body}`;
  }
  return `OpenF1 API error: ${status}`;
}

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

function addQueryValue(
  qs: URLSearchParams,
  key: string,
  value: OpenF1QueryValue
): void {
  if (value === undefined) {
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      qs.append(key, String(item));
    }
    return;
  }
  qs.append(key, String(value));
}

function addComparisonFilter(
  qs: URLSearchParams,
  filter: OpenF1MeetingsFilter
): void {
  const key = filter.op === "=" ? filter.field : `${filter.field}${filter.op}`;
  qs.append(key, String(filter.value));
}

function buildQuery(req: OpenF1MeetingsRequest): string {
  const qs = new URLSearchParams();

  for (const field of MEETINGS_QUERY_FIELDS) {
    addQueryValue(qs, field, req[field] as OpenF1QueryValue);
  }

  for (const filter of req.filters ?? []) {
    addComparisonFilter(qs, filter);
  }

  if (req.csv === true) {
    qs.append("csv", "true");
  }

  const query = qs.toString();
  return query ? `?${query}` : "";
}

export function createOpenF1(opts?: OpenF1Options): OpenF1Provider {
  const baseURL = (opts?.baseURL ?? "https://api.openf1.org").replace(
    /\/+$/,
    ""
  );
  const doFetch = opts?.fetch ?? fetch;
  const timeout = opts?.timeout ?? 30000;

  async function parseBody(res: Response): Promise<unknown> {
    const text = await res.text();
    if (text.length === 0) {
      return null;
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  async function makeGetRequest<T>(
    path: string,
    signal?: AbortSignal,
    responseKind: "json" | "text" = "json"
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    try {
      const res = await doFetch(`${baseURL}${path}`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const body = await parseBody(res);
        throw new OpenF1Error(
          formatErrorMessage(res.status, body),
          res.status,
          body
        );
      }

      if (responseKind === "text") {
        return (await res.text()) as T;
      }

      const body = await parseBody(res);
      return body as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof OpenF1Error) throw error;
      throw new OpenF1Error(`OpenF1 request failed: ${error}`, 500);
    }
  }

  // GET https://api.openf1.org/v1/meetings{query}
  // Docs: https://openf1.org/docs/#meetings
  const meetings = Object.assign(
    async (
      req: OpenF1MeetingsRequest = {},
      signal?: AbortSignal
    ): Promise<OpenF1MeetingsResponse | string> => {
      const query = buildQuery(req);
      if (req.csv === true) {
        return makeGetRequest<string>(`/v1/meetings${query}`, signal, "text");
      }
      return makeGetRequest<OpenF1MeetingsResponse>(
        `/v1/meetings${query}`,
        signal
      );
    },
    { schema: OpenF1MeetingsRequestSchema }
  ) as OpenF1MeetingsMethod;

  return attachExamples({
    v1: {
      meetings,
    },
  });
}
