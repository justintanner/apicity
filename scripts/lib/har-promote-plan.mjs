// Offline call reconstruction. All provider requests must consume a captured
// exchange through the injected fetch; the global transport is disabled.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  scrubHar,
  pollyEntryId,
  exchangeSucceeded,
  findMatchingRow,
  matchHarEntryStrict,
} from "../../packages/provider/har/src/index.ts";
import {
  CALL_SHAPES,
  callShapeKey,
} from "../../packages/cli/src/call-shapes.ts";
import { PROVIDERS } from "../../packages/cli/src/providers.ts";
import { resolveEndpointFn } from "../../packages/cli/src/registry.ts";
import {
  isPaidEndpoint,
  PAID_ENDPOINTS,
} from "../../packages/provider/cost/src/paid-endpoints.ts";
import { mintOtp } from "../../packages/provider/cost/src/paygate.ts";
import { classifyHosts } from "./fal-credential-hosts.mjs";

export class Refusal extends Error {
  constructor(code, message = code) {
    super(message);
    this.code = code;
  }
}
export function refuse(code, message) {
  throw new Refusal(code, message);
}
export const repo = fileURLToPath(new URL("../../", import.meta.url));
export const plain = (v) =>
  v !== null &&
  typeof v === "object" &&
  Object.getPrototypeOf(v) === Object.prototype;
export const bodyOf = (e) =>
  e.request.postData?.text ? JSON.parse(e.request.postData.text) : undefined;
export const keyOf = (r) => callShapeKey(r.provider, r.method, r.dotPath);

// Deliberately independent of PAID_ENDPOINTS: the parity test detects additions.
export const PAID_OTP_HELPERS = Object.fromEntries(
  [
    ["kie", "mintKieCreateTaskOtp", false, ["api.v1.jobs.createTask"]],
    [
      "kie",
      "mintKieVeoOtp",
      true,
      [
        "api.v1.veo.generate",
        "api.v1.veo.extend",
        "api.v1.veo.get1080pVideo",
        "api.v1.veo.get4kVideo",
      ],
    ],
    ["kie", "mintKieFluxKontextOtp", false, ["api.v1.flux.kontext.generate"]],
    ["kie", "mintKieGpt4oImageOtp", false, ["api.v1.gpt4oImage.generate"]],
    ["kie", "mintKieMjOtp", false, ["api.v1.mj.generate"]],
    [
      "kie",
      "mintKieRunwayOtp",
      true,
      ["api.v1.runway.generate", "api.v1.runway.extend"],
    ],
    [
      "kie",
      "mintKieSunoOtp",
      true,
      [
        "api.v1.generate",
        "api.v1.generate.generatePersona",
        "api.v1.mp4.generate",
        "api.v1.wav.generate",
        "api.v1.vocalRemoval.generate",
        "api.v1.midi.generate",
        "api.v1.voice.generate",
        "api.v1.voice.validate",
        "api.v1.voice.regenerate",
        "api.v1.suno.cover.generate",
      ],
    ],
    [
      "kie",
      "mintKieOmniOtp",
      true,
      ["api.v1.omni.audio.create", "api.v1.omni.character.create"],
    ],
    [
      "xai",
      "mintXaiOtp",
      true,
      [
        "v1.images.generations",
        "v1.images.edits",
        "v1.videos.generations",
        "v1.videos.generations.imageToVideo",
        "v1.videos.edits",
        "v1.videos.extensions",
      ],
    ],
  ].flatMap(([provider, helper, withPath, paths]) =>
    paths.map((dotPath) => [
      callShapeKey(
        provider,
        dotPath === "api.v1.veo.get1080pVideo" ? "GET" : "POST",
        dotPath
      ),
      { helper, withPath },
    ])
  )
);

