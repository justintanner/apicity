import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import type { CliWriter } from "../../packages/cli/src/envelope";
import { HELP_TOPICS } from "../../packages/cli/src/help";
import { runMain } from "../../packages/cli/src/main";
import {
  describeEndpoint,
  listProviders,
  runCommands,
  runProviders,
  type ProviderLoader,
} from "../../packages/cli/src/discovery";
import { instantiateForIntrospection } from "../../packages/cli/src/discovery";
import type { JsonSchema } from "../../packages/cli/src/schema";

// AC-07: the three discovery commands. None of them needs a credential, and
// only `describe` may touch a provider package — the import seam below is the
// half of the timing budget that a stopwatch cannot protect.

const EMPTY_ENV: NodeJS.ProcessEnv = {};

interface Capture {
  writer: CliWriter;
  out: string[];
  err: string[];
}

function capture(): Capture {
  const out: string[] = [];
  const err: string[] = [];
  return {
    writer: { out: (text) => out.push(text), err: (text) => err.push(text) },
    out,
    err,
  };
}

/** Every model id a createTask-style union offers, across const and enum branches. */
function modelIds(variants: JsonSchema[]): string[] {
  const out: string[] = [];
  for (const variant of variants) {
    const model = (variant.properties as Record<string, JsonSchema>)?.model;
    if (!model) continue;
    for (const branch of (model.anyOf as JsonSchema[]) ?? [model]) {
      if (typeof branch?.const === "string") out.push(branch.const);
      for (const value of (branch?.enum as unknown[]) ?? []) {
        if (typeof value === "string") out.push(value);
      }
    }
  }
  return out;
}

function tsvRowCount(provider: string): number {
  return readFileSync("scripts/endpoint-docs.tsv", "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .filter((line) => line.split("\t")[0] === provider).length;
}

/** A loader that records every call, so a test can assert it was never used. */
function countingLoader(): { loader: ProviderLoader; calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    loader: async (name) => {
      calls.push(name);
      return instantiateForIntrospection(name);
    },
  };
}

