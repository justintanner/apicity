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
  timeout?: number;
  fetch?: typeof fetch;
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

export interface OpenF1V1Namespace {
  championshipDrivers: OpenF1ChampionshipDriversMethod;
  laps: OpenF1LapsMethod;
  meetings: OpenF1MeetingsMethod;
}

export interface OpenF1Provider {
  v1: OpenF1V1Namespace;
}
