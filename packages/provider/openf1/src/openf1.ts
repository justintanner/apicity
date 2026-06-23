import { attachExamples } from "./example";
import { OpenF1Error } from "./types";
import type {
  OpenF1ChampionshipDriverRequest,
  OpenF1ChampionshipDriverResponse,
  OpenF1ChampionshipDriversMethod,
  OpenF1ComparisonFilter,
  OpenF1FilterScalar,
  OpenF1LapRequest,
  OpenF1LapResponse,
  OpenF1LapsMethod,
  OpenF1MeetingsMethod,
  OpenF1MeetingsRequest,
  OpenF1MeetingsResponse,
  OpenF1Options,
  OpenF1PositionMethod,
  OpenF1PositionRequest,
  OpenF1PositionResponse,
  OpenF1Provider,
  OpenF1SessionResultMethod,
  OpenF1SessionResultRequest,
  OpenF1SessionResultResponse,
  OpenF1SessionRequest,
  OpenF1SessionResponse,
  OpenF1SessionsMethod,
} from "./types";
import {
  OpenF1ChampionshipDriverRequestSchema,
  OpenF1LapRequestSchema,
  OpenF1MeetingsRequestSchema,
  OpenF1PositionRequestSchema,
  OpenF1SessionResultRequestSchema,
  OpenF1SessionRequestSchema,
} from "./zod";

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

const CHAMPIONSHIP_DRIVER_QUERY_FIELDS = [
  "driver_number",
  "meeting_key",
  "points_current",
  "points_start",
  "position_current",
  "position_start",
  "session_key",
] as const satisfies readonly (keyof OpenF1ChampionshipDriverRequest)[];

const LAPS_QUERY_FIELDS = [
  "date_start",
  "driver_number",
  "duration_sector_1",
  "duration_sector_2",
  "duration_sector_3",
  "i1_speed",
  "i2_speed",
  "is_pit_out_lap",
  "lap_duration",
  "lap_number",
  "meeting_key",
  "segments_sector_1",
  "segments_sector_2",
  "segments_sector_3",
  "session_key",
  "st_speed",
] as const satisfies readonly (keyof OpenF1LapRequest)[];

const POSITION_QUERY_FIELDS = [
  "date",
  "driver_number",
  "meeting_key",
  "position",
  "session_key",
] as const satisfies readonly (keyof OpenF1PositionRequest)[];

const SESSION_RESULT_QUERY_FIELDS = [
  "dnf",
  "dns",
  "dsq",
  "driver_number",
  "duration",
  "gap_to_leader",
  "number_of_laps",
  "meeting_key",
  "position",
  "session_key",
] as const satisfies readonly (keyof OpenF1SessionResultRequest)[];

const SESSIONS_QUERY_FIELDS = [
  "circuit_key",
  "circuit_short_name",
  "country_code",
  "country_key",
  "country_name",
  "date_end",
  "date_start",
  "gmt_offset",
  "is_cancelled",
  "location",
  "meeting_key",
  "session_key",
  "session_name",
  "session_type",
  "year",
] as const satisfies readonly (keyof OpenF1SessionRequest)[];

type OpenF1QueryValue =
  | OpenF1FilterScalar
  | readonly OpenF1FilterScalar[]
  | undefined;

interface OpenF1QueryRequest {
  filters?: readonly OpenF1ComparisonFilter[];
  csv?: boolean;
}

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
  filter: OpenF1ComparisonFilter
): void {
  const key = filter.op === "=" ? filter.field : `${filter.field}${filter.op}`;
  qs.append(key, String(filter.value));
}

