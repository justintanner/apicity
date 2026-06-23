import { z } from "zod";
import type {
  TheSportsDBContract,
  TheSportsDBEvent,
  TheSportsDBEventResponse,
  TheSportsDBEventResult,
  TheSportsDBEventResultsResponse,
  TheSportsDBEventStat,
  TheSportsDBEventStatsResponse,
  TheSportsDBFormerTeam,
  TheSportsDBHonour,
  TheSportsDBLineup,
  TheSportsDBLineupResponse,
  TheSportsDBLookupContractsResponse,
  TheSportsDBLookupFormerTeamsResponse,
  TheSportsDBLookupHonoursResponse,
  TheSportsDBLookupMilestonesResponse,
  TheSportsDBLookupPlayerResponse,
  TheSportsDBLookupPlayerStatsResponse,
  TheSportsDBMilestone,
  TheSportsDBPlayer,
  TheSportsDBPlayerIdRequest,
  TheSportsDBPlayerResult,
  TheSportsDBPlayerResultsResponse,
  TheSportsDBPlayerStat,
  TheSportsDBSearchEventsRequest,
  TheSportsDBSearchFilenameRequest,
  TheSportsDBSearchPlayersRequest,
  TheSportsDBSearchTeamsRequest,
  TheSportsDBSearchVenuesRequest,
  TheSportsDBTimeline,
  TheSportsDBTimelineResponse,
  TheSportsDBTvEvent,
  TheSportsDBTvEventResponse,
} from "./types";

export const TheSportsDBOptionsSchema = z.object({
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  v2BaseURL: z.string().optional(),
  timeout: z.number().optional(),
  fetch: z.custom<typeof fetch>().optional(),
});

export type TheSportsDBOptions = z.infer<typeof TheSportsDBOptionsSchema>;

const idSchema = z.union([z.string().min(1), z.number().int()]);
const eventIdSchema = z.union([
  z.string().min(1),
  z.number().int().nonnegative(),
]);
const nonEmptyQueryString = z.string().min(1);
const nullableString = z.string().nullable().optional();
const optionalNullableString = nullableString;
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const flagSchema = z
  .union([z.boolean(), z.literal(0), z.literal(1)])
  .optional();
const integerPathIdSchema = z.union([
  z.string().regex(/^\d+$/),
  z.number().int(),
]);

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

export const TheSportsDBSearchAllLeaguesRequestSchema = z.object({
  country: nonEmptyQueryString,
  sport: nonEmptyQueryString,
});

export type TheSportsDBSearchAllLeaguesRequest = z.infer<
  typeof TheSportsDBSearchAllLeaguesRequestSchema
>;

export const TheSportsDBSearchAllSeasonsRequestSchema = z.object({
  idLeague: idSchema,
  poster: flagSchema,
  badge: flagSchema,
  description: flagSchema,
});

export type TheSportsDBSearchAllSeasonsRequest = z.infer<
  typeof TheSportsDBSearchAllSeasonsRequestSchema
>;

export const TheSportsDBSearchAllTeamsRequestSchema = z
  .object({
    league: nonEmptyQueryString.optional(),
    sport: nonEmptyQueryString.optional(),
    country: nonEmptyQueryString.optional(),
  })
  .refine((req) => req.league || req.sport || req.country, {
    message: "At least one of league, sport, or country is required",
  });

export type TheSportsDBSearchAllTeamsRequest = z.infer<
  typeof TheSportsDBSearchAllTeamsRequestSchema
>;

export const TheSportsDBLookupAllPlayersRequestSchema = z.object({
  idTeam: idSchema,
});

export type TheSportsDBLookupAllPlayersRequest = z.infer<
  typeof TheSportsDBLookupAllPlayersRequestSchema
>;

export const TheSportsDBTeamEventsRequestSchema = z.object({
  idTeam: idSchema,
});

export type TheSportsDBTeamEventsRequest = z.infer<
  typeof TheSportsDBTeamEventsRequestSchema
>;

export const TheSportsDBLeagueEventsRequestSchema = z.object({
  idLeague: idSchema,
});

export type TheSportsDBLeagueEventsRequest = z.infer<
  typeof TheSportsDBLeagueEventsRequestSchema
>;

export const TheSportsDBEventsDayRequestSchema = z.object({
  date: dateSchema,
  sport: nonEmptyQueryString.optional(),
  league: idSchema.optional(),
});

export type TheSportsDBEventsDayRequest = z.infer<
  typeof TheSportsDBEventsDayRequestSchema
>;

