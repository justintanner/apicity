import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

function formatDiagnostics(diagnostics: readonly ts.Diagnostic[]): string {
  return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => repoRoot,
    getNewLine: () => "\n",
  });
}

describe("fal schema-derived request input types", () => {
  it("accepts request inputs and types queue.submit by endpoint id", () => {
    const fixture = path.join(
      repoRoot,
      "tests/fixtures/fal-request-input-types.ts"
    );
    const options: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
      baseUrl: repoRoot,
      paths: {
        "@apicity/fal": ["packages/provider/fal/src/index.ts"],
        "@apicity/fal/zod": ["packages/provider/fal/src/zod.ts"],
      },
    };

    const program = ts.createProgram([fixture], options);
    const diagnostics = ts.getPreEmitDiagnostics(program);

    expect(formatDiagnostics(diagnostics)).toBe("");
  }, 120000);
});
