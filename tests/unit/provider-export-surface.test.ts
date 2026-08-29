import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  checkExportSurface,
  parseExportedNames,
  parseNamespaceDeclarations,
  readProviderExportSurfaces,
  resolveStarExportedModules,
} from "../../scripts/lib/export-surface.mjs";

/**
 * Every `*Namespace` type a provider declares as public in any of its
 * `src/**\/*.ts` modules must be reachable from `@apicity/<provider>`.
 *
 * `FalRunNanoBanana2LiteNamespace` was not: declared `export interface` at
 * `packages/provider/fal/src/types.ts:1810`, hung off `FalRunNamespace` as
 * `nanoBanana2Lite`, and never named in `index.ts`. Lint passed, `tsc --noEmit`
 * passed (the declaration is used inside `types.ts`), the whole replay suite
 * passed; review caught it by eye (`ac-c2cc4j` finding `G2` / `RR-2`, follow-up
 * `FU-1`, filed as `ac-gvqa18`). This guard is the gate that was missing.
 *
 * It is registered in `scripts/lib/cross-cutting-tests.mjs` because its file
 * name matches no provider, so `test:provider` and `test:affected` select it
 * for nobody; without that registration it would run only in full CI.
 */

/**
 * Namespaces that are declared public but deliberately not re-exported yet.
 *
 * A baseline entry is a claim about the tree, so `checkExportSurface` ratchets
 * in both directions: an entry whose type stopped being declared, or that is
 * now re-exported, fails as stale. Entries are per type name — no wildcard and
 * no per-provider blanket skip — mirroring `UNPRICED_SLUG_ALLOWLIST` in
 * `tests/unit/cost-pricing.test.ts`.
 *
 * Re-derived at implementation HEAD rather than copied from the plan: 407
 * exported namespace declarations across 29 providers, 65 unexported, 64 of
 * them non-fal. `fal` contributes zero entries — its one gap is the defect this
 * bead fixes. `telegram` contributes zero as well: `telegram/src/index.ts:3` is
 * `export type * from "./types"`, so `TelegramPostNamespace` is already public
 * and baselining it would write a permanently false statement into the guard.
 */
const VERB_LAYER =
  "verb-layer namespace, reachable from the exported provider interface; " +
  "export decision deferred to the burn-down bead";

const ANTHROPIC_VERB_LAYER =
  "verb-layer namespace under /v1, reachable from the exported " +
  "AnthropicProvider interface; export decision deferred to the burn-down bead";

const SIMPLE_FUNCTIONS_LAYER =
  "path- or verb-layer namespace, reachable from the exported " +
  "SimpleFunctionsProvider interface; export decision deferred to the " +
  "burn-down bead";

const ELEVENLABS_LAYER =
  "sub-namespace reachable from the exported ElevenLabsProvider interface; " +
  "export decision deferred to the burn-down bead";

const DOLTHUB_LAYER =
  "sub-namespace reachable from the exported DoltHubProvider interface; " +
  "export decision deferred to the burn-down bead";

const YOUTUBE_LAYER =
  "sub-namespace reachable from the exported YouTubeProvider interface; " +
  "export decision deferred to the burn-down bead";

