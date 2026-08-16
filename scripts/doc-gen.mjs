#!/usr/bin/env node
/**
 * Documentation Generator for Apicity Providers
 *
 * Generates README.md files with a collapsible API Reference section
 * sourced from the endpoint walker + endpoint-docs.tsv.
 *
 *   node scripts/doc-gen.mjs              # regenerate every provider README
 *   node scripts/doc-gen.mjs <provider>   # regenerate one provider README
 *   node scripts/doc-gen.mjs --check      # exit 1 if any README is stale
 */

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadProject,
  walkAllEndpoints,
  PROVIDERS,
  TSV_ONLY_PROVIDERS,
} from "./lib/endpoint-walk.mjs";
import {
  displayDotPath,
  resolveEndpointLabels,
} from "./lib/endpoint-labels.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const TSV_PATH = path.join(__dirname, "endpoint-docs.tsv");
const COST_TIERS_TSV_PATH = path.join(__dirname, "endpoint-cost-tiers.tsv");

function loadCostTierMap() {
  const map = new Map();
  if (!fsSync.existsSync(COST_TIERS_TSV_PATH)) return map;
  const text = fsSync.readFileSync(COST_TIERS_TSV_PATH, "utf8");
  const lines = text.split("\n").filter(Boolean);
  for (let i = 1; i < lines.length; i++) {
    const [provider, dotPath, method, tier] = lines[i].split("\t");
    map.set(`${provider}\t${dotPath}\t${method}`, tier);
  }
  return map;
}

// Canonical per-endpoint cost tier (from @apicity/cost via the generated
// scripts/endpoint-cost-tiers.tsv). Surfaced in each endpoint's docs.
const COST_TIER_MAP = loadCostTierMap();

function loadEndpointDocsRows() {
  const rows = [];
  if (!fsSync.existsSync(TSV_PATH)) return rows;
  const text = fsSync.readFileSync(TSV_PATH, "utf8");
  const lines = text.split("\n").filter(Boolean);
  for (let i = 1; i < lines.length; i++) {
    const [provider, dotPath, method, fullUrl, docsUrl] = lines[i].split("\t");
    rows.push({
      provider,
      dotPath,
      method,
      fullUrl,
      docsUrl: docsUrl ?? "",
    });
  }
  return rows;
}

function loadDocsTsv() {
  const byKey = new Map();
  const byDotPath = new Map();
  for (const row of loadEndpointDocsRows()) {
    byKey.set(`${row.provider}\t${row.dotPath}\t${row.method}`, row);
    const dotPathKey = `${row.provider}\t${row.dotPath}`;
    const rows = byDotPath.get(dotPathKey) ?? [];
    rows.push(row);
    byDotPath.set(dotPathKey, rows);
  }
  return { byKey, byDotPath };
}

function cleanTsvValue(value) {
  return value && value !== "?" ? value : null;
}

/**
 * The `scripts/endpoint-docs.tsv` row that documents one rendered block.
 *
 * `label` is the heading the block renders under (from `resolveEndpointLabels`)
 * and is tried first: a row naming the rendered label describes exactly that
 * block. `displayDotPath` stays in the list as the *fallback* that keeps a
 * relabelled stream sibling on its canonical sibling's row while no row names
 * the label itself.
 */
function resolveEndpointDocRow(docs, ep, providerName, label) {
  const displayPath = displayDotPath(providerName, ep);
  const dotPaths = [
    ...new Set([label, displayPath, ep.dotPath].filter(Boolean)),
  ];
  const method = ep.method ?? "?";

  for (const dotPath of dotPaths) {
    const row = docs.byKey.get(`${ep.provider}\t${dotPath}\t${method}`);
    if (row) return row;
  }

  for (const dotPath of dotPaths) {
    const rows = docs.byDotPath.get(`${ep.provider}\t${dotPath}`) ?? [];
    const concreteRows = rows.filter(
      (row) => cleanTsvValue(row.method) || cleanTsvValue(row.fullUrl)
    );
    if (concreteRows.length === 1) return concreteRows[0];
  }

  return null;
}

async function collectEndpointsByProvider() {
  const project = loadProject();
  const byProvider = new Map();
  for await (const ep of walkAllEndpoints(project)) {
    const list = byProvider.get(ep.provider) ?? [];
    list.push(ep);
    byProvider.set(ep.provider, list);
  }
  for (const provider of TSV_ONLY_PROVIDERS) {
    const endpoints = loadEndpointDocsRows()
      .filter((row) => row.provider === provider)
      .map((row) => ({
        ...row,
        file: `packages/provider/${provider}/src/${provider}.ts`,
        factory: resolveFactory(provider),
        fullDotPath: row.dotPath,
        path: row.fullUrl,
      }));
    byProvider.set(provider, endpoints);
  }
  return byProvider;
}

function sectionKey(dotPath) {
  if (!dotPath) return "general";
  const segments = dotPath.split(".");
  for (const seg of segments) {
    if (/^v\d+$/i.test(seg)) continue;
    if (seg === "api") continue;
    return seg;
  }
  return "general";
}

function formatUsageSnippet(providerName, dotPath) {
  const call = dotPath ? `${providerName}.${dotPath}` : providerName;
  if (
    providerName === "google" &&
    dotPath === "v1.publishers.google.models.countTokens"
  ) {
    return [
      `const res = await ${call}(`,
      '  "gemini-2.5-flash",',
      "  {",
      '    contents: [{ role: "user", parts: [{ text: "How does AI work?" }] }],',
      "  }",
      ");",
    ].join("\n");
  }
  if (
    providerName === "google" &&
    dotPath === "v1.publishers.google.models.generateContent"
  ) {
    return [
      `const res = await ${call}(`,
      '  "gemini-2.5-flash",',
      "  {",
      '    contents: [{ role: "user", parts: [{ text: "How does AI work?" }] }],',
      "  }",
      ");",
    ].join("\n");
  }
  if (providerName === "openligadb" && dotPath === "getavailablesports") {
    return `const sports = await ${call}();`;
  }
  if (providerName === "openf1" && dotPath === "token") {
    return [
      `const token = await ${call}({`,
      '  username: "driver@example.com",',
      '  password: "placeholder-password",',
      "});",
    ].join("\n");
  }
  if (providerName === "openligadb" && dotPath === "getavailableleagues") {
    return `const leagues = await ${call}();`;
  }
  if (
    providerName === "openligadb" &&
    dotPath === "getavailableleagues.bySeason"
  ) {
    return `const leagues = await ${call}({ season: 2024 });`;
  }
  if (providerName === "openligadb" && dotPath === "getavailablegroups") {
    return `const groups = await ${call}({ leagueShortcut: "bl1", leagueSeason: 2024 });`;
  }
  if (providerName === "openligadb" && dotPath === "getcurrentgroup") {
    return `const group = await ${call}({ leagueShortcut: "bl1" });`;
  }
  if (providerName === "openligadb" && dotPath === "getlastchangedate") {
    return [
      `const changedAt = await ${call}({`,
      '  leagueShortcut: "bl1",',
      "  leagueSeason: 2024,",
      "  groupOrderId: 1,",
      "});",
    ].join("\n");
  }
  if (providerName === "openligadb" && dotPath === "getresultinfos") {
    return `const resultInfo = await ${call}({ leagueId: 4500 });`;
  }
  if (providerName === "openligadb" && dotPath === "getavailableteams") {
    return `const teams = await ${call}({ leagueShortcut: "bl1", leagueSeason: 2024 });`;
  }
  if (
    providerName === "openligadb" &&
    (dotPath === "getnextmatchbyleagueteam" ||
      dotPath === "getlastmatchbyleagueteam")
  ) {
    return [
      `const match = await ${call}({`,
      "  leagueId: 4500,",
      "  teamId: 40,",
      "});",
    ].join("\n");
  }
  if (
    providerName === "openligadb" &&
    (dotPath === "getnextmatchbyleagueshortcut" ||
      dotPath === "getlastmatchbyleagueshortcut")
  ) {
    return `const match = await ${call}({ leagueShortcut: "bl1" });`;
  }
  if (providerName === "openligadb" && dotPath === "getmatchesbyteam") {
    return [
      `const matches = await ${call}({`,
      '  teamFilterstring: "Bayern",',
      "  weekCountPast: 4,",
      "  weekCountFuture: 2,",
      "});",
    ].join("\n");
  }
  if (providerName === "openligadb" && dotPath === "getmatchesbyteamid") {
    return [
      `const matches = await ${call}({`,
      "  teamId: 40,",
      "  weekCountPast: 4,",
      "  weekCountFuture: 2,",
      "});",
    ].join("\n");
  }
  if (providerName === "elevenlabs" && dotPath === "v1.textToSpeech") {
    return `const res = await ${call}("voice_id", { /* ... */ });`;
  }
  if (providerName === "elevenlabs" && dotPath === "v1.voices") {
    return `const res = await ${call}("voice_id", { /* ... */ });`;
  }
  if (providerName === "elevenlabs" && dotPath === "v1.voices.settings") {
    return `const res = await ${call}("voice_id");`;
  }
  if (providerName === "elevenlabs" && dotPath === "v1.voices.pvc.captcha") {
    return `const res = await ${call}("voice_id", { recording });`;
  }
  if (
    providerName === "elevenlabs" &&
    dotPath === "v1.voices.pvc.captcha.get"
  ) {
    return `const res = await ${call}("voice_id");`;
  }
  if (providerName === "elevenlabs" && dotPath === "v1.voices.pvc.samples") {
    return `const res = await ${call}("voice_id", "sample_id", { /* ... */ });`;
  }
  if (
    providerName === "elevenlabs" &&
    (dotPath === "v1.voices.pvc.samples.delete" ||
      dotPath === "v1.voices.pvc.samples.separateSpeakers" ||
      dotPath === "v1.voices.pvc.samples.waveform")
  ) {
    return `const res = await ${call}("voice_id", "sample_id");`;
  }
  if (
    providerName === "elevenlabs" &&
    dotPath === "v1.voices.pvc.samples.speakers.audio"
  ) {
    return `const res = await ${call}("voice_id", "sample_id", "speaker_id");`;
  }
  if (
    providerName === "elevenlabs" &&
    (dotPath === "v1.voices.pvc.train" ||
      dotPath === "v1.voices.pvc.verification")
  ) {
    return `const res = await ${call}("voice_id", { /* ... */ });`;
  }
  if (providerName === "elevenlabs" && dotPath === "v1.models") {
    return `const res = await ${call}();`;
  }
  if (providerName === "elevenlabs" && dotPath === "docs") {
    return `const res = await ${call}();`;
  }
  if (providerName === "elevenlabs" && dotPath === "v1.user.subscription") {
    return `const res = await ${call}();`;
  }
  if (
    providerName === "openligadb" &&
    (dotPath === "getbltable" || dotPath === "getgrouptable")
  ) {
    return [
      `const res = await ${call}({`,
      '  leagueShortcut: "bl1",',
      "  leagueSeason: 2024,",
      "});",
    ].join("\n");
  }
  if (providerName === "openligadb" && dotPath === "getgoalgetters") {
    return [
      `const res = await ${call}({`,
      '  leagueShortcut: "bl1",',
      "  leagueSeason: 2024,",
      "});",
    ].join("\n");
  }
  if (providerName === "simplefunctions" && dotPath === "api.public.query") {
    return [
      `const res = await ${call}({`,
      '  q: "Fed rate cut",',
      '  sources: ["kalshi", "polymarket"],',
      "  limit: 3,",
      "});",
    ].join("\n");
  }
  if (providerName === "simplefunctions" && dotPath === "data.v1.heartbeat") {
    return `const res = await ${call}();`;
  }
  if (providerName === "simplefunctions" && dotPath === "data.v1.markets") {
    return [
      `const res = await ${call}({`,
      '  q: "newsom",',
      '  venue: "kalshi",',
      "});",
    ].join("\n");
  }
  if (
    providerName === "simplefunctions" &&
    dotPath === "data.v1.markets.featured"
  ) {
    return `const res = await ${call}({ n: 50 });`;
  }
  if (
    providerName === "simplefunctions" &&
    dotPath === "data.v1.markets.retrieve"
  ) {
    return `const res = await ${call}("KXPRESNOMD-28-GN");`;
  }
  if (providerName === "simplefunctions" && dotPath === "data.v1.search") {
    return [
      `const res = await ${call}({`,
      '  q: "rate cut",',
      "  limit: 10,",
      '  venue: "kalshi",',
      "});",
    ].join("\n");
  }
  if (providerName === "simplefunctions" && dotPath === "data.v1.snapshot") {
    return `const res = await ${call}();`;
  }
  if (providerName === "simplefunctions" && dotPath === "data.v1.movers") {
    return [
      `const res = await ${call}({`,
      '  window: "1h",',
      "  n: 50,",
      "  minVol: 1000,",
      '  dir: "both",',
      "});",
    ].join("\n");
  }
  if (providerName === "simplefunctions" && dotPath === "data.v1.orderbook") {
    return `const res = await ${call}("KXPRESNOMD-28-GN");`;
  }
  if (providerName === "simplefunctions" && dotPath === "data.v1.candles") {
    return [
      `const res = await ${call}("KXPRESNOMD-28-GN", {`,
      '  tf: "1h",',
      "  limit: 500,",
      "});",
    ].join("\n");
  }
  if (providerName === "simplefunctions" && dotPath === "data.v1.trades") {
    return `const res = await ${call}("KXPRESNOMD-28-GN", { limit: 50 });`;
  }
  if (providerName === "openligadb" && dotPath === "swagger.v1.swaggerJson") {
    return `const res = await ${call}();`;
  }
  if (providerName === "openligadb" && dotPath === "getmatchdata.byId") {
    return `const res = await ${call}({ matchId: 68720 });`;
  }
  if (
    providerName === "openligadb" &&
    dotPath === "getmatchdata.byLeagueSeason"
  ) {
    return [
      `const res = await ${call}({`,
      '  leagueShortcut: "bl1",',
      "  leagueSeason: 2024,",
      "});",
    ].join("\n");
  }
  if (
    providerName === "openligadb" &&
    dotPath === "getmatchdata.byLeagueSeasonGroup"
  ) {
    return [
      `const res = await ${call}({`,
      '  leagueShortcut: "bl1",',
      "  leagueSeason: 2024,",
      "  groupOrderId: 1,",
      "});",
    ].join("\n");
  }
  if (
    providerName === "openligadb" &&
    dotPath === "getmatchdata.byLeagueSeasonTeam"
  ) {
    return [
      `const res = await ${call}({`,
      '  leagueShortcut: "bl1",',
      "  leagueSeason: 2024,",
      '  teamFilterstring: "Bayern",',
      "});",
    ].join("\n");
  }
  if (providerName === "openligadb" && dotPath === "getmatchdata.byTeams") {
    return `const res = await ${call}({ teamId1: 16, teamId2: 40 });`;
  }
  if (providerName === "simplefunctions" && dotPath === "api.public.market") {
    return [
      `const res = await ${call}({`,
      '  ticker: "KXRATECUT-26DEC31",',
      "  depth: true,",
      "});",
    ].join("\n");
  }
  if (
    providerName === "simplefunctions" &&
    dotPath === "api.public.market.history"
  ) {
    return [
      `const res = await ${call}({`,
      '  ticker: "KXRATECUT-26DEC31",',
      "});",
    ].join("\n");
  }
  if (
    providerName === "simplefunctions" &&
    dotPath === "api.public.market.candles"
  ) {
    return [
      `const res = await ${call}({`,
      '  ticker: "KXRATECUT-26DEC31",',
      '  venue: "kalshi",',
      '  timeframe: "1m",',
      "  limit: 500,",
      "});",
    ].join("\n");
  }
  return `const res = await ${call}({ /* ... */ });`;
}

const ENDPOINT_NOTES = new Map([
  [
    "polymarket\tclob.markets\tGET",
    [
      "> **Legacy compatibility:** current public market discovery is documented",
      "on the Gamma `/markets` pages. The CLOB `/markets` compatibility path",
      "is retained for existing callers and is documented by the CLOB OpenAPI",
      "spec.",
    ].join(" "),
  ],
  [
    "polymarket\tgamma.events\tGET",
    [
      "> **Deprecated upstream:** the replay fixture for the list form",
      "`GET /events?...` returned `Deprecation: true`,",
      "`Sunset: Fri, 01 May 2026 00:00:00 GMT`, and",
      '`Warning: 299 - "use /events/keyset"`. This compatibility method',
      "remains for existing bare-array `/events` callers; prefer",
      "`polymarket.gamma.events.keyset()` for new paginated event lists.",
    ].join(" "),
  ],
]);

const PROVIDER_NOTES = new Map([
  [
    "binance",
    [
      "Binance coverage is focused on public REST market-data reads across",
      "Spot, USD-M Futures, COIN-M Futures, and Options.",
      "The COIN-M Old Trades Lookup endpoint (`GET /dapi/v1/historicalTrades`) is intentionally not exposed because Binance requires an API key for it.",
      "USD-M Old Trades Lookup (`GET /fapi/v1/historicalTrades`), signed trade, account, and user endpoints are out of scope.",
    ].join(" "),
  ],
  [
    "simplefunctions",
    [
      "SimpleFunctions exposes two REST surfaces here: analytical Query API",
      "calls use `https://simplefunctions.dev`, while real-time market-data",
      "calls under `simplefunctions.data.v1.*` use the separate",
      "`https://data.simplefunctions.dev/v1` data API base URL.",
      "Authenticated dashboard, thesis, portfolio, alerting, tool, and runtime",
      "routes also live under `simplefunctions.api.*` on the analytical host.",
      "`simplefunctions.api.public.market({ ticker })` mirrors",
      "`sf inspect <ticker> --json`; pass `depth: true` for the public",
      "orderbook view used by `sf book <ticker> --json`.",
      "The current public WebSocket endpoint is `wss://app.simplefunctions.dev/ws`;",
      "do not model `wss://data.simplefunctions.dev/v1/ws` as active until",
      "upstream routing changes.",
    ].join(" "),
  ],
  [
    "openligadb",
    [
      "OpenLigaDB is a public read-only API. `createOpenLigaDB()` does not",
      "take credentials, and the provider does not send auth headers.",
    ].join(" "),
  ],
]);

function renderBinancePublicDataGuide() {
  return [
    "## Public Market Data",
    "",
    "`createBinance()` works without credentials for the public market-data",
    "surface. Pass `apiKey` only when you intentionally call a Binance",
    "endpoint that is documented as API-key or `MARKET_DATA`; signed trade,",
    "account, and user-data-stream endpoints are not exposed by this package.",
    "",
    "| Surface | Namespace | Default host | Auth |",
    "|---------|-----------|--------------|------|",
    "| Spot REST | `binance.api.v3.*` | `https://api.binance.com` | No key for public market data; optional `apiKey` header when supplied |",
    "| Spot market-data-only REST | `binance.api.v3.*` with `spotBaseURL` | `https://data-api.binance.vision` | No key |",
    "| USD-M Futures | `binance.fapi.v1.*`, `binance.fapi.v2.*`, `binance.futures.data.*` | `https://fapi.binance.com` | No key for exposed endpoints |",
    "| COIN-M Futures | `binance.dapi.v1.*`, `binance.coinMFutures.data.*` | `https://dapi.binance.com` | No key for exposed endpoints |",
    "| Options | `binance.eapi.v1.*` | `https://eapi.binance.com` | No key for exposed endpoints |",
    "",
    "To send existing Spot public calls to Binance's market-data-only host,",
    "override the Spot base URL. This keeps the same `api.v3` method paths",
    "while changing the host:",
    "",
    "```typescript",
    "const binance = createBinance({",
    '  spotBaseURL: "https://data-api.binance.vision",',
    "});",
    "",
    "const exchangeInfo = await binance.api.v3.exchangeInfo({",
    '  symbol: "BTCUSDT",',
    "  showPermissionSets: false,",
    "});",
    "```",
    "",
    "You can also configure every public host explicitly:",
    "",
    "```typescript",
    "const binance = createBinance({",
    "  publicBaseURLs: {",
    '    spot: "https://data-api.binance.vision",',
    '    spotData: "https://data-api.binance.vision",',
    '    fapi: "https://fapi.binance.com",',
    '    dapi: "https://dapi.binance.com",',
    '    eapi: "https://eapi.binance.com",',
    "  },",
    "});",
    "```",
    "",
    "`binance.public.*` contains explicit no-auth smoke aliases for each",
    "public surface, and `binance.public.coinMFutures.*` mirrors the COIN-M",
    "public REST tree. Use the top-level namespaces above for the full",
    "implemented market-data surface.",
    "",
    "The `https://data.binance.vision` static archive serves public ZIP and",
    "checksum files for historical Spot, USD-M, and COIN-M datasets. It is",
    "intentionally outside this JSON REST provider; archive downloads need",
    "separate binary/checksum handling and tests.",
    "",
  ].join("\n");
}

