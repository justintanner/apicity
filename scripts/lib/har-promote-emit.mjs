import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import prettier from "prettier";
import {
  repo,
  refuse,
  plain,
  keyOf,
  PAID_OTP_HELPERS,
} from "./har-promote-plan.mjs";

export async function format(text, parser) {
  return prettier.format(text, {
    ...(await prettier.resolveConfig(path.join(repo, "package.json"))),
    parser,
  });
}
export function selectTemplate(testFile) {
  let recent = [];
  try {
    recent = execFileSync(
      "git",
      [
        "log",
        "--name-only",
        "--pretty=format:",
        "-n",
        "400",
        "--",
        "tests/integration/fal-*.test.ts",
        "tests/integration/kie-*.test.ts",
      ],
      { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    ).split("\n");
  } catch {
    /* Shallow/archive checkout: deterministic filename fallback. */
  }
  const fallback = readdirSync(path.join(repo, "tests/integration"))
    .filter((n) => /^(fal|kie)-.*\.test\.ts$/.test(n))
    .sort()
    .map((n) => `tests/integration/${n}`);
  const anchors = [
    /^import \{[^}]*\} from "vitest";$/gm,
    /^import \{[^}]*\bsetupPolly\b[^}]*\} from "(\.\.?\/[^"]*harness)";$/gm,
    /^ {2}let ctx: PollyContext;$/gm,
    /^ {2}beforeEach\(\(\) => \{\n {4}ctx = setupPolly\("[^"]+"\);\n {2}\}\);$/gm,
    /^ {2}afterEach\(async \(\) => \{\n {4}await teardownPolly\(ctx\);\n {2}\}\);$/gm,
    /^ +const provider = create\w+\(\{$/gm,
  ];
  for (const file of new Set([...recent, ...fallback])) {
    if (!/^tests\/integration\/(fal|kie)-.*\.test\.ts$/.test(file)) continue;
    let text;
    try {
      text = readFileSync(path.join(repo, file), "utf8");
    } catch {
      continue;
    }
    const matches = anchors.map((re) => [...text.matchAll(re)]);
    if (matches.some((m) => m.length !== 1)) continue;
    if (
      path.resolve(repo, path.dirname(file), matches[1][0][1] + ".ts") !==
      path.join(repo, "tests/harness.ts")
    )
      continue;
    let harness = path.relative(
      path.dirname(testFile),
      path.join(repo, "tests/harness")
    );
    if (!harness.startsWith(".")) harness = `./${harness}`;
    return {
      lifecycle: matches
        .slice(2, 5)
        .map((m) => m[0][0])
        .join("\n"),
      harness,
    };
  }
  refuse("template", "no compatible fal/kie test template");
}
function assertions(result, name) {
  if (plain(result)) {
    const subset = {};
    for (const key of ["code", "status", "state", "success", "ok"]) {
      if (
        Object.hasOwn(result, key) &&
        (result[key] === null ||
          ["string", "boolean", "number"].includes(typeof result[key]))
      )
        subset[key] = result[key];
      if (
        plain(result.data) &&
        Object.hasOwn(result.data, key) &&
        (result.data[key] === null ||
          ["string", "boolean", "number"].includes(typeof result.data[key]))
      )
        (subset.data ??= {})[key] = result.data[key];
    }
    return (
      `expect(Object.keys(${name} as object).sort()).toEqual(${JSON.stringify(Object.keys(result).sort())});\n` +
      (Object.keys(subset).length
        ? `expect(${name}).toMatchObject(${JSON.stringify(subset)});`
        : "")
    );
  }
  if (Array.isArray(result))
    return `expect(Array.isArray(${name})).toBe(true); expect(${name}).toHaveLength(${result.length});`;
  if (typeof result === "string")
    return `expect(typeof ${name}).toBe("string");`;
  return result === undefined
    ? `expect(${name}).toBeUndefined();`
    : `expect(${name}).toBe(${JSON.stringify(result)});`;
}
export async function emitTest(context, plan, options, template) {
  const imports = new Set(["setupPolly", "teardownPolly", "type PollyContext"]);
  const paid = plan.some((c) => c.paid);
  if (paid) imports.add("TEST_PAYGATE_SECRET");
  const declarations = [];
  const calls = [];
  for (let i = 0; i < plan.length; i++) {
    const c = plan[i];
    const args = c.positional.map((p) => JSON.stringify(p));
    const requestName = `CALL_${i + 1}_REQUEST`;
    if (
      c.request !== undefined &&
      (c.paid || !plain(c.request) || Object.keys(c.request).length)
    ) {
      declarations.push(`const ${requestName} = ${JSON.stringify(c.request)};`);
      args.push(`${requestName} as never`);
    }
    if (c.paid) {
      const { helper, withPath } = PAID_OTP_HELPERS[keyOf(c.row)];
      imports.add(helper);
      args.push(
        `${helper}(${withPath ? JSON.stringify(c.row.dotPath) + ", " : ""}${requestName} as never)`
      );
    }
    const name = `result${i + 1}`;
    const signature = JSON.stringify([
      c.accessor,
      c.positional,
      c.request,
      assertions(c.result, "result"),
    ]);
    calls.push({
      signature,
      text: `const ${name} = await provider${c.accessor}(${args.join(", ")});\n${assertions(c.result, name)}`,
    });
  }
  const folded = [];
  for (let i = 0; i < calls.length; ) {
    let end = i + 1;
    while (end < calls.length && calls[end].signature === calls[i].signature)
      end++;
    // Reuse the first constant when folding identical calls.
    folded.push(
      end - i === 1
        ? calls[i].text
        : `for (let repeat = 0; repeat < ${end - i}; repeat++) { ${calls[i].text} }`
    );
    for (let n = i + 1; n < end; n++) {
      const index = declarations.findIndex((s) =>
        s.startsWith(`const CALL_${n + 1}_REQUEST =`)
      );
      if (index >= 0) declarations.splice(index, 1);
    }
    i = end;
  }
  const harnessText = readFileSync(path.join(repo, "tests/harness.ts"), "utf8");
  for (const item of imports) {
    const name = item.replace(/^type /, "");
    if (
      !new RegExp(
        `export (?:async )?(?:function|const|interface|type) ${name}\\b`
      ).test(harnessText)
    )
      refuse("template", `harness lacks ${name}`);
  }
  const factoryOptions = [];
  if (context.envVar)
    factoryOptions.push(
      `${context.spec.optionKey}: process.env.${context.envVar} ?? "test-key"`
    );
  if (paid) factoryOptions.push("paygate: { secret: TEST_PAYGATE_SECRET }");
  const safeComment = (s) =>
    String(s ?? "unknown").replace(/[\r\n\u2028\u2029]/g, " ");
  const source = `// Generated by \`pnpm run har:promote\` from ${safeComment(path.basename(options.capture))} (${context.provider} ${plan[0].row.method} ${safeComment(context.meta.endpoint)}, callId ${safeComment(context.meta.callId)}, apicity ${safeComment(context.meta.apicityVersion)}).
// Replay-only fixture: ${context.expanded.length} recorded exchanges in ${plan.length} calls; request objects are the captured input (${[...new Set(plan.map((c) => c.source))].join(", ")}) and wire bodies, passed verbatim.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ${context.spec.factoryName} } from "@apicity/${context.provider}";
import { ${[...imports].sort().join(", ")} } from ${JSON.stringify(template.harness)};
${declarations.join("\n")}
describe(${JSON.stringify(`${context.provider} ${context.meta.endpoint} (promoted capture)`)}, () => {
${template.lifecycle.replace(/setupPolly\("[^"]+"\)/, `setupPolly(${JSON.stringify(options.name)})`)}
it("replays ${context.expanded.length} captured exchanges", async () => {
let replayed = 0;
ctx.polly.server.any().on("beforeReplay", () => { replayed++; });
const provider = ${context.spec.factoryName}({ ${factoryOptions.join(", ")} });
${folded.join("\n")}
if (ctx.mode === "replay") expect(replayed).toBe(${context.expanded.length});
});
});`;
  return format(source, "typescript");
}
export function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (plain(value))
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys(value[key])])
    );
  return value;
}
