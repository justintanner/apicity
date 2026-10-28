import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { createEndless } from "@apicity/endless";
import { createKie } from "@apicity/kie";
import { createOpenLigaDB } from "@apicity/openligadb";
import { createTheSportsDB } from "@apicity/thesportsdb";
import { createXai } from "@apicity/xai";
import { findMatchingRow } from "../../scripts/lib/match-har-to-endpoint.mjs";
import { exampleCandidate } from "../../scripts/lib/example-candidates.mjs";
import {
  exchangeSucceeded,
  responseObject,
} from "../../scripts/lib/exchange-succeeded.mjs";

interface Example {
  source: string;
  payload: unknown;
}
interface HarEntry {
  request: {
    method: string;
    url: string;
    postData?: { text?: string; mimeType?: string };
  };
  response: { status: number; content?: { text?: string; encoding?: string } };
}
interface Carrier {
  provider: string;
  key: string;
  payload: unknown;
  entry: HarEntry;
}
interface Endpoint {
  example?: Example;
  schema?: { safeParse(value: unknown): { success: boolean } };
}

function filesUnder(root: string, filename: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((item) => {
    const path = join(root, item.name);
    return item.isDirectory()
      ? filesUnder(path, filename)
      : item.name === filename
        ? [path]
        : [];
  });
}

const examples = filesUnder("packages/provider", "example.json").map(
  (path) => ({
    provider: path.split("/")[2],
    entries: JSON.parse(readFileSync(path, "utf8")) as Record<string, Example>,
  })
);
const rows = readFileSync("scripts/endpoint-docs.tsv", "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => {
    const [provider, dotPath, method, fullUrl, docsUrl] = line.split("\t");
    return { provider, dotPath, method, fullUrl, docsUrl };
  });

// Index exact derived payloads, not just endpoint names: a recording can
// contain both successful and failed attempts at the same endpoint.
function recordedCarriers(): Map<string, Carrier[]> {
  const index = new Map<string, Carrier[]>();
  for (const path of filesUnder("tests/recordings", "recording.har")) {
    const har = JSON.parse(readFileSync(path, "utf8")) as {
      log: { _recordingName: string; entries: HarEntry[] };
    };
    const hint = path
      .split("/")[2]
      .replace(/_\d+$/, "")
      .replace(/^google-flow$/, "googleflow");
    const carriers = index.get(har.log._recordingName) ?? [];
    for (const entry of har.log.entries) {
      const row = findMatchingRow(entry, rows, { provider: hint });
      if (!row) continue;
      const candidate = exampleCandidate(entry, row, hint);
      if (!candidate) continue;
      carriers.push({
        provider: row.provider,
        key: row.method.toUpperCase() + " " + row.dotPath,
        payload: candidate.payload,
        entry,
      });
    }
    index.set(har.log._recordingName, carriers);
  }
  return index;
}

describe("example provenance", () => {
  it("derives each recorded example from its own successful exchange", () => {
    const index = recordedCarriers();
    const problems: string[] = [];
    for (const { provider, entries } of examples) {
      for (const [key, example] of Object.entries(entries)) {
        if (example.source.startsWith("static:")) continue;
        const matches = (index.get(example.source) ?? []).filter(
          (carrier) =>
            carrier.provider === provider &&
            carrier.key === key &&
            isDeepStrictEqual(carrier.payload, example.payload)
        );
        if (matches.some(({ entry }) => exchangeSucceeded(provider, entry)))
          continue;
        const statuses = matches
          .map(({ entry }) => {
            const body = responseObject(entry);
            return (
              "HTTP " +
              entry.response.status +
              (body?.code === undefined ? "" : ", code " + body.code)
            );
          })
          .join("; ");
        problems.push(
          provider +
            " " +
            key +
            " <- " +
            example.source +
            ": " +
            (statuses || "no matching payload carrier")
        );
      }
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("attaches every static example and validates its endpoint schema", () => {
    // Explicit map: adding a static provider without a factory must fail.
    // Construction only; none of these endpoint functions are invoked.
    const factories: Record<string, unknown> = {
      endless: createEndless(),
      kie: createKie({ apiKey: "test-key" }),
      openligadb: createOpenLigaDB(),
      thesportsdb: createTheSportsDB({ apiKey: "test-key" }),
      xai: createXai({ apiKey: "test-key" }),
    };
    for (const { provider, entries } of examples) {
      const statics = Object.entries(entries).filter(([, ex]) =>
        ex.source.startsWith("static:")
      );
      if (!statics.length) continue;
      expect(
        factories[provider],
        "missing static factory: " + provider
      ).toBeDefined();
      for (const [key, example] of statics) {
        const [method, dotPath] = key.split(" ");
        const segments = dotPath.split(".");
        const root = factories[provider] as Record<string, unknown>;
        function resolve(parts: string[]): unknown {
          let current: unknown = root;
          for (const part of parts) {
            if (
              !current ||
              (typeof current !== "object" && typeof current !== "function")
            )
              return undefined;
            current = (current as Record<string, unknown>)[part];
          }
          return current;
        }
        const paths = [
          [method.toLowerCase(), ...segments],
          segments,
          [segments[0], method.toLowerCase(), ...segments.slice(1)],
        ];
        const endpoint = paths
          .map(resolve)
          .find((value) => typeof value === "function") as Endpoint | undefined;
        const label = provider + " " + key + " <- " + example.source;
        expect(endpoint, label + " is not a callable endpoint").toBeDefined();
        expect(endpoint?.example?.source, label).toBe(example.source);
        expect(endpoint?.example?.payload, label).toEqual(example.payload);
        if (endpoint?.schema) {
          expect(
            endpoint.schema.safeParse(example.payload).success,
            label
          ).toBe(true);
        }
      }
    }
  });
});
