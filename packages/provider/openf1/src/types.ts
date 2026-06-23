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

export interface OpenF1V1Namespace {
  meetings: OpenF1MeetingsMethod;
}

export interface OpenF1Provider {
  v1: OpenF1V1Namespace;
}
