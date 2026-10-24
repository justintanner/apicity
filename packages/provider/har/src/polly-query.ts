// Polly's query identity without its dependencies. @pollyjs/utils URL keeps a
// request's query as qs 6.16 parses it (strictNullHandling, plainObjects,
// ignoreQueryPrefix) and writes it back with the array format it detected;
// @pollyjs/core normalize-request url() parses that again, sorts it through
// fast-json-stable-stringify and writes it once more. Only the qs code paths
// those options reach are ported.
import { stableStringify } from "./persist.js";

type QueryValue = string | null | QueryValue[] | QueryObject;
interface QueryObject {
  [key: string]: QueryValue;
}
type ArrayFormat = "indices" | "brackets" | "repeat";

// qs parse defaults Polly keeps.
const ARRAY_LIMIT = 20;
const DEPTH = 5;
const PARAMETER_LIMIT = 1000;
// qs turns an array that outgrows ARRAY_LIMIT into an object and tracks its
// highest index.
const overflow = new WeakMap<object, number>();

/** Polly's normalized query for a URL search string: "" or "?...". */
export function pollyQuery(search: string): string {
  // PollyRequest.url, which is also the url Polly writes to the HAR.
  const query = stringifyQuery(parseQuery(search), arrayFormat(search));
  // normalize-request url().
  const sorted = JSON.parse(stableStringify(parseQuery(query))!) as QueryObject;
  return stringifyQuery(sorted, arrayFormat(query));
}

// @pollyjs/utils arrayFormat(). Its decodeURIComponent throws on a malformed
// key escape, so Polly records no such request; the raw key is kept here.
function arrayFormat(query: string): ArrayFormat | undefined {
  const keys = query
    .replace("?", "")
    .split("&")
    .map((part) => decodeComponent(part.split("=")[0]));
  for (const key of keys) {
    if (/\[\d+\]$/.test(key)) return "indices";
    if (/\[\]$/.test(key)) return "brackets";
  }
  if (keys.some((key, index) => keys.indexOf(key) !== index)) return "repeat";
  return undefined;
}

