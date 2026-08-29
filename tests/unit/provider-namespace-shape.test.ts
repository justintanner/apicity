import { describe, expect, it } from "vitest";
import {
  ANY_PROVIDER,
  ROOT_PATH,
  SHAPES,
  checkNamespaceCollisions,
  checkNamespaceShapeRatchet,
  factoryNameFor,
  parseNamespaceShapes,
  readTreeNamespaceShapes,
} from "../../scripts/lib/namespace-shape.mjs";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";

/**
 * A namespace dot path must resolve to one shape across the sibling slices of
 * one fan-out.
 *
 * Four slices of `ac-c2cc4j` each declared the same `fal` namespace: one bound
 * it to a callable, three declared it as an object with a single leaf. Every
 * slice passed its own gate, because the incompatibility exists only BETWEEN
 * the branches — no single tree holds it — and the run reached publish
 * unflagged (`RF-1`, review finding `RR-5`, follow-up `ac-j4z1t1`). The
 * integration slice reconciled it by hand into the `Object.assign`
 * callable-with-children idiom.
 *
 * Every rule below is driven from synthetic sources declared in this file.
 * The refs that carry the real defect are unmerged branches and worktrees, so
 * a committed test may not depend on them: they are a recorded transcript in
 * the run's implementation summary, and this file names none of them.
 *
 * It is registered in `scripts/lib/cross-cutting-tests.mjs` because it is named
 * after no provider, so `test:provider` and `test:affected` select it for
 * nobody; without that registration it would run only in full CI.
 */

type Inventory = ReturnType<typeof readTreeNamespaceShapes>[number];
type Shape = Inventory["paths"][string];

const GHOST = "ghost";
const GHOST_FILE = `packages/provider/${GHOST}/src/${GHOST}.ts`;

/**
 * Run a synthetic factory body through the real parser into an inventory, so
 * the comparison cases assert against parsed source rather than against a hand
 * transcription of what the parser is assumed to produce.
 *
 * `modules` is a virtual `src/` directory keyed by file name. Supplying it is
 * what opens the cross-file seam, the same way `inventoryFrom` opens it from a
 * real listing; omitting it leaves the three-argument, one-file contract every
 * case below it was written against. `head` carries the entry file's own
 * imports, which have to sit above the factory.
 */
function parsed(
  ref: string,
  body: string,
  options: {
    modules?: Record<string, string>;
    head?: string;
    maxDepth?: number;
  } = {}
): Inventory {
  const source = `${options.head ?? ""}export function createGhost(opts: GhostOptions): GhostProvider {\n${body}\n}\n`;
  const files = options.modules;
  return {
    provider: GHOST,
    ref,
    filePath: GHOST_FILE,
    ...parseNamespaceShapes(GHOST_FILE, source, factoryNameFor(GHOST), {
      maxDepth: options.maxDepth,
      modules: files
        ? (specifier: string) => {
            // A plain lookup, so an unresolvable specifier and a missing file
            // reach the parser as the one thing it contracts to handle: null.
            const file = `${specifier.replace(/^\.\//, "")}.ts`;
            const moduleSource = files[file];
            return moduleSource === undefined
              ? null
              : {
                  fileName: `packages/provider/${GHOST}/src/${file}`,
                  source: moduleSource,
                };
          }
        : undefined,
    }),
  };
}

/** An inventory written by hand, for shape combinations no fixture reaches. */
function handBuilt(
  ref: string,
  paths: Record<string, Shape>,
  provider = GHOST
): Inventory {
  const dotPaths = Object.keys(paths).sort();
  return {
    provider,
    ref,
    filePath: `packages/provider/${provider}/src/${provider}.ts`,
    factory: factoryNameFor(provider),
    paths: Object.fromEntries(
      dotPaths.map((dotPath) => [dotPath, paths[dotPath]])
    ),
    lines: Object.fromEntries(
      dotPaths.map((dotPath, index) => [dotPath, index + 1])
    ),
    unresolved: dotPaths.filter((dotPath) => paths[dotPath] === "unresolved"),
    duplicates: [],
  };
}