function renderSimpleFunctionsPublicMarketGuide() {
  return [
    "## Public Market APIs",
    "",
    "`simplefunctions.api.public.*` mirrors the hosted `/api/public/*`",
    "surface on `https://simplefunctions.dev`. Most basic reads work without",
    "an API key. Passing `createSimpleFunctions({ apiKey })` adds the",
    "`Authorization: Bearer ...` header and may unlock higher rate limits,",
    "higher model tiers, or user-specific overlays on routes that support",
    "them.",
    "",
    "Most public routes are CDN cached with `Cache-Control: public,",
    "s-maxage=N`; route TTLs vary. Common TTLs are: markets, scan, and",
    "screen at 60 seconds; query, query-gov, and query-econ at 5-10 minutes",
    "in memory plus 5 minute CDN stale-while-revalidate; index and regime at",
    "30 seconds; legislation and congress members at 1 hour ISR.",
    "",
    "| Group | Methods | Purpose |",
    "|-------|---------|---------|",
    "| Markets | `markets`, `newmarkets`, `scan`, `screen`, `screenByTickers`, `search`, `market`, `market.history`, `marketMicrostructureHistory`, `liveTickers`, `market.candles` | Market universe, recently listed markets, keyword/series/market scans, indicator screens, explicit ticker screens, search, detail, history, spread/depth/flow history, live-priced tickers, and OHLCV candles. |",
    "| Cross-venue | `crossVenue.pairs`, `crossVenue.stats` | Kalshi to Polymarket pairs, pair counts, and confidence distribution. |",
    "| Regime and index | `regime.scan`, `index`, `index.history`, `calibration` | Current regime labels, SimpleFunctions Index v2 gauges, index history, and calibration. |",
    "| Probability index | `odds`, `oddsMd` | Liquidity-weighted YES probability snapshot for the `/odds` page, refreshed every 15 minutes; `oddsMd` is the Markdown variant for agents, capped at 500 slugs upstream. |",
    "| Calendar and milestones | `calendar`, `yieldCurves`, `yieldCurves.event` | Upcoming resolutions and event yield curves. |",
    "| Liquidity and contagion | `liquidityByTheme`, `contagion` | Liquidity grouped by theme and lagging related markets. |",
    "| Government data | `queryGov`, `legislation`, `legislation.byBillId`, `congress.members`, `congress.member` | Congress-mirror-backed bill, member, and treaty search plus bill/member detail. |",
    "| Economic data | `queryEcon`, `fred`, `databento`, `tradMarkets` | FRED-mirror-backed series search, FRED details, Databento traditional markets, and traditional market anchors. |",
    "| Content | `query`, `topic`, `answer`, `glossary`, `glossary.entry`, `guide`, `highlights`, `briefing`, `diff`, `discuss` | Headline cross-venue search, topic and stable answer data, glossary, agent guide, editorial highlights, briefing, daily diff, and discussion topics. |",
    "| Skills | `skills`, `skill` | Public skill catalog and one skill by slug. |",
    "| Theses and opinions | `theses`, `thesis`, `opinions`, `opinions.entry` | Public theses and editorial opinions. |",
    "| Technicals | `technicals`, `technicals.entry` | Technical guides and one guide by slug. |",
    "| Ideas | `ideas`, `ideas.byId` | Trade ideas and one idea by id. |",
    "| Context | `context` | Global market context without thesis payloads. |",
    "",
    "### Market candles",
    "",
    "`simplefunctions.api.public.market.candles` is the hosted API mapping for",
    "the strict `market.candles` SDK/Agent contract. The Vercel API route",
    "proxies to the terminal/Fly candle service and normalizes the response",
    "for SDK consumers.",
    "",
    "```typescript",
    "const candles = await simplefunctions.api.public.market.candles({",
    '  ticker: "KXRATECUT-26DEC31",',
    '  venue: "kalshi",',
    '  timeframe: "1m",',
    "  limit: 500,",
    "});",
    "```",
    "",
    "| Parameter | Values | Notes |",
    "|-----------|--------|-------|",
    "| `venue` | `kalshi`, `polymarket` | Optional. Use it when the ticker or id is ambiguous. |",
    "| `timeframe` / `tf` | `1m`, `5m`, `15m`, `1h`, `1d` | Default is `1m`. |",
    "| `limit` | number | Default is 500, max is 2000 upstream. |",
    "",
    "The probability index routes accept `category`, `band`, and `limit`.",
    "`band` can be `mid` for probabilities near 50% or `moving` for recently",
    "shifted questions.",
    "",
    "`GET /api/public/regime/history` is deprecated and returns `410 Gone`.",
    "Use `regime.scan` for current regime labels and",
    "`marketMicrostructureHistory` for spread/depth history.",
    "",
  ].join("\n");
}

function renderTheSportsDBAuthGuide() {
  return [
    "## V2 Authentication",
    "",
    "V1 calls default to TheSportsDB's free `123` key in the URL path when",
    "`apiKey` is omitted. V2 is premium-only and sends the same `apiKey` in",
    "the `X-API-KEY` header; V2 methods throw locally if no key is configured.",
    "",
    "```typescript",
    "const thesportsdb = createTheSportsDB({",
    "  apiKey: process.env.THESPORTSDB_API_KEY!,",
    "});",
    "",
    "const teams = await thesportsdb.v2.search.team({",
    '  teamName: "Manchester United",',
    "});",
    "```",
    "",
    "For V1 premium calls, the same `apiKey` option is encoded into the",
    "path segment instead of a header:",
    "",
    "```typescript",
    "const premiumV1 = createTheSportsDB({",
    "  apiKey: process.env.THESPORTSDB_API_KEY!,",
    "});",
    "",
    "const broadcasts = await premiumV1.v1.eventstv({",
    '  channel: "Peacock_Premium",',
    "});",
    "```",
    "",
  ].join("\n");
}

function renderTheSportsDBOperationalNotes() {
  return [
    "## Operational Notes",
    "",
    "All implemented TheSportsDB endpoints are read-only `GET` calls. The",
    "provider does not expose mutating endpoints.",
    "",
    "The implemented API surface has no pagination parameters. Upstream",
    "responses use endpoint-specific wrapper arrays and documented result",
    "limits; empty and no-result wrappers remain representable as `null` or",
    "empty arrays.",
    "",
    "Non-2xx responses throw `TheSportsDBError` with `status` and parsed",
    "`body` where possible. Rate-limit responses keep their upstream `429`",
    "status and body. V2 methods throw a local `401` before fetch when no",
    "`apiKey` is configured for `X-API-KEY` authentication.",
    "",
  ].join("\n");
}

function renderSimpleFunctionsAuthenticatedGuide() {
  return [
    "## Authenticated APIs",
    "",
    "Passing `createSimpleFunctions({ apiKey })` adds",
    "`Authorization: Bearer ...` to authenticated dashboard, thesis,",
    "portfolio, alerting, tool, and runtime routes. The CLI-auth and",
    "session-oriented Market Watch routes can also be called with a custom",
    "`fetch` implementation that supplies browser/session cookies instead of",
    "a local API key.",
    "",
    "| Group | Methods | Purpose |",
    "|-------|---------|---------|",
    "| API keys and auth | `api.keys`, `api.keys.create`, `api.keys.delete`, `api.auth.cli.*`, `api.signup` | API-key lifecycle, CLI login handshakes, and signup. |",
    "| Account | `api.feed`, `api.dashboard.usage` | Authenticated feed and usage telemetry. |",
    "| Theses | `api.thesis.*` | Create, retrieve, update, fork, evaluate, augment, publish, and attach positions, strategies, videos, or context to private theses. |",
    "| Portfolio | `api.portfolio.*` | Portfolio state, config, ticks, trades, ledger imports, fills, positions, activity, attribution, risk, views, strategy, secrets, and triggers. |",
    "| Execution | `api.intents.*`, `api.runtime.exec.*` | Execution-intent lifecycle and runtime execution triggers. |",
    "| Watch and alerts | `api.watch.*`, `api.alertRules.*`, `api.webhookEndpoints.*`, `api.alertDeliveries.*` | Watch objects, alert rules, webhook endpoints, delivery history, and test/refresh actions. |",
    "| Tools | `api.contracts.tools`, `api.tools`, `api.skills`, `api.prompt`, `api.mcp.*`, `api.proxy.*` | Tool catalogs, prompt payloads, MCP transport, and raw speech proxy responses. |",
    "| Market Watch | `api.dashboard2.marketWatchV2`, `api.dashboard2.marketWatch.panels.*` | Session-backed Market Watch dashboard reads and panel CRUD. |",
    "",
  ].join("\n");
}

function renderEndpointDetails(ep, providerName, docsUrl, tier, dotPath) {
  const method = ep.method ?? "";
  const headerCode = method ? `<code>${method}</code> ` : "";
  const summary = `${headerCode}<b><code>${providerName}${dotPath ? "." + dotPath : ""}</code></b>`;

  const urlLine = ep.fullUrl
    ? `<code>${method ? method + " " : ""}${ep.fullUrl}</code>`
    : "";
  const tierLine = tier ? `Cost tier: <code>${tier}</code>` : "";
  const docsLine =
    docsUrl && docsUrl.length > 0 ? `[Upstream docs ↗](${docsUrl})` : "";
  const noteLine =
    ENDPOINT_NOTES.get(`${providerName}\t${dotPath}\t${method}`) ?? "";

  const usage = formatUsageSnippet(providerName, dotPath);
  const relSrc = ep.file.replace(
    new RegExp(`^packages/provider/${providerName}/`),
    ""
  );
  const sourceLine = `Source: [\`${ep.file}\`](${relSrc})`;

  const lines = ["<details>", `<summary>${summary}</summary>`, ""];
  if (urlLine) lines.push(urlLine, "");
  if (tierLine) lines.push(tierLine, "");
  if (docsLine) lines.push(docsLine, "");
  if (noteLine) lines.push(noteLine, "");
  lines.push("```typescript", usage, "```", "");
  lines.push(sourceLine, "", "</details>", "");
  return lines.join("\n");
}

