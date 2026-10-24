import { readdir, readFile, realpath, stat, lstat } from "node:fs/promises";
import { basename, dirname } from "node:path";
import {
  scrubHar,
  exchangeSucceeded,
  findMatchingRow,
  matchHarEntryStrict,
  type Har,
  type HarEntry,
  type ApicityCallMetadata,
} from "@apicity/har";
import { CliError } from "./errors.js";
import type { EndpointTsvRow } from "./registry.js";
import type { HarReport, Outcomes } from "./har-report-types.js";
import {
  isObject,
  timestamp,
  maskedUrl,
  compare,
  jsonObject,
} from "./har-report-values.js";

export interface Entry {
  entry: HarEntry;
  index: number;
  matchedBy: "strict" | "lenient" | "soleEntry";
}
export interface Call {
  row: EndpointTsvRow;
  file: string;
  meta: ApicityCallMetadata | null;
  primary: Entry[];
  auxiliary: HarEntry[];
  local: HarEntry[];
  outcome: keyof Outcomes;
  time: string | null;
}
export interface Corpus {
  calls: Call[];
  inputs: HarReport["inputs"];
  unmatched: HarReport["unmatched"];
  unresolved: HarReport["unresolvedCalls"];
  realpaths: Set<string>;
}
export function requestBody(entry: HarEntry): Record<string, unknown> | null {
  return ["GET", "HEAD", "DELETE"].includes(
    entry.request.method.toUpperCase()
  ) || !entry.request.postData?.mimeType?.includes("json")
    ? null
    : jsonObject(entry.request.postData.text);
}
export async function loadCorpus(
  paths: string[],
  rows: EndpointTsvRow[],
  opts: {
    since?: string | null;
    baseline?: boolean;
    exclude?: Set<string>;
  } = {}
): Promise<Corpus> {
  const result: Corpus = {
    calls: [],
    inputs: {
      paths,
      files: 0,
      annotatedFiles: 0,
      legacyFiles: 0,
      duplicateFiles: 0,
      unreadable: [],
      entries: 0,
      skipped: {
        malformedEntries: 0,
        localEntries: 0,
        beforeSince: 0,
        noTimestamp: 0,
      },
    },
    unmatched: [],
    unresolved: [],
    realpaths: new Set(),
  };
  const files: { file: string; real: string }[] = [];
  async function collect(path: string, explicit = false): Promise<void> {
    let info;
    try {
      const link = await lstat(path);
      info = link.isSymbolicLink() ? await stat(path) : link;
      if (link.isSymbolicLink() && info.isDirectory()) return;
    } catch (error) {
      if (explicit && (error as NodeJS.ErrnoException).code === "ENOENT")
        throw new CliError("not_found", `path not found: ${path}`, {
          hint: "extract archives first",
        });
      result.inputs.unreadable.push({ file: path, reason: "read-error" });
      return;
    }
    if (info.isDirectory()) {
      try {
        for (const entry of (await readdir(path, { withFileTypes: true })).sort(
          (a, b) => compare(a.name, b.name)
        )) {
          if (entry.name.startsWith(".") || entry.name === "node_modules")
            continue;
          if (
            entry.isDirectory() ||
            (entry.isFile() && entry.name.endsWith(".har"))
          )
            await collect(
              `${path.endsWith("/") ? path : path + "/"}${entry.name}`
            );
        }
      } catch {
        result.inputs.unreadable.push({ file: path, reason: "read-error" });
      }
    } else if (info.isFile()) {
      let real;
      try {
        real = await realpath(path);
      } catch {
        result.inputs.unreadable.push({ file: path, reason: "read-error" });
        return;
      }
      if (opts.exclude?.has(real)) return;
      if (result.realpaths.has(real)) {
        result.inputs.duplicateFiles++;
        return;
      }
      result.realpaths.add(real);
      files.push({ file: path.replace(/\\/g, "/"), real });
    }
  }
  for (const path of paths) await collect(path, true);
  const providers = new Set(rows.map((r) => r.provider));
  function keep(time: string | null): boolean {
    if (!opts.since) return true;
    if (!time) {
      result.inputs.skipped.noTimestamp++;
      return false;
    }
    if (time < opts.since) {
      result.inputs.skipped.beforeSince++;
      return false;
    }
    return true;
  }
  function unmatched(e: HarEntry, hint: string | null) {
    result.unmatched.push({
      method: e.request.method,
      ...maskedUrl(e.request.url),
      providerHint: hint,
      count: 1,
    });
  }
  function outcome(e: HarEntry, row: EndpointTsvRow): keyof Outcomes {
    return exchangeSucceeded(row.provider, e)
      ? "ok"
      : e.response.status === 0
        ? "network_error"
        : "provider_error";
  }
  for (const { file } of files.sort((a, b) => compare(a.file, b.file))) {
    let raw: unknown;
    try {
      raw = JSON.parse(await readFile(file, "utf8"));
    } catch (e) {
      result.inputs.unreadable.push({
        file,
        reason: e instanceof SyntaxError ? "invalid-json" : "read-error",
      });
      continue;
    }
    if (
      !isObject(raw) ||
      !isObject(raw.log) ||
      !Array.isArray(raw.log.entries)
    ) {
      result.inputs.unreadable.push({ file, reason: "not-a-har" });
      continue;
    }
    const log = raw.log;
    const rawEntries = log.entries as unknown[];
    const entries: { entry: HarEntry; index: number }[] = [];
    result.inputs.entries += rawEntries.length;
    rawEntries.forEach((e: unknown, index: number) => {
      if (
        !isObject(e) ||
        !isObject(e.request) ||
        typeof e.request.method !== "string" ||
        typeof e.request.url !== "string" ||
        !isObject(e.response) ||
        typeof e.response.status !== "number"
      )
        result.inputs.skipped.malformedEntries++;
      else entries.push({ entry: e as unknown as HarEntry, index });
    });
    log.entries = entries.map((e) => e.entry);
    if (!opts.baseline) scrubHar(raw as unknown as Har);
    const meta =
      isObject(log._apicity) &&
      typeof log._apicity.provider === "string" &&
      typeof log._apicity.endpoint === "string"
        ? (log._apicity as unknown as ApicityCallMetadata)
        : null;
    result.inputs.files++;
    if (meta) result.inputs.annotatedFiles++;
    else result.inputs.legacyFiles++;
    let hint: string | null = null;
    if (meta && providers.has(meta.provider)) hint = meta.provider;
    if (!meta && typeof log._recordingName === "string") {
      const p = log._recordingName
        .split("/")[0]
        .replace(/^google-flow$/, "googleflow");
      if (providers.has(p)) hint = p;
    }
    if (!hint && !meta)
      for (
        let parent = dirname(file);
        parent !== dirname(parent);
        parent = dirname(parent)
      ) {
        const p = basename(parent).replace(/_\d+$/, "");
        if (/_\d+$/.test(basename(parent)) && providers.has(p)) {
          hint = p;
          break;
        }
      }
    const http = entries.filter((e) => e.entry._apicity?.kind !== "local");
    const local = entries
      .filter((e) => e.entry._apicity?.kind === "local")
      .map((e) => e.entry);
    if (meta) {
      const time = timestamp(
        meta.startedAt ?? entries[0]?.entry.startedDateTime
      );
      if (!keep(time)) continue;
      const candidates = rows.filter(
        (r) => r.provider === meta.provider && r.dotPath === meta.endpoint
      );
      const primary: Entry[] = [];
      let row: EndpointTsvRow | undefined;
      for (const e of http) {
        const match = findMatchingRow(e.entry, candidates, {
          provider: meta.provider,
        });
        if (match) {
          row ??= match;
          primary.push({
            ...e,
            matchedBy: matchHarEntryStrict(e.entry, match)
              ? "strict"
              : "lenient",
          });
        }
      }
      if (!primary.length && http.length === 1) {
        const matches = candidates.filter(
          (r) =>
            r.method.toUpperCase() ===
            http[0].entry.request.method.toUpperCase()
        );
        if (matches.length === 1) {
          row = matches[0];
          primary.push({ ...http[0], matchedBy: "soleEntry" });
        }
      }
      row ??= candidates.length === 1 ? candidates[0] : undefined;
      if (row) {
        const derived = primary.length
          ? outcome(primary[0].entry, row)
          : local.length
            ? "local_error"
            : "provider_error";
        result.calls.push({
          row,
          file,
          meta,
          primary,
          auxiliary: http
            .filter((e) => !primary.some((p) => p.index === e.index))
            .map((e) => e.entry),
          local,
          outcome: [
            "ok",
            "provider_error",
            "local_error",
            "network_error",
          ].includes(meta.outcome)
            ? meta.outcome
            : derived,
          time,
        });
        continue;
      }
      result.unresolved.push({
        provider: meta.provider,
        endpoint: meta.endpoint,
        reason: candidates.length ? "method-ambiguous" : "not-in-catalog",
        count: 1,
        files: [file],
      });
    }
    result.inputs.skipped.localEntries += local.length;
    for (const e of http) {
      const time = timestamp(e.entry.startedDateTime);
      if (!meta && !keep(time)) continue;
      const row = findMatchingRow(e.entry, rows, { provider: hint });
      if (!row) unmatched(e.entry, hint);
      else
        result.calls.push({
          row,
          file,
          meta: null,
          primary: [
            {
              ...e,
              matchedBy: matchHarEntryStrict(e.entry, row)
                ? "strict"
                : "lenient",
            },
          ],
          auxiliary: [],
          local: [],
          outcome: outcome(e.entry, row),
          time,
        });
    }
  }
  result.inputs.unreadable.sort((a, b) => compare(a.file, b.file));
  return result;
}