const CALLABLE_BODY = [
  '  const sharedFamily = jsonBody<GhostRequest, GhostResponse>("POST", "/x");',
  "  return attachExamples({ sharedFamily });",
].join("\n");

/**
 * The object and callable-with-children fixtures take their leaf name, because
 * a fan-out's slices each add a DIFFERENT leaf to the shared namespace. Two
 * refs binding the same leaf is its own collision row, and reusing one leaf
 * name would fold that row into every other case.
 */
function objectBody(leaf: string): string {
  return `  return attachExamples({ sharedFamily: { ${leaf}: () => undefined } });`;
}

function childrenBody(leaf: string): string {
  return [
    "  return attachExamples({",
    '    sharedFamily: Object.assign(jsonBody("POST", "/x"), {',
    `      ${leaf}: () => undefined,`,
    "    }),",
    "  });",
  ].join("\n");
}

const OBJECT_BODY = objectBody("leafOne");
const CHILDREN_BODY = childrenBody("leafTwo");

describe("provider namespace shape: parsing", () => {
  it("classifies the endpoint-builder call idiom as callable", () => {
    const { paths, lines } = parsed("callable", CALLABLE_BODY);
    expect(paths).toEqual({ sharedFamily: "callable" });
    expect(lines.sharedFamily).toBe(3);
  });

  it("classifies an object literal as object and descends into it", () => {
    expect(parsed("object", OBJECT_BODY).paths).toEqual({
      sharedFamily: "object",
      "sharedFamily.leafOne": "callable",
    });
  });

  it("classifies Object.assign over a callable as callable-with-children", () => {
    expect(parsed("children", CHILDREN_BODY).paths).toEqual({
      sharedFamily: "callable-with-children",
      "sharedFamily.leafTwo": "callable",
    });
  });

  it("classifies Object.assign over a literal as object", () => {
    // No call signature to merge into, so the pair stays a plain object.
    const body = [
      "  return attachExamples({",
      "    sharedFamily: Object.assign({ leafOne: () => undefined }, {",
      "      leafTwo: () => undefined,",
      "    }),",
      "  });",
    ].join("\n");

    expect(parsed("assign-literal", body).paths).toEqual({
      sharedFamily: "object",
      "sharedFamily.leafOne": "callable",
      "sharedFamily.leafTwo": "callable",
    });
  });

  it("resolves a factory-local function declaration named by shorthand", () => {
    const body = [
      "  async function listThings(signal?: AbortSignal) {",
      "    return await request(signal);",
      "  }",
      "  return attachExamples({ v1: { listThings } });",
    ].join("\n");

    expect(parsed("function", body).paths).toEqual({
      v1: "object",
      "v1.listThings": "callable",
    });
  });

  it("resolves a member access into a literal this file holds", () => {
    // The verb-layer idiom: one endpoint reachable from two dot paths.
    const body = [
      "  const postV1 = { things: { create: () => undefined } };",
      "  return attachExamples({ v1: postV1, post: { v1: postV1 } });",
    ].join("\n");

    expect(parsed("member", body).paths).toEqual({
      v1: "object",
      "v1.things": "object",
      "v1.things.create": "callable",
      post: "object",
      "post.v1": "object",
      "post.v1.things": "object",
      "post.v1.things.create": "callable",
    });
  });

  it("unwraps call expressions repeatedly to the first literal argument", () => {
    // The paid-gate shape: the literal is the second argument of an inner call.
    const body = [
      '  return attachExamples(withPaidGate("ghost", {',
      "    v1: { create: () => undefined },",
      "  }, { config: paygate }));",
    ].join("\n");

    expect(parsed("paid-gate", body).paths).toEqual({
      v1: "object",
      "v1.create": "callable",
    });
  });

  it("reports an unresolvable binding, spread, and foreign member access", () => {
    const body = [
      "  const s3 = createS3(opts);",
      "  return attachExamples({",
      "    ...composed,",
      "    schema: GhostRequestSchema,",
      "    buckets: { create: s3.buckets.create },",
      "  });",
    ].join("\n");
    const inventory = parsed("opaque", body);

    expect(inventory.paths).toEqual({
      "<spread:0>": "unresolved",
      schema: "unresolved",
      buckets: "object",
      "buckets.create": "unresolved",
    });
    expect(inventory.unresolved).toEqual([
      "<spread:0>",
      "buckets.create",
      "schema",
    ]);
  });

  it("reports an unreachable root rather than an empty inventory", () => {
    // The loop-merged root: following the binding would report "declares
    // nothing", which reads as a fact about the provider rather than about the
    // detector.
    const body = [
      "  const provider: Record<string, unknown> = {};",
      "  for (const part of parts) mergeInto(provider, part);",
      "  return attachExamples(provider as unknown as GhostProvider);",
    ].join("\n");

    expect(parsed("root", body).paths).toEqual({ [ROOT_PATH]: "unresolved" });
  });

  it("reports no factory when the file declares none", () => {
    const parsedFile = parseNamespaceShapes(
      GHOST_FILE,
      "export const notAFactory = 1;\n",
      factoryNameFor(GHOST)
    );
    expect(parsedFile.factory).toBeNull();
    expect(parsedFile.paths).toEqual({ [ROOT_PATH]: "unresolved" });
  });

  it("collects a dot path declared twice inside one literal", () => {
    const body = [
      "  return attachExamples({",
      "    sharedFamily: () => undefined,",
      "    sharedFamily: { leafOne: () => undefined },",
      "  });",
    ].join("\n");
    const inventory = parsed("duplicate", body);

    expect(inventory.duplicates).toEqual(["sharedFamily"]);
    // Last declaration wins, the way JavaScript itself resolves it.
    expect(inventory.paths.sharedFamily).toBe("object");
  });

  it("does not call an Object.assign override a duplicate", () => {
    // Later arguments win by definition; fireworks re-points an inherited
    // alias this way three times.
    const body = [
      '  const base = Object.assign(jsonBody("POST", "/x"), {',
      "    post: () => undefined,",
      "  });",
      "  return attachExamples({",
      "    sharedFamily: Object.assign(base, { post: () => undefined }),",
      "  });",
    ].join("\n");

    expect(parsed("override", body).duplicates).toEqual([]);
  });

  it("resolves a spread of a sibling module's factory call", () => {
    // R1: kie spreads ten sub-provider factory calls into its root literal, so
    // their members belong to the ENCLOSING namespace and add no segment.
    const inventory = parsed(
      "spread-call",
      "  return attachExamples({ ...createClaude(ctx) });",
      {
        head: 'import { createClaude } from "./claude";\n',
        modules: {
          "claude.ts": [
            "export function createClaude(ctx: GhostContext) {",
            '  const send = jsonBody("POST", "/claude");',
            "  return { claude: Object.assign(send, { schema: ClaudeRequestSchema }) };",
            "}",
          ].join("\n"),
        },
      }
    );

    expect(inventory.paths).toEqual({
      claude: "callable-with-children",
      "claude.schema": "unresolved",
    });
    // The sibling's `.schema` is metadata wherever it is written, so the
    // repository-wide baseline entry covers it exactly as it does in-file.
    expect(inventory.unresolved).toEqual(["claude.schema"]);
  });

  it("resolves a spread of a same-file binding without reporting duplicates", () => {
    // R2: telegram's root is `{ ...post, post }`. Both sets survive — the
    // duplicate check is the per-literal `declared` set of ONE walk, and the
    // spread's members are recorded by a nested walk with a set of its own.
    const body = [
      "  const post = { sendMessage: () => undefined };",
      "  return attachExamples({ ...post, post });",
    ].join("\n");
    const inventory = parsed("spread-binding", body);

    expect(inventory.paths).toEqual({
      sendMessage: "callable",
      post: "object",
      "post.sendMessage": "callable",
    });
    expect(inventory.duplicates).toEqual([]);
  });

  it("merges two resolved spreads that share an intermediate namespace", () => {
    // R5: the shared `v1` is recorded twice with the same shape into one
    // dot-path map, so the merge is deep without anything modelling a merge.
    const inventory = parsed(
      "spread-merge",
      "  return attachExamples({ ...createOne(ctx), ...createTwo(ctx) });",
      {
        head: 'import { createOne } from "./one";\nimport { createTwo } from "./two";\n',
        modules: {
          "one.ts":
            "export function createOne(ctx: GhostContext) {\n  return { v1: { alpha: () => undefined } };\n}",
          "two.ts":
            "export function createTwo(ctx: GhostContext) {\n  return { v1: { beta: () => undefined } };\n}",
        },
      }
    );

    expect(inventory.paths).toEqual({
      v1: "object",
      "v1.alpha": "callable",
      "v1.beta": "callable",
    });
    expect(inventory.duplicates).toEqual([]);
  });

  it("takes the last contributor when two spreads declare one path differently", () => {
    // The one in-provider case this module does not report: `record` is
    // last-write-wins with no shape comparison, which IS Object.assign
    // semantics, and two contributors are not a duplicate of each other.
    const inventory = parsed(
      "spread-collide",
      "  return attachExamples({ ...createOne(ctx), ...createTwo(ctx) });",
      {
        head: 'import { createOne } from "./one";\nimport { createTwo } from "./two";\n',
        modules: {
          "one.ts":
            "export function createOne(ctx: GhostContext) {\n  return { v1: { shared: () => undefined } };\n}",
          "two.ts":
            "export function createTwo(ctx: GhostContext) {\n  return { v1: { shared: { leaf: () => undefined } } };\n}",
        },
      }
    );

    expect(inventory.paths).toEqual({
      v1: "object",
      "v1.shared": "object",
      "v1.shared.leaf": "callable",
    });
    expect(inventory.duplicates).toEqual([]);
  });

  it("degrades to a spread sentinel when the sibling file is missing", () => {
    // AC-12, both halves: a file the listing does not hold, and a specifier
    // that leaves the provider's own src. Neither throws; both fall back to
    // exactly what this file recorded before it could see across files.
    const missing = parsed(
      "missing",
      "  return attachExamples({ ...createGone(ctx) });",
      {
        head: 'import { createGone } from "./gone";\n',
        modules: { "other.ts": "export const unrelated = 1;\n" },
      }
    );
    expect(missing.paths).toEqual({ "<spread:0>": "unresolved" });

    const foreign = parsed(
      "foreign",
      "  return attachExamples({ ...createGone(ctx) });",
      {
        head: 'import { createGone } from "../elsewhere/gone";\n',
        modules: {
          "gone.ts":
            "export function createGone() {\n  return { leaf: () => undefined };\n}",
        },
      }
    );
    expect(foreign.paths).toEqual({ "<spread:0>": "unresolved" });
  });

  it("terminates on an import cycle and keeps both contributors", () => {
    // AC-13. The walk guard is keyed by (literal, prefix), so re-entering a
    // literal at a prefix it already carries stops rather than recursing.
    const inventory = parsed(
      "cycle",
      "  return attachExamples({ ...createA(ctx) });",
      {
        head: 'import { createA } from "./a";\n',
        modules: {
          "a.ts": [
            'import { createB } from "./b";',
            "export function createA(ctx: GhostContext) {",
            "  return { alpha: () => undefined, ...createB(ctx) };",
            "}",
          ].join("\n"),
          "b.ts": [
            'import { createA } from "./a";',
            "export function createB(ctx: GhostContext) {",
            "  return { beta: () => undefined, ...createA(ctx) };",
            "}",
          ].join("\n"),
        },
      }
    );

    expect(inventory.paths).toEqual({ alpha: "callable", beta: "callable" });
  });

  it("stops at the module hop bound rather than following a deeper chain", () => {
    const chain = {
      "one.ts":
        'import { createTwo } from "./two";\nexport function createOne(c: C) {\n  return { ...createTwo(c) };\n}',
      "two.ts":
        "export function createTwo(c: C) {\n  return { leaf: () => undefined };\n}",
    };
    const head = 'import { createOne } from "./one";\n';
    const body = "  return attachExamples({ ...createOne(ctx) });";

    expect(parsed("deep", body, { head, modules: chain }).paths).toEqual({
      leaf: "callable",
    });
    expect(
      parsed("bounded", body, { head, modules: chain, maxDepth: 1 }).paths
    ).toEqual({ leaf: "callable" });
    expect(
      parsed("stopped", body, { head, modules: chain, maxDepth: 0 }).paths
    ).toEqual({ "<spread:0>": "unresolved" });
  });

  it("emits paths in sorted order, so two derivations are byte-identical", () => {
    const first = parsed("determinism", OBJECT_BODY);
    const second = parsed("determinism", OBJECT_BODY);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(Object.keys(first.paths)).toEqual(
      [...Object.keys(first.paths)].sort()
    );
  });
});

