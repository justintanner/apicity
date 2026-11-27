/**
 * Compares apicity's fal request schemas with the input schemas fal serves in
 * its public queue OpenAPI documents.
 *
 * On 2026-11-25 five fal limits were found stale only because a request
 * happened to hit them (the HeyGen duration caps, the Wan 3.0 prompt cap, the
 * FLUX 3 Max resolutions): each time our zod schema rejected a request that fal
 * accepts. Nothing compared the two. This module does, field by field.
 *
 * Both sides are JSON Schema. Ours comes from the zod schemas themselves
 * (`z.toJSONSchema` in input mode, so a defaulted field is optional), and
 * fal's is the input component its queue OpenAPI document references from
 * `POST /<endpoint id>`. Each side is reduced to a list of single-type
 * branches, so `anyOf`, `oneOf`, `allOf`, `$ref`, `const` and multi-type
 * `type` arrays compare alike, and each field is compared by kind: string
 * `minLength` and `maxLength`, number and integer bounds, enum members (a
 * member counts as accepted when a branch of that side accepts it, so an
 * open model-id enum's pattern is honoured), array `minItems` and `maxItems`,
 * required fields, and fields present on one side only. Nested objects and
 * array items are compared the same way, under dotted paths (`a.b`, `a[]`).
 *
 * What it does not compare: `null` (fal lists every optional field as
 * `anyOf [T, null]`, apicity omits it instead), defaults, formats,
 * `multipleOf`, and zod refinements, which JSON Schema cannot carry. A
 * cross-field rule in a `superRefine` is invisible to this check.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

export const DRIFT_CLASSES = Object.freeze([
  "STRICTER",
  "LOOSER",
  "MISSING",
  "EXTRA",
  "GONE",
  "UNMAPPED",
]);

export const CLASS_MEANINGS = Object.freeze({
  STRICTER: "apicity rejects a request that fal accepts",
  LOOSER: "apicity accepts a request that fal rejects",
  MISSING: "fal lists an input field apicity does not model",
  EXTRA: "apicity models a field fal does not list",
  GONE: "fal serves no queue OpenAPI schema for an endpoint apicity ships",
  UNMAPPED: "a request schema this check cannot pair with a fal input schema",
});

// UNMAPPED is a census line, like the KIE check's NOTICE: the platform
// endpoints (queue submit, storage, logs) are always on it.
export const EXIT_CLASSES = Object.freeze([
  "STRICTER",
  "LOOSER",
  "MISSING",
  "EXTRA",
  "GONE",
]);

export const FAL_QUEUE_OPENAPI_URL =
  "https://fal.ai/api/openapi/queue/openapi.json";
export const DRIFT_USER_AGENT = "schema-drift-check/1.0";
export const DEFAULT_DELAY_MS = 300;

const MAX_DEPTH = 12;
// zod's `.int()` exports the safe-integer range as bounds; it is not a limit.
const SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
// An integer range this short compares with an enum member by member.
const FINITE_RANGE_LIMIT = 1000;
const RETRY_DELAYS_MS = Object.freeze([2000, 5000]);

export function queueOpenApiUrl(endpointId) {
  const url = new URL(FAL_QUEUE_OPENAPI_URL);
  url.searchParams.set("endpoint_id", endpointId);
  return url.toString();
}

// ---------------------------------------------------------------------------
// Our side

/** Our request schema as JSON Schema, from zod's own export. */
export function oursJsonSchema(schema) {
  return z.toJSONSchema(schema, { io: "input", unrepresentable: "any" });
}

/**
 * Pairs every schema-carrying leaf of the provider tree with the registry.
 * A leaf whose schema object is not in the registry (the platform APIs:
 * queue submit, storage, logs, files) is UNMAPPED, one entry per schema.
 */
