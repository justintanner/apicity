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
 * Never import `scripts/doc-gen.mjs` here — it calls `main()` at module scope,
 * so importing it would regenerate every README as a side effect. That is why
 * the label layer lives in its own module, and why the three doc-gen-private
 * helpers this file needs (`cleanTsvValue`, the TSV index, and the docs-row
 * lookup) are mirrored below rather than imported.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  displayDotPath,
  resolveEndpointLabels,
} from "../../scripts/lib/endpoint-labels.mjs";
import {
  loadProject,
  walkAllEndpoints,
} from "../../scripts/lib/endpoint-walk.mjs";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";

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