describe("provider namespace shape: cross-ref comparison", () => {
  const base = handBuilt("main", {});

  it("reports callable against object as a collision naming every ref", () => {
    const { collisions } = checkNamespaceCollisions(
      [
        parsed("ref-a", CALLABLE_BODY),
        parsed("ref-b", OBJECT_BODY),
        parsed("ref-c", objectBody("leafThree")),
      ],
      base
    );

    expect(collisions).toEqual([
      {
        provider: GHOST,
        dotPath: "sharedFamily",
        refs: [
          { ref: "ref-a", shape: "callable", line: 3 },
          { ref: "ref-b", shape: "object", line: 2 },
          { ref: "ref-c", shape: "object", line: 2 },
        ],
      },
    ]);
  });

  it("does not report callable against callable-with-children", () => {
    const { collisions, shared } = checkNamespaceCollisions(
      [parsed("ref-a", CALLABLE_BODY), parsed("ref-b", CHILDREN_BODY)],
      base
    );

    expect(collisions).toEqual([]);
    expect(shared).toEqual([
      {
        provider: GHOST,
        dotPath: "sharedFamily",
        shape: "mixed",
        refs: ["ref-a", "ref-b"],
      },
    ]);
  });

  it("does not report object against object, but does report it as shared", () => {
    const { collisions, shared } = checkNamespaceCollisions(
      [parsed("ref-a", OBJECT_BODY), parsed("ref-b", objectBody("leafThree"))],
      base
    );

    expect(collisions).toEqual([]);
    expect(shared).toEqual([
      {
        provider: GHOST,
        dotPath: "sharedFamily",
        shape: "object",
        refs: ["ref-a", "ref-b"],
      },
    ]);
  });

  it("reports two refs binding the same leaf twice", () => {
    // The other half of the callable/callable row: a shared object namespace
    // merges, but two slices declaring one leaf is a duplicate key.
    const { collisions } = checkNamespaceCollisions(
      [parsed("ref-a", OBJECT_BODY), parsed("ref-b", OBJECT_BODY)],
      base
    );
    expect(collisions.map((entry) => entry.dotPath)).toEqual([
      "sharedFamily.leafOne",
    ]);
  });

  it("reports object against callable-with-children as a collision", () => {
    const { collisions } = checkNamespaceCollisions(
      [parsed("ref-a", OBJECT_BODY), parsed("ref-b", CHILDREN_BODY)],
      base
    );
    expect(collisions.map((entry) => entry.dotPath)).toEqual(["sharedFamily"]);
  });

  it("reports callable against callable as a collision", () => {
    const { collisions } = checkNamespaceCollisions(
      [parsed("ref-a", CALLABLE_BODY), parsed("ref-b", CALLABLE_BODY)],
      base
    );
    expect(collisions.map((entry) => entry.dotPath)).toEqual(["sharedFamily"]);
  });

  it("reports two scaffolds at one path as a collision", () => {
    const { collisions } = checkNamespaceCollisions(
      [
        parsed("ref-a", CHILDREN_BODY),
        parsed("ref-b", childrenBody("leafFour")),
      ],
      base
    );
    expect(collisions.map((entry) => entry.dotPath)).toEqual(["sharedFamily"]);
  });

  it("never lets an unresolved path participate", () => {
    const { collisions, shared } = checkNamespaceCollisions(
      [
        handBuilt("ref-a", { sharedFamily: "unresolved" }),
        handBuilt("ref-b", { sharedFamily: "object" }),
        handBuilt("ref-c", { sharedFamily: "unresolved" }),
      ],
      base
    );

    expect(collisions).toEqual([]);
    expect(shared).toEqual([]);
  });

  it("ignores paths that every ref inherits unchanged from the base", () => {
    // Without this the report is the whole provider tree: every ref in a
    // fan-out branches from one baseline and carries all of it, so every
    // pre-existing callable leaf would read as a callable/callable collision.
    const inherited = { "v1.models": "callable" as Shape };
    const { collisions, shared } = checkNamespaceCollisions(
      [handBuilt("ref-a", inherited), handBuilt("ref-b", inherited)],
      handBuilt("main", inherited)
    );

    expect(collisions).toEqual([]);
    expect(shared).toEqual([]);
  });

  it("ignores a path only one ref changed away from the base", () => {
    const { collisions, shared } = checkNamespaceCollisions(
      [
        handBuilt("ref-a", { sharedFamily: "object" }),
        handBuilt("ref-b", { sharedFamily: "callable" }),
      ],
      handBuilt("main", { sharedFamily: "object" })
    );

    expect(collisions).toEqual([]);
    expect(shared).toEqual([]);
  });

  it("reports a shape change two refs make to the same inherited path", () => {
    const { collisions } = checkNamespaceCollisions(
      [
        handBuilt("ref-a", { sharedFamily: "callable" }),
        handBuilt("ref-b", { sharedFamily: "callable-with-children" }),
        handBuilt("ref-c", { sharedFamily: "callable" }),
      ],
      handBuilt("main", { sharedFamily: "object" })
    );

    expect(collisions.map((entry) => entry.refs.map((ref) => ref.ref))).toEqual(
      [["ref-a", "ref-b", "ref-c"]]
    );
  });

  it("lists every contributing ref of a shared namespace", () => {
    const { shared } = checkNamespaceCollisions(
      [
        handBuilt("ref-a", { family: "object", "family.one": "callable" }),
        handBuilt("ref-b", { family: "object", "family.two": "callable" }),
        handBuilt("ref-c", { family: "object", "family.three": "callable" }),
      ],
      base
    );

    expect(shared).toEqual([
      {
        provider: GHOST,
        dotPath: "family",
        shape: "object",
        refs: ["ref-a", "ref-b", "ref-c"],
      },
    ]);
  });

  it("compares each provider against its own base", () => {
    const { collisions } = checkNamespaceCollisions(
      [
        handBuilt("ref-a", { family: "callable" }, "one"),
        handBuilt("ref-b", { family: "object" }, "one"),
        handBuilt("ref-a", { family: "callable" }, "two"),
        handBuilt("ref-b", { family: "callable" }, "two"),
      ],
      [
        handBuilt("main", {}, "one"),
        handBuilt("main", { family: "callable" }, "two"),
      ]
    );

    // `two`'s refs both inherit `family` unchanged, so only `one` collides.
    expect(collisions.map((entry) => entry.provider)).toEqual(["one"]);
  });

  it("treats a missing base as an empty tree", () => {
    const { collisions } = checkNamespaceCollisions([
      handBuilt("ref-a", { family: "callable" }),
      handBuilt("ref-b", { family: "object" }),
    ]);
    expect(collisions.map((entry) => entry.dotPath)).toEqual(["family"]);
  });
});

