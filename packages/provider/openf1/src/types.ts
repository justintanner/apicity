import type { z } from "zod";

export class OpenF1Error extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "OpenF1Error";
    this.status = status;
    this.body = body ?? null;
  }
}

export interface OpenF1Options {
  baseURL?: string;
  accessToken?: string;
  tokenProvider?: OpenF1TokenProvider;
  timeout?: number;
  fetch?: typeof fetch;
}

export type OpenF1TokenProvider = () => string | Promise<string>;

export interface OpenF1TokenRequest {
  username: string;
  password: string;
}

export interface OpenF1TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  [key: string]: unknown;
}

export interface OpenF1TokenMethod {
  (req: OpenF1TokenRequest, signal?: AbortSignal): Promise<OpenF1TokenResponse>;
  schema: z.ZodType<OpenF1TokenRequest>;
}

export type OpenF1FilterScalar = string | number | boolean;
export type OpenF1FilterValue<T extends OpenF1FilterScalar> = T | readonly T[];
export type OpenF1ComparisonOperator = "=" | "<" | "<=" | ">" | ">=";
export type OpenF1LatestKey = number | "latest";

export interface OpenF1ComparisonFilter<Field extends string = string> {
  field: Field;
  op: OpenF1ComparisonOperator;
  value: OpenF1FilterScalar;
}

export interface OpenF1Meeting {
  circuit_key: number;
  circuit_image: string | null;
  circuit_info_url: string | null;
  circuit_short_name: string;
  circuit_type: string | null;
  country_code: string;
  country_flag: string | null;
  country_key: number;
  country_name: string;
  date_end: string;
  date_start: string;
  gmt_offset: string;
  is_cancelled: boolean;
  location: string;
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  year: number;
  [key: string]: unknown;
}

export type OpenF1MeetingsResponse = OpenF1Meeting[];

export type OpenF1MeetingsFilterField =
  | "circuit_key"
  | "circuit_image"
  | "circuit_info_url"
  | "circuit_short_name"
  | "circuit_type"
  | "country_code"
  | "country_flag"
  | "country_key"
  | "country_name"
  | "date_end"
  | "date_start"
  | "gmt_offset"
  | "is_cancelled"
  | "location"
  | "meeting_key"
  | "meeting_name"
  | "meeting_official_name"
  | "year";

export type OpenF1MeetingsFilter =
  OpenF1ComparisonFilter<OpenF1MeetingsFilterField>;

export interface OpenF1MeetingsRequest {
  circuit_key?: OpenF1FilterValue<number>;
  circuit_image?: OpenF1FilterValue<string>;
  circuit_info_url?: OpenF1FilterValue<string>;
  circuit_short_name?: OpenF1FilterValue<string>;
  circuit_type?: OpenF1FilterValue<string>;
  country_code?: OpenF1FilterValue<string>;
  country_flag?: OpenF1FilterValue<string>;
  country_key?: OpenF1FilterValue<number>;
  country_name?: OpenF1FilterValue<string>;
  date_end?: OpenF1FilterValue<string>;
  date_start?: OpenF1FilterValue<string>;
  gmt_offset?: OpenF1FilterValue<string>;
  is_cancelled?: OpenF1FilterValue<boolean>;
  location?: OpenF1FilterValue<string>;
  meeting_key?: OpenF1FilterValue<OpenF1LatestKey>;
  meeting_name?: OpenF1FilterValue<string>;
  meeting_official_name?: OpenF1FilterValue<string>;
  year?: OpenF1FilterValue<number>;
  filters?: readonly OpenF1MeetingsFilter[];
  csv?: boolean;
}

export interface OpenF1ChampionshipDriver {
  driver_number: number;
  meeting_key: number;
  points_current: number;
  points_start: number;
  position_current: number;
  position_start: number;
  session_key: number;
  [key: string]: unknown;
}

export type OpenF1ChampionshipDriverResponse = OpenF1ChampionshipDriver[];