const EXPORT_SURFACE_BASELINE: Record<string, Record<string, string>> = {
  alibaba: {
    AlibabaPostV1ChatNamespace: VERB_LAYER,
    AlibabaPostV1Namespace: VERB_LAYER,
    AlibabaPostStreamV1ChatNamespace: VERB_LAYER,
    AlibabaPostStreamV1Namespace: VERB_LAYER,
    AlibabaPostApiV1VideoGenerationNamespace: VERB_LAYER,
    AlibabaPostApiV1ImageGenerationNamespace: VERB_LAYER,
    AlibabaPostApiV1MultimodalGenerationNamespace: VERB_LAYER,
    AlibabaPostApiV1AigcNamespace: VERB_LAYER,
    AlibabaPostApiV1ServicesNamespace: VERB_LAYER,
    AlibabaPostApiV1Namespace: VERB_LAYER,
    AlibabaPostApiNamespace: VERB_LAYER,
    AlibabaPostNamespace: VERB_LAYER,
    AlibabaGetV1Namespace: VERB_LAYER,
    AlibabaGetApiV1Namespace: VERB_LAYER,
    AlibabaGetApiNamespace: VERB_LAYER,
    AlibabaGetNamespace: VERB_LAYER,
  },
  anthropic: {
    AnthropicPostStreamV1Namespace: ANTHROPIC_VERB_LAYER,
    AnthropicPostV1Namespace: ANTHROPIC_VERB_LAYER,
    AnthropicGetV1Namespace: ANTHROPIC_VERB_LAYER,
    AnthropicDeleteV1Namespace: ANTHROPIC_VERB_LAYER,
  },
  dolthub: {
    DoltHubBranchesNamespace: DOLTHUB_LAYER,
    DoltHubPullsNamespace: DOLTHUB_LAYER,
  },
  elevenlabs: {
    ElevenLabsUsageNamespace: ELEVENLABS_LAYER,
    ElevenLabsPostConvaiAgentNamespace: ELEVENLABS_LAYER,
    ElevenLabsGetConvaiAgentNamespace: ELEVENLABS_LAYER,
    ElevenLabsGetConvaiAnalyticsNamespace: ELEVENLABS_LAYER,
  },
  openai: {
    OpenAiPostV1AudioNamespace: VERB_LAYER,
    OpenAiPostV1ChatNamespace: VERB_LAYER,
    OpenAiPostV1ImagesNamespace: VERB_LAYER,
    OpenAiPostV1ResponsesNamespace: VERB_LAYER,
    OpenAiPostV1FineTuningNamespace: VERB_LAYER,
    OpenAiPostV1RealtimeNamespace: VERB_LAYER,
    OpenAiPostV1Namespace: VERB_LAYER,
    OpenAiGetV1ChatNamespace: VERB_LAYER,
    OpenAiGetV1FilesNamespace: VERB_LAYER,
    OpenAiGetV1ModelsNamespace: VERB_LAYER,
    OpenAiGetV1ResponsesNamespace: VERB_LAYER,
    OpenAiGetV1ConversationsNamespace: VERB_LAYER,
    OpenAiGetV1BatchesNamespace: VERB_LAYER,
    OpenAiGetV1VectorStoresNamespace: VERB_LAYER,
    OpenAiGetV1FineTuningNamespace: VERB_LAYER,
    OpenAiGetV1OrganizationNamespace: VERB_LAYER,
    OpenAiGetV1Namespace: VERB_LAYER,
    OpenAiDeleteV1ChatNamespace: VERB_LAYER,
    OpenAiDeleteV1FilesNamespace: VERB_LAYER,
    OpenAiDeleteV1ModelsNamespace: VERB_LAYER,
    OpenAiDeleteV1ResponsesNamespace: VERB_LAYER,
    OpenAiDeleteV1FineTuningNamespace: VERB_LAYER,
    OpenAiDeleteV1Namespace: VERB_LAYER,
    OpenAiGetCodexNamespace: VERB_LAYER,
  },
  simplefunctions: {
    SimpleFunctionsThesisPositionsNamespace: SIMPLE_FUNCTIONS_LAYER,
    SimpleFunctionsThesisStrategiesNamespace: SIMPLE_FUNCTIONS_LAYER,
    SimpleFunctionsThesisHeartbeatNamespace: SIMPLE_FUNCTIONS_LAYER,
    SimpleFunctionsThesisVideosNamespace: SIMPLE_FUNCTIONS_LAYER,
    SimpleFunctionsPortfolioLedgerImportNamespace: SIMPLE_FUNCTIONS_LAYER,
    SimpleFunctionsPortfolioNamespace: SIMPLE_FUNCTIONS_LAYER,
    SimpleFunctionsProxyNamespace: SIMPLE_FUNCTIONS_LAYER,
    SimpleFunctionsXNamespace: SIMPLE_FUNCTIONS_LAYER,
    SimpleFunctionsDashboard2Namespace: SIMPLE_FUNCTIONS_LAYER,
    SimpleFunctionsPostNamespace: SIMPLE_FUNCTIONS_LAYER,
    SimpleFunctionsPutNamespace: SIMPLE_FUNCTIONS_LAYER,
    SimpleFunctionsPatchNamespace: SIMPLE_FUNCTIONS_LAYER,
    SimpleFunctionsDeleteNamespace: SIMPLE_FUNCTIONS_LAYER,
  },
  youtube: {
    YouTubeChannelsNamespace: YOUTUBE_LAYER,
  },
};