/**
 * Dot paths the shape detector cannot resolve today, and why.
 *
 * Derived from a real `readTreeNamespaceShapes` run rather than guessed: the
 * survey found more opaque constructs than the obvious one, and a guessed list
 * fails on its first run. A baseline entry is a claim about the tree, so
 * `checkNamespaceShapeRatchet` ratchets both directions — a pattern that stops
 * matching anything is stale and fails — which is what keeps the baseline from
 * quietly absorbing coverage loss.
 *
 * A key is an exact dot path unless it contains `*`, which matches any run of
 * characters. The `*` provider applies to every provider.
 */
const ZOD_SCHEMA =
  "the zod request schema every POST endpoint carries as `.schema`, imported " +
  "from the provider's src/zod.ts and attached by Object.assign; metadata " +
  "rather than a namespace, and cross-file resolution is out of scope";

const KIE_RESPONSE_SCHEMA =
  "a zod response schema imported from src/zod.ts, the same metadata class as " +
  "`.schema` under a different key";

const S3_DELEGATE =
  "b2 delegates to the vendored s3 provider, so its leaves are member " +
  "accesses into another factory's return value (`s3.buckets.create`); the " +
  "base is a call, not a literal this file holds";

const LOOP_MERGED_ROOT =
  "the factory composes its root by merging parts into a variable in a loop, " +
  "so no object literal is syntactically reachable from the return";

