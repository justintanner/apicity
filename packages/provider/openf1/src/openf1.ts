import { attachExamples } from "./example";
import { OpenF1Error } from "./types";
import type {
  OpenF1CarDataMethod,
  OpenF1CarDataRequest,
  OpenF1CarDataResponse,
  OpenF1ChampionshipDriverRequest,
  OpenF1ChampionshipDriverResponse,
  OpenF1ChampionshipDriversMethod,
  OpenF1ChampionshipTeamRequest,
  OpenF1ChampionshipTeamResponse,
  OpenF1ChampionshipTeamsMethod,
  OpenF1ComparisonFilter,
  OpenF1FilterScalar,
  OpenF1IntervalsMethod,
  OpenF1IntervalsRequest,
  OpenF1IntervalsResponse,
  OpenF1LapRequest,
  OpenF1LapResponse,
  OpenF1LapsMethod,
  OpenF1MeetingsMethod,
  OpenF1MeetingsRequest,
  OpenF1MeetingsResponse,
  OpenF1Options,
  OpenF1OvertakeRequest,
  OpenF1OvertakeResponse,
  OpenF1OvertakesMethod,
  OpenF1PositionMethod,
  OpenF1PositionRequest,
  OpenF1PositionResponse,
  OpenF1PitStopRequest,
  OpenF1PitStopResponse,
  OpenF1PitStopsMethod,
  OpenF1Provider,
  OpenF1RaceControlMessageRequest,
  OpenF1RaceControlMessageResponse,
  OpenF1RaceControlMethod,
  OpenF1SessionResultMethod,
  OpenF1SessionResultRequest,
  OpenF1SessionResultResponse,
  OpenF1SessionRequest,
  OpenF1SessionResponse,
  OpenF1SessionsMethod,
  OpenF1StartingGridEntryRequest,
  OpenF1StartingGridEntryResponse,
  OpenF1StartingGridMethod,
  OpenF1StintRequest,
  OpenF1StintResponse,
  OpenF1StintsMethod,
  OpenF1TeamRadioMethod,
  OpenF1TeamRadioRequest,
  OpenF1TeamRadioResponse,
  OpenF1TokenMethod,
  OpenF1TokenRequest,
  OpenF1TokenResponse,
  OpenF1WeatherMethod,
  OpenF1WeatherRequest,
  OpenF1WeatherResponse,
} from "./types";
import {
  OpenF1CarDataRequestSchema,
  OpenF1ChampionshipDriverRequestSchema,
  OpenF1ChampionshipTeamRequestSchema,
  OpenF1IntervalsRequestSchema,
  OpenF1LapRequestSchema,
  OpenF1MeetingsRequestSchema,
  OpenF1OvertakeRequestSchema,
  OpenF1PositionRequestSchema,
  OpenF1PitStopRequestSchema,
  OpenF1RaceControlMessageRequestSchema,
  OpenF1SessionResultRequestSchema,
  OpenF1SessionRequestSchema,
  OpenF1StartingGridEntryRequestSchema,
  OpenF1StintRequestSchema,
  OpenF1TeamRadioRequestSchema,
  OpenF1TokenRequestSchema,
  OpenF1WeatherRequestSchema,
} from "./zod";

const CAR_DATA_QUERY_FIELDS = [
  "brake",
  "date",
  "driver_number",
  "drs",
  "meeting_key",
  "n_gear",
  "rpm",
  "session_key",
  "speed",
  "throttle",
] as const satisfies readonly (keyof OpenF1CarDataRequest)[];

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

const CHAMPIONSHIP_TEAM_QUERY_FIELDS = [
  "meeting_key",
  "points_current",
  "points_start",
  "position_current",
  "position_start",
  "session_key",
  "team_name",
] as const satisfies readonly (keyof OpenF1ChampionshipTeamRequest)[];

