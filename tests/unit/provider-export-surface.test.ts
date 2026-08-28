import { describe, expect, it } from "vitest";
import {
  checkExportSurface,
  parseExportedNames,
  parseNamespaceDeclarations,
  readProviderExportSurfaces,
} from "../../scripts/lib/export-surface.mjs";

/**
 * Every `*Namespace` type a provider declares as public in `src/types.ts` must
 * be reachable from `@apicity/<provider>`.
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
  youtube: {
    YouTubeChannelsNamespace: YOUTUBE_LAYER,
  },
};

// Pinned so a silent baseline expansion is a visible diff rather than a quiet
// widening of what the guard tolerates.
const EXPECTED_BASELINE_DISTRIBUTION: Record<string, number> = {
  openai: 24,
  alibaba: 16,
  anthropic: 4,
  elevenlabs: 4,
  dolthub: 2,
  youtube: 1,
};
const EXPECTED_BASELINE_TOTAL = 51;

type Surface = ReturnType<typeof readProviderExportSurfaces>[number];

/**
 * Build one surface from synthetic source, so the ratchet cases run real
 * source text through the real parser into the real checker instead of
 * depending on whichever defect happens to be live in the tree.
 *
 * A `null` source means the file is absent.
 */
function syntheticSurface(
  provider: string,
  typesSource: string | null,
  indexSource: string | null
): Surface {
  const typesPath = `packages/provider/${provider}/src/types.ts`;
  const indexPath = `packages/provider/${provider}/src/index.ts`;
  const exports =
    indexSource === null
      ? { names: null, starExportsTypes: false }
      : parseExportedNames(indexPath, indexSource);

  return {
    provider,
    typesPath,
    indexPath,
    declarations:
      typesSource === null
        ? null
        : parseNamespaceDeclarations(typesPath, typesSource),
    exportedNames: exports.names,
    starExportsTypes: exports.starExportsTypes,
  };
}

const GHOST_TYPES = `export interface GhostRunNamespace {
  go: () => void;
}
`;
const GHOST_INDEX = `export type { GhostRunNamespace } from "./types";\n`;

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

  it("discovers every provider from disk", () => {
    const surfaces = readProviderExportSurfaces();
    expect(surfaces.length).toBeGreaterThanOrEqual(29);
    expect(surfaces.map((surface) => surface.provider)).toContain("fal");
    for (const surface of surfaces) {
      expect(surface.declarations, surface.provider).not.toBeNull();
      expect(surface.exportedNames, surface.provider).not.toBeNull();
    }
  });
});
