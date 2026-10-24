import type { HarReport } from "./har-report-types.js";

const cell = (v: unknown) =>
  String(v ?? "n/a")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
function table(headers: string[], rows: unknown[][]): string {
  return [headers, headers.map(() => "---"), ...rows]
    .map((r) => `| ${r.map(cell).join(" | ")} |`)
    .join("\n");
}
/** Human report: the JSON remains the versioned machine contract. */
export function renderReport(report: HarReport): string {
  const lines = [
    "# apicity har report",
    "",
    `Inputs: ${report.inputs.files} files (${report.inputs.annotatedFiles} annotated, ${report.inputs.legacyFiles} legacy), ${report.inputs.entries} entries, ${report.inputs.unreadable.length} unreadable. Baseline: ${report.baseline.path ?? "none"}. Filters: ${JSON.stringify(report.filters)}.`,
    "",
    "## Summary",
    "",
    table(
      [
        "Endpoint",
        "Variant",
        "Calls",
        "OK",
        "Provider errors",
        "Local errors",
        "Network errors",
        "p50 ms",
        "p95 ms",
        "Error groups",
        "Too loose",
        "Too strict",
        "Unknown keys",
        "Drift",
      ],
      report.endpoints.map((r) => [
        `${r.provider} ${r.method} ${r.dotPath}`,
        r.variant ? `${r.variant.key}=${r.variant.value}` : "—",
        r.volume.calls,
        r.volume.outcomes.ok,
        r.volume.outcomes.provider_error,
        r.volume.outcomes.local_error,
        r.volume.outcomes.network_error,
        r.volume.latencyMs.p50,
        r.volume.latencyMs.p95,
        r.providerErrors.groups.length,
        r.schemaTooLoose.groups.reduce((n, g) => n + g.count, 0),
        r.schemaTooStrict.rejected,
        r.schemaTooStrict.unknownKeys.keys.length,
        r.responseDrift.available
          ? r.responseDrift.newKeys.length +
            r.responseDrift.missingKeys.length +
            r.responseDrift.typeChanges.length
          : "n/a",
      ])
    ),
  ];
  // Compact long file lists in prose while retaining the complete machine output.
  function compact(value: unknown, key = ""): unknown {
    if (key === "path" && value === "") return "(root)";
    if (Array.isArray(value))
      return key === "files" && value.length > 5
        ? [...value.slice(0, 5), `and ${value.length - 5} more`]
        : value.map((v) => compact(v));
    if (value !== null && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, compact(v, k)])
      );
    return value;
  }
  function detail(value: unknown) {
    lines.push("```json", JSON.stringify(compact(value), null, 2), "```");
  }
  function section(
    title: string,
    available: { available: boolean; reason: string | null },
    value: unknown[],
    stats?: unknown
  ) {
    lines.push("", title, "");
    if (!available.available) {
      lines.push(`not available (${available.reason})`);
      return;
    }
    if (stats) detail(stats);
    if (!value.length) lines.push("none");
    else detail(value);
  }
  for (const r of report.endpoints) {
    lines.push(
      "",
      `## ${r.provider} ${r.method} ${r.dotPath}${r.variant ? ` [${r.variant.key}=${r.variant.value}]` : ""}`,
      "",
      "### 1. Volume",
      ""
    );
    detail(r.volume);
    if (!r.volume.polls.available)
      lines.push(`Poll repeats: not available (${r.volume.polls.reason})`);
    section(
      "### 2. Provider errors",
      { available: true, reason: null },
      r.providerErrors.groups
    );
    section(
      "### 3. Schema too loose",
      r.schemaTooLoose,
      r.schemaTooLoose.groups,
      {
        checked: r.schemaTooLoose.checked,
        rejectedBySchema: r.schemaTooLoose.rejectedBySchema,
      }
    );
    section(
      "### 4. Schema too strict",
      r.schemaTooStrict,
      r.schemaTooStrict.issues,
      {
        checked: r.schemaTooStrict.checked,
        rejected: r.schemaTooStrict.rejected,
        safeParseErrors: r.schemaTooStrict.safeParseErrors,
        placeholderIssues: r.schemaTooStrict.placeholderIssues,
      }
    );
    if (r.schemaTooStrict.available) {
      section(
        "Unknown keys",
        r.schemaTooStrict.unknownKeys,
        r.schemaTooStrict.unknownKeys.keys
      );
      detail({
        valuesOutsideEnum: r.schemaTooStrict.valuesOutsideEnum,
        valuesOutsideRange: r.schemaTooStrict.valuesOutsideRange,
      });
    }
    lines.push("", "### 5. Defaults");
    section(
      "Schema defaults",
      r.defaults.schemaDefaults,
      r.defaults.schemaDefaults.fields
    );
    section(
      "Factory defaults sent",
      r.defaults.factoryDefaults,
      r.defaults.factoryDefaults.fields
    );
    section(
      "### 6. Response drift",
      r.responseDrift,
      [
        ...r.responseDrift.newKeys,
        ...r.responseDrift.missingKeys,
        ...r.responseDrift.typeChanges,
      ].length
        ? [r.responseDrift]
        : []
    );
    section("### 7. Local failures", r.localFailures, r.localFailures.groups);
  }
  section(
    "## Unmatched exchanges",
    { available: true, reason: null },
    report.unmatched
  );
  section(
    "## Unresolved calls",
    { available: true, reason: null },
    report.unresolvedCalls
  );
  section(
    "## Skipped files",
    { available: true, reason: null },
    report.inputs.unreadable
  );
  return lines.join("\n");
}
