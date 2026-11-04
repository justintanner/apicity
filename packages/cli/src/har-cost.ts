import {
  entryToProviderExchange,
  type ApicityCallMetadata,
  type HarEntry,
} from "@apicity/har";
import {
  loadCostActualHelpers,
  type CostActualHelpers,
  type CostHelperActual,
  type CostHelperBasis,
  type CostHelperComparison,
  type CostHelperEstimate,
  type CostHelperPricing,
  type CostHelperUsage,
  type CostHelperVerdict,
} from "./cost.js";
import { createWriter, type CliWriter } from "./envelope.js";
import { CliError } from "./errors.js";
import {
  proposalsFrom,
  tokenVote,
  unitVote,
  type HarCostProposal,
  type RateVote,
} from "./har-cost-corrections.js";
import { loadCorpus, requestBody, type Corpus } from "./har-report-load.js";
import { table } from "./har-report-render.js";
import type { HarReport } from "./har-report-types.js";
import { compare, isObject, timestamp } from "./har-report-values.js";
import { loadTsv, type EndpointTsvRow } from "./registry.js";

const DEFAULT_TOLERANCE = 0.02;

export interface HarCostGroup {
  provider: string;
  method: string;
  endpoint: string;
  model: string | null;
  calls: number;
  settledCalls: number;
  quoted: { calls: number; usd: number };
  recomputed: { calls: number; usd: number };
  actual: {
    calls: number;
    usd: number;
    listUsd: number;
    basis: Record<CostHelperBasis, number>;
  };
  ratio: { samples: number; p50: number | null; p95: number | null };
  verdicts: Record<CostHelperVerdict, number>;
  usage: CostHelperUsage;
  capturedBeforeRate: number;
}

export interface HarCostReport {
  schemaVersion: 1;
  filters: {
    providers: string[] | null;
    endpoint: string | null;
    model: string | null;
    since: string | null;
    tolerance: number;
  };
  inputs: HarReport["inputs"];
  summary: {
    groups: number;
    calls: number;
    settledCalls: number;
    skippedCalls: number;
    corrections: number;
    unmatchedExchanges: number;
    unresolvedCalls: number;
  };
  groups: HarCostGroup[];
  corrections: HarCostProposal[];
}

interface AssembledCall {
  row: EndpointTsvRow;
  kind: string;
  file: string;
  meta: ApicityCallMetadata | null;
  time: string | null;
  // The exchange the request belongs to. An upload beside it has a body too.
  request: HarEntry | undefined;
  entries: HarEntry[];
}

interface CallCost {
  call: AssembledCall;
  model: string | null;
  actual: CostHelperActual;
  quote: CostHelperEstimate | null;
  recomputed: CostHelperEstimate | null;
  comparison: CostHelperComparison;
  beforeRate: boolean;
  votes: RateVote[];
  // Set when a known rate on this row missed a stated charge.
  wrongRow: string | null;
}

function parseArgs(args: string[]) {
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
    if (key === "json" && eq < 0) {
      switches.add(key);
      continue;
    }
    if (
      !["provider", "endpoint", "model", "since", "tolerance"].includes(key)
    ) {
      throw new CliError("usage", `unknown flag: --${key}`);
    }
    const value = eq < 0 ? args[++i] : arg.slice(eq + 1);
    if (!value || value.startsWith("--")) {
      throw new CliError("usage", `--${key} needs a value`);
    }
    values[key] = value;
  }
  return { values, switches, paths };
}

