/**
 * Regression guard for the endpoint labels `scripts/doc-gen.mjs` renders into
 * each provider README's `## API Reference`.
 *
 * The walker's `ep.dotPath` drops every HTTP-verb and `stream`/`ws`/`run`
 * segment, so `post.coding.v1.messages` and `post.stream.coding.v1.messages`
 * used to land on one label and render two identical blocks.
 * `resolveEndpointLabels` (`scripts/lib/endpoint-labels.mjs`) now collapses
 * verb aliases of one path to a single block and gives genuinely distinct
 * siblings distinct labels; this file pins both halves of that.
 *
 * `scripts/doc-gen.mjs` is safe to import because its CLI `main()` is guarded
 * to run only on direct entry. The label layer still lives in its own module,
 * and the three doc-gen-private helpers this file needs (`cleanTsvValue`, the
 * TSV index, and the docs-row lookup) are mirrored below rather than imported.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { createAlibaba } from "@apicity/alibaba";
import { createAnthropic } from "@apicity/anthropic";
import { createB2 } from "@apicity/b2";
import { createBinance } from "@apicity/binance";
import { createDoltHub } from "@apicity/dolthub";
import { createDropbox } from "@apicity/dropbox";
import { createElevenLabs } from "@apicity/elevenlabs";
import { createFal } from "@apicity/fal";
import { createFireworks } from "@apicity/fireworks";
import { createFreeMediaUpload } from "@apicity/free-media-upload";
import { createGoogle } from "@apicity/google";
import { createGoogleFlow } from "@apicity/googleflow";
import { createKie } from "@apicity/kie";
import { createKimiCoding } from "@apicity/kimicoding";
import { createMeta } from "@apicity/meta";
import { createOpenAi } from "@apicity/openai";
import { createOpenF1 } from "@apicity/openf1";
import { createOpenLigaDB } from "@apicity/openligadb";
import { createPolymarket } from "@apicity/polymarket";
import { createQuo } from "@apicity/quo";
import { createS3 } from "@apicity/s3";
import { createSimpleFunctions } from "@apicity/simplefunctions";
import { createTelegram } from "@apicity/telegram";
import { createTheSportsDB } from "@apicity/thesportsdb";
import { createX } from "@apicity/x";
import { createXai } from "@apicity/xai";
import { createYouTube } from "@apicity/youtube";
import { createZaiCoding } from "@apicity/zaicoding";
import {
  displayDotPath,
  resolveEndpointLabels,
} from "../../scripts/lib/endpoint-labels.mjs";
import {
  loadProject,
  walkAllEndpoints,
} from "../../scripts/lib/endpoint-walk.mjs";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";
import { renderApiReference } from "../../scripts/doc-gen.mjs";

interface WalkedEndpoint {
  provider: string;
  file: string;
  dotPath: string;
  fullDotPath: string;
  method: string | null;
  fullUrl: string | null;
}

interface DocsRow {
  provider: string;
  dotPath: string;
  method: string;
  fullUrl: string;
  docsUrl: string;
}

interface DocsIndex {
  byKey: Map<string, DocsRow>;
  byDotPath: Map<string, DocsRow[]>;
}

interface RenderedBlock {
  endpoint: WalkedEndpoint;
  label: string;
  /** `ep.method` after `renderApiReference` enriches it from the TSV. */
  method: string;
}

const DOCS_TSV = path.join(repoRoot, "scripts", "endpoint-docs.tsv");

/** Mirrors `cleanTsvValue` in `scripts/doc-gen.mjs`. */
function cleanTsvValue(value: string | undefined): string | null {
  return value && value !== "?" ? value : null;
}

