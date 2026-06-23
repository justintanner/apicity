export type { TheSportsDBOptions } from "./zod";

export class TheSportsDBError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "TheSportsDBError";
    this.status = status;
    this.body = body ?? null;
  }
}

export interface TheSportsDBEndpointMethod<TResponse> {
  (signal?: AbortSignal): Promise<TResponse>;
  schema: undefined;
}

export interface TheSportsDBSport {
  idSport?: string;
  strSport?: string;
  strFormat?: string;
  strSportThumb?: string;
  strSportThumbGreen?: string;
  strSportDescription?: string;
  [key: string]: unknown;
}

export interface TheSportsDBSportsResponse {
  sports: TheSportsDBSport[] | null;
  [key: string]: unknown;
}

export interface TheSportsDBCountry {
  name_en?: string;
  [key: string]: unknown;
}

export interface TheSportsDBCountriesResponse {
  countries: TheSportsDBCountry[] | null;
  [key: string]: unknown;
}

export interface TheSportsDBLeague {
  idLeague?: string;
  strLeague?: string;
  strSport?: string;
  strLeagueAlternate?: string | null;
  [key: string]: unknown;
}

export interface TheSportsDBLeaguesResponse {
  leagues: TheSportsDBLeague[] | null;
  [key: string]: unknown;
}

export type TheSportsDBAllSportsMethod =
  TheSportsDBEndpointMethod<TheSportsDBSportsResponse>;
export type TheSportsDBAllCountriesMethod =
  TheSportsDBEndpointMethod<TheSportsDBCountriesResponse>;
export type TheSportsDBAllLeaguesMethod =
  TheSportsDBEndpointMethod<TheSportsDBLeaguesResponse>;

export interface TheSportsDBV1Namespace {
  allSports: TheSportsDBAllSportsMethod;
  allCountries: TheSportsDBAllCountriesMethod;
  allLeagues: TheSportsDBAllLeaguesMethod;
}

export interface TheSportsDBGetNamespace {
  v1: TheSportsDBV1Namespace;
}

export interface TheSportsDBProvider {
  v1: TheSportsDBV1Namespace;
  get: TheSportsDBGetNamespace;
}