export function pairEndpoints({ registry, provider }) {
  const registered = new Set(Object.values(registry));
  const unpaired = new Map();
  const seen = new Set();
  const walk = (node, dotPath) => {
    if (node === null) return;
    if (typeof node !== "object" && typeof node !== "function") return;
    if (seen.has(node)) return;
    seen.add(node);
    const schema = node.schema;
    if (schema && typeof schema === "object" && !registered.has(schema)) {
      unpaired.set(schema, [...(unpaired.get(schema) ?? []), dotPath]);
    }
    for (const key of Object.keys(node)) {
      if (key === "schema") continue;
      walk(node[key], dotPath ? `${dotPath}.${key}` : key);
    }
  };
  walk(provider, "");
  const endpoints = Object.entries(registry)
    .map(([id, schema]) => ({ id, schema }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const unmapped = [...unpaired.values()]
    .map((dotPaths) => ({
      class: "UNMAPPED",
      endpoint: dotPaths[0],
      dotPaths,
      reason:
        "not a model endpoint: its schema is not in FAL_ENDPOINT_REQUEST_SCHEMAS, so it has no endpoint id to look up",
    }))
    .sort((a, b) => a.endpoint.localeCompare(b.endpoint));
  return { endpoints, unmapped };
}

// ---------------------------------------------------------------------------
// fal's side

/**
 * The input schema a queue OpenAPI document references from POST /<id>.
 * Returns `{ schema, component }`, or `{ reason }` when the document has none.
 */
export function liveInputSchema(document, endpointId) {
  if (!isObject(document)) return { reason: "no document" };
  const paths = isObject(document.paths) ? document.paths : {};
  const operation = paths[`/${endpointId}`]?.post;
  const schema =
    operation?.requestBody?.content?.["application/json"]?.schema ?? null;
  if (!isObject(schema)) {
    const listed = Object.keys(paths)
      .filter((p) => !p.includes("/requests/"))
      .join(", ");
    return {
      reason: `document has no POST /${endpointId} JSON request body (paths: ${listed || "none"})`,
    };
  }
  const ref = typeof schema.$ref === "string" ? schema.$ref : null;
  return {
    schema,
    component: ref?.startsWith("#/components/schemas/")
      ? ref.slice("#/components/schemas/".length)
      : null,
  };
}

// ---------------------------------------------------------------------------
// Normal form: a schema is a list of single-type branches (its anyOf).

const KINDS = new Set([
  "string",
  "number",
  "boolean",
  "null",
  "array",
  "object",
]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function resolvePointer(root, ref) {
  if (typeof ref !== "string" || !ref.startsWith("#")) return undefined;
  let node = root;
  for (const raw of ref.slice(1).split("/").slice(1)) {
    const key = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (!isObject(node) && !Array.isArray(node)) return undefined;
    node = node[key];
  }
  return node;
}

function kindOfValue(value) {
  if (value === null) return "null";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) return "array";
  return "object";
}

function isLimit(value) {
  return typeof value === "number" && Math.abs(value) < SAFE_INTEGER;
}

function lowerBound(schema) {
  const bounds = [];
  if (isLimit(schema.minimum)) {
    bounds.push({ value: schema.minimum, exclusive: false });
  }
  if (isLimit(schema.exclusiveMinimum)) {
    bounds.push({ value: schema.exclusiveMinimum, exclusive: true });
  }
  return bounds.reduce(
    (tight, bound) => (tight ? tighterLower(tight, bound) : bound),
    undefined
  );
}

function upperBound(schema) {
  const bounds = [];
  if (isLimit(schema.maximum)) {
    bounds.push({ value: schema.maximum, exclusive: false });
  }
  if (isLimit(schema.exclusiveMaximum)) {
    bounds.push({ value: schema.exclusiveMaximum, exclusive: true });
  }
  return bounds.reduce(
    (tight, bound) => (tight ? tighterUpper(tight, bound) : bound),
    undefined
  );
}

function tighterLower(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a.value !== b.value) return a.value > b.value ? a : b;
  return a.exclusive ? a : b;
}

function tighterUpper(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a.value !== b.value) return a.value < b.value ? a : b;
  return a.exclusive ? a : b;
}

function looserLower(a, b) {
  if (!a || !b) return undefined;
  if (a.value !== b.value) return a.value < b.value ? a : b;
  return a.exclusive ? b : a;
}

function looserUpper(a, b) {
  if (!a || !b) return undefined;
  if (a.value !== b.value) return a.value > b.value ? a : b;
  return a.exclusive ? b : a;
}

