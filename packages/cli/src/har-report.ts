import { existsSync } from "node:fs";
import { loadTsv } from "./registry.js";
import { createWriter, type CliWriter } from "./envelope.js";
import { CliError } from "./errors.js";
import type { HarReport } from "./har-report-types.js";
import { loadCorpus, type Call } from "./har-report-load.js";
import { schemaLoader } from "./har-report-schema.js";
import { outcomes, rowKey, variantFor, record } from "./har-report-record.js";
import { canonical, compare, timestamp } from "./har-report-values.js";
import { renderReport } from "./har-report-render.js";

export async function runHarReport(
  args: string[],
  writer: CliWriter
): Promise<number> {
  const values: Record<string, string> = {};
  const switches = new Set<string>();
  const paths: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("--")) {
      paths.push(arg);
      continue;
    }
    const eq = arg.indexOf("=");
    const key = arg.slice(2, eq < 0 ? undefined : eq);
    if (["json", "no-baseline"].includes(key) && eq < 0) {
      switches.add(key);
      continue;
    }
    if (!["provider", "endpoint", "since", "baseline"].includes(key))
      throw new CliError("usage", `unknown flag: --${key}`);
    const value = eq < 0 ? args[++i] : arg.slice(eq + 1);
    if (!value || value.startsWith("--"))
      throw new CliError("usage", `--${key} needs a value`);
    values[key] = value;
  }
  if (!paths.length)
    throw new CliError("usage", "har report needs one or more paths");
  if (values.baseline && switches.has("no-baseline"))
    throw new CliError(
      "usage",
      "--baseline and --no-baseline are mutually exclusive"
    );
  const since = values.since ? timestamp(values.since) : null;
  if (values.since && !since)
    throw new CliError("usage", "--since needs an ISO date");
  const rows = await loadTsv();
  const providers = values.provider
    ? [...new Set(values.provider.split(","))].sort()
    : null;
  if (providers?.some((p) => !rows.some((r) => r.provider === p)))
    throw new CliError("usage", "--provider names an unknown provider");
  const corpus = await loadCorpus(paths, rows, { since });
  if (!corpus.inputs.files)
    throw new CliError("not_found", "no readable HAR files", {
      hint: "extract archives first",
    });
  const baselinePath = switches.has("no-baseline")
    ? null
    : (values.baseline ??
      (existsSync("tests/recordings") && existsSync("scripts/endpoint-docs.tsv")
        ? "tests/recordings"
        : null));
  const baseline = baselinePath
    ? await loadCorpus([baselinePath], rows, {
        baseline: true,
        exclude: corpus.realpaths,
      })
    : null;
  const loadSchema = schemaLoader();
  const groups = new Map<string, Call[]>();
  for (const call of corpus.calls) {
    if (
      (providers && !providers.includes(call.row.provider)) ||
      (values.endpoint && values.endpoint !== call.row.dotPath)
    )
      continue;
    const info = await loadSchema(call.row);
    const key = canonical([rowKey(call.row), variantFor(call, info)]);
    groups.set(key, [...(groups.get(key) ?? []), call]);
  }
  const endpoints: HarReport["endpoints"] = [];
  for (const calls of groups.values()) {
    const info = await loadSchema(calls[0].row);
    endpoints.push(
      record(
        calls,
        info,
        variantFor(calls[0], info),
        baseline?.calls.filter((c) => rowKey(c.row) === rowKey(calls[0].row)) ??
          [],
        baseline !== null,
        rows
      )
    );
  }
  endpoints.sort(
    (a, b) =>
      compare(a.provider, b.provider) ||
      compare(a.dotPath, b.dotPath) ||
      compare(a.method, b.method) ||
      compare(a.variant?.value ?? null, b.variant?.value ?? null)
  );
  const unmatchedMap = new Map<string, HarReport["unmatched"][number]>();
  for (const u of corpus.unmatched) {
    if (
      values.endpoint ||
      (providers && (!u.providerHint || !providers.includes(u.providerHint)))
    )
      continue;
    const key = canonical([u.host, u.path, u.method, u.providerHint]);
    const item = unmatchedMap.get(key) ?? { ...u, count: 0 };
    item.count += u.count;
    unmatchedMap.set(key, item);
  }
  const unmatched = [...unmatchedMap.values()].sort(
    (a, b) =>
      compare(a.host, b.host) ||
      compare(a.path, b.path) ||
      compare(a.method, b.method) ||
      compare(a.providerHint, b.providerHint)
  );
  const unresolvedMap = new Map<string, HarReport["unresolvedCalls"][number]>();
  for (const u of corpus.unresolved) {
    if (values.endpoint || (providers && !providers.includes(u.provider)))
      continue;
    const key = canonical([u.provider, u.endpoint, u.reason]);
    const item = unresolvedMap.get(key) ?? { ...u, count: 0, files: [] };
    item.count += u.count;
    item.files = [...new Set([...item.files, ...u.files])].sort();
    unresolvedMap.set(key, item);
  }
  const unresolvedCalls = [...unresolvedMap.values()].sort(
    (a, b) =>
      compare(a.provider, b.provider) ||
      compare(a.endpoint, b.endpoint) ||
      compare(a.reason, b.reason)
  );
  const summary: HarReport["summary"] = {
    endpoints: new Set(endpoints.map(rowKey)).size,
    records: endpoints.length,
    calls: 0,
    outcomes: outcomes(),
    primaryExchanges: 0,
    auxiliaryExchanges: 0,
    unmatchedExchanges: unmatched.reduce((n, u) => n + u.count, 0),
    unresolvedCalls: unresolvedCalls.reduce((n, u) => n + u.count, 0),
  };
  for (const r of endpoints) {
    summary.calls += r.volume.calls;
    summary.primaryExchanges += r.volume.exchanges.primary;
    summary.auxiliaryExchanges += r.volume.exchanges.auxiliary;
    for (const key of Object.keys(
      summary.outcomes
    ) as (keyof typeof summary.outcomes)[])
      summary.outcomes[key] += r.volume.outcomes[key];
  }
  const report: HarReport = {
    schemaVersion: 1,
    filters: { providers, endpoint: values.endpoint ?? null, since },
    baseline: {
      source: baselinePath ? (values.baseline ? "flag" : "default") : "none",
      path: baselinePath,
      files: baseline?.inputs.files ?? 0,
      responses: 0,
    },
    inputs: corpus.inputs,
    summary,
    endpoints,
    unmatched,
    unresolvedCalls,
  };
  // Count successful JSON baseline responses once, independently of variant records.
  const { exchangeSucceeded, responseObject } = await import("@apicity/har");
  const { placeholder } = await import("./har-report-values.js");
  report.baseline.responses =
    baseline?.calls.reduce(
      (n, c) =>
        n +
        c.primary.filter((e) => {
          const body = responseObject(e.entry);
          return (
            exchangeSucceeded(c.row.provider, e.entry) &&
            body !== null &&
            !placeholder(body)
          );
        }).length,
      0
    ) ?? 0;
  if (switches.has("json"))
    return createWriter({
      json: true,
      stdout: writer.out,
      stderr: writer.err,
    }).success(report);
  writer.out(renderReport(report));
  return 0;
}