// The ids a poll names: long or numbered tokens in its URL or body.
function idsIn(entry: HarEntry): string[] {
  const text =
    attempt(() => {
      const { pathname, search } = new URL(entry.request.url);
      return decodeURIComponent(`${pathname}/${search}`);
    }) ?? entry.request.url;
  return `${text}/${entry.request.postData?.text ?? ""}`
    .split(/[/?&=,":{}\s]+/)
    .filter(
      (token) => (token.length >= 8 && /\d/.test(token)) || token.length >= 16
    );
}

// The call a poll belongs to, in a file with no call marks: the latest that
// already mentions the poll's id, so interleaved tasks stay apart and a poll of a
// task with no submit stands alone. A poll naming no id can only follow the call
// before it.
function ownerOf(
  entries: HarEntry[],
  earlier: AssembledCall[]
): AssembledCall | undefined {
  const ids = entries.flatMap(idsIn);
  if (!ids.length) return earlier.find((call) => call.kind !== "followup");
  return earlier.find((call) =>
    call.entries.some((entry) =>
      ids.some(
        (id) =>
          entry.response.content?.text?.includes(id) ||
          entry.request.url.includes(id)
      )
    )
  );
}

// A capture's entries are one call by definition. A recording has no such mark,
// so a poll or result joins its call in the same file: the request and quote are
// on the submit, and the bill is on its last read.
function assembleCalls(
  corpus: Corpus,
  helpers: CostActualHelpers
): AssembledCall[] {
  const calls: AssembledCall[] = [];
  let inFile: AssembledCall[] = [];
  for (const call of corpus.calls) {
    if (inFile[0]?.file !== call.file) inFile = [];
    const entries = [
      ...call.primary.map((primary) => primary.entry),
      ...call.auxiliary,
    ].sort((a, b) => compare(a.startedDateTime, b.startedDateTime));
    const { kind } = helpers.endpointBilling(
      call.row.provider,
      call.row.method,
      call.row.dotPath
    );
    if (!call.meta && kind === "followup") {
      const owner = ownerOf(
        entries,
        inFile
          .filter(
            (earlier) =>
              earlier.row.provider === call.row.provider &&
              earlier.kind !== "free"
          )
          .reverse()
      );
      if (owner) {
        owner.entries.push(...entries);
        continue;
      }
    }
    const assembled: AssembledCall = {
      row: call.row,
      kind,
      file: call.file,
      meta: call.meta,
      time: call.time,
      request: call.primary[0]?.entry,
      entries,
    };
    calls.push(assembled);
    inFile.push(assembled);
  }
  return calls;
}

// A poll's bill belongs to the submit it follows, so a poll seen alone has no
// figure of its own. A free row needs no request body to say it is free.
function recompute(
  { row, kind }: AssembledCall,
  payload: Record<string, unknown> | null,
  helpers: CostActualHelpers
): CostHelperEstimate | null {
  if (kind === "followup") return null;
  if (!payload && kind !== "free" && kind !== "subscription") return null;
  const estimate = helpers.estimateEndpoint({
    provider: row.provider,
    method: row.method,
    dotPath: row.dotPath,
    payload: payload ?? {},
  });
  // A figure the estimator warns about is partial (no output cost, a floor), and
  // a ratio against it says nothing.
  return estimate.status === "unavailable" || estimate.warnings?.length
    ? null
    : estimate;
}

function pricingOf(
  { row }: AssembledCall,
  key: string | null,
  helpers: CostActualHelpers
): { key: string; entry: CostHelperPricing } | null {
  const table = helpers.PRICING[row.provider];
  if (!table) return null;
  const endpointKey =
    helpers.ENDPOINT_PRICING_KEYS[
      `${row.provider} ${row.method} ${row.dotPath}`
    ];
  for (const candidate of [endpointKey, key]) {
    const entry = candidate ? table[candidate] : undefined;
    if (candidate && entry) return { key: candidate, entry };
  }
  return null;
}

// A rate table's pickers read arbitrary payloads. One that throws costs that
// figure, not the call's usage and stated charge.
function attempt<T>(read: () => T): T | null {
  try {
    return read();
  } catch {
    return null;
  }
}

function stringAt(value: unknown, key: string): string | null {
  const found = isObject(value) ? value[key] : undefined;
  return typeof found === "string" ? found : null;
}

function costOf(
  call: AssembledCall,
  helpers: CostActualHelpers,
  tolerance: number
): CallCost {
  const { row, meta } = call;
  const actual = helpers.mergeActuals(
    call.entries.map((entry) =>
      helpers.extractActual(
        entryToProviderExchange(entry, {
          provider: row.provider,
          dotPath: row.dotPath,
        })
      )
    )
  );
  const payload = call.request ? requestBody(call.request) : null;
  // The tables key on what the caller sent; a response may answer with an alias.
  const model =
    stringAt(payload, "model") ??
    stringAt(payload, "model_id") ??
    actual.model ??
    stringAt(meta?.context, "model");
  const quoted = meta?.estimate;
  const quote = quoted && Number.isFinite(quoted.usd) ? quoted : null;
  const recomputed = attempt(() => recompute(call, payload, helpers));
  const comparison = helpers.compareCost(quote ?? recomputed, actual, {
    tolerance,
  });
  const pricing = pricingOf(call, model, helpers);
  const asOf = pricing && (pricing.entry.source.asOf ?? helpers.PRICING_AS_OF);
  const beforeRate = Boolean(
    asOf && (!call.time || call.time.slice(0, 10) < asOf)
  );
  const votes: RateVote[] = [];
  let wrongRow: string | null = null;
  if (pricing && actual.settled) {
    const { entry } = pricing;
    const base = {
      provider: row.provider,
      pricingKey: pricing.key,
      file: call.file,
    };
    const solved = attempt(() =>
      entry.kind === "tokens"
        ? tokenVote(actual, entry, base)
        : unitVote(actual, entry, payload, base)
    );
    if (solved?.vote) votes.push(solved.vote);
    if (solved?.contradicted) wrongRow = `${row.provider} ${pricing.key}`;
  }
  return {
    call,
    model,
    actual,
    quote,
    recomputed,
    comparison,
    beforeRate,
    votes,
    wrongRow,
  };
}

const rounded = (usd: number) => Number(usd.toFixed(10));
const significant = (value: number) => Number(value.toPrecision(6));

function percentile(sorted: number[], share: number): number | null {
  if (!sorted.length) return null;
  return significant(sorted[Math.ceil(share * sorted.length) - 1]);
}

function groupOf(costs: CallCost[]): HarCostGroup {
  const { row } = costs[0].call;
  const group: HarCostGroup = {
    provider: row.provider,
    method: row.method,
    endpoint: row.dotPath,
    model: costs[0].model,
    calls: costs.length,
    settledCalls: 0,
    quoted: { calls: 0, usd: 0 },
    recomputed: { calls: 0, usd: 0 },
    actual: {
      calls: 0,
      usd: 0,
      listUsd: 0,
      basis: { stated: 0, derived: 0, "usage-only": 0, none: 0 },
    },
    ratio: { samples: 0, p50: null, p95: null },
    verdicts: {
      match: 0,
      over: 0,
      under: 0,
      "no-estimate": 0,
      "no-actual": 0,
      free: 0,
    },
    usage: {},
    capturedBeforeRate: 0,
  };
  const ratios: number[] = [];
  const usage: Record<string, number> = {};
  for (const cost of costs) {
    const { actual, comparison, quote, recomputed } = cost;
    group.verdicts[comparison.verdict]++;
    group.actual.basis[actual.basis]++;
    if (cost.beforeRate) group.capturedBeforeRate++;
    // compareCost reads a failed quote as no estimate, so it adds nothing here.
    if (quote && comparison.estimateUsd !== null) {
      group.quoted.calls++;
      group.quoted.usd += comparison.estimateUsd;
    }
    if (recomputed) {
      group.recomputed.calls++;
      group.recomputed.usd += recomputed.usd;
    }
    // An unsettled figure can still move, so totals read settled calls only.
    if (!actual.settled) continue;
    group.settledCalls++;
    const listUsd = actual.statedListUsd ?? actual.usd;
    if (listUsd !== null) {
      group.actual.calls++;
      group.actual.usd += actual.usd ?? 0;
      group.actual.listUsd += listUsd;
    }
    if (comparison.ratio !== null) ratios.push(comparison.ratio);
    for (const [key, value] of Object.entries(actual.usage)) {
      if (typeof value === "number") usage[key] = (usage[key] ?? 0) + value;
    }
  }
  group.quoted.usd = rounded(group.quoted.usd);
  group.recomputed.usd = rounded(group.recomputed.usd);
  group.actual.usd = rounded(group.actual.usd);
  group.actual.listUsd = rounded(group.actual.listUsd);
  ratios.sort((a, b) => a - b);
  group.ratio = {
    samples: ratios.length,
    p50: percentile(ratios, 0.5),
    p95: percentile(ratios, 0.95),
  };
  group.usage = Object.fromEntries(
    Object.entries(usage)
      .sort(([a], [b]) => compare(a, b))
      .map(([key, value]) => [key, rounded(value)])
  );
  return group;
}

function counts(values: Record<string, number>): string {
  const present = Object.entries(values).filter(([, count]) => count > 0);
  return present.map(([name, count]) => `${name} ${count}`).join(", ") || "—";
}

// A figure beside how many calls it covers, as columns can cover different calls.
const usd = (calls: number, value: number) =>
  calls ? `${significant(value)} (${calls})` : null;

function renderCost(report: HarCostReport): string {
  const { inputs, summary } = report;
  const label = (group: HarCostGroup) =>
    `${group.provider} ${group.method} ${group.endpoint}`;
  const lines = [
    "# apicity har cost",
    "",
    `Inputs: ${inputs.files} files (${inputs.annotatedFiles} annotated, ${inputs.legacyFiles} legacy), ${inputs.unreadable.length} unreadable, ${inputs.entries} entries.`,
    `Calls: ${summary.calls}, ${summary.settledCalls} settled, ${summary.skippedCalls} skipped. Unmatched exchanges: ${summary.unmatchedExchanges}. Unresolved calls: ${summary.unresolvedCalls}.`,
    `Verdict tolerance: ${report.filters.tolerance}.`,
    "",
    "## Estimate against actual",
    "",
    "Ratio and verdicts compare each call's quote, or the recomputed figure when no quote was stored, with its actual at list price. A recomputed token figure counts input at chars/4, so its ratio measures that heuristic, not a rate. Paid USD, list USD and usage read settled calls only. USD cells show (calls).",
    "",
    table(
      [
        "Endpoint",
        "Model",
        "Calls",
        "Settled",
        "Quoted USD",
        "Recomputed USD",
        "Paid USD",
        "List USD",
        "Basis",
        "Ratio p50",
        "Ratio p95",
        "Verdicts",
        "Captured before rate",
      ],
      report.groups.map((group) => [
        label(group),
        group.model ?? "—",
        group.calls,
        group.settledCalls,
        usd(group.quoted.calls, group.quoted.usd),
        usd(group.recomputed.calls, group.recomputed.usd),
        usd(group.actual.calls, group.actual.usd),
        usd(group.actual.calls, group.actual.listUsd),
        counts(group.actual.basis),
        group.ratio.p50,
        group.ratio.p95,
        counts(group.verdicts),
        group.capturedBeforeRate,
      ])
    ),
    "",
    "## Usage",
    "",
    table(
      [
        "Endpoint",
        "Model",
        "Input tokens",
        "Output tokens",
        "Cache read",
        "Cache write",
        "Reasoning",
        "Characters",
        "Seconds",
        "Credits",
        "Billable units",
      ],
      report.groups
        .filter((group) => Object.keys(group.usage).length > 0)
        .map((group) => [
          label(group),
          group.model ?? "—",
          group.usage.inputTokens,
          group.usage.outputTokens,
          group.usage.cacheReadInputTokens,
          group.usage.cacheWriteInputTokens,
          group.usage.reasoningTokens,
          group.usage.characters,
          group.usage.seconds,
          group.usage.credits,
          group.usage.billableUnits,
        ])
    ),
    "",
    "## Corrections",
    "",
    report.corrections.length
      ? table(
          [
            "Provider",
            "Pricing key",
            "Field",
            "Current",
            "Implied",
            "Unit",
            "Calls",
            "Files",
          ],
          report.corrections.map((proposal) => [
            proposal.provider,
            proposal.pricingKey,
            proposal.field,
            proposal.current,
            proposal.implied,
            proposal.unit,
            proposal.calls,
            proposal.files.join(", "),
          ])
        )
      : "None.",
  ];
  return lines.join("\n");
}

export async function runHarCost(
  args: string[],
  writer: CliWriter
): Promise<number> {
  const { values, switches, paths } = parseArgs(args);
  if (!paths.length) {
    throw new CliError("usage", "har cost needs one or more paths");
  }
  const since = values.since ? timestamp(values.since) : null;
  if (values.since && !since) {
    throw new CliError("usage", "--since needs an ISO date");
  }
  const tolerance =
    values.tolerance === undefined
      ? DEFAULT_TOLERANCE
      : Number(values.tolerance);
  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new CliError("usage", "--tolerance needs a non-negative number");
  }
  const rows = await loadTsv();
  const providers = values.provider
    ? [...new Set(values.provider.split(","))].sort()
    : null;
  if (providers?.some((p) => !rows.some((r) => r.provider === p))) {
    throw new CliError("usage", "--provider names an unknown provider");
  }
  const corpus = await loadCorpus(paths, rows, { since });
  if (!corpus.inputs.files) {
    throw new CliError("not_found", "no readable HAR files", {
      hint: "extract archives first",
    });
  }
  const helpers = await loadCostActualHelpers();
  const costs: CallCost[] = [];
  let skippedCalls = 0;
  for (const call of assembleCalls(corpus, helpers)) {
    if (
      (providers && !providers.includes(call.row.provider)) ||
      (values.endpoint && values.endpoint !== call.row.dotPath)
    ) {
      continue;
    }
    try {
      const cost = costOf(call, helpers, tolerance);
      if (!values.model || cost.model === values.model) costs.push(cost);
    } catch {
      skippedCalls++;
    }
  }
  const byGroup = new Map<string, CallCost[]>();
  for (const cost of costs) {
    const { row } = cost.call;
    const key = JSON.stringify([
      row.provider,
      row.method,
      row.dotPath,
      cost.model,
    ]);
    byGroup.set(key, [...(byGroup.get(key) ?? []), cost]);
  }
  const groups = [...byGroup.values()]
    .map(groupOf)
    .sort(
      (a, b) =>
        compare(a.provider, b.provider) ||
        compare(a.endpoint, b.endpoint) ||
        compare(a.method, b.method) ||
        compare(a.model, b.model)
    );
  // A capture older than its rate shows a price change, not an error, so its
  // group never proposes. A missed charge on known rates means one of them is
  // wrong, so nothing else solved on that row can be trusted, on any endpoint.
  const wrongRows = new Set(costs.map((cost) => cost.wrongRow));
  const votes = [...byGroup.values()].flatMap((group) =>
    group.some((cost) => cost.beforeRate)
      ? []
      : group
          .flatMap((cost) => cost.votes)
          .filter(
            (vote) => !wrongRows.has(`${vote.provider} ${vote.pricingKey}`)
          )
  );
  const corrections = proposalsFrom(votes).sort(
    (a, b) =>
      compare(a.provider, b.provider) ||
      compare(a.pricingKey, b.pricingKey) ||
      compare(a.field, b.field)
  );
  const report: HarCostReport = {
    schemaVersion: 1,
    filters: {
      providers,
      endpoint: values.endpoint ?? null,
      model: values.model ?? null,
      since,
      tolerance,
    },
    inputs: corpus.inputs,
    summary: {
      groups: groups.length,
      calls: costs.length,
      settledCalls: groups.reduce((n, group) => n + group.settledCalls, 0),
      skippedCalls,
      corrections: corrections.length,
      // Filtered as har report filters them, so the two agree on one corpus.
      unmatchedExchanges: values.endpoint
        ? 0
        : corpus.unmatched.filter(
            (u) =>
              !providers ||
              (u.providerHint && providers.includes(u.providerHint))
          ).length,
      unresolvedCalls: values.endpoint
        ? 0
        : corpus.unresolved.filter(
            (u) => !providers || providers.includes(u.provider)
          ).length,
    },
    groups,
    corrections,
  };
  if (switches.has("json")) {
    return createWriter({
      json: true,
      stdout: writer.out,
      stderr: writer.err,
    }).success(report);
  }
  writer.out(renderCost(report));
  return 0;
}
