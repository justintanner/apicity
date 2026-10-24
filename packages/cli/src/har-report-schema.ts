import { instantiateForIntrospection } from "./discovery.js";
import {
  resolveEndpointFn,
  type EndpointTsvRow,
  type EndpointFn,
} from "./registry.js";
import { zodToJsonSchema, type JsonSchema } from "./schema.js";
import type { EndpointRecord } from "./har-report-types.js";
import {
  isObject,
  atPath,
  pathName,
  placeholder,
} from "./har-report-values.js";

interface SafeSchema {
  safeParse(value: unknown): {
    success: boolean;
    error?: { issues: unknown[] };
  };
}
export interface SchemaInfo {
  status: EndpointRecord["schema"]["status"];
  safe: SafeSchema | null;
  json: JsonSchema | null;
  variantKey: string | null;
}
export function schemaLoader() {
  const providers = new Map<
    string,
    ReturnType<typeof instantiateForIntrospection>
  >();
  const rows = new Map<string, Promise<SchemaInfo>>();
  return (row: EndpointTsvRow): Promise<SchemaInfo> => {
    const key = `${row.provider} ${row.method} ${row.dotPath}`;
    if (!rows.has(key))
      rows.set(
        key,
        (async () => {
          const result: SchemaInfo = {
            status: "unavailable",
            safe: null,
            json: null,
            variantKey: null,
          };
          try {
            if (!providers.has(row.provider))
              providers.set(
                row.provider,
                instantiateForIntrospection(row.provider)
              );
            const fn = resolveEndpointFn(
              await providers.get(row.provider)!,
              row.method,
              row.dotPath
            ) as EndpointFn | null;
            if (!fn) return { ...result, status: "unresolved" };
            const schema = fn.schema;
            if (!isObject(schema) || typeof schema.safeParse !== "function")
              return { ...result, status: "absent" };
            result.safe = schema as unknown as SafeSchema;
            result.status = "no-introspection";
            try {
              result.json = zodToJsonSchema(schema);
              result.status = "ok";
            } catch {
              return result;
            }
            const opts = options(result.json);
            if (opts.length) {
              const first = isObject(opts[0].properties)
                ? opts[0].properties
                : {};
              result.variantKey =
                Object.keys(first)
                  .sort()
                  .find((k) =>
                    opts.every(
                      (o) =>
                        isObject(o.properties) &&
                        isObject(o.properties[k]) &&
                        typeof o.properties[k].const === "string"
                    )
                  ) ?? null;
            }
            return result;
          } catch {
            return result;
          }
        })()
      );
    return rows.get(key)!;
  };
}
export function options(node: JsonSchema | null): JsonSchema[] {
  return Array.isArray(node?.anyOf) ? node.anyOf.filter(isObject) : [];
}
export function selectedSchema(
  info: SchemaInfo,
  variant: EndpointRecord["variant"]
) {
  const index = variant
    ? options(info.json).findIndex(
        (o) =>
          isObject(o.properties) &&
          isObject(o.properties[variant.key]) &&
          (o.properties[variant.key] as Record<string, unknown>).const ===
            variant.value
      )
    : -1;
  return {
    node: variant ? (options(info.json)[index] ?? null) : info.json,
    index,
  };
}
export interface Issue extends Record<string, unknown> {
  code: string;
  path: (string | number)[];
  message: string;
}
/** Zod union child paths are relative to their containing union. */
export function flattenIssues(
  raw: unknown[],
  info: { option: number; optionCount: number; unknownVariant: boolean },
  prefix: (string | number)[] = []
): Issue[] {
  return raw.filter(isObject).flatMap((i) => {
    const path = [
      ...prefix,
      ...(Array.isArray(i.path)
        ? i.path.filter(
            (k): k is string | number =>
              typeof k === "string" || typeof k === "number"
          )
        : []),
    ];
    const branches = Array.isArray(i.errors)
      ? i.errors.filter(Array.isArray)
      : [];
    if (
      i.code === "invalid_union" &&
      branches.length &&
      !(path.length === 0 && info.unknownVariant)
    ) {
      const index =
        path.length === 0 &&
        info.option >= 0 &&
        branches.length === info.optionCount
          ? info.option
          : branches.reduce(
              (best, b, n) => (b.length < branches[best].length ? n : best),
              0
            );
      return flattenIssues(branches[index], info, path);
    }
    return [{ ...i, code: String(i.code), message: String(i.message), path }];
  });
}
export function validate(
  info: SchemaInfo,
  body: Record<string, unknown>,
  variant: EndpointRecord["variant"]
) {
  if (!info.safe) return null;
  try {
    const result = info.safe.safeParse(body);
    const selected = selectedSchema(info, variant);
    const all = result.success
      ? []
      : flattenIssues(result.error?.issues ?? [], {
          option: selected.index,
          optionCount: options(info.json).length,
          unknownVariant: variant !== null && selected.index < 0,
        });
    const issues = all.filter((i) => !placeholder(atPath(body, i.path)));
    return {
      issues,
      placeholders: all.length - issues.length,
      accepted: issues.length === 0,
    };
  } catch {
    return null;
  }
}
export function schemaReason(info: SchemaInfo): string | null {
  return {
    ok: null,
    "no-introspection": null,
    absent: "endpoint has no .schema",
    unresolved: "endpoint function not found in the provider tree",
    unavailable: "provider package could not be loaded",
  }[info.status];
}
function children(nodes: JsonSchema[]): {
  open: boolean;
  keys: Map<string, JsonSchema[]>;
  items: JsonSchema[];
} {
  let open = false;
  const keys = new Map<string, JsonSchema[]>();
  const items: JsonSchema[] = [];
  for (const node of nodes) {
    const members = [
      ...(Array.isArray(node.anyOf) ? node.anyOf.filter(isObject) : []),
      ...(Array.isArray(node.allOf) ? node.allOf.filter(isObject) : []),
    ];
    if (isObject(node.properties))
      for (const [k, v] of Object.entries(node.properties))
        if (isObject(v)) keys.set(k, [...(keys.get(k) ?? []), v]);
    if (isObject(node.items)) items.push(node.items);
    if (
      !node.properties &&
      !node.items &&
      !members.length &&
      (!node.type || node.type === "object")
    )
      open = true;
    const nested = children(members);
    open ||= nested.open;
    for (const [k, v] of nested.keys)
      keys.set(k, [...(keys.get(k) ?? []), ...v]);
    items.push(...nested.items);
  }
  return { open, keys, items };
}
export function unknownKeys(body: unknown, node: JsonSchema): string[] {
  const found = new Set<string>();
  function walk(
    value: unknown,
    nodes: JsonSchema[],
    path: (string | number)[]
  ) {
    const c = children(nodes);
    if (c.open) return;
    if (isObject(value))
      for (const [k, v] of Object.entries(value)) {
        if (!c.keys.has(k)) found.add(pathName([...path, k]));
        else walk(v, c.keys.get(k)!, [...path, k]);
      }
    if (Array.isArray(value))
      value.forEach((v, i) => {
        if (isObject(v)) walk(v, c.items, [...path, i]);
      });
  }
  walk(body, [node], []);
  return [...found].sort();
}
export function defaults(
  node: JsonSchema
): Array<{ path: string; segments: string[]; value: unknown }> {
  const found = new Map<
    string,
    { path: string; segments: string[]; value: unknown }
  >();
  function walk(n: JsonSchema, path: string[]) {
    if (path.length && "default" in n)
      found.set(path.join("."), {
        path: path.join("."),
        segments: path,
        value: n.default,
      });
    if (isObject(n.properties))
      for (const [k, v] of Object.entries(n.properties))
        if (isObject(v)) walk(v, [...path, k]);
    if (Array.isArray(n.allOf))
      for (const v of n.allOf) if (isObject(v)) walk(v, path);
  }
  walk(node, []);
  return [...found.values()].sort((a, b) => (a.path < b.path ? -1 : 1));
}
