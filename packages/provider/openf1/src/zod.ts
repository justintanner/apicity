import { z } from "zod";
import type {
  OpenF1ChampionshipDriver,
  OpenF1ChampionshipDriverFilter,
  OpenF1ChampionshipDriverFilterField,
  OpenF1ChampionshipDriverRequest,
  OpenF1ComparisonFilter,
  OpenF1ComparisonOperator,
  OpenF1FilterScalar,
  OpenF1Lap,
  OpenF1LapFilter,
  OpenF1LapFilterField,
  OpenF1LapRequest,
  OpenF1LatestKey,
  OpenF1Meeting,
  OpenF1MeetingsFilter,
  OpenF1MeetingsFilterField,
  OpenF1MeetingsRequest,
  OpenF1Options,
  OpenF1Position,
  OpenF1PositionFilter,
  OpenF1PositionFilterField,
  OpenF1PositionRequest,
  OpenF1Session,
  OpenF1SessionResult,
  OpenF1SessionResultDuration,
  OpenF1SessionResultFilter,
  OpenF1SessionResultFilterField,
  OpenF1SessionResultGapToLeader,
  OpenF1SessionResultRequest,
  OpenF1SessionFilter,
  OpenF1SessionFilterField,
  OpenF1SessionRequest,
  OpenF1TeamRadio,
  OpenF1TeamRadioFilter,
  OpenF1TeamRadioFilterField,
  OpenF1TeamRadioRequest,
  OpenF1TokenProvider,
  OpenF1TokenRequest,
  OpenF1TokenResponse,
  OpenF1Weather,
  OpenF1WeatherFilter,
  OpenF1WeatherFilterField,
  OpenF1WeatherRequest,
} from "./types";

const nullableString = z.string().nullable();
const filterScalar = z.union([z.string(), z.number(), z.boolean()]);
const stringFilterValue = z.union([z.string(), z.array(z.string())]);
const numberFilterValue = z.union([z.number(), z.array(z.number())]);
const numberOrStringFilterValue = z.union([
  z.string(),
  z.number(),
  z.array(z.union([z.string(), z.number()])),
]);
const booleanFilterValue = z.union([z.boolean(), z.array(z.boolean())]);
const latestKey = z.union([z.number(), z.literal("latest")]);
const latestKeyFilterValue = z.union([latestKey, z.array(latestKey)]);

