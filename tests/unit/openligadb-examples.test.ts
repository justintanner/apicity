import { describe, expect, it } from "vitest";

import { createOpenLigaDB } from "../../packages/provider/openligadb/src";
import examples from "../../packages/provider/openligadb/src/example";
import type { EndpointExample } from "../../packages/provider/openligadb/src/example";

interface SchemaLike {
  safeParse(input: unknown): { success: boolean };
}

interface ExampleEndpoint {
  example?: EndpointExample;
  schema?: SchemaLike;
}

function asEndpoint(value: unknown): ExampleEndpoint {
  return value as ExampleEndpoint;
}

function openLigaDBEndpoints(): Record<string, ExampleEndpoint> {
  const openligadb = createOpenLigaDB();
  return {
    "GET getavailablegroups": asEndpoint(openligadb.getavailablegroups),
    "GET getavailableleagues": asEndpoint(openligadb.getavailableleagues),
    "GET getavailableleagues.bySeason": asEndpoint(
      openligadb.getavailableleagues.bySeason
    ),
    "GET getavailablesports": asEndpoint(openligadb.getavailablesports),
    "GET getavailableteams": asEndpoint(openligadb.getavailableteams),
    "GET getbltable": asEndpoint(openligadb.getbltable),
    "GET getcurrentgroup": asEndpoint(openligadb.getcurrentgroup),
    "GET getgoalgetters": asEndpoint(openligadb.getgoalgetters),
    "GET getgrouptable": asEndpoint(openligadb.getgrouptable),
    "GET getlastchangedate": asEndpoint(openligadb.getlastchangedate),
    "GET getmatchdata.byId": asEndpoint(openligadb.getmatchdata.byId),
    "GET getmatchdata.byLeagueSeason": asEndpoint(
      openligadb.getmatchdata.byLeagueSeason
    ),
    "GET getmatchdata.byLeagueSeasonGroup": asEndpoint(
      openligadb.getmatchdata.byLeagueSeasonGroup
    ),
    "GET getmatchdata.byLeagueSeasonTeam": asEndpoint(
      openligadb.getmatchdata.byLeagueSeasonTeam
    ),
    "GET getmatchdata.byTeams": asEndpoint(openligadb.getmatchdata.byTeams),
    "GET getresultinfos": asEndpoint(openligadb.getresultinfos),
    "GET swagger.v1.swaggerJson": asEndpoint(openligadb.swagger.v1.swaggerJson),
  };
}

describe("OpenLigaDB generated examples", () => {
  it("covers every endpoint with deterministic static examples", () => {
    const endpoints = openLigaDBEndpoints();

    expect(Object.keys(examples).sort()).toEqual(Object.keys(endpoints).sort());

    for (const [key, example] of Object.entries(examples)) {
      expect(example.source).toMatch(/^static:openligadb-/);
      expect(endpoints[key]?.example).toEqual(example);
    }
  });

  it("validates schema-bearing examples against endpoint request schemas", () => {
    const endpoints = openLigaDBEndpoints();

    for (const [key, example] of Object.entries(examples)) {
      const endpoint = endpoints[key];
      expect(endpoint).toBeDefined();
      if (endpoint?.schema) {
        expect(endpoint.schema.safeParse(example.payload).success).toBe(true);
      } else {
        expect(example.payload).toEqual({});
      }
    }
  });
});
