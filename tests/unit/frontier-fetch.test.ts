/**
 * `pnpm run fetch:frontier`: the page parsing, the snapshot reconciliation,
 * and the rule that only a person runs the download.
 *
 * No test here contacts the network: the parser takes page text.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  decodeFlightPayload,
  deriveEntries,
  extractBoards,
  pageLeaderboardIds,
  parseLeaderboardEntries,
  reconcileEndpointMap,
  refreshedSnapshot,
} from "../../scripts/lib/frontier-leaderboard-parse.mjs";
import {
  derivedProblems,
  snapshotProblems,
} from "../../scripts/lib/frontier-models.mjs";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";

interface Entry {
  rank: number;
  model: string;
  creator: string;
  elo: number;
}

interface PageRow {
  formatted: { rank: number; elo: string };
  values: { name: string; elo: number; creator: { name: string } };
}

function pageRow(rank: number, name: string, creator: string, elo: number) {
  return {
    formatted: { rank, elo: Math.round(elo).toLocaleString("en-US") },
    values: { name, elo, creator: { name: creator } },
  } satisfies PageRow;
}

/** A page whose flight payload is split mid-row across two chunks. */
function pageHtml(boards: unknown[]): string {
  const payload = `1:["$","div",null,{"children":"AA-Video-I2V v2.1 [board]"}]\n3c:${JSON.stringify(boards)}\n4:"tail ]"`;
  const cut = Math.floor(payload.length / 2);
  const chunks = [payload.slice(0, cut), payload.slice(cut)];
  const scripts = chunks.map(
    (chunk) =>
      `<script>self.__next_f.push([1,${JSON.stringify(chunk)}])</script>`
  );
  return `<html><body><p>AA-Video-I2V v2.1 and AA-Symmetry v1.1</p>${scripts.join("")}</body></html>`;
}

const OVERALL = [
  pageRow(1, 'Alpha "One" [beta]', "Acme", 1161.39),
  pageRow(2, "Bravo", "Bolt", 1150.5),
  pageRow(3, "Charlie", "Cog", 999.4),
];
const CATEGORY = [pageRow(1, "Bravo", "Bolt", 1300)];
const HTML = pageHtml([
  [null, OVERALL],
  ["anime", CATEGORY],
]);

describe("frontier leaderboard page parsing", () => {
  it("joins the flight chunks and finds the boards", () => {
    const boards = extractBoards(decodeFlightPayload(HTML)) as unknown[][];
    expect(boards.map((board) => board[0])).toEqual([null, "anime"]);
  });

  it("reads the overall board, not a category, with displayed Elos", () => {
    expect(parseLeaderboardEntries(HTML)).toEqual([
      { rank: 1, model: 'Alpha "One" [beta]', creator: "Acme", elo: 1161 },
      { rank: 2, model: "Bravo", creator: "Bolt", elo: 1151 },
      { rank: 3, model: "Charlie", creator: "Cog", elo: 999 },
    ]);
  });

  it("stops at the requested number of ranks", () => {
    const entries = parseLeaderboardEntries(HTML, 2) as Entry[];
    expect(entries.map((entry) => entry.rank)).toEqual([1, 2]);
  });

  it("produces entries the snapshot validator accepts", () => {
    const snapshot = refreshedSnapshot(
      {
        leaderboardId: "AA-Video-I2V v2.1",
        sourceUrl: "https://example.com/board",
        capturedOn: "2026-01-01",
        methodology: "Elo.",
        entries: [],
      },
      parseLeaderboardEntries(HTML),
      "2026-11-16"
    );
    expect(snapshotProblems(snapshot)).toEqual([]);
    expect(snapshot.capturedOn).toBe("2026-11-16");
    expect(snapshot.methodology).toBe("Elo.");
  });

  it("lists the leaderboard identities a page names", () => {
    expect(pageLeaderboardIds(HTML)).toEqual([
      "AA-Symmetry v1.1",
      "AA-Video-I2V v2.1",
    ]);
  });

  it("refuses a page with no payload, no rows, or a malformed row", () => {
    expect(() => parseLeaderboardEntries("<html></html>")).toThrow(
      "no flight payload"
    );
    expect(() => parseLeaderboardEntries(pageHtml([]))).toThrow(
      "no leaderboard rows"
    );
    const nameless = { ...OVERALL[0], values: { elo: 1 } };
    expect(() =>
      parseLeaderboardEntries(pageHtml([[null, [OVERALL[1], nameless]]]))
    ).toThrow("leaderboard row 2 has no model and creator name");
  });
});