function baseBranches(schema, ctx, depth) {
  const declared = Array.isArray(schema.type)
    ? schema.type
    : typeof schema.type === "string"
      ? [schema.type]
      : null;
  const values = Array.isArray(schema.enum)
    ? schema.enum
    : "const" in schema
      ? [schema.const]
      : null;
  let kinds;
  if (declared) {
    kinds = declared.map((type) => (type === "integer" ? "number" : type));
  } else if (values) {
    kinds = [...new Set(values.map(kindOfValue))];
  } else if (isObject(schema.properties) || "additionalProperties" in schema) {
    kinds = ["object"];
  } else if ("items" in schema || "prefixItems" in schema) {
    kinds = ["array"];
  } else if ("minLength" in schema || "maxLength" in schema) {
    kinds = ["string"];
  } else if (
    ["minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum"].some(
      (key) => key in schema
    )
  ) {
    kinds = ["number"];
  } else {
    return [{ kind: "any" }];
  }
  const integer = declared?.includes("integer") && !declared.includes("number");
  return [...new Set(kinds)]
    .filter((kind) => KINDS.has(kind))
    .map((kind) => {
      const branch = { kind };
      if (values) {
        branch.enum = values.filter((value) => kindOfValue(value) === kind);
        if (kind === "number" && integer) {
          branch.enum = branch.enum.filter(Number.isInteger);
        }
      }
      if (kind === "string") {
        if (typeof schema.minLength === "number") {
          branch.minLength = schema.minLength;
        }
        if (typeof schema.maxLength === "number") {
          branch.maxLength = schema.maxLength;
        }
        if (typeof schema.pattern === "string") {
          branch.patterns = [schema.pattern];
        }
      } else if (kind === "number") {
        branch.integer = Boolean(integer);
        branch.min = lowerBound(schema);
        branch.max = upperBound(schema);
      } else if (kind === "array") {
        if (typeof schema.minItems === "number") {
          branch.minItems = schema.minItems;
        }
        if (typeof schema.maxItems === "number") {
          branch.maxItems = schema.maxItems;
        }
        branch.items = isObject(schema.items)
          ? normalize(schema.items, ctx, depth + 1)
          : [{ kind: "any" }];
      } else if (kind === "object") {
        branch.properties = {};
        for (const [name, child] of Object.entries(schema.properties ?? {})) {
          branch.properties[name] = normalize(child, ctx, depth + 1);
        }
        branch.required = new Set(
          Array.isArray(schema.required) ? schema.required : []
        );
        branch.closed = schema.additionalProperties === false;
        if (isObject(schema.additionalProperties)) {
          branch.additional = normalize(
            schema.additionalProperties,
            ctx,
            depth + 1
          );
        }
      }
      return branch;
    })
    .filter((branch) => !branch.enum || branch.enum.length > 0);
}

function hasBaseKeywords(schema) {
  return [
    "type",
    "enum",
    "const",
    "properties",
    "additionalProperties",
    "items",
    "prefixItems",
    "minLength",
    "maxLength",
    "minimum",
    "maximum",
    "exclusiveMinimum",
    "exclusiveMaximum",
  ].some((key) => key in schema);
}

/**
 * A JSON Schema as a list of single-type branches. `ctx.root` resolves
 * `$ref`s; `ctx.stack` guards recursive references.
 */
export function normalize(schema, ctx, depth = 0) {
  if (schema === true || schema === undefined) return [{ kind: "any" }];
  if (schema === false) return [];
  if (!isObject(schema) || depth > MAX_DEPTH) return [{ kind: "any" }];
  const parts = [];
  if (typeof schema.$ref === "string") {
    if (ctx.stack.includes(schema.$ref)) {
      parts.push([{ kind: "any" }]);
    } else {
      const target = resolvePointer(ctx.root, schema.$ref);
      ctx.stack.push(schema.$ref);
      parts.push(normalize(target, ctx, depth + 1));
      ctx.stack.pop();
    }
  }
  if (Array.isArray(schema.allOf)) {
    for (const member of schema.allOf) {
      parts.push(normalize(member, ctx, depth + 1));
    }
  }
  for (const key of ["anyOf", "oneOf"]) {
    if (Array.isArray(schema[key])) {
      parts.push(
        schema[key].flatMap((member) => normalize(member, ctx, depth + 1))
      );
    }
  }
  if (hasBaseKeywords(schema) || parts.length === 0) {
    parts.push(baseBranches(schema, ctx, depth));
  }
  const branches = parts.reduce((acc, part) => intersect(acc, part));
  if (typeof schema.description !== "string") return branches;
  // Kept for one hint only: whether fal's prose states a limit its schema omits.
  return branches.map((branch) => ({
    ...branch,
    descriptions: [...(branch.descriptions ?? []), schema.description],
  }));
}

function intersect(left, right) {
  const out = [];
  for (const a of left) {
    for (const b of right) {
      const merged = intersectBranch(a, b);
      if (merged) out.push(merged);
    }
  }
  return out;
}

function intersectEnum(a, b) {
  if (!a) return b;
  if (!b) return a;
  return a.filter((value) => b.some((other) => Object.is(other, value)));
}

