/**
 * Compares `PRICING.kie` with a pull of KIE's public price feed.
 *
 * The reconciliation guard reads the frozen 2026-09-11 pull, so a table rate that
 * drifts from today's feed passes it: `pixverse-v6/reference-to-video` sat 12.5%
 * high that way. This module takes a manifest built from a newer pull
 * (`buildReconciliationManifest` with `live: true`) and asks one question of each
 * row the guard maps to a table cell: does the cell hold the feed's rate?
 *
 * It reuses the guard's row-to-cell mapping and representative payloads, so a
 * multi-axis row resolves through the entry's own selectors. A feed row whose
 * words the mapping cannot read lands in `differ` too, which is the safe side:
 * add its rule to `SELECTOR_RULES` or `PAYLOAD_RULES`.
 */
import { feedUnitsPerTableUnit } from "./kie-pricing-reconciliation-rules.mjs";

const TOLERANCE_USD = 1e-9;
const USD_PER_CREDIT = 0.005;

function descriptionOf(row) {
  return String(row.official?.modelDescription ?? "").trim();
}

function rowFacts(row) {
  return {
    description: descriptionOf(row),
    credits: row.official?.creditPrice,
    feedUnit: row.official?.creditUnit,
    anchor: row.official?.anchor,
  };
}

// A row states its rate twice, in USD and in credits. They can disagree: the feed
// rounds gpt-5-2's 87.5 credits to 0.44 USD. Credits are what KIE bills, and the
// table holds some of those figures on purpose, so a cell may match either one.
function feedRates(row, perFeedUnit) {
  const usd = Number(row.official?.usdPrice);
  const credits = Number(row.official?.creditPrice) * USD_PER_CREDIT;
  return [usd, credits].filter(Number.isFinite).map(perFeedUnit);
}

function compareMedia(row, entry, key) {
  const payload = row.representativePayload;
  const hints = row.representativePricingMetadata?.costHints;
  const scale = feedUnitsPerTableUnit({ description: descriptionOf(row), key });
  const perTableUnit = (figure) =>
    row.billingBasis === "fixed-bundle"
      ? figure
      : (figure / (row.officialUnitQuantity ?? 1)) * (scale ?? 1);
  const feedUsd = feedRates(row, perTableUnit);
  if (row.billingComponent === "extra") {
    return {
      key,
      variant: "extra",
      tableUsd: entry.extra?.(payload, hints),
      feedUsd,
    };
  }
  const variant = entry.select
    .map((selector) => selector.pick(payload, hints))
    .filter(Boolean)
    .join("|");
  return { key, variant, tableUsd: entry.rates[variant], feedUsd };
}

// Which rate of a token entry a row states. Each is USD per million tokens, as
// the feed's unit is. The role is the last clause: an earlier "output" names
// the operation ("SVG output"), not the component, and must not win over a
// trailing Input.
const TOKEN_COMPONENTS = Object.freeze([
  ["cacheWrite", /cache[ -]?writes?/i],
  ["cacheRead", /cached? (?:input|read)|cache[ -]?hit/i],
  ["output", /\boutput\b/i],
  ["input", /\binput\b/i],
]);

function tokenComponent(description) {
  const clause = description.split(",").at(-1) ?? description;
  return TOKEN_COMPONENTS.find(([, pattern]) => pattern.test(clause));
}

function compareTokens(row, entry, key) {
  const description = descriptionOf(row);
  const match = tokenComponent(description);
  if (!match || !/per (?:million|1M) tokens/i.test(row.official?.creditUnit)) {
    return undefined;
  }
  const [component] = match;
  return {
    key,
    variant: component,
    tableUsd: entry.rate[component],
    feedUsd: feedRates(row, (figure) => figure),
  };
}

// The guard does not map the Gemini TTS rows, and the frozen manifest pins that.
const TTS_ROW_KEYS = Object.freeze([
  [/^Gemini 2\.5 Pro TTS,/i, "google/gemini-2-5-pro-tts"],
  [/^Gemini 3\.1 Flash TTS,/i, "google/gemini-3-1-flash-tts"],
  [/^Gemini 3\.8 Flash-Lite TTS,/i, "google/gemini-3-8-flash-lite-tts"],
  [/^Gemini 3\.8 Flash TTS,/i, "google/gemini-3-8-flash-tts"],
]);

function ttsKey(description) {
  return TTS_ROW_KEYS.find(([pattern]) => pattern.test(description))?.[1];
}

// One feed row prices both tabs of a text and image pair, and its anchor names
// one of them.
function twinKey(description, key) {
  if (!/text\s*\/\s*image to video/i.test(description)) return undefined;
  if (key.endsWith("/text-to-video")) {
    return key.replace(/text-to-video$/, "image-to-video");
  }
  if (key.endsWith("/image-to-video")) {
    return key.replace(/image-to-video$/, "text-to-video");
  }
  return undefined;
}

function compareCell(row, entry, key) {
  if (entry.kind === "tokens") return compareTokens(row, entry, key);
  if (entry.kind === "perUnit" && row.representativePayload) {
    return compareMedia(row, entry, key);
  }
  return undefined;
}

/**
 * @returns {{
 *   compared: number,
 *   same: number,
 *   differ: object[],
 *   notCompared: object[],
 *   uncoveredKeys: string[],
 * }} `differ` is what to act on. `notCompared` names each billable row with no
 * comparable cell, with why. `uncoveredKeys` are table keys no row of this pull
 * reached, so nothing here witnesses their rates.
 */
export function feedDrift({ manifest, pricing }) {
  const differ = [];
  const notCompared = [];
  const reached = new Set();
  let compared = 0;
  let same = 0;

  for (const row of manifest.rows) {
    const facts = rowFacts(row);
    const tts = ttsKey(facts.description);
    if (
      !tts &&
      (row.disposition === "unsupported-endpoint" ||
        row.disposition === "upstream-unmappable")
    ) {
      notCompared.push({ ...facts, reason: row.rationale ?? row.disposition });
      continue;
    }
    const key = tts ?? row.mappedApiCityKeys?.[0];
    if (!key) {
      if (row.disposition !== "free-nonbillable") {
        notCompared.push({ ...facts, reason: `${row.disposition}, no key` });
      }
      continue;
    }
    if (row.disposition === "free-nonbillable") {
      reached.add(key);
      continue;
    }
    const twin = twinKey(facts.description, key);
    for (const candidate of twin && pricing[twin] ? [key, twin] : [key]) {
      const entry = pricing[candidate];
      if (entry) reached.add(candidate);
      const cell = entry && compareCell(row, entry, candidate);
      if (!cell) {
        notCompared.push({
          ...facts,
          key: candidate,
          reason: entry ? "no comparable table cell" : "no table entry",
        });
        continue;
      }
      compared += 1;
      const agrees =
        typeof cell.tableUsd === "number" &&
        cell.feedUsd.some(
          (figure) => Math.abs(cell.tableUsd - figure) <= TOLERANCE_USD
        );
      if (agrees) same += 1;
      else differ.push({ ...facts, ...cell, tableUsd: cell.tableUsd ?? null });
    }
  }

  const uncoveredKeys = Object.keys(pricing)
    .filter((key) => !reached.has(key))
    .sort();
  return { compared, same, differ, notCompared, uncoveredKeys };
}