export const TheSportsDBEventsSeasonRequestSchema = z.object({
  idLeague: idSchema,
  season: z.string().min(1),
});

export type TheSportsDBEventsSeasonRequest = z.infer<
  typeof TheSportsDBEventsSeasonRequestSchema
>;

export const TheSportsDBEventsTVRequestSchema = z
  .object({
    date: dateSchema.optional(),
    country: nonEmptyQueryString.optional(),
    sport: nonEmptyQueryString.optional(),
    channel: nonEmptyQueryString.optional(),
    idChannel: idSchema.optional(),
  })
  .refine(
    (req) =>
      req.date ||
      req.country ||
      req.sport ||
      req.channel ||
      req.idChannel !== undefined,
    {
      message:
        "At least one of date, country, sport, channel, or idChannel is required",
    }
  );

export type TheSportsDBEventsTVRequest = z.infer<
  typeof TheSportsDBEventsTVRequestSchema
>;

export const TheSportsDBEventsHighlightsRequestSchema = z.object({
  date: dateSchema,
  idLeague: idSchema.optional(),
  sport: nonEmptyQueryString.optional(),
});

export type TheSportsDBEventsHighlightsRequest = z.infer<
  typeof TheSportsDBEventsHighlightsRequestSchema
>;

export const TheSportsDBPlayerIdRequestSchema: z.ZodType<TheSportsDBPlayerIdRequest> =
  z.object({
    idPlayer: z.number().int(),
  });

export const TheSportsDBPlayerSchema: z.ZodType<TheSportsDBPlayer> = z
  .object({
    idPlayer: nullableString,
    idTeam: nullableString,
    idTeam2: nullableString,
    idTeamNational: nullableString,
    idAPIfootball: nullableString,
    idPlayerManager: nullableString,
    idWikidata: nullableString,
    idTransferMkt: nullableString,
    idESPN: nullableString,
    intSoccerXMLTeamID: nullableString,
    intLoved: nullableString,
    strNationality: nullableString,
    strPlayer: nullableString,
    strPlayerAlternate: nullableString,
    strTeam: nullableString,
    strTeam2: nullableString,
    strSport: nullableString,
    dateBorn: nullableString,
    dateDied: nullableString,
    dateSigned: nullableString,
    strNumber: nullableString,
    strSigning: nullableString,
    strWage: nullableString,
    strOutfitter: nullableString,
    strKit: nullableString,
    strAgent: nullableString,
    strBirthLocation: nullableString,
    strDeathLocation: nullableString,
    strEthnicity: nullableString,
    strStatus: nullableString,
    strDescriptionEN: nullableString,
    strDescriptionDE: nullableString,
    strDescriptionFR: nullableString,
    strDescriptionCN: nullableString,
    strDescriptionIT: nullableString,
    strDescriptionJP: nullableString,
    strDescriptionRU: nullableString,
    strDescriptionES: nullableString,
    strDescriptionPT: nullableString,
    strDescriptionSE: nullableString,
    strDescriptionNL: nullableString,
    strDescriptionHU: nullableString,
    strDescriptionNO: nullableString,
    strDescriptionIL: nullableString,
    strDescriptionPL: nullableString,
    strGender: nullableString,
    strSide: nullableString,
    strPosition: nullableString,
    strCollege: nullableString,
    strFacebook: nullableString,
    strWebsite: nullableString,
    strTwitter: nullableString,
    strInstagram: nullableString,
    strYoutube: nullableString,
    strHeight: nullableString,
    strWeight: nullableString,
    strThumb: nullableString,
    strPoster: nullableString,
    strCutout: nullableString,
    strRender: nullableString,
    strBanner: nullableString,
    strFanart1: nullableString,
    strFanart2: nullableString,
    strFanart3: nullableString,
    strFanart4: nullableString,
    strCreativeCommons: nullableString,
    strLocked: nullableString,
    relevance: nullableString,
  })
  .passthrough();

export const TheSportsDBHonourSchema: z.ZodType<TheSportsDBHonour> = z
  .object({
    id: nullableString,
    idPlayer: nullableString,
    idTeam: nullableString,
    idLeague: nullableString,
    idHonour: nullableString,
    strSport: nullableString,
    strPlayer: nullableString,
    strTeam: nullableString,
    strTeamBadge: nullableString,
    strHonour: nullableString,
    strHonourLogo: nullableString,
    strHonourTrophy: nullableString,
    strSeason: nullableString,
  })
  .passthrough();