function intersectBranch(a, b) {
  if (a.kind === "any" || b.kind === "any") {
    const kept = a.kind === "any" ? b : a;
    const descriptions = [...(a.descriptions ?? []), ...(b.descriptions ?? [])];
    return descriptions.length ? { ...kept, descriptions } : kept;
  }
  if (a.kind !== b.kind) return null;
  const merged = { ...a, ...b };
  if (a.descriptions || b.descriptions) {
    merged.descriptions = [
      ...(a.descriptions ?? []),
      ...(b.descriptions ?? []),
    ];
  }
  merged.enum = intersectEnum(a.enum, b.enum);
  if (!merged.enum) delete merged.enum;
  else if (merged.enum.length === 0) return null;
  if (a.kind === "string") {
    merged.minLength = maxDefined(a.minLength, b.minLength);
    merged.maxLength = minDefined(a.maxLength, b.maxLength);
    merged.patterns = [...(a.patterns ?? []), ...(b.patterns ?? [])];
  } else if (a.kind === "number") {
    merged.integer = a.integer || b.integer;
    merged.min = tighterLower(a.min, b.min);
    merged.max = tighterUpper(a.max, b.max);
  } else if (a.kind === "array") {
    merged.minItems = maxDefined(a.minItems, b.minItems);
    merged.maxItems = minDefined(a.maxItems, b.maxItems);
    merged.items = intersect(a.items, b.items);
  } else if (a.kind === "object") {
    merged.properties = { ...a.properties };
    for (const [name, child] of Object.entries(b.properties)) {
      merged.properties[name] = merged.properties[name]
        ? intersect(merged.properties[name], child)
        : child;
    }
    merged.required = new Set([...a.required, ...b.required]);
    merged.closed = a.closed || b.closed;
  }
  for (const key of Object.keys(merged)) {
    if (merged[key] === undefined) delete merged[key];
  }
  return merged;
}

function maxDefined(a, b) {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return Math.max(a, b);
}

function minDefined(a, b) {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return Math.min(a, b);
}

// ---------------------------------------------------------------------------
// Acceptance of a single value, for enum members

function acceptsValue(branches, value) {
  return branches.some((branch) => branchAccepts(branch, value));
}

function patternMatches(pattern, value) {
  try {
    return new RegExp(pattern, "u").test(value);
  } catch {
    try {
      return new RegExp(pattern).test(value);
    } catch {
      return true;
    }
  }
}

