/**
 * Pure classifier behind `packages/cli/src/call-shapes.ts`.
 *
 * The CLI never guesses how a `{placeholder}` in an endpoint's URL binds to its
 * function signature. Across the 1,658 rows of `scripts/endpoint-docs.tsv`,
 * roughly 930 carry a placeholder other than `{query}`, and the three ways they
 * bind are not distinguishable from the URL: some are a leading positional
 * argument (`fn(taskId, req)`), some are a property of the request object
 * (`fn({ bucket, key })`), and some are a credential the factory substitutes
 * and a caller must never be asked for (`telegram` `{token}`).
 *
 * This module holds the rules and nothing else: no filesystem, no ts-morph, no
 * provider import. `scripts/gen-call-shapes.mjs` feeds it the signature facts
 * it reads off each endpoint's leaf, and the unit tests exercise it directly.
 */

/**
 * Placeholders the provider factory fills from its own credential. They are
 * neither a flag nor a request property: exposing one would ask a caller to
 * re-type a secret the factory already holds.
 */
export const INJECTED_PLACEHOLDERS = {
  telegram: ["token"],
  thesportsdb: ["apiKey"],
};

/**
 * Providers whose endpoint source is vendored from another provider, so the
 * walker resolves their leaves under the donor's name. `b2` re-exports the
 * `s3` signing/transport/schema source verbatim and is deliberately excluded
 * from the endpoint walk (it is docs-only in the tsv), so its 38
 * placeholder-carrying rows have no leaf of their own to read.
 */
export const PROVIDER_SOURCE_ALIASES = {
  b2: {
    donor: "s3",
    why: "b2 vendors the s3 S3-compatible source; identical dotPaths and signatures.",
  },
};

/**
 * Per-row rulings for placeholders the rules above cannot reach, keyed
 * `provider\tmethod\tdotPath`. Every entry carries a `why` so the next reader
 * can check it against the leaf instead of trusting it.
 *
 * `placeholders` maps a placeholder name to its ruling:
 *   `{ kind: "field", property }` | `{ kind: "positional", param, optional }`
 *   | `{ kind: "injected" }` | `{ kind: "derived" }`
 */
export const OVERRIDES = {
  // --- the walker's synthesized `{param}` -----------------------------------
  // `scripts/endpoint-map.mjs` writes `{param}` for a URL segment it cannot
  // name (a non-literal interpolation). The placeholder therefore carries no
  // information at all, and each of these rows says what the leaf actually
  // interpolates there. A repeated `{param}` takes an array: one ruling per
  // occurrence, in URL order.
  "fal\tGET\tv1.models.requests.payloads": {
    why: "Synthesized {param}; the leaf interpolates params.request_id.",
    placeholders: { param: { kind: "field", property: "request_id" } },
  },
  "fal\tDELETE\tv1.models.requests.payloads": {
    why: "Synthesized {param}; the leaf interpolates params.request_id.",
    placeholders: { param: { kind: "field", property: "request_id" } },
  },
  "fal\tPOST\tv1.serverless.files.uploadLocal": {
    why: "Synthesized {param}; the leaf interpolates params.target_path.",
    placeholders: { param: { kind: "field", property: "target_path" } },
  },
  "fal\tPOST\tv1.serverless.files.uploadUrl": {
    why: "Synthesized {param}; the leaf interpolates params.file.",
    placeholders: { param: { kind: "field", property: "file" } },
  },
  "fireworks\tGET\tinference.v1.accounts.supervisedFineTuningJobs": {
    why: "Synthesized {param} twice: req.accountId then req.jobId.",
    placeholders: {
      param: [
        { kind: "field", property: "accountId" },
        { kind: "field", property: "jobId" },
      ],
    },
  },
  "fireworks\tDELETE\tinference.v1.accounts.supervisedFineTuningJobs": {
    why: "Synthesized {param} twice: req.accountId then req.jobId.",
    placeholders: {
      param: [
        { kind: "field", property: "accountId" },
        { kind: "field", property: "jobId" },
      ],
    },
  },
  "fireworks\tPOST\tinference.v1.accounts.supervisedFineTuningJobs.resume": {
    why: "Synthesized {param} twice: req.accountId then req.jobId.",
    placeholders: {
      param: [
        { kind: "field", property: "accountId" },
        { kind: "field", property: "jobId" },
      ],
    },
  },
  "s3\tGET\tbuckets.listDirectory": {
    why: "Synthesized {param} is the s3express-control host's region segment, taken from the factory's region option, not from the caller.",
    placeholders: { param: { kind: "derived" } },
  },
  "s3\tGET\tbuckets.createSession": {
    why: "Both synthesized {param} segments form the s3express zonal host, derived by s3ExpressZonalBase from req.bucket and the factory's region option; only {bucket} is a caller input.",
    placeholders: { param: { kind: "derived" } },
  },
  "s3\tPUT\tobjects.rename": {
    why: "Both synthesized {param} segments form the s3express zonal host, derived by s3ExpressZonalBase from req.bucket and the factory's region option; only {bucket} and {key} are caller inputs.",
    placeholders: { param: { kind: "derived" } },
  },
  "s3\tPOST\tobjectLambda.writeGetObjectResponse": {
    why: "The object-lambda host is `${req.requestRoute}.s3-object-lambda.${opts.region}`: the first synthesized {param} is a request field, the second the factory's region option.",
    placeholders: {
      param: [{ kind: "field", property: "requestRoute" }, { kind: "derived" }],
    },
  },

  // --- placeholders named after a local, not a request property -------------
  "dolthub\tGET\tapi.v2.operations.get": {
    why: "The URL comment names the local `operationId`; the leaf reads req.id.",
    placeholders: { operationId: { kind: "field", property: "id" } },
  },
  "dolthub\tGET\tv1alpha1.sql.read": {
    why: "The URL comment names the local `refPath`, built as `/${req.ref}` when req.ref is set; the caller supplies `ref`.",
    placeholders: { refPath: { kind: "field", property: "ref" } },
  },
};