export type OpenF1ChampionshipDriverFilterField =
  | "driver_number"
  | "meeting_key"
  | "points_current"
  | "points_start"
  | "position_current"
  | "position_start"
  | "session_key";

export type OpenF1ChampionshipDriverFilter =
  OpenF1ComparisonFilter<OpenF1ChampionshipDriverFilterField>;

export interface OpenF1ChampionshipDriverRequest {
  driver_number?: OpenF1FilterValue<number>;
  meeting_key?: OpenF1FilterValue<OpenF1LatestKey>;
  points_current?: OpenF1FilterValue<number>;
  points_start?: OpenF1FilterValue<number>;
  position_current?: OpenF1FilterValue<number>;
  position_start?: OpenF1FilterValue<number>;
  session_key?: OpenF1FilterValue<OpenF1LatestKey>;
  filters?: readonly OpenF1ChampionshipDriverFilter[];
  csv?: boolean;
}

export interface OpenF1Position {
  date: string;
  driver_number: number;
  meeting_key: number;
  position: number;
  session_key: number;
  [key: string]: unknown;
}

export type OpenF1PositionResponse = OpenF1Position[];

export type OpenF1PositionFilterField =
  | "date"
  | "driver_number"
  | "meeting_key"
  | "position"
  | "session_key";

export type OpenF1PositionFilter =
  OpenF1ComparisonFilter<OpenF1PositionFilterField>;

export interface OpenF1PositionRequest {
  date?: OpenF1FilterValue<string>;
  driver_number?: OpenF1FilterValue<number>;
  meeting_key?: OpenF1FilterValue<OpenF1LatestKey>;
  position?: OpenF1FilterValue<number>;
  session_key?: OpenF1FilterValue<OpenF1LatestKey>;
  filters?: readonly OpenF1PositionFilter[];
  csv?: boolean;
}

export interface OpenF1Method<Request extends { csv?: boolean }, Response> {
  (req: Request & { csv: true }, signal?: AbortSignal): Promise<string>;
  (
    req?: Omit<Request, "csv"> & { csv?: false | undefined },
    signal?: AbortSignal
  ): Promise<Response>;
  schema: z.ZodType<Request>;
}

export type OpenF1MeetingsMethod = OpenF1Method<
  OpenF1MeetingsRequest,
  OpenF1MeetingsResponse
>;

export interface OpenF1Session {
  circuit_key: number;
  circuit_short_name: string;
  country_code: string;
  country_key: number;
  country_name: string;
  date_end: string;
  date_start: string;
  gmt_offset: string;
  is_cancelled: boolean;
  location: string;
  meeting_key: number;
  session_key: number;
  session_name: string;
  session_type: string;
  year: number;
  [key: string]: unknown;
}

export type OpenF1SessionResponse = OpenF1Session[];

export type OpenF1SessionFilterField =
  | "circuit_key"
  | "circuit_short_name"
  | "country_code"
  | "country_key"
  | "country_name"
  | "date_end"
  | "date_start"
  | "gmt_offset"
  | "is_cancelled"
  | "location"
  | "meeting_key"
  | "session_key"
  | "session_name"
  | "session_type"
  | "year";

export type OpenF1SessionFilter =
  OpenF1ComparisonFilter<OpenF1SessionFilterField>;

export interface OpenF1SessionRequest {
  circuit_key?: OpenF1FilterValue<number>;
  circuit_short_name?: OpenF1FilterValue<string>;
  country_code?: OpenF1FilterValue<string>;
  country_key?: OpenF1FilterValue<number>;
  country_name?: OpenF1FilterValue<string>;
  date_end?: OpenF1FilterValue<string>;
  date_start?: OpenF1FilterValue<string>;
  gmt_offset?: OpenF1FilterValue<string>;
  is_cancelled?: OpenF1FilterValue<boolean>;
  location?: OpenF1FilterValue<string>;
  meeting_key?: OpenF1FilterValue<OpenF1LatestKey>;
  session_key?: OpenF1FilterValue<OpenF1LatestKey>;
  session_name?: OpenF1FilterValue<string>;
  session_type?: OpenF1FilterValue<string>;
  year?: OpenF1FilterValue<number>;
  filters?: readonly OpenF1SessionFilter[];
  csv?: boolean;
}

