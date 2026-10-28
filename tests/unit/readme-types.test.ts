import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkReadmeTypes,
  composeModules,
  elidePlaceholderArguments,
  extractTypeScriptBlocks,
  readmeTypeDocuments,
  readProviderSourcePaths,
} from "../../scripts/lib/readme-types.mjs";
import {
  DOC_GEN_EXEMPT,
  REPO_ROOT,
} from "../../scripts/lib/provider-inventory.mjs";

/**
 * `pnpm run check:readme-types` turns README blocks into modules and
 * type-checks them against provider source (`ac-1d2qnp`). This file holds
 * the composition rules on synthetic Markdown, and the end-to-end cases
 * compile synthetic READMEs against the real youtube factory: its options
 * schema has `accessToken` and no `apiKey`, the Quick Start regression
 * `ac-qcm9g1` fixed by hand.
 */

const fence = (code: string, language = "typescript"): string =>
  ["```" + language, code, "```"].join("\n");

const QUICK_START = [
  'import { createYouTube } from "@apicity/youtube";',
  "",
  "const youtube = createYouTube({ accessToken: process.env.TOKEN! });",
].join("\n");

const readme = (...sections: Array<[string, ...string[]]>): string =>
  ["# @apicity/example", "", "## Quick Start", "", fence(QUICK_START)]
    .concat(
      sections.flatMap(([heading, ...blocks]) => [
        "",
        `## ${heading}`,
        "",
        ...blocks.flatMap((block) => [fence(block), ""]),
      ])
    )
    .join("\n");

describe("extractTypeScriptBlocks", () => {
  it("reads ts and typescript fences with their section and lines", () => {
    const markdown = [
      "# Title", // 1
      "", // 2
      "## Install", // 3
      "```bash", // 4
      "pnpm add x", // 5
      "```", // 6
      "## Use", // 7
      "```ts", // 8
      "const a = 1;", // 9
      "```", // 10
      "```javascript", // 11
      "const b = 2;", // 12
      "```", // 13
      "~~~TypeScript title=example", // 14
      "const c = 3;", // 15
      "~~~", // 16
    ].join("\n");
    expect(extractTypeScriptBlocks(markdown)).toEqual([
      {
        language: "ts",
        section: "Use",
        sectionIndex: 2,
        fenceLine: 8,
        startLine: 9,
        lines: ["const a = 1;"],
      },
      {
        language: "typescript",
        section: "Use",
        sectionIndex: 2,
        fenceLine: 14,
        startLine: 15,
        lines: ["const c = 3;"],
      },
    ]);
  });

  it("closes a fence only on a run at least as long as its opening", () => {
    const markdown = [
      "````typescript",
      "const md = `",
      "```ts",
      "## not a heading",
      "```",
      "`;",
      "````",
    ].join("\n");
    const blocks = extractTypeScriptBlocks(markdown);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].section).toBeNull();
    expect(blocks[0].lines).toHaveLength(5);
  });

  it("strips the fence's indentation from its lines", () => {
    const markdown = ["1. Step", "", "   ```ts", "   const a = 1;", "   ```"];
    expect(extractTypeScriptBlocks(markdown.join("\n"))[0].lines).toEqual([
      "const a = 1;",
    ]);
  });
});

describe("elidePlaceholderArguments", () => {
  it("checks only the callee of a call with an elided argument", () => {
    const { lines, elided } = elidePlaceholderArguments([
      'const res = await x.v1.items("id", { /* ... */ });',
      "const kept = await x.v1.items({ id: 1 });",
    ]);
    const inserted =
      "...(undefined as unknown as Parameters<typeof x.v1.items>)";
    expect(lines).toEqual([
      `const res = await x.v1.items(${inserted});`,
      "const kept = await x.v1.items({ id: 1 });",
    ]);
    const start = lines[0].indexOf(inserted);
    expect(elided).toEqual([{ line: 0, start, end: start + inserted.length }]);
  });

  it("keeps the line count of a call that spans lines", () => {
    const { lines } = elidePlaceholderArguments([
      "await x.v1.items(",
      '  "id",',
      "  { /* ... */ }",
      ");",
      "next();",
    ]);
    expect(lines).toHaveLength(5);
    expect(lines[4]).toBe("next();");
  });
});