function loadDocsRows(): DocsRow[] {
  return readFileSync(DOCS_TSV, "utf8")
    .split("\n")
    .filter(Boolean)
    .slice(1)
    .map((line) => {
      const [provider, dotPath, method, fullUrl, docsUrl] = line.split("\t");
      return {
        provider: provider ?? "",
        dotPath: dotPath ?? "",
        method: method ?? "",
        fullUrl: fullUrl ?? "",
        docsUrl: docsUrl ?? "",
      };
    });
}

/** Mirrors `loadDocsTsv` in `scripts/doc-gen.mjs`. */
function buildDocsIndex(rows: DocsRow[]): DocsIndex {
  const byKey = new Map<string, DocsRow>();
  const byDotPath = new Map<string, DocsRow[]>();
  for (const row of rows) {
    byKey.set(`${row.provider}\t${row.dotPath}\t${row.method}`, row);
    const key = `${row.provider}\t${row.dotPath}`;
    const list = byDotPath.get(key) ?? [];
    list.push(row);
    byDotPath.set(key, list);
  }
  return { byKey, byDotPath };
}

/**
 * Mirrors `resolveEndpointDocRow` in `scripts/doc-gen.mjs`, including its
 * candidate order: the rendered `label` is tried first, so a row naming the
 * label wins, and `displayDotPath` is the fallback that keeps a relabelled
 * stream block on its canonical sibling's row while no such row exists.
 */
function resolveDocRow(
  docs: DocsIndex,
  provider: string,
  ep: WalkedEndpoint,
  label: string
): DocsRow | null {
  const dotPaths = [
    ...new Set(
      [label, displayDotPath(provider, ep), ep.dotPath].filter(Boolean)
    ),
  ];
  const method = ep.method ?? "?";
  for (const dotPath of dotPaths) {
    const row = docs.byKey.get(`${ep.provider}\t${dotPath}\t${method}`);
    if (row) return row;
  }
  for (const dotPath of dotPaths) {
    const rows = docs.byDotPath.get(`${ep.provider}\t${dotPath}`) ?? [];
    const concrete = rows.filter(
      (row) => cleanTsvValue(row.method) || cleanTsvValue(row.fullUrl)
    );
    if (concrete.length === 1) return concrete[0];
  }
  return null;
}

/**
 * The method actually printed for a block. `resolveEndpointLabels` groups on
 * the raw `ep.method`, but `renderApiReference` fills a missing one in from the
 * TSV *afterwards* — so uniqueness has to be asserted on the enriched pair, not
 * on the resolver's own grouping key.
 */
function enrichedMethod(
  docs: DocsIndex,
  provider: string,
  ep: WalkedEndpoint,
  label: string
): string {
  if (ep.method) return ep.method;
  const row = resolveDocRow(docs, provider, ep, label);
  return (row && cleanTsvValue(row.method)) ?? "";
}

/** The blocks a provider README renders today, in render order. */
function renderedBlocks(
  docs: DocsIndex,
  provider: string,
  endpoints: WalkedEndpoint[]
): RenderedBlock[] {
  const { labels, rendered } = resolveEndpointLabels(provider, endpoints);
  return (rendered as WalkedEndpoint[]).map((ep) => {
    // One binding for both, mirroring `renderApiReference`: the lookup key and
    // the rendered heading cannot drift apart.
    const label = labels.get(ep);
    return {
      endpoint: ep,
      label,
      method: enrichedMethod(docs, provider, ep, label),
    };
  });
}

/**
 * The blocks a provider README rendered *before* the fix: one per walked site,
 * labelled unconditionally by `displayDotPath`. Only used as the baseline the
 * TSV-coverage guard compares against.
 *
 * Passing `displayDotPath` as the label is deliberate: this helper models the
 * pre-`ff186aa4` rendering, so it must stay on the old lookup key.
 */
function unresolvedBlocks(
  docs: DocsIndex,
  provider: string,
  endpoints: WalkedEndpoint[]
): RenderedBlock[] {
  return endpoints.map((ep) => {
    const label = displayDotPath(provider, ep);
    return {
      endpoint: ep,
      label,
      method: enrichedMethod(docs, provider, ep, label),
    };
  });
}

