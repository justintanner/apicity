import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import {
  DOC_GEN_EXEMPT,
  REPO_ROOT,
  readProviderNames,
} from "./provider-inventory.mjs";

/**
 * Type-check the TypeScript samples in the generated provider READMEs and in
 * the hand-written documents of `EXTRA_DOCUMENTS` against the provider
 * sources.
 *
 * The generated Quick Start auth field was wrong four times in a row (dolthub
 * `ac-j4lc99`, free-media-upload `ac-37sz5l`, meta `ac-dghndy`, youtube
 * `ac-qcm9g1`), and the Middleware samples compiled on 4 of 13 providers until
 * PR 511. The runtime path tests in `tests/unit/doc-gen-labels.test.ts` see a
 * missing path, not an overloaded leaf, a pay-gated leaf whose second argument
 * is a `PayGateApproval`, or an options schema with no `apiKey`, so each of
 * those reached `main` and was found by hand (`ac-1d2qnp`). The first run of
 * this check found 23 more errors in eight READMEs, among them sample
 * variables that the `ig` → `meta` and `free` → `free-media-upload` package
 * rename (`02d3e5b0`) left behind.
 *
 * A sample is read the way someone pasting it would run it:
 *
 *   - Every `ts` / `typescript` fence is checked unless its info string also
 *     carries the word `nocheck`, as in `ts nocheck`. Renderers highlight by
 *     the first word, so a signature or a sketch that is not meant to compile
 *     keeps its highlighting. A block that makes a real call stays checked:
 *     declare the values it assumes (`declare const otp: string;`) instead.
 *   - A block with a top-level `import` or `export` is a module of its own.
 *   - Any other block follows the README's Quick Start, so it can use the
 *     client the Quick Start creates.
 *   - Blocks in one `##` section run in order: each one sees what the blocks
 *     before it declared and may declare the same name again. In
 *     `## API Reference` every block stands alone.
 *   - A call with a `{ /* ... *\/ }` argument has elided arguments. Its callee
 *     must exist and be callable; its arguments are not checked.
 *
 * Reading and checking are kept apart, following
 * `scripts/lib/provider-inventory.mjs`: `read*` touch the filesystem, and
 * `extractTypeScriptBlocks` / `composeModules` are pure string-in, data-out,
 * which is what lets the unit test drive the composition rules directly.
 * `checkReadmeTypes` builds one `ts.Program` over the composed modules and
 * asks only for their diagnostics, so the provider sources are checked as far
 * as the samples need them and no further.
 */

/**
 * Hand-written documents checked alongside the generated READMEs: every
 * tracked Markdown file whose TypeScript blocks are samples (`ac-pxgn47`).
 */
const EXTRA_DOCUMENTS = Object.freeze([
  "README.md",
  "docs/har-capture.md",
  "docs/middleware.md",
  "docs/paygate.md",
  "packages/cli/README.md",
  "packages/provider/cost/README.md",
  "packages/provider/har/README.md",
  "packages/provider/s3/HARDENING.md",
]);

/**
 * Tracked Markdown files with TypeScript blocks that the gate does not read,
 * and why. `tests/unit/readme-types.test.ts` fails on a tracked Markdown file
 * with a checked block that is in neither list.
 */
export const UNCHECKED_DOCUMENTS = Object.freeze({
  ".claude/CLAUDE.md":
    "agent instructions; the block is an object-property fragment that shows the endpoint comment convention",
  "docs/google-flow-character-metadata-findings.md":
    "a findings record; the blocks quote provider source at the cited lines",
});

/** The README section whose blocks stand alone. */
const API_REFERENCE_SECTION = "API Reference";

/** The README section whose block every other block follows. */
const QUICK_START_SECTION = "Quick Start";

const TYPESCRIPT_LANGUAGES = new Set(["ts", "typescript"]);
const NOCHECK = "nocheck";
const PLACEHOLDER = /^\{\s*\/\*\s*\.\.\.\s*\*\/\s*\}$/;
const MODULE_DIR = ".readme-types";

/**
 * The documents the gate reads, repository-relative: every provider README
 * `doc-gen` generates, then `EXTRA_DOCUMENTS`.
 *
 * @param {string} [repoRoot]
 * @returns {string[]}
 */
export function readmeTypeDocuments(repoRoot = REPO_ROOT) {
  return [
    ...readProviderNames(repoRoot)
      .filter((name) => !(name in DOC_GEN_EXEMPT))
      .map((name) => `packages/provider/${name}/README.md`),
    ...EXTRA_DOCUMENTS,
  ];
}

/**
 * Module specifiers a sample can import, mapped to package source: one entry
 * per `exports` subpath of every provider `package.json` and of
 * `packages/cli`, so a sample that imports a subpath the package does not
 * export fails to resolve.
 *
 * @param {string} [repoRoot]
 * @returns {Record<string, string[]>}
 */