export const TheSportsDBFormerTeamSchema: z.ZodType<TheSportsDBFormerTeam> = z
  .object({
    id: nullableString,
    idPlayer: nullableString,
    idFormerTeam: nullableString,
    strSport: nullableString,
    strPlayer: nullableString,
    strFormerTeam: nullableString,
    strMoveType: nullableString,
    strBadge: nullableString,
    strJoined: nullableString,
    strDeparted: nullableString,
  })
  .passthrough();

export const TheSportsDBMilestoneSchema: z.ZodType<TheSportsDBMilestone> = z
  .object({
    id: nullableString,
    idPlayer: nullableString,
    strPlayer: nullableString,
    idTeam: nullableString,
    idMilestone: nullableString,
    strTeam: nullableString,
    strSport: nullableString,
    strMilestone: nullableString,
    strMilestoneLogo: nullableString,
    dateMilestone: nullableString,
  })
  .passthrough();

export const TheSportsDBContractSchema: z.ZodType<TheSportsDBContract> = z
  .object({
    id: nullableString,
    idPlayer: nullableString,
    idTeam: nullableString,
    strSport: nullableString,
    strPlayer: nullableString,
    strTeam: nullableString,
    strBadge: nullableString,
    strYearStart: nullableString,
    strYearEnd: nullableString,
    strWage: nullableString,
  })
  .passthrough();

export const TheSportsDBPlayerResultSchema: z.ZodType<TheSportsDBPlayerResult> =
  z
    .object({
      idResult: nullableString,
      idPlayer: nullableString,
      strPlayer: nullableString,
      idTeam: nullableString,
      idEvent: nullableString,
      strEvent: nullableString,
      strResult: nullableString,
      intPosition: nullableString,
      intPoints: nullableString,
      strDetail: nullableString,
      dateEvent: nullableString,
      strSeason: nullableString,
      strCountry: nullableString,
      strSport: nullableString,
    })
    .passthrough();

export const TheSportsDBPlayerStatSchema: z.ZodType<TheSportsDBPlayerStat> = z
  .object({
    id: nullableString,
    idPlayer: nullableString,
    idTeam: nullableString,
    idLeague: nullableString,
    strSport: nullableString,
    strPlayer: nullableString,
    strTeam: nullableString,
    strTeamBadge: nullableString,
    strLeague: nullableString,
    strLeagueBadge: nullableString,
    strStatistic: nullableString,
    strValue: nullableString,
    strSeason: nullableString,
  })
  .passthrough();

export const TheSportsDBLookupPlayerResponseSchema: z.ZodType<TheSportsDBLookupPlayerResponse> =
  z
    .object({
      players: z.array(TheSportsDBPlayerSchema).nullable(),
    })
    .passthrough();

export const TheSportsDBLookupHonoursResponseSchema: z.ZodType<TheSportsDBLookupHonoursResponse> =
  z
    .object({
      honours: z.array(TheSportsDBHonourSchema).nullable(),
    })
    .passthrough();

export const TheSportsDBLookupFormerTeamsResponseSchema: z.ZodType<TheSportsDBLookupFormerTeamsResponse> =
  z
    .object({
      formerteams: z.array(TheSportsDBFormerTeamSchema).nullable(),
    })
    .passthrough();

export const TheSportsDBLookupMilestonesResponseSchema: z.ZodType<TheSportsDBLookupMilestonesResponse> =
  z
    .object({
      milestones: z.array(TheSportsDBMilestoneSchema).nullable(),
    })
    .passthrough();

export const TheSportsDBLookupContractsResponseSchema: z.ZodType<TheSportsDBLookupContractsResponse> =
  z
    .object({
      contracts: z.array(TheSportsDBContractSchema).nullable(),
    })
    .passthrough();

export const TheSportsDBPlayerResultsResponseSchema: z.ZodType<TheSportsDBPlayerResultsResponse> =
  z
    .object({
      results: z.array(TheSportsDBPlayerResultSchema).nullable(),
    })
    .passthrough();

export const TheSportsDBLookupPlayerStatsResponseSchema: z.ZodType<TheSportsDBLookupPlayerStatsResponse> =
  z
    .object({
      playerstats: z.array(TheSportsDBPlayerStatSchema).nullable(),
    })
    .passthrough();

export const TheSportsDBEventLookupRequestSchema = z.object({
  idEvent: eventIdSchema,
});

export type TheSportsDBEventLookupRequest = z.infer<
  typeof TheSportsDBEventLookupRequestSchema
>;

