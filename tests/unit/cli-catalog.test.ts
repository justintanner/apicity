import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";

import {
  loadCatalog,
  findEntries,
  selectEntry,
} from "../../packages/cli/src/catalog";
import {
  isProviderConfigured,
  providerEnvVars,
  providerNames,
} from "../../packages/cli/src/credentials";
import { CliError } from "../../packages/cli/src/errors";
import {
  PROVIDERS,
  instantiateProvider,
} from "../../packages/cli/src/providers";

// AC-02: `apicity commands` must report every endpoint in the tsv, for every
// provider, whether or not a credential is present. Counts are derived from
// the tsv at test time (plan D-14) so adding an endpoint does not break this.

interface TsvRow {
  provider: string;
  dotPath: string;
  method: string;
}

function tsvRows(): TsvRow[] {
  return readFileSync("scripts/endpoint-docs.tsv", "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const [provider, dotPath, method] = line.split("\t");
      return { provider, dotPath, method };
    });
}

function tsvCountsByProvider(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of tsvRows()) {
    counts.set(row.provider, (counts.get(row.provider) ?? 0) + 1);
  }
  return counts;
}

/** Every env var any provider reads, so a fixture can clear the whole surface. */
function allProviderEnvVars(): string[] {
  const names = new Set<string>(["POLYMARKET_SIGNATURE_TYPE"]);
  for (const provider of providerNames()) {
    for (const envVar of providerEnvVars(provider)) names.add(envVar);
  }
  return [...names];
}

const EMPTY_ENV: NodeJS.ProcessEnv = {};

function fullEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const name of allProviderEnvVars()) env[name] = `dummy-${name}`;
  // Polymarket validates this one against a fixed vocabulary on construction.
  env.POLYMARKET_SIGNATURE_TYPE = "0";
  return env;
}

/** s3 set only halfway: the factory needs both vars and answers null with one. */
function partialEnv(): NodeJS.ProcessEnv {
  return { OPENAI_API_KEY: "dummy-openai", S3_ACCESS_KEY_ID: "dummy-s3-id" };
}

const savedEnv = new Map<string, string | undefined>();