export function readProviderSourcePaths(repoRoot = REPO_ROOT) {
  const paths = {};
  const dirs = [
    ...readProviderNames(repoRoot).map((name) => `packages/provider/${name}`),
    "packages/cli",
  ];
  for (const dir of dirs) {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(repoRoot, dir, "package.json"), "utf8")
    );
    for (const [key, target] of Object.entries(manifest.exports ?? {})) {
      const built = typeof target === "string" ? target : target.import;
      if (typeof built !== "string") continue;
      const source = built
        .replace(/^\.\/dist\//, "./")
        .replace(/\.js$/, ".ts")
        .replace(/^\.\//, `${dir}/`);
      const specifier =
        key === "." ? manifest.name : `${manifest.name}${key.slice(1)}`;
      paths[specifier] = [source];
    }
  }
  return paths;
}

/**
 * The `ts` / `typescript` fenced blocks of one Markdown document, in order,
 * leaving out a fence whose info string carries `nocheck`.
 *
 * Fences follow CommonMark: three or more backticks or tildes, indented by at
 * most three spaces, closed by a run of the same character at least as long.
 * `section` is the `##` heading above the block, or `null` before the first.
 *
 * @param {string} markdown
 * @returns {Array<{ language: string, section: string | null,
 *   sectionIndex: number, fenceLine: number, startLine: number,
 *   lines: string[] }>} `fenceLine` and `startLine` are 1-based: the opening
 *   fence and the first line of code.
 */
export function extractTypeScriptBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split("\n");
  let section = null;
  let sectionIndex = 0;
  let open = null;
  for (const [index, line] of lines.entries()) {
    if (open) {
      const close = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(line);
      if (
        close &&
        close[1][0] === open.marker[0] &&
        close[1].length >= open.marker.length
      ) {
        if (TYPESCRIPT_LANGUAGES.has(open.language) && !open.nocheck) {
          blocks.push({
            language: open.language,
            section,
            sectionIndex,
            fenceLine: open.fenceLine,
            startLine: open.fenceLine + 1,
            lines: open.lines,
          });
        }
        open = null;
      } else {
        open.lines.push(line.replace(new RegExp(`^ {0,${open.indent}}`), ""));
      }
      continue;
    }
    const fence = /^( {0,3})(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence && !(fence[2][0] === "`" && fence[3].includes("`"))) {
      const [language, ...words] = fence[3].trim().split(/\s+/);
      open = {
        indent: fence[1].length,
        marker: fence[2],
        language: language.toLowerCase(),
        nocheck: words.includes(NOCHECK),
        fenceLine: index + 1,
        lines: [],
      };
      continue;
    }
    const heading = /^## +(.+?)(?: +#+)? *$/.exec(line);
    if (heading) {
      section = heading[1];
      sectionIndex += 1;
    }
  }
  return blocks;
}

function parseBlock(code) {
  return ts.createSourceFile(
    "block.ts",
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
}

function hasModifier(statement, kind) {
  return (
    ts.canHaveModifiers(statement) &&
    (ts.getModifiers(statement) ?? []).some((m) => m.kind === kind)
  );
}

/**
 * Whether a block is a module of its own: it has a top-level `import` or
 * `export`, which a nested block cannot hold.
 *
 * @param {string[]} lines
 * @returns {boolean}
 */
function isModuleBlock(lines) {
  return parseBlock(lines.join("\n")).statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) ||
      ts.isImportEqualsDeclaration(statement) ||
      ts.isExportDeclaration(statement) ||
      ts.isExportAssignment(statement) ||
      hasModifier(statement, ts.SyntaxKind.ExportKeyword)
  );
}

/**
 * Rewrite every call with a `{ /* ... *\/ }` argument so that only its callee
 * is checked: `f(a, { /* ... *\/ })` becomes
 * `f(...(undefined as unknown as Parameters<typeof f>))`. The callee must
 * then exist and be callable; the elided arguments are not checked. A callee
 * that `typeof` cannot name is left alone. Line breaks inside the argument
 * list are kept, so every line keeps its number.
 *
 * `elided` lists where the inserted text sits. A missing or non-callable
 * callee fails once at the call, and again inside `typeof`, so diagnostics
 * there are dropped.
 *
 * @param {string[]} lines
 * @returns {{ lines: string[], elided: Array<{ line: number, start: number,
 *   end: number }> }} `line` is a 0-based index into `lines`; `start` and
 *   `end` are 0-based columns.
 */