function contains(v, predicate) {
  return (
    predicate(v) ||
    (v !== null &&
      typeof v === "object" &&
      Object.values(v).some((child) => contains(child, predicate)))
  );
}
export function validateCapture(har) {
  if (!Array.isArray(har?.log?.entries))
    refuse("unreadable", "expected log.entries array");
  const meta = har.log._apicity;
  if (typeof meta?.provider !== "string" || typeof meta?.endpoint !== "string")
    refuse("not-annotated");
  const provider = meta.provider;
  const entries = har.log.entries;
  if (meta.outcome !== "ok") refuse("outcome-not-ok");
  if (!entries.some((e) => !e._apicity?.kind || e._apicity.kind === "http"))
    refuse("no-http-entry");
  if (entries.some((e) => e._apicity?.kind === "local")) refuse("local-entry");
  if (entries.some((e) => !exchangeSucceeded(provider, e)))
    refuse("exchange-failed");
  if (JSON.stringify(scrubHar(structuredClone(har))) !== JSON.stringify(har))
    refuse("needs-scrub");
  const rows = readFileSync(
    new URL("../endpoint-docs.tsv", import.meta.url),
    "utf8"
  )
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const [provider, dotPath, method, fullUrl] = line.split("\t");
      return { provider, dotPath, method, fullUrl };
    })
    .filter((r) => r.provider === provider);
  const candidates = rows.filter((r) => r.dotPath === meta.endpoint);
  if (!candidates.length) refuse("endpoint-not-in-catalog");
  if (
    !Object.hasOwn(PROVIDERS, provider) ||
    [
      "s3",
      "b2",
      "polymarket",
      "telegram",
      "thesportsdb",
      "quo",
      "free-media-upload",
    ].includes(provider)
  )
    refuse("provider-unsupported");
  return {
    provider,
    meta,
    entries,
    rows,
    candidates,
    spec: PROVIDERS[provider],
  };
}
export function validateBodies(context) {
  const { entries, meta, candidates } = context;
  const texts = entries
    .flatMap((e) => [e.request.postData?.text, e.response.content?.text])
    .filter(Boolean);
  const bodies = texts.map((t) => {
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  });
  if (
    entries.some(
      (e) =>
        e._apicity?.streamed ||
        e.response.content?.mimeType?.includes("text/event-stream")
    )
  )
    refuse("streamed");
  if (entries.some((e) => e._apicity?.bodyTruncated)) refuse("truncated");
  if (
    bodies.some((b) =>
      contains(b, (v) => plain(v) && Object.hasOwn(v, "_apicity_placeholder"))
    )
  )
    refuse("binary-body");
  if (
    entries.some((e) => e.request.postData?.mimeType?.includes("multipart/")) ||
    bodies.some((b) => contains(b, (v) => v?._multipart === true))
  )
    refuse("multipart-body");
  if (
    texts.some((t) =>
      /<inline .*data URL — replace with a real URL or upload>|<inline base64 data; \d+ bytes>/.test(
        t
      )
    )
  )
    refuse("media-summary");
  for (const e of entries) {
    if (!e.request.postData?.text) continue;
    if (
      !/(?:application\/json|\+json)(?:;|$)/i.test(
        e.request.postData.mimeType ?? ""
      )
    )
      refuse("non-json-body");
    let b;
    try {
      b = bodyOf(e);
    } catch {
      refuse("non-json-body", "invalid JSON request");
    }
    if (contains(b, (v) => v === "***")) refuse("redacted-body");
    if (contains(b, (v) => plain(v) && Object.hasOwn(v, "__proto__")))
      refuse("unsafe-key");
  }
  if (contains(meta.input, (v) => plain(v) && Object.hasOwn(v, "__proto__")))
    refuse("unsafe-key");
  for (const e of entries) {
    // Validate raw query escapes before URLSearchParams can replace invalid
    // UTF-8. Valid duplicate/valueless keys and fragments match Polly's ID.
    try {
      decodeURIComponent(new URL(e.request.url).search);
    } catch {
      refuse("query-shape");
    }
  }
  if (
    entries.some((e) => decodeURIComponent(e.request.url).includes("***")) ||
    candidates.some((r) => CALL_SHAPES[keyOf(r)]?.injected.length)
  )
    refuse("credential-in-url");
  context.envVar = context.spec.envVar;
  if (context.provider === "fal") {
    const c = classifyHosts([
      ...new Set(entries.map((e) => new URL(e.request.url).hostname)),
    ]);
    if (!c.ok)
      refuse(
        c.reason === "mixed-classes" ? "fal-mixed-hosts" : "fal-unknown-host"
      );
    context.envVar =
      c.credential === "admin" ? "FAL_ADMIN_API_KEY" : "FAL_API_KEY";
  }
  const expanded = [];
  for (const e of entries) {
    const repeat = e._apicity?.pollRepeat ?? 0;
    if (
      !Number.isSafeInteger(repeat) ||
      repeat < 0 ||
      expanded.length + repeat + 1 > 500
    )
      refuse("too-many-exchanges");
    for (let n = 0; n <= repeat; n++) {
      const copy = structuredClone(e);
      if (copy._apicity) delete copy._apicity.pollRepeat;
      expanded.push(copy);
    }
  }
  const seen = new Map();
  for (const e of expanded) {
    e._id = pollyEntryId(e);
    e._order = seen.get(e._id) ?? 0;
    seen.set(e._id, e._order + 1);
  }
  context.expanded = expanded;
}