describe("composeModules", () => {
  const moduleTexts = (markdown: string): string[] =>
    composeModules("README.md", markdown).modules.map((m) => m.text);

  it("puts the Quick Start before a block that does not import", () => {
    const [quick, api] = moduleTexts(
      readme(["API Reference", "const res = await youtube.videos.list();"])
    );
    expect(quick).toBe(`${QUICK_START}\nexport {};`);
    expect(api).toBe(
      `${QUICK_START}\n{\nconst res = await youtube.videos.list();\n}\nexport {};`
    );
  });

  it("keeps every API Reference block on its own", () => {
    const texts = moduleTexts(
      readme(["API Reference", "const a = 1;", "const b = a;"])
    );
    expect(texts).toHaveLength(3);
    expect(texts[2]).not.toContain("const a = 1;");
  });

  it("runs the blocks of one section in order, each nested in the last", () => {
    const texts = moduleTexts(
      readme(
        ["Flow", "const id = 1;", "const next = id + 1;", "const id = 2;"],
        ["Other", "const other = 3;"]
      )
    );
    expect(texts).toHaveLength(3);
    expect(texts[1]).toBe(
      [
        QUICK_START,
        "{",
        "const id = 1;",
        "{",
        "const next = id + 1;",
        "{",
        "const id = 2;",
        "}",
        "}",
        "}",
        "export {};",
      ].join("\n")
    );
    expect(texts[2]).not.toContain("const id = 1;");
  });

  it("starts a new module, without the Quick Start, at a block that imports", () => {
    const own = 'import { createYouTube } from "@apicity/youtube";';
    const texts = moduleTexts(readme(["Example", own, "const next = 1;"]));
    expect(texts[1]).toBe(`${own}\n{\nconst next = 1;\n}\nexport {};`);
  });

  it("hoists a nested block's declare statements to the top level", () => {
    const [, flow] = composeModules(
      "README.md",
      readme(["Flow", "declare const url: string;\nconst a = url;"])
    ).modules;
    expect(flow.text.startsWith("declare const url: string;\n")).toBe(true);
    expect(flow.text).toContain("{\n\nconst a = url;\n}");
    const declareLine = flow.text.split("\n").indexOf("const a = url;") - 1;
    expect(flow.origins[0]).toBe(flow.origins[declareLine]);
  });

  it("maps every module line back to its README line", () => {
    const markdown = readme(["Flow", "const a = 1;"]);
    const lines = markdown.split("\n");
    const [, flow] = composeModules("README.md", markdown).modules;
    const at = flow.text.split("\n").indexOf("const a = 1;");
    expect(lines[flow.origins[at] - 1]).toBe("const a = 1;");
  });
});

describe("documents and module paths", () => {
  it("covers every generated README and docs/middleware.md", () => {
    const documents = readmeTypeDocuments();
    expect(documents).toContain("packages/provider/youtube/README.md");
    expect(documents).toContain("docs/middleware.md");
    for (const exempt of Object.keys(DOC_GEN_EXEMPT)) {
      expect(documents).not.toContain(`packages/provider/${exempt}/README.md`);
    }
    for (const document of documents) {
      expect(fs.existsSync(path.join(REPO_ROOT, document)), document).toBe(
        true
      );
    }
  });

  it("resolves each exported subpath to provider source", () => {
    const paths = readProviderSourcePaths();
    expect(paths["@apicity/youtube"]).toEqual([
      "packages/provider/youtube/src/index.ts",
    ]);
    expect(paths["@apicity/xai/realtime"]).toEqual([
      "packages/provider/xai/src/realtime.ts",
    ]);
    for (const [specifier, [source]] of Object.entries(paths)) {
      expect(fs.existsSync(path.join(REPO_ROOT, source)), specifier).toBe(true);
    }
  });
});

describe("checkReadmeTypes", () => {
  it("reports each failing sample once, against its README line", () => {
    const documents = [
      {
        path: "ok.md",
        text: readme(
          [
            "API Reference",
            "const res = await youtube.channels.list({ /* ... */ });",
          ],
          ["Flow", "const id = 1;", "console.log(id);"]
        ),
      },
      {
        path: "option.md",
        text: readme().replace(
          "accessToken: process.env.TOKEN!",
          "apiKey: process.env.KEY!"
        ),
      },
      {
        path: "path.md",
        text: readme([
          "API Reference",
          "const res = await youtube.v3.channels.list({ /* ... */ });",
        ]),
      },
      {
        path: "scope.md",
        text: readme(
          ["API Reference", "const a = 1;", "console.log(a);"],
          ["Other", "console.log(a);"]
        ),
      },
    ];
    const { blocks, problems } = checkReadmeTypes({ documents });
    expect(blocks).toBe(11);
    const found = problems.map(
      (p) => `${p.document}:${p.line} TS${p.code} ${p.source.trim()}`
    );
    expect(found).toEqual([
      "option.md:8 TS2353 const youtube = createYouTube({ apiKey: process.env.KEY! });",
      "path.md:14 TS2339 const res = await youtube.v3.channels.list({ /* ... */ });",
      "scope.md:18 TS2304 console.log(a);",
      "scope.md:25 TS2304 console.log(a);",
    ]);
  }, 60_000);
});