export function elidePlaceholderArguments(lines) {
  const code = lines.join("\n");
  const source = parseBlock(code);
  const edits = [];
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isEntityNameExpression(node.expression) &&
      node.arguments.some((arg) => PLACEHOLDER.test(arg.getText(source)))
    ) {
      const { pos, end } = node.arguments;
      const callee = node.expression.getText(source);
      edits.push({
        pos,
        end,
        text: `...(undefined as unknown as Parameters<typeof ${callee}>)`,
        breaks: code.slice(pos, end).split("\n").length - 1,
      });
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  let out = "";
  let from = 0;
  const elided = [];
  for (const edit of edits) {
    out += code.slice(from, edit.pos);
    const before = out.split("\n");
    const start = before[before.length - 1].length;
    elided.push({
      line: before.length - 1,
      start,
      end: start + edit.text.length,
    });
    out += edit.text + "\n".repeat(edit.breaks);
    from = edit.end;
  }
  out += code.slice(from);
  return { lines: out.split("\n"), elided };
}

/**
 * Split a nested block's ambient `declare` statements out of it. A nested
 * block cannot hold them, and the hoisted copies keep their README lines.
 *
 * @param {string[]} lines
 * @returns {{ body: string[], hoisted: number[] }} `body` has each hoisted
 *   line blanked; `hoisted` lists their 0-based indexes.
 */
function splitAmbientDeclarations(lines) {
  const source = parseBlock(lines.join("\n"));
  const hoisted = [];
  for (const statement of source.statements) {
    if (!hasModifier(statement, ts.SyntaxKind.DeclareKeyword)) continue;
    const first = source.getLineAndCharacterOfPosition(
      statement.getStart(source)
    ).line;
    const last = source.getLineAndCharacterOfPosition(statement.end).line;
    for (let line = first; line <= last; line++) hoisted.push(line);
  }
  const body = lines.map((line, index) =>
    hoisted.includes(index) ? "" : line
  );
  return { body, hoisted };
}

/**
 * Group one document's blocks into the programs they run as, following the
 * rules in this module's header.
 *
 * @param {ReturnType<typeof extractTypeScriptBlocks>} blocks
 * @returns {Array<{ prelude: boolean, blocks: typeof blocks }>}
 */
function chainBlocks(blocks) {
  const chains = [];
  let current = null;
  let sectionIndex = -1;
  for (const block of blocks) {
    const module = isModuleBlock(block.lines);
    const standalone = block.section === API_REFERENCE_SECTION;
    if (
      module ||
      standalone ||
      current === null ||
      block.sectionIndex !== sectionIndex
    ) {
      current = { prelude: !module, blocks: [] };
      chains.push(current);
    }
    current.blocks.push(block);
    sectionIndex = block.sectionIndex;
  }
  return chains;
}

/**
 * The TypeScript modules one document's samples compile as.
 *
 * Each module carries, for every line of `text`, the 1-based README line it
 * came from (`origins`) and the column ranges `elidePlaceholderArguments`
 * inserted on it (`elided`). Lines the composition adds (braces, the closing
 * `export {}`) point at the fence of the block they open or close.
 *
 * @param {string} document repository-relative path
 * @param {string} markdown
 * @returns {{ blocks: number, modules: Array<{ document: string,
 *   text: string, origins: number[], elided: Array<Array<[number, number]>>
 *   }> }}
 */
export function composeModules(document, markdown) {
  const blocks = extractTypeScriptBlocks(markdown);
  const quickStart = blocks.find(
    (block) => block.section === QUICK_START_SECTION
  );
  const modules = [];
  for (const chain of chainBlocks(blocks)) {
    const top = [];
    const ambient = [];
    const nested = [];
    let depth = 0;
    const lead = chain.blocks[0];
    const prelude =
      chain.prelude && quickStart && lead !== quickStart ? quickStart : null;
    if (prelude) {
      prelude.lines.forEach((text, i) =>
        top.push({ text, origin: prelude.startLine + i })
      );
    }
    for (const [index, block] of chain.blocks.entries()) {
      const { lines, elided } = elidePlaceholderArguments(block.lines);
      const entry = (text, i) => ({
        text,
        origin: block.startLine + i,
        elided: elided
          .filter((range) => range.line === i)
          .map((range) => [range.start, range.end]),
      });
      if (index === 0 && !chain.prelude) {
        lines.forEach((text, i) => top.push(entry(text, i)));
        continue;
      }
      const { body, hoisted } = splitAmbientDeclarations(lines);
      for (const i of hoisted) ambient.push(entry(lines[i], i));
      nested.push({ text: "{", origin: block.fenceLine });
      body.forEach((text, i) => nested.push(entry(text, i)));
      depth += 1;
    }
    const last = chain.blocks[chain.blocks.length - 1];
    const closing = Array.from({ length: depth }, () => ({
      text: "}",
      origin: last.fenceLine,
    }));
    const all = [
      ...ambient,
      ...top,
      ...nested,
      ...closing,
      { text: "export {};", origin: lead.fenceLine },
    ];
    modules.push({
      document,
      text: all.map((line) => line.text).join("\n"),
      origins: all.map((line) => line.origin),
      elided: all.map((line) => line.elided ?? []),
    });
  }
  return { blocks: blocks.length, modules };
}

