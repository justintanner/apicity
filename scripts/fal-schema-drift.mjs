#!/usr/bin/env node
/**
 * Do apicity's fal request schemas still hold what fal's live input schemas say?
 *
 *   pnpm run check:fal-schema-drift                          # every endpoint, free and keyless
 *   pnpm run check:fal-schema-drift -- --endpoint <id>       # one endpoint
 *   pnpm run check:fal-schema-drift -- --cache <dir>         # reuse documents a rerun already fetched
 *   pnpm run check:fal-schema-drift -- --out <file>          # write the JSON report
 *   pnpm run check:fal-schema-drift -- --json                # print the JSON report
 *
 * For every endpoint in FAL_ENDPOINT_REQUEST_SCHEMAS it GETs fal's public queue
 * OpenAPI document (no key, no account header, a generic User-Agent, one request
 * at a time with a pause) and compares the input component field by field with
 * our zod schema: see scripts/lib/fal-schema-drift.mjs for the classes and what
 * is compared.
 *
 * Exit 0 when no endpoint differs, 1 when a STRICTER, LOOSER, MISSING, EXTRA or
 * GONE line was found, 2 when the check could not run. UNMAPPED lines (the
 * platform endpoints, which have no endpoint id) never change the exit code.
 * CI replays with no network, so this is a routine to run, not a gate.
 */
import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";

import { createFal } from "../packages/provider/fal/src/index.ts";
import { FAL_ENDPOINT_REQUEST_SCHEMAS } from "../packages/provider/fal/src/zod.ts";
import {
  CLASS_MEANINGS,
  DEFAULT_DELAY_MS,
  DRIFT_CLASSES,
  DRIFT_USER_AGENT,
  exitCodeFor,
  FAL_QUEUE_OPENAPI_URL,
  fetchDocuments,
  oursJsonSchema,
  pairEndpoints,
  schemaDrift,
} from "./lib/fal-schema-drift.mjs";

function show(value) {
  if (value === null || value === undefined) return "none";
  return typeof value === "string" ? value : JSON.stringify(value);
}

function describe(diff) {
  if (diff.class === "GONE" || diff.class === "UNMAPPED") {
    return `${diff.class} ${diff.endpoint}: ${diff.reason}`;
  }
  const detail = diff.detail ? ` ${JSON.stringify(diff.detail)}` : "";
  return `${diff.class} ${diff.endpoint} | ${diff.field} ${diff.facet} | ours ${show(diff.ours)} | live ${show(diff.live)}${detail}`;
}

async function main() {
  const { values } = parseArgs({
    // `pnpm run <script> -- <flags>` passes the separator through.
    args: process.argv.slice(2).filter((arg) => arg !== "--"),
    options: {
      endpoint: { type: "string" },
      cache: { type: "string" },
      out: { type: "string" },
      json: { type: "boolean", default: false },
      "delay-ms": { type: "string" },
    },
  });
  const delayMs =
    values["delay-ms"] === undefined
      ? DEFAULT_DELAY_MS
      : Number(values["delay-ms"]);
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    throw new Error("--delay-ms takes a number of milliseconds");
  }
  const registry = FAL_ENDPOINT_REQUEST_SCHEMAS;
  if (values.endpoint !== undefined && !(values.endpoint in registry)) {
    throw new Error(
      `${values.endpoint} is not an endpoint id in FAL_ENDPOINT_REQUEST_SCHEMAS`
    );
  }
  const paired = pairEndpoints({
    registry,
    provider: createFal({ apiKey: "unused-by-this-check" }),
  });
  const selected = values.endpoint
    ? paired.endpoints.filter(({ id }) => id === values.endpoint)
    : paired.endpoints;
  const startedAt = new Date().toISOString();
  const { documents, fetched, cached } = await fetchDocuments({
    endpointIds: selected.map(({ id }) => id),
    cacheDir: values.cache,
    delayMs,
    onProgress: ({ index, endpointId, cached: hit, status }) => {
      if (!values.json) {
        process.stderr.write(
          `[${index + 1}/${selected.length}] ${endpointId} ${hit ? "cached" : "fetched"} ${status ?? "error"}\n`
        );
      }
    },
  });
  const report = schemaDrift({
    endpoints: selected.map(({ id, schema }) => ({
      id,
      ours: oursJsonSchema(schema),
    })),
    documents,
    unmapped: values.endpoint ? [] : paired.unmapped,
  });
  // A rerun from the cache compares documents fetched earlier: say when.
  const fetchTimes = [...documents.values()]
    .map((doc) => doc.fetchedAt)
    .filter(Boolean)
    .sort();
  const full = {
    startedAt,
    completedAt: new Date().toISOString(),
    source: `GET ${FAL_QUEUE_OPENAPI_URL}?endpoint_id=<endpoint id> (public, no key), User-Agent ${DRIFT_USER_AGENT}, one request at a time`,
    ours: "FAL_ENDPOINT_REQUEST_SCHEMAS in packages/provider/fal/src/zod.ts, through z.toJSONSchema (input mode)",
    documentsFetched: {
      first: fetchTimes[0] ?? null,
      last: fetchTimes.at(-1) ?? null,
    },
    fetched,
    cached,
    ...report,
  };
  if (values.out) {
    await writeFile(values.out, `${JSON.stringify(full, null, 2)}\n`);
  }
  if (values.json) {
    console.log(JSON.stringify(full, null, 2));
  } else {
    console.log(
      `Compared ${report.endpoints.compared} of ${report.endpoints.total} endpoints (${fetched} fetched, ${cached} from cache): ` +
        `${report.endpoints.same} agree.`
    );
    for (const cls of DRIFT_CLASSES) {
      console.log(
        `${cls} ${report.counts[cls]} on ${report.endpointsWith[cls]} endpoints: ${CLASS_MEANINGS[cls]}`
      );
    }
    for (const diff of report.differences) console.log(describe(diff));
    if (values.out) console.log(`Report: ${values.out}`);
  }
  return exitCodeFor(report);
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 2;
  }
);
