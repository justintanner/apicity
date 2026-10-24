import { responseObject, exchangeSucceeded, type HarEntry } from "@apicity/har";
import type { Call, Entry } from "./har-report-load.js";
import { requestBody } from "./har-report-load.js";
import type { ErrorGroup } from "./har-report-types.js";
import {
  isObject,
  normalizeMessage,
  timestamp,
  compare,
  sanitize,
  canonical,
} from "./har-report-values.js";

export interface Failure {
  group: ErrorGroup;
  call: Call;
  exchange: Entry | null;
}
const stringCode = (v: unknown): string | null =>
  typeof v === "string" || typeof v === "number" ? String(v) : null;
function errorBody(entry: HarEntry) {
  const body = responseObject(entry) ?? {};
  const err = isObject(body.error) ? body.error : {};
  const detail = isObject(body.detail) ? body.detail : {};
  const items = Array.isArray(body.detail) ? body.detail.filter(isObject) : [];
  const errors = Array.isArray(body.errors) ? body.errors.filter(isObject) : [];
  const messages = [
    err.message,
    typeof body.error === "string" ? body.error : null,
    typeof body.detail === "string" ? body.detail : null,
    detail.message,
    items
      .map((i) => i.msg)
      .filter((v) => typeof v === "string")
      .join("; ") || null,
    body.message,
    body.msg,
    errors[0]?.message,
    body.title,
  ];
  let raw = messages.find((v): v is string => typeof v === "string");
  const content = entry.response.content;
  const text =
    content?.encoding === "base64"
      ? Buffer.from(content.text ?? "", "base64").toString("utf8")
      : (content?.text ?? "");
  if (raw === undefined) {
    const message = text.match(/<Message>([\s\S]*?)<\/Message>/)?.[1];
    const code = text.match(/<Code>([\s\S]*?)<\/Code>/)?.[1];
    if (message) raw = (code ? `${code}: ` : "") + message;
  }
  const status = entry.response.status;
  return {
    raw:
      raw ??
      `HTTP ${status}${entry.response.statusText ? ` ${entry.response.statusText}` : ""}`,
    source:
      raw === undefined ? ("http-status" as const) : ("response-body" as const),
    code:
      stringCode(body.code) ??
      stringCode(err.code) ??
      stringCode(err.type) ??
      stringCode(detail.status) ??
      stringCode(detail.code),
    effective:
      typeof body.code === "number" &&
      Number.isInteger(body.code) &&
      body.code >= 100 &&
      body.code <= 599
        ? body.code
        : status,
    locs: items.flatMap((i) =>
      Array.isArray(i.loc)
        ? [
            i.loc
              .filter(
                (v, n) =>
                  n !== 0 || !["body", "query", "path"].includes(String(v))
              )
              .join("."),
          ]
        : []
    ),
  };
}
function fields(body: unknown, raw: string, locs: string[]): string[] {
  const found = new Set(locs);
  const tokens = new Set(raw.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? []);
  function walk(v: unknown, p: string) {
    if (isObject(v))
      for (const [k, child] of Object.entries(v)) {
        const path = p ? `${p}.${k}` : k;
        if (tokens.has(k) || (raw.includes(path) && path.includes(".")))
          found.add(path);
        walk(child, path);
      }
  }
  walk(body, "");
  return [...found].sort().slice(0, 20);
}
export function failures(calls: Call[]): Failure[] {
  const result: Failure[] = [];
  for (const call of calls) {
    const failed = call.primary.filter(
      (e) => !exchangeSucceeded(call.row.provider, e.entry)
    );
    const make = (exchange: Entry | null) => {
      const entry = exchange?.entry;
      const extracted = entry ? errorBody(entry) : null;
      const raw =
        extracted?.raw ?? call.meta?.error?.message ?? "Provider error";
      const status =
        entry?.response.status ??
        call.meta?.error?.status ??
        call.meta?.status ??
        0;
      const effective = extracted?.effective ?? status;
      const body = entry ? requestBody(entry) : null;
      const time = entry ? timestamp(entry.startedDateTime) : call.time;
      result.push({
        call,
        exchange,
        group: {
          status,
          code: extracted ? extracted.code : stringCode(call.meta?.error?.code),
          message: normalizeMessage(raw),
          source: extracted?.source ?? "call-error",
          payloadRelevant:
            effective >= 400 &&
            effective < 500 &&
            ![401, 402, 403, 407, 408, 429].includes(effective),
          count: 1,
          firstSeen: time,
          lastSeen: time,
          fields: fields(body, raw, extracted?.locs ?? []),
          files: [call.file],
          sample: {
            file: call.file,
            entry: exchange?.index ?? null,
            method: entry?.request.method ?? null,
            url: entry?.request.url ?? null,
            body: body
              ? {
                  source: "request",
                  mimeType: entry?.request.postData?.mimeType ?? null,
                  value: sanitize(body),
                }
              : call.meta?.input !== undefined
                ? {
                    source: "input",
                    mimeType: null,
                    value: sanitize(call.meta.input),
                  }
                : null,
          },
        },
      });
    };
    for (const e of failed) if (e.entry.response.status !== 0) make(e);
    if (call.meta && call.outcome === "provider_error" && !failed.length)
      make(null);
  }
  return result.sort(
    (a, b) =>
      compare(a.group.firstSeen, b.group.firstSeen) ||
      compare(a.call.file, b.call.file) ||
      compare(a.exchange?.index ?? null, b.exchange?.index ?? null)
  );
}
export const errorKey = (g: Pick<ErrorGroup, "status" | "code" | "message">) =>
  canonical([g.status, g.code, g.message]);
export const errorOrder = (
  a: Pick<ErrorGroup, "count" | "status" | "code" | "message">,
  b: Pick<ErrorGroup, "count" | "status" | "code" | "message">
) =>
  b.count - a.count ||
  compare(a.status, b.status) ||
  compare(a.code, b.code) ||
  compare(a.message, b.message);
export function groupErrors(items: Failure[]): ErrorGroup[] {
  const groups = new Map<string, ErrorGroup>();
  for (const { group: g } of items) {
    const key = errorKey(g);
    const prev = groups.get(key);
    if (!prev) groups.set(key, structuredClone(g));
    else {
      prev.count++;
      prev.files = [...new Set([...prev.files, ...g.files])].sort();
      prev.fields = [...new Set([...prev.fields, ...g.fields])]
        .sort()
        .slice(0, 20);
      prev.payloadRelevant ||= g.payloadRelevant;
      prev.firstSeen =
        [prev.firstSeen, g.firstSeen]
          .filter((s): s is string => s !== null)
          .sort()[0] ?? null;
      prev.lastSeen =
        [prev.lastSeen, g.lastSeen]
          .filter((s): s is string => s !== null)
          .sort()
          .at(-1) ?? null;
    }
  }
  return [...groups.values()].sort(errorOrder);
}