function coverageKey(provider: string, block: RenderedBlock): string {
  return `${provider}\t${block.label}\t${block.method}`;
}

function rowCoverageKey(row: DocsRow): string {
  return `${row.provider}\t${row.dotPath}\t${cleanTsvValue(row.method) ?? ""}`;
}

/** A resolved row reduced to the identity the README output depends on. */
function rowIdentity(row: DocsRow | null): string {
  return row ? `${row.provider} ${row.dotPath} ${row.method}` : "(no row)";
}

function describeCollisions(
  provider: string,
  blocks: RenderedBlock[]
): string[] {
  const seen = new Map<string, RenderedBlock>();
  const collisions: string[] = [];
  for (const block of blocks) {
    const key = `${block.label}\t${block.method}`;
    const first = seen.get(key);
    if (!first) {
      seen.set(key, block);
      continue;
    }
    collisions.push(
      `${provider}: label "${block.label}" (${block.method || "no method"}) ` +
        `rendered twice — ${first.endpoint.fullDotPath} and ` +
        `${block.endpoint.fullDotPath}`
    );
  }
  return collisions;
}

describe("doc-gen API reference", () => {
  it("renders the exact fallback and zero count for no endpoints", () => {
    expect(renderApiReference("empty-provider", [])).toEqual({
      text: "## API Reference\n\n_No endpoints discovered for this provider yet._\n",
      renderedCount: 0,
    });
  });
});

let endpointsByProvider: Map<string, WalkedEndpoint[]>;
let docsRows: DocsRow[];
let docs: DocsIndex;