describe("frontier snapshot reconciliation", () => {
  const entries: Entry[] = [
    { rank: 1, model: "Kept", creator: "A", elo: 1200 },
    { rank: 2, model: "New", creator: "B", elo: 1100 },
  ];

  it("keeps mapped endpoints, opens new models empty, drops departed ones", () => {
    const kept = [{ provider: "fal", dotPath: "a.b", pricingKey: "a/b" }];
    const result = reconcileEndpointMap({ Gone: [], Kept: kept }, entries);
    expect(result.map).toEqual({ Kept: kept, New: [] });
    expect(Object.keys(result.map)).toEqual(["Kept", "New"]);
    expect(result.added).toEqual(["New"]);
    expect(result.dropped).toEqual(["Gone"]);
  });

  it("derives a board its own validator accepts", () => {
    const first: Entry[] = [
      { rank: 1, model: "Both", creator: "First", elo: 1100 },
      { rank: 2, model: "Tie", creator: "First", elo: 1000 },
      { rank: 3, model: "Unserved", creator: "First", elo: 990 },
    ];
    const second: Entry[] = [
      { rank: 1, model: "Both", creator: "Second", elo: 1150 },
      { rank: 2, model: "Other", creator: "Second", elo: 1000 },
      { rank: 3, model: "Tie", creator: "Second", elo: 1000 },
    ];
    const endpoint = [{ provider: "fal", dotPath: "a.b", pricingKey: "a/b" }];
    const endpointMap = { Both: endpoint, Tie: endpoint, Other: endpoint };
    const derived = deriveEntries([first, second], endpointMap);
    expect(derived.entries).toEqual([
      { rank: 1, model: "Both", creator: "Second", elo: 1150 },
      { rank: 2, model: "Tie", creator: "First", elo: 1000 },
      { rank: 3, model: "Other", creator: "Second", elo: 1000 },
    ]);
    expect(derived.unmapped).toEqual(["Unserved"]);
    expect(
      derivedProblems({ entries: derived.entries }, endpointMap, [
        { leaderboardId: "first", entries: first },
        { leaderboardId: "second", entries: second },
      ])
    ).toEqual([]);
  });
});

describe("frontier download is a manual routine", () => {
  const packageJson = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8")
  ) as { scripts: Record<string, string> };

  it("exposes the download as its own script", () => {
    expect(packageJson.scripts["fetch:frontier"]).toBe(
      "node scripts/fetch-frontier.mjs"
    );
  });

  it("is invoked by no other script, hook, or workflow", () => {
    const callers = Object.entries(packageJson.scripts)
      .filter(([name]) => name !== "fetch:frontier")
      .filter(([, command]) => /fetch[:-]frontier/.test(command))
      .map(([name]) => name);
    expect(callers).toEqual([]);
    const workflow = readFileSync(
      path.join(repoRoot, ".github/workflows/ci.yml"),
      "utf8"
    );
    expect(workflow).not.toMatch(/fetch[:-]frontier/);
  });

  it("takes its URLs from the catalog and keeps parsing off the network", () => {
    const script = readFileSync(
      path.join(repoRoot, "scripts/fetch-frontier.mjs"),
      "utf8"
    );
    expect(script).toContain("loadCatalog()");
    expect(script).not.toContain("artificialanalysis.ai");
    const parser = readFileSync(
      path.join(repoRoot, "scripts/lib/frontier-leaderboard-parse.mjs"),
      "utf8"
    );
    expect(parser).not.toMatch(/\bfetch\s*\(/);
    expect(parser).not.toContain("node:http");
  });
});