// Pinned so a silent baseline expansion is a visible diff rather than a quiet
// widening of what the guard tolerates.
const EXPECTED_BASELINE_DISTRIBUTION: Record<string, number> = {
  openai: 24,
  alibaba: 16,
  simplefunctions: 13,
  anthropic: 4,
  elevenlabs: 4,
  dolthub: 2,
  youtube: 1,
};
const EXPECTED_BASELINE_TOTAL = 64;

/**
 * The surfaces the walk gains below `src/`, pinned exactly (`ac-bsl9tx`, D-6).
 *
 * The nested set rather than a global surface total: a total would red on
 * every unrelated new provider module, while this reds precisely when a module
 * appears under `src/<dir>/` — the event the recursion exists for.
 * `cost/src/pricing` holds one module per priced provider and gains files
 * every few months, so both assertions name the constant to update.
 */
const EXPECTED_NESTED_SURFACES: Record<string, number> = {
  "packages/provider/cost/src/extract": 6,
  "packages/provider/cost/src/pricing": 13,
};
const EXPECTED_NESTED_SURFACE_TOTAL = 19;

const UPDATE_NESTED_PIN =
  "update EXPECTED_NESTED_SURFACES and EXPECTED_NESTED_SURFACE_TOTAL in " +
  "tests/unit/provider-export-surface.test.ts";

type Surface = ReturnType<typeof readProviderExportSurfaces>[number];

/**
 * Build one surface from synthetic source, so the ratchet cases run real
 * source text through the real parser into the real checker instead of
 * depending on whichever defect happens to be live in the tree.
 *
 * A surface is one declaring file, so `fileName` names it: the default keeps
 * every case written against `types.ts` unchanged, and a case that needs b2's
 * or kie's shape passes `s3-types.ts` or `responses.ts`. Two surfaces built
 * with the same `indexSource` model one provider with two modules.
 *
 * A `null` source means the file is absent. `starExportedModules` defaults to
 * what the index star-exports directly; the reader closes that set
 * transitively, and the one case that needs the closed set passes it.
 */
function syntheticSurface(
  provider: string,
  source: string | null,
  indexSource: string | null,
  fileName = "types.ts",
  starExportedModules?: string[]
): Surface {
  const sourcePath = `packages/provider/${provider}/src/${fileName}`;
  const indexPath = `packages/provider/${provider}/src/index.ts`;
  const exports =
    indexSource === null
      ? { names: null, starExportedModules: [] }
      : parseExportedNames(indexPath, indexSource);

  return {
    provider,
    sourcePath,
    indexPath,
    declarations:
      source === null ? null : parseNamespaceDeclarations(sourcePath, source),
    exportedNames: exports.names,
    starExportedModules: starExportedModules ?? exports.starExportedModules,
  };
}