describe("doc-gen endpoint labels", () => {
  beforeAll(async () => {
    // ~7s for ~1,570 sites across every provider; pure filesystem + ts-morph,
    // no Polly, no network, no credentials.
    endpointsByProvider = new Map();
    const project = loadProject();
    for await (const ep of walkAllEndpoints(project)) {
      const endpoint = ep as WalkedEndpoint;
      const list = endpointsByProvider.get(endpoint.provider) ?? [];
      list.push(endpoint);
      endpointsByProvider.set(endpoint.provider, list);
    }
    docsRows = loadDocsRows();
    docs = buildDocsIndex(docsRows);
  }, 120_000);

  it("renders each (label, method) pair at most once per provider", () => {
    const collisions: string[] = [];
    for (const [provider, endpoints] of endpointsByProvider) {
      collisions.push(
        ...describeCollisions(
          provider,
          renderedBlocks(docs, provider, endpoints)
        )
      );
    }

    expect(collisions).toEqual([]);
  });

  // Fence, not a regression guard. `before` and `after` are both computed from
  // live code, so reverting `resolveEndpointLabels` to identity makes the two
  // sets equal and this passes vacuously. Its job is to catch a *future*
  // over-aggressive collapse rule, which would shrink `after` only. The guard
  // on the original bug is the "renders each (label, method) pair at most once
  // per provider" case above.
  it("keeps a block for every endpoint-docs.tsv row that had one", () => {
    const before = new Set<string>();
    const after = new Set<string>();
    for (const [provider, endpoints] of endpointsByProvider) {
      for (const block of unresolvedBlocks(docs, provider, endpoints)) {
        before.add(coverageKey(provider, block));
      }
      for (const block of renderedBlocks(docs, provider, endpoints)) {
        after.add(coverageKey(provider, block));
      }
    }

    // Per row, not per count: `fal` legitimately renders 63 blocks against 64
    // TSV rows once its verb aliases collapse, so a `blocks >= rows` proxy
    // would either fail here or hide a genuinely dropped row elsewhere.
    const lost = docsRows
      .filter((row) => before.has(rowCoverageKey(row)))
      .filter((row) => !after.has(rowCoverageKey(row)))
      .map((row) => `${row.provider} ${row.dotPath} ${row.method}`);

    expect(lost).toEqual([]);
  });

  it("labels the kimicoding streaming variant apart from its sibling", () => {
    const site = {
      provider: "kimicoding",
      file: "packages/provider/kimicoding/src/kimicoding.ts",
      dotPath: "coding.v1.messages",
      method: "POST",
      fullUrl: "https://api.kimi.com/coding/v1/messages",
    };
    const direct: WalkedEndpoint = {
      ...site,
      fullDotPath: "post.coding.v1.messages",
    };
    const streaming: WalkedEndpoint = {
      ...site,
      fullDotPath: "post.stream.coding.v1.messages",
    };

    const { labels, rendered } = resolveEndpointLabels("kimicoding", [
      direct,
      streaming,
    ]);

    // Two different callables (`KimiCoding["post"]["stream"]` is real public
    // API), so both render — and neither may fall back to the shared
    // `displayDotPath` value they both carry. The relabelled sibling keeps its
    // leading verb: the README prints the label as a call, so it has to
    // resolve, and `kimicoding.stream.coding.v1.messages` does not exist.
    expect(rendered).toEqual([direct, streaming]);
    expect(labels.get(direct)).toBe("coding.v1.messages");
    expect(labels.get(streaming)).toBe("post.stream.coding.v1.messages");
  });

  it("prefers an exact endpoint-docs.tsv row for the rendered label", () => {
    // Scope caveat: this sweeps every *walked* provider, while production
    // `collectEndpointsByProvider` also injects `TSV_ONLY_PROVIDERS = ["b2"]`
    // from TSV rows. Harmless — those blocks are synthesised with
    // `fullDotPath === dotPath`, so their label always equals `displayDotPath`
    // and no resolution can move.
    const differences: string[] = [];
    for (const [provider, endpoints] of endpointsByProvider) {
      const { labels, rendered } = resolveEndpointLabels(provider, endpoints);
      for (const ep of rendered as WalkedEndpoint[]) {
        const fallback = displayDotPath(provider, ep);
        const label = labels.get(ep) ?? fallback;
        const before = resolveDocRow(docs, provider, ep, fallback);
        const after = resolveDocRow(docs, provider, ep, label);
        if (rowIdentity(before) !== rowIdentity(after)) {
          differences.push(
            `${provider} ${ep.fullDotPath}: ` +
              `${rowIdentity(before)} -> ${rowIdentity(after)}`
          );
        }
      }
    }

    // Exact equality, not a count: a future relabelling that collides with an
    // unrelated row fails here and names the block that moved.
    expect(differences).toEqual([
      "elevenlabs v1.textToSpeech.stream.withTimestamps: " +
        "elevenlabs v1.textToSpeech.withTimestamps POST -> " +
        "elevenlabs v1.textToSpeech.stream.withTimestamps POST",
    ]);
  });

  it("links the elevenlabs streaming block to the streaming docs page", () => {
    const endpoints = endpointsByProvider.get("elevenlabs") ?? [];
    const block = renderedBlocks(docs, "elevenlabs", endpoints).find(
      (candidate) => candidate.label === "v1.textToSpeech.stream.withTimestamps"
    );
    if (!block) {
      throw new Error(
        "no elevenlabs block rendered under " +
          "v1.textToSpeech.stream.withTimestamps"
      );
    }

    const row = resolveDocRow(docs, "elevenlabs", block.endpoint, block.label);

    expect(row?.dotPath).toBe("v1.textToSpeech.stream.withTimestamps");
    expect(row?.docsUrl).toBe(
      "https://elevenlabs.io/docs/api-reference/text-to-speech/stream-with-timestamps"
    );
  });
});

