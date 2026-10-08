/**
 * Pins the `ENDPOINT_NOTES` check in `scripts/doc-gen.mjs` (ac-shq7sd).
 *
 * `ENDPOINT_NOTES` attaches a README note to one rendered endpoint block, keyed
 * `provider<TAB>label<TAB>method`. A key that matched no block used to drop its
 * note silently: the ac-tf4365 simplicity lane renamed one of the five native
 * gemini keys, and the kie README came out with four notes while
 * `pnpm run doc-gen:check` still exited 0. `assertEndpointNotesMatch` now
 * throws, naming the key and its provider, and doc-gen's `main` turns that
 * into exit 1 before it renders anything, in both modes.
 *
 * The exit-code cases run `main` in a child process with a key planted in the
 * same `ENDPOINT_NOTES` map the CLI reads, so the source file stays untouched.
 * Each run walks every provider (~7 s): the check covers every key whichever
 * README a run renders.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import {
  assertEndpointNotesMatch,
  collectEndpointsByProvider,
  ENDPOINT_NOTES,
} from "../../scripts/doc-gen.mjs";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";

// A sixth native gemini leaf that the kie factory does not mount: the shape
// of the ac-tf4365 rename.
const UNMOUNTED_LEAF_KEY =
  "kie\tgemini.post.v1.models.gemini39Flash.streamGenerateContent\tPOST";
// A real label under a method its block does not render (it renders GET).
const WRONG_METHOD_KEY = "polymarket\tclob.markets\tPOST";
// A provider name no README renders.
const UNKNOWN_PROVIDER_KEY = "kei\tgemini.post.v1.models.gemini38Flash\tPOST";

const DOC_GEN_URL = pathToFileURL(
  path.join(repoRoot, "scripts", "doc-gen.mjs")
).href;

/** The line the error prints for one unmatched key. */
function unmatchedLine(provider: string, key: string): string {
  return `provider ${provider}: ${JSON.stringify(key)}`;
}

function thrownMessage(action: () => void): string {
  try {
    action();
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error("expected the check to throw");
}

/** doc-gen's `main(argv)`, run with `key` planted in `ENDPOINT_NOTES`. */
function runDocGenWithPlantedKey(key: string, argv: string[]) {
  const script = [
    `const docGen = await import(${JSON.stringify(DOC_GEN_URL)});`,
    `docGen.ENDPOINT_NOTES.set(${JSON.stringify(key)}, "planted note");`,
    `await docGen.main(${JSON.stringify(argv)});`,
  ].join("\n");
  return spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", script],
    { cwd: repoRoot, encoding: "utf8", timeout: 110_000 }
  );
}

describe("doc-gen ENDPOINT_NOTES keys", () => {
  let endpointsByProvider: Map<string, object[]>;

  beforeAll(async () => {
    endpointsByProvider = await collectEndpointsByProvider();
  }, 120_000);

  it("matches a rendered block for every key in the current map", () => {
    expect(ENDPOINT_NOTES.size).toBeGreaterThan(0);
    expect(() => assertEndpointNotesMatch(endpointsByProvider)).not.toThrow();
  });

  it("throws on a key that matches no endpoint, naming it and its provider", () => {
    const notes = new Map([
      ...ENDPOINT_NOTES,
      [UNMOUNTED_LEAF_KEY, "planted note"],
    ]);

    const message = thrownMessage(() =>
      assertEndpointNotesMatch(endpointsByProvider, notes)
    );

    expect(message).toMatch(
      /^1 ENDPOINT_NOTES key matches no generated endpoint/
    );
    expect(message).toContain(unmatchedLine("kie", UNMOUNTED_LEAF_KEY));
    // Only the planted key: every real key still matches.
    expect(message.match(/^ {2}provider /gm)).toHaveLength(1);
  });

  it("names every unmatched key, the method and provider included", () => {
    const notes = new Map([
      [UNMOUNTED_LEAF_KEY, "planted note"],
      [WRONG_METHOD_KEY, "planted note"],
      [UNKNOWN_PROVIDER_KEY, "planted note"],
    ]);

    const message = thrownMessage(() =>
      assertEndpointNotesMatch(endpointsByProvider, notes)
    );

    expect(message).toMatch(
      /^3 ENDPOINT_NOTES keys match no generated endpoint/
    );
    expect(message).toContain(unmatchedLine("kie", UNMOUNTED_LEAF_KEY));
    expect(message).toContain(unmatchedLine("polymarket", WRONG_METHOD_KEY));
    expect(message).toContain(unmatchedLine("kei", UNKNOWN_PROVIDER_KEY));
  });

  it("keys a block on the method its README prints, filled in from the TSV", () => {
    // openligadb declares its leaves without a verb segment, so the walker
    // reports no method; the block prints its endpoint-docs.tsv row's GET.
    const printedKey = "openligadb\tgetavailablesports\tGET";
    const walkerOnlyKey = "openligadb\tgetavailablesports\t";

    expect(() =>
      assertEndpointNotesMatch(
        endpointsByProvider,
        new Map([[printedKey, "planted note"]])
      )
    ).not.toThrow();
    expect(() =>
      assertEndpointNotesMatch(
        endpointsByProvider,
        new Map([[walkerOnlyKey, "planted note"]])
      )
    ).toThrow(unmatchedLine("openligadb", walkerOnlyKey));
  });
});

describe("doc-gen exit status with an unmatched ENDPOINT_NOTES key", () => {
  // Single-provider runs, as `doc-gen:<provider>` makes them. Every key is
  // checked against its own provider's endpoints, so a fal-only run fails on
  // the planted kie key, and "1 key" proves that it reports no valid kie or
  // polymarket key that a check scoped to the rendered README would.
  const ONE_UNMATCHED = "1 ENDPOINT_NOTES key matches no generated endpoint";

  it("exits 1 in check mode, naming the key, before checking any README", () => {
    const result = runDocGenWithPlantedKey(UNMOUNTED_LEAF_KEY, [
      "fal",
      "--check",
    ]);

    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(1);
    expect(result.stderr).toContain(ONE_UNMATCHED);
    expect(result.stderr).toContain(unmatchedLine("kie", UNMOUNTED_LEAF_KEY));
    expect(result.stdout).not.toContain("up to date");
  }, 120_000);

  it("exits 1 in write mode, naming the key, before writing any README", () => {
    const result = runDocGenWithPlantedKey(UNMOUNTED_LEAF_KEY, ["kie"]);

    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(1);
    expect(result.stderr).toContain(ONE_UNMATCHED);
    expect(result.stderr).toContain(unmatchedLine("kie", UNMOUNTED_LEAF_KEY));
    expect(result.stdout).not.toContain("Generated");
  }, 120_000);
});
