/**
 * Pure helpers behind `pnpm run fetch:frontier`.
 *
 * Everything here takes text or parsed JSON and returns values: the download
 * itself lives in `scripts/fetch-frontier.mjs`, the only file allowed to reach
 * a leaderboard page. A leaderboard page is a Next.js document whose rows ride
 * in its flight payload as `[[null, rows], [category, rows], ...]`; the `null`
 * key is the overall board.
 */

const MAX_RANKS = 10;
const CHUNK_PATTERN = /self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g;
const BOARDS_MARKER = '[[null,[{"formatted":';
const LEADERBOARD_ID_PATTERN =
  /\bAA-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)* v\d+(?:\.\d+)+/g;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Join the page's flight chunks into one string. */
export function decodeFlightPayload(html) {
  const chunks = [...html.matchAll(CHUNK_PATTERN)].map((match) =>
    JSON.parse(match[1])
  );
  if (chunks.length === 0) {
    throw new Error("page carries no flight payload");
  }
  return chunks.join("");
}

/** End index (exclusive) of the JSON array that opens at `start`. */
function arrayEnd(text, start) {
  let depth = 0;
  let inString = false;
  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (inString) {
      if (char === "\\") index++;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "[") depth++;
    else if (char === "]" && --depth === 0) return index + 1;
  }
  throw new Error("leaderboard rows are not a closed JSON array");
}

/** The `[category, rows]` pairs of a decoded payload. */
export function extractBoards(payload) {
  const start = payload.indexOf(BOARDS_MARKER);
  if (start === -1) {
    throw new Error("payload carries no leaderboard rows");
  }
  return JSON.parse(payload.slice(start, arrayEnd(payload, start)));
}

function overallRows(boards) {
  const overall = boards.find(
    (board) => Array.isArray(board) && board[0] === null
  );
  if (overall === undefined || !Array.isArray(overall[1])) {
    throw new Error("payload carries no overall leaderboard");
  }
  return overall[1];
}

function toEntry(row, index) {
  const where = `leaderboard row ${index + 1}`;
  const formatted = isObject(row) ? row.formatted : undefined;
  const values = isObject(row) ? row.values : undefined;
  if (!isObject(formatted) || !isObject(values)) {
    throw new Error(`${where} has no formatted/values pair`);
  }
  const elo = Number(String(formatted.elo).replaceAll(",", ""));
  const creator = isObject(values.creator) ? values.creator.name : undefined;
  if (!Number.isInteger(formatted.rank) || !Number.isInteger(elo)) {
    throw new Error(`${where} has no integer rank and Elo`);
  }
  if (typeof values.name !== "string" || typeof creator !== "string") {
    throw new Error(`${where} has no model and creator name`);
  }
  return { rank: formatted.rank, model: values.name, creator, elo };
}

/** The overall board's top rows as snapshot entries, in rank order. */
export function parseLeaderboardEntries(html, max = MAX_RANKS) {
  const rows = overallRows(extractBoards(decodeFlightPayload(html)));
  return rows
    .map(toEntry)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, max);
}

/** Every `AA-<Name> v<version>` identity the page text mentions. */
export function pageLeaderboardIds(html) {
  return [...new Set(html.match(LEADERBOARD_ID_PATTERN) ?? [])].sort();
}

/**
 * A fresh snapshot: the previous identity and methodology, new date and rows.
 */
export function refreshedSnapshot(previous, entries, capturedOn) {
  return { ...previous, capturedOn, entries };
}

/**
 * Carry an endpoint map over to a new entry list.
 *
 * Models still listed keep their endpoints, new models start as `[]`, and
 * models that left the list are dropped and reported.
 *
 * @returns {{ map: Record<string, unknown[]>, added: string[], dropped: string[] }}
 */
export function reconcileEndpointMap(endpointMap, entries) {
  const models = entries.map((entry) => entry.model);
  const known = (model) => Object.hasOwn(endpointMap, model);
  const map = Object.fromEntries(
    models.map((model) => [model, known(model) ? endpointMap[model] : []])
  );
  return {
    map,
    added: models.filter((model) => !known(model)),
    dropped: Object.keys(endpointMap).filter(
      (model) => !models.includes(model)
    ),
  };
}

function bestBySource(sources) {
  const best = new Map();
  sources.forEach((entries, sourceIndex) => {
    for (const entry of entries) {
      const current = best.get(entry.model);
      if (current === undefined || entry.elo > current.elo) {
        best.set(entry.model, { ...entry, sourceIndex });
      }
    }
  });
  return best;
}

/**
 * Re-rank a derived board from its sources.
 *
 * Mirrors `derivedProblems` in `frontier-models.mjs`: each model carries the
 * better of its source Elos (the earlier source wins a tie), only models with
 * an endpoint are listed, and rows run from the best Elo down, then source
 * order, then source rank.
 *
 * @param {object[][]} sources entry lists, in `snapshot.sources` order
 * @param {Record<string, unknown[]>} endpointMap the derived endpoints.json
 * @returns {{ entries: object[], unmapped: string[] }} `unmapped` lists source
 *   models with no endpoint in the map, which a person has to look up
 */
export function deriveEntries(sources, endpointMap, max = MAX_RANKS) {
  const candidates = [...bestBySource(sources).values()];
  const served = (item) => (endpointMap[item.model] ?? []).length > 0;
  const entries = candidates
    .filter(served)
    .sort(
      (a, b) =>
        b.elo - a.elo || a.sourceIndex - b.sourceIndex || a.rank - b.rank
    )
    .slice(0, max)
    .map((item, index) => ({
      rank: index + 1,
      model: item.model,
      creator: item.creator,
      elo: item.elo,
    }));
  return {
    entries,
    unmapped: candidates
      .filter((item) => !served(item))
      .map((item) => item.model),
  };
}