const GHOST_TYPES = `export interface GhostRunNamespace {
  go: () => void;
}
`;
const GHOST_INDEX = `export type { GhostRunNamespace } from "./types";\n`;
const GHOST_RESPONSES_TYPES = `export interface GhostResponsesV1Namespace {
  go: () => void;
}
`;
const GHOST_S3_TYPES = `export interface GhostS3Namespace {
  go: () => void;
}
`;
const GHOST_ZOD_TYPES = `export interface GhostZodNamespace {
  go: () => void;
}
`;
const GHOST_PRICING_TYPES = `export interface GhostPricingFalNamespace {
  go: () => void;
}
`;
const GHOST_PRICING_BARREL_TYPES = `export interface GhostPricingNamespace {
  go: () => void;
}
`;
const GHOST_NESTED_INDEX = `export type { GhostPricingFalNamespace } from "./pricing/fal";\n`;

/** The closure of `export * from "./pricing"` over a barrel that stars ./fal. */
function nestedStarClosure(): string[] {
  return resolveStarExportedModules(
    ["packages/provider/ghost/src/pricing"],
    new Map([
      [
        "packages/provider/ghost/src/pricing/index",
        ["packages/provider/ghost/src/pricing/fal"],
      ],
      ["packages/provider/ghost/src/pricing/fal", []],
    ])
  );
}

const temporaryRoots: string[] = [];

/**
 * A throwaway provider tree, so the recursive walk is asserted against real
 * directories rather than only against hand-built surfaces. `readProviderNames`
 * takes a repo root and keys off `package.json`, so a fixture root is all the
 * reader needs.
 */