const INTERVALS_QUERY_FIELDS = [
  "date",
  "driver_number",
  "gap_to_leader",
  "interval",
  "meeting_key",
  "session_key",
] as const satisfies readonly (keyof OpenF1IntervalsRequest)[];

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

const OVERTAKES_QUERY_FIELDS = [
  "date",
  "meeting_key",
  "overtaken_driver_number",
  "overtaking_driver_number",
  "position",
  "session_key",
] as const satisfies readonly (keyof OpenF1OvertakeRequest)[];

const POSITION_QUERY_FIELDS = [
  "date",
  "driver_number",
  "meeting_key",
  "position",
  "session_key",
] as const satisfies readonly (keyof OpenF1PositionRequest)[];

const PIT_STOP_QUERY_FIELDS = [
  "date",
  "driver_number",
  "lane_duration",
  "lap_number",
  "meeting_key",
  "pit_duration",
  "session_key",
  "stop_duration",
] as const satisfies readonly (keyof OpenF1PitStopRequest)[];

const RACE_CONTROL_QUERY_FIELDS = [
  "category",
  "date",
  "driver_number",
  "flag",
  "lap_number",
  "meeting_key",
  "message",
  "qualifying_phase",
  "scope",
  "sector",
  "session_key",
] as const satisfies readonly (keyof OpenF1RaceControlMessageRequest)[];

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

const STARTING_GRID_QUERY_FIELDS = [
  "driver_number",
  "lap_duration",
  "meeting_key",
  "position",
  "session_key",
] as const satisfies readonly (keyof OpenF1StartingGridEntryRequest)[];

const TEAM_RADIO_QUERY_FIELDS = [
  "date",
  "driver_number",
  "meeting_key",
  "recording_url",
  "session_key",
] as const satisfies readonly (keyof OpenF1TeamRadioRequest)[];

const WEATHER_QUERY_FIELDS = [
  "air_temperature",
  "date",
  "humidity",
  "meeting_key",
  "pressure",
  "rainfall",
  "session_key",
  "track_temperature",
  "wind_direction",
  "wind_speed",
] as const satisfies readonly (keyof OpenF1WeatherRequest)[];