const NAMESPACE_SHAPE_BASELINE: Record<string, Record<string, string>> = {
  [ANY_PROVIDER]: {
    "*.schema": ZOD_SCHEMA,
  },
  b2: {
    "buckets.*": S3_DELEGATE,
    "objects.*": S3_DELEGATE,
    "presign.*": S3_DELEGATE,
  },
  elevenlabs: {
    [ROOT_PATH]: LOOP_MERGED_ROOT,
  },
  kie: {
    "*.responseSchema": KIE_RESPONSE_SCHEMA,
    "*.seedance2MiniResponseSchema": KIE_RESPONSE_SCHEMA,
    modelInputSchemas: KIE_RESPONSE_SCHEMA,
  },
  simplefunctions: {
    "*.responseSchema": KIE_RESPONSE_SCHEMA,
  },
};

/**
 * Which providers carry an opacity of their own, pinned so that widening the
 * baseline is a visible diff rather than a quiet loss of coverage.
 *
 * Counts are deliberately NOT pinned: every POST endpoint landing adds one
 * `*.schema` path, so a total would fail on unrelated provider work and be
 * re-pinned without being read.
 */
const EXPECTED_BASELINE_PROVIDERS = [
  ANY_PROVIDER,
  "b2",
  "elevenlabs",
  "kie",
  "simplefunctions",
];