export const OpenF1OptionsSchema: z.ZodType<OpenF1Options> = z.object({
  baseURL: z.string().optional(),
  accessToken: z.string().optional(),
  tokenProvider: z.custom<OpenF1TokenProvider>().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export const OpenF1TokenRequestSchema: z.ZodType<OpenF1TokenRequest> = z.object(
  {
    username: z.string().min(1),
    password: z.string().min(1),
  }
);

export const OpenF1TokenResponseSchema: z.ZodType<OpenF1TokenResponse> = z
  .object({
    access_token: z.string(),
    expires_in: z.number(),
    token_type: z.string(),
  })
  .catchall(z.unknown());

export const OpenF1FilterScalarSchema: z.ZodType<OpenF1FilterScalar> =
  filterScalar;

export const OpenF1ComparisonOperatorSchema: z.ZodType<OpenF1ComparisonOperator> =
  z.enum(["=", "<", "<=", ">", ">="]);

export const OpenF1MeetingsFilterFieldSchema: z.ZodType<OpenF1MeetingsFilterField> =
  z.enum([
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
  ]);

const openF1ComparisonFilterObject = z.object({
  field: z.string(),
  op: OpenF1ComparisonOperatorSchema,
  value: OpenF1FilterScalarSchema,
});

export const OpenF1ComparisonFilterSchema: z.ZodType<OpenF1ComparisonFilter> =
  openF1ComparisonFilterObject;

export const OpenF1MeetingsFilterSchema: z.ZodType<OpenF1MeetingsFilter> =
  openF1ComparisonFilterObject.extend({
    field: OpenF1MeetingsFilterFieldSchema,
  });

export const OpenF1MeetingSchema: z.ZodType<OpenF1Meeting> = z
  .object({
    circuit_key: z.number(),
    circuit_image: nullableString,
    circuit_info_url: nullableString,
    circuit_short_name: z.string(),
    circuit_type: nullableString,
    country_code: z.string(),
    country_flag: nullableString,
    country_key: z.number(),
    country_name: z.string(),
    date_end: z.string(),
    date_start: z.string(),
    gmt_offset: z.string(),
    is_cancelled: z.boolean(),
    location: z.string(),
    meeting_key: z.number(),
    meeting_name: z.string(),
    meeting_official_name: z.string(),
    year: z.number(),
  })
  .catchall(z.unknown());

export const OpenF1LatestKeySchema: z.ZodType<OpenF1LatestKey> = latestKey;

export const OpenF1MeetingsRequestSchema: z.ZodType<OpenF1MeetingsRequest> =
  z.object({
    circuit_key: numberFilterValue.optional(),
    circuit_image: stringFilterValue.optional(),
    circuit_info_url: stringFilterValue.optional(),
    circuit_short_name: stringFilterValue.optional(),
    circuit_type: stringFilterValue.optional(),
    country_code: stringFilterValue.optional(),
    country_flag: stringFilterValue.optional(),
    country_key: numberFilterValue.optional(),
    country_name: stringFilterValue.optional(),
    date_end: stringFilterValue.optional(),
    date_start: stringFilterValue.optional(),
    gmt_offset: stringFilterValue.optional(),
    is_cancelled: booleanFilterValue.optional(),
    location: stringFilterValue.optional(),
    meeting_key: latestKeyFilterValue.optional(),
    meeting_name: stringFilterValue.optional(),
    meeting_official_name: stringFilterValue.optional(),
    year: numberFilterValue.optional(),
    filters: z.array(OpenF1MeetingsFilterSchema).optional(),
    csv: z.boolean().optional(),
  });

export const OpenF1ChampionshipDriverFilterFieldSchema: z.ZodType<OpenF1ChampionshipDriverFilterField> =
  z.enum([
    "driver_number",
    "meeting_key",
    "points_current",
    "points_start",
    "position_current",
    "position_start",
    "session_key",
  ]);

export const OpenF1ChampionshipDriverFilterSchema: z.ZodType<OpenF1ChampionshipDriverFilter> =
  openF1ComparisonFilterObject.extend({
    field: OpenF1ChampionshipDriverFilterFieldSchema,
  });

export const OpenF1ChampionshipDriverSchema: z.ZodType<OpenF1ChampionshipDriver> =
  z
    .object({
      driver_number: z.number(),
      meeting_key: z.number(),
      points_current: z.number(),
      points_start: z.number(),
      position_current: z.number(),
      position_start: z.number(),
      session_key: z.number(),
    })
    .catchall(z.unknown());

export const OpenF1ChampionshipDriverRequestSchema: z.ZodType<OpenF1ChampionshipDriverRequest> =
  z.object({
    driver_number: numberFilterValue.optional(),
    meeting_key: latestKeyFilterValue.optional(),
    points_current: numberFilterValue.optional(),
    points_start: numberFilterValue.optional(),
    position_current: numberFilterValue.optional(),
    position_start: numberFilterValue.optional(),
    session_key: latestKeyFilterValue.optional(),
    filters: z.array(OpenF1ChampionshipDriverFilterSchema).optional(),
    csv: z.boolean().optional(),
  });

export const OpenF1ChampionshipDriverResponseSchema = z.array(
  OpenF1ChampionshipDriverSchema
);

export const OpenF1LapFilterFieldSchema: z.ZodType<OpenF1LapFilterField> =
  z.enum([
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
  ]);

export const OpenF1LapFilterSchema: z.ZodType<OpenF1LapFilter> =
  openF1ComparisonFilterObject.extend({
    field: OpenF1LapFilterFieldSchema,
  });

export const OpenF1LapSchema: z.ZodType<OpenF1Lap> = z
  .object({
    date_start: z.string(),
    driver_number: z.number(),
    duration_sector_1: z.number().nullable(),
    duration_sector_2: z.number().nullable(),
    duration_sector_3: z.number().nullable(),
    i1_speed: z.number().nullable(),
    i2_speed: z.number().nullable(),
    is_pit_out_lap: z.boolean(),
    lap_duration: z.number().nullable(),
    lap_number: z.number(),
    meeting_key: z.number(),
    segments_sector_1: z.array(z.number()).nullable(),
    segments_sector_2: z.array(z.number()).nullable(),
    segments_sector_3: z.array(z.number()).nullable(),
    session_key: z.number(),
    st_speed: z.number().nullable(),
  })
  .catchall(z.unknown());

export const OpenF1LapRequestSchema: z.ZodType<OpenF1LapRequest> = z.object({
  date_start: stringFilterValue.optional(),
  driver_number: numberFilterValue.optional(),
  duration_sector_1: numberFilterValue.optional(),
  duration_sector_2: numberFilterValue.optional(),
  duration_sector_3: numberFilterValue.optional(),
  i1_speed: numberFilterValue.optional(),
  i2_speed: numberFilterValue.optional(),
  is_pit_out_lap: booleanFilterValue.optional(),
  lap_duration: numberFilterValue.optional(),
  lap_number: numberFilterValue.optional(),
  meeting_key: latestKeyFilterValue.optional(),
  segments_sector_1: numberFilterValue.optional(),
  segments_sector_2: numberFilterValue.optional(),
  segments_sector_3: numberFilterValue.optional(),
  session_key: latestKeyFilterValue.optional(),
  st_speed: numberFilterValue.optional(),
  filters: z.array(OpenF1LapFilterSchema).optional(),
  csv: z.boolean().optional(),
});

export const OpenF1LapResponseSchema = z.array(OpenF1LapSchema);

export const OpenF1PositionFilterFieldSchema: z.ZodType<OpenF1PositionFilterField> =
  z.enum(["date", "driver_number", "meeting_key", "position", "session_key"]);

export const OpenF1PositionFilterSchema: z.ZodType<OpenF1PositionFilter> =
  openF1ComparisonFilterObject.extend({
    field: OpenF1PositionFilterFieldSchema,
  });

export const OpenF1PositionSchema: z.ZodType<OpenF1Position> = z
  .object({
    date: z.string(),
    driver_number: z.number(),
    meeting_key: z.number(),
    position: z.number(),
    session_key: z.number(),
  })
  .catchall(z.unknown());

export const OpenF1PositionRequestSchema: z.ZodType<OpenF1PositionRequest> =
  z.object({
    date: stringFilterValue.optional(),
    driver_number: numberFilterValue.optional(),
    meeting_key: latestKeyFilterValue.optional(),
    position: numberFilterValue.optional(),
    session_key: latestKeyFilterValue.optional(),
    filters: z.array(OpenF1PositionFilterSchema).optional(),
    csv: z.boolean().optional(),
  });

export const OpenF1PositionResponseSchema = z.array(OpenF1PositionSchema);

export const OpenF1SessionResultDurationSchema: z.ZodType<OpenF1SessionResultDuration> =
  z.union([z.number(), z.null(), z.array(z.union([z.number(), z.null()]))]);

export const OpenF1SessionResultGapToLeaderSchema: z.ZodType<OpenF1SessionResultGapToLeader> =
  z.union([
    z.string(),
    z.number(),
    z.null(),
    z.array(z.union([z.string(), z.number(), z.null()])),
  ]);

export const OpenF1SessionResultFilterFieldSchema: z.ZodType<OpenF1SessionResultFilterField> =
  z.enum([
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
  ]);

export const OpenF1SessionResultFilterSchema: z.ZodType<OpenF1SessionResultFilter> =
  openF1ComparisonFilterObject.extend({
    field: OpenF1SessionResultFilterFieldSchema,
  });

export const OpenF1SessionResultSchema: z.ZodType<OpenF1SessionResult> = z
  .object({
    dnf: z.boolean(),
    dns: z.boolean(),
    dsq: z.boolean(),
    driver_number: z.number(),
    duration: OpenF1SessionResultDurationSchema,
    gap_to_leader: OpenF1SessionResultGapToLeaderSchema,
    number_of_laps: z.number(),
    meeting_key: z.number(),
    position: z.number(),
    session_key: z.number(),
  })
  .catchall(z.unknown());

export const OpenF1SessionResultRequestSchema: z.ZodType<OpenF1SessionResultRequest> =
  z.object({
    dnf: booleanFilterValue.optional(),
    dns: booleanFilterValue.optional(),
    dsq: booleanFilterValue.optional(),
    driver_number: numberFilterValue.optional(),
    duration: numberOrStringFilterValue.optional(),
    gap_to_leader: numberOrStringFilterValue.optional(),
    number_of_laps: numberFilterValue.optional(),
    meeting_key: latestKeyFilterValue.optional(),
    position: numberFilterValue.optional(),
    session_key: latestKeyFilterValue.optional(),
    filters: z.array(OpenF1SessionResultFilterSchema).optional(),
    csv: z.boolean().optional(),
  });

export const OpenF1SessionResultResponseSchema = z.array(
  OpenF1SessionResultSchema
);

export const OpenF1SessionFilterFieldSchema: z.ZodType<OpenF1SessionFilterField> =
  z.enum([
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
  ]);

export const OpenF1SessionFilterSchema: z.ZodType<OpenF1SessionFilter> =
  openF1ComparisonFilterObject.extend({
    field: OpenF1SessionFilterFieldSchema,
  });

export const OpenF1SessionSchema: z.ZodType<OpenF1Session> = z
  .object({
    circuit_key: z.number(),
    circuit_short_name: z.string(),
    country_code: z.string(),
    country_key: z.number(),
    country_name: z.string(),
    date_end: z.string(),
    date_start: z.string(),
    gmt_offset: z.string(),
    is_cancelled: z.boolean(),
    location: z.string(),
    meeting_key: z.number(),
    session_key: z.number(),
    session_name: z.string(),
    session_type: z.string(),
    year: z.number(),
  })
  .catchall(z.unknown());

export const OpenF1SessionRequestSchema: z.ZodType<OpenF1SessionRequest> =
  z.object({
    circuit_key: numberFilterValue.optional(),
    circuit_short_name: stringFilterValue.optional(),
    country_code: stringFilterValue.optional(),
    country_key: numberFilterValue.optional(),
    country_name: stringFilterValue.optional(),
    date_end: stringFilterValue.optional(),
    date_start: stringFilterValue.optional(),
    gmt_offset: stringFilterValue.optional(),
    is_cancelled: booleanFilterValue.optional(),
    location: stringFilterValue.optional(),
    meeting_key: latestKeyFilterValue.optional(),
    session_key: latestKeyFilterValue.optional(),
    session_name: stringFilterValue.optional(),
    session_type: stringFilterValue.optional(),
    year: numberFilterValue.optional(),
    filters: z.array(OpenF1SessionFilterSchema).optional(),
    csv: z.boolean().optional(),
  });

export const OpenF1SessionResponseSchema = z.array(OpenF1SessionSchema);

export const OpenF1TeamRadioFilterFieldSchema: z.ZodType<OpenF1TeamRadioFilterField> =
  z.enum([
    "date",
    "driver_number",
    "meeting_key",
    "recording_url",
    "session_key",
  ]);

export const OpenF1TeamRadioFilterSchema: z.ZodType<OpenF1TeamRadioFilter> =
  openF1ComparisonFilterObject.extend({
    field: OpenF1TeamRadioFilterFieldSchema,
  });

export const OpenF1TeamRadioSchema: z.ZodType<OpenF1TeamRadio> = z
  .object({
    date: z.string(),
    driver_number: z.number(),
    meeting_key: z.number(),
    recording_url: z.string(),
    session_key: z.number(),
  })
  .catchall(z.unknown());

export const OpenF1TeamRadioRequestSchema: z.ZodType<OpenF1TeamRadioRequest> =
  z.object({
    date: stringFilterValue.optional(),
    driver_number: numberFilterValue.optional(),
    meeting_key: latestKeyFilterValue.optional(),
    recording_url: stringFilterValue.optional(),
    session_key: latestKeyFilterValue.optional(),
    filters: z.array(OpenF1TeamRadioFilterSchema).optional(),
    csv: z.boolean().optional(),
  });

export const OpenF1TeamRadioResponseSchema = z.array(OpenF1TeamRadioSchema);

export const OpenF1WeatherFilterFieldSchema: z.ZodType<OpenF1WeatherFilterField> =
  z.enum([
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
  ]);

export const OpenF1WeatherFilterSchema: z.ZodType<OpenF1WeatherFilter> =
  openF1ComparisonFilterObject.extend({
    field: OpenF1WeatherFilterFieldSchema,
  });

export const OpenF1WeatherSchema: z.ZodType<OpenF1Weather> = z
  .object({
    air_temperature: z.number(),
    date: z.string(),
    humidity: z.number(),
    meeting_key: z.number(),
    pressure: z.number(),
    rainfall: z.number(),
    session_key: z.number(),
    track_temperature: z.number(),
    wind_direction: z.number(),
    wind_speed: z.number(),
  })
  .catchall(z.unknown());

export const OpenF1WeatherRequestSchema: z.ZodType<OpenF1WeatherRequest> =
  z.object({
    air_temperature: numberFilterValue.optional(),
    date: stringFilterValue.optional(),
    humidity: numberFilterValue.optional(),
    meeting_key: latestKeyFilterValue.optional(),
    pressure: numberFilterValue.optional(),
    rainfall: numberFilterValue.optional(),
    session_key: latestKeyFilterValue.optional(),
    track_temperature: numberFilterValue.optional(),
    wind_direction: numberFilterValue.optional(),
    wind_speed: numberFilterValue.optional(),
    filters: z.array(OpenF1WeatherFilterSchema).optional(),
    csv: z.boolean().optional(),
  });

export const OpenF1WeatherResponseSchema = z.array(OpenF1WeatherSchema);