describe("usage snippets name a callable path", () => {
  let falReadme: string;

  beforeAll(async () => {
    const project = loadProject(["fal"]);
    const endpoints: WalkedEndpoint[] = [];
    for await (const ep of walkAllEndpoints(project)) {
      endpoints.push(ep as WalkedEndpoint);
    }
    falReadme = renderApiReference("fal", endpoints).text;
  }, 120_000);

  const renderFalApiReference = (): string => falReadme;

  // The rendered snippet is copy-pasteable source. `ep.dotPath` is the display
  // label, which drops `run`/`stream`/`ws` segments, so every fal endpoint under
  // the `run` namespace rendered a path that does not compile — `FalProvider`
  // exposes only `run`, with no top-level `alibaba` (ac-5xsd5z).
  it("restores the run namespace for fal endpoints", () => {
    const readme = renderFalApiReference();
    expect(readme).toContain(
      "const res = await fal.run.alibaba.wan3p0.textToVideo({ /* ... */ });"
    );
    expect(readme).not.toContain(
      "const res = await fal.alibaba.wan3p0.textToVideo({ /* ... */ });"
    );
  });

  it("leaves the collapsed label in the summary heading", () => {
    // Only the snippet is corrected; the heading stays collapsed.
    expect(renderFalApiReference()).toContain(
      "<b><code>fal.alibaba.wan3p0.textToVideo</code></b>"
    );
  });

  it("never renders a bare fal.<vendor> snippet", () => {
    const snippets = [
      ...renderFalApiReference().matchAll(/const res = await (fal\.[\w.]+)\(/g),
    ].map((match) => match[1]);
    expect(snippets.length).toBeGreaterThan(0);
    // Every fal call must enter through a real top-level `FalProvider` key.
    // A vendor segment in first position is the ac-5xsd5z defect: those live
    // under `run`, never on the provider root.
    const VENDOR_SEGMENTS = new Set([
      "alibaba",
      "blackforestlabs",
      "bytedance",
      "falAi",
      "google",
      "minimax",
      "wan",
      "xai",
    ]);
    const offenders = snippets.filter((call) =>
      VENDOR_SEGMENTS.has(call.split(".")[1])
    );
    expect(offenders).toEqual([]);
  });

  it("does not double a namespace the label already carries", () => {
    // `post.stream.v1.serverless.logs.stream` already names `stream`; the
    // restoration must not prepend a second one.
    expect(renderFalApiReference()).not.toContain("fal.stream.post.stream.");
  });
});

/** Follows a snippet's `provider.a.b.c` call path on a provider instance. */
function resolveCallPath(root: unknown, call: string): unknown {
  return call
    .split(".")
    .slice(1)
    .reduce<unknown>(
      (node, key) =>
        node === null || node === undefined
          ? undefined
          : (node as Record<string, unknown>)[key],
      root
    );
}

// One real factory per provider that ships a generated README. `cost` has no
// endpoint surface. Options differ by provider; the cast only satisfies the
// constructors. Nothing in this describe calls an endpoint.
const PROVIDER_FACTORIES = {
  alibaba: createAlibaba,
  anthropic: createAnthropic,
  b2: createB2,
  binance: createBinance,
  dolthub: createDoltHub,
  dropbox: createDropbox,
  elevenlabs: createElevenLabs,
  fal: createFal,
  fireworks: createFireworks,
  "free-media-upload": createFreeMediaUpload,
  google: createGoogle,
  googleflow: createGoogleFlow,
  kie: createKie,
  kimicoding: createKimiCoding,
  meta: createMeta,
  openai: createOpenAi,
  openf1: createOpenF1,
  openligadb: createOpenLigaDB,
  polymarket: createPolymarket,
  quo: createQuo,
  s3: createS3,
  simplefunctions: createSimpleFunctions,
  telegram: createTelegram,
  thesportsdb: createTheSportsDB,
  x: createX,
  xai: createXai,
  youtube: createYouTube,
  zaicoding: createZaiCoding,
} as const;

const SNIPPET_PROBE_OPTS = {
  apiKey: "doc-gen-snippet-probe",
  token: "doc-gen-snippet-probe",
  botToken: "123456:doc-gen-snippet-probe",
  accessToken: "doc-gen-snippet-probe",
  accessKeyId: "AKIAPROBE",
  secretAccessKey: "doc-gen-snippet-probe",
  region: "us-east-1",
  endpoint: "https://example.invalid",
  bucket: "probe",
};

type ProviderName = keyof typeof PROVIDER_FACTORIES;

function providerInstance(provider: ProviderName): unknown {
  const factory = PROVIDER_FACTORIES[provider] as (
    opts: typeof SNIPPET_PROBE_OPTS
  ) => unknown;
  return factory(SNIPPET_PROBE_OPTS);
}

function snippetCalls(provider: string, text: string): string[] {
  const escaped = provider.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`const \\w+ = await (${escaped}\\.[\\w.]+)\\(`, "g");
  return [...text.matchAll(re)].map((match) => match[1]);
}