export const TheSportsDBEventSchema: z.ZodType<TheSportsDBEvent> = z
  .object({
    idEvent: optionalNullableString,
    strEvent: optionalNullableString,
    strEventAlternate: optionalNullableString,
    strFilename: optionalNullableString,
    strSport: optionalNullableString,
    idLeague: optionalNullableString,
    strLeague: optionalNullableString,
    strSeason: optionalNullableString,
    strDescriptionEN: optionalNullableString,
    strHomeTeam: optionalNullableString,
    strAwayTeam: optionalNullableString,
    intHomeScore: optionalNullableString,
    intAwayScore: optionalNullableString,
    dateEvent: optionalNullableString,
    dateEventLocal: optionalNullableString,
    strTime: optionalNullableString,
    strTimeLocal: optionalNullableString,
    idHomeTeam: optionalNullableString,
    idAwayTeam: optionalNullableString,
    idVenue: optionalNullableString,
    strVenue: optionalNullableString,
    strCountry: optionalNullableString,
    strCity: optionalNullableString,
    strPoster: optionalNullableString,
    strSquare: optionalNullableString,
    strFanart: optionalNullableString,
    strThumb: optionalNullableString,
    strBanner: optionalNullableString,
    strMap: optionalNullableString,
    strVideo: optionalNullableString,
    strStatus: optionalNullableString,
  })
  .catchall(z.unknown());

export const TheSportsDBEventResponseSchema: z.ZodType<TheSportsDBEventResponse> =
  z
    .object({
      events: z.array(TheSportsDBEventSchema).nullable(),
    })
    .catchall(z.unknown());

export const TheSportsDBEventResultSchema: z.ZodType<TheSportsDBEventResult> = z
  .object({
    idResult: optionalNullableString,
    idPlayer: optionalNullableString,
    strPlayer: optionalNullableString,
    idTeam: optionalNullableString,
    idEvent: optionalNullableString,
    strEvent: optionalNullableString,
    strResult: optionalNullableString,
    intPosition: optionalNullableString,
    intPoints: optionalNullableString,
    strDetail: optionalNullableString,
    dateEvent: optionalNullableString,
    strSeason: optionalNullableString,
    strCountry: optionalNullableString,
    strSport: optionalNullableString,
  })
  .catchall(z.unknown());

export const TheSportsDBEventResultsResponseSchema: z.ZodType<TheSportsDBEventResultsResponse> =
  z
    .object({
      results: z.array(TheSportsDBEventResultSchema).nullable(),
    })
    .catchall(z.unknown());

export const TheSportsDBLineupSchema: z.ZodType<TheSportsDBLineup> = z
  .object({
    idLineup: optionalNullableString,
    idEvent: optionalNullableString,
    strPosition: optionalNullableString,
    strHome: optionalNullableString,
    strSubstitute: optionalNullableString,
    intSquadNumber: optionalNullableString,
    idPlayer: optionalNullableString,
    strPlayer: optionalNullableString,
    idTeam: optionalNullableString,
    strTeam: optionalNullableString,
    strCutout: optionalNullableString,
    strThumb: optionalNullableString,
    strRender: optionalNullableString,
  })
  .catchall(z.unknown());

export const TheSportsDBLineupResponseSchema: z.ZodType<TheSportsDBLineupResponse> =
  z
    .object({
      lineup: z.array(TheSportsDBLineupSchema).nullable(),
    })
    .catchall(z.unknown());

export const TheSportsDBTimelineSchema: z.ZodType<TheSportsDBTimeline> = z
  .object({
    idTimeline: optionalNullableString,
    idEvent: optionalNullableString,
    strTimeline: optionalNullableString,
    strTimelineDetail: optionalNullableString,
    strHome: optionalNullableString,
    strEvent: optionalNullableString,
    idPlayer: optionalNullableString,
    strPlayer: optionalNullableString,
    idAssist: optionalNullableString,
    strAssist: optionalNullableString,
    intTime: optionalNullableString,
    strPeriod: optionalNullableString,
    idTeam: optionalNullableString,
    strTeam: optionalNullableString,
    strComment: optionalNullableString,
    dateEvent: optionalNullableString,
    strSeason: optionalNullableString,
  })
  .catchall(z.unknown());

export const TheSportsDBTimelineResponseSchema: z.ZodType<TheSportsDBTimelineResponse> =
  z
    .object({
      timeline: z.array(TheSportsDBTimelineSchema).nullable(),
    })
    .catchall(z.unknown());