function writeFixtureProvider(files: Record<string, string>): string {
  const root = realpathSync(
    mkdtempSync(path.join(tmpdir(), "export-surface-"))
  );
  temporaryRoots.push(root);
  const providerRoot = path.join(root, "packages", "provider", "ghost");
  mkdirSync(providerRoot, { recursive: true });
  writeFileSync(
    path.join(providerRoot, "package.json"),
    JSON.stringify({ name: "@apicity/ghost" }),
    "utf8"
  );
  for (const [relativePath, source] of Object.entries(files)) {
    const absolutePath = path.join(providerRoot, "src", relativePath);
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, source, "utf8");
  }
  return root;
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("provider export surface", () => {
  it("re-exports every declared *Namespace type, or baselines it", () => {
    const problems = checkExportSurface(
      readProviderExportSurfaces(),
      EXPORT_SURFACE_BASELINE
    );
    expect(problems, problems.join("\n\n")).toEqual([]);
  });

  it("reports a declared namespace that is neither exported nor baselined", () => {
    const problems = checkExportSurface(
      [syntheticSurface("ghost", GHOST_TYPES, "export {};\n")],
      {}
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("ghost: GhostRunNamespace is declared at");
    expect(problems[0]).toContain(
      "packages/provider/ghost/src/types.ts:1 but never re-exported from"
    );
    expect(problems[0]).toContain("packages/provider/ghost/src/index.ts.");
    expect(problems[0]).toContain(
      "or add a baseline entry in tests/unit/provider-export-surface.test.ts"
    );
  });

  it("accepts a declared namespace that is re-exported", () => {
    expect(
      checkExportSurface(
        [syntheticSurface("ghost", GHOST_TYPES, GHOST_INDEX)],
        {}
      )
    ).toEqual([]);
  });

  it("accepts a baselined namespace that is not re-exported", () => {
    expect(
      checkExportSurface(
        [syntheticSurface("ghost", GHOST_TYPES, "export {};\n")],
        {
          ghost: { GhostRunNamespace: "deferred" },
        }
      )
    ).toEqual([]);
  });

  it("reports a baseline entry whose type is no longer declared", () => {
    const problems = checkExportSurface(
      [syntheticSurface("ghost", GHOST_TYPES, GHOST_INDEX)],
      { ghost: { GhostGoneNamespace: "deferred" } }
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("stale baseline entry GhostGoneNamespace");
    expect(problems[0]).toContain(
      "no exported interface by that name is declared in"
    );
    // The walk is recursive, so the message names it as such (ac-bsl9tx, D-5).
    expect(problems[0]).toContain("packages/provider/ghost/src/**/*.ts");
  });

  it("reports a baseline entry for a type that is now re-exported", () => {
    const problems = checkExportSurface(
      [syntheticSurface("ghost", GHOST_TYPES, GHOST_INDEX)],
      { ghost: { GhostRunNamespace: "deferred" } }
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("stale baseline entry GhostRunNamespace");
    expect(problems[0]).toContain("it is now re-exported from");
  });

  it("ignores an interface that types.ts does not export", () => {
    const source = `interface GhostPrivateNamespace {\n  go: () => void;\n}\n`;
    expect(
      checkExportSurface(
        [syntheticSurface("ghost", source, "export {};\n")],
        {}
      )
    ).toEqual([]);
  });

  it("ignores a Namespace name that only appears in a comment or a string", () => {
    const source = [
      "// export interface GhostCommentNamespace { go: () => void }",
      'const doc = "export interface GhostStringNamespace {}";',
      "export const used = doc;",
      "",
    ].join("\n");

    expect(
      checkExportSurface(
        [syntheticSurface("ghost", source, "export {};\n")],
        {}
      )
    ).toEqual([]);
  });

  it("skips a provider that has an index.ts but no types.ts", () => {
    expect(
      checkExportSurface([syntheticSurface("ghost", null, GHOST_INDEX)], {})
    ).toEqual([]);
  });

  it("treats a star export of ./types as publishing every declaration", () => {
    // telegram's shape: `export type * from "./types"` publishes the whole
    // file, so a name set would be the wrong answer, not a partial one.
    expect(
      checkExportSurface(
        [
          syntheticSurface(
            "ghost",
            GHOST_TYPES,
            'export type * from "./types";\n'
          ),
        ],
        {}
      )
    ).toEqual([]);
  });

  it("reports a baseline entry for a provider that star-exports its types", () => {
    const problems = checkExportSurface(
      [
        syntheticSurface(
          "ghost",
          GHOST_TYPES,
          'export type * from "./types";\n'
        ),
      ],
      { ghost: { GhostRunNamespace: "deferred" } }
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("star-exports ./types");
  });

  it("ignores a star export of a module other than ./types", () => {
    // b2's shape: `export type * from "./s3-types"` says nothing about the
    // declarations in its own types.ts.
    const problems = checkExportSurface(
      [
        syntheticSurface(
          "ghost",
          GHOST_TYPES,
          'export type * from "./s3-types";\n'
        ),
      ],
      {}
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("ghost: GhostRunNamespace is declared at");
  });

  it("reports a namespace declared outside types.ts", () => {
    // kie's shape: `KieResponsesV1Namespace` lives in responses.ts, which the
    // types.ts-only walk never opened. A new one omitted from index.ts is the
    // RR-2 defect exactly, reachable in a file the guard did not read.
    const problems = checkExportSurface(
      [
        syntheticSurface(
          "ghost",
          GHOST_RESPONSES_TYPES,
          "export {};\n",
          "responses.ts"
        ),
      ],
      {}
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(
      "ghost: GhostResponsesV1Namespace is declared at"
    );
    expect(problems[0]).toContain(
      "packages/provider/ghost/src/responses.ts:1 but never re-exported from"
    );
    // The fix names the declaring module, not a hardcoded "./types".
    expect(problems[0]).toContain('from "./responses"');
  });

  it("reports a namespace declared below src/", () => {
    // The `src/<dir>/` blind spot (F-5 of ac-9at9f2.8): a namespace declared
    // one directory down and omitted from index.ts is RR-2 again, in a file the
    // flat walk never opened.
    const problems = checkExportSurface(
      [
        syntheticSurface(
          "ghost",
          GHOST_PRICING_TYPES,
          "export {};\n",
          "pricing/fal.ts"
        ),
      ],
      {}
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(
      "ghost: GhostPricingFalNamespace is declared at"
    );
    expect(problems[0]).toContain(
      "packages/provider/ghost/src/pricing/fal.ts:1 but never re-exported from"
    );
  });

  it("accepts a namespace declared below src/ that index.ts names", () => {
    expect(
      checkExportSurface(
        [
          syntheticSurface(
            "ghost",
            GHOST_PRICING_TYPES,
            GHOST_NESTED_INDEX,
            "pricing/fal.ts"
          ),
        ],
        {}
      )
    ).toEqual([]);
  });

  it("names a nested module by its src-relative specifier, not its basename", () => {
    const problems = checkExportSurface(
      [
        syntheticSurface(
          "ghost",
          GHOST_PRICING_TYPES,
          "export {};\n",
          "pricing/fal.ts"
        ),
      ],
      {}
    );

    // `./fal` would name a file that does not exist; the fix has to compile.
    expect(problems[0]).toContain('from "./pricing/fal"');
    expect(problems[0]).not.toContain('from "./fal"');
  });

  it("checks a namespace declared in a nested index.ts", () => {
    // D-2: only the depth-0 `src/index.ts` is public by construction. A barrel
    // one directory down carries no such guarantee, so it is a declaring
    // surface like any other module.
    const problems = checkExportSurface(
      [
        syntheticSurface(
          "ghost",
          GHOST_PRICING_BARREL_TYPES,
          "export {};\n",
          "pricing/index.ts"
        ),
      ],
      {}
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(
      "packages/provider/ghost/src/pricing/index.ts:1 but never re-exported from"
    );
    expect(problems[0]).toContain('from "./pricing/index"');
  });

  it("resolves a directory-style star specifier to that directory's barrel", () => {
    // `export * from "./pricing"` is `src/pricing/index.ts` on disk, so the
    // barrel and everything it stars are public. Without the alias the
    // declarations under it read as unexported — a false positive that reds a
    // correct change.
    const closed = nestedStarClosure();

    expect(closed).toEqual([
      "packages/provider/ghost/src/pricing",
      "packages/provider/ghost/src/pricing/fal",
      "packages/provider/ghost/src/pricing/index",
    ]);
    expect(
      checkExportSurface(
        [
          syntheticSurface(
            "ghost",
            GHOST_PRICING_TYPES,
            'export type * from "./pricing";\n',
            "pricing/fal.ts",
            closed
          ),
        ],
        {}
      )
    ).toEqual([]);
  });

  it("prefers a real sibling module over a same-named directory", () => {
    // The alias step fires only when no `<key>.ts` exists. With both a real
    // `src/pricing.ts` and a `src/pricing/` directory in the walk, TypeScript
    // resolves `export * from "./pricing"` to the sibling module, so the
    // barrel and everything it stars stay private. Dropping the
    // `!starsByModule.has(key)` half of the guard reaches the barrel anyway —
    // a false negative: nested declarations read as public, so the guard
    // stops checking them.
    const closed = resolveStarExportedModules(
      ["packages/provider/ghost/src/pricing"],
      new Map([
        ["packages/provider/ghost/src/pricing", []],
        [
          "packages/provider/ghost/src/pricing/index",
          ["packages/provider/ghost/src/pricing/fal"],
        ],
        ["packages/provider/ghost/src/pricing/fal", []],
      ])
    );

    expect(closed).toEqual(["packages/provider/ghost/src/pricing"]);
  });

  it("ratchets a stale baseline entry in both directions past a nested surface", () => {
    const gone = checkExportSurface(
      [
        syntheticSurface(
          "ghost",
          GHOST_PRICING_TYPES,
          GHOST_NESTED_INDEX,
          "pricing/fal.ts"
        ),
      ],
      { ghost: { GhostGoneNamespace: "deferred" } }
    );

    expect(gone).toHaveLength(1);
    expect(gone[0]).toContain("stale baseline entry GhostGoneNamespace");
    expect(gone[0]).toContain("packages/provider/ghost/src/**/*.ts");

    const starred = checkExportSurface(
      [
        syntheticSurface(
          "ghost",
          GHOST_PRICING_TYPES,
          'export type * from "./pricing";\n',
          "pricing/fal.ts",
          nestedStarClosure()
        ),
      ],
      { ghost: { GhostPricingFalNamespace: "deferred" } }
    );

    expect(starred).toHaveLength(1);
    expect(starred[0]).toContain(
      "stale baseline entry GhostPricingFalNamespace"
    );
    expect(starred[0]).toContain("star-exports ./pricing/fal");
  });

  it("reads modules two directories below src/", () => {
    // Depth is uncapped, and one level would be the same blind spot moved down
    // rather than closed. A fixture tree, because the real one nests once.
    const root = writeFixtureProvider({
      "index.ts": "export {};\n",
      "types.ts": "export {};\n",
      "a/mod.ts": GHOST_TYPES,
      "a/b/mod.ts": GHOST_RESPONSES_TYPES,
      "a/b/generated.d.ts": GHOST_S3_TYPES,
    });
    const surfaces = readProviderExportSurfaces(root);

    // The provider's own index.ts is excluded, the `.d.ts` is not a declaring
    // surface, and both nested levels are read.
    expect(surfaces.map((surface) => surface.sourcePath)).toEqual([
      "packages/provider/ghost/src/a/b/mod.ts",
      "packages/provider/ghost/src/a/mod.ts",
      "packages/provider/ghost/src/types.ts",
    ]);
    expect(
      checkExportSurface(surfaces, {}).map((problem) => problem.split("\n")[0])
    ).toEqual([
      "ghost: GhostResponsesV1Namespace is declared at",
      "ghost: GhostRunNamespace is declared at",
    ]);
  });

  it("skips a star-exported module while still checking its provider's types.ts", () => {
    // b2's shape (DC-7): the star is at ./s3-types, so s3-types.ts is public in
    // full while types.ts stays under the rule. Skipping per provider would
    // drop types.ts; checking per provider would report four public names.
    const index = 'export type * from "./s3-types";\n';
    const problems = checkExportSurface(
      [
        syntheticSurface("ghost", GHOST_TYPES, index),
        syntheticSurface("ghost", GHOST_S3_TYPES, index, "s3-types.ts"),
      ],
      {}
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("ghost: GhostRunNamespace is declared at");
    expect(problems[0]).toContain("packages/provider/ghost/src/types.ts:1");
    expect(problems.join("\n")).not.toContain("GhostS3Namespace");
  });

  it("skips a module reached through a chain of star re-exports", () => {
    // telegram's shape (F-1): index.ts stars ./types and types.ts stars ./zod,
    // so zod.ts is public two hops out. One hop would report it as unexported
    // while it is fully reachable — a false positive that reds a correct change.
    const closed = resolveStarExportedModules(
      ["packages/provider/ghost/src/types"],
      new Map([
        [
          "packages/provider/ghost/src/types",
          ["packages/provider/ghost/src/zod"],
        ],
        ["packages/provider/ghost/src/zod", []],
      ])
    );

    expect(closed).toEqual([
      "packages/provider/ghost/src/types",
      "packages/provider/ghost/src/zod",
    ]);
    expect(
      checkExportSurface(
        [
          syntheticSurface(
            "ghost",
            GHOST_ZOD_TYPES,
            'export type * from "./types";\n',
            "zod.ts",
            closed
          ),
        ],
        {}
      )
    ).toEqual([]);
  });

  it("terminates on a cycle of star re-exports", () => {
    expect(
      resolveStarExportedModules(
        ["packages/provider/ghost/src/a"],
        new Map([
          ["packages/provider/ghost/src/a", ["packages/provider/ghost/src/b"]],
          ["packages/provider/ghost/src/b", ["packages/provider/ghost/src/a"]],
        ])
      )
    ).toEqual([
      "packages/provider/ghost/src/a",
      "packages/provider/ghost/src/b",
    ]);
  });

  it("counts a renamed re-export under both of its names", () => {
    // Deliberately over-permissive, per the module comment: collecting both
    // sides keeps a renamed re-export from being reported as a missing one.
    expect(
      checkExportSurface(
        [
          syntheticSurface(
            "ghost",
            GHOST_TYPES,
            'export type { GhostRunNamespace as GhostNamespace } from "./types";\n'
          ),
        ],
        {}
      )
    ).toEqual([]);
  });

  it("gives every baseline entry a non-empty rationale", () => {
    for (const [provider, types] of Object.entries(EXPORT_SURFACE_BASELINE)) {
      for (const [name, rationale] of Object.entries(types)) {
        expect(typeof rationale, `${provider}/${name}`).toBe("string");
        expect(rationale.trim(), `${provider}/${name}`).not.toBe("");
      }
    }
  });

  it("pins the baseline total and its per-provider distribution", () => {
    const distribution = Object.fromEntries(
      Object.entries(EXPORT_SURFACE_BASELINE).map(([provider, types]) => [
        provider,
        Object.keys(types).length,
      ])
    );
    const total = Object.values(distribution).reduce(
      (sum, count) => sum + count,
      0
    );

    expect(distribution).toEqual(EXPECTED_BASELINE_DISTRIBUTION);
    expect(total).toBe(EXPECTED_BASELINE_TOTAL);
    // The bead's own gap and the star-export miscount, pinned as zero.
    expect(EXPORT_SURFACE_BASELINE.fal).toBeUndefined();
    expect(EXPORT_SURFACE_BASELINE.telegram).toBeUndefined();
  });

  it("discovers every provider from disk, one surface per declaring file", () => {
    const surfaces = readProviderExportSurfaces();
    const providers = [...new Set(surfaces.map((surface) => surface.provider))];

    expect(providers.length).toBeGreaterThanOrEqual(29);
    expect(providers).toContain("fal");
    // More surfaces than providers is the widening itself: the provider's own
    // index.ts is not a surface, and every other module under src/ is one.
    expect(surfaces.length).toBeGreaterThan(providers.length);
    for (const surface of surfaces) {
      expect(surface.declarations, surface.sourcePath).not.toBeNull();
      expect(surface.exportedNames, surface.sourcePath).not.toBeNull();
      expect(
        surface.sourcePath.endsWith("/src/index.ts"),
        surface.sourcePath
      ).toBe(false);
    }
    for (const provider of providers) {
      const own = surfaces.filter((surface) => surface.provider === provider);
      expect(
        own.some(
          (surface) =>
            surface.sourcePath === `packages/provider/${provider}/src/types.ts`
        ),
        provider
      ).toBe(true);
    }
    // The file the gap was reachable in is now read (ac-9at9f2.8).
    expect(surfaces.map((surface) => surface.sourcePath)).toContain(
      "packages/provider/kie/src/responses.ts"
    );

    // And the directories below src/ are now read too (ac-bsl9tx). Pinned as
    // the nested set: the widening is a deliberate number in the diff, and a
    // module added under src/<dir>/ reds here rather than nowhere.
    const nested = surfaces.filter(
      (surface) =>
        path.posix.dirname(surface.sourcePath) !==
        `packages/provider/${surface.provider}/src`
    );
    const nestedCounts: Record<string, number> = {};
    for (const surface of nested) {
      const directory = path.posix.dirname(surface.sourcePath);
      nestedCounts[directory] = (nestedCounts[directory] ?? 0) + 1;
    }

    expect(nestedCounts, UPDATE_NESTED_PIN).toEqual(EXPECTED_NESTED_SURFACES);
    expect(nested.length, UPDATE_NESTED_PIN).toBe(
      EXPECTED_NESTED_SURFACE_TOTAL
    );
  });
});