/** `{query}` is the query string the endpoint builds itself, never an input. */
export const RESERVED_QUERY_PLACEHOLDER = "query";

const PLACEHOLDER_RE = /\{(\w+)\}/g;

/**
 * Every non-`{query}` placeholder occurrence in a URL, in order. A name repeats
 * only where `endpoint-map` synthesized `{param}` for two different segments,
 * which is why occurrences and not names are the unit of classification.
 */
export function placeholderOccurrences(fullUrl) {
  const out = [];
  for (const match of String(fullUrl ?? "").matchAll(PLACEHOLDER_RE)) {
    if (match[1] === RESERVED_QUERY_PLACEHOLDER) continue;
    out.push(match[1]);
  }
  return out;
}

/** Every non-`{query}` placeholder in a URL, in order, without duplicates. */
export function urlPlaceholders(fullUrl) {
  return [...new Set(placeholderOccurrences(fullUrl))];
}

/** `vector_store_id` → `vectorStoreId`. The one spelling shift providers make. */
export function toCamelCase(name) {
  return name.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

/** Either spelling of a name matches the other: `{vector_store_id}` is `vectorStoreId`. */
function sameName(a, b) {
  if (a === b) return true;
  return toCamelCase(a) === toCamelCase(b);
}

export function callShapeKey(provider, method, dotPath) {
  return `${provider}\t${method}\t${dotPath}`;
}

/**
 * Classify every placeholder of one endpoint.
 *
 * @param {object} row
 * @param {string} row.provider
 * @param {string} row.method    Upstream HTTP method, as the tsv spells it.
 * @param {string} row.dotPath
 * @param {string} row.fullUrl
 * @param {Array<{name: string, optional: boolean, isRequestObject: boolean,
 *   isStringUnion?: boolean, properties?: string[]}>} row.params  The leaf's
 *   declared parameters, in order, with `signal` already dropped.
 *   `properties` is the resolved key set of a request-object parameter, and
 *   `isStringUnion` marks the `string | Request` parameter of an overloaded
 *   endpoint.
 * @param {object} [row.override] The `OVERRIDES` entry for this row, if any.
 * @returns {{positional: object[], fields: object[], injected: string[],
 *   derived: string[], unresolved: string[]}}
 */
export function classifyPlaceholders({
  provider,
  method,
  dotPath,
  fullUrl,
  params = [],
  override,
}) {
  const positional = [];
  const fields = [];
  const injected = [];
  const derived = [];
  const unresolved = [];

  const injectedForProvider = INJECTED_PLACEHOLDERS[provider] ?? [];
  const ruled = override?.placeholders ?? {};
  const seenByName = new Map();
  const claimedParams = new Set();

  for (const placeholder of placeholderOccurrences(fullUrl)) {
    const occurrence = seenByName.get(placeholder) ?? 0;
    seenByName.set(placeholder, occurrence + 1);

    const ruling = rulingFor(ruled[placeholder], occurrence);
    if (ruling) {
      applyRuling(placeholder, ruling);
      continue;
    }
    // Without a per-occurrence ruling the rules below are name-based, so a
    // repeat would land in exactly the same bucket. Classify it once.
    if (occurrence > 0) continue;

    if (injectedForProvider.includes(placeholder)) {
      injected.push(placeholder);
      continue;
    }

    const param = params.find(
      (p) =>
        !p.isRequestObject &&
        !p.isStringUnion &&
        !claimedParams.has(p.name) &&
        sameName(p.name, placeholder)
    );
    if (param) {
      claimedParams.add(param.name);
      pushPositional(placeholder, param.name, param.optional);
      continue;
    }

    const property = findProperty(params, placeholder);
    if (property) {
      fields.push({ placeholder, property });
      continue;
    }

    // An overloaded endpoint folds its two calling conventions into one
    // `string | Request` parameter and branches on `typeof x === "string"`.
    // The string arm is this placeholder, and it is always optional: calling
    // the endpoint with the request object instead omits it.
    const union = params.filter(
      (p) => p.isStringUnion && !claimedParams.has(p.name)
    );
    if (union.length === 1) {
      claimedParams.add(union[0].name);
      pushPositional(placeholder, union[0].name, true);
      continue;
    }

    unresolved.push(placeholder);
  }

  return { positional, fields, injected, derived, unresolved };

  /** A repeated placeholder may carry one ruling per occurrence. */
  function rulingFor(entry, occurrence) {
    if (!entry) return null;
    return Array.isArray(entry) ? (entry[occurrence] ?? null) : entry;
  }

  function pushPositional(placeholder, param, optional) {
    const entry = { placeholder, param, optional: Boolean(optional) };
    if (param !== placeholder) entry.alias = placeholder;
    positional.push(entry);
  }

  function applyRuling(placeholder, ruling) {
    if (ruling.kind === "positional") {
      pushPositional(placeholder, ruling.param, ruling.optional);
      return;
    }
    if (ruling.kind === "field") {
      fields.push({ placeholder, property: ruling.property });
      return;
    }
    if (ruling.kind === "injected") {
      injected.push(placeholder);
      return;
    }
    if (ruling.kind === "derived") {
      derived.push(placeholder);
      return;
    }
    throw new Error(
      `Unknown override ruling "${ruling.kind}" for ${callShapeKey(provider, method, dotPath)}`
    );
  }
}

function findProperty(params, placeholder) {
  for (const param of params) {
    if (!param.isRequestObject || !param.properties) continue;
    const hit = param.properties.find((prop) => sameName(prop, placeholder));
    if (hit) return hit;
  }
  return null;
}

/**
 * Classify a whole tsv, skipping rows with no placeholder to bind.
 *
 * `lookup(row)` answers the leaf facts for one row, or `null` when no leaf
 * could be identified. A row whose leaf is missing, or whose placeholders do
 * not all classify, lands in `unresolved` — the generator prints those and
 * refuses to write rather than guessing.
 *
 * @returns {{shapes: Map<string, object>, unresolved: object[]}}
 */
export function classifyAll(rows, lookup) {
  const shapes = new Map();
  const unresolved = [];

  for (const row of rows) {
    if (urlPlaceholders(row.fullUrl).length === 0) continue;

    const key = callShapeKey(row.provider, row.method, row.dotPath);
    const override = OVERRIDES[key];
    const leaf = lookup(row);
    if (!leaf) {
      unresolved.push({
        key,
        reason: "no-leaf",
        placeholders: urlPlaceholders(row.fullUrl),
      });
      continue;
    }

    const shape = classifyPlaceholders({
      ...row,
      params: leaf.params,
      override,
    });
    if (shape.unresolved.length > 0) {
      unresolved.push({
        key,
        reason: "unclassified-placeholder",
        placeholders: shape.unresolved,
        params: leaf.params.map((p) => p.name),
      });
      continue;
    }

    shapes.set(key, {
      provider: row.provider,
      method: row.method,
      dotPath: row.dotPath,
      positional: shape.positional,
      fields: shape.fields,
      injected: shape.injected,
      derived: shape.derived,
    });
  }

  return { shapes, unresolved };
}
