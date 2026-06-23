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

export interface OpenF1CarData {
  brake: number;
  date: string;
  driver_number: number;
  drs: number;
  meeting_key: number;
  n_gear: number;
  rpm: number;
  session_key: number;
  speed: number;
  throttle: number;
  [key: string]: unknown;
}

export type OpenF1CarDataResponse = OpenF1CarData[];

export type OpenF1CarDataFilterField =
  | "brake"
  | "date"
  | "driver_number"
  | "drs"
  | "meeting_key"
  | "n_gear"
  | "rpm"
  | "session_key"
  | "speed"
  | "throttle";

export type OpenF1CarDataFilter =
  OpenF1ComparisonFilter<OpenF1CarDataFilterField>;

export interface OpenF1CarDataRequest {
  brake?: OpenF1FilterValue<number>;
  date?: OpenF1FilterValue<string>;
  driver_number?: OpenF1FilterValue<number>;
  drs?: OpenF1FilterValue<number>;
  meeting_key?: OpenF1FilterValue<OpenF1LatestKey>;
  n_gear?: OpenF1FilterValue<number>;
  rpm?: OpenF1FilterValue<number>;
  session_key?: OpenF1FilterValue<OpenF1LatestKey>;
  speed?: OpenF1FilterValue<number>;
  throttle?: OpenF1FilterValue<number>;
  filters?: readonly OpenF1CarDataFilter[];
  csv?: boolean;
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

export type OpenF1IntervalGap = number | string | null;

export interface OpenF1Interval {
  date: string;
  driver_number: number;
  gap_to_leader: OpenF1IntervalGap;
  interval: OpenF1IntervalGap;
  meeting_key: number;
  session_key: number;
  [key: string]: unknown;
}

export type OpenF1IntervalsResponse = OpenF1Interval[];

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

export type OpenF1IntervalsFilterField =
  | "date"
  | "driver_number"
  | "gap_to_leader"
  | "interval"
  | "meeting_key"
  | "session_key";

export type OpenF1IntervalsFilter =
  OpenF1ComparisonFilter<OpenF1IntervalsFilterField>;

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

export interface OpenF1ChampionshipTeam {
  meeting_key: number;
  points_current: number;
  points_start: number;
  position_current: number;
  position_start: number;
  session_key: number;
  team_name: string;
  [key: string]: unknown;
}

export type OpenF1ChampionshipTeamResponse = OpenF1ChampionshipTeam[];

export type OpenF1ChampionshipTeamFilterField =
  | "meeting_key"
  | "points_current"
  | "points_start"
  | "position_current"
  | "position_start"
  | "session_key"
  | "team_name";

export type OpenF1ChampionshipTeamFilter =
  OpenF1ComparisonFilter<OpenF1ChampionshipTeamFilterField>;

export interface OpenF1ChampionshipTeamRequest {
  meeting_key?: OpenF1FilterValue<OpenF1LatestKey>;
  points_current?: OpenF1FilterValue<number>;
  points_start?: OpenF1FilterValue<number>;
  position_current?: OpenF1FilterValue<number>;
  position_start?: OpenF1FilterValue<number>;
  session_key?: OpenF1FilterValue<OpenF1LatestKey>;
  team_name?: OpenF1FilterValue<string>;
  filters?: readonly OpenF1ChampionshipTeamFilter[];
  csv?: boolean;
}

export interface OpenF1Overtake {
  date: string;
  meeting_key: number;
  overtaken_driver_number: number;
  overtaking_driver_number: number;
  position: number;
  session_key: number;
  [key: string]: unknown;
}

export type OpenF1OvertakeResponse = OpenF1Overtake[];

export type OpenF1OvertakeFilterField =
  | "date"
  | "meeting_key"
  | "overtaken_driver_number"
  | "overtaking_driver_number"
  | "position"
  | "session_key";

export type OpenF1OvertakeFilter =
  OpenF1ComparisonFilter<OpenF1OvertakeFilterField>;

export interface OpenF1OvertakeRequest {
  date?: OpenF1FilterValue<string>;
  meeting_key?: OpenF1FilterValue<OpenF1LatestKey>;
  overtaken_driver_number?: OpenF1FilterValue<number>;
  overtaking_driver_number?: OpenF1FilterValue<number>;
  position?: OpenF1FilterValue<number>;
  session_key?: OpenF1FilterValue<OpenF1LatestKey>;
  filters?: readonly OpenF1OvertakeFilter[];
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

export interface OpenF1IntervalsRequest {
  date?: OpenF1FilterValue<string>;
  driver_number?: OpenF1FilterValue<number>;
  gap_to_leader?: OpenF1FilterValue<number | string>;
  interval?: OpenF1FilterValue<number | string>;
  meeting_key?: OpenF1FilterValue<OpenF1LatestKey>;
  session_key?: OpenF1FilterValue<OpenF1LatestKey>;
  filters?: readonly OpenF1IntervalsFilter[];
  csv?: boolean;
}

export interface OpenF1PitStop {
  date: string;
  driver_number: number;
  lane_duration: number;
  lap_number: number;
  meeting_key: number;
  pit_duration: number;
  session_key: number;
  stop_duration: number | null;
  [key: string]: unknown;
}

export type OpenF1PitStopResponse = OpenF1PitStop[];

export type OpenF1PitStopFilterField =
  | "date"
  | "driver_number"
  | "lane_duration"
  | "lap_number"
  | "meeting_key"
  | "pit_duration"
  | "session_key"
  | "stop_duration";

export type OpenF1PitStopFilter =
  OpenF1ComparisonFilter<OpenF1PitStopFilterField>;

export interface OpenF1PitStopRequest {
  date?: OpenF1FilterValue<string>;
  driver_number?: OpenF1FilterValue<number>;
  lane_duration?: OpenF1FilterValue<number>;
  lap_number?: OpenF1FilterValue<number>;
  meeting_key?: OpenF1FilterValue<OpenF1LatestKey>;
  pit_duration?: OpenF1FilterValue<number>;
  session_key?: OpenF1FilterValue<OpenF1LatestKey>;
  stop_duration?: OpenF1FilterValue<number>;
  filters?: readonly OpenF1PitStopFilter[];
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

export interface OpenF1Stint {
  compound: string;
  driver_number: number;
  lap_end: number;
  lap_start: number;
  meeting_key: number;
  session_key: number;
  stint_number: number;
  tyre_age_at_start: number;
  [key: string]: unknown;
}

export type OpenF1StintResponse = OpenF1Stint[];

export type OpenF1StintFilterField =
  | "compound"
  | "driver_number"
  | "lap_end"
  | "lap_start"
  | "meeting_key"
  | "session_key"
  | "stint_number"
  | "tyre_age_at_start";

export type OpenF1StintFilter = OpenF1ComparisonFilter<OpenF1StintFilterField>;

export interface OpenF1StintRequest {
  compound?: OpenF1FilterValue<string>;
  driver_number?: OpenF1FilterValue<number>;
  lap_end?: OpenF1FilterValue<number>;
  lap_start?: OpenF1FilterValue<number>;
  meeting_key?: OpenF1FilterValue<OpenF1LatestKey>;
  session_key?: OpenF1FilterValue<OpenF1LatestKey>;
  stint_number?: OpenF1FilterValue<number>;
  tyre_age_at_start?: OpenF1FilterValue<number>;
  filters?: readonly OpenF1StintFilter[];
  csv?: boolean;
}

export type OpenF1StintsMethod = OpenF1Method<
  OpenF1StintRequest,
  OpenF1StintResponse
>;

export type OpenF1CarDataMethod = OpenF1Method<
  OpenF1CarDataRequest,
  OpenF1CarDataResponse
>;

export type OpenF1ChampionshipDriversMethod = OpenF1Method<
  OpenF1ChampionshipDriverRequest,
  OpenF1ChampionshipDriverResponse
>;

export type OpenF1ChampionshipTeamsMethod = OpenF1Method<
  OpenF1ChampionshipTeamRequest,
  OpenF1ChampionshipTeamResponse
>;

export type OpenF1IntervalsMethod = OpenF1Method<
  OpenF1IntervalsRequest,
  OpenF1IntervalsResponse
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

export type OpenF1OvertakesMethod = OpenF1Method<
  OpenF1OvertakeRequest,
  OpenF1OvertakeResponse
>;

export type OpenF1PositionMethod = OpenF1Method<
  OpenF1PositionRequest,
  OpenF1PositionResponse
>;

export type OpenF1PitStopsMethod = OpenF1Method<
  OpenF1PitStopRequest,
  OpenF1PitStopResponse
>;

export interface OpenF1RaceControlMessage {
  category: string;
  date: string;
  driver_number: number | null;
  flag: string | null;
  lap_number: number | null;
  meeting_key: number;
  message: string;
  qualifying_phase: number | null;
  scope: string | null;
  sector: number | null;
  session_key: number;
  [key: string]: unknown;
}

export type OpenF1RaceControlMessageResponse = OpenF1RaceControlMessage[];

export type OpenF1RaceControlMessageFilterField =
  | "category"
  | "date"
  | "driver_number"
  | "flag"
  | "lap_number"
  | "meeting_key"
  | "message"
  | "qualifying_phase"
  | "scope"
  | "sector"
  | "session_key";

export type OpenF1RaceControlMessageFilter =
  OpenF1ComparisonFilter<OpenF1RaceControlMessageFilterField>;

export interface OpenF1RaceControlMessageRequest {
  category?: OpenF1FilterValue<string>;
  date?: OpenF1FilterValue<string>;
  driver_number?: OpenF1FilterValue<number>;
  flag?: OpenF1FilterValue<string>;
  lap_number?: OpenF1FilterValue<number>;
  meeting_key?: OpenF1FilterValue<OpenF1LatestKey>;
  message?: OpenF1FilterValue<string>;
  qualifying_phase?: OpenF1FilterValue<number>;
  scope?: OpenF1FilterValue<string>;
  sector?: OpenF1FilterValue<number>;
  session_key?: OpenF1FilterValue<OpenF1LatestKey>;
  filters?: readonly OpenF1RaceControlMessageFilter[];
  csv?: boolean;
}

export type OpenF1RaceControlMethod = OpenF1Method<
  OpenF1RaceControlMessageRequest,
  OpenF1RaceControlMessageResponse
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

export interface OpenF1StartingGridEntry {
  driver_number: number;
  lap_duration: number;
  meeting_key: number;
  position: number;
  session_key: number;
  [key: string]: unknown;
}

export type OpenF1StartingGridEntryResponse = OpenF1StartingGridEntry[];

export type OpenF1StartingGridEntryFilterField =
  | "driver_number"
  | "lap_duration"
  | "meeting_key"
  | "position"
  | "session_key";

export type OpenF1StartingGridEntryFilter =
  OpenF1ComparisonFilter<OpenF1StartingGridEntryFilterField>;

export interface OpenF1StartingGridEntryRequest {
  driver_number?: OpenF1FilterValue<number>;
  lap_duration?: OpenF1FilterValue<number>;
  meeting_key?: OpenF1FilterValue<OpenF1LatestKey>;
  position?: OpenF1FilterValue<number>;
  session_key?: OpenF1FilterValue<OpenF1LatestKey>;
  filters?: readonly OpenF1StartingGridEntryFilter[];
  csv?: boolean;
}

export type OpenF1StartingGridMethod = OpenF1Method<
  OpenF1StartingGridEntryRequest,
  OpenF1StartingGridEntryResponse
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
  carData: OpenF1CarDataMethod;
  championshipDrivers: OpenF1ChampionshipDriversMethod;
  championshipTeams: OpenF1ChampionshipTeamsMethod;
  intervals: OpenF1IntervalsMethod;
  laps: OpenF1LapsMethod;
  meetings: OpenF1MeetingsMethod;
  overtakes: OpenF1OvertakesMethod;
  position: OpenF1PositionMethod;
  pit: OpenF1PitStopsMethod;
  raceControl: OpenF1RaceControlMethod;
  sessionResult: OpenF1SessionResultMethod;
  sessions: OpenF1SessionsMethod;
  startingGrid: OpenF1StartingGridMethod;
  stints: OpenF1StintsMethod;
  teamRadio: OpenF1TeamRadioMethod;
  weather: OpenF1WeatherMethod;
}

export interface OpenF1Provider {
  token: OpenF1TokenMethod;
  v1: OpenF1V1Namespace;
}
