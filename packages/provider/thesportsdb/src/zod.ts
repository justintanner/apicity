import { z } from "zod";
import type {
  TheSportsDBSearchEventsRequest,
  TheSportsDBSearchFilenameRequest,
  TheSportsDBSearchPlayersRequest,
  TheSportsDBSearchTeamsRequest,
  TheSportsDBSearchVenuesRequest,
} from "./types";

export const TheSportsDBOptionsSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type TheSportsDBOptions = z.infer<typeof TheSportsDBOptionsSchema>;

const idSchema = z.union([z.string().min(1), z.number().int()]);
const nonEmptyQueryString = z.string().min(1);

export const TheSportsDBLeagueLookupRequestSchema = z.object({
  idLeague: idSchema,
});

export type TheSportsDBLeagueLookupRequest = z.infer<
  typeof TheSportsDBLeagueLookupRequestSchema
>;

export const TheSportsDBTableLookupRequestSchema = z.object({
  idLeague: idSchema,
  season: z.string().min(1).optional(),
});

export type TheSportsDBTableLookupRequest = z.infer<
  typeof TheSportsDBTableLookupRequestSchema
>;

export const TheSportsDBTeamLookupRequestSchema = z.object({
  idTeam: idSchema,
});

export type TheSportsDBTeamLookupRequest = z.infer<
  typeof TheSportsDBTeamLookupRequestSchema
>;

export const TheSportsDBEquipmentLookupRequestSchema = z.object({
  idTeam: idSchema,
});

export type TheSportsDBEquipmentLookupRequest = z.infer<
  typeof TheSportsDBEquipmentLookupRequestSchema
>;

export const TheSportsDBVenueLookupRequestSchema = z.object({
  idVenue: idSchema,
});

export type TheSportsDBVenueLookupRequest = z.infer<
  typeof TheSportsDBVenueLookupRequestSchema
>;

export const TheSportsDBSearchTeamsRequestSchema: z.ZodType<TheSportsDBSearchTeamsRequest> =
  z.object({
    team: nonEmptyQueryString,
  });

export const TheSportsDBSearchEventsRequestSchema: z.ZodType<TheSportsDBSearchEventsRequest> =
  z.object({
    event: nonEmptyQueryString,
    season: nonEmptyQueryString.optional(),
    date: nonEmptyQueryString.optional(),
    filename: nonEmptyQueryString.optional(),
  });

export const TheSportsDBSearchFilenameRequestSchema: z.ZodType<TheSportsDBSearchFilenameRequest> =
  z.object({
    filename: nonEmptyQueryString,
    season: nonEmptyQueryString.optional(),
  });

export const TheSportsDBSearchPlayersRequestSchema: z.ZodType<TheSportsDBSearchPlayersRequest> =
  z.object({
    player: nonEmptyQueryString,
  });

export const TheSportsDBSearchVenuesRequestSchema: z.ZodType<TheSportsDBSearchVenuesRequest> =
  z.object({
    venue: nonEmptyQueryString,
  });