function buildQuery<Request extends OpenF1QueryRequest>(
  req: Request,
  fields: readonly Extract<keyof Request, string>[]
): string {
  const qs = new URLSearchParams();

  for (const field of fields) {
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
      const query = buildQuery(req, MEETINGS_QUERY_FIELDS);
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

  // GET https://api.openf1.org/v1/championship_drivers{query}
  // Docs: https://openf1.org/docs/#drivers-championship-beta
  const championshipDrivers = Object.assign(
    async (
      req: OpenF1ChampionshipDriverRequest = {},
      signal?: AbortSignal
    ): Promise<OpenF1ChampionshipDriverResponse | string> => {
      const query = buildQuery(req, CHAMPIONSHIP_DRIVER_QUERY_FIELDS);
      if (req.csv === true) {
        return makeGetRequest<string>(
          `/v1/championship_drivers${query}`,
          signal,
          "text"
        );
      }
      return makeGetRequest<OpenF1ChampionshipDriverResponse>(
        `/v1/championship_drivers${query}`,
        signal
      );
    },
    { schema: OpenF1ChampionshipDriverRequestSchema }
  ) as OpenF1ChampionshipDriversMethod;

  // GET https://api.openf1.org/v1/laps{query}
  // Docs: https://openf1.org/docs/#laps
  const laps = Object.assign(
    async (
      req: OpenF1LapRequest = {},
      signal?: AbortSignal
    ): Promise<OpenF1LapResponse | string> => {
      const query = buildQuery(req, LAPS_QUERY_FIELDS);
      if (req.csv === true) {
        return makeGetRequest<string>(`/v1/laps${query}`, signal, "text");
      }
      return makeGetRequest<OpenF1LapResponse>(`/v1/laps${query}`, signal);
    },
    { schema: OpenF1LapRequestSchema }
  ) as OpenF1LapsMethod;

  // GET https://api.openf1.org/v1/position{query}
  // Docs: https://openf1.org/docs/#position
  const position = Object.assign(
    async (
      req: OpenF1PositionRequest = {},
      signal?: AbortSignal
    ): Promise<OpenF1PositionResponse | string> => {
      const query = buildQuery(req, POSITION_QUERY_FIELDS);
      if (req.csv === true) {
        return makeGetRequest<string>(`/v1/position${query}`, signal, "text");
      }
      return makeGetRequest<OpenF1PositionResponse>(
        `/v1/position${query}`,
        signal
      );
    },
    { schema: OpenF1PositionRequestSchema }
  ) as OpenF1PositionMethod;

  // GET https://api.openf1.org/v1/session_result{query}
  // Docs: https://openf1.org/docs/#session-result
  const sessionResult = Object.assign(
    async (
      req: OpenF1SessionResultRequest = {},
      signal?: AbortSignal
    ): Promise<OpenF1SessionResultResponse | string> => {
      const query = buildQuery(req, SESSION_RESULT_QUERY_FIELDS);
      if (req.csv === true) {
        return makeGetRequest<string>(
          `/v1/session_result${query}`,
          signal,
          "text"
        );
      }
      return makeGetRequest<OpenF1SessionResultResponse>(
        `/v1/session_result${query}`,
        signal
      );
    },
    { schema: OpenF1SessionResultRequestSchema }
  ) as OpenF1SessionResultMethod;

  // GET https://api.openf1.org/v1/sessions{query}
  // Docs: https://openf1.org/docs/#sessions
  const sessions = Object.assign(
    async (
      req: OpenF1SessionRequest = {},
      signal?: AbortSignal
    ): Promise<OpenF1SessionResponse | string> => {
      const query = buildQuery(req, SESSIONS_QUERY_FIELDS);
      if (req.csv === true) {
        return makeGetRequest<string>(`/v1/sessions${query}`, signal, "text");
      }
      return makeGetRequest<OpenF1SessionResponse>(
        `/v1/sessions${query}`,
        signal
      );
    },
    { schema: OpenF1SessionRequestSchema }
  ) as OpenF1SessionsMethod;

  return attachExamples({
    v1: {
      championshipDrivers,
      laps,
      meetings,
      position,
      sessionResult,
      sessions,
    },
  });
}