describe("provider namespace shape: the live tree", () => {
  it("resolves every namespace it does not baseline", () => {
    const problems = checkNamespaceShapeRatchet(
      readTreeNamespaceShapes(repoRoot),
      NAMESPACE_SHAPE_BASELINE
    );
    expect(problems, problems.join("\n\n")).toEqual([]);
  });

  it("derives the same inventory twice, byte for byte", () => {
    expect(JSON.stringify(readTreeNamespaceShapes(repoRoot))).toBe(
      JSON.stringify(readTreeNamespaceShapes(repoRoot))
    );
  });

  it("gives every dot path a shape from the closed vocabulary", () => {
    for (const inventory of readTreeNamespaceShapes(repoRoot)) {
      for (const [dotPath, shape] of Object.entries(inventory.paths)) {
        expect(SHAPES, `${inventory.provider}: ${dotPath}`).toContain(shape);
      }
    }
  });

  it("discovers every provider and its factory from disk", () => {
    const inventories = readTreeNamespaceShapes(repoRoot);
    expect(inventories.length).toBeGreaterThanOrEqual(29);
    expect(inventories.map((entry) => entry.provider)).toContain("fal");

    for (const inventory of inventories) {
      expect(inventory.factory, inventory.provider).not.toBeNull();
      expect(inventory.filePath, inventory.provider).not.toBeNull();
      expect(inventory.duplicates, inventory.provider).toEqual([]);
    }
  });

  it("resolves the provider root of every provider but the baselined one", () => {
    const opaque = readTreeNamespaceShapes(repoRoot)
      .filter((inventory) => Object.hasOwn(inventory.paths, ROOT_PATH))
      .map((inventory) => inventory.provider);
    expect(opaque).toEqual(["elevenlabs"]);
  });

  it("gives every baseline entry a non-empty rationale and no bare wildcard", () => {
    for (const [provider, patterns] of Object.entries(
      NAMESPACE_SHAPE_BASELINE
    )) {
      for (const [pattern, rationale] of Object.entries(patterns)) {
        expect(pattern, provider).not.toBe("*");
        expect(rationale.trim(), `${provider}/${pattern}`).not.toBe("");
      }
    }
  });

  it("pins which providers carry an opacity of their own", () => {
    expect(Object.keys(NAMESPACE_SHAPE_BASELINE).sort()).toEqual(
      [...EXPECTED_BASELINE_PROVIDERS].sort()
    );
  });
});