function applyEnv(fixture: NodeJS.ProcessEnv): void {
  for (const name of allProviderEnvVars()) {
    if (!savedEnv.has(name)) savedEnv.set(name, process.env[name]);
    const value = fixture[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

afterEach(() => {
  for (const [name, value] of savedEnv) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  savedEnv.clear();
});

describe("apicity catalog", () => {
  it("reports every tsv row, per provider and in total", async () => {
    const catalog = await loadCatalog({ env: fullEnv() });
    const expected = tsvCountsByProvider();

    expect(catalog).toHaveLength(tsvRows().length);
    expect(expected.size).toBe(providerNames().length);

    for (const [provider, count] of expected) {
      const entries = catalog.filter((entry) => entry.provider === provider);
      expect(entries.length, provider).toBe(count);
    }
  });

  // The whole point of reading a generated table rather than the provider
  // objects: discovery must not depend on what the caller has configured.
  it("reports the same endpoints with nothing configured", async () => {
    const configured = await loadCatalog({ env: fullEnv() });
    const bare = await loadCatalog({ env: EMPTY_ENV });

    expect(
      bare.map(
        (entry) => `${entry.provider}\t${entry.method}\t${entry.dotPath}`
      )
    ).toEqual(
      configured.map(
        (entry) => `${entry.provider}\t${entry.method}\t${entry.dotPath}`
      )
    );
    expect(bare.some((entry) => entry.configured)).toBe(true);
    expect(bare.some((entry) => !entry.configured)).toBe(true);
  });

  it("preserves tsv order", async () => {
    const catalog = await loadCatalog({ env: EMPTY_ENV });
    const rows = tsvRows();

    expect(catalog.map((entry) => entry.dotPath)).toEqual(
      rows.map((row) => row.dotPath)
    );
  });

  it("reports both parameter kinds, and neither for a credential", async () => {
    const catalog = await loadCatalog({ env: fullEnv() });
    const find = (provider: string, dotPath: string, method: string) =>
      catalog.find(
        (entry) =>
          entry.provider === provider &&
          entry.dotPath === dotPath &&
          entry.method === method
      );

    expect(find("kie", "api.v1.generate.recordInfo", "GET")).toMatchObject({
      pathParams: ["taskId"],
      requestParams: [],
    });
    expect(find("s3", "buckets.create", "PUT")).toMatchObject({
      pathParams: [],
      requestParams: ["bucket"],
    });
    // telegram's {token} is the bot key: it belongs in neither list.
    expect(find("telegram", "sendMessage", "POST")).toMatchObject({
      pathParams: [],
      requestParams: [],
    });
  });

  it("marks paid endpoints", async () => {
    const catalog = await loadCatalog({ env: fullEnv() });
    const paid = catalog.filter((entry) => entry.paid);

    expect(paid.length).toBeGreaterThan(0);
    expect(
      catalog.find(
        (entry) =>
          entry.provider === "kie" && entry.dotPath === "api.v1.jobs.createTask"
      )?.paid
    ).toBe(true);
  });
});

describe("endpoint selection", () => {
  it("finds every method at one dotPath", async () => {
    const catalog = await loadCatalog({ env: EMPTY_ENV });
    const entries = findEntries(catalog, "openai", "v1.chat.completions");

    expect(entries.length).toBeGreaterThan(1);
    expect(selectEntry(entries, "post").method).toBe("POST");
  });

  it("is ambiguous, not arbitrary, when a dotPath carries several methods", async () => {
    const catalog = await loadCatalog({ env: EMPTY_ENV });
    const entries = findEntries(catalog, "openai", "v1.chat.completions");

    try {
      selectEntry(entries);
      expect.unreachable("expected an ambiguous error");
    } catch (err) {
      expect(err).toBeInstanceOf(CliError);
      expect((err as CliError).code).toBe("ambiguous");
      expect((err as CliError).exit).toBe(8);
    }
  });

  it("reports an unknown endpoint as not_found", async () => {
    const catalog = await loadCatalog({ env: EMPTY_ENV });

    try {
      selectEntry(findEntries(catalog, "openai", "v1.nope"));
      expect.unreachable("expected a not_found error");
    } catch (err) {
      expect(err).toBeInstanceOf(CliError);
      expect((err as CliError).code).toBe("not_found");
      expect((err as CliError).exit).toBe(2);
    }
  });

  // RR-3 (ac-yrwwpi): a `--method` the dotPath does not answer is `not_found`
  // (exit 2), and the README's "Raised when" table says so. `v1.models`
  // answers no POST, so it is the absent-method case; `v1.chat.completions`
  // answers DELETE, GET and POST and must not be used as one.
  it("reports a method the dotPath does not answer as not_found", async () => {
    const catalog = await loadCatalog({ env: EMPTY_ENV });
    const entries = findEntries(catalog, "openai", "v1.models");
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.map((entry) => entry.method)).not.toContain("POST");

    try {
      selectEntry(entries, "POST");
      expect.unreachable("expected a not_found error");
    } catch (err) {
      expect(err).toBeInstanceOf(CliError);
      expect((err as CliError).code).toBe("not_found");
      expect((err as CliError).exit).toBe(2);
      expect((err as CliError).message).toBe(
        "no POST endpoint at openai v1.models"
      );
      expect((err as CliError).hint).toContain("available: ");
    }
  });

  it("no (provider, dotPath, method) triple repeats, so --method always resolves", () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const row of tsvRows()) {
      const key = `${row.provider}\t${row.dotPath}\t${row.method}`;
      if (seen.has(key)) duplicates.push(key);
      seen.add(key);
    }

    expect(duplicates).toEqual([]);
  });
});

// `isProviderConfigured` exists so discovery never loads a provider package.
// It is only useful if it agrees with the factory it stands in for.
describe("isProviderConfigured mirrors instantiateProvider", () => {
  const fixtures: Array<[string, () => NodeJS.ProcessEnv]> = [
    ["nothing configured", () => EMPTY_ENV],
    ["everything configured", fullEnv],
    ["partially configured", partialEnv],
  ];

  for (const [label, build] of fixtures) {
    it(`agrees for every provider when ${label}`, async () => {
      const env = build();
      applyEnv(env);

      const disagreements: string[] = [];
      for (const [name, spec] of Object.entries(PROVIDERS)) {
        const predicted = isProviderConfigured(name, env);
        const instance = await instantiateProvider(name, spec);
        const actual = instance !== null;
        if (predicted !== actual) {
          disagreements.push(`${name}: predicted ${predicted}, got ${actual}`);
        }
      }

      expect(disagreements).toEqual([]);
    });
  }
});