export type OpenF1SessionsMethod = OpenF1Method<
  OpenF1SessionRequest,
  OpenF1SessionResponse
>;

export interface OpenF1Weather {
  air_temperature: number;
  date: string;
  humidity: number;
  meeting_key: number;
  pressure: number;
  rainfall: number;
  session_key: number;
  track_temperature: number;
  wind_direction: number;
  wind_speed: number;
  [key: string]: unknown;
}

export type OpenF1WeatherResponse = OpenF1Weather[];

export type OpenF1WeatherFilterField =
  | "air_temperature"
  | "date"
  | "humidity"
  | "meeting_key"
  | "pressure"
  | "rainfall"
  | "session_key"
  | "track_temperature"
  | "wind_direction"
  | "wind_speed";

export type OpenF1WeatherFilter =
  OpenF1ComparisonFilter<OpenF1WeatherFilterField>;

export interface OpenF1WeatherRequest {
  air_temperature?: OpenF1FilterValue<number>;
  date?: OpenF1FilterValue<string>;
  humidity?: OpenF1FilterValue<number>;
  meeting_key?: OpenF1FilterValue<OpenF1LatestKey>;
  pressure?: OpenF1FilterValue<number>;
  rainfall?: OpenF1FilterValue<number>;
  session_key?: OpenF1FilterValue<OpenF1LatestKey>;
  track_temperature?: OpenF1FilterValue<number>;
  wind_direction?: OpenF1FilterValue<number>;
  wind_speed?: OpenF1FilterValue<number>;
  filters?: readonly OpenF1WeatherFilter[];
  csv?: boolean;
}

export type OpenF1WeatherMethod = OpenF1Method<
  OpenF1WeatherRequest,
  OpenF1WeatherResponse
>;

export type OpenF1ChampionshipDriversMethod = OpenF1Method<
  OpenF1ChampionshipDriverRequest,
  OpenF1ChampionshipDriverResponse
>;

export interface OpenF1Lap {
  date_start: string;
  driver_number: number;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  is_pit_out_lap: boolean;
  lap_duration: number | null;
  lap_number: number;
  meeting_key: number;
  segments_sector_1: number[] | null;
  segments_sector_2: number[] | null;
  segments_sector_3: number[] | null;
  session_key: number;
  st_speed: number | null;
  [key: string]: unknown;
}

export type OpenF1LapResponse = OpenF1Lap[];

export type OpenF1LapFilterField =
  | "date_start"
  | "driver_number"
  | "duration_sector_1"
  | "duration_sector_2"
  | "duration_sector_3"
  | "i1_speed"
  | "i2_speed"
  | "is_pit_out_lap"
  | "lap_duration"
  | "lap_number"
  | "meeting_key"
  | "segments_sector_1"
  | "segments_sector_2"
  | "segments_sector_3"
  | "session_key"
  | "st_speed";

export type OpenF1LapFilter = OpenF1ComparisonFilter<OpenF1LapFilterField>;

export interface OpenF1LapRequest {
  date_start?: OpenF1FilterValue<string>;
  driver_number?: OpenF1FilterValue<number>;
  duration_sector_1?: OpenF1FilterValue<number>;
  duration_sector_2?: OpenF1FilterValue<number>;
  duration_sector_3?: OpenF1FilterValue<number>;
  i1_speed?: OpenF1FilterValue<number>;
  i2_speed?: OpenF1FilterValue<number>;
  is_pit_out_lap?: OpenF1FilterValue<boolean>;
  lap_duration?: OpenF1FilterValue<number>;
  lap_number?: OpenF1FilterValue<number>;
  meeting_key?: OpenF1FilterValue<OpenF1LatestKey>;
  segments_sector_1?: OpenF1FilterValue<number>;
  segments_sector_2?: OpenF1FilterValue<number>;
  segments_sector_3?: OpenF1FilterValue<number>;
  session_key?: OpenF1FilterValue<OpenF1LatestKey>;
  st_speed?: OpenF1FilterValue<number>;
  filters?: readonly OpenF1LapFilter[];
  csv?: boolean;
}