describe("provider namespace shape: the ratchet", () => {
  it("reports an unresolved path that no baseline entry covers", () => {
    const problems = checkNamespaceShapeRatchet(
      handBuilt("tree", { "family.leaf": "unresolved" }),
      {}
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("ghost: family.leaf is unresolved at");
    expect(problems[0]).toContain("packages/provider/ghost/src/ghost.ts:1");
    expect(problems[0]).toContain(
      "baseline entry in tests/unit/provider-namespace-shape.test.ts"
    );
  });

  it("accepts an unresolved path an exact or wildcard entry covers", () => {
    const inventory = handBuilt("tree", {
      "family.leaf": "unresolved",
      "other.schema": "unresolved",
    });

    expect(
      checkNamespaceShapeRatchet(inventory, {
        ghost: { "family.leaf": "known", "*.schema": "known" },
      })
    ).toEqual([]);
    expect(
      checkNamespaceShapeRatchet(inventory, {
        [ANY_PROVIDER]: { "family.*": "known", "*.schema": "known" },
      })
    ).toEqual([]);
  });

  it("reports a baseline entry whose path now resolves", () => {
    const problems = checkNamespaceShapeRatchet(
      handBuilt("tree", { "family.leaf": "callable" }),
      { ghost: { "family.leaf": "known" } }
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("stale baseline entry family.leaf");
    expect(problems[0]).toContain("it now resolves as callable");
  });

  it("reports a baseline entry that matches nothing any more", () => {
    const problems = checkNamespaceShapeRatchet(
      handBuilt("tree", { "family.leaf": "callable" }),
      { ghost: { "gone.*": "known" } }
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("no unresolved dot path matches it any more");
  });

  it("reports a baseline entry for a provider with no inventory", () => {
    const problems = checkNamespaceShapeRatchet(
      handBuilt("tree", { "family.leaf": "callable" }),
      { departed: { "family.leaf": "known" } }
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("departed has no inventory in this tree");
  });

  it("reports a dot path declared twice within one tree", () => {
    const inventory = handBuilt("tree", { sharedFamily: "object" });
    const problems = checkNamespaceShapeRatchet(
      { ...inventory, duplicates: ["sharedFamily"] },
      {}
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("ghost: sharedFamily is declared twice in");
    expect(problems[0]).toContain("packages/provider/ghost/src/ghost.ts");
  });

  it("reports a shape outside the closed vocabulary", () => {
    const problems = checkNamespaceShapeRatchet(
      handBuilt("tree", { family: "namespace" as Shape }),
      {}
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("has shape namespace, which is not in");
  });
});
