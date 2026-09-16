import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

import {
  CALL_SHAPES,
  callShapeKey,
  type CallShape,
} from "../../packages/cli/src/call-shapes";
import {
  INJECTED_PLACEHOLDERS,
  OVERRIDES,
  classifyPlaceholders,
  urlPlaceholders,
} from "../../scripts/lib/call-shapes.mjs";

// The generated binding table is what stops the CLI guessing a placeholder's
// binding from the URL — a guess that is wrong for more than half of the rows
// that carry one. These tests pin the rules, then pin the committed file
// against a fresh generation so an endpoint change cannot drift past review.

const execFileAsync = promisify(execFile);

interface TsvRow {
  provider: string;
  dotPath: string;
  method: string;
  fullUrl: string;
}

function tsvRows(): TsvRow[] {
  return readFileSync("scripts/endpoint-docs.tsv", "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const [provider, dotPath, method, fullUrl] = line.split("\t");
      return { provider, dotPath, method, fullUrl };
    });
}

function shapeFor(
  provider: string,
  method: string,
  dotPath: string
): CallShape {
  const shape = CALL_SHAPES[callShapeKey(provider, method, dotPath)];
  expect(shape, `${provider} ${method} ${dotPath}`).toBeDefined();
  return shape;
}

describe("call-shape rules", () => {
  it("treats a factory-substituted credential as injected, never as input", () => {
    const telegram = shapeFor("telegram", "POST", "sendMessage");

    expect(telegram.injected).toEqual(["token"]);
    expect(telegram.positional).toEqual([]);
    expect(telegram.fields).toEqual([]);
  });

  it("splits thesportsdb's URL into the injected key and the request field", () => {
    const lookup = shapeFor("thesportsdb", "GET", "v1.lookupplayer");

    expect(lookup.injected).toEqual(["apiKey"]);
    expect(lookup.fields).toEqual([
      { placeholder: "idPlayer", property: "idPlayer" },
    ]);
    expect(lookup.positional).toEqual([]);
  });

  it("reads s3's {bucket} off the request object", () => {
    const create = shapeFor("s3", "PUT", "buckets.create");

    expect(create.fields).toEqual([
      { placeholder: "bucket", property: "bucket" },
    ]);
    expect(create.positional).toEqual([]);
  });

  it("reads kie's {taskId} as a leading positional argument", () => {
    const record = shapeFor("kie", "GET", "api.v1.generate.recordInfo");

    expect(record.positional).toEqual([
      { placeholder: "taskId", param: "taskId", optional: false },
    ]);
    expect(record.fields).toEqual([]);
  });

  it("records the snake-to-camel alias openai's parameters use", () => {
    const files = shapeFor("openai", "GET", "v1.vectorStores.files");

    expect(files.positional).toEqual([
      {
        placeholder: "vector_store_id",
        param: "vectorStoreId",
        optional: false,
        alias: "vector_store_id",
      },
    ]);
  });

  // `completions(reqOrId, ...)` folds two calling conventions into one
  // `OpenAiChatRequest | string` parameter: a string is the stored-completion
  // id, an object is an ordinary create. The placeholder is therefore a
  // positional the caller may omit entirely.
  it("marks an overloaded string|object parameter as an optional positional", () => {
    const completions = shapeFor("openai", "POST", "v1.chat.completions");

    expect(completions.positional).toEqual([
      { placeholder: "id", param: "reqOrId", optional: true, alias: "id" },
    ]);
  });

  // A-2: openligadb builds every leaf through one local `request()` helper over
  // a request object, so no placeholder of its is ever a positional argument.
  it("classifies every openligadb placeholder as a request field", () => {
    const rows = tsvRows().filter((row) => row.provider === "openligadb");
    const withPlaceholder = rows.filter(
      (row) => urlPlaceholders(row.fullUrl).length > 0
    );

    expect(rows.length).toBeGreaterThan(0);
    expect(withPlaceholder.length).toBeGreaterThan(0);

    for (const row of withPlaceholder) {
      const shape = shapeFor("openligadb", row.method, row.dotPath);
      const placeholders = urlPlaceholders(row.fullUrl);

      expect(shape.positional, row.dotPath).toEqual([]);
      expect(shape.injected, row.dotPath).toEqual([]);
      expect(shape.derived, row.dotPath).toEqual([]);
      expect(
        shape.fields.map((field) => field.placeholder),
        row.dotPath
      ).toEqual(placeholders);
    }
  });

  it("gives every placeholder-carrying row a complete shape", () => {
    const missing: string[] = [];
    const unbound: string[] = [];

    for (const row of tsvRows()) {
      const placeholders = urlPlaceholders(row.fullUrl);
      if (placeholders.length === 0) continue;

      const key = callShapeKey(row.provider, row.method, row.dotPath);
      const shape = CALL_SHAPES[key];
      if (!shape) {
        missing.push(key);
        continue;
      }
      const bound = new Set([
        ...shape.positional.map((entry) => entry.placeholder),
        ...shape.fields.map((entry) => entry.placeholder),
        ...shape.injected,
        ...shape.derived,
      ]);
      for (const placeholder of placeholders) {
        if (!bound.has(placeholder)) unbound.push(`${key} → ${placeholder}`);
      }
    }

    expect(missing).toEqual([]);
    expect(unbound).toEqual([]);
  });

  it("holds no entry for a row without a placeholder to bind", () => {
    const keyed = new Set(Object.keys(CALL_SHAPES));
    const spurious = tsvRows()
      .filter((row) => urlPlaceholders(row.fullUrl).length === 0)
      .map((row) => callShapeKey(row.provider, row.method, row.dotPath))
      .filter((key) => keyed.has(key));

    expect(spurious).toEqual([]);
  });

  it("documents why on every override", () => {
    const undocumented = Object.entries(
      OVERRIDES as Record<string, { why?: string }>
    )
      .filter(([, entry]) => !entry.why || entry.why.length === 0)
      .map(([key]) => key);

    expect(undocumented).toEqual([]);
  });

  it("leaves a placeholder it cannot bind unresolved rather than guessing", () => {
    const result = classifyPlaceholders({
      provider: "example",
      method: "GET",
      dotPath: "v1.thing",
      fullUrl: "https://example.test/v1/thing/{somethingElse}",
      params: [
        {
          name: "req",
          optional: false,
          isRequestObject: true,
          properties: ["id"],
        },
      ],
    });

    expect(result.unresolved).toEqual(["somethingElse"]);
    expect(result.positional).toEqual([]);
    expect(result.fields).toEqual([]);
  });

  it("names the two providers whose credential appears in a URL", () => {
    expect(Object.keys(INJECTED_PLACEHOLDERS).sort()).toEqual([
      "telegram",
      "thesportsdb",
    ]);
  });
});

describe("generated call-shape table", () => {
  it("matches a fresh generation from the current endpoint sources", async () => {
    const { stdout } = await execFileAsync("node", [
      "scripts/gen-call-shapes.mjs",
      "--check",
    ]);

    expect(stdout).toContain("up to date");
  }, 120_000);
});