export type OpenF1LapsMethod = OpenF1Method<
  OpenF1LapRequest,
  OpenF1LapResponse
>;

export type OpenF1PositionMethod = OpenF1Method<
  OpenF1PositionRequest,
  OpenF1PositionResponse
>;

export type OpenF1SessionResultDuration = number | null | Array<number | null>;

export type OpenF1SessionResultGapToLeader =
  | number
  | string
  | null
  | Array<number | string | null>;

export interface OpenF1SessionResult {
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
  driver_number: number;
  duration: OpenF1SessionResultDuration;
  gap_to_leader: OpenF1SessionResultGapToLeader;
  number_of_laps: number;
  meeting_key: number;
  position: number;
  session_key: number;
  [key: string]: unknown;
}

export type OpenF1SessionResultResponse = OpenF1SessionResult[];

export type OpenF1SessionResultFilterField =
  | "dnf"
  | "dns"
  | "dsq"
  | "driver_number"
  | "duration"
  | "gap_to_leader"
  | "number_of_laps"
  | "meeting_key"
  | "position"
  | "session_key";

export type OpenF1SessionResultFilter =
  OpenF1ComparisonFilter<OpenF1SessionResultFilterField>;

export interface OpenF1SessionResultRequest {
  dnf?: OpenF1FilterValue<boolean>;
  dns?: OpenF1FilterValue<boolean>;
  dsq?: OpenF1FilterValue<boolean>;
  driver_number?: OpenF1FilterValue<number>;
  duration?: OpenF1FilterValue<number | string>;
  gap_to_leader?: OpenF1FilterValue<number | string>;
  number_of_laps?: OpenF1FilterValue<number>;
  meeting_key?: OpenF1FilterValue<OpenF1LatestKey>;
  position?: OpenF1FilterValue<number>;
  session_key?: OpenF1FilterValue<OpenF1LatestKey>;
  filters?: readonly OpenF1SessionResultFilter[];
  csv?: boolean;
}

export type OpenF1SessionResultMethod = OpenF1Method<
  OpenF1SessionResultRequest,
  OpenF1SessionResultResponse
>;

export interface OpenF1TeamRadio {
  date: string;
  driver_number: number;
  meeting_key: number;
  recording_url: string;
  session_key: number;
  [key: string]: unknown;
}

export type OpenF1TeamRadioResponse = OpenF1TeamRadio[];

export type OpenF1TeamRadioFilterField =
  | "date"
  | "driver_number"
  | "meeting_key"
  | "recording_url"
  | "session_key";

export type OpenF1TeamRadioFilter =
  OpenF1ComparisonFilter<OpenF1TeamRadioFilterField>;

export interface OpenF1TeamRadioRequest {
  date?: OpenF1FilterValue<string>;
  driver_number?: OpenF1FilterValue<number>;
  meeting_key?: OpenF1FilterValue<OpenF1LatestKey>;
  recording_url?: OpenF1FilterValue<string>;
  session_key?: OpenF1FilterValue<OpenF1LatestKey>;
  filters?: readonly OpenF1TeamRadioFilter[];
  csv?: boolean;
}

export type OpenF1TeamRadioMethod = OpenF1Method<
  OpenF1TeamRadioRequest,
  OpenF1TeamRadioResponse
>;

export interface OpenF1V1Namespace {
  championshipDrivers: OpenF1ChampionshipDriversMethod;
  laps: OpenF1LapsMethod;
  meetings: OpenF1MeetingsMethod;
  position: OpenF1PositionMethod;
  sessionResult: OpenF1SessionResultMethod;
  sessions: OpenF1SessionsMethod;
  teamRadio: OpenF1TeamRadioMethod;
  weather: OpenF1WeatherMethod;
}

export interface OpenF1Provider {
  token: OpenF1TokenMethod;
  v1: OpenF1V1Namespace;
}