function branchAccepts(branch, value) {
  if (branch.kind === "any") return true;
  if (branch.kind !== kindOfValue(value)) return false;
  if (branch.enum && !branch.enum.some((member) => Object.is(member, value))) {
    return false;
  }
  if (branch.kind === "string") {
    const length = [...value].length;
    if (branch.minLength !== undefined && length < branch.minLength) {
      return false;
    }
    if (branch.maxLength !== undefined && length > branch.maxLength) {
      return false;
    }
    return (branch.patterns ?? []).every((p) => patternMatches(p, value));
  }
  if (branch.kind === "number") {
    if (branch.integer && !Number.isInteger(value)) return false;
    if (branch.min) {
      if (
        branch.min.exclusive
          ? value <= branch.min.value
          : value < branch.min.value
      ) {
        return false;
      }
    }
    if (branch.max) {
      if (
        branch.max.exclusive
          ? value >= branch.max.value
          : value > branch.max.value
      ) {
        return false;
      }
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Merged facets per kind, for the bound comparisons

function ofKind(branches, kind) {
  return branches.filter((branch) => branch.kind === kind);
}

function closedEnum(branches) {
  if (!branches.length || branches.some((branch) => !branch.enum)) return null;
  const members = [];
  for (const branch of branches) {
    for (const value of branch.enum) {
      if (
        branchAccepts(branch, value) &&
        !members.some((m) => Object.is(m, value))
      ) {
        members.push(value);
      }
    }
  }
  return members;
}

/**
 * Every value the branches accept, when that is a short list: enum members,
 * both booleans, or a bounded integer range. Null when the set is open.
 */
function finiteMembers(branches) {
  if (!branches.length) return null;
  const members = [];
  for (const branch of branches) {
    let values;
    if (branch.enum) {
      values = branch.enum.filter((value) => branchAccepts(branch, value));
    } else if (branch.kind === "boolean") {
      values = [true, false];
    } else if (branch.kind === "number" && branch.integer) {
      const lo = integerLower(branch.min);
      const hi = integerUpper(branch.max);
      if (!lo || !hi || hi.value - lo.value > FINITE_RANGE_LIMIT) return null;
      values = [];
      for (let v = Math.ceil(lo.value); v <= Math.floor(hi.value); v += 1) {
        values.push(v);
      }
    } else {
      return null;
    }
    for (const value of values) {
      if (!members.some((m) => Object.is(m, value))) members.push(value);
    }
  }
  return members;
}

function boundLabel(bound, side) {
  if (!bound) return side === "min" ? "-inf" : "inf";
  return bound.exclusive
    ? `${side === "min" ? "(" : ""}${bound.value}${side === "max" ? ")" : ""}`
    : String(bound.value);
}

/** A short label for an open value set, such as `integer 2..30`. */
function openLabel(branches) {
  const labels = branches.map((branch) => {
    if (branch.enum) return `${branch.enum.length} listed values`;
    if (branch.kind === "string") {
      return branch.patterns?.length
        ? `string matching ${branch.patterns.map((p) => `/${p}/`).join(" and ")}`
        : "string";
    }
    if (branch.kind === "number") {
      const min = branch.integer ? integerLower(branch.min) : branch.min;
      const max = branch.integer ? integerUpper(branch.max) : branch.max;
      const type = branch.integer ? "integer" : "number";
      return min || max
        ? `${type} ${boundLabel(min, "min")}..${boundLabel(max, "max")}`
        : type;
    }
    return branch.kind;
  });
  return [...new Set(labels)].join(" | ");
}

function stringFacets(branches) {
  return {
    minLength: Math.min(...branches.map((b) => b.minLength ?? 0)),
    maxLength: Math.max(...branches.map((b) => b.maxLength ?? Infinity)),
  };
}

function integerLower(bound) {
  if (!bound?.exclusive) return bound;
  return { value: Math.floor(bound.value) + 1, exclusive: false };
}

function integerUpper(bound) {
  if (!bound?.exclusive) return bound;
  return { value: Math.ceil(bound.value) - 1, exclusive: false };
}

function numberFacets(branches) {
  const integer = branches.every((branch) => branch.integer);
  const lowers = branches.map((b) => (b.integer ? integerLower(b.min) : b.min));
  const uppers = branches.map((b) => (b.integer ? integerUpper(b.max) : b.max));
  return {
    integer,
    min: lowers.reduce((acc, bound) => looserLower(acc, bound)),
    max: uppers.reduce((acc, bound) => looserUpper(acc, bound)),
  };
}

function arrayFacets(branches) {
  return {
    minItems: Math.min(...branches.map((b) => b.minItems ?? 0)),
    maxItems: Math.max(...branches.map((b) => b.maxItems ?? Infinity)),
    items: branches.flatMap((branch) => branch.items ?? [{ kind: "any" }]),
  };
}

function objectFacets(branches) {
  const properties = {};
  for (const branch of branches) {
    for (const [name, child] of Object.entries(branch.properties ?? {})) {
      properties[name] = [...(properties[name] ?? []), ...child];
    }
  }
  const required = new Set(
    Object.keys(properties).filter((name) =>
      branches.every((branch) => branch.required?.has(name))
    )
  );
  const additional = branches.every((branch) => branch.additional)
    ? branches.flatMap((branch) => branch.additional)
    : null;
  return {
    properties,
    required,
    closed: branches.every((branch) => branch.closed),
    additional,
  };
}

// ---------------------------------------------------------------------------
// Comparison

function display(bound) {
  if (bound === undefined || bound === Infinity) return null;
  if (typeof bound === "number") return bound;
  return bound.exclusive ? `exclusive ${bound.value}` : bound.value;
}

function lowerCmp(a, b) {
  // >0 when a is tighter (accepts less) than b.
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  if (a.value !== b.value) return a.value > b.value ? 1 : -1;
  if (a.exclusive === b.exclusive) return 0;
  return a.exclusive ? 1 : -1;
}

function upperCmp(a, b) {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  if (a.value !== b.value) return a.value < b.value ? 1 : -1;
  if (a.exclusive === b.exclusive) return 0;
  return a.exclusive ? 1 : -1;
}

function kindsOf(branches) {
  return new Set(
    branches.map((branch) => branch.kind).filter((kind) => kind !== "null")
  );
}

function typeLabel(branches) {
  const labels = new Set();
  for (const branch of branches) {
    if (branch.kind === "null") continue;
    labels.add(
      branch.kind === "number" && branch.integer ? "integer" : branch.kind
    );
  }
  return [...labels].sort().join("|") || "null";
}

/**
 * Differences between our field schema and fal's, both normalized.
 * `field` is the dotted path; the top level is "".
 */
export function compareNormalized(ours, live, field = "") {
  const diffs = [];
  const liveText = live
    .flatMap((branch) => branch.descriptions ?? [])
    .join(" ");
  const push = (cls, facet, oursValue, liveValue, detail) => {
    const diff = { class: cls, field, facet, ours: oursValue, live: liveValue };
    // Only where fal's schema states no limit: an unbounded or open live side.
    const liveOpen =
      liveValue === null || (facet === "enum" && typeof liveValue === "string");
    const hint =
      cls === "STRICTER" && liveOpen && liveStates(liveText, facet, oursValue)
        ? { liveDescriptionStates: true }
        : null;
    if (detail || hint) diff.detail = { ...detail, ...hint };
    diffs.push(diff);
  };
  const oursAny = ours.some((branch) => branch.kind === "any");
  const liveAny = live.some((branch) => branch.kind === "any");
  if (oursAny && liveAny) return diffs;
  if (oursAny || liveAny) {
    // One side does not constrain the value at all.
    if (liveAny) {
      push("STRICTER", "type", typeLabel(ours), "any");
    } else {
      push("LOOSER", "type", "any", typeLabel(live));
    }
    return diffs;
  }
  const oursKinds = kindsOf(ours);
  const liveKinds = kindsOf(live);
  const onlyLive = [...liveKinds].filter((kind) => !oursKinds.has(kind));
  const onlyOurs = [...oursKinds].filter((kind) => !liveKinds.has(kind));
  if (onlyLive.length) {
    push("STRICTER", "type", typeLabel(ours), typeLabel(live), {
      liveOnlyKinds: onlyLive,
    });
  }
  if (onlyOurs.length) {
    push("LOOSER", "type", typeLabel(ours), typeLabel(live), {
      oursOnlyKinds: onlyOurs,
    });
  }
  for (const kind of ["string", "number", "boolean", "array", "object"]) {
    const o = ofKind(ours, kind);
    const l = ofKind(live, kind);
    if (!o.length || !l.length) continue;
    compareEnums(o, l, push);
    if (kind === "string" && !closedEnum(o) && !closedEnum(l)) {
      const of = stringFacets(o);
      const lf = stringFacets(l);
      const min = Math.sign(of.minLength - lf.minLength);
      if (min > 0) push("STRICTER", "minLength", of.minLength, lf.minLength);
      if (min < 0) push("LOOSER", "minLength", of.minLength, lf.minLength);
      if (of.maxLength < lf.maxLength) {
        push(
          "STRICTER",
          "maxLength",
          display(of.maxLength),
          display(lf.maxLength)
        );
      }
      if (of.maxLength > lf.maxLength) {
        push(
          "LOOSER",
          "maxLength",
          display(of.maxLength),
          display(lf.maxLength)
        );
      }
    } else if (kind === "number") {
      const of = numberFacets(o);
      const lf = numberFacets(l);
      if (!closedEnum(o) && !closedEnum(l)) {
        if (of.integer && !lf.integer) {
          push("STRICTER", "type", "integer", "number");
        }
        if (!of.integer && lf.integer) {
          push("LOOSER", "type", "number", "integer");
        }
        const lower = lowerCmp(of.min, lf.min);
        if (lower > 0)
          push("STRICTER", "minimum", display(of.min), display(lf.min));
        if (lower < 0)
          push("LOOSER", "minimum", display(of.min), display(lf.min));
        const upper = upperCmp(of.max, lf.max);
        if (upper > 0)
          push("STRICTER", "maximum", display(of.max), display(lf.max));
        if (upper < 0)
          push("LOOSER", "maximum", display(of.max), display(lf.max));
      }
    } else if (kind === "array") {
      const of = arrayFacets(o);
      const lf = arrayFacets(l);
      if (of.minItems > lf.minItems)
        push("STRICTER", "minItems", of.minItems, lf.minItems);
      if (of.minItems < lf.minItems)
        push("LOOSER", "minItems", of.minItems, lf.minItems);
      if (of.maxItems < lf.maxItems) {
        push(
          "STRICTER",
          "maxItems",
          display(of.maxItems),
          display(lf.maxItems)
        );
      }
      if (of.maxItems > lf.maxItems) {
        push("LOOSER", "maxItems", display(of.maxItems), display(lf.maxItems));
      }
      diffs.push(...compareNormalized(of.items, lf.items, `${field}[]`));
    } else if (kind === "object") {
      diffs.push(...compareObjects(objectFacets(o), objectFacets(l), field));
    }
  }
  return diffs;
}

// Enum members are compared by acceptance: a member one side lists counts as
// accepted by the other when one of its branches takes it, so an open model-id
// enum (`z.enum([...]).or(z.string().regex(...))`) keeps its pattern, and an
// integer range or a boolean is compared member by member.
const BOUND_FACETS = new Set([
  "minimum",
  "maximum",
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
]);

function mentions(text, token) {
  const escaped = String(token).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\w.])${escaped}(?![\\w]|\\.\\w)`).test(text);
}

/**
 * Whether fal's description of the field states our value although its schema
 * does not: "Max 5000 characters" for a maxLength of 5000, or every member of
 * our enum named in the text. A one-digit number is too common to count.
 */
export function liveStates(text, facet, oursValue) {
  if (!text) return false;
  const plain = text.replace(/(\d),(?=\d{3}\b)/g, "$1");
  if (BOUND_FACETS.has(facet)) {
    return (
      typeof oursValue === "number" &&
      !(Number.isInteger(oursValue) && Math.abs(oursValue) < 10) &&
      mentions(plain, oursValue)
    );
  }
  if (facet === "enum" && Array.isArray(oursValue) && oursValue.length) {
    return oursValue.every((member) => mentions(plain, member));
  }
  return false;
}

function compareEnums(ours, live, push) {
  const liveEnum = closedEnum(live);
  const oursEnum = closedEnum(ours);
  if (!liveEnum && !oursEnum) return;
  const liveValues = liveEnum ?? finiteMembers(live);
  const oursValues = oursEnum ?? finiteMembers(ours);
  const oursShown = oursEnum ?? openLabel(ours);
  const liveShown = liveEnum ?? openLabel(live);
  if (liveValues) {
    const rejected = liveValues.filter((value) => !acceptsValue(ours, value));
    if (rejected.length) {
      push("STRICTER", "enum", oursShown, liveShown, { liveOnly: rejected });
    }
  } else {
    push("STRICTER", "enum", oursShown, liveShown);
  }
  if (oursValues) {
    const extra = oursValues.filter((value) => !acceptsValue(live, value));
    if (extra.length) {
      push("LOOSER", "enum", oursShown, liveShown, { oursOnly: extra });
    }
  } else {
    push("LOOSER", "enum", oursShown, liveShown);
  }
}

function join(field, name) {
  return field ? `${field}.${name}` : name;
}

function compareObjects(ours, live, field) {
  const diffs = [];
  for (const [name, liveChild] of Object.entries(live.properties)) {
    const path = join(field, name);
    const oursChild = ours.properties[name];
    if (!oursChild) {
      const detail = {};
      if (live.required.has(name)) detail.liveRequired = true;
      if (ours.closed) detail.oursRejectsUnknownFields = true;
      diffs.push({
        class: "MISSING",
        field: path,
        facet: "field",
        ours: null,
        live: typeLabel(liveChild),
        ...(Object.keys(detail).length ? { detail } : {}),
      });
      continue;
    }
    const oursRequired = ours.required.has(name);
    const liveRequired = live.required.has(name);
    if (oursRequired && !liveRequired) {
      diffs.push({
        class: "STRICTER",
        field: path,
        facet: "required",
        ours: "required",
        live: "optional",
      });
    }
    if (!oursRequired && liveRequired) {
      diffs.push({
        class: "LOOSER",
        field: path,
        facet: "required",
        ours: "optional",
        live: "required",
      });
    }
    diffs.push(...compareNormalized(oursChild, liveChild, path));
  }
  for (const [name, oursChild] of Object.entries(ours.properties)) {
    if (name in live.properties) continue;
    diffs.push({
      class: "EXTRA",
      field: join(field, name),
      facet: "field",
      ours: typeLabel(oursChild),
      live: null,
      ...(ours.required.has(name) ? { detail: { oursRequired: true } } : {}),
    });
  }
  if (ours.additional && live.additional) {
    diffs.push(
      ...compareNormalized(ours.additional, live.additional, join(field, "*"))
    );
  }
  return diffs;
}

/** Differences between two JSON Schemas, each resolved against its root. */
export function compareSchemas({ ours, oursRoot, live, liveRoot }) {
  const oursNormal = normalize(ours, { root: oursRoot ?? ours, stack: [] });
  const liveNormal = normalize(live, { root: liveRoot ?? live, stack: [] });
  return compareNormalized(oursNormal, liveNormal, "");
}

// ---------------------------------------------------------------------------
// Report

function sortDiffs(diffs) {
  const order = new Map(DRIFT_CLASSES.map((cls, index) => [cls, index]));
  return diffs.sort(
    (a, b) =>
      order.get(a.class) - order.get(b.class) ||
      a.endpoint.localeCompare(b.endpoint) ||
      String(a.field ?? "").localeCompare(String(b.field ?? "")) ||
      String(a.facet ?? "").localeCompare(String(b.facet ?? ""))
  );
}

/**
 * The drift report. `endpoints` holds `{ id, ours }` (ours: JSON Schema);
 * `documents` maps an endpoint id to `{ status, body, fetchedAt? }`;
 * `unmapped` holds the census lines from `pairEndpoints`.
 *
 * @param {{
 *   endpoints: Array<{ id: string, ours: object }>,
 *   documents: Map<string, any>,
 *   unmapped?: Array<object>,
 * }} options
 */
export function schemaDrift({ endpoints, documents, unmapped = [] }) {
  const differences = [];
  const perEndpoint = [];
  for (const { id, ours } of endpoints) {
    const doc = documents.get(id);
    const record = {
      endpoint: id,
      status: doc?.status ?? null,
      fetchedAt: doc?.fetchedAt ?? null,
    };
    if (!doc || doc.status !== 200 || !isObject(doc.body)) {
      const reason = !doc
        ? "not fetched"
        : doc.error
          ? `fetch failed: ${doc.error}`
          : `HTTP ${doc.status}, no schema served`;
      differences.push({
        class: "GONE",
        endpoint: id,
        status: record.status,
        reason,
      });
      perEndpoint.push({ ...record, outcome: "GONE" });
      continue;
    }
    const input = liveInputSchema(doc.body, id);
    if (!input.schema) {
      differences.push({
        class: "UNMAPPED",
        endpoint: id,
        reason: input.reason,
      });
      perEndpoint.push({ ...record, outcome: "UNMAPPED" });
      continue;
    }
    const found = compareSchemas({
      ours,
      live: input.schema,
      liveRoot: doc.body,
    }).map((diff) => ({ endpoint: id, ...diff }));
    differences.push(...found);
    perEndpoint.push({
      ...record,
      component: input.component,
      outcome: found.length ? "DIFFER" : "SAME",
      differences: found.length,
    });
  }
  differences.push(...unmapped);
  sortDiffs(differences);
  const counts = Object.fromEntries(
    DRIFT_CLASSES.map((cls) => [
      cls,
      differences.filter((diff) => diff.class === cls).length,
    ])
  );
  const endpointsWith = Object.fromEntries(
    DRIFT_CLASSES.map((cls) => [
      cls,
      new Set(
        differences
          .filter((diff) => diff.class === cls)
          .map((diff) => diff.endpoint)
      ).size,
    ])
  );
  return {
    classes: CLASS_MEANINGS,
    endpoints: {
      total: endpoints.length,
      compared: perEndpoint.filter((e) => e.component !== undefined).length,
      same: perEndpoint.filter((e) => e.outcome === "SAME").length,
    },
    counts,
    endpointsWith,
    differences,
    perEndpoint,
  };
}

export function exitCodeFor(report) {
  return EXIT_CLASSES.some((cls) => report.counts[cls] > 0) ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Fetching, one request at a time, through an optional cache directory

export function cachePath(cacheDir, endpointId) {
  return path.join(cacheDir, `${encodeURIComponent(endpointId)}.json`);
}

async function readCache(cacheDir, endpointId) {
  if (!cacheDir) return null;
  try {
    return JSON.parse(await readFile(cachePath(cacheDir, endpointId), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchOnce(fetchImpl, url) {
  const response = await fetchImpl(url, {
    headers: { "user-agent": DRIFT_USER_AGENT, accept: "application/json" },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

/**
 * GETs each endpoint's queue OpenAPI document. A cached entry is reused and
 * never refetched; a live fetch is followed by `delayMs` before the next one.
 * A network error, 429 or 5xx is retried twice, then recorded as GONE with
 * its reason; any other status is recorded as served.
 *
 * @param {{
 *   endpointIds: string[],
 *   fetchImpl?: typeof fetch,
 *   cacheDir?: string,
 *   delayMs?: number,
 *   wait?: (ms: number) => Promise<unknown>,
 *   now?: () => string,
 *   onProgress?: (progress: {
 *     index: number,
 *     endpointId: string,
 *     cached: boolean,
 *     status: number | null,
 *   }) => void,
 * }} options
 */
export async function fetchDocuments({
  endpointIds,
  fetchImpl = globalThis.fetch,
  cacheDir,
  delayMs = DEFAULT_DELAY_MS,
  wait = sleep,
  now = () => new Date().toISOString(),
  onProgress = () => {},
}) {
  if (cacheDir) await mkdir(cacheDir, { recursive: true });
  const documents = new Map();
  let fetched = 0;
  let cached = 0;
  for (const [index, endpointId] of endpointIds.entries()) {
    const hit = await readCache(cacheDir, endpointId);
    if (hit) {
      documents.set(endpointId, hit);
      cached += 1;
      onProgress({ index, endpointId, cached: true, status: hit.status });
      continue;
    }
    const url = queueOpenApiUrl(endpointId);
    let entry;
    for (let attempt = 0; ; attempt += 1) {
      if (fetched > 0 || attempt > 0) {
        await wait(attempt > 0 ? RETRY_DELAYS_MS[attempt - 1] : delayMs);
      }
      fetched += attempt === 0 ? 1 : 0;
      try {
        const { status, body } = await fetchOnce(fetchImpl, url);
        entry = { endpointId, url, fetchedAt: now(), status, body };
        if (
          (status === 429 || status >= 500) &&
          attempt < RETRY_DELAYS_MS.length
        ) {
          continue;
        }
      } catch (error) {
        entry = {
          endpointId,
          url,
          fetchedAt: now(),
          status: null,
          body: null,
          error: error instanceof Error ? error.message : String(error),
        };
        if (attempt < RETRY_DELAYS_MS.length) continue;
      }
      break;
    }
    documents.set(endpointId, entry);
    if (
      cacheDir &&
      !entry.error &&
      entry.status !== 429 &&
      entry.status < 500
    ) {
      await writeFile(
        cachePath(cacheDir, endpointId),
        `${JSON.stringify(entry)}\n`
      );
    }
    onProgress({ index, endpointId, cached: false, status: entry.status });
  }
  return { documents, fetched, cached };
}