function urlParams(row, entry, shape) {
  if (!shape?.positional.length && !shape?.fields.length) return {};
  if (!matchHarEntryStrict(entry, row))
    refuse("dry-replay:lenient-placeholders");
  const [base, query] = row.fullUrl.replace(/\{query\}/g, "").split("?");
  const names = [...base.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
  const re = new RegExp(
    "^" +
      base
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\\\{[^}]+\\\}/g, "([^/]+)") +
      "$"
  );
  const u = new URL(entry.request.url);
  const m = (u.origin + u.pathname).match(re);
  const out = Object.fromEntries(
    names.map((n, i) => [n, decodeURIComponent(m[i + 1])])
  );
  for (const pair of (query ?? "").split("&")) {
    const [k, v] = pair.split("=");
    const ph = v?.match(/^\{([^}]+)\}$/);
    if (ph && u.searchParams.has(k)) out[ph[1]] = u.searchParams.get(k);
  }
  return out;
}
function accessorFor(instance, row, fn) {
  const segs = row.dotPath.split(".");
  const m = row.method.toLowerCase();
  const chains = [[segs[0], m, ...segs.slice(1)]];
  for (const chain of [[m, ...segs], [m, "run", ...segs], segs])
    chains.push(chain, [...chain, m]);
  for (const key of Object.keys(instance))
    if (segs.includes(key)) chains.push([key, m, ...segs]);
  // Match the resolver's final fallback for sub-providers whose URL paths
  // do not contain their mount key (for example kie.suno).
  const methods = new Set(["post", "get", "put", "delete", "patch", "head"]);
  for (const key of Object.keys(instance).sort()) {
    if (!methods.has(key)) chains.push([key, m, ...segs]);
  }
  const found = chains.find(
    (chain) => chain.reduce((v, k) => v?.[k], instance) === fn
  );
  if (!fn || !found) refuse("dry-replay:identity", "no callable accessor");
  return found
    .map((s) =>
      /^[A-Za-z_$][\w$]*$/.test(s) ? `.${s}` : `[${JSON.stringify(s)}]`
    )
    .join("");
}
export async function planCalls(context) {
  const { provider, spec, expanded, rows, candidates, meta } = context;
  const consumed = new Set();
  const secret = randomBytes(32).toString("hex");
  let active = true;
  let transportError;
  const fakeRequest = async (input, init = {}) => {
    if (!active) refuse("dry-replay:timeout");
    if (init.body != null && typeof init.body !== "string")
      refuse("dry-replay:identity", "non-string request body");
    const request = {
      method: (init.method ?? "GET").toUpperCase(),
      url: new URL(
        typeof input === "string" || input instanceof URL ? input : input.url
      ).href,
      headers: [...new Headers(init.headers)].map(([name, value]) => ({
        name,
        value,
      })),
      ...(init.body !== undefined ? { postData: { text: init.body } } : {}),
    };
    const id = pollyEntryId({ request });
    const i = expanded.findIndex((e, i) => !consumed.has(i) && e._id === id);
    if (i < 0) {
      const near = expanded.findIndex(
        (e, i) =>
          !consumed.has(i) &&
          e.request.url === request.url &&
          e.request.method === request.method
      );
      refuse(
        "dry-replay:identity",
        near < 0
          ? "request matches no unconsumed exchange"
          : `exchange ${near}: headers or body differ`
      );
    }
    consumed.add(i);
    const r = expanded[i].response;
    return new Response(
      [204, 205, 304].includes(r.status) ? null : r.content.text,
      {
        status: r.status,
        statusText: r.statusText,
        headers: r.headers.map((h) => [h.name, h.value]),
      }
    );
  };
  const fake = async (...args) => {
    try {
      return await fakeRequest(...args);
    } catch (error) {
      transportError = error;
      throw error;
    }
  };
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    transportError = new Refusal("dry-replay:bypassed-fetch");
    throw transportError;
  };
  const plan = [];
  let primaryUsed = false;
  try {
    const factory = (
      await import(`../../packages/provider/${provider}/src/index.ts`)
    )[spec.factoryName];
    const instance = factory({
      ...(spec.envVar ? { [spec.optionKey]: "test-key" } : {}),
      fetch: fake,
      ...(PAID_ENDPOINTS.some((e) => e.key.provider === provider)
        ? { paygate: { secret } }
        : {}),
    });
    for (let i = 0; i < expanded.length; i++) {
      if (consumed.has(i)) continue;
      const e = expanded[i];
      const primaryRow =
        !primaryUsed &&
        (findMatchingRow(e, candidates, { provider }) ??
          (context.entries.length === 1 &&
          candidates.length === 1 &&
          candidates[0].method === e.request.method
            ? candidates[0]
            : null));
      const row = primaryRow || findMatchingRow(e, rows, { provider });
      if (!row) refuse("dry-replay:unmatched-exchange", `exchange ${i}`);
      const paid = isPaidEndpoint(provider, row.method, row.dotPath);
      if (paid && !PAID_OTP_HELPERS[keyOf(row)]) refuse("no-otp-helper");
      const shape = CALL_SHAPES[keyOf(row)];
      if (shape?.injected.length) refuse("credential-in-url");
      const params = urlParams(row, e, shape);
      const positional = [];
      for (const p of shape?.positional ?? []) {
        if (params[p.placeholder] === undefined) {
          if (!p.optional) refuse("dry-replay:lenient-placeholders");
        } else positional.push(params[p.placeholder]);
      }
      if (paid && positional.length) refuse("dry-replay:paid-positional");
      const wire = bodyOf(e);
      const hasInput =
        primaryRow && (plain(meta.input) || Array.isArray(meta.input));
      let request = hasInput ? structuredClone(meta.input) : wire;
      if (
        !primaryRow &&
        !request &&
        /^(GET|DELETE|HEAD)$/.test(row.method) &&
        row.fullUrl.includes("{query}")
      ) {
        const query = new URL(e.request.url).searchParams;
        request = Object.fromEntries(
          [...query].filter(([k]) => !Object.hasOwn(params, k))
        );
      }
      const fields = (value) => {
        if (shape?.fields.length) value = { ...(value ?? {}) };
        for (const f of shape?.fields ?? []) {
          if (params[f.placeholder] === undefined)
            refuse("dry-replay:lenient-placeholders");
          if (
            Object.hasOwn(value, f.property) &&
            String(value[f.property]) !== params[f.placeholder]
          )
            refuse("dry-replay:field-mismatch");
          value[f.property] = params[f.placeholder];
        }
        return paid ? (value ?? {}) : value;
      };
      request = fields(request);
      const fn = resolveEndpointFn(instance, row.method, row.dotPath);
      const accessor = accessorFor(instance, row, fn);
      const before = new Set(consumed);
      const run = async (req) => {
        transportError = undefined;
        const args = paid
          ? [
              req,
              {
                otp: mintOtp(secret, {
                  provider,
                  method: row.method,
                  dotPath: row.dotPath,
                  request: req,
                }),
              },
            ]
          : [
              ...positional,
              ...(req !== undefined && (!plain(req) || Object.keys(req).length)
                ? [req]
                : []),
            ];
        let timer;
        try {
          const result = await Promise.race([
            fn(...args),
            new Promise((_, reject) => {
              timer = setTimeout(() => {
                active = false;
                reject(new Refusal("dry-replay:timeout"));
              }, 20000);
            }),
          ]);
          if (transportError) throw transportError;
          if (!consumed.has(i)) refuse("dry-replay:not-issued");
          if (
            result !== undefined &&
            result !== null &&
            !["string", "number", "boolean"].includes(typeof result) &&
            !Array.isArray(result) &&
            !plain(result)
          )
            refuse("dry-replay:result-type");
          return result;
        } catch (error) {
          if (transportError) throw transportError;
          if (error instanceof Refusal) throw error;
          refuse("dry-replay:threw", `${error.name}: ${error.message}`);
        } finally {
          clearTimeout(timer);
        }
      };
      let result;
      let source = hasInput ? "input" : "wire body";
      try {
        result = await run(request);
      } catch (first) {
        if (!hasInput || wire === undefined || !active) throw first;
        consumed.clear();
        for (const index of before) consumed.add(index);
        request = fields(wire);
        source = "wire body";
        try {
          result = await run(request);
        } catch {
          throw first;
        }
      }
      plan.push({
        row,
        accessor,
        positional,
        request,
        source,
        paid,
        entries: [...consumed].filter((n) => !before.has(n)),
        result,
      });
      primaryUsed ||= !!primaryRow;
    }
    if (!primaryUsed) refuse("dry-replay:no-primary");
    return plan;
  } finally {
    active = false;
    globalThis.fetch = oldFetch;
  }
}