function decodeComponent(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

// qs utils.decode (utf-8).
function decode(text: string): string {
  return decodeComponent(text.replace(/\+/g, " "));
}

// qs utils.encode (utf-8, RFC 3986). The text is always well-formed UTF-16:
// it comes from a WHATWG URL's ASCII search or from decodeURIComponent.
function encode(text: string): string {
  return encodeURIComponent(text).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

// qs parse(): parseValues, then parseKeys and merge for each key, then compact.
function parseQuery(query: string): QueryObject {
  const values: QueryObject = Object.create(null);
  const parts = query
    .replace(/^\?/, "")
    .replace(/%5B/gi, "[")
    .replace(/%5D/gi, "]")
    .split("&", PARAMETER_LIMIT);
  for (const part of parts) {
    const bracketEquals = part.indexOf("]=");
    const pos = bracketEquals === -1 ? part.indexOf("=") : bracketEquals + 1;
    const key = decode(pos === -1 ? part : part.slice(0, pos));
    const value = pos === -1 ? null : decode(part.slice(pos + 1));
    values[key] = Object.hasOwn(values, key)
      ? combine(values[key], value)
      : value;
  }
  let result: QueryValue = Object.create(null);
  for (const key of Object.keys(values))
    if (key) result = merge(result, parseObject(keySegments(key), values[key]));
  return compact(result) as QueryObject;
}

// qs splitKeyIntoSegments(): "a[b][c]" -> ["a", "[b]", "[c]"], at most DEPTH
// bracket groups, the rest kept as one segment.
function keySegments(key: string): string[] {
  const first = key.indexOf("[");
  const segments = first === 0 ? [] : [first < 0 ? key : key.slice(0, first)];
  let open = first;
  for (let groups = 0; open >= 0 && groups < DEPTH; groups++) {
    let level = 1;
    let close = -1;
    for (let i = open + 1; i < key.length && close < 0; i++) {
      if (key[i] === "[") level++;
      else if (key[i] === "]" && --level === 0) close = i;
    }
    if (close < 0) return [...segments, `[${key.slice(open)}]`];
    segments.push(key.slice(open, close + 1));
    open = key.indexOf("[", close + 1);
  }
  if (open >= 0) segments.push(`[${key.slice(open)}]`);
  return segments;
}

// qs parseObject(): builds the nested value for one key's segments.
function parseObject(segments: string[], value: QueryValue): QueryValue {
  let leaf = value;
  for (let i = segments.length - 1; i >= 0; i--) {
    const root = segments[i];
    if (root === "[]") {
      leaf = isOverflow(leaf) ? leaf : combine([], leaf);
      continue;
    }
    const name =
      root.startsWith("[") && root.endsWith("]") ? root.slice(1, -1) : root;
    const index = parseInt(name, 10);
    const arrayIndex =
      !isNaN(index) && root !== name && String(index) === name && index >= 0;
    if (arrayIndex && index < ARRAY_LIMIT) {
      const array: QueryValue[] = [];
      array[index] = leaf;
      leaf = array;
      continue;
    }
    const object: QueryObject = Object.create(null);
    if (arrayIndex) markOverflow(object, index);
    if (arrayIndex || name !== "__proto__") object[name] = leaf;
    leaf = object;
  }
  return leaf;
}

// qs utils.combine().
function combine(a: QueryValue, b: QueryValue): QueryValue {
  if (isOverflow(a)) {
    let index = overflow.get(a)!;
    for (const item of Array.isArray(b) ? b : [b]) a[++index] = item;
    overflow.set(a, index);
    return a;
  }
  const result = ([] as QueryValue[]).concat(a, b);
  return result.length > ARRAY_LIMIT
    ? markOverflow(arrayToObject(result), result.length - 1)
    : result;
}

// qs utils.merge() with strictMerge, which qs 6.16 enables by default.
function merge(target: QueryValue, source: QueryValue): QueryValue {
  if (!source) return target;
  if (typeof source !== "object") {
    if (Array.isArray(target)) {
      if (target.length >= ARRAY_LIMIT)
        return markOverflow(
          arrayToObject(target.concat(source)),
          target.length
        );
      target[target.length] = source;
      return target;
    }
    if (!target || typeof target !== "object" || !isOverflow(target))
      return [target, source];
    const index = overflow.get(target)! + 1;
    target[index] = source;
    overflow.set(target, index);
    return target;
  }
  if (!target || typeof target !== "object") {
    if (isOverflow(source)) {
      const shifted: QueryObject = Object.create(null);
      shifted[0] = target;
      for (const key of Object.keys(source))
        shifted[parseInt(key, 10) + 1] = source[key];
      return markOverflow(shifted, overflow.get(source)! + 1);
    }
    const combined = ([target] as QueryValue[]).concat(source);
    return combined.length > ARRAY_LIMIT
      ? markOverflow(arrayToObject(combined), combined.length - 1)
      : combined;
  }
  if (Array.isArray(target) && Array.isArray(source)) {
    source.forEach((item, i) => {
      const current = target[i];
      if (!Object.hasOwn(target, i)) target[i] = item;
      else if (
        current &&
        typeof current === "object" &&
        item &&
        typeof item === "object"
      )
        target[i] = merge(current, item);
      else target[target.length] = item;
    });
    return target.length > ARRAY_LIMIT
      ? markOverflow(arrayToObject(target), target.length - 1)
      : target;
  }
  const result = Array.isArray(target) ? arrayToObject(target) : target;
  const entries = source as QueryObject;
  for (const key of Object.keys(entries)) {
    result[key] = Object.hasOwn(result, key)
      ? merge(result[key], entries[key])
      : entries[key];
    if (isOverflow(entries) && !isOverflow(result))
      markOverflow(result, overflow.get(entries)!);
    const index = parseInt(key, 10);
    if (
      isOverflow(result) &&
      String(index) === key &&
      index >= 0 &&
      index > overflow.get(result)!
    )
      overflow.set(result, index);
  }
  return result;
}

function arrayToObject(source: QueryValue[]): QueryObject {
  const result: QueryObject = Object.create(null);
  source.forEach((item, i) => {
    if (item !== undefined) result[i] = item;
  });
  return result;
}

function markOverflow(value: QueryObject, index: number): QueryObject {
  overflow.set(value, index);
  return value;
}

function isOverflow(value: QueryValue): value is QueryObject {
  return typeof value === "object" && value !== null && overflow.has(value);
}

// qs utils.compact(): drops array holes at every depth.
function compact(value: QueryValue): QueryValue {
  if (Array.isArray(value))
    return value.filter((item) => item !== undefined).map(compact);
  if (value && typeof value === "object")
    for (const key of Object.keys(value)) value[key] = compact(value[key]);
  return value;
}

// qs stringify() with addQueryPrefix and strictNullHandling; qs falls back to
// indices when Polly detected no array format.
function stringifyQuery(
  query: QueryObject,
  format: ArrayFormat = "indices"
): string {
  const parts: string[] = [];
  const write = (value: QueryValue, prefix: string): void => {
    if (value === null) parts.push(encode(prefix));
    else if (typeof value === "string")
      parts.push(`${encode(prefix)}=${encode(value)}`);
    else
      for (const key of Object.keys(value))
        write(
          (value as QueryObject)[key],
          !Array.isArray(value) || format === "indices"
            ? `${prefix}[${key}]`
            : format === "brackets"
              ? `${prefix}[]`
              : prefix
        );
  };
  for (const key of Object.keys(query)) write(query[key], key);
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}