export const TheSportsDBEventStatSchema: z.ZodType<TheSportsDBEventStat> = z
  .object({
    idStatistic: optionalNullableString,
    idEvent: optionalNullableString,
    idApiFootball: optionalNullableString,
    strEvent: optionalNullableString,
    strStat: optionalNullableString,
    intHome: optionalNullableString,
    intAway: optionalNullableString,
  })
  .catchall(z.unknown());

export const TheSportsDBEventStatsResponseSchema: z.ZodType<TheSportsDBEventStatsResponse> =
  z
    .object({
      eventstats: z.array(TheSportsDBEventStatSchema).nullable(),
    })
    .catchall(z.unknown());

export const TheSportsDBTvEventSchema: z.ZodType<TheSportsDBTvEvent> = z
  .object({
    id: optionalNullableString,
    idEvent: optionalNullableString,
    strSport: optionalNullableString,
    strEvent: optionalNullableString,
    strEventThumb: optionalNullableString,
    strEventPoster: optionalNullableString,
    strEventBanner: optionalNullableString,
    strEventSquare: optionalNullableString,
    idChannel: optionalNullableString,
    strCountry: optionalNullableString,
    strEventCountry: optionalNullableString,
    strLogo: optionalNullableString,
    strChannel: optionalNullableString,
    strSeason: optionalNullableString,
    strTime: optionalNullableString,
    dateEvent: optionalNullableString,
    strTimeStamp: optionalNullableString,
  })
  .catchall(z.unknown());

export const TheSportsDBTvEventResponseSchema: z.ZodType<TheSportsDBTvEventResponse> =
  z
    .object({
      tvevent: z.array(TheSportsDBTvEventSchema).nullable(),
    })
    .catchall(z.unknown());

export const TheSportsDBLeagueScheduleRequestSchema = z.object({
  idLeague: idSchema,
});

export type TheSportsDBLeagueScheduleRequest = z.infer<
  typeof TheSportsDBLeagueScheduleRequestSchema
>;

export const TheSportsDBTeamScheduleRequestSchema = z.object({
  idTeam: idSchema,
});

export type TheSportsDBTeamScheduleRequest = z.infer<
  typeof TheSportsDBTeamScheduleRequestSchema
>;

export const TheSportsDBVenueScheduleRequestSchema = z.object({
  idVenue: idSchema,
});

export type TheSportsDBVenueScheduleRequest = z.infer<
  typeof TheSportsDBVenueScheduleRequestSchema
>;

export const TheSportsDBLeagueSeasonScheduleRequestSchema = z.object({
  idLeague: idSchema,
  season: nonEmptyQueryString,
});

export type TheSportsDBLeagueSeasonScheduleRequest = z.infer<
  typeof TheSportsDBLeagueSeasonScheduleRequestSchema
>;

export const TheSportsDBLiveScoreSportRequestSchema = z.object({
  sport: nonEmptyQueryString,
});

export type TheSportsDBLiveScoreSportRequest = z.infer<
  typeof TheSportsDBLiveScoreSportRequestSchema
>;

export const TheSportsDBLiveScoreLeagueRequestSchema = z.object({
  leagueId: idSchema,
});

export type TheSportsDBLiveScoreLeagueRequest = z.infer<
  typeof TheSportsDBLiveScoreLeagueRequestSchema
>;

export const TheSportsDBV2LeagueLookupRequestSchema = z.object({
  idLeague: integerPathIdSchema,
});

export type TheSportsDBV2LeagueLookupRequest = z.infer<
  typeof TheSportsDBV2LeagueLookupRequestSchema
>;

export const TheSportsDBV2TeamLookupRequestSchema = z.object({
  idTeam: integerPathIdSchema,
});

export type TheSportsDBV2TeamLookupRequest = z.infer<
  typeof TheSportsDBV2TeamLookupRequestSchema
>;

export const TheSportsDBV2PlayerLookupRequestSchema = z.object({
  idPlayer: integerPathIdSchema,
});

export type TheSportsDBV2PlayerLookupRequest = z.infer<
  typeof TheSportsDBV2PlayerLookupRequestSchema
>;

export const TheSportsDBV2EventLookupRequestSchema = z.object({
  idEvent: integerPathIdSchema,
});

export type TheSportsDBV2EventLookupRequest = z.infer<
  typeof TheSportsDBV2EventLookupRequestSchema
>;

export const TheSportsDBV2VenueLookupRequestSchema = z.object({
  idVenue: integerPathIdSchema,
});

export type TheSportsDBV2VenueLookupRequest = z.infer<
  typeof TheSportsDBV2VenueLookupRequestSchema
>;