const STINTS_QUERY_FIELDS = [
  "compound",
  "driver_number",
  "lap_end",
  "lap_start",
  "meeting_key",
  "session_key",
  "stint_number",
  "tyre_age_at_start",
] as const satisfies readonly (keyof OpenF1StintRequest)[];

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

  async function resolveAccessToken(): Promise<string | undefined> {
    if (opts?.tokenProvider) {
      return opts.tokenProvider();
    }
    return opts?.accessToken;
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
      const headers: Record<string, string> = {};
      const accessToken = await resolveAccessToken();
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const res = await doFetch(`${baseURL}${path}`, {
        method: "GET",
        headers,
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

  async function makeTokenRequest(
    req: OpenF1TokenRequest,
    signal?: AbortSignal
  ): Promise<OpenF1TokenResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      attachAbortHandler(signal, controller);
    }

    const form = new URLSearchParams();
    form.set("username", req.username);
    form.set("password", req.password);

    try {
      const res = await doFetch(`${baseURL}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
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

      const body = await parseBody(res);
      return body as OpenF1TokenResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof OpenF1Error) throw error;
      throw new OpenF1Error(`OpenF1 request failed: ${error}`, 500);
    }
  }

  // POST https://api.openf1.org/token
  // Docs: https://openf1.org/auth.html
  const token = Object.assign(
    async (
      req: OpenF1TokenRequest,
      signal?: AbortSignal
    ): Promise<OpenF1TokenResponse> => makeTokenRequest(req, signal),
    { schema: OpenF1TokenRequestSchema }
  ) as OpenF1TokenMethod;

  // GET https://api.openf1.org/v1/car_data{query}
  // Docs: https://openf1.org/docs/#car-data
  const carData = Object.assign(
    async (
      req: OpenF1CarDataRequest = {},
      signal?: AbortSignal
    ): Promise<OpenF1CarDataResponse | string> => {
      const query = buildQuery(req, CAR_DATA_QUERY_FIELDS);
      if (req.csv === true) {
        return makeGetRequest<string>(`/v1/car_data${query}`, signal, "text");
      }
      return makeGetRequest<OpenF1CarDataResponse>(
        `/v1/car_data${query}`,
        signal
      );
    },
    { schema: OpenF1CarDataRequestSchema }
  ) as OpenF1CarDataMethod;

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

  // GET https://api.openf1.org/v1/championship_teams{query}
  // Docs: https://openf1.org/docs/#teams-championship-beta
  const championshipTeams = Object.assign(
    async (
      req: OpenF1ChampionshipTeamRequest = {},
      signal?: AbortSignal
    ): Promise<OpenF1ChampionshipTeamResponse | string> => {
      const query = buildQuery(req, CHAMPIONSHIP_TEAM_QUERY_FIELDS);
      if (req.csv === true) {
        return makeGetRequest<string>(
          `/v1/championship_teams${query}`,
          signal,
          "text"
        );
      }
      return makeGetRequest<OpenF1ChampionshipTeamResponse>(
        `/v1/championship_teams${query}`,
        signal
      );
    },
    { schema: OpenF1ChampionshipTeamRequestSchema }
  ) as OpenF1ChampionshipTeamsMethod;

  // GET https://api.openf1.org/v1/intervals{query}
  // Docs: https://openf1.org/docs/#intervals
  const intervals = Object.assign(
    async (
      req: OpenF1IntervalsRequest = {},
      signal?: AbortSignal
    ): Promise<OpenF1IntervalsResponse | string> => {
      const query = buildQuery(req, INTERVALS_QUERY_FIELDS);
      if (req.csv === true) {
        return makeGetRequest<string>(`/v1/intervals${query}`, signal, "text");
      }
      return makeGetRequest<OpenF1IntervalsResponse>(
        `/v1/intervals${query}`,
        signal
      );
    },
    { schema: OpenF1IntervalsRequestSchema }
  ) as OpenF1IntervalsMethod;

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

  // GET https://api.openf1.org/v1/overtakes{query}
  // Docs: https://openf1.org/docs/#overtakes
  const overtakes = Object.assign(
    async (
      req: OpenF1OvertakeRequest = {},
      signal?: AbortSignal
    ): Promise<OpenF1OvertakeResponse | string> => {
      const query = buildQuery(req, OVERTAKES_QUERY_FIELDS);
      if (req.csv === true) {
        return makeGetRequest<string>(`/v1/overtakes${query}`, signal, "text");
      }
      return makeGetRequest<OpenF1OvertakeResponse>(
        `/v1/overtakes${query}`,
        signal
      );
    },
    { schema: OpenF1OvertakeRequestSchema }
  ) as OpenF1OvertakesMethod;

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

  // GET https://api.openf1.org/v1/pit{query}
  // Docs: https://openf1.org/docs/#pit
  const pit = Object.assign(
    async (
      req: OpenF1PitStopRequest = {},
      signal?: AbortSignal
    ): Promise<OpenF1PitStopResponse | string> => {
      const query = buildQuery(req, PIT_STOP_QUERY_FIELDS);
      if (req.csv === true) {
        return makeGetRequest<string>(`/v1/pit${query}`, signal, "text");
      }
      return makeGetRequest<OpenF1PitStopResponse>(`/v1/pit${query}`, signal);
    },
    { schema: OpenF1PitStopRequestSchema }
  ) as OpenF1PitStopsMethod;

  // GET https://api.openf1.org/v1/race_control{query}
  // Docs: https://openf1.org/docs/#race-control
  const raceControl = Object.assign(
    async (
      req: OpenF1RaceControlMessageRequest = {},
      signal?: AbortSignal
    ): Promise<OpenF1RaceControlMessageResponse | string> => {
      const query = buildQuery(req, RACE_CONTROL_QUERY_FIELDS);
      if (req.csv === true) {
        return makeGetRequest<string>(
          `/v1/race_control${query}`,
          signal,
          "text"
        );
      }
      return makeGetRequest<OpenF1RaceControlMessageResponse>(
        `/v1/race_control${query}`,
        signal
      );
    },
    { schema: OpenF1RaceControlMessageRequestSchema }
  ) as OpenF1RaceControlMethod;

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

  // GET https://api.openf1.org/v1/starting_grid{query}
  // Docs: https://openf1.org/docs/#starting-grid
  const startingGrid = Object.assign(
    async (
      req: OpenF1StartingGridEntryRequest = {},
      signal?: AbortSignal
    ): Promise<OpenF1StartingGridEntryResponse | string> => {
      const query = buildQuery(req, STARTING_GRID_QUERY_FIELDS);
      if (req.csv === true) {
        return makeGetRequest<string>(
          `/v1/starting_grid${query}`,
          signal,
          "text"
        );
      }
      return makeGetRequest<OpenF1StartingGridEntryResponse>(
        `/v1/starting_grid${query}`,
        signal
      );
    },
    { schema: OpenF1StartingGridEntryRequestSchema }
  ) as OpenF1StartingGridMethod;

  // GET https://api.openf1.org/v1/team_radio{query}
  // Docs: https://openf1.org/docs/#team-radio
  const teamRadio = Object.assign(
    async (
      req: OpenF1TeamRadioRequest = {},
      signal?: AbortSignal
    ): Promise<OpenF1TeamRadioResponse | string> => {
      const query = buildQuery(req, TEAM_RADIO_QUERY_FIELDS);
      if (req.csv === true) {
        return makeGetRequest<string>(`/v1/team_radio${query}`, signal, "text");
      }
      return makeGetRequest<OpenF1TeamRadioResponse>(
        `/v1/team_radio${query}`,
        signal
      );
    },
    { schema: OpenF1TeamRadioRequestSchema }
  ) as OpenF1TeamRadioMethod;

  // GET https://api.openf1.org/v1/weather{query}
  // Docs: https://openf1.org/docs/#weather
  const weather = Object.assign(
    async (
      req: OpenF1WeatherRequest = {},
      signal?: AbortSignal
    ): Promise<OpenF1WeatherResponse | string> => {
      const query = buildQuery(req, WEATHER_QUERY_FIELDS);
      if (req.csv === true) {
        return makeGetRequest<string>(`/v1/weather${query}`, signal, "text");
      }
      return makeGetRequest<OpenF1WeatherResponse>(
        `/v1/weather${query}`,
        signal
      );
    },
    { schema: OpenF1WeatherRequestSchema }
  ) as OpenF1WeatherMethod;

  // GET https://api.openf1.org/v1/stints{query}
  // Docs: https://openf1.org/docs/#stints
  const stints = Object.assign(
    async (
      req: OpenF1StintRequest = {},
      signal?: AbortSignal
    ): Promise<OpenF1StintResponse | string> => {
      const query = buildQuery(req, STINTS_QUERY_FIELDS);
      if (req.csv === true) {
        return makeGetRequest<string>(`/v1/stints${query}`, signal, "text");
      }
      return makeGetRequest<OpenF1StintResponse>(`/v1/stints${query}`, signal);
    },
    { schema: OpenF1StintRequestSchema }
  ) as OpenF1StintsMethod;

  return attachExamples({
    token,
    v1: {
      carData,
      championshipDrivers,
      championshipTeams,
      intervals,
      laps,
      meetings,
      overtakes,
      position,
      pit,
      raceControl,
      sessionResult,
      sessions,
      startingGrid,
      stints,
      teamRadio,
      weather,
    },
  });
}
