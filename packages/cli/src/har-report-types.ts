export type Outcomes = {
  ok: number;
  provider_error: number;
  local_error: number;
  network_error: number;
};
export type ValueList = {
  values: Array<{ value: unknown; count: number }>;
  otherCount: number;
};
export interface HarReport {
  schemaVersion: 1;
  filters: {
    providers: string[] | null;
    endpoint: string | null;
    since: string | null;
  };
  baseline: {
    source: "default" | "flag" | "none";
    path: string | null;
    files: number;
    responses: number;
  };
  inputs: {
    paths: string[];
    files: number;
    annotatedFiles: number;
    legacyFiles: number;
    duplicateFiles: number;
    unreadable: Array<{
      file: string;
      reason: "invalid-json" | "not-a-har" | "read-error";
    }>;
    entries: number;
    skipped: {
      malformedEntries: number;
      localEntries: number;
      beforeSince: number;
      noTimestamp: number;
    };
  };
  summary: {
    endpoints: number;
    records: number;
    calls: number;
    outcomes: Outcomes;
    primaryExchanges: number;
    auxiliaryExchanges: number;
    unmatchedExchanges: number;
    unresolvedCalls: number;
  };
  endpoints: EndpointRecord[];
  unmatched: Array<{
    method: string;
    host: string;
    path: string;
    providerHint: string | null;
    count: number;
  }>;
  unresolvedCalls: Array<{
    provider: string;
    endpoint: string;
    reason: "not-in-catalog" | "method-ambiguous";
    count: number;
    files: string[];
  }>;
}
export interface EndpointRecord {
  provider: string;
  method: string;
  dotPath: string;
  variant: { key: string; value: string } | null;
  schema: {
    status: "ok" | "no-introspection" | "absent" | "unresolved" | "unavailable";
    variantKey: string | null;
    option: "selected" | "none" | null;
  };
  volume: {
    // section 1
    calls: number;
    callsBySource: { annotated: number; legacy: number };
    outcomes: Outcomes;
    exchanges: { primary: number; auxiliary: number; local: number };
    matchedBy: { strict: number; lenient: number; soleEntry: number };
    exchangeSuccess: { succeeded: number; failed: number };
    statusHistogram: Array<{ status: number; count: number }>;
    polls: { available: boolean; reason: string | null; repeats: number };
    latencyMs: { samples: number; p50: number | null; p95: number | null };
    auxiliaryTargets: Array<{ target: string; count: number }>; // "<provider> <METHOD> <dotPath>" or "<METHOD> <host><masked path>"
  };
  providerErrors: { groups: ErrorGroup[] }; // section 2
  schemaTooLoose: {
    available: boolean;
    reason: string | null;
    checked: number;
    rejectedBySchema: number; // section 3
    groups: Array<{
      status: number;
      code: string | null;
      message: string;
      count: number;
      files: string[];
    }>;
  };
  schemaTooStrict: {
    available: boolean;
    reason: string | null;
    checked: number;
    rejected: number; // section 4
    safeParseErrors: number;
    placeholderIssues: number;
    issues: Array<{
      code: string;
      path: string;
      message: string;
      count: number;
    }>;
    unknownKeys: {
      available: boolean;
      reason: string | null;
      keys: Array<{ path: string; count: number; acceptedBySchema: number }>;
    };
    valuesOutsideEnum: Array<
      { path: string; allowed: unknown[]; allowedCount: number } & ValueList
    >;
    valuesOutsideRange: Array<
      {
        path: string;
        minimum: number | null;
        maximum: number | null;
        inclusive: boolean;
      } & ValueList
    >;
  };
  defaults: {
    // section 5
    schemaDefaults: {
      available: boolean;
      reason: string | null;
      bodies: number;
      fields: Array<{
        path: string;
        default: unknown;
        observed: number;
        absent: number;
        equal: number;
        overridden: number;
        overrideRate: number | null;
        values: Array<{ value: unknown; count: number; succeeded: number }>;
        otherCount: number;
      }>;
    };
    factoryDefaults: {
      available: boolean;
      reason: string | null;
      calls: number;
      fields: Array<{ path: string; count: number } & ValueList>;
    };
  };
  responseDrift: {
    available: boolean;
    reason: string | null;
    baselineResponses: number;
    corpusResponses: number; // section 6
    newKeys: Array<{ path: string; types: string[]; count: number }>;
    missingKeys: Array<{
      path: string;
      types: string[];
      baselineCount: number;
    }>;
    typeChanges: Array<{
      path: string;
      baselineTypes: string[];
      corpusTypes: string[];
      newTypes: string[];
    }>;
  };
  localFailures: {
    available: boolean;
    reason: string | null; // section 7
    groups: Array<{
      code: string | null;
      message: string;
      count: number;
      firstSeen: string | null;
      lastSeen: string | null;
      files: string[];
      inputShape: Array<{ path: string; types: string[] }>;
    }>;
  };
  promotion: { candidates: string[]; committedFiles: number | null };
}
export interface ErrorGroup {
  status: number;
  code: string | null;
  message: string;
  source: "response-body" | "call-error" | "http-status";
  payloadRelevant: boolean;
  count: number;
  firstSeen: string | null;
  lastSeen: string | null;
  fields: string[];
  files: string[];
  sample: {
    file: string;
    entry: number | null;
    method: string | null;
    url: string | null;
    body: {
      source: "request" | "input";
      mimeType: string | null;
      value: unknown;
    } | null;
  };
}