function groupEndpoints(endpoints) {
  const groups = new Map();
  for (const ep of endpoints) {
    const key = sectionKey(ep.dotPath);
    const list = groups.get(key) ?? [];
    list.push(ep);
    groups.set(key, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => {
      const aPath = a.fullDotPath ?? a.dotPath ?? "";
      const bPath = b.fullDotPath ?? b.dotPath ?? "";
      if (aPath !== bPath) return aPath < bPath ? -1 : 1;
      return (a.method ?? "").localeCompare(b.method ?? "");
    });
  }
  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export function renderApiReference(providerName, endpoints) {
  const sections = ["## API Reference", ""];
  // Verb aliases of one path collapse to a single block; genuinely distinct
  // siblings (stream variants) keep a block each under a distinct label.
  const { labels, rendered } = resolveEndpointLabels(providerName, endpoints);
  if (rendered.length === 0) {
    sections.push("_No endpoints discovered for this provider yet._", "");
    return { text: sections.join("\n"), renderedCount: 0 };
  }

  const groups = groupEndpoints(rendered);
  sections.push(
    `${rendered.length} endpoint${rendered.length === 1 ? "" : "s"} across ${groups.size} group${groups.size === 1 ? "" : "s"}. Each method mirrors an upstream URL path.`,
    ""
  );

  const docs = loadDocsTsv();
  for (const [group, list] of groups) {
    sections.push(`### ${group}`, "");
    for (const ep of list) {
      const label = labels.get(ep);
      const docRow = resolveEndpointDocRow(docs, ep, providerName, label);
      const enrichedEndpoint = docRow
        ? {
            ...ep,
            method: ep.method ?? cleanTsvValue(docRow.method),
            fullUrl: ep.fullUrl ?? cleanTsvValue(docRow.fullUrl),
          }
        : ep;
      const tierKey = `${providerName}\t${
        docRow?.dotPath ??
        enrichedEndpoint.fullDotPath ??
        enrichedEndpoint.dotPath
      }\t${docRow?.method ?? enrichedEndpoint.method ?? ""}`;
      const tier = COST_TIER_MAP.get(tierKey) ?? "prohibitive";
      sections.push(
        renderEndpointDetails(
          enrichedEndpoint,
          providerName,
          docRow?.docsUrl ?? "",
          tier,
          label
        )
      );
    }
  }
  return { text: sections.join("\n"), renderedCount: rendered.length };
}

async function extractProviderMetadata(providerDir) {
  const pkgPath = path.join(providerDir, "package.json");
  let pkg = {};
  try {
    pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
  } catch {
    // Ignore
  }
  return { pkg };
}

function renderXaiRateLimiting() {
  return [
    "## Rate Limiting",
    "",
    "Client-side rate limiting that queues requests to stay within xAI API limits.",
    "",
    "```typescript",
    "import {",
    "  createXai,",
    "  withRateLimit,",
    "  withRetry,",
    "  createRateLimiter,",
    "  XAI_RATE_LIMITS,",
    '} from "@apicity/xai";',
    "",
    "const xai = createXai({ apiKey: process.env.XAI_API_KEY! });",
    "```",
    "",
    "### Using xAI tier presets",
    "",
    "```typescript",
    "// Use built-in tier presets (free, tier1, tier2, tier3, tier4)",
    "const limiter = createRateLimiter(XAI_RATE_LIMITS.tier1);",
    "// => { rpm: 60, concurrent: 10 }",
    "",
    "const chat = withRateLimit(xai.post.v1.chat.completions, limiter);",
    "```",
    "",
    "### Custom limits",
    "",
    "```typescript",
    "const limiter = createRateLimiter({ rpm: 30, concurrent: 5 });",
    "const chat = withRateLimit(xai.post.v1.chat.completions, limiter);",
    "```",
    "",
    "### Shared limiter across endpoints",
    "",
    "RPM limits apply globally, so share a single limiter across all endpoints:",
    "",
    "```typescript",
    "const limiter = createRateLimiter(XAI_RATE_LIMITS.tier2);",
    "",
    "const chat = withRateLimit(xai.post.v1.chat.completions, limiter);",
    "const responses = withRateLimit(xai.post.v1.responses, limiter);",
    "const images = withRateLimit(xai.post.v1.images.generations, limiter);",
    "```",
    "",
    "### Composing with retry",
    "",
    "Place `withRateLimit` innermost so retries count against the limit:",
    "",
    "```typescript",
    "const limiter = createRateLimiter(XAI_RATE_LIMITS.tier1);",
    "",
    "const chat = withRetry(",
    "  withRateLimit(xai.post.v1.chat.completions, limiter),",
    "  { retries: 2 }",
    ");",
    "```",
    "",
    "### Batch processing",
    "",
    "Fire requests in parallel — the limiter handles pacing automatically:",
    "",
    "```typescript",
    "const limiter = createRateLimiter(XAI_RATE_LIMITS.tier1);",
    "const chat = withRateLimit(xai.post.v1.chat.completions, limiter);",
    "",
    "const results = await Promise.all(",
    "  prompts.map((p) =>",
    "    chat({",
    '      model: "grok-3",',
    '      messages: [{ role: "user", content: p }],',
    "    })",
    "  )",
    ");",
    "```",
    "",
    "### xAI rate limit tiers",
    "",
    "| Preset | RPM | Concurrent | Spend threshold |",
    "|--------|-----|------------|-----------------|",
    "| `free` | 5 | 2 | $0 |",
    "| `tier1` | 60 | 10 | $0+ |",
    "| `tier2` | 200 | 25 | $100+ |",
    "| `tier3` | 500 | 50 | $500+ |",
    "| `tier4` | 1000 | 100 | $1,000+ |",
    "",
  ].join("\n");
}

function renderXSetup() {
  return [
    "## Setup",
    "",
    "X requires an **OAuth 2.0 user-context access token** to post or upload",
    "media. App-only Bearer tokens are read-only and rejected by the upload",
    "and tweets endpoints.",
    "",
    "### 1. Configure your X app",
    "",
    "Open [console.x.com](https://console.x.com) and make sure your app lives",
    "in a **Pay Per Use** project — the legacy *Free* project is deprecated",
    "and v2 endpoints reject its tokens with `client-not-enrolled`. Move the",
    "app from the Apps list if needed.",
    "",
    "Then open the app and click **User authentication settings → Set up**:",
    "",
    "- Type of App: **Web App, Automated App or Bot** (this yields a Client Secret)",
    "- App permissions: **Read and write**",
    "- Callback URI: `http://127.0.0.1:8765/callback`",
    "- Website URL: any valid URL",
    "",
    "Save and copy the **OAuth 2.0 Client ID** and **Client Secret**.",
    "",
    "### 2. Load credits",
    "",
    "Pay-per-use bills per write (~$0.015 / post). Open **Billing → Credits**",
    "and load the minimum (typically $5). Without credits, write endpoints",
    "return `402 Your enrolled account does not have any credits to fulfill",
    "this request` — even though authentication itself succeeds.",
    "",
    "### 3. Mint an access token",
    "",
    "Save the script below as `mint-x-token.mjs` and run it:",
    "",
    "```bash",
    "X_CLIENT_ID=<your-client-id> \\",
    "X_CLIENT_SECRET=<your-client-secret> \\",
    "  node mint-x-token.mjs",
    "```",
    "",
    "It prints an authorize URL — open it, click **Authorize app**, and the",
    "helper captures the redirect on `127.0.0.1:8765` and prints the access",
    "token + refresh token. Access tokens last 2 hours; the refresh token",
    "(via `offline.access` scope) lets you mint a new one without",
    "re-authorizing.",
    "",
    "<details>",
    "<summary><code>mint-x-token.mjs</code> — OAuth 2.0 PKCE helper</summary>",
    "",
    "```javascript",
    'import http from "node:http";',
    'import crypto from "node:crypto";',
    'import { createXOAuth } from "@apicity/x";',
    "",
    "const CLIENT_ID = process.env.X_CLIENT_ID;",
    "const CLIENT_SECRET = process.env.X_CLIENT_SECRET;",
    'const REDIRECT = "http://127.0.0.1:8765/callback";',
    "const SCOPES = [",
    '  "tweet.read",',
    '  "tweet.write",',
    '  "media.write",',
    '  "users.read",',
    '  "offline.access",',
    '].join(" ");',
    "",
    "if (!CLIENT_ID || !CLIENT_SECRET) {",
    '  console.error("Set X_CLIENT_ID and X_CLIENT_SECRET");',
    "  process.exit(1);",
    "}",
    "",
    'const verifier = crypto.randomBytes(32).toString("base64url");',
    "const challenge = crypto",
    '  .createHash("sha256")',
    "  .update(verifier)",
    '  .digest("base64url");',
    'const state = crypto.randomBytes(16).toString("hex");',
    "",
    'const authURL = new URL("https://x.com/i/oauth2/authorize");',
    'authURL.searchParams.set("response_type", "code");',
    'authURL.searchParams.set("client_id", CLIENT_ID);',
    'authURL.searchParams.set("redirect_uri", REDIRECT);',
    'authURL.searchParams.set("scope", SCOPES);',
    'authURL.searchParams.set("state", state);',
    'authURL.searchParams.set("code_challenge", challenge);',
    'authURL.searchParams.set("code_challenge_method", "S256");',
    "",
    'console.log("Open this URL and click \\"Authorize app\\":\\n" + authURL.toString());',
    "",
    "const server = http.createServer(async (req, res) => {",
    "  const url = new URL(req.url, REDIRECT);",
    '  if (!url.pathname.startsWith("/callback")) {',
    "    res.writeHead(404).end();",
    "    return;",
    "  }",
    '  const code = url.searchParams.get("code");',
    '  if (!code || url.searchParams.get("state") !== state) {',
    '    res.writeHead(400).end("bad state");',
    "    server.close();",
    "    process.exit(1);",
    "  }",
    "  const oauth = createXOAuth({",
    "    clientId: CLIENT_ID,",
    "    clientSecret: CLIENT_SECRET,",
    "  });",
    "  const tok = await oauth.post.v2.oauth2.token({",
    '    grant_type: "authorization_code",',
    "    code,",
    "    redirect_uri: REDIRECT,",
    "    code_verifier: verifier,",
    "  });",
    "  console.log(JSON.stringify(tok, null, 2));",
    '  res.writeHead(200).end("Authorized — check your terminal.");',
    "  server.close();",
    "});",
    "",
    'server.listen(8765, "127.0.0.1");',
    "```",
    "",
    "</details>",
    "",
    "### 4. Use the token",
    "",
    "```typescript",
    'import { createX } from "@apicity/x";',
    "",
    "const x = createX({ accessToken: process.env.X_ACCESS_TOKEN });",
    "",
    "await x.post.v2.tweets({",
    '  text: "hello from @apicity/x",',
    "});",
    "```",
    "",
    "### 5. Refresh the token",
    "",
    "Access tokens expire after 2 hours. Use `createXOAuth` with the refresh",
    "token from step 3 to mint a fresh one without re-authorizing. Refresh",
    "tokens may rotate — persist `refresh_token` from the response when X",
    "returns one, and keep the old one when it's omitted.",
    "",
    "```typescript",
    'import { createXOAuth } from "@apicity/x";',
    "",
    "const oauth = createXOAuth({",
    "  clientId: process.env.X_CLIENT_ID!,",
    "  clientSecret: process.env.X_CLIENT_SECRET!,",
    "});",
    "",
    "const tok = await oauth.post.v2.oauth2.token({",
    '  grant_type: "refresh_token",',
    "  refresh_token: storedRefreshToken,",
    "});",
    "```",
    "",
  ].join("\n");
}

// Mined from tests/recordings/x_*/post-video_*/recording.har — the same
// flow that tests/integration/x-post-video.test.ts replays end-to-end.
function renderXExample() {
  return [
    "## Real-world example: post a video",
    "",
    "Posting a video on X is a four-call dance — initialize a chunked",
    "media upload, append the bytes, finalize to kick off transcoding,",
    "poll until the media is ready, then attach the resulting `media_id`",
    "to the tweet. The flow below is taken verbatim from",
    "[`tests/integration/x-post-video.test.ts`](../../../tests/integration/x-post-video.test.ts)",
    "and replays against",
    "[`tests/recordings/x_*/post-video_*/recording.har`](../../../tests/recordings/),",
    "so the response shapes match what X actually returns.",
    "",
    "```typescript",
    'import { readFileSync } from "node:fs";',
    'import { createX } from "@apicity/x";',
    "",
    "const x = createX({ accessToken: process.env.X_ACCESS_TOKEN! });",
    "",
    "// 1. Initialize a chunked upload — declare the media type, total",
    "//    byte length, and category up-front. X reserves a media_id we'll",
    "//    thread through every later call.",
    'const bytes = readFileSync("./jump.mp4"); // 1,318,021 bytes in the recording',
    "const init = await x.post.v2.media.upload.initialize({",
    '  media_type: "video/mp4",',
    "  total_bytes: bytes.length,",
    '  media_category: "tweet_video",',
    "});",
    "const mediaId = init.data.id;",
    '// → "2050123807214718976"',
    "",
    "// 2. Append the bytes. For files >5MB slice the buffer into",
    "//    segments and call append once per chunk with segment_index 0..n.",
    "await x.post.v2.media.upload.append(mediaId, {",
    '  media: new Blob([bytes], { type: "video/mp4" }),',
    "  segment_index: 0,",
    "});",
    "",
    "// 3. Finalize. X queues server-side transcoding and returns",
    '//    processing_info.state = "pending" while the worker is busy.',
    "const fin = await x.post.v2.media.upload.finalize(mediaId);",
    '// fin.data.processing_info → { state: "pending", check_after_secs: 1 }',
    "",
    "// 4. Poll status until the media is ready. Honor",
    "//    `check_after_secs` so the loop respects X's pacing hint.",
    'let state = fin.data.processing_info?.state ?? "succeeded";',
    "let wait = fin.data.processing_info?.check_after_secs ?? 1;",
    'while (state === "pending" || state === "in_progress") {',
    "  await new Promise((r) => setTimeout(r, wait * 1000));",
    "  const status = await x.get.v2.media.upload(mediaId);",
    '  state = status.data.processing_info?.state ?? "succeeded";',
    "  wait = status.data.processing_info?.check_after_secs ?? 1;",
    "}",
    '// status.data.processing_info → { state: "succeeded", progress_percent: 100 }',
    "",
    "// 5. Post the tweet, attaching the now-ready media id.",
    "const tweet = await x.post.v2.tweets({",
    '  text: "jump",',
    "  media: { media_ids: [mediaId] },",
    "});",
    "",
    "console.log(tweet.data.id);",
    '// → "2050123819986378933"',
    "console.log(tweet.data.text);",
    '// → "jump https://t.co/X8cTIpcy3s"',
    "//   X auto-appends the attached media's t.co URL to the returned",
    '//   text — the literal request body just had "jump".',
    "```",
    "",
    "**Notes**",
    "",
    "- `media_category` must match the asset: `tweet_video`, `tweet_image`,",
    "  `tweet_gif`, or `amplify_video` for long-form. Mismatches are rejected",
    "  at finalize, not initialize.",
    "- Uploads expire after `data.expires_after_secs` (24h). If you finalize",
    "  but never reference the `media_id` in a tweet, it is garbage-collected.",
    "- Errors from any step throw `XError` with `status` and the parsed body",
    "  attached, so `try { ... } catch (e) { if (e instanceof XError) ... }`",
    "  gives you the upstream `errors[0].message` or `detail` directly.",
    "",
  ].join("\n");
}

// Mined from tests/recordings/xai_3613880225/vision-analysis-json_243984103/
// recording.har — the same call that tests/integration/xai-vision-json.test.ts
// replays end-to-end.
function renderXaiExample() {
  return [
    "## Real-world example: structured vision analysis with Grok-4",
    "",
    "Hand Grok-4 a portrait, a system prompt that nails down the output schema,",
    'and `text.format.type: "json_object"` — get back a reproduction-ready',
    "JSON description with deterministic shot/pose vocabulary. The flow below",
    "is taken verbatim from",
    "[`tests/integration/xai-vision-json.test.ts`](../../../tests/integration/xai-vision-json.test.ts)",
    "and replays against",
    "[`tests/recordings/xai_3613880225/vision-analysis-json_243984103/recording.har`](../../../tests/recordings/xai_3613880225/vision-analysis-json_243984103/recording.har),",
    "so the response shapes match what xAI actually returns.",
    "",
    "```typescript",
    'import { readFile } from "node:fs/promises";',
    'import { createXai } from "@apicity/xai";',
    "",
    "const xai = createXai({ apiKey: process.env.XAI_API_KEY! });",
    "",
    "// 1. Load the image and inline it as a data URL. xAI also accepts",
    "//    https:// URLs, but inlining keeps the call self-contained and",
    "//    works against private hosts.",
    'const image = await readFile("./portrait.jpg");',
    'const base64 = image.toString("base64");',
    "",
    "// 2. The system prompt enumerates the legal vocabulary for `shot` and",
    "//    constrains `pose` to body geometry only. Combined with",
    '//    `text.format.type: "json_object"` this gives Grok no room to drift',
    "//    off-schema — temperature 0 keeps the result reproducible.",
    "const SYSTEM_PROMPT = [",
    '  "You are an expert image-to-prompt analyst.",',
    '  "Return only a JSON object with keys prompt, shot, and pose.",',
    '  "prompt: a single-paragraph reproduction-ready image prompt, 1900 characters or fewer, with no line breaks.",',
    "  'shot: exactly \"<size>, <angle>\" where size is one of extreme close-up, close-up, medium close-up, medium shot, medium long shot, long shot, or extreme long shot, and angle is one of eye-level, low-angle, high-angle, overhead, or dutch.',",
    '  "pose: only body geometry for human figures, with no clothing, hair, background, or lighting details.",',
    '].join(" ");',
    "",
    "// 3. Multimodal Responses request: system turn + a user turn whose",
    "//    content is an array of `input_image` + `input_text` parts.",
    "const result = await xai.post.v1.responses({",
    '  model: "grok-4",',
    "  input: [",
    '    { role: "system", content: SYSTEM_PROMPT },',
    "    {",
    '      role: "user",',
    "      content: [",
    "        {",
    '          type: "input_image",',
    "          image_url: `data:image/jpeg;base64,${base64}`,",
    '          detail: "high",',
    "        },",
    "        {",
    '          type: "input_text",',
    '          text: \'Analyze this image and produce a reproduction-ready JSON description with keys "prompt", "shot", and "pose".\',',
    "        },",
    "      ],",
    "    },",
    "  ],",
    '  text: { format: { type: "json_object" } },',
    "  store: false,",
    "  temperature: 0,",
    "  max_output_tokens: 300,",
    "});",
    "",
    "// 4. The Responses API wraps output in a typed item array. Find the",
    "//    assistant message, then the first `output_text` part inside it.",
    '//    Discriminated unions narrow `item.type === "message"` so',
    "//    `item.content` is statically typed.",
    'const message = result.output.find((item) => item.type === "message");',
    "const outputText =",
    '  message?.type === "message"',
    '    ? message.content.find((part) => part.type === "output_text")?.text',
    "    : undefined;",
    "",
    'if (!outputText) throw new Error("Grok did not return output_text");',
    "",
    "const analysis = JSON.parse(outputText) as {",
    "  prompt: string;",
    "  shot: string;",
    "  pose: string;",
    "};",
    "",
    "console.log(analysis.shot);",
    '// → "medium close-up, eye-level"',
    "",
    "console.log(analysis.pose);",
    '// → "upright torso facing forward, head straight and centered, shoulders squared, arms relaxed downward (implied)"',
    "",
    "// 5. Reasoning-token accounting. Grok-4 spent 623 of its 728 output",
    "//    tokens reasoning before emitting the 105-token JSON answer —",
    "//    surfaced in `usage.output_tokens_details.reasoning_tokens`.",
    "console.log(result.usage);",
    "// → {",
    "//     input_tokens: 2684,",
    "//     input_tokens_details: { cached_tokens: 679 },",
    "//     output_tokens: 728,",
    "//     output_tokens_details: { reasoning_tokens: 623 },",
    "//     total_tokens: 3412,",
    "//   }",
    "```",
    "",
    "**Notes**",
    "",
    "- `store: false` keeps the response off xAI's history surface. Flip to",
    "  `true` to chain follow-ups via `previous_response_id` — useful for",
    '  multi-turn refinement ("now describe the wardrobe") without re-uploading',
    "  the image each time.",
    "- The Responses output array also carries reasoning items and tool calls",
    "  when present. Always discriminate on `item.type` before reading content;",
    "  TypeScript's narrowing keeps you honest.",
    "- For raw chat-style usage without the Responses wrapping, use",
    "  `xai.post.v1.chat.completions` instead — same auth, same model catalog,",
    "  just OpenAI-compatible request/response shapes.",
    "- Errors surface as `XaiError` with `status` and the parsed body attached,",
    "  so `try { ... } catch (e) { if (e instanceof XaiError) ... }` gives you",
    "  the upstream error directly.",
    "",
  ].join("\n");
}

function renderXaiImagineFilesIntegration() {
  return [
    "## Imagine Files API integration",
    "",
    "xAI Imagine image and video endpoints can reference private Files API",
    "assets directly and can persist generated assets back to Files storage.",
    "",
    "- Inputs: anywhere Imagine accepts a public URL or base64 image/video,",
    "  pass a stored `file_id` instead. Apicity accepts the raw REST shape",
    "  (`image: { file_id }`, `images: [{ file_id }]`,",
    "  `video: { file_id }`, `reference_images: [{ file_id }]`) plus",
    "  convenience aliases (`image_file_id`, `image_file_ids`,",
    "  `video_file_id`, and `reference_image_file_ids`) that are normalized",
    "  before the HTTP request.",
    "- Outputs: pass `storage_options` with a required `filename` to persist",
    "  the generated image or video. Omit `public_url` or set it to `false`",
    "  for a private file; set `public_url: true` or",
    "  `public_url: { expires_after: 86400 }` to create a shareable URL.",
    "- Responses still include the default ephemeral `imgen.x.ai` or",
    "  `vidgen.x.ai` generation URL. When storage is requested, the",
    "  persistent Files metadata is returned as `file_output` on the",
    "  generated image or completed video.",
    "",
    "### Reference-to-video with preset voices",
    "",
    "`xai.post.v1.videos.generations` supports reference-to-video requests with",
    "reference images, one to three preset voices, or both. Image references may",
    "use public HTTPS URLs, data URIs, or Files API IDs in any mixture. Preset",
    "voices use open, case-insensitive xAI voice identifiers; Apicity preserves",
    "each `voice_id` exactly and leaves voice recognition to xAI. The preset-voice",
    "capability requires the `grok-imagine-video-1.5` family, including its",
    "`-preview` and dated aliases. Model-less reference requests default to the",
    "canonical `grok-imagine-video-1.5` model.",
    "",
    "```typescript",
    "const video = await xai.post.v1.videos.generations({",
    '  prompt: "The person from <IMAGE_0> speaks the line with the voice from <AUDIO_0>",',
    '  model: "grok-imagine-video-1.5",',
    '  reference_images: [{ url: "https://example.com/character.png" }],',
    '  reference_audios: [{ voice_id: "eve" }],',
    "  duration: 15,",
    "});",
    "```",
    "",
    "The same callable accepts image-only and audio-only reference requests. Empty",
    "reference arrays are inactive; reference inputs cannot be combined with the",
    "`image`, `image_file_id`, `video`, or `video_file_id` source fields. Prompt",
    "markers such as `<IMAGE_0>` and `<AUDIO_0>` are passed through unchanged.",
    "",
    "### Stored input field map",
    "",
    "Use these fields when an image or video already lives in xAI Files",
    "storage. Apicity normalizes the convenience aliases into the REST",
    "`file_id` object shape before sending the request.",
    "",
    "| Apicity call | Stored input field | Sent to xAI |",
    "| --- | --- | --- |",
    "| `xai.post.v1.images.edits` | `image_file_id` | `image: { file_id }` |",
    "| `xai.post.v1.images.edits` | `image_file_ids` | `images: [{ file_id }]` |",
    "| `xai.post.v1.videos.generations` | `image_file_id` | `image: { file_id }` |",
    "| `xai.post.v1.videos.generations` | `reference_image_file_ids` | `reference_images: [{ file_id }]` |",
    "| `xai.post.v1.videos.generations.imageToVideo` | `image_file_id` | `image: { file_id }` |",
    "| `xai.post.v1.videos.edits` | `video_file_id` | `video: { file_id }` |",
    "| `xai.post.v1.videos.extensions` | `video_file_id` | `video: { file_id }` |",
    "",
    "You can also pass the raw REST fields directly. `images` and",
    "`reference_images` entries can mix `{ file_id }` and `{ url }`",
    "items in the same request, which is useful when only some references",
    "are already private Files assets. Stored images must be PNG, JPEG,",
    "or WebP; stored videos must be MP4; and the file upload must be",
    "complete before it is referenced by an Imagine endpoint.",
    "",
    "```typescript",
    "const gen = await xai.post.v1.images.generations({",
    '  prompt: "A futuristic city skyline at night",',
    '  model: "grok-imagine-image-quality",',
    '  storage_options: { filename: "city.jpg" },',
    "});",
    "const city = gen.data[0].file_output!.file_id!;",
    "",
    "const edit = await xai.post.v1.images.edits({",
    '  prompt: "Add neon signs to the buildings",',
    '  model: "grok-imagine-image-quality",',
    "  image_file_id: city,",
    '  storage_options: { filename: "city-neon.jpg" },',
    "});",
    "const neonCity = edit.data[0].file_output!.file_id!;",
    "",
    "const video = await xai.post.v1.videos.generations({",
    '  prompt: "A camera pulls back through the city",',
    '  model: "grok-imagine-video",',
    "  duration: 5,",
    "  image_file_id: neonCity,",
    "  storage_options: {",
    '    filename: "city-loop.mp4",',
    "    public_url: true,",
    "  },",
    "});",
    "",
    "const done = await xai.get.v1.videos(video.request_id);",
    "console.log(done.video?.url);",
    "console.log(done.video?.file_output?.public_url);",
    "```",
    "",
    "See xAI's",
    "[Imagine Files API integration](https://docs.x.ai/developers/model-capabilities/imagine/files),",
    "[Referencing Files as Input](https://docs.x.ai/developers/model-capabilities/imagine/files/inputs),",
    "[Persisting Generated Output](https://docs.x.ai/developers/model-capabilities/imagine/files/outputs),",
    "[Managing Files](https://docs.x.ai/developers/files/managing-files),",
    "and [Files Public URLs](https://docs.x.ai/developers/files/public-urls)",
    "docs for uploads, expiration, and public URL lifecycle details.",
    "",
  ].join("\n");
}

function renderXaiFilesPublicUrls() {
  return [
    "## Files Public URLs",
    "",
    "Files uploaded to xAI storage are private by default. Use",
    "`xai.post.v1.files.publicUrl(fileId)` to create a shareable",
    "xAI CDN URL for an existing file, then revoke that URL independently",
    "with `xai.post.v1.files.publicUrl.revoke(fileId)` when sharing",
    "should stop. Revoking the public URL leaves the private file intact.",
    "",
    "```typescript",
    "const file = await xai.post.v1.files(",
    '  new Blob(["diagram"], { type: "image/png" }),',
    '  "diagram.png",',
    '  "assistants"',
    ");",
    "",
    "const created = await xai.post.v1.files.publicUrl(file.id, {",
    "  expires_after: 86400,",
    "});",
    "console.log(created.public_url);",
    "console.log(created.expires_at);",
    "",
    "const withPublicUrls = await xai.get.v1.files({",
    '  filter: "public_url != null",',
    "});",
    "console.log(withPublicUrls.data[0]?.public_url);",
    "",
    "await xai.post.v1.files.publicUrl.revoke(file.id);",
    "```",
    "",
    "**Public URL lifecycle**",
    "",
    "- Empty create bodies use xAI defaults. Pass `expires_after` in seconds",
    "  to auto-revoke the URL after 1 hour to 30 days.",
    "- A public URL cannot outlive its file. If the file has its own",
    "  `expires_at`, an omitted public URL expiry inherits the file expiry;",
    "  an explicit `expires_after` must fit inside the file's remaining",
    "  lifetime.",
    "- Create is idempotent while a file already has an active public URL:",
    "  repeated calls return the same URL token and can update its expiry.",
    "- `get.v1.files(fileId)` and `get.v1.files({ filter })` preserve",
    "  `public_url` and `public_url_expires_at` metadata so callers can",
    "  audit which files are currently public.",
    "",
    "See xAI's",
    "[Files Public URLs](https://docs.x.ai/developers/files/public-urls),",
    "[Managing Files](https://docs.x.ai/developers/files/managing-files),",
    "and [Imagine Files API integration](https://docs.x.ai/developers/model-capabilities/imagine/files)",
    "docs for supported content types, size limits, and the",
    "`storage_options.public_url` generation path.",
    "",
  ].join("\n");
}

// Mined from tests/recordings/fal_2801268556/storage-upload-initiate_29504192/
// (POST initiate → PUT bytes) and
// tests/recordings/fal_2801268556/sora-2-image-to-video_1672301295/
// (POST sora-2 image-to-video) — the same calls that
// fal-storage-upload-initiate.test.ts and fal-sora-2-image-to-video.test.ts
// replay end-to-end.
function renderFalExample() {
  return [
    "## Real-world example: upload a portrait, render a Sora 2 video",
    "",
    "fal's signature flow is upload-once, reuse-everywhere — drop bytes onto",
    "fal's CDN via a presigned PUT, then thread the resulting",
    "`https://*.fal.media/` URL through any model endpoint. The two-step",
    "snippet below combines",
    "[`tests/integration/fal-storage-upload-initiate.test.ts`](../../../tests/integration/fal-storage-upload-initiate.test.ts)",
    "(POST initiate → PUT bytes) with",
    "[`tests/integration/fal-sora-2-image-to-video.test.ts`](../../../tests/integration/fal-sora-2-image-to-video.test.ts)",
    "(image-to-video generation), so every URL, byte count, and asset id",
    "below comes from real recorded HARs.",
    "",
    "```typescript",
    'import { readFile } from "node:fs/promises";',
    'import { createFal } from "@apicity/fal";',
    "",
    "const fal = createFal({ apiKey: process.env.FAL_API_KEY! });",
    "",
    "// 1. Reserve a signed upload slot. `initiate` returns two URLs: a",
    "//    permanent `file_url` you'll feed to downstream models, and a",
    "//    presigned `upload_url` you PUT the bytes to. Both point at the",
    "//    same fal CDN — no third-party hosting needed.",
    "const slot = await fal.storage.upload.initiate({",
    '  file_name: "man.jpg",',
    '  content_type: "image/jpeg",',
    "});",
    "console.log(slot.file_url);",
    '// → "https://v3b.fal.media/files/b/0a96d564/QR9a1l-E0UuoR6zOHUMlX_man.jpg"',
    "//   (the `cat1.jpg` recording shows the same URL shape with a",
    "//    cat1 suffix; the suffix tracks `file_name` you passed in.)",
    "",
    "// 2. PUT the bytes to the presigned URL. fal storage is plain HTTP —",
    "//    no SDK call needed, just `fetch` with a matching Content-Type.",
    "//    The signature on `upload_url` expires after a short window;",
    "//    upload promptly. The resulting `file_url` is durable and",
    "//    fetchable by every fal model endpoint.",
    'const bytes = await readFile("./man.jpg");',
    "const put = await fetch(slot.upload_url, {",
    '  method: "PUT",',
    '  headers: { "Content-Type": "image/jpeg" },',
    "  body: bytes,",
    "});",
    "if (!put.ok) throw new Error(`upload failed: ${put.status}`);",
    "",
    "// 3. Hand the now-permanent `file_url` to OpenAI's Sora 2 image-to-",
    "//    video model. fal returns a typed bundle: the MP4, a webp",
    "//    thumbnail, and a horizontal spritesheet — all hosted on the",
    "//    same fal CDN. `duration` accepts 4 | 8 | 12 | 16 | 20 (seconds);",
    '//    `aspect_ratio` is "auto" | "9:16" | "16:9".',
    "const result = await fal.sora2.imageToVideo({",
    '  prompt: "the man waves at the camera as the wind blows his hair",',
    "  image_url: slot.file_url,",
    '  aspect_ratio: "16:9",',
    "  duration: 4,",
    "});",
    "",
    "console.log(result.video.url);",
    '// → "https://v3b.fal.media/files/b/0a96bf3c/8U5wwkg9EC_eK0Jr3XyiR_Vgq1ZZPm.mp4"',
    "console.log(result.video.file_size);",
    "// → 2009236   // ~2 MB MP4 for a 4-second 720p clip",
    "console.log(result.video_id);",
    '// → "video_69e37804033c8191959194ea8aa8fc6e08bf9f3eb453b1b1"',
    "console.log(result.thumbnail?.url);",
    '// → "https://v3b.fal.media/files/b/0a96bf3c/bsgsaBd5IqdwOuufu_qSx_2yOP4u34.webp"',
    "console.log(result.spritesheet?.url);",
    '// → "https://v3b.fal.media/files/b/0a96bf3c/_9tqG1dEuRCEeegOulGrk_pWsHbiNB.bin"',
    "```",
    "",
    "**Notes**",
    "",
    "- The recorded sora-2 HAR inlines the image as a",
    "  `data:image/jpeg;base64,…` URL — fal accepts both inline data URLs",
    "  and any `https://` URL it can reach. Uploading via fal storage",
    "  first keeps request bodies tiny (350 KB → <1 KB) and lets you reuse",
    "  the asset across multiple model calls without re-encoding.",
    "- The package re-exports a one-call `uploadFile(provider, { data,",
    "  filename, contentType })` helper that wraps the initiate-then-PUT",
    "  dance and returns the `file_url` directly — use it when you don't",
    "  need granular control over the lifecycle or signed URL.",
    "- Every POST endpoint exposes a Zod schema: call",
    "  `fal.sora2.imageToVideo.schema.safeParse(input)` to validate a",
    "  payload before paying for inference.",
    "- WAN 2.7 reference-to-video validates generated duration as 2–10",
    "  seconds. `duration: 0` remains limited to source-clip edit-video",
    "  flows where it means keeping the original clip length.",
    "- Long-running calls accept an `AbortSignal` second argument and",
    "  compose with the package's middleware, e.g.",
    "  `withRetry(fal.sora2.imageToVideo, { retries: 3 })` from",
    "  `@apicity/fal` to ride out transient queue / 429s.",
    "- Errors throw `FalError` with `status`, `type`, `request_id`, and the",
    "  parsed `body` attached:",
    "  `try { ... } catch (e) { if (e instanceof FalError) console.error(e.status, e.body); }`.",
    "",
  ].join("\n");
}

// Mined from tests/recordings/kie_2079838932/kling-30-reference-bakeoff_875607413/
// recording.har — the same flow that
// tests/integration/kie-kling-30-reference-bakeoff.test.ts replays end-to-end.
function renderKieExample() {
  return [
    "## Media URLs",
    "",
    "Request schemas validate the construction boundary and accept any string",
    "in media input fields — including local slugs such as `@img-ref-1` or",
    "`@asset/photo.png` for assets that have not been uploaded yet. kie.ai",
    "fetches media from the public internet at task-creation time, so before",
    "calling `createTask` you must upload local assets and substitute publicly",
    "reachable URLs (e.g. `https://example.com/image.png`).",
    "",
    "## Omnihuman 1.5 model slug",
    "",
    "KIE's Omnihuman 1.5 model uses the shared",
    "`kie.post.api.v1.jobs.createTask` endpoint. Send the",
    "`omnihuman-1-5` model slug with a portrait image URL and a driving",
    "audio URL; KIE returns `{ code, msg, data: { taskId } }`, and final",
    "video results are retrieved through",
    "`kie.get.api.v1.jobs.recordInfo(taskId)` or delivered to",
    "`callBackUrl`.",
    "",
    "```typescript",
    "const task = await kie.post.api.v1.jobs.createTask({",
    '  model: "omnihuman-1-5",',
    "  input: {",
    '    image_url: "https://example.com/portrait.png",',
    '    mask_url: ["https://example.com/mask.png"],',
    '    audio_url: "https://example.com/speech.mp3",',
    '    prompt: "A person speaking naturally with gentle expressions.",',
    '    output_resolution: "1080",',
    "    pe_fast_mode: false,",
    "    seed: -1,",
    "  },",
    '  callBackUrl: "https://example.com/api/callback",',
    "});",
    "```",
    "",
    "`image_url` accepts JPEG, PNG, or WEBP portrait images up to 10 MB.",
    "`mask_url` is optional and accepts at most 5 subject mask image URLs.",
    "`audio_url` accepts MP3, WAV, AAC, OGG, or MP4 audio up to 10 MB and",
    'less than 60 seconds. Use `output_resolution: "720"` or `"1080"`;',
    'defaults are `"1080"` for resolution, `false` for `pe_fast_mode`, and',
    "`-1` for a random seed.",
    "",
    "## Gemini Omni Character endpoint",
    "",
    "Gemini Omni Character has its own direct endpoint:",
    "`kie.post.api.v1.omni.character.create`. Use it to create a reusable",
    "character reference for `gemini-omni-video`; the returned",
    "`data.characterId` can be passed in that model's `character_ids` array.",
    "If you already created voice traits through Gemini Omni Audio, pass those",
    "`audio_ids` to guide the character's tone or persona.",
    "",
    "```typescript",
    "const character = await kie.post.api.v1.omni.character.create({",
    '  descriptions: "A confident presenter in a blue blazer.",',
    '  image_urls: ["https://example.com/presenter.png"],',
    '  audio_ids: ["audio_01hx8p0demo"],',
    '  character_name: "Presenter",',
    "});",
    "",
    "const video = await kie.post.api.v1.jobs.createTask({",
    '  model: "gemini-omni-video",',
    "  input: {",
    '    prompt: "Presenter explains the product in a bright studio.",',
    "    character_ids: [character.data!.characterId],",
    '    duration: "4",',
    "  },",
    "});",
    "```",
    "",
    "The request field is `descriptions` (plural). `image_urls` is required",
    "and accepts exactly one public reference image, up to KIE's 20 MB",
    "upstream limit. See https://docs.kie.ai/market/gemini-omni-character",
    "for the full upstream contract.",
    "",
    "## Grok Imagine 1.5 model slugs",
    "",
    "KIE's current Grok Imagine Quick Start markets Grok Imagine 1.5 through",
    "the existing `grok-imagine/text-to-video` and",
    "`grok-imagine/image-to-video` createTask slugs rather than a new stable",
    "`grok-imagine-video-1-5` slug. The package keeps",
    "`grok-imagine-video-1-5-preview` for older recordings and callers, but",
    "new 1.5 integrations should start with the suite slugs shown at",
    "https://kie.ai/grok-imagine.",
    "",
    "```typescript",
    "const textVideo = await kie.post.api.v1.jobs.createTask({",
    '  model: "grok-imagine/text-to-video",',
    "  input: {",
    '    prompt: "A golden sunset over calm ocean waves",',
    '    aspect_ratio: "16:9",',
    '    mode: "normal",',
    "    duration: 6,",
    '    resolution: "480p",',
    "    nsfw_checker: true,",
    "  },",
    "});",
    "",
    "declare const referenceImageUrl: string;",
    "",
    "const imageVideo = await kie.post.api.v1.jobs.createTask({",
    '  model: "grok-imagine/image-to-video",',
    "  input: {",
    "    image_urls: [referenceImageUrl],",
    '    prompt: "@image1 smiles and waves at the camera",',
    '    aspect_ratio: "16:9",',
    '    mode: "fun",',
    '    duration: "6",',
    '    resolution: "720p",',
    "    nsfw_checker: true,",
    "  },",
    "});",
    "```",
    "",
    "For image-to-video, send either `image_urls` or `task_id` plus `index`",
    "from an earlier Grok image generation. Do not send both in one request.",
    "External `image_urls` must point to JPEG, PNG, or WEBP images; KIE's",
    'upstream limit is 7 images and 10 MB per image. `mode: "spicy"` is',
    "only available when sourcing the image from a previous Grok `task_id`,",
    "not from external image URLs.",
    "Active image-to-video prompts are capped at 4096 characters, and",
    "both Grok video models accept `duration` as either a JSON integer or a",
    "canonical decimal integer string from 6 through 30. Values such as `6` and",
    '`"6"` are forwarded in the representation supplied by the caller; Apicity',
    "does not coerce between them. Whitespace, signs, decimals, leading zeroes, and",
    "out-of-range values remain invalid. See KIE's current",
    "[text-to-video](https://docs.kie.ai/market/grok-imagine/text-to-video.md) and",
    "[image-to-video](https://docs.kie.ai/market/grok-imagine/image-to-video.md)",
    "sources and the repository's",
    "[numeric-input compatibility audit](../../../docs/kie-numeric-input-compatibility.md)",
    "for the evidence and field-specific decisions.",
    "",
    "## Grok Imagine Extend numeric contract",
    "",
    "`grok-imagine/extend` requires a completed source task and preserves",
    "both contract fields exactly as supplied. `extend_at` is a required JSON",
    "number with minimum `0`; fractional positions are accepted, omission is",
    "rejected, and Apicity does not inject KIE's advertised default. The",
    '`extend_times` field is the required string enum `"6" | "10"`; JSON',
    "numbers and malformed strings are rejected rather than coerced.",
    "",
    "```typescript",
    "declare const completed480pTaskId: string;",
    "",
    "const extended = await kie.post.api.v1.jobs.createTask({",
    '  model: "grok-imagine/extend",',
    '  resolution: "480p", // Pricing hint for the source resolution.',
    "  input: {",
    "    task_id: completed480pTaskId,",
    '    prompt: "Continue the scene with a gentle camera drift.",',
    "    extend_at: 2.5,",
    '    extend_times: "6",',
    "  },",
    "});",
    "```",
    "",
    "The current contract comes from the repository's bounded compatibility",
    "matrix. See the",
    "[numeric-input compatibility audit](../../../docs/kie-numeric-input-compatibility.md)",
    "for the official-source conflict, historical observation, live results,",
    "and no-coercion decision.",
    "",
    "## ElevenLabs numeric contracts",
    "",
    "The two KIE text-to-speech models share the same inclusive numeric contract:",
    "",
    "| Models | Field | Minimum | Maximum | Default |",
    "| --- | --- | ---: | ---: | ---: |",
    "| `elevenlabs/text-to-speech-multilingual-v2`, `elevenlabs/text-to-speech-turbo-2-5` | `stability` | 0 | 1 | 0.5 |",
    "| same | `similarity_boost` | 0 | 1 | 0.75 |",
    "| same | `style` | 0 | 1 | 0 |",
    "| same | `speed` | 0.7 | 1.2 | 1 |",
    "",
    "For `elevenlabs/text-to-dialogue-v3`, `stability` accepts only the discrete",
    "values `0`, `0.5`, and `1`, and defaults to `0.5`.",
    "",
    "Parsing with the exported Zod request schemas materializes these defaults in",
    "the parsed result. Calling `kie.post.api.v1.jobs.createTask` is intentionally",
    "different: it validates the request but serializes the original caller object,",
    "so omitted settings remain omitted on the wire. Explicit valid values are",
    "preserved in both direct parsing and transport.",
    "",
    "See KIE's official pages for",
    "[dialogue v3](https://docs.kie.ai/market/elevenlabs/text-to-dialogue-v3.md),",
    "[multilingual v2](https://docs.kie.ai/market/elevenlabs/text-to-speech-multilingual-v2.md),",
    "and [turbo 2.5](https://docs.kie.ai/market/elevenlabs/text-to-speech-turbo-2-5.md).",
    "",
    "`createTask` returns `{ code, msg, data: { taskId } }`. For production",
    "workloads, pass `callBackUrl` so KIE can notify you when the job",
    "finishes. Without a callback, poll",
    "`kie.get.api.v1.jobs.recordInfo(taskId)` until `state` is `success` or",
    "`fail`; successful responses carry generated media URLs in the",
    "`resultJson` string.",
    "",
    "## HappyHorse 1.1 model slugs",
    "",
    "KIE exposes Alibaba HappyHorse 1.1 through the same shared",
    "`kie.post.api.v1.jobs.createTask` endpoint. Use the 1.1 model slugs",
    "`happyhorse-1-1/text-to-video`, `happyhorse-1-1/image-to-video`, and",
    "`happyhorse-1-1/reference-to-video` with the input shapes shown in",
    "KIE's docs at https://docs.kie.ai/market/happyhorse-1-1/text-to-video,",
    "https://docs.kie.ai/market/happyhorse-1-1/image-to-video, and",
    "https://docs.kie.ai/market/happyhorse-1-1/reference-to-video.",
    "",
    "```typescript",
    "const textTask = await kie.post.api.v1.jobs.createTask({",
    '  model: "happyhorse-1-1/text-to-video",',
    "  input: {",
    '    prompt: "A dog running on the earth",',
    '    resolution: "1080p",',
    '    aspect_ratio: "16:9",',
    "    duration: 5,",
    "  },",
    '  callBackUrl: "https://example.com/api/callback",',
    "});",
    "",
    "const imageTask = await kie.post.api.v1.jobs.createTask({",
    '  model: "happyhorse-1-1/image-to-video",',
    "  input: {",
    '    image_urls: ["https://example.com/first-frame.png"],',
    '    prompt: "A cat running on the grass",',
    '    resolution: "1080p",',
    "    duration: 5,",
    "  },",
    "});",
    "",
    "const referenceTask = await kie.post.api.v1.jobs.createTask({",
    '  model: "happyhorse-1-1/reference-to-video",',
    "  input: {",
    '    reference_image: ["https://example.com/reference.png"],',
    '    prompt: "A cat running on the grass",',
    '    resolution: "1080p",',
    '    aspect_ratio: "16:9",',
    "    duration: 5,",
    "  },",
    "});",
    "",
    "console.log(",
    "  textTask.data?.taskId,",
    "  imageTask.data?.taskId,",
    "  referenceTask.data?.taskId,",
    ");",
    "```",
    "",
    "For 1.1 image-to-video, `image_urls` is required and accepts exactly",
    "one first-frame image URL. For 1.1 reference-to-video,",
    "`reference_image` accepts 1-9 image URLs and prompts can refer to",
    "the images by position. All three generation modes use `resolution`",
    '(`"720p"` or `"1080p"`) and integer `duration` from 3 to 15 seconds;',
    "text-to-video and reference-to-video also expose the wider 1.1",
    'aspect-ratio set including `"21:9"` and `"9:21"`.',
    "",
    "## Seedance 2 Mini createTask flow",
    "",
    "Seedance 2 Mini also uses the shared KIE jobs endpoints. Submit",
    '`model: "bytedance/seedance-2-mini"` to',
    "`kie.post.api.v1.jobs.createTask`, then poll",
    "`kie.get.api.v1.jobs.recordInfo(taskId)` or pass `callBackUrl` for",
    "completion notifications.",
    "",
    "```typescript",
    "const miniTask = await kie.post.api.v1.jobs.createTask({",
    '  model: "bytedance/seedance-2-mini",',
    "  input: {",
    '    prompt: "A compact launch video with crisp product details.",',
    '    reference_image_urls: ["https://example.com/product.png"],',
    '    reference_video_urls: ["https://example.com/source.mp4"],',
    '    reference_audio_urls: ["https://example.com/voice.wav"],',
    "    generate_audio: false,",
    '    resolution: "720p",',
    '    aspect_ratio: "16:9",',
    "    duration: 15,",
    "    web_search: false,",
    "    nsfw_checker: true,",
    "  },",
    '  callBackUrl: "https://example.com/api/kie-callback",',
    "});",
    "",
    "const miniInfo = await kie.get.api.v1.jobs.recordInfo(",
    "  miniTask.data!.taskId",
    ");",
    "const miniResult = miniInfo.data?.resultJson",
    "  ? JSON.parse(miniInfo.data.resultJson)",
    "  : null;",
    "console.log(miniInfo.data?.state, miniResult?.resultUrls);",
    "```",
    "",
    "The example explicitly sets `duration: 15` as an upper-bound override.",
    "When `duration` is omitted, the exported schema applies its 5-second",
    "default.",
    "",
    "`prompt` is optional and capped at 20000 characters. Media references",
    "default to empty arrays when using the exported Zod schema. `duration`",
    "is an integer from 4 to 15 seconds, `resolution` is `480p` or `720p`,",
    "and `aspect_ratio` is one of `16:9`, `4:3`, `1:1`, `3:4`, `9:16`,",
    "`21:9`, or `adaptive`. The schema defaults are `generate_audio: true`,",
    '`resolution: "720p"`, `aspect_ratio: "16:9"`, `duration: 5`,',
    "`web_search: false`, and `nsfw_checker: true`.",
    "",
    "## Real-world example: Kling 3.0 Turbo createTask payloads",
    "",
    "KIE's Kling 3.0 Turbo Quick Start exposes two createTask slugs:",
    "`kling/v3-turbo-text-to-video` and",
    "`kling/v3-turbo-image-to-video`. Both use the same",
    "`kie.post.api.v1.jobs.createTask` endpoint as the rest of the KIE",
    "media models; only the `model` and `input` block change.",
    "",
    "```typescript",
    'import { createKie } from "@apicity/kie";',
    "",
    "const kie = createKie({ apiKey: process.env.KIE_API_KEY! });",
    "",
    "const textTask = await kie.post.api.v1.jobs.createTask({",
    '  model: "kling/v3-turbo-text-to-video",',
    "  input: {",
    '    prompt: "A cinematic drone shot over glass towers at sunrise.",',
    "    duration: 5,",
    '    aspect_ratio: "16:9",',
    '    resolution: "720p",',
    "  },",
    "});",
    "",
    "const imageTask = await kie.post.api.v1.jobs.createTask({",
    '  model: "kling/v3-turbo-image-to-video",',
    "  input: {",
    '    prompt: "Animate the product photo with a slow studio turntable move.",',
    '    image_urls: ["https://example.com/product.png"],',
    "    duration: 5,",
    '    resolution: "1080p",',
    "  },",
    "});",
    "",
    "console.log(textTask.data?.taskId, imageTask.data?.taskId);",
    "```",
    "",
    "The image-to-video shape accepts exactly one `image_urls` entry. Both",
    "Turbo shapes require `prompt`, numeric `duration`, and `resolution`",
    "(`720p` or `1080p`); text-to-video additionally requires",
    "`aspect_ratio` (`1:1`, `9:16`, or `16:9`).",
    "",
    "## Real-world example: Kling 3.0 video with named element references",
    "",
    "Kling 3.0/video has a feature most upstream video models lack — **named",
    "element references**. You upload reference images for each subject, give",
    "the subject a `name` and `description`, and refer back to it from the",
    "prompt with `[name]` placeholders. The result preserves identity across",
    "frames without prompt-engineering gymnastics.",
    "",
    "The flow below is taken verbatim from",
    "[`tests/integration/kie-kling-30-reference-bakeoff.test.ts`](../../../tests/integration/kie-kling-30-reference-bakeoff.test.ts)",
    "and replays against",
    "[`tests/recordings/kie_2079838932/kling-30-reference-bakeoff_875607413/recording.har`](../../../tests/recordings/kie_2079838932/kling-30-reference-bakeoff_875607413/recording.har),",
    "so the response shapes match what Kie actually returns.",
    "",
    "```typescript",
    'import { readFileSync } from "node:fs";',
    'import { createKie } from "@apicity/kie";',
    "",
    "const kie = createKie({ apiKey: process.env.KIE_API_KEY! });",
    "",
    "// 1. Upload each reference image. Kie returns a CDN-hosted",
    "//    `downloadUrl` you'll thread through the job request — the bytes",
    "//    themselves never live in the createTask payload.",
    "async function upload(filename: string, mimeType: string): Promise<string> {",
    "  const blob = new Blob([readFileSync(filename)], { type: mimeType });",
    "  const res = await kie.post.api.fileStreamUpload({",
    "    file: blob,",
    "    filename,",
    '    uploadPath: "images/test-uploads",',
    "  });",
    '  if (!res.data?.downloadUrl) throw new Error("upload failed");',
    "  return res.data.downloadUrl;",
    "}",
    "",
    '// Two angles of the cat satisfy Kling\'s "2-4 images per element"',
    "// minimum. The man only has one fixture, so we pass it twice.",
    'const cat1  = await upload("cat1.jpg",  "image/jpeg");',
    'const cat2  = await upload("cat2.jpg",  "image/jpeg");',
    'const man   = await upload("man.jpg",   "image/jpeg");',
    'const beach = await upload("beach.png", "image/png");',
    "",
    "// 2. Submit the job. Each `kling_elements` entry binds a `name` to a",
    "//    set of reference images; the prompt then refers to that subject",
    "//    via `[name]`. `image_urls` carries general/setting references —",
    "//    the beach plate here — that aren't tied to a named subject.",
    "const task = await kie.post.api.v1.jobs.createTask({",
    '  model: "kling-3.0/video",',
    "  input: {",
    "    prompt:",
    '      "On a sandy beach with the ocean behind, [blue_suit_man] sits " +',
    '      "cross-legged on the sand. [white_cat] climbs onto his lap, " +',
    '      "purrs, and lifts a paw to bat playfully at his blue tie. " +',
    '      "[blue_suit_man] smiles and waves at the camera with his free hand.",',
    "    image_urls: [beach],",
    "    kling_elements: [",
    "      {",
    '        name: "white_cat",',
    '        description: "A white cat with mismatched yellow and blue eyes",',
    "        element_input_urls: [cat1, cat2],",
    "      },",
    "      {",
    '        name: "blue_suit_man",',
    '        description: "A man wearing a blue suit and a blue tie",',
    "        element_input_urls: [man, man],",
    "      },",
    "    ],",
    "    sound: false,",
    '    duration: "5",',
    '    aspect_ratio: "16:9",',
    '    mode: "std",',
    "    multi_shots: false,",
    "  },",
    "});",
    "",
    'if (!task.data?.taskId) throw new Error("createTask returned no taskId");',
    "const taskId = task.data.taskId;",
    '// → "56074f12319c68b246e5a03e05608f31"',
    "",
    "// 3. Poll recordInfo until the job leaves the `generating` state.",
    "//    Kie's terminal states are `success` and `fail` — anything else",
    "//    (`waiting`, `queuing`, `generating`) means keep waiting.",
    'let state: string = "waiting";',
    "let resultJson: string | undefined;",
    "for (let i = 0; i < 200; i++) {",
    "  const info = await kie.get.api.v1.jobs.recordInfo(taskId);",
    '  state = info.data?.state ?? "waiting";',
    '  if (state === "success" || state === "fail") {',
    "    resultJson = info.data?.resultJson;",
    "    break;",
    "  }",
    "  await new Promise((r) => setTimeout(r, 10_000));",
    "}",
    'if (state !== "success" || !resultJson) throw new Error(`job ${state}`);',
    "",
    "// 4. `resultJson` is a JSON-encoded string — parse it to get the",
    "//    delivered media URLs. The shape is consistent across every kie",
    "//    media model (single `resultUrls: string[]`).",
    "const result = JSON.parse(resultJson) as { resultUrls: string[] };",
    "console.log(result.resultUrls[0]);",
    '// → "https://tempfile.aiquickdraw.com/k/56074f12319c68b246e5a03e05608f31_1_1777540551_7969.mp4"',
    "```",
    "",
    "**Notes**",
    "",
    "- `kling_elements` accepts at most 3 named subjects, and each",
    "  `element_input_urls` array must hold **2–4 images**. If you only have",
    "  one reference per subject, repeat it (as the example does for `man`)",
    "  to satisfy the minimum.",
    "- The poll loop watches for the terminal states `success` and `fail` —",
    "  anything else (`waiting`, `queuing`, `generating`) means keep going.",
    "  There's no `check_after_secs` hint as on some other providers, so a",
    "  10s cadence is conservative; in the recorded fixture the job",
    "  completed after ~127s of generating (14 polls).",
    "- `kie.post.api.v1.jobs.createTask` is the unified entry point for every",
    "  media model in this provider — Kling, Wan, Seedance, Grok Imagine,",
    "  GPT-Image-2, Qwen2, and others. Swap the `model` and `input` block;",
    "  the rest of the flow (upload → createTask → poll → parse `resultJson`)",
    "  is identical.",
    "- For convenience, `submitMediaJob(provider, request)` and",
    "  `uploadFile(provider, blob, filename, uploadPath)` re-export the same",
    "  calls but throw `KieError` directly when the upstream envelope is",
    "  missing the expected fields.",
    "- Errors surface as `KieError` with `status`, `body`, and an upstream",
    "  `code` attached, so",
    "  `try { ... } catch (e) { if (e instanceof KieError) ... }` gives you",
    "  the upstream error directly.",
    "",
    "## Qwen2 image edit createTask flow",
    "",
    "Qwen2 image edit uses the shared KIE jobs endpoint. Submit",
    '`model: "qwen2/image-edit"` to `kie.post.api.v1.jobs.createTask`, then',
    "poll `kie.get.api.v1.jobs.recordInfo(taskId)` or pass `callBackUrl`.",
    "",
    "```typescript",
    "const task = await kie.post.api.v1.jobs.createTask({",
    '  model: "qwen2/image-edit",',
    '  callBackUrl: "https://your-domain.com/api/callback",',
    "  input: {",
    '    prompt: "Add sunglasses to the subject",',
    '    image_url: "https://example.com/source.png",',
    '    image_size: "16:9",',
    "    seed: 0,",
    '    output_format: "png",',
    "    nsfw_checker: false,",
    "  },",
    "});",
    "```",
    "",
    "`prompt` is required and capped at 800 characters. `image_url` is a",
    "single source image URL, not file content; upload local images first and",
    "pass the returned URL. KIE accepts JPEG, PNG, and WEBP images up to",
    "10 MB. `image_size` defaults to `16:9` and accepts `1:1`, `2:3`, `3:2`,",
    "`3:4`, `4:3`, `9:16`, `16:9`, and `21:9`. `output_format` defaults to",
    "`png` and accepts `jpeg` or `png`. When supplied, `seed` must be an",
    "integer; an omitted seed remains absent, and KIE publishes no bounds or",
    "default. `nsfw_checker` defaults to `false`.",
    "",
    "## Qwen2 text-to-image createTask flow",
    "",
    "Qwen2 text-to-image uses the same shared KIE jobs endpoint. Submit",
    '`model: "qwen2/text-to-image"` to `kie.post.api.v1.jobs.createTask`,',
    "then poll `kie.get.api.v1.jobs.recordInfo(taskId)` or pass",
    "`callBackUrl`.",
    "",
    "```typescript",
    "const task = await kie.post.api.v1.jobs.createTask({",
    '  model: "qwen2/text-to-image",',
    '  callBackUrl: "https://your-domain.com/api/callback",',
    "  input: {",
    '    prompt: "A serene mountain landscape at sunrise",',
    '    image_size: "16:9",',
    "    seed: 0,",
    '    output_format: "png",',
    "    nsfw_checker: false,",
    "  },",
    "});",
    "```",
    "",
    "`prompt` is required and capped at 800 characters. `image_size`",
    "defaults to `16:9` and accepts `1:1`, `3:4`, `4:3`, `9:16`, and",
    "`16:9`. `output_format` defaults to `png` and accepts `jpeg` or",
    "`png`; `seed` must be an integer when provided; `nsfw_checker`",
    "defaults to `false`.",
    "",
    "## Wan 2.2 auxiliary model operations",
    "",
    "Wan 2.2 speech-to-video, image-to-video, animate move, and animate replace",
    "are four model operations on the same",
    "`kie.post.api.v1.jobs.createTask` endpoint, not four endpoint methods. Type",
    "the request at the package boundary, submit it, then read `data.taskId` and",
    "poll the shared `kie.get.api.v1.jobs.recordInfo(taskId)` endpoint.",
    "",
    "```typescript",
    "import {",
    "  createKie,",
    "  type TaskResponse,",
    "  type Wan22A14bImageToVideoTurboRequest,",
    "  type Wan22A14bSpeechToVideoTurboRequest,",
    "  type Wan22AnimateMoveRequest,",
    "  type Wan22AnimateReplaceRequest,",
    '} from "@apicity/kie";',
    "",
    "const kie = createKie({ apiKey: process.env.KIE_API_KEY! });",
    "",
    "const imageToVideo = {",
    '  model: "wan/2-2-a14b-image-to-video-turbo",',
    "  input: {",
    '    image_url: "https://example.com/first-frame.png",',
    '    prompt: "A slow camera push toward the subject",',
    "  },",
    "} satisfies Wan22A14bImageToVideoTurboRequest;",
    "",
    "const speechToVideo = {",
    '  model: "wan/2-2-a14b-speech-to-video-turbo",',
    "  input: {",
    '    prompt: "The presenter explains the product",',
    '    image_url: "https://example.com/presenter.png",',
    '    audio_url: "https://example.com/presenter.mp3",',
    "  },",
    "} satisfies Wan22A14bSpeechToVideoTurboRequest;",
    "",
    "const animateMove = {",
    '  model: "wan/2-2-animate-move",',
    "  input: {",
    '    video_url: "https://example.com/source.mp4",',
    '    image_url: "https://example.com/subject.png",',
    "  },",
    "} satisfies Wan22AnimateMoveRequest;",
    "",
    "const animateReplace = {",
    '  model: "wan/2-2-animate-replace",',
    "  input: {",
    '    video_url: "https://example.com/source.mp4",',
    '    image_url: "https://example.com/replacement.png",',
    "  },",
    "} satisfies Wan22AnimateReplaceRequest;",
    "",
    "const task: TaskResponse = await kie.post.api.v1.jobs.createTask(imageToVideo);",
    "const taskId = task.data?.taskId;",
    'if (!taskId) throw new Error("KIE did not return a taskId");',
    "",
    "const details = await kie.get.api.v1.jobs.recordInfo(taskId);",
    "console.log(details.data?.state, details.data?.resultJson);",
    "```",
    "",
    "Use the same `createTask` call with `speechToVideo`, `animateMove`, or",
    "`animateReplace` for the other operations. The required media fields are",
    "public URLs; upload local assets before submission. A `callBackUrl` can be",
    "provided instead of polling. See the",
    "[Wan 2.2 auxiliary-media evidence matrix](../../../docs/kie-wan-22-auxiliary-media.md)",
    "for the exact documented fields, defaults, response envelope, and evidence",
    "boundary.",
    "## Qwen Image 3 createTask flow",
    "",
    "Qwen Image 3 has four exact Kie model ids: `qwen3/text-to-image`,",
    "`qwen3/image-to-image`, `qwen3/pro-text-to-image`, and",
    "`qwen3/pro-image-to-image`. See the official model pages for",
    "[`qwen3/text-to-image`](https://docs.kie.ai/market/qwen3/text-to-image),",
    "[`qwen3/image-to-image`](https://docs.kie.ai/market/qwen3/image-to-image),",
    "[`qwen3/pro-text-to-image`](https://docs.kie.ai/market/qwen3-pro/text-to-image),",
    "and",
    "[`qwen3/pro-image-to-image`](https://docs.kie.ai/market/qwen3-pro/image-to-image).",
    "",
    "Text-to-image accepts an optional `resolution`; there is no documented",
    "default, so set it explicitly when constructing a request:",
    "",
    "```typescript",
    "const textTask = await kie.post.api.v1.jobs.createTask({",
    '  model: "qwen3/text-to-image",',
    "  input: {",
    '    prompt: "A quiet alpine lake beneath the Milky Way",',
    '    resolution: "2K",',
    '    image_size: "16:9",',
    '    output_format: "png",',
    "    prompt_extend: true,",
    "    nsfw_checker: false,",
    "    seed: 1,",
    "  },",
    "});",
    "```",
    "",
    "Image-to-image uses the same shared fields plus `image_urls`, an array",
    "of one to three public source-image URLs. Its `resolution` defaults to",
    "`1K` when omitted:",
    "",
    "```typescript",
    "const imageTask = await kie.post.api.v1.jobs.createTask({",
    '  model: "qwen3/pro-image-to-image",',
    "  input: {",
    '    prompt: "Turn this product photo into a watercolor illustration",',
    '    image_urls: ["https://example.com/product.png"],',
    '    image_size: "4:3",',
    '    output_format: "jpeg",',
    "    prompt_extend: true,",
    "    nsfw_checker: false,",
    "    seed: 1,",
    "  },",
    "});",
    "```",
    "",
    "## Grok Imagine Image 2.0 createTask flow",
    "",
    "Grok Imagine Image 2.0 has three exact Kie model ids:",
    "`grok-imagine-image-2-0/text-to-image`,",
    "`grok-imagine-image-2-0/segment-map`, and",
    "`grok-imagine-image-2-0/image-edit`. See the official model pages for",
    "[`grok-imagine-image-2-0/text-to-image`](https://docs.kie.ai/market/grok-imagine-image-2-0/text-to-image),",
    "[`grok-imagine-image-2-0/segment-map`](https://docs.kie.ai/market/grok-imagine-image-2-0/segment-map),",
    "and",
    "[`grok-imagine-image-2-0/image-edit`](https://docs.kie.ai/market/grok-imagine-image-2-0/image-edit).",
    "",
    "Text-to-image requires both a prompt and an `aspect_ratio`:",
    "",
    "```typescript",
    "async function waitForSuccess(taskId: string): Promise<string> {",
    "  for (let attempt = 0; attempt < 180; attempt++) {",
    "    const details = await kie.get.api.v1.jobs.recordInfo(taskId);",
    '    const state = details.data?.state ?? "waiting";',
    '    if (state === "success") return details.data?.resultJson ?? "{}";',
    '    if (state === "fail") throw new Error(`KIE task ${taskId} failed`);',
    "    await new Promise((resolve) => setTimeout(resolve, 5_000));",
    "  }",
    '  throw new Error(`KIE task ${taskId} timed out`);',
    "}",
    "",
    "const textTask = await kie.post.api.v1.jobs.createTask({",
    '  model: "grok-imagine-image-2-0/text-to-image",',
    "  input: {",
    '    prompt: "A white cat with mismatched yellow and blue eyes",',
    '    aspect_ratio: "1:1",',
    "  },",
    "});",
    "const sourceTaskId = textTask.data?.taskId;",
    'if (!sourceTaskId) throw new Error("KIE did not return a taskId");',
    "await waitForSuccess(sourceTaskId);",
    "```",
    "",
    "Segment-map consumes that source task. After polling the segment task to",
    "`success`, select an index of 1 or greater from its `segments` output and",
    "pass it to image-edit using Kie's upstream `mask_indexs` spelling:",
    "",
    "```typescript",
    "const segmentTask = await kie.post.api.v1.jobs.createTask({",
    '  model: "grok-imagine-image-2-0/segment-map",',
    "  input: { task_id: sourceTaskId },",
    "});",
    "const segmentTaskId = segmentTask.data?.taskId;",
    'if (!segmentTaskId) throw new Error("KIE did not return a taskId");',
    "",
    "const segmentResultJson = await waitForSuccess(segmentTaskId);",
    "const segmentResult = JSON.parse(segmentResultJson) as {",
    "  resultObject?: { segments?: Array<{ index: number }> };",
    "};",
    "const maskIndex = segmentResult.resultObject?.segments?.find(",
    "  ({ index }) => index >= 1,",
    ")?.index;",
    'if (maskIndex === undefined) throw new Error("No editable segment");',
    "",
    "const editTask = await kie.post.api.v1.jobs.createTask({",
    '  model: "grok-imagine-image-2-0/image-edit",',
    "  input: {",
    '    prompt: "Give the cat a red bow tie",',
    "    task_id: sourceTaskId,",
    "    mask_indexs: [maskIndex],",
    "  },",
    "});",
    "console.log(editTask.data?.taskId);",
    "```",
    "",
  ].join("\n");
}

// Mined from tests/recordings/elevenlabs_2379486140/sound-generation_*/ and
// tests/recordings/elevenlabs_2379486140/speech-to-text_*/ — the same calls
// that elevenlabs-sound-generation.test.ts and elevenlabs-speech-to-text.test.ts
// replay end-to-end.
function renderElevenlabsExample() {
  return [
    "## Real-world example: generate a sound effect, then run it through Scribe v2",
    "",
    "ElevenLabs' two flagship audio surfaces fit together cleanly: text-to-",
    "sound-effects spits out raw MP3 bytes, and Scribe v2 hands back a typed",
    "transcript with word-level timestamps plus tagged audio events. The",
    "round-trip below — generate a UI click, then transcribe a separate clip",
    "with `tag_audio_events: true` — mirrors what",
    "[`tests/integration/elevenlabs-sound-generation.test.ts`](../../../tests/integration/elevenlabs-sound-generation.test.ts)",
    "and",
    "[`tests/integration/elevenlabs-speech-to-text.test.ts`](../../../tests/integration/elevenlabs-speech-to-text.test.ts)",
    "replay against",
    "[`tests/recordings/elevenlabs_2379486140/`](../../../tests/recordings/elevenlabs_2379486140/),",
    "so every payload, response field, and byte count below comes straight",
    "from the recorded HARs.",
    "",
    "```typescript",
    'import { readFileSync, writeFileSync } from "node:fs";',
    'import { createElevenLabs } from "@apicity/elevenlabs";',
    'import type { ElevenLabsTranscript } from "@apicity/elevenlabs";',
    "",
    "const elevenlabs = createElevenLabs({ apiKey: process.env.ELEVENLABS_API_KEY! });",
    "",
    "// 1. Generate a 0.5s UI click. soundGeneration returns the raw MP3 as",
    "//    an ArrayBuffer — there's no JSON wrapper, the response body is",
    "//    audio/mpeg straight off the wire. duration_seconds (0.5–30) caps",
    "//    the clip length and prompt_influence (0–1) trades prompt-fidelity",
    "//    for creative variation. The factory also accepts `output_format`",
    "//    on the same request object and silently moves it to the URL query.",
    "const audio = await elevenlabs.v1.soundGeneration({",
    '  text: "soft ui click",',
    "  duration_seconds: 0.5,",
    "  prompt_influence: 0.3,",
    "});",
    "",
    'writeFileSync("./click.mp3", new Uint8Array(audio));',
    "console.log(`Generated ${audio.byteLength} bytes of audio/mpeg`);",
    '// → "Generated 11764 bytes of audio/mpeg"',
    "//   ElevenLabs charged 10 characters for this call (visible in the",
    "//   `character-cost` response header on the original request).",
    "",
    "// 2. Transcribe a separate audio clip with Scribe v2. The request goes",
    "//    up as multipart/form-data — pass a Blob and the rest as ergonomic",
    "//    fields; the factory packs the form, sets xi-api-key, and parses",
    "//    the JSON response. tag_audio_events: true tells Scribe to surface",
    "//    non-speech events ([phone beeping], [laughter], [applause]) inline",
    "//    with words instead of dropping them.",
    'const phoneBeep = readFileSync("./phone-beeping.mp3"); // 2,528 bytes',
    'const file = new Blob([phoneBeep], { type: "audio/mp3" });',
    "",
    "const result = (await elevenlabs.v1.speechToText({",
    "  file,",
    '  model_id: "scribe_v2",',
    '  language_code: "eng",',
    "  tag_audio_events: true,",
    "})) as ElevenLabsTranscript;",
    "",
    "// 3. The transcript is rich. `text` is the human-readable form;",
    "//    `words` is the per-token breakdown with absolute timestamps and a",
    '//    `type` discriminator ("word" | "spacing" | "audio_event") plus a',
    "//    `logprob` confidence. `transcription_id` is durable — you can",
    "//    retrieve the same transcript later through the history API.",
    "console.log(",
    "  `${result.language_code} · ${(result.language_probability * 100).toFixed(0)}% confident`,",
    ");",
    '// → "eng · 100% confident"',
    "console.log(",
    "  `${result.audio_duration_secs}s · transcription_id=${result.transcription_id}`,",
    ");",
    '// → "0.5s · transcription_id=CeeidI2QJ8kkN1mcq8HX"',
    "console.log(result.text);",
    '// → "[phone beeping]"',
    "",
    "// 4. Walk the words array, splitting audio events from spoken words",
    "//    via the `type` discriminator. On a clip with no speech every",
    '//    entry is an audio_event; on real speech you\'ll see "word" and',
    '//    "spacing" entries interleaved with bracketed events.',
    "for (const w of result.words) {",
    "  const tag =",
    '    w.type === "audio_event"',
    '      ? "event"',
    '      : w.type === "word"',
    '        ? "word "',
    '        : "space";',
    "  console.log(",
    "    `  ${tag}  [${w.start.toFixed(2)}–${w.end.toFixed(2)}s]  ${w.text}` +",
    '      (w.logprob !== undefined ? ` (logprob ${w.logprob.toFixed(3)})` : ""),',
    "  );",
    "}",
    '// → "  event  [0.00–0.44s]  [phone beeping] (logprob -0.335)"',
    "```",
    "",
    "**Notes**",
    "",
    "- `soundGeneration` returns binary, not JSON — the provider already",
    "  reads it as `arrayBuffer()` and hands you an `ArrayBuffer`. Pass",
    '  `output_format: "mp3_44100_128"` (or any other ElevenLabs codec',
    "  string) on the request object and the factory will strip it from",
    "  the body and move it to the `?output_format=` URL query.",
    "- `speechToText` accepts either a `file` Blob or a `cloud_storage_url`",
    "  (S3/GCS/HTTP). For long-form audio set `webhook: true` — the call",
    "  returns a small `ElevenLabsWebhookAcknowledgement` instead of the",
    "  transcript, and the finished result is delivered to your registered",
    '  webhook. Type-narrow the union with `"text" in result` before',
    "  reading transcript fields.",
    "- Set `diarize: true` and `num_speakers` to label words by speaker;",
    "  the per-word `speaker_id` field gets populated in that mode. Combine",
    "  with `use_multi_channel: true` for stereo audio and the response",
    "  switches to `ElevenLabsMultichannelTranscript` (one transcript per",
    "  channel under `transcripts[]`).",
    "- Errors throw `ElevenLabsError` with `status`, `code`, and the parsed",
    "  body attached. ElevenLabs returns either FastAPI's",
    "  `{ detail: [{msg, ...}] }` shape or `{ detail: { status, message } }`;",
    "  the client normalises both into `error.message`.",
    "",
  ].join("\n");
}

// Mirrors tests/integration/ig-post-video.test.ts — the same flow that
// will record into tests/recordings/ig_*/post-video_*/recording.har once
// an IG_ACCESS_TOKEN + IG_USER_ID land in 1Password. The catbox upload
// step IS already recorded under tests/recordings/free_2578706139/, so
// the public-URL handoff between @apicity/free-media-upload and @apicity/meta is real.
// IG container/post ids below use Meta's 17-digit format as illustrative
// values — the exact ids vary per call.
function renderIgExample() {
  return [
    "## Real-world example: publish a Reel via the public-URL flow",
    "",
    "Instagram's Graph API doesn't take video bytes directly — Meta needs a",
    "publicly reachable URL it can `GET` and transcode asynchronously. The",
    "snippet below chains `@apicity/free-media-upload` (catbox public hosting, free + zero",
    "auth) into `@apicity/meta` to land an `mp4` on disk as a published Reel,",
    "mirroring",
    "[`tests/integration/ig-post-video.test.ts`](../../../tests/integration/ig-post-video.test.ts)",
    "step-for-step. The catbox upload replays against",
    "[`tests/recordings/free_2578706139/`](../../../tests/recordings/free_2578706139/);",
    "the IG calls land in `tests/recordings/ig_*/post-video_*/recording.har`",
    "once a Business/Creator account's `IG_ACCESS_TOKEN` is recorded.",
    "",
    "```typescript",
    'import { readFileSync } from "node:fs";',
    'import { createMeta } from "@apicity/meta";',
    'import { createFreeMediaUpload } from "@apicity/free-media-upload";',
    "",
    "const meta = createMeta({ accessToken: process.env.IG_ACCESS_TOKEN! });",
    'const igUserId = process.env.IG_USER_ID!; // 17-digit numeric, e.g. "17841471234567890"',
    "",
    "// 1. Host the mp4 publicly. catbox.moe is auth-free and persistent —",
    "//    Meta's transcode worker will fetch this URL once during step 2,",
    "//    so any host that returns the bytes within ~30s works (S3 presigned",
    "//    URL, R2, your own CDN). @apicity/free-media-upload wraps the multipart upload",
    "//    and returns the resolved file URL as a string.",
    'const bytes = readFileSync("./jump.mp4");',
    'const blob = new Blob([bytes], { type: "video/mp4" });',
    "",
    "const freeMediaUpload = createFreeMediaUpload({});",
    "const videoUrl = await free.catbox.upload({",
    "  file: blob,",
    '  filename: "jump.mp4",',
    "});",
    "console.log(videoUrl);",
    '// → "https://files.catbox.moe/nn9sei.mp4"',
    "//   catbox returns a permanent public URL of the form",
    "//   `https://files.catbox.moe/<6char>.<ext>` — that's what Meta will GET.",
    "",
    "// 2. Create a media container. For Reels you must pass `media_type:",
    '//    "REELS"` (NOT "VIDEO" — that\'s the legacy IGTV path Meta',
    "//    deprecated in 2024). The container is a server-side handle: Meta",
    "//    queues the transcode against `video_url` and returns its id",
    "//    immediately. Containers expire 24h after creation if you don't",
    "//    publish them.",
    "const container = await ig.post.v25.media(igUserId, {",
    '  media_type: "REELS",',
    "  video_url: videoUrl,",
    '  caption: "jump #reels",',
    "});",
    "console.log(container.id);",
    '// → "17889012345678901" (17-digit container id)',
    "",
    "// 3. Poll the container's status_code until it leaves IN_PROGRESS.",
    "//    The state machine is IN_PROGRESS → FINISHED on success;",
    "//    FINISHED is the only state media_publish accepts. ERROR and",
    "//    EXPIRED are terminal failure states; PUBLISHED is what you'll",
    "//    see if you re-poll AFTER calling media_publish. The `fields`",
    "//    query param is required — by default the GET only returns `id`.",
    'let statusCode: string = "IN_PROGRESS";',
    'while (statusCode === "IN_PROGRESS") {',
    "  await new Promise((r) => setTimeout(r, 5000));",
    "  const s = await ig.get.v25.container(container.id, {",
    '    fields: "status_code,status",',
    "  });",
    '  statusCode = s.status_code ?? "FINISHED";',
    '  if (statusCode === "ERROR" || statusCode === "EXPIRED") {',
    "    throw new Error(`container ${container.id} ${statusCode}: ${s.status}`);",
    "  }",
    "}",
    '// statusCode → "FINISHED"',
    '// s.status   → "Finished: Media is ready to be published."',
    "",
    "// 4. Publish. media_publish takes the container id (NOT the media url)",
    "//    and returns the new post's id — that's the permanent ig_id you'd",
    "//    use to construct an https://www.instagram.com/reel/<shortcode>/",
    "//    URL or to query insights later via Graph API.",
    "const post = await ig.post.v25.mediaPublish(igUserId, {",
    "  creation_id: container.id,",
    "});",
    "console.log(post.id);",
    '// → "17912345678901234" (17-digit post id, distinct from container id)',
    "```",
    "",
    "**Notes**",
    "",
    "- Meta requires a **Business** or **Creator** Instagram account plus a",
    "  Meta App approved for `instagram_business_content_publish`. Personal",
    '  accounts get `190` ("Invalid OAuth access token") even with a',
    "  syntactically valid token.",
    "- `video_url` must be reachable from Meta's IPs and serve `Content-Type:",
    "  video/mp4`. Common gotchas: presigned S3 URLs that expire before the",
    "  transcoder pulls, hosts that require a `User-Agent`, and CDNs that",
    "  redirect to a different origin. catbox.moe sidesteps all three.",
    "- The Reel itself must satisfy Meta's Reel constraints — 9:16 aspect,",
    "  3–90s duration, ≤ 1GB, H.264 video, AAC audio. Mismatches surface as",
    '  `status_code: "ERROR"` during the poll, with the human-readable',
    '  reason in `status` (e.g. `"Error: The video is too short."`).',
    "- Containers and posts use **distinct** 17-digit ids. The container id",
    "  is throwaway — you only need it for the GET poll and the subsequent",
    "  `media_publish` `creation_id`. The post id is permanent and survives",
    "  user deletion of the post.",
    "- Errors throw `MetaError` with `status` (HTTP code), `body` (the parsed",
    "  Meta error envelope), and an optional `code`. Meta's two error shapes",
    "  — `error.error_user_msg` for user-facing validation and `error.message`",
    "  for everything else — are both surfaced in `MetaError.message`, so a",
    "  single `try/catch` reads naturally.",
    "",
  ].join("\n");
}

function renderIgSetup() {
  return [
    "## Setup",
    "",
    "Instagram requires a **long-lived (60-day) user access token** from the",
    "Instagram Login OAuth flow. The token is bound to a specific Instagram",
    "Business or Creator account; personal accounts have no programmatic",
    "publishing access.",
    "",
    "### 1. Configure your Meta App",
    "",
    "Open [developers.facebook.com](https://developers.facebook.com), create a",
    "new app (type: **Business**), then add the **Instagram** product.",
    "Choose **API setup with Instagram login** and configure:",
    "",
    "- Valid OAuth Redirect URI: `http://127.0.0.1:8765/callback`",
    "- Permissions: `instagram_business_basic` + `instagram_business_content_publish`",
    "- Save the **Instagram App ID** and **Instagram App Secret**",
    "",
    "### 2. Verify Instagram account type",
    "",
    "The Instagram account you're publishing to must be **Business** or",
    "**Creator** (not Personal). Switch in the Instagram mobile app under",
    "Settings → Account type and tools. No Facebook Page link is required",
    "for the Instagram Login flow.",
    "",
    "### 3. Mint a long-lived access token",
    "",
    "Save the script below as `mint-ig-token.mjs` and run it:",
    "",
    "```bash",
    "IG_CLIENT_ID=<your-instagram-app-id> \\",
    "IG_CLIENT_SECRET=<your-instagram-app-secret> \\",
    "  node mint-ig-token.mjs",
    "```",
    "",
    "It prints an authorize URL — open it, click **Allow**, and the helper",
    "captures the redirect on `127.0.0.1:8765`, exchanges the code for a",
    "short-lived token, then upgrades it to a long-lived (60-day) token and",
    "prints `{ access_token, user_id, expires_in }`. Save both `access_token`",
    "and `user_id` — you need both to call the API.",
    "",
    "<details>",
    "<summary><code>mint-ig-token.mjs</code> — zero-dep OAuth 2.0 helper</summary>",
    "",
    "```javascript",
    'import http from "node:http";',
    'import crypto from "node:crypto";',
    "",
    "const CLIENT_ID = process.env.IG_CLIENT_ID;",
    "const CLIENT_SECRET = process.env.IG_CLIENT_SECRET;",
    'const REDIRECT = "http://127.0.0.1:8765/callback";',
    "const SCOPES = [",
    '  "instagram_business_basic",',
    '  "instagram_business_content_publish",',
    '].join(",");',
    "",
    "if (!CLIENT_ID || !CLIENT_SECRET) {",
    '  console.error("Set IG_CLIENT_ID and IG_CLIENT_SECRET");',
    "  process.exit(1);",
    "}",
    "",
    'const state = crypto.randomBytes(16).toString("hex");',
    'const authURL = new URL("https://www.instagram.com/oauth/authorize");',
    'authURL.searchParams.set("client_id", CLIENT_ID);',
    'authURL.searchParams.set("redirect_uri", REDIRECT);',
    'authURL.searchParams.set("response_type", "code");',
    'authURL.searchParams.set("scope", SCOPES);',
    'authURL.searchParams.set("state", state);',
    "",
    'console.log("Open this URL and click Allow:\\n" + authURL.toString());',
    "",
    "const server = http.createServer(async (req, res) => {",
    "  const url = new URL(req.url, REDIRECT);",
    '  if (!url.pathname.startsWith("/callback")) {',
    "    res.writeHead(404).end();",
    "    return;",
    "  }",
    '  const code = url.searchParams.get("code");',
    '  if (!code || url.searchParams.get("state") !== state) {',
    '    res.writeHead(400).end("bad state");',
    "    server.close();",
    "    process.exit(1);",
    "  }",
    "",
    "  // 1. short-lived",
    "  const shortRes = await fetch(",
    '    "https://api.instagram.com/oauth/access_token",',
    "    {",
    '      method: "POST",',
    '      headers: { "Content-Type": "application/x-www-form-urlencoded" },',
    "      body: new URLSearchParams({",
    "        client_id: CLIENT_ID,",
    "        client_secret: CLIENT_SECRET,",
    '        grant_type: "authorization_code",',
    "        redirect_uri: REDIRECT,",
    "        code,",
    "      }),",
    "    }",
    "  );",
    "  const short = await shortRes.json();",
    "",
    "  // 2. long-lived (60-day)",
    '  const longURL = new URL("https://graph.instagram.com/access_token");',
    '  longURL.searchParams.set("grant_type", "ig_exchange_token");',
    '  longURL.searchParams.set("client_secret", CLIENT_SECRET);',
    '  longURL.searchParams.set("access_token", short.access_token);',
    "  const longRes = await fetch(longURL);",
    "  const long = await longRes.json();",
    "",
    "  console.log(JSON.stringify({",
    "    access_token: long.access_token,",
    "    expires_in: long.expires_in,",
    "    user_id: short.user_id,",
    "  }, null, 2));",
    '  res.writeHead(200).end("Authorized — check your terminal.");',
    "  server.close();",
    "});",
    "",
    'server.listen(8765, "127.0.0.1");',
    "```",
    "",
    "</details>",
    "",
    "### 4. Use the token",
    "",
    "```typescript",
    'import { createMeta } from "@apicity/meta";',
    "",
    "const meta = createMeta({ accessToken: process.env.IG_ACCESS_TOKEN });",
    "const igUserId = process.env.IG_USER_ID;",
    "",
    "// Public-URL flow: host the mp4 somewhere (e.g. via @apicity/free-media-upload) and",
    "// pass its URL. Meta GETs the video and processes it asynchronously.",
    "const container = await ig.post.v25.media(igUserId, {",
    '  media_type: "REELS",',
    '  video_url: "https://example.com/clip.mp4",',
    '  caption: "hello from @apicity/meta",',
    "});",
    "",
    "// Poll until the container is ready.",
    'let status = "IN_PROGRESS";',
    'while (status === "IN_PROGRESS") {',
    "  await new Promise((r) => setTimeout(r, 5000));",
    "  const s = await ig.get.v25.container(container.id, {",
    '    fields: "status_code,status",',
    "  });",
    '  status = s.status_code ?? "FINISHED";',
    "}",
    "",
    "// Publish.",
    "const post = await ig.post.v25.mediaPublish(igUserId, {",
    "  creation_id: container.id,",
    "});",
    "console.log(post.id);",
    "```",
    "",
  ].join("\n");
}

// Mined from tests/recordings/alibaba_1329897167/wan-i2v_2196817451/
// (POST /api/v1/services/aigc/video-generation/video-synthesis +
// 8 GET /api/v1/tasks/{taskId} polls against wan2.7-i2v) — the same
// async submit/poll round-trip that alibaba-wan-i2v.test.ts replays.
// Every task_id, timestamp, prompt, and resolution below is a verbatim
// slice of that HAR.
function renderAlibabaExample() {
  return [
    "## Real-world example: Wan 2.7 image-to-video with async task polling",
    "",
    "DashScope's `aigc/*` family is async-by-default: every video, image, and",
    "audio generation endpoint returns immediately with a `task_id` and a",
    "`task_status` of `PENDING`, and the actual artifact lives behind a",
    "separate `GET /api/v1/tasks/{taskId}` you poll until it transitions to",
    "`SUCCEEDED`. The provider hides the `X-DashScope-Async: enable` header",
    "plumbing but keeps the two-call shape visible because it lets you",
    "checkpoint the `task_id`, walk away, and resume later from any process.",
    "The example below mines every `task_id`, timestamp, prompt, and resolution",
    "from",
    "[`tests/recordings/alibaba_1329897167/wan-i2v_2196817451/`](../../../tests/recordings/alibaba_1329897167/wan-i2v_2196817451/),",
    "which is the HAR replayed by",
    "[`tests/integration/alibaba-wan-i2v.test.ts`](../../../tests/integration/alibaba-wan-i2v.test.ts).",
    "",
    "```typescript",
    'import { readFileSync } from "node:fs";',
    'import { createAlibaba, AlibabaError } from "@apicity/alibaba";',
    "import type {",
    "  AlibabaVideoSynthesisSubmitResponse,",
    "  AlibabaTaskStatusResponse,",
    "  AlibabaTaskStatus,",
    '} from "@apicity/alibaba";',
    "",
    "const alibaba = createAlibaba({",
    "  apiKey: process.env.DASHSCOPE_API_KEY!,",
    "  // The SUCCEEDED-path round-trip in the recording is ~47s wall-clock;",
    "  // bump the per-request timeout above the default 30s so the submit",
    "  // call doesn't fight a slow scheduling spike.",
    "  timeout: 60_000,",
    "});",
    "",
    "// 1. Inline the source frame as a `data:` URL. DashScope also accepts",
    "//    https:// URLs and `oss://` URIs (the latter only when the request",
    "//    carries `X-DashScope-OssResourceResolve: enable`, which the",
    "//    provider sets automatically on every aigc/* call). Inlining is the",
    "//    zero-infra path — no public bucket, no presigned URL — at the cost",
    "//    of paying the upload bytes once per submit.",
    'const frame = readFileSync("./cat.jpg");',
    'const dataUrl = `data:image/jpeg;base64,${frame.toString("base64")}`;',
    "",
    '// 2. `media[].type: "first_frame"` is the I2V kick-off — Wan animates',
    "//    forward from the still. Other media types in the same array slot",
    "//    drive different conditioning modes: `last_frame` (animate",
    "//    backward), `first_clip` (continue a video), `reference` (style",
    "//    transfer). The Zod schema enforces that `first_frame` cannot",
    "//    coexist with `first_clip` and that exactly one of each type is",
    "//    present — invalid combinations fail at `.schema.safeParse(...)`",
    "//    before a single byte hits the wire.",
    "//",
    "// 3. `prompt_extend: true` runs the prompt through DashScope's",
    "//    server-side prompt-enhancement model first, which materially",
    "//    improves motion fidelity on terse prompts like the one below.",
    "//    The enhanced prompt is echoed back in the SUCCEEDED response as",
    "//    `actual_prompt` so you can audit what actually got rendered.",
    "//    `watermark: false` removes the corner badge — silently ignored",
    "//    on tiers that don't permit it.",
    "const submit: AlibabaVideoSynthesisSubmitResponse =",
    "  await alibaba.post.api.v1.services.aigc.videoGeneration.videoSynthesis({",
    '    model: "wan2.7-i2v",',
    "    input: {",
    "      prompt:",
    '        "The odd-eyed white cat blinks slowly, whiskers twitching, " +',
    '        "then turns its head toward the camera",',
    '      media: [{ type: "first_frame", url: dataUrl }],',
    "    },",
    "    parameters: {",
    '      resolution: "720P",',
    "      duration: 5,",
    "      prompt_extend: true,",
    "      watermark: false,",
    "    },",
    "  });",
    "",
    "console.log(",
    "  `task=${submit.output.task_id} status=${submit.output.task_status}`,",
    ");",
    '// → "task=5a674d6b-6a42-4b07-98bb-147ba79879ea status=PENDING"',
    "",
    "// 4. Poll until terminal. The status state machine is",
    "//    PENDING → RUNNING → (SUCCEEDED | FAILED | CANCELED), with",
    "//    SUSPENDED as a transient quota-bound retry state. Treat anything",
    '//    not in TERMINAL as "keep polling." A 5–10s interval matches the',
    "//    server-side scheduling cadence — the recorded run did 8 polls",
    "//    over ~47s, so faster polling just burns rate-limit budget without",
    "//    moving the task forward.",
    "const TERMINAL: ReadonlyArray<AlibabaTaskStatus> = [",
    '  "SUCCEEDED",',
    '  "FAILED",',
    '  "CANCELED",',
    "];",
    "let status: AlibabaTaskStatusResponse = await alibaba.get.api.v1.tasks(",
    "  submit.output.task_id,",
    ");",
    "while (!TERMINAL.includes(status.output.task_status)) {",
    "  await new Promise((r) => setTimeout(r, 5000));",
    "  status = await alibaba.get.api.v1.tasks(submit.output.task_id);",
    "}",
    "",
    "// 5. The task-status response shape *grows* as the task progresses —",
    "//    `submit_time` and `scheduled_time` appear once it leaves PENDING;",
    "//    `end_time`, `orig_prompt`, `video_url`, and `usage` only land on",
    "//    SUCCEEDED. `code` and `message` populate on FAILED. Always branch",
    "//    on `task_status` before reading the success-only fields, since",
    "//    they're typed `string | undefined`.",
    'if (status.output.task_status !== "SUCCEEDED") {',
    "  throw new AlibabaError(",
    "    `i2v task ${status.output.task_id} ${status.output.task_status}: ` +",
    '      `${status.output.code ?? "?"}: ${status.output.message ?? "?"}`,',
    "    500,",
    "    status.output,",
    "    status.output.code,",
    "  );",
    "}",
    "",
    "console.log(status.output.video_url);",
    '// → "https://dashscope-a717.oss-accelerate.aliyuncs.com/.../70873660-metadata_user_a54afaea6b53dd4e.mp4?Expires=1776489167&..."',
    "",
    "const elapsed =",
    "  new Date(status.output.end_time!).getTime() -",
    "  new Date(status.output.submit_time!).getTime();",
    "console.log(",
    "  `model=wan2.7-i2v ${status.usage!.SR}p×${status.usage!.output_video_duration}s ` +",
    "    `elapsed=${(elapsed / 1000).toFixed(1)}s videos=${status.usage!.video_count}`,",
    ");",
    '// → "model=wan2.7-i2v 720p×5s elapsed=47.4s videos=1"',
    "```",
    "",
    "**Notes**",
    "",
    "- The returned `video_url` is a presigned OSS URL with a short",
    "  `Expires=` window (≈1 hour in the recording above) — download or",
    "  re-host it immediately, don't store the URL itself. The bucket is",
    "  hosted on `oss-accelerate.aliyuncs.com`, which fronts an Alibaba CDN",
    "  that resolves close to the caller; no auth header is required for the",
    "  GET.",
    "- The submit call is *cheap* even when the task later FAILS — billing",
    "  is only charged on SUCCEEDED tasks per `usage.duration` (seconds of",
    "  output video). A failed content-safety screen (`code:",
    '  "DataInspectionFailed"`) on the input frame returns a SUCCEEDED-shape',
    '  HTTP 200 with `task_status: "FAILED"`, not a 4xx — this is why the',
    "  example above always reads `task_status` rather than relying on",
    "  exception flow for content-related rejects.",
    "- The same `videoSynthesis` endpoint dispatches across the entire Wan",
    "  2.7 family by changing `model`: `wan2.7-i2v` for image→video,",
    "  `wan2.7-t2v` for text→video (drop the `media` array), and",
    "  `wan2.7-videoedit` for video-style transfer (use `media[].type:",
    '  "video"`). The Zod schema enforces the per-model media-type',
    "  combinations — `videoedit` requires a `video` entry, `i2v` requires",
    "  `first_frame` or `first_clip`, etc.",
    "- For payloads where the input frame exceeds DashScope's 10MB",
    "  embedded-data-URL ceiling, swap the inline `data:` URL for an",
    "  `oss://{key}` URI obtained via `uploadFile(provider, {...})` — the",
    "  exported helper does the `getPolicy` + multipart OSS PostObject",
    "  dance and returns the URI ready to drop into `media[].url`. The",
    "  `X-DashScope-OssResourceResolve` header is set automatically on",
    "  every aigc/* call so the URI resolves server-side.",
    "- Errors throw `AlibabaError` with `status` and the parsed `body`. The",
    "  native aigc error shape (`{code, message, request_id}`) is surfaced",
    "  in `error.code` — wrap with `withRetry` from `@apicity/alibaba` for",
    '  `429` / `503`, but skip retries on `code === "DataInspectionFailed"`',
    '  / `"InvalidParameter"` since those are deterministic rejects.',
    "",
  ].join("\n");
}

// Mined from
// tests/recordings/anthropic_2966493235/messages-code-review_891889396/
// (POST /v1/messages against claude-sonnet-4-6 with a system prompt and a
// three-turn user/assistant/user transcript). The same call replays in
// tests/integration/anthropic-messages-code-review.test.ts. Every model id,
// token count, stop_reason, and content block in the snippet below is taken
// verbatim from that HAR, recorded directly against api.anthropic.com.
function renderAnthropicExample() {
  return [
    "## Real-world example: multi-turn TypeScript review with system prompt + few-shot priming",
    "",
    "The single biggest knob the Anthropic Messages API gives you is the",
    "`messages` array itself: every prior turn is grist for the next one.",
    "Pair that with a strict `system` prompt to lock the output format and",
    "one priming exchange to demonstrate the format, and you get a",
    "deterministic-looking single-line bug reviewer out of `claude-sonnet-4-6`",
    "without any tools, no JSON-mode, no fine-tune. Every token, model id,",
    "and content block below is mined from",
    "[`tests/recordings/anthropic_2966493235/messages-code-review_891889396/`](../../../tests/recordings/anthropic_2966493235/messages-code-review_891889396/),",
    "the HAR replayed by",
    "[`tests/integration/anthropic-messages-code-review.test.ts`](../../../tests/integration/anthropic-messages-code-review.test.ts)",
    "— recorded straight against `https://api.anthropic.com/v1/messages` with",
    "the typed `@apicity/anthropic` client.",
    "",
    "````typescript",
    'import { createAnthropic } from "@apicity/anthropic";',
    "import type {",
    "  AnthropicMessageResponse,",
    "  AnthropicTextBlock,",
    '} from "@apicity/anthropic";',
    "",
    "const anthropic = createAnthropic({",
    "  apiKey: process.env.ANTHROPIC_API_KEY!,",
    "});",
    "",
    "// 1. The `system` field is a hard contract for response shape — Claude",
    "//    treats it as higher-priority instruction than anything in",
    '//    `messages`. Spelling out the exact line format here ("BUG: <one',
    '//    sentence>", no preamble, no Markdown) is what stops the model',
    '//    from wrapping the answer in "Sure! Here\'s the bug:" or fenced',
    "//    code, which it does by default.",
    "//",
    "// 2. The `messages` array is a *transcript*, not a single prompt. The",
    "//    one-shot user→assistant pair below primes the format on a known",
    "//    bug (off-by-one in a loop bound) so the third turn answers in",
    "//    the same shape on a code snippet the model has not seen before.",
    "//    This is few-shot prompting; no fine-tuning required.",
    "const result: AnthropicMessageResponse = await anthropic.v1.messages({",
    '  model: "claude-sonnet-4-6",',
    "  max_tokens: 256,",
    "  system:",
    '    "You are a senior TypeScript reviewer. Reply with exactly one line " +',
    "    \"in the form: 'BUG: <one-sentence summary>'. No preamble, no code, \" +",
    '    "no Markdown.",',
    "  messages: [",
    "    {",
    '      role: "user",',
    "      content:",
    '        "Review this:\\n```ts\\nfunction firstNonEmpty(xs: string[]): string {\\n" +',
    '        "  for (let i = 0; i <= xs.length; i++) {\\n" +',
    '        "    if (xs[i]) return xs[i];\\n" +',
    "        \"  }\\n  return '';\\n}\\n```\",",
    "    },",
    "    {",
    '      role: "assistant",',
    "      content:",
    '        "BUG: The loop condition `i <= xs.length` reads one past the " +',
    '        "last index, so `xs[xs.length]` is dereferenced as undefined.",',
    "    },",
    "    {",
    '      role: "user",',
    "      content:",
    '        "Now review this one the same way:\\n```ts\\n" +',
    '        "async function readAll(stream: ReadableStream<Uint8Array>): " +',
    '        "Promise<Uint8Array> {\\n" +',
    '        "  const reader = stream.getReader();\\n" +',
    '        "  const chunks: Uint8Array[] = [];\\n" +',
    '        "  while (true) {\\n" +',
    '        "    const { done, value } = await reader.read();\\n" +',
    '        "    if (done) break;\\n    chunks.push(value);\\n  }\\n" +',
    '        "  return Buffer.concat(chunks);\\n}\\n```",',
    "    },",
    "  ],",
    "});",
    "",
    "// 3. `content` is always an array of typed blocks, never a single",
    "//    string. This is the same shape Claude returns when there are",
    "//    `tool_use`, `thinking`, or `image` blocks in the response —",
    "//    treating it uniformly here means tool-using and thinking",
    "//    workflows drop in without restructuring the read path.",
    "const text = result.content",
    '  .filter((b): b is AnthropicTextBlock => b.type === "text")',
    "  .map((b) => b.text)",
    '  .join("")',
    "  .trim();",
    "",
    "console.log(text);",
    '// → "BUG: The reader is never released via `reader.releaseLock()`',
    '//    (especially on error), leaving the stream permanently locked."',
    "",
    "console.log(",
    "  `model=${result.model} stop=${result.stop_reason} ` +",
    "    `in=${result.usage.input_tokens} out=${result.usage.output_tokens}`,",
    ");",
    '// → "model=claude-sonnet-4-6 stop=end_turn in=268 out=33"',
    "````",
    "",
    "**Notes**",
    "",
    "- The `system` prompt is treated as a soft-but-strong constraint on",
    "  every turn, not just the first — Claude re-applies it as the",
    "  conversation lengthens, so the format won't drift after 10 turns",
    "  the way a single user-message instruction will. Pass it as a string",
    '  for short rules; pass it as `[{ type: "text", text, cache_control:',
    '  { type: "ephemeral" } }]` to mark it as cacheable when you reuse',
    "  the same long system prompt across many requests.",
    "- Few-shot priming via a fake `assistant` turn is the cheapest",
    "  reliable way to lock output formatting without `tools` or",
    "  structured-output APIs. Claude does not distinguish between turns",
    "  it actually generated and turns you wrote — both are equally",
    "  authoritative context. Keep priming turns *short and exact*; if",
    "  yours doesn't match the system rule character-for-character (e.g. a",
    "  trailing period the system says shouldn't be there), the model",
    "  will hedge.",
    "- `result.content` is a `(AnthropicTextBlock | AnthropicToolUseBlock |",
    "  AnthropicThinkingBlock | …)[]` discriminated union. Filter on",
    '  `b.type === "text"` before reading `.text`; on `b.type ===',
    '  "tool_use"` before reading `.input`; on `b.type === "thinking"`',
    "  before reading `.thinking`. Claude can interleave them in one",
    "  response — e.g. a leading text block, then a thinking block, then",
    "  a tool_use — so always iterate, never assume `content[0]`.",
    "- `usage.input_tokens` includes the *entire* transcript on every",
    "  turn, so a 10-turn conversation pays for the system prompt + 10",
    "  turns of history every time. To amortize a long system prompt",
    "  (>1024 tokens) across many calls, mark it `cache_control:",
    "  ephemeral` and watch `usage.cache_read_input_tokens` rise on calls",
    "  2–N.",
    "- Errors throw `AnthropicError` with `status`, the parsed `body`, and",
    '  the upstream `errorType` ("authentication_error",',
    '  "rate_limit_error", "overloaded_error", …). Wrap with `withRetry`',
    "  from `@apicity/anthropic` for `429` and `529 overloaded_error`,",
    "  which Claude returns under sustained load. Pair with `withFallback`",
    "  to roll over to `claude-haiku-4-5` for non-critical paths.",
    "- Point the same call at a Claude-compatible gateway by passing",
    "  `baseURL` (and a `fetch` wrapper if the backend uses a different",
    "  auth header than `x-api-key`) to `createAnthropic`. The factory's",
    "  request shape is upstream-faithful, so anything that speaks the",
    "  Anthropic Messages wire format — Bedrock proxies, third-party",
    "  gateways, local mocks — works without touching call sites.",
    "",
  ].join("\n");
}

// Mined from tests/recordings/fireworks_626462085/rerank-basic_678261817/
// (POST /v1/rerank against qwen3-reranker-8b) and
// tests/recordings/fireworks_626462085/chat-stream-hello_2801342443/
// (POST /v1/chat/completions with stream=true against llama-v3p3-70b-instruct)
// — the same calls that fireworks-rerank.test.ts and fireworks-stream.test.ts
// replay end-to-end. Every score, token count, and SSE shape below is a
// verbatim slice of those HARs.
function renderFireworksExample() {
  return [
    "## Real-world example: rerank candidate passages, then stream a Llama 3.3 70B answer",
    "",
    "Fireworks ships two inference surfaces that compose cleanly into a",
    "lightweight RAG pipeline: a hosted cross-encoder reranker (`qwen3-reranker-8b`)",
    "that scores a query against N candidate documents, and OpenAI-compatible",
    "streaming chat completions on Llama 3.3 70B Instruct. The rerank is the",
    "hard part — most providers only sell embeddings — and the streaming chat",
    "is the cheap, fast tail. The two-step flow below mirrors",
    "[`tests/integration/fireworks-rerank.test.ts`](../../../tests/integration/fireworks-rerank.test.ts)",
    "and",
    "[`tests/integration/fireworks-stream.test.ts`](../../../tests/integration/fireworks-stream.test.ts),",
    "which replay against",
    "[`tests/recordings/fireworks_626462085/rerank-basic_678261817/`](../../../tests/recordings/fireworks_626462085/rerank-basic_678261817/)",
    "and",
    "[`tests/recordings/fireworks_626462085/chat-stream-hello_2801342443/`](../../../tests/recordings/fireworks_626462085/chat-stream-hello_2801342443/),",
    "so every score, token count, and SSE shape below comes straight from",
    "the recorded HARs.",
    "",
    "```typescript",
    'import { createFireworks } from "@apicity/fireworks";',
    "import type {",
    "  FireworksRerankResponse,",
    "  FireworksChatStreamChunk,",
    '} from "@apicity/fireworks";',
    "",
    "const fireworks = createFireworks({ apiKey: process.env.FIREWORKS_API_KEY! });",
    "",
    "// 1. Cross-encoder rerank. The model sees the query and each document",
    "//    jointly (unlike embedding-based retrieval, which scores them",
    "//    independently), so it picks up phrasing-level signal that ANN",
    "//    search misses. `top_n` caps the response length; `return_documents:",
    "//    true` echoes the document text back inline so you can hand the",
    "//    top hit straight to a chat model without keeping a parallel",
    "//    id→text map.",
    "const ranked: FireworksRerankResponse =",
    "  await fireworks.inference.v1.rerank({",
    '    model: "fireworks/qwen3-reranker-8b",',
    '    query: "What is the capital of France?",',
    "    documents: [",
    '      "Berlin is the capital of Germany.",',
    '      "Paris is the capital and largest city of France.",',
    '      "Madrid is the capital of Spain.",',
    "    ],",
    "    top_n: 2,",
    "    return_documents: true,",
    "  });",
    "",
    "// 2. The response is sorted descending by relevance_score. The score",
    "//    spread is huge — Paris ~0.96, Berlin ~0.0001, Madrid dropped — a",
    "//    near-four-orders-of-magnitude gap that a cosine-similarity",
    "//    retriever could never produce. `index` points back into the",
    "//    original `documents` array.",
    "const top = ranked.data[0];",
    "console.log(`#1: index=${top.index}, score=${top.relevance_score.toFixed(4)}`);",
    'console.log(`    "${top.document}"`);',
    '// → "#1: index=1, score=0.9579"',
    '// →     "Paris is the capital and largest city of France."',
    "",
    "console.log(`model=${ranked.model}, tokens=${ranked.usage.prompt_tokens}`);",
    '// → "model=accounts/fireworks/models/qwen3-reranker-8b, tokens=261"',
    "",
    "// 3. Stream a chat answer through Llama 3.3 70B Instruct. The recorded",
    "//    call below is a generic 'say hello' smoke test — independent from",
    "//    the rerank above — but the request shape is exactly what you'd",
    "//    send in production: drop `top.document` into a system message and",
    "//    the user's original question into the user turn.",
    "//    `temperature: 0` makes the output deterministic; `max_tokens: 64`",
    "//    caps the response. The streaming surface lives under",
    "//    `post.stream.*` and yields OpenAI-shaped",
    "//    `chat.completion.chunk` objects.",
    'let answer = "";',
    "let finish: string | null = null;",
    "let totals = { prompt: 0, completion: 0 };",
    "",
    "const stream = fireworks.post.stream.inference.v1.chat.completions({",
    '  model: "accounts/fireworks/models/llama-v3p3-70b-instruct",',
    '  messages: [{ role: "user", content: "Say hello in one sentence." }],',
    "  temperature: 0,",
    "  max_tokens: 64,",
    "});",
    "",
    "for await (const chunk of stream) {",
    "  // 4. Each delta carries one or two tokens of `content`. The FIRST",
    "  //    delta carries `delta.role` and no content; the LAST delta has",
    '  //    no content but `finish_reason: "stop"` and final `usage`.',
    "  //    Read defensively — both fields are optional on every chunk.",
    '  const choice: FireworksChatStreamChunk["choices"][number] | undefined =',
    "    chunk.choices[0];",
    "  if (choice?.delta?.content) answer += choice.delta.content;",
    "  if (choice?.finish_reason) finish = choice.finish_reason;",
    "  if (chunk.usage) {",
    "    totals = {",
    "      prompt: chunk.usage.prompt_tokens,",
    "      completion: chunk.usage.completion_tokens,",
    "    };",
    "  }",
    "}",
    "",
    "console.log(answer);",
    "// → \"Hello, it's nice to meet you and I'm here to help with any questions or topics you'd like to discuss.\"",
    "console.log(",
    "  `finish=${finish}, prompt=${totals.prompt}, completion=${totals.completion}`,",
    ");",
    '// → "finish=stop, prompt=41, completion=26"',
    "```",
    "",
    "**Notes**",
    "",
    "- The reranker is a cross-encoder, not an embedding model — it",
    "  computes query-document interaction directly, so it's substantially",
    "  more accurate than cosine similarity over independent embeddings,",
    "  but it doesn't scale to millions of candidates. The standard hybrid",
    "  is embedding-based ANN to fetch a top-100, then `qwen3-reranker-8b`",
    "  to refine to a top-3. Fireworks hosts both halves on the same",
    "  domain (`/v1/embeddings` for the first stage, `/v1/rerank` for the",
    "  second).",
    "- Streaming chat chunks are OpenAI-compatible: `chat.completion.chunk`",
    "  with `choices[].delta` carrying incremental content. Watch",
    '  `finish_reason` to know whether you hit `"stop"`, `"length"`, or',
    '  `"content_filter"`. Only the **final** chunk has `usage` populated;',
    "  intermediate chunks have `usage: null`. Fireworks also surfaces a",
    "  per-call `fireworks-cached-prompt-tokens` response header — at 40",
    "  of 41 cached above, the prefix paid for itself almost entirely,",
    "  visible without parsing the body.",
    "- For Anthropic-shaped responses against the same Llama catalog, swap",
    "  to `fireworks.inference.v1.messages({...})`. The model id and pricing",
    '  match, but the response is `{ role, content: [{ type: "text", text }], ... }`',
    "  instead of `{ choices: [{ message: { content }}] }` — useful when",
    "  porting code already written against `@apicity/anthropic`.",
    "- For non-streaming completions, drop the `post.stream.` prefix:",
    "  `fireworks.inference.v1.chat.completions({...})` returns a single",
    "  `FireworksChatResponse` with `choices[0].message.content` populated",
    "  and full `usage` in one shot. Same payload schema, exposed at",
    "  `fireworks.inference.v1.chat.completions.schema` for runtime",
    "  validation before the call.",
    "- Errors throw `FireworksError` with `status` and the parsed body",
    "  attached. `400` from rerank usually means an empty/missing",
    "  `documents` array; `429` is rate-limit; `503` is a deployment cold",
    "  start. Wrap with `withRetry({ retries: 3 })` from `@apicity/fireworks`",
    "  to ride out cold deployments without bespoke retry code.",
    "",
  ].join("\n");
}

// Mined from tests/recordings/free_2578706139/{catbox,gofile,uguu,filebin,
// litterbox}-upload-image_*/recording.har — every URL, byte count, hash, and
// id below is a verbatim slice of what these hosts returned for the
// 83,558-byte tests/fixtures/cat1.jpg. The same calls replay end-to-end from
// tests/integration/free-{catbox,gofile,uguu,filebin,litterbox}.test.ts.
function renderFreeExample() {
  return [
    "## Real-world example: race a portrait across four free hosts",
    "",
    "`@apicity/free-media-upload` wraps eight zero-auth, no-account file-hosting endpoints",
    "behind one typed surface — the win is being able to fan the same `Blob`",
    "out to multiple hosts in parallel, then pick whichever URL came back",
    "first (or any survivor) without rewriting four different multipart",
    "callers. The snippet below uploads a single 84 KB JPEG to the four",
    "richest response shapes — catbox (plain string), gofile (rich bundle",
    "metadata), uguu (random-rename + dupe detection), filebin (md5/sha256 +",
    "expiry) — and shows how to normalise them under one `toUrl()` helper.",
    "",
    "Every URL, byte count, and hash below is mined verbatim from",
    "[`tests/recordings/free_2578706139/`](../../../tests/recordings/free_2578706139/),",
    "replayed by",
    "[`tests/integration/free-catbox.test.ts`](../../../tests/integration/free-catbox.test.ts),",
    "[`tests/integration/free-gofile.test.ts`](../../../tests/integration/free-gofile.test.ts),",
    "[`tests/integration/free-uguu.test.ts`](../../../tests/integration/free-uguu.test.ts),",
    "[`tests/integration/free-filebin.test.ts`](../../../tests/integration/free-filebin.test.ts),",
    "and [`tests/integration/free-litterbox.test.ts`](../../../tests/integration/free-litterbox.test.ts).",
    "",
    "```typescript",
    'import { readFileSync } from "node:fs";',
    'import { createFreeMediaUpload } from "@apicity/free-media-upload";',
    'import type { GofileUploadResponse, UguuUploadResponse, FilebinUploadResponse } from "@apicity/free-media-upload";',
    "",
    "// 1. The factory takes no api key — every host below is genuinely",
    "//    auth-free and account-free. Pass `{ timeout: 60_000 }` or a",
    "//    custom `fetch` if you need to override the defaults.",
    "const freeMediaUpload = createFreeMediaUpload();",
    "",
    'const bytes = readFileSync("./cat1.jpg"); // 83,558 bytes',
    'const file = new Blob([bytes], { type: "image/jpeg" });',
    "",
    "// 2. Race four hosts in parallel via Promise.all. Each returns a",
    "//    different shape: catbox/litterbox/tempsh hand back a plain",
    "//    `string` URL, gofile/tflink return a metadata bundle, uguu's",
    "//    payload nests under `files[]`, and filebin splits things into",
    "//    `bin` + `file` blocks. The factory keeps these distinctions in",
    "//    the type system so the destructure below is statically checked.",
    "const [catboxUrl, gofile, uguu, filebin] = (await Promise.all([",
    '  free.catbox.upload({ file, filename: "cat1.jpg" }),',
    '  free.gofile.upload({ file, filename: "cat1.jpg" }),',
    '  free.uguu.upload({ file, filename: "cat1.jpg" }),',
    '  free.filebin.upload({ file, filename: "cat1.jpg", bin: "apicity-test-img" }),',
    "])) as [string, GofileUploadResponse, UguuUploadResponse, FilebinUploadResponse];",
    "",
    "// 3. catbox is the simplest UX: text/plain response, just the URL,",
    "//    permanent until the operator deletes it. Good for a 'host once,",
    "//    forget' public asset.",
    "console.log(catboxUrl);",
    '// → "https://files.catbox.moe/0ufdor.jpg"',
    "",
    "// 4. gofile is the only host that gives you a sharable download page",
    "//    (suitable for human consumption) plus a CDN-direct id you can use",
    "//    to build APIs against. The `parentFolderCode` is a 6-char folder",
    "//    handle — every upload lands in a fresh anonymous folder unless",
    "//    you authenticate.",
    "console.log(gofile.data.downloadPage);",
    '// → "https://gofile.io/d/hmoMxW"',
    "console.log(gofile.data.id, gofile.data.md5, gofile.data.size);",
    '// → "a7feccb4-96b4-4b2c-923a-832106388ad6" "391a26048ce697ba072acd83209923f7" 83558',
    "",
    "// 5. uguu rewrites filenames to a random 8-char slug to stop URL",
    "//    enumeration, and tells you whether your bytes were already on",
    "//    the host (`dupe: true`) so you can skip a re-upload next time.",
    "//    Note the `files[]` array — uguu accepts batched uploads via the",
    "//    same endpoint, even though @apicity/free-media-upload only ships single-file.",
    "console.log(uguu.files[0].url, uguu.files[0].dupe);",
    '// → "https://n.uguu.se/GeNMsbBp.jpg" false',
    "",
    "// 6. filebin verifies content integrity for you — it returns both",
    "//    md5 and sha256, plus an expiry. The `bin` is a namespace you can",
    "//    re-upload into to grow a multi-file bundle (omit `bin` and you",
    "//    get an auto-generated one). Files in a bin expire together on",
    "//    `bin.expired_at`.",
    "console.log(filebin.file.md5, filebin.file.sha256);",
    '// → "ORomBIzml7oHKs2DIJkj9w==" "561dbe5dcd0c931cd3b41705ebe00df9181560967cea8b17128373a06ab911a3"',
    'console.log(`bin "${filebin.bin.id}" expires ${filebin.bin.expired_at}`);',
    "// → 'bin \"apicity-test-img\" expires 2026-04-23T07:19:25.458442Z'",
    "",
    "// 7. Hosts that return strings already give you a URL; hosts that",
    "//    return JSON bury it under different keys. A tiny normaliser lets",
    "//    downstream code stop caring which host won the race.",
    "function toUrl(",
    "  res: string | GofileUploadResponse | UguuUploadResponse | FilebinUploadResponse,",
    "  bin?: string,",
    "  filename?: string,",
    "): string {",
    '  if (typeof res === "string") return res;',
    '  if ("data" in res) return res.data.downloadPage;       // gofile',
    '  if ("files" in res) return res.files[0].url;           // uguu',
    "  return `https://filebin.net/${bin}/${filename}`;       // filebin",
    "}",
    "",
    "console.log([",
    "  toUrl(catboxUrl),",
    "  toUrl(gofile),",
    "  toUrl(uguu),",
    '  toUrl(filebin, "apicity-test-img", "cat1.jpg"),',
    "]);",
    "// → [",
    '//     "https://files.catbox.moe/0ufdor.jpg",',
    '//     "https://gofile.io/d/hmoMxW",',
    '//     "https://n.uguu.se/GeNMsbBp.jpg",',
    '//     "https://filebin.net/apicity-test-img/cat1.jpg",',
    "//   ]",
    "```",
    "",
    "### Failover across ephemeral hosts",
    "",
    "When you only need a URL to live for a few hours — typically because a",
    "downstream model is about to GET it once and then forget — `@apicity/free-media-upload`",
    "ships a `uploadToAnyHost` helper that walks a randomised host list and",
    "returns the first successful URL, raising a single `FreeMediaUploadError` only if",
    "every host fails. Useful when one provider is flaky (uguu's CDN can 502",
    "during traffic spikes) but you don't care which one wins.",
    "",
    "```typescript",
    'import { createFreeMediaUpload, uploadToAnyHost, FreeMediaUploadError } from "@apicity/free-media-upload";',
    "",
    "const freeMediaUpload = createFreeMediaUpload();",
    'const file = new Blob([bytes], { type: "image/jpeg" });',
    "",
    "// litterbox accepts a TTL; uguu and tflink are best-effort permanent.",
    "// uploadToAnyHost shuffles the list and tries each host sequentially,",
    "// so a single 502 from uguu falls through to tflink without your code",
    "// ever seeing it. The returned URL is already normalised — string in,",
    "// string out, regardless of which host responded.",
    "try {",
    "  const url = await uploadToAnyHost(free, {",
    "    file,",
    '    filename: "cat1.jpg",',
    '    hosts: ["litterbox", "uguu", "tflink"],',
    '    time: "12h", // forwarded to litterbox if it wins the shuffle',
    "  });",
    "  console.log(url);",
    '  // → "https://litter.catbox.moe/04obtk.jpg"  // example: litterbox won',
    "} catch (err) {",
    "  if (err instanceof FreeMediaUploadError) {",
    "    // err.body.failures is a string[] of `<host>: <message>` lines —",
    "    // useful for surfacing exactly which hosts misbehaved.",
    "    console.error(err.status, err.body);",
    "  }",
    "}",
    "```",
    "",
    "**Notes**",
    "",
    "- All eight endpoints take `{ file: Blob, filename?: string }`. catbox",
    "  and litterbox respond with `text/plain` (the URL itself); tmpfiles,",
    "  uguu, gofile, filebin, and tflink return JSON; tempsh returns plain",
    "  text. The factory parses each correctly so you never see the raw",
    "  body — just the typed shape.",
    "- `litterbox.upload` is the only endpoint with a `time` field —",
    '  `"1h" | "12h" | "24h" | "72h"`. Anything longer than 72h needs the',
    "  permanent-host siblings (catbox, gofile, filebin).",
    "- `filebin.upload` is the odd one out: it's a binary `POST` (no",
    "  multipart wrapper), so the `Blob` goes on the wire as-is and the",
    "  server treats `<bin>/<filename>` as the upload target. Re-uploading",
    "  to the same `bin` adds the file to the bundle rather than replacing",
    "  it; pre-create a stable `bin` slug to grow a multi-file collection.",
    "- gofile's `guestToken` is the closest thing this provider has to an",
    "  auth handle — save it if you want to delete the upload later via",
    "  the gofile API. Without it, anonymous uploads are write-only.",
    "- Every endpoint exposes a Zod schema:",
    "  `free.catbox.upload.schema.safeParse(input)` validates the payload",
    "  before the network call, which catches the most common mistake",
    "  (passing a `Buffer` or `string` instead of a `Blob`).",
    "- All endpoints accept an `AbortSignal` second argument and compose",
    "  with `withRetry` / `withFallback` from `@apicity/free-media-upload`'s middleware",
    "  re-exports — useful for ride-out 429s on uguu or chaining gofile →",
    "  catbox as a fallback pair.",
    "- Errors throw `FreeMediaUploadError` with `status` and the parsed body attached:",
    "  `try { ... } catch (e) { if (e instanceof FreeMediaUploadError) console.error(e.status, e.body); }`.",
    "",
  ].join("\n");
}

function renderOpenLigaDBExample() {
  return [
    "## Matchdata Examples",
    "",
    "OpenLigaDB is public and does not require an API key.",
    "",
    "```typescript",
    'import { createOpenLigaDB } from "@apicity/openligadb";',
    "",
    "const openligadb = createOpenLigaDB();",
    "",
    "const match = await openligadb.getmatchdata.byId({ matchId: 68720 });",
    "",
    "const season = await openligadb.getmatchdata.byLeagueSeason({",
    '  leagueShortcut: "bl1",',
    "  leagueSeason: 2024,",
    "});",
    "```",
    "",
    "The overloaded upstream `/getmatchdata` paths are exposed as explicit",
    "`by*` methods so team, group, season, and match-id routes cannot collide.",
    "",
    "## Next Match And Team Window Examples",
    "",
    "The next/last shortcuts return one match. Team windows return recent and",
    "upcoming matches around today, controlled by past/future week counts:",
    "",
    "```typescript",
    "const nextMatch = await openligadb.getnextmatchbyleagueshortcut({",
    '  leagueShortcut: "bl1",',
    "});",
    "",
    "const recentAndUpcoming = await openligadb.getmatchesbyteam({",
    '  teamFilterstring: "Bayern",',
    "  weekCountPast: 4,",
    "  weekCountFuture: 2,",
    "});",
    "```",
    "",
    "## Standings And Scorers Examples",
    "",
    "League standings, group tables, and top scorers share the same",
    "`leagueShortcut` and `leagueSeason` request shape:",
    "",
    "```typescript",
    "const standings = await openligadb.getbltable({",
    '  leagueShortcut: "bl1",',
    "  leagueSeason: 2024,",
    "});",
    "",
    "const groupTable = await openligadb.getgrouptable({",
    '  leagueShortcut: "bl1",',
    "  leagueSeason: 2024,",
    "});",
    "",
    "const topScorers = await openligadb.getgoalgetters({",
    '  leagueShortcut: "bl1",',
    "  leagueSeason: 2024,",
    "});",
    "```",
    "",
  ].join("\n");
}

function renderTheSportsDBSearchExample() {
  return [
    "## Search Examples",
    "",
    "TheSportsDB V1 uses the free `123` key by default. Pass `apiKey` only",
    "when you have a premium key.",
    "",
    "```typescript",
    'import { createTheSportsDB } from "@apicity/thesportsdb";',
    "",
    "const thesportsdb = createTheSportsDB();",
    "",
    "const teams = await thesportsdb.v1.searchTeams({",
    '  team: "Arsenal",',
    "});",
    "",
    "const events = await thesportsdb.v1.searchEvents({",
    '  event: "Arsenal_vs_Chelsea",',
    '  season: "2016-2017",',
    '  date: "2015-04-26",',
    "});",
    "",
    "const filename = await thesportsdb.v1.searchFilename({",
    '  filename: "English_Premier_League_2015-04-26_Arsenal_vs_Chelsea",',
    "});",
    "",
    "const players = await thesportsdb.v1.searchPlayers({",
    '  player: "Danny Welbeck",',
    "});",
    "",
    "const venues = await thesportsdb.v1.searchVenues({",
    '  venue: "Wembley",',
    "});",
    "```",
    "",
    "No-result V1 searches preserve TheSportsDB's nullable wrapper arrays,",
    "such as `{ teams: null }` or `{ player: null }`.",
    "",
  ].join("\n");
}

function renderTheSportsDBPlayerExample() {
  return [
    "## Player Lookup Examples",
    "",
    "Player lookup, honours, former-team, milestone, contract, result, and",
    "statistics routes use TheSportsDB's numeric player id.",
    "",
    "```typescript",
    'import { createTheSportsDB } from "@apicity/thesportsdb";',
    "",
    "const thesportsdb = createTheSportsDB({",
    "  apiKey: process.env.THESPORTSDB_API_KEY,",
    "});",
    "",
    "const player = await thesportsdb.v1.lookupplayer({ idPlayer: 34145937 });",
    "const honours = await thesportsdb.v1.lookuphonours({ idPlayer: 34147178 });",
    "const stats = await thesportsdb.v1.lookupplayerstats({ idPlayer: 34146304 });",
    "```",
    "",
    "No-result responses preserve TheSportsDB's wrapper key with a `null`",
    "value, for example `{ players: null }`.",
    "",
  ].join("\n");
}

function renderOpenF1Example() {
  return [
    "## REST Examples",
    "",
    "OpenF1 historical REST data is public and does not require an API key.",
    "",
    "```typescript",
    'import { createOpenF1 } from "@apicity/openf1";',
    "",
    "const openf1 = createOpenF1();",
    "",
    "const meetings = await openf1.v1.meetings({",
    "  year: 2024,",
    '  country_name: ["Singapore", "Monaco"],',
    "});",
    "",
    "const recentMeetings = await openf1.v1.meetings({",
    "  filters: [",
    '    { field: "date_start", op: ">=", value: "2024-01-01T00:00:00Z" },',
    "  ],",
    "});",
    "```",
    "",
    "Use arrays for repeated equality filters and `filters` for OpenF1",
    "comparison operators such as `>=`, `<`, and `>`.",
    "",
    "## Authenticated REST",
    "",
    "OpenF1 live REST access uses the same `/v1/{collection}` endpoints with",
    "a Bearer token. See the [OpenF1 auth guide](https://openf1.org/auth.html)",
    "for the upstream token contract.",
    "",
    "```typescript",
    'import { createOpenF1 } from "@apicity/openf1";',
    "",
    "const openf1 = createOpenF1();",
    "",
    "const token = await openf1.token({",
    '  username: "driver@example.com",',
    '  password: "placeholder-password",',
    "});",
    "",
    "const liveOpenF1 = createOpenF1({",
    "  accessToken: token.access_token,",
    "});",
    "",
    "const liveSessions = await liveOpenF1.v1.sessions({",
    '  session_key: "latest",',
    "});",
    "```",
    "",
    "For refreshable tokens, provide a `tokenProvider`. The provider is called",
    "for REST reads and this package does not store credentials or tokens",
    "outside the client instance.",
    "",
    "```typescript",
    "const openf1 = createOpenF1({",
    "  tokenProvider: async () => {",
    "    const token = await fetchTokenSomewhereElse();",
    "    return token.access_token;",
    "  },",
    "});",
    "```",
    "",
  ].join("\n");
}

function renderTelegramSetup() {
  return [
    "## Setup",
    "",
    "This package uses a Telegram Bot API token. In this repo,",
    "`TELEGRAM_BOT_KEY` resolves from 1Password for `@apicitylogbot`.",
    "",
    "```typescript",
    'import { createTelegram } from "@apicity/telegram";',
    "",
    "const telegram = createTelegram({",
    "  botToken: process.env.TELEGRAM_BOT_KEY!,",
    "});",
    "",
    "await telegram.sendMessage({",
    '  chat_id: "@your_channel_or_chat_id",',
    '  text: "hello from @apicity/telegram",',
    "});",
    "",
    'const photo = new Blob(["image bytes"], { type: "image/png" });',
    "await telegram.sendPhoto({",
    '  chat_id: "@your_channel_or_chat_id",',
    "  photo,",
    '  caption: "uploaded from @apicitylogbot",',
    "});",
    "```",
    "",
    "**Notes**",
    "",
    "- `chat_id` can be a numeric chat id or a username such as `@channelname`.",
    "- `photo`, `video`, `audio`, `thumbnail`, and `cover` accept a Telegram",
    "  `file_id`, an HTTP URL, an `attach://...` reference, or a `Blob`.",
    "- Blob payloads are sent as `multipart/form-data`; string payloads use",
    "  `application/json`.",
    "- Recorded examples redact bot tokens, webhook secret tokens, payment",
    "  payloads, passport data, Telegram file identifiers, and Blob bytes.",
    "",
  ].join("\n");
}

function renderQuoExample() {
  return [
    "## Send A Message",
    "",
    "```typescript",
    'import { createQuo } from "@apicity/quo";',
    "",
    "const quo = createQuo({ apiKey: process.env.QUO_API_KEY! });",
    "",
    "const response = await quo.v1.messages({",
    '  content: "Hello from Quo",',
    '  from: "+15550100001",',
    '  to: ["+15550100002"],',
    "});",
    "",
    "console.log(response.data.conversationId);",
    "```",
    "",
    "The request schema is available as `quo.v1.messages.schema`. The client",
    "uses the raw API key as the `Authorization` header, accepts an optional",
    "`AbortSignal`, clears request timers, and redacts credentials and phone",
    "numbers from thrown error messages. Prefer `from`; `phoneNumberId` is",
    "retained only as a deprecated request alias.",
    "",
  ].join("\n");
}

function renderOpenLigaDBDiscoveryGuide() {
  return [
    "## Catalog Discovery Flow",
    "",
    "OpenLigaDB's public catalog endpoints work without credentials. A common",
    "flow is sports -> leagues -> groups, teams, and result metadata:",
    "",
    "```typescript",
    'import { createOpenLigaDB } from "@apicity/openligadb";',
    "",
    "const openligadb = createOpenLigaDB();",
    "",
    "const sports = await openligadb.getavailablesports();",
    "const leagues = await openligadb.getavailableleagues.bySeason({",
    "  season: 2024,",
    "});",
    "",
    'const league = leagues.find((item) => item.leagueShortcut === "bl1");',
    "if (league) {",
    "  const groups = await openligadb.getavailablegroups({",
    "    leagueShortcut: league.leagueShortcut!,",
    "    leagueSeason: Number(league.leagueSeason),",
    "  });",
    "  const teams = await openligadb.getavailableteams({",
    "    leagueShortcut: league.leagueShortcut!,",
    "    leagueSeason: Number(league.leagueSeason),",
    "  });",
    "  const resultInfo = await openligadb.getresultinfos({",
    "    leagueId: league.leagueId,",
    "  });",
    "}",
    "```",
    "",
    "All path-parameter methods expose request schemas via `.schema`, for",
    "example `openligadb.getavailablegroups.schema.safeParse(input)`.",
    "",
  ].join("\n");
}

function renderOpenLigaDBOperationalNotes() {
  return [
    "## Errors And Scope",
    "",
    "- OpenLigaDB's documented public surface is read-only. This package",
    "  exposes `GET` helpers only and never sends auth headers.",
    "- The public upstream docs do not document pagination parameters,",
    "  rate-limit headers, or credential requirements for these routes,",
    "  so this provider does not add client-side helpers for them.",
    "- Non-2xx responses throw `OpenLigaDBError` with `status` and `body`.",
    "  JSON error bodies stay as parsed objects, while `text/plain` bodies",
    "  are preserved as strings so missing-match messages are not lost.",
    "- Empty success bodies resolve to `null`; endpoint helpers with schemas",
    "  expose request validation through `.schema.safeParse(input)`.",
    "",
  ].join("\n");
}

// Providers whose options object uses a non-default auth field/env-var or
// who don't re-export the shared middleware helpers. Anything not listed here
// gets the default `apiKey` / `<PROVIDER>_API_KEY` / middleware-section.
const PROVIDER_AUTH = {
  google: {
    showMiddleware: false,
  },
  googleflow: {
    env: "GOOGLE_FLOW_API_KEY",
  },
  dolthub: {
    field: "apiToken",
  },
  zaicoding: {
    env: "ZAI_CODING_PLAN_API_KEY",
    showMiddleware: false,
  },
  x: {
    field: "accessToken",
    env: "X_ACCESS_TOKEN",
    showMiddleware: false,
  },
  ig: {
    field: "accessToken",
    env: "IG_ACCESS_TOKEN",
    showMiddleware: false,
  },
  polymarket: {
    noAuth: true,
    showMiddleware: false,
  },
  openligadb: {
    noAuth: true,
    showMiddleware: false,
  },
  binance: {
    noAuth: true,
    showMiddleware: false,
  },
  dropbox: {
    field: "oauthToken",
    env: "DROPBOX_OAUTH_TOKEN",
    showMiddleware: false,
  },
  thesportsdb: {
    env: "THESPORTSDB_API_KEY",
    optionalAuth: true,
    showMiddleware: false,
  },
  openf1: {
    noAuth: true,
    showMiddleware: false,
  },
  s3: {
    showMiddleware: false,
  },
  b2: {
    showMiddleware: false,
  },
  free: {
    noAuth: true,
    showMiddleware: false,
  },
  telegram: {
    field: "botToken",
    env: "TELEGRAM_BOT_KEY",
    showMiddleware: false,
  },
  quo: {
    showMiddleware: false,
  },
  simplefunctions: {
    env: "SIMPLEFUNCTIONS_API_KEY",
    optionalAuth: true,
    showMiddleware: false,
  },
};

// Per-provider upstream documentation URLs. When set, a docs badge is
// rendered in the README header.
const PROVIDER_DOCS = {
  google:
    "https://docs.cloud.google.com/vertex-ai/generative-ai/docs/reference/express-mode/rest/v1/publishers.models/generateContent",
  polymarket: "https://docs.polymarket.com/api-reference/introduction",
  telegram: "https://core.telegram.org/bots/api",
  quo: "https://www.quo.com/docs/mdx/api-reference/messages/send-a-text-message",
  binance:
    "https://developers.binance.com/docs/binance-spot-api-docs/rest-api/general-api-information",
  dropbox:
    "https://www.dropbox.com/developers/documentation/http/documentation",
  openf1: "https://openf1.org/docs/",
  s3: "https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html",
  b2: "https://www.backblaze.com/docs/en/cloud-storage-call-the-s3-compatible-api",
  simplefunctions:
    "https://docs.simplefunctions.dev/api-reference/public-market-data",
  thesportsdb: "https://www.thesportsdb.com/docs_api_guide",
  openligadb: "https://api.openligadb.de/swagger/v1/swagger.json",
};

// Resolve the provider's factory function from the create* identifiers in
// its src/index.ts: the one matching "create" + the provider name with
// hyphens removed, case-insensitive (free-media-upload ->
// createFreeMediaUpload). Throws when no export matches, so a new provider
// with a nonstandard factory name fails the build instead of silently
// generating READMEs with a guessed (wrong) factory.
function resolveFactory(providerName) {
  const indexPath = path.join(
    REPO_ROOT,
    "packages",
    "provider",
    providerName,
    "src",
    "index.ts"
  );
  const source = fsSync.readFileSync(indexPath, "utf8");
  const identifiers = new Set(source.match(/\bcreate[A-Za-z0-9_]*/g) ?? []);
  const expected = `create${providerName.replace(/-/g, "")}`.toLowerCase();
  const match = [...identifiers].find(
    (name) => name.toLowerCase() === expected
  );
  if (match) return match;
  if (identifiers.size === 1) return [...identifiers][0];
  throw new Error(
    `Cannot determine factory for "${providerName}": no create* export in ` +
      `${path.relative(REPO_ROOT, indexPath)} matches "${expected}" ` +
      `(found: ${[...identifiers].join(", ") || "none"})`
  );
}

// One-line explanation per runtime dependency, rendered under the badges so
// the README states what each dependency is actually for.
const DEP_NOTES = {
  zod: "request schemas attached to every POST endpoint as `.schema`",
  viem: "EIP-712 order signing for the CLOB trading endpoints",
};

const PROVIDER_DEP_NOTES = {
  openligadb: {
    zod: "request schemas attached to endpoint methods as `.schema`; response schemas exported",
  },
  simplefunctions: {
    zod: "request schemas attached to provider endpoints as `.schema`",
  },
  thesportsdb: {
    zod: "request schemas attached to endpoint methods as `.schema`; response schemas exported",
  },
  openf1: {
    zod: "request schemas attached to OpenF1 endpoint methods as `.schema`",
  },
  dropbox: {
    zod: "request schemas attached to Dropbox endpoint methods as `.schema`",
  },
};

function renderTheSportsDBLookupGuide() {
  return [
    "V1 uses an API key in the URL path. The provider defaults to the public",
    "free key `123`; pass `apiKey` to use your own key.",
    "V2 uses the same `apiKey` option as an `X-API-KEY` header and is",
    "available under `thesportsdb.v2`.",
    "",
    "```typescript",
    "const league = await thesportsdb.v1.lookup.league({ idLeague: 4328 });",
    "const table = await thesportsdb.v1.lookup.table({",
    "  idLeague: 4328,",
    '  season: "2020-2021",',
    "});",
    "const team = await thesportsdb.v1.lookup.team({ idTeam: 133604 });",
    "",
    "const nextLeagueEvents = await thesportsdb.v2.schedule.next.league({",
    "  idLeague: 4328,",
    "});",
    "const liveSoccer = await thesportsdb.v2.livescore.bySport({",
    '  sport: "soccer",',
    "});",
    "```",
    "",
    "V2 is premium-only and sends the same `apiKey` as an `X-API-KEY`",
    "header. V2 lookup method names mirror the path segments:",
    "",
    "```typescript",
    "const player = await thesportsdb.v2.lookup.player({ idPlayer: 34172575 });",
    "const lineup = await thesportsdb.v2.lookup.eventLineup({",
    "  idEvent: 1937584,",
    "});",
    "const highlights = await thesportsdb.v2.lookup.eventHighlights({",
    "  idEvent: 2044892,",
    "});",
    "```",
    "",
  ].join("\n");
}

async function generateReadme(providerDir, providerName, endpoints) {
  const { pkg } = await extractProviderMetadata(providerDir);
  const pkgName = pkg.name || `@apicity/${providerName}`;
  const factory = resolveFactory(providerName);
  const auth = PROVIDER_AUTH[providerName] ?? {};
  const authField = auth.field ?? "apiKey";
  const envKey = auth.env ?? `${providerName.toUpperCase()}_API_KEY`;
  const showMiddleware = auth.showMiddleware ?? true;
  const noAuth = auth.noAuth ?? false;
  const optionalAuth = auth.optionalAuth ?? false;

  const sections = [];

  sections.push(`# ${pkgName}`);
  sections.push("");
  sections.push(
    `[![npm](https://img.shields.io/npm/v/${pkgName}?color=cb0000)](https://www.npmjs.com/package/${pkgName})`
  );
  const runtimeDeps = Object.entries(pkg.dependencies ?? {});
  const depBadgeColor = runtimeDeps.length === 0 ? "brightgreen" : "blue";
  sections.push(
    `[![dependencies](https://img.shields.io/badge/dependencies-${runtimeDeps.length}-${depBadgeColor})](package.json)`
  );
  sections.push(
    "[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](tsconfig.json)"
  );
  const docsUrl = PROVIDER_DOCS[providerName];
  if (docsUrl) {
    const docsHost = new URL(docsUrl).hostname.replace(/^www\./, "");
    sections.push(
      `[![docs](https://img.shields.io/badge/docs-${encodeURIComponent(docsHost)}-blue)](${docsUrl})`
    );
  }
  sections.push("");
  sections.push(pkg.description || `${providerName} provider for apicity.`);
  sections.push("");

  const providerNote = PROVIDER_NOTES.get(providerName);
  if (providerNote) {
    sections.push(providerNote);
    sections.push("");
  }

  if (runtimeDeps.length > 0) {
    sections.push("Runtime dependencies:");
    sections.push("");
    for (const [depName, depRange] of runtimeDeps) {
      const note =
        PROVIDER_DEP_NOTES[providerName]?.[depName] ?? DEP_NOTES[depName];
      sections.push(`- \`${depName}@${depRange}\`${note ? ` — ${note}` : ""}`);
    }
    sections.push("");
  }

  sections.push("## Installation");
  sections.push("");
  sections.push("```bash");
  sections.push(`npm install ${pkgName}`);
  sections.push("# or");
  sections.push(`pnpm add ${pkgName}`);
  sections.push("```");
  sections.push("");

  sections.push("## Quick Start");
  sections.push("");
  sections.push("```typescript");
  sections.push(`import { ${factory} } from "${pkgName}";`);
  sections.push("");
  if (providerName === "s3") {
    sections.push(`const ${providerName} = ${factory}({`);
    sections.push("  accessKeyId: process.env.S3_ACCESS_KEY_ID!,");
    sections.push("  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,");
    sections.push('  region: process.env.S3_REGION ?? "us-east-1",');
    sections.push("  endpoint: process.env.S3_ENDPOINT,");
    sections.push("});");
  } else if (providerName === "b2") {
    sections.push(`const ${providerName} = ${factory}({`);
    sections.push("  accessKeyId: process.env.B2_ACCESS_KEY_ID!,");
    sections.push("  secretAccessKey: process.env.B2_SECRET_ACCESS_KEY!,");
    sections.push("  region: process.env.B2_REGION!,");
    sections.push("  endpoint: process.env.B2_ENDPOINT,");
    sections.push("});");
  } else if (noAuth) {
    sections.push(`const ${providerName} = ${factory}();`);
  } else if (optionalAuth) {
    sections.push(
      `const ${providerName} = ${factory}({ ${authField}: process.env.${envKey} });`
    );
  } else {
    sections.push(
      `const ${providerName} = ${factory}({ ${authField}: process.env.${envKey}! });`
    );
  }
  sections.push("```");
  sections.push("");

  if (providerName === "kie") {
    sections.push(
      "Resolve `KIE_API_KEY` only in server-side code or trusted job runners."
    );
    sections.push(
      "Do not expose KIE API keys to browsers, mobile clients, public logs, or"
    );
    sections.push("frontend bundles.");
    sections.push("");
  }

  if (providerName === "dropbox") {
    sections.push(
      "If `oauthToken` is omitted, the provider reads `DROPBOX_OAUTH_TOKEN` at request time."
    );
    sections.push(
      "Tokens are only sent in the `Authorization: Bearer ...` header."
    );
    sections.push("");
  }

  if (providerName === "x") {
    sections.push(renderXSetup());
    sections.push(renderXExample());
  }

  if (providerName === "binance") {
    sections.push(renderBinancePublicDataGuide());
  }

  if (providerName === "thesportsdb") {
    sections.push(renderTheSportsDBAuthGuide());
    sections.push(renderTheSportsDBOperationalNotes());
  }

  if (providerName === "openligadb") {
    sections.push(renderOpenLigaDBExample());
  }

  if (providerName === "thesportsdb") {
    sections.push(renderTheSportsDBSearchExample());
    sections.push(renderTheSportsDBPlayerExample());
  }

  if (providerName === "openf1") {
    sections.push(renderOpenF1Example());
  }

  if (providerName === "simplefunctions") {
    sections.push(renderSimpleFunctionsPublicMarketGuide());
    sections.push(renderSimpleFunctionsAuthenticatedGuide());
  }

  if (providerName === "thesportsdb") {
    sections.push(renderTheSportsDBLookupGuide());
  }

  if (providerName === "xai") {
    sections.push(renderXaiExample());
    sections.push(renderXaiImagineFilesIntegration());
    sections.push(renderXaiFilesPublicUrls());
  }

  if (providerName === "alibaba") {
    sections.push(renderAlibabaExample());
  }

  if (providerName === "anthropic") {
    sections.push(renderAnthropicExample());
  }

  if (providerName === "elevenlabs") {
    sections.push(renderElevenlabsExample());
  }

  if (providerName === "fal") {
    sections.push(renderFalExample());
  }

  if (providerName === "fireworks") {
    sections.push(renderFireworksExample());
  }

  if (providerName === "free-media-upload") {
    sections.push(renderFreeExample());
  }

  if (providerName === "kie") {
    sections.push(renderKieExample());
  }

  if (providerName === "meta") {
    sections.push(renderIgSetup());
    sections.push(renderIgExample());
  }

  if (providerName === "telegram") {
    sections.push(renderTelegramSetup());
  }

  if (providerName === "quo") {
    sections.push(renderQuoExample());
  }

  if (providerName === "openligadb") {
    sections.push(renderOpenLigaDBDiscoveryGuide());
    sections.push(renderOpenLigaDBOperationalNotes());
  }

  if (providerName === "polymarket") {
    sections.push(
      "## Unsupported Upstream Paths",
      "",
      [
        "The current Polymarket OpenAPI specs mark some paths as",
        "`x-excluded`; `@apicity/polymarket` intentionally does not expose",
        "wrappers for those unsupported surfaces. That includes Gamma",
        "administrative/private paths such as team detail, event",
        "pagination/results/comment-count, market information and abridged",
        "POST endpoints, series summaries, and private profile lookups, plus",
        "Data `/revisions` and `/other`.",
      ].join(" "),
      ""
    );
  }

  if (providerName === "b2") {
    sections.push(
      "`@apicity/b2` bundles its S3-compatible signing, transport, response parsing, and schemas locally while exposing only Backblaze-supported calls.",
      ""
    );
  }

  const apiReference = renderApiReference(providerName, endpoints);
  sections.push(apiReference.text);

  if (showMiddleware) {
    sections.push("## Middleware");
    sections.push("");
    sections.push("```typescript");
    sections.push(`import { ${factory}, withRetry } from "${pkgName}";`);
    sections.push("");
    sections.push(
      `const ${providerName} = ${factory}({ ${authField}: process.env.${envKey}! });`
    );
    sections.push(
      `const models = withRetry(${providerName}.get.v1.models, { retries: 3 });`
    );
    sections.push("```");
    sections.push("");
  }

  if (providerName === "xai") {
    sections.push(renderXaiRateLimiting());
  }

  sections.push(
    "Part of the [apicity](https://github.com/justintanner/apicity) monorepo."
  );
  sections.push("");
  sections.push("## License");
  sections.push("");
  sections.push("MIT — see [LICENSE](LICENSE).");
  sections.push("");

  return {
    readme: sections.join("\n"),
    renderedCount: apiReference.renderedCount,
  };
}

// Pure: renders a provider's README and reports how many endpoints it
// documents, without touching disk. Both the write path and --check go
// through this, and the count is threaded out of the single
// `resolveEndpointLabels` call that produced the README header — so neither
// the bytes nor the count can drift.
async function renderProviderReadme(providerName, endpointsByProvider) {
  const providerDir = path.join(
    REPO_ROOT,
    "packages",
    "provider",
    providerName
  );
  const readmePath = path.join(providerDir, "README.md");
  const endpoints = endpointsByProvider.get(providerName) ?? [];
  const { readme, renderedCount } = await generateReadme(
    providerDir,
    providerName,
    endpoints
  );
  return { readmePath, readme, renderedCount };
}

async function regenerate(providerName, endpointsByProvider) {
  const { readmePath, readme, renderedCount } = await renderProviderReadme(
    providerName,
    endpointsByProvider
  );
  await fs.writeFile(readmePath, readme, "utf8");
  console.log(
    `✅ Generated ${path.relative(REPO_ROOT, readmePath)} (${renderedCount} endpoints)`
  );
}

// Drift mode: compare the committed README against freshly rendered output and
// write nothing. Mirrors `gen:shared:check` (scripts/sync-shared-src.mjs) so
// both drift gates report the same way. A missing README is stale, not a crash.
async function checkProviderReadme(providerName, endpointsByProvider) {
  const { readmePath, readme } = await renderProviderReadme(
    providerName,
    endpointsByProvider
  );
  let current = null;
  try {
    current = await fs.readFile(readmePath, "utf8");
  } catch (error) {
    if (!error || error.code !== "ENOENT") throw error;
  }
  return current === readme ? null : path.relative(REPO_ROOT, readmePath);
}

const KNOWN_FLAGS = new Set(["--check"]);

async function main() {
  // `pnpm run doc-gen -- --check` forwards the bare `--` separator through to
  // argv, so drop it before classifying — otherwise the unknown-flag guard
  // below rejects pnpm's own passthrough syntax.
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const flags = args.filter((a) => a.startsWith("--"));
  const positional = args.filter((a) => !a.startsWith("--"));

  const unknown = flags.filter((f) => !KNOWN_FLAGS.has(f));
  if (unknown.length > 0) {
    console.error(`Unknown flag(s): ${unknown.join(", ")}`);
    console.error("Usage: node scripts/doc-gen.mjs [--check] [<provider>]");
    process.exitCode = 1;
    return;
  }

  const check = flags.includes("--check");
  const endpointsByProvider = await collectEndpointsByProvider();

  let providers;
  if (positional.length === 0) {
    providers = [
      ...new Set([...PROVIDERS.map((p) => p.name), ...TSV_ONLY_PROVIDERS]),
    ];
  } else {
    const raw = positional[0];
    const providerName = raw.startsWith("packages/")
      ? path.basename(path.resolve(raw))
      : raw;
    providers = [providerName];
  }

  const stale = [];
  let failed = false;

  for (const name of providers) {
    try {
      if (check) {
        const stalePath = await checkProviderReadme(name, endpointsByProvider);
        if (stalePath) stale.push(stalePath);
      } else {
        await regenerate(name, endpointsByProvider);
      }
    } catch (error) {
      console.error(`❌ Error generating docs for ${name}: ${error.message}`);
      process.exitCode = 1;
      failed = true;
    }
  }

  if (!check) return;

  if (stale.length > 0) {
    for (const stalePath of stale) {
      console.error(`stale: ${stalePath}`);
    }
    console.error("Run `pnpm run doc-gen` and commit the result.");
    process.exitCode = 1;
    return;
  }

  if (!failed) {
    console.log("Generated provider READMEs are up to date.");
  }
}

if (process.argv[1] === __filename) {
  main();
}
