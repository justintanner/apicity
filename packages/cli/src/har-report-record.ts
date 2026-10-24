import {
  exchangeSucceeded,
  responseObject,
  findMatchingRow,
} from "@apicity/har";
import type { EndpointTsvRow } from "./registry.js";
import type { EndpointRecord, Outcomes } from "./har-report-types.js";
import type { Call } from "./har-report-load.js";
import { requestBody } from "./har-report-load.js";
import {
  type SchemaInfo,
  selectedSchema,
  validate,
  schemaReason,
  defaults,
  unknownKeys,
} from "./har-report-schema.js";
import {
  failures,
  groupErrors,
  errorKey,
  errorOrder,
} from "./har-report-errors.js";
import {
  isObject,
  canonical,
  compare,
  availability,
  atPath,
  pathName,
  valueList,
  shapeUnion,
  normalizeMessage,
  maskedUrl,
  placeholder,
  sanitize,
} from "./har-report-values.js";

export const outcomes = (): Outcomes => ({
  ok: 0,
  provider_error: 0,
  local_error: 0,
  network_error: 0,
});
export const rowKey = (
  row: Pick<EndpointTsvRow, "provider" | "method" | "dotPath">
) => `${row.provider} ${row.method} ${row.dotPath}`;
export function variantFor(
  call: Call,
  info: SchemaInfo
): EndpointRecord["variant"] {
  const body =
    call.primary.map((e) => requestBody(e.entry)).find(Boolean) ??
    call.meta?.input;
  return info.variantKey &&
    isObject(body) &&
    typeof body[info.variantKey] === "string"
    ? { key: info.variantKey, value: body[info.variantKey] as string }
    : null;
}
function responses(calls: Call[]): Record<string, unknown>[] {
  return calls.flatMap((c) =>
    c.primary
      .filter((e) => exchangeSucceeded(c.row.provider, e.entry))
      .map((e) => responseObject(e.entry))
      .filter(
        (v): v is Record<string, unknown> => v !== null && !placeholder(v)
      )
  );
}
export function record(
  calls: Call[],
  info: SchemaInfo,
  variant: EndpointRecord["variant"],
  baseline: Call[],
  hasBaseline: boolean,
  rows: EndpointTsvRow[]
): EndpointRecord {
  const row = calls[0].row;
  const annotated = calls.filter((c) => c.meta);
  const primary = calls.flatMap((c) => c.primary);
  const bodies = calls.flatMap((c) =>
    c.primary.flatMap((e) => {
      const body = requestBody(e.entry);
      return body
        ? [
            {
              call: c,
              exchange: e,
              body,
              success: exchangeSucceeded(row.provider, e.entry),
              validation: validate(info, body, variant),
            },
          ]
        : [];
    })
  );
  const selected = selectedSchema(info, variant);
  const schemaUnavailable = !bodies.length
    ? "no JSON request bodies"
    : schemaReason(info);
  const introspectionUnavailable =
    schemaUnavailable ??
    (info.status === "no-introspection"
      ? "schema conversion failed"
      : variant && !selected.node
        ? "no schema option for this variant"
        : null);
  const annotationUnavailable = annotated.length ? null : "no _apicity block";
  const errors = failures(calls);
  const loose: EndpointRecord["schemaTooLoose"] = {
    ...availability(schemaUnavailable),
    checked: 0,
    rejectedBySchema: 0,
    groups: [],
  };
  const looseGroups = new Map<
    string,
    EndpointRecord["schemaTooLoose"]["groups"][number]
  >();
  for (const f of errors) {
    const b = bodies.find(
      (b) => b.call === f.call && b.exchange === f.exchange
    );
    if (!f.group.payloadRelevant || !b?.validation) continue;
    loose.checked++;
    if (!b.validation.accepted) {
      loose.rejectedBySchema++;
      continue;
    }
    const key = errorKey(f.group);
    const g = looseGroups.get(key) ?? {
      status: f.group.status,
      code: f.group.code,
      message: f.group.message,
      count: 0,
      files: [],
    };
    g.count++;
    g.files = [...new Set([...g.files, f.call.file])].sort();
    looseGroups.set(key, g);
  }
  loose.groups = [...looseGroups.values()].sort(errorOrder);
  const strict: EndpointRecord["schemaTooStrict"] = {
    ...availability(schemaUnavailable),
    checked: 0,
    rejected: 0,
    safeParseErrors: 0,
    placeholderIssues: 0,
    issues: [],
    unknownKeys: { ...availability(introspectionUnavailable), keys: [] },
    valuesOutsideEnum: [],
    valuesOutsideRange: [],
  };
  const issues = new Map<
    string,
    EndpointRecord["schemaTooStrict"]["issues"][number]
  >();
  const unknown = new Map<
    string,
    { path: string; count: number; acceptedBySchema: number }
  >();
  const enums = new Map<
    string,
    {
      path: string;
      allowed: unknown[];
      allowedCount: number;
      observations: unknown[];
    }
  >();
  const ranges = new Map<
    string,
    {
      path: string;
      minimum: number | null;
      maximum: number | null;
      inclusive: boolean;
      observations: unknown[];
    }
  >();
  for (const b of bodies.filter((b) => b.success)) {
    if (!info.safe) continue;
    if (!b.validation) {
      strict.safeParseErrors++;
      continue;
    }
    strict.checked++;
    strict.placeholderIssues += b.validation.placeholders;
    if (!b.validation.accepted) strict.rejected++;
    const extra = new Set(
      selected.node ? unknownKeys(b.body, selected.node) : []
    );
    for (const i of b.validation.issues) {
      const path = pathName(i.path);
      const key = canonical([i.code, path, i.message]);
      const issue = issues.get(key) ?? {
        code: i.code,
        path,
        message: i.message,
        count: 0,
      };
      issue.count++;
      issues.set(key, issue);
      if (i.code === "unrecognized_keys" && Array.isArray(i.keys))
        for (const k of i.keys) extra.add(pathName([...i.path, String(k)]));
      const v = atPath(b.body, i.path);
      if (i.code === "invalid_value" && Array.isArray(i.values)) {
        const k = canonical([path, i.values]);
        const item = enums.get(k) ?? {
          path,
          allowed: i.values.slice(0, 50).map(sanitize),
          allowedCount: i.values.length,
          observations: [],
        };
        item.observations.push(v);
        enums.set(k, item);
      }
      if (
        ["too_big", "too_small"].includes(i.code) &&
        ["number", "int", "bigint"].includes(String(i.origin))
      ) {
        const item = {
          path,
          minimum: typeof i.minimum === "number" ? i.minimum : null,
          maximum: typeof i.maximum === "number" ? i.maximum : null,
          inclusive: i.inclusive !== false,
        };
        const k = canonical(item);
        const prev = ranges.get(k) ?? { ...item, observations: [] };
        prev.observations.push(v);
        ranges.set(k, prev);
      }
    }
    for (const path of extra) {
      const item = unknown.get(path) ?? { path, count: 0, acceptedBySchema: 0 };
      item.count++;
      if (b.validation.accepted) item.acceptedBySchema++;
      unknown.set(path, item);
    }
  }
  strict.issues = [...issues.values()].sort(
    (a, b) =>
      b.count - a.count ||
      compare(a.path, b.path) ||
      compare(a.code, b.code) ||
      compare(a.message, b.message)
  );
  strict.unknownKeys.keys = [...unknown.values()].sort((a, b) =>
    compare(a.path, b.path)
  );
  strict.valuesOutsideEnum = [...enums.values()]
    .map(({ observations, ...v }) => ({ ...v, ...valueList(observations) }))
    .sort((a, b) => compare(a.path, b.path));
  strict.valuesOutsideRange = [...ranges.values()]
    .map(({ observations, ...v }) => ({ ...v, ...valueList(observations) }))
    .sort((a, b) => compare(a.path, b.path));
  const schemaDefaults: EndpointRecord["defaults"]["schemaDefaults"] = {
    ...availability(introspectionUnavailable),
    bodies: bodies.length,
    fields: [],
  };
  if (selected.node && !introspectionUnavailable)
    for (const d of defaults(selected.node)) {
      const observations = bodies.filter((b) =>
        isObject(atPath(b.body, d.segments.slice(0, -1)))
      );
      const sent = observations.filter((b) =>
        Object.hasOwn(
          atPath(b.body, d.segments.slice(0, -1)) as object,
          d.segments.at(-1)!
        )
      );
      const equal = sent.filter(
        (b) => canonical(atPath(b.body, d.segments)) === canonical(d.value)
      ).length;
      const list = valueList(sent.map((b) => atPath(b.body, d.segments)));
      schemaDefaults.fields.push({
        path: d.path,
        default: sanitize(d.value),
        observed: observations.length,
        absent: observations.length - sent.length,
        equal,
        overridden: sent.length - equal,
        overrideRate: observations.length
          ? Math.round(((sent.length - equal) / observations.length) * 10000) /
            10000
          : null,
        values: list.values.map((v) => ({
          ...v,
          succeeded: sent.filter(
            (b) =>
              b.success &&
              canonical(sanitize(atPath(b.body, d.segments))) ===
                canonical(v.value)
          ).length,
        })),
        otherCount: list.otherCount,
      });
    }
  const factoryBodies = annotated.flatMap((call) => {
    const body = call.primary.map((e) => requestBody(e.entry)).find(Boolean);
    return body && isObject(call.meta?.input)
      ? [{ body, input: call.meta.input }]
      : [];
  });
  const factoryDefaults: EndpointRecord["defaults"]["factoryDefaults"] = {
    ...availability(
      annotationUnavailable ??
        (factoryBodies.length ? null : "no JSON request bodies")
    ),
    calls: factoryBodies.length,
    fields: [],
  };
  const factory = new Map<string, unknown[]>();
  function factoryWalk(
    body: Record<string, unknown>,
    input: Record<string, unknown>,
    prefix: string
  ) {
    for (const [k, v] of Object.entries(body)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (!Object.hasOwn(input, k))
        factory.set(path, [...(factory.get(path) ?? []), v]);
      else if (isObject(v) && isObject(input[k]))
        factoryWalk(v, input[k], path);
    }
  }
  for (const b of factoryBodies) factoryWalk(b.body, b.input, "");
  factoryDefaults.fields = [...factory]
    .sort(([a], [b]) => compare(a, b))
    .map(([path, values]) => ({
      path,
      count: values.length,
      ...valueList(values),
    }));
  const corpusResponses = responses(calls);
  const baselineResponses = responses(baseline);
  const cs = shapeUnion(corpusResponses),
    bs = shapeUnion(baselineResponses);
  const drift: EndpointRecord["responseDrift"] = {
    ...availability(
      !hasBaseline
        ? "no baseline"
        : !corpusResponses.length
          ? "no successful JSON response"
          : !baselineResponses.length
            ? "no successful baseline response"
            : null
    ),
    baselineResponses: baselineResponses.length,
    corpusResponses: corpusResponses.length,
    newKeys: [],
    missingKeys: [],
    typeChanges: [],
  };
  if (drift.available) {
    for (const [path, c] of cs) {
      const b = bs.get(path);
      if (!b)
        drift.newKeys.push({
          path,
          types: [...c.types].sort(),
          count: c.count,
        });
      else {
        const newTypes = [...c.types].filter((t) => !b.types.has(t)).sort();
        if (newTypes.length)
          drift.typeChanges.push({
            path,
            baselineTypes: [...b.types].sort(),
            corpusTypes: [...c.types].sort(),
            newTypes,
          });
      }
    }
    for (const [path, b] of bs)
      if (!cs.has(path) && b.count === baselineResponses.length)
        drift.missingKeys.push({
          path,
          types: [...b.types].sort(),
          baselineCount: b.count,
        });
    drift.newKeys.sort((a, b) => compare(a.path, b.path));
    drift.missingKeys.sort((a, b) => compare(a.path, b.path));
    drift.typeChanges.sort((a, b) => compare(a.path, b.path));
  }
  const localGroups = new Map<string, Call[]>();
  for (const c of annotated.filter((c) => c.outcome === "local_error")) {
    const key = canonical([
      c.meta?.error?.code === undefined ? null : String(c.meta.error.code),
      normalizeMessage(c.meta?.error?.message ?? "Local error"),
    ]);
    localGroups.set(key, [...(localGroups.get(key) ?? []), c]);
  }
  const localFailures: EndpointRecord["localFailures"] = {
    ...availability(annotationUnavailable),
    groups: [...localGroups]
      .map(([key, group]) => {
        const [code, message] = JSON.parse(key) as [string | null, string];
        const times = group
          .map((c) => c.time)
          .filter((s): s is string => s !== null)
          .sort();
        return {
          code,
          message,
          count: group.length,
          firstSeen: times[0] ?? null,
          lastSeen: times.at(-1) ?? null,
          files: [...new Set(group.map((c) => c.file))].sort(),
          inputShape: [...shapeUnion(group.map((c) => c.meta?.input))]
            .sort(([a], [b]) => compare(a, b))
            .map(([path, s]) => ({ path, types: [...s.types].sort() })),
        };
      })
      .sort(
        (a, b) =>
          b.count - a.count ||
          compare(a.code, b.code) ||
          compare(a.message, b.message)
      ),
  };
  const latencies = primary
    .map((e) => e.entry.time)
    .filter((n) => Number.isFinite(n) && n >= 0)
    .map(Math.round)
    .sort((a, b) => a - b);
  const histogram = new Map<number, number>();
  for (const { entry } of primary)
    histogram.set(
      entry.response.status,
      (histogram.get(entry.response.status) ?? 0) + 1
    );
  const targets = new Map<string, number>();
  for (const c of calls)
    for (const e of c.auxiliary) {
      const match = findMatchingRow(e, rows, { provider: c.row.provider });
      const u = maskedUrl(e.request.url);
      const target = match
        ? rowKey(match)
        : `${e.request.method} ${u.host}${u.path}`;
      targets.set(target, (targets.get(target) ?? 0) + 1);
    }
  const counts = outcomes();
  for (const c of calls) counts[c.outcome]++;
  const succeeded = primary.filter((e) =>
    exchangeSucceeded(row.provider, e.entry)
  ).length;
  return {
    provider: row.provider,
    method: row.method,
    dotPath: row.dotPath,
    variant,
    schema: {
      status: info.status,
      variantKey: info.variantKey,
      option: variant ? (selected.node ? "selected" : "none") : null,
    },
    volume: {
      calls: calls.length,
      callsBySource: {
        annotated: annotated.length,
        legacy: calls.length - annotated.length,
      },
      outcomes: counts,
      exchanges: {
        primary: primary.length,
        auxiliary: calls.reduce((n, c) => n + c.auxiliary.length, 0),
        local: calls.reduce((n, c) => n + c.local.length, 0),
      },
      matchedBy: {
        strict: primary.filter((e) => e.matchedBy === "strict").length,
        lenient: primary.filter((e) => e.matchedBy === "lenient").length,
        soleEntry: primary.filter((e) => e.matchedBy === "soleEntry").length,
      },
      exchangeSuccess: { succeeded, failed: primary.length - succeeded },
      statusHistogram: [...histogram]
        .sort(([a], [b]) => a - b)
        .map(([status, count]) => ({ status, count })),
      polls: {
        ...availability(annotationUnavailable),
        repeats: annotated.reduce(
          (n, c) =>
            n +
            [
              ...c.primary.map((e) => e.entry),
              ...c.auxiliary,
              ...c.local,
            ].reduce(
              (s, e) =>
                s +
                (Number.isFinite(e._apicity?.pollRepeat)
                  ? Math.max(0, e._apicity!.pollRepeat!)
                  : 0),
              0
            ),
          0
        ),
      },
      latencyMs: {
        samples: latencies.length,
        p50: latencies[Math.ceil(0.5 * latencies.length) - 1] ?? null,
        p95: latencies[Math.ceil(0.95 * latencies.length) - 1] ?? null,
      },
      auxiliaryTargets: [...targets]
        .sort(([a], [b]) => compare(a, b))
        .map(([target, count]) => ({ target, count })),
    },
    providerErrors: { groups: groupErrors(errors) },
    schemaTooLoose: loose,
    schemaTooStrict: strict,
    defaults: { schemaDefaults, factoryDefaults },
    responseDrift: drift,
    localFailures,
    promotion: {
      candidates: annotated
        .filter(
          (c) =>
            c.outcome === "ok" &&
            c.primary.length + c.auxiliary.length > 0 &&
            [...c.primary.map((e) => e.entry), ...c.auxiliary].every((e) =>
              exchangeSucceeded(row.provider, e)
            )
        )
        .map((c) => c.file)
        .sort(),
      committedFiles: hasBaseline
        ? new Set(
            baseline
              .filter(
                (c) =>
                  canonical(variantFor(c, info)) === canonical(variant) &&
                  c.primary.some((e) =>
                    exchangeSucceeded(row.provider, e.entry)
                  )
              )
              .map((c) => c.file)
          ).size
        : null,
    },
  };
}
