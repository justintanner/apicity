import { z } from "zod";

export const TheSportsDBOptionsSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type TheSportsDBOptions = z.infer<typeof TheSportsDBOptionsSchema>;

const idSchema = z.union([z.string().min(1), z.number().int()]);

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