describe("apicity commands", () => {
  it("reports one entry per tsv row for a single provider", async () => {
    const { writer, out } = capture();

    await expect(
      runCommands(writer, {
        provider: "openligadb",
        json: true,
        env: EMPTY_ENV,
      })
    ).resolves.toBe(0);

    const entries = JSON.parse(out.join("\n")) as unknown[];
    expect(entries).toHaveLength(tsvRowCount("openligadb"));
  });

  it("prints a table with both parameter kinds in human mode", async () => {
    const { writer, out } = capture();

    await runCommands(writer, { provider: "kie", env: EMPTY_ENV });
    const table = out.join("\n");

    expect(table.split("\n")[0]).toContain("provider");
    expect(table).toContain("dotPath");
    // A positional reads as `<taskId>`; a request property reads bare.
    expect(table).toContain("<taskId>");
  });

  it("reports an unknown provider as not_found", async () => {
    const { writer } = capture();

    await expect(
      runCommands(writer, { provider: "nope", env: EMPTY_ENV })
    ).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("apicity providers", () => {
  it("lists env var names and status, never a value", async () => {
    const summaries = await listProviders({
      env: { OPENAI_API_KEY: "sk-secret-value" },
    });
    const openai = summaries.find((s) => s.provider === "openai");
    const binance = summaries.find((s) => s.provider === "binance");

    expect(openai).toMatchObject({
      envVars: ["OPENAI_API_KEY"],
      configured: true,
    });
    expect(openai?.endpoints).toBe(tsvRowCount("openai"));
    // A provider that needs no credential is always usable.
    expect(binance).toMatchObject({ envVars: [], configured: true });
    expect(JSON.stringify(summaries)).not.toContain("sk-secret-value");
  });

  it("prints no credential value in human mode either", async () => {
    const { writer, out } = capture();

    await runProviders(writer, { env: { OPENAI_API_KEY: "sk-secret-value" } });

    expect(out.join("\n")).not.toContain("sk-secret-value");
    expect(out.join("\n")).toContain("OPENAI_API_KEY");
  });
});

describe("apicity describe", () => {
  it("answers the schema, call shape and paid flag for a paid endpoint", async () => {
    const description = await describeEndpoint(
      "kie",
      "api.v1.jobs.createTask",
      { method: "POST", env: EMPTY_ENV }
    );

    expect(description.paid).toBe(true);
    expect(description.method).toBe("POST");
    expect(description.callShape).toBeUndefined(); // no URL placeholder
    // createTask is a discriminated union: one variant per model, each pinning
    // its `model` to a const or an open enum branch, exactly as
    // `mcp-schema.test.ts` pins for the MCP tool schema.
    const variants = (description.schema as JsonSchema).anyOf as JsonSchema[];
    expect(variants.length).toBeGreaterThan(0);
    expect(modelIds(variants)).toContain("grok-imagine/text-to-video");
  });

  it("needs no credential in the environment", async () => {
    const description = await describeEndpoint(
      "openai",
      "v1.vectorStores.files",
      { method: "GET", env: EMPTY_ENV }
    );

    expect(description.configured).toBe(false);
    expect(description.callShape?.positional).toEqual([
      {
        placeholder: "vector_store_id",
        param: "vectorStoreId",
        optional: false,
        alias: "vector_store_id",
      },
    ]);
  });

  // A workspace checkout without `pnpm run build`, or an install missing a
  // provider package, must read as setup rather than as a crashed CLI.
  it("reports an unloadable provider package as setup_incomplete", async () => {
    await expect(
      describeEndpoint("openligadb", "getcurrentgroup", {
        env: EMPTY_ENV,
        loadProvider: () => Promise.reject(new Error("ERR_MODULE_NOT_FOUND")),
      })
    ).rejects.toThrow("ERR_MODULE_NOT_FOUND");

    await expect(
      instantiateForIntrospection("openligadb", {
        envVar: "",
        optionKey: "apiKey",
        importPath: "@apicity/does-not-exist",
        factoryName: "createNothing",
      })
    ).rejects.toMatchObject({ code: "setup_incomplete" });
  });

  it("is ambiguous without --method on a multi-method dotPath", async () => {
    await expect(
      describeEndpoint("openai", "v1.chat.completions", { env: EMPTY_ENV })
    ).rejects.toMatchObject({ code: "ambiguous" });
  });
});

// The import seam. `commands` and `providers` answer from the generated table;
// only `describe` may pay for a provider import, and only once.
describe("provider-import seam", () => {
  it("never loads a provider for commands", async () => {
    const { writer } = capture();
    const { loader, calls } = countingLoader();

    await runCommands(writer, {
      json: true,
      env: EMPTY_ENV,
      loadProvider: loader,
    });

    expect(calls).toEqual([]);
  });

  it("never loads a provider for providers", async () => {
    const { writer } = capture();
    const { loader, calls } = countingLoader();

    await runProviders(writer, {
      json: true,
      env: EMPTY_ENV,
      loadProvider: loader,
    });

    expect(calls).toEqual([]);
  });

  it("loads exactly one provider for describe", async () => {
    const { loader, calls } = countingLoader();

    await describeEndpoint("openligadb", "getcurrentgroup", {
      env: EMPTY_ENV,
      loadProvider: loader,
    });

    expect(calls).toEqual(["openligadb"]);
  });
});

// Routing: every command this slice adds has to be reachable from argv, and a
// failure has to leave the envelope on stderr rather than a stack trace.
describe("dispatcher routing", () => {
  it("prints each help topic", async () => {
    for (const topic of HELP_TOPICS) {
      const { writer, out, err } = capture();

      await expect(runMain(["help", topic], writer)).resolves.toBe(0);
      expect(err, topic).toEqual([]);
      expect(out.join("\n"), topic).toContain(topic);
    }
  });

  it("names every exit code in the exit-codes topic", async () => {
    const { writer, out } = capture();

    await runMain(["help", "exit-codes"], writer);
    const text = out.join("\n");

    for (const code of ["usage", "not_found", "ambiguous", "paygate"]) {
      expect(text, code).toContain(code);
    }
  });

  it("answers an unknown help topic with not_found", async () => {
    const { writer, err } = capture();

    await expect(runMain(["help", "nosuch"], writer)).resolves.toBe(2);
    expect(JSON.parse(err[0])).toMatchObject({ ok: false, code: "not_found" });
  });

  it("routes a bare provider name to its command list", async () => {
    const direct = capture();
    const viaFlag = capture();

    await expect(
      runMain(["openligadb", "--json"], direct.writer)
    ).resolves.toBe(0);
    await expect(
      runMain(
        ["commands", "--provider", "openligadb", "--json"],
        viaFlag.writer
      )
    ).resolves.toBe(0);

    expect(direct.out).toEqual(viaFlag.out);
    expect(JSON.parse(direct.out.join("\n"))).toHaveLength(
      tsvRowCount("openligadb")
    );
  });

  it("reports a describe call with no arguments as usage", async () => {
    const { writer, err } = capture();

    await expect(runMain(["describe"], writer)).resolves.toBe(1);
    expect(JSON.parse(err[0])).toMatchObject({ ok: false, code: "usage" });
  });

  it("puts a discovery failure in the error envelope, not a stack", async () => {
    const { writer, out, err } = capture();

    await expect(
      runMain(["commands", "--provider", "nosuchprovider"], writer)
    ).resolves.toBe(2);
    expect(out).toEqual([]);
    expect(JSON.parse(err[0])).toMatchObject({ ok: false, code: "not_found" });
  });
});
