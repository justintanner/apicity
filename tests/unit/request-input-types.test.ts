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

describe("schema-derived request input types", () => {
  it("accepts public request inputs while preserving parsed request aliases", () => {
    const fixture = path.join(
      repoRoot,
      "tests/fixtures/request-input-types.ts"
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
        "@apicity/kie": ["packages/provider/kie/src/index.ts"],
        "@apicity/openai": ["packages/provider/openai/src/index.ts"],
      },
    };

    const program = ts.createProgram([fixture], options);
    const diagnostics = ts.getPreEmitDiagnostics(program);

    expect(formatDiagnostics(diagnostics)).toBe("");
  }, 120000);
});