/**
 * Compile options for the samples: the tests project's targets and libraries,
 * with `@apicity/*` resolved to provider source.
 *
 * @param {string} repoRoot
 * @returns {import("typescript").CompilerOptions}
 */
function sampleCompilerOptions(repoRoot) {
  return {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
    types: ["node"],
    typeRoots: [path.join(repoRoot, "node_modules", "@types")],
    baseUrl: repoRoot,
    paths: readProviderSourcePaths(repoRoot),
  };
}

/**
 * Type-check the samples of `documents` and report every diagnostic against
 * the README line it came from.
 *
 * @param {{ repoRoot?: string, documents: Array<{ path: string,
 *   text: string }> }} options
 * @returns {{ blocks: number, modules: number, problems: Array<{
 *   document: string, line: number, column: number, code: number,
 *   message: string, source: string }> }}
 */
export function checkReadmeTypes({ repoRoot = REPO_ROOT, documents }) {
  const files = new Map();
  let blocks = 0;
  for (const [docIndex, doc] of documents.entries()) {
    const composed = composeModules(doc.path, doc.text);
    const lines = doc.text.split("\n");
    blocks += composed.blocks;
    for (const [index, module] of composed.modules.entries()) {
      const name = path.join(repoRoot, MODULE_DIR, `${docIndex}-${index}.ts`);
      files.set(name, { ...module, lines });
    }
  }
  const options = sampleCompilerOptions(repoRoot);
  const host = ts.createCompilerHost(options);
  const { fileExists, readFile, getSourceFile } = host;
  host.fileExists = (name) => files.has(name) || fileExists.call(host, name);
  host.readFile = (name) =>
    files.has(name) ? files.get(name).text : readFile.call(host, name);
  host.getSourceFile = (name, languageVersion, ...rest) =>
    files.has(name)
      ? ts.createSourceFile(name, files.get(name).text, languageVersion, true)
      : getSourceFile.call(host, name, languageVersion, ...rest);
  const program = ts.createProgram([...files.keys()], options, host);

  const problems = [];
  const seen = new Set();
  const report = (diagnostic, module) => {
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      "\n"
    );
    let line = 0;
    let column = 0;
    let source = "";
    if (module && diagnostic.file && diagnostic.start !== undefined) {
      const at = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start
      );
      const inserted = module.elided[at.line] ?? [];
      if (
        inserted.some(([from, to]) => at.character >= from && at.character < to)
      ) {
        return;
      }
      line = module.origins[at.line] ?? 0;
      column = at.character + 1;
      source = module.lines[line - 1] ?? "";
    }
    const document = module?.document ?? "(compiler)";
    const key = `${document}:${line}:${column}:${diagnostic.code}:${message}`;
    if (seen.has(key)) return;
    seen.add(key);
    problems.push({
      document,
      line,
      column,
      code: diagnostic.code,
      message,
      source,
    });
  };
  for (const diagnostic of [
    ...program.getOptionsDiagnostics(),
    ...program.getGlobalDiagnostics(),
  ]) {
    report(diagnostic, null);
  }
  for (const [name, module] of files) {
    const sourceFile = program.getSourceFile(name);
    for (const diagnostic of [
      ...program.getSyntacticDiagnostics(sourceFile),
      ...program.getSemanticDiagnostics(sourceFile),
    ]) {
      report(diagnostic, module);
    }
  }
  return { blocks, modules: files.size, problems };
}

/**
 * Read every document the gate covers.
 *
 * @param {string} [repoRoot]
 * @returns {Array<{ path: string, text: string }>}
 */
export function readReadmeTypeDocuments(repoRoot = REPO_ROOT) {
  return readmeTypeDocuments(repoRoot).map((document) => ({
    path: document,
    text: fs.readFileSync(path.join(repoRoot, document), "utf8"),
  }));
}

/**
 * One problem as `path:line:column - error TSnnnn: message`, then the README
 * line it points at.
 *
 * @param {ReturnType<typeof checkReadmeTypes>["problems"][number]} problem
 * @returns {string}
 */
export function formatProblem(problem) {
  const where = `${problem.document}:${problem.line}:${problem.column}`;
  const head = `${where} - error TS${problem.code}: ${problem.message}`;
  return problem.source ? `${head}\n    ${problem.source.trim()}` : head;
}