describe("usage snippets name a function on every provider factory", () => {
  let rendered: Map<string, string>;

  beforeAll(async () => {
    const project = loadProject();
    const byProvider = new Map<string, WalkedEndpoint[]>();
    for await (const ep of walkAllEndpoints(project)) {
      const endpoint = ep as WalkedEndpoint;
      const list = byProvider.get(endpoint.provider) ?? [];
      list.push(endpoint);
      byProvider.set(endpoint.provider, list);
    }
    rendered = new Map(
      [...byProvider.entries()].map(([provider, endpoints]) => [
        provider,
        renderApiReference(provider, endpoints).text,
      ])
    );
  }, 300_000);

  it("resolves every rendered snippet to a function", () => {
    const misses: string[] = [];
    const seen = new Set<string>();
    for (const provider of Object.keys(PROVIDER_FACTORIES) as ProviderName[]) {
      // b2 is docs-only in the endpoint walk, so its README is the snippet
      // source. Every walked provider uses the text doc-gen is about to write.
      const readmePath = path.join(
        repoRoot,
        "packages/provider",
        provider,
        "README.md"
      );
      const text =
        rendered.get(provider) ??
        (existsSync(readmePath) ? readFileSync(readmePath, "utf8") : "");
      if (!text) {
        misses.push(`no API reference for ${provider}`);
        continue;
      }
      seen.add(provider);
      const instance = providerInstance(provider);
      const calls = snippetCalls(provider, text);
      if (calls.length === 0) {
        misses.push(`no snippets for ${provider}`);
        continue;
      }
      for (const call of calls) {
        const resolved = resolveCallPath(instance, call);
        if (typeof resolved !== "function") {
          misses.push(`${typeof resolved} ${call}`);
        }
      }
    }
    for (const provider of rendered.keys()) {
      if (!seen.has(provider)) misses.push(`untested provider ${provider}`);
    }
    expect(misses).toEqual([]);
  }, 120_000);

  it("restores the verb on a verb-only factory and the leaf on a namespace", () => {
    const openai = rendered.get("openai") ?? "";
    expect(openai).toContain("<b><code>openai.v1.audio.speech</code></b>");
    expect(openai).toContain(
      "const res = await openai.post.v1.audio.speech({ /* ... */ });"
    );
    expect(openai).not.toContain(
      "const res = await openai.v1.audio.speech({ /* ... */ });"
    );

    const fireworks = rendered.get("fireworks") ?? "";
    expect(fireworks).toContain(
      "const res = await fireworks.inference.v1.accounts.apiKeys.delete("
    );
    const youtube = rendered.get("youtube") ?? "";
    expect(youtube).toContain(
      "const res = await youtube.transcripts.get({ /* ... */ });"
    );
    const fal = rendered.get("fal") ?? "";
    expect(fal).toContain(
      "const res = await fal.v1.serverless.logs.stream({ /* ... */ });"
    );
  });
});
