import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createKie } from "@apicity/kie";
import { afterEach, describe, expect, it } from "vitest";

import {
  createSchemaRegistry,
  createTaskAssociationKey,
  discoverCompareCostScripts,
  loadCompareCostModule,
  main,
  normalizeZodIssues,
  validateCompareCostModules,
} from "../../scripts/check-compare-cost-payloads.mjs";

const execFileAsync = promisify(execFile);
const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const temporaryDirectories: string[] = [];

interface OutputCapture {
  stream: {
    write(value: string | Uint8Array): boolean;
  };
  text(): string;
}

interface CompareCostPayload {
  model: string;
  input?: Record<string, unknown>;
  [key: string]: unknown;
}

interface CompareCostRow {
  label: string;
  provider: string;
  endpoint: string;
  payload: CompareCostPayload;
  [key: string]: unknown;
}

interface LoadedCompareModule {
  sourcePath: string;
  lineup: CompareCostRow[];
  schemaValidationCases(row: CompareCostRow): unknown;
}

function captureOutput(): OutputCapture {
  const chunks: string[] = [];
  return {
    stream: {
      write(value) {
        chunks.push(String(value));
        return true;
      },
    },
    text() {
      return chunks.join("");
    },
  };
}

function publicSchemas() {
  return createSchemaRegistry(createKie({ apiKey: "offline-schema-check" }));
}

async function productionModules() {
  const files = await discoverCompareCostScripts(repositoryRoot);
  const modules = (await Promise.all(
    files.map((sourcePath) =>
      loadCompareCostModule(resolve(repositoryRoot, sourcePath), {
        sourcePath,
      })
    )
  )) as LoadedCompareModule[];
  return { files, modules };
}

function moduleWithModel(modules: LoadedCompareModule[], model: string) {
  const found = modules.find((moduleRecord) =>
    moduleRecord.lineup.some((row) => row?.payload?.model === model)
  );
  if (!found) throw new Error(`No production row found for ${model}`);
  return found;
}

function rowWithModel(
  moduleRecord: ReturnType<typeof moduleWithModel>,
  model: string
): CompareCostRow {
  const found = moduleRecord.lineup.find(
    (row) => row?.payload?.model === model
  );
  if (!found) throw new Error(`No production row found for ${model}`);
  return found;
}

function passingRegistry() {
  return new Map([
    [
      "fixture:generate",
      {
        safeParse(value: unknown) {
          return value && typeof value === "object"
            ? { success: true, data: value }
            : {
                success: false,
                error: {
                  issues: [
                    {
                      code: "invalid_type",
                      path: [],
                      message: "Expected an object",
                    },
                  ],
                },
              };
        },
      },
    ],
  ]);
}

async function makeTemporaryRepository(moduleSource: string) {
  const root = await mkdtemp(join(tmpdir(), "apicity-compare-guard-"));
  temporaryDirectories.push(root);
  const scriptsDirectory = join(root, "scripts");
  await mkdir(scriptsDirectory, { recursive: true });
  const sourcePath = "scripts/compare-audio-cost.mjs";
  await writeFile(join(root, sourcePath), moduleSource, "utf8");
  await execFileAsync("git", ["init", "-q"], { cwd: root });
  await execFileAsync("git", ["add", "--", sourcePath], { cwd: root });
  return { root, sourcePath };
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe("production compare-cost payloads", () => {
  it("discovers two silent modules and validates all 216 cases", async () => {
    const files = await discoverCompareCostScripts(repositoryRoot);
    expect(files).toHaveLength(2);
    expect(
      files.every((file) => /^scripts\/compare-[^/]+-cost\.mjs$/.test(file))
    ).toBe(true);

    for (const sourcePath of files) {
      const specifier = pathToFileURL(resolve(repositoryRoot, sourcePath)).href;
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        [
          "--input-type=module",
          "--eval",
          `await import(${JSON.stringify(specifier)})`,
        ],
        { cwd: repositoryRoot }
      );
      expect(stdout).toBe("");
      expect(stderr).toBe("");
    }

    const loaded = await productionModules();
    const result = validateCompareCostModules(loaded.modules, publicSchemas());
    expect(result).toEqual({
      ok: true,
      files: 2,
      rows: 108,
      cases: 216,
      skips: 0,
      diagnostics: [],
    });
  });

  it("reports the matching Qwen issue path for every malformed row", async () => {
    const loaded = await productionModules();
    const imageModule = moduleWithModel(loaded.modules, "qwen2/image-edit");
    const qwen = rowWithModel(imageModule, "qwen2/image-edit");
    const malformedRows = ["seeded Qwen one", "seeded Qwen two"].map(
      (label) => ({
        ...qwen,
        label,
        payload: {
          ...qwen.payload,
          input: {
            ...qwen.payload.input,
            image_url: ["https://example.com/private-fixture.jpg"],
          },
        },
      })
    );
    const result = validateCompareCostModules(
      [{ ...imageModule, lineup: malformedRows }],
      publicSchemas()
    );
    const diagnostics = result.diagnostics.join("\n");

    expect(result.ok).toBe(false);
    expect(result.rows).toBe(2);
    expect(result.cases).toBe(4);
    expect(diagnostics).toContain(imageModule.sourcePath);
    expect(diagnostics).toContain("seeded Qwen one");
    expect(diagnostics).toContain("seeded Qwen two");
    expect(diagnostics).toContain(createTaskAssociationKey);
    expect(diagnostics).toContain("input.image_url");
    expect(diagnostics).not.toContain(":: model:");
    expect(diagnostics).not.toContain("private-fixture.jpg");
    expect(diagnostics).not.toContain("offline-schema-check");
  });

  it("materializes Kling strings and WAN numbers accepted by KIE", async () => {
    const loaded = await productionModules();
    const videoRecord = moduleWithModel(loaded.modules, "kling-3.0/video");
    const videoModule = await import(
      pathToFileURL(resolve(repositoryRoot, videoRecord.sourcePath)).href
    );
    const kling = rowWithModel(videoRecord, "kling-3.0/video");
    const wan = rowWithModel(videoRecord, "wan/2-7-text-to-video");
    const klingPayload = videoModule.withDuration(kling.payload, 8);
    const wanPayload = videoModule.withDuration(wan.payload, 8);
    const schema = publicSchemas().get(createTaskAssociationKey);

    expect(klingPayload.input.duration).toBe("8");
    expect(wanPayload.input.duration).toBe(8);
    expect(schema.safeParse(klingPayload).success).toBe(true);
    expect(schema.safeParse(wanPayload).success).toBe(true);
  });

  it("preserves both comparison CLIs through injected main seams", async () => {
    const loaded = await productionModules();
    const imageRecord = moduleWithModel(loaded.modules, "nano-banana-2");
    const videoRecord = moduleWithModel(loaded.modules, "kling-3.0/video");
    const imageModule = await import(
      pathToFileURL(resolve(repositoryRoot, imageRecord.sourcePath)).href
    );
    const videoModule = await import(
      pathToFileURL(resolve(repositoryRoot, videoRecord.sourcePath)).href
    );
    const createCost = () => ({
      estimate: () => ({ usd: 0.25, source: "fixture", warnings: [] }),
    });
    const imageOutput = captureOutput();
    const videoOutput = captureOutput();

    await expect(
      imageModule.main(["--counts=1,4"], {
        createCost,
        stdout: imageOutput.stream,
      })
    ).resolves.toBe(0);
    await expect(
      videoModule.main(["--durations=5,8"], {
        createCost,
        stdout: videoOutput.stream,
      })
    ).resolves.toBe(0);

    expect(imageOutput.text()).toContain("1×img");
    expect(imageOutput.text()).toContain("4×img");
    expect(videoOutput.text()).toContain("5s");
    expect(videoOutput.text()).toContain("8s");
    for (const row of imageRecord.lineup) {
      expect(imageOutput.text()).toContain(row.label);
    }
    for (const row of videoRecord.lineup) {
      expect(videoOutput.text()).toContain(row.label);
    }
  });
});

describe("dynamic discovery and module contracts", () => {
  it("discovers and validates a newly tracked comparison kind", async () => {
    const fixture = await makeTemporaryRepository(`
      export const lineup = [{
        label: "audio fixture",
        provider: "fixture",
        endpoint: "generate",
        payload: { prompt: "fixture" },
      }];
      export function schemaValidationCases(entry) {
        return [{ name: "canonical", payload: entry.payload }];
      }
    `);
    const files = await discoverCompareCostScripts(fixture.root);
    expect(files).toEqual([fixture.sourcePath]);

    const loaded = await loadCompareCostModule(
      resolve(fixture.root, fixture.sourcePath),
      { sourcePath: fixture.sourcePath }
    );
    const passing = validateCompareCostModules([loaded], passingRegistry());
    expect(passing.ok).toBe(true);
    expect(passing).toMatchObject({ files: 1, rows: 1, cases: 1, skips: 0 });

    const unknown = validateCompareCostModules(
      [
        {
          ...loaded,
          lineup: [{ ...loaded.lineup[0], endpoint: "unknown" }],
        },
      ],
      passingRegistry()
    );
    expect(unknown.ok).toBe(false);
    expect(unknown.diagnostics.join("\n")).toContain(
      "unknown provider/endpoint association"
    );
    expect(unknown.diagnostics.join("\n")).toContain(
      "register its public schema"
    );
  });

  it("fails discovery on Git errors and empty results", async () => {
    await expect(
      discoverCompareCostScripts(repositoryRoot, {
        runGit: async () => {
          throw new Error("seeded Git failure");
        },
      })
    ).rejects.toThrow("seeded Git failure");
    await expect(
      discoverCompareCostScripts(repositoryRoot, {
        runGit: async () => ({ stdout: "" }),
      })
    ).rejects.toThrow("found no tracked");
  });

  it("rejects unloadable, missing, and empty module contracts", async () => {
    const sourcePath = "scripts/compare-broken-cost.mjs";
    await expect(
      loadCompareCostModule(resolve(repositoryRoot, sourcePath), {
        sourcePath,
      })
    ).rejects.toThrow(`${sourcePath}: unable to load`);
    await expect(
      loadCompareCostModule(repositoryRoot, {
        sourcePath,
        importModule: async () => ({}),
      })
    ).rejects.toThrow("missing non-empty array export");
    await expect(
      loadCompareCostModule(repositoryRoot, {
        sourcePath,
        importModule: async () => ({
          lineup: [],
          schemaValidationCases: () => [],
        }),
      })
    ).rejects.toThrow("must not be empty");
    await expect(
      loadCompareCostModule(repositoryRoot, {
        sourcePath,
        importModule: async () => ({ lineup: [{}] }),
      })
    ).rejects.toThrow("missing function export");
  });
});

describe("fail-closed validation", () => {
  it("validates the stored payload as the canonical case", () => {
    const result = validateCompareCostModules(
      [
        {
          sourcePath: "scripts/compare-fixture-cost.mjs",
          lineup: [
            {
              label: "invalid stored payload",
              provider: "fixture",
              endpoint: "generate",
              payload: null,
            },
          ],
          schemaValidationCases: () => [
            { name: "canonical", payload: { prompt: "valid substitute" } },
            { name: "representative", payload: { prompt: "valid case" } },
          ],
        },
      ],
      passingRegistry()
    );
    const diagnostics = result.diagnostics.join("\n");

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ rows: 1, cases: 2 });
    expect(diagnostics).toContain('row "invalid stored payload"');
    expect(diagnostics).toContain('case "canonical"');
    expect(diagnostics).toContain("Expected an object");
    expect(diagnostics).not.toContain('case "representative"');
  });

  it("aggregates row, case, materializer, and schema-contract errors", () => {
    const rows = [
      {
        label: "missing payload",
        provider: "fixture",
        endpoint: "generate",
        kind: "missing",
      },
      {
        label: "throwing materializer",
        provider: "fixture",
        endpoint: "generate",
        payload: {},
        kind: "throw",
      },
      {
        label: "empty cases",
        provider: "fixture",
        endpoint: "generate",
        payload: {},
        kind: "empty",
      },
      {
        label: "duplicate cases",
        provider: "fixture",
        endpoint: "generate",
        payload: {},
        kind: "duplicate",
      },
    ];
    const result = validateCompareCostModules(
      [
        {
          sourcePath: "scripts/compare-fixture-cost.mjs",
          lineup: rows,
          schemaValidationCases(row: (typeof rows)[number]) {
            if (row.kind === "throw") throw new Error("seeded materializer");
            if (row.kind === "empty") return [];
            if (row.kind === "duplicate") {
              return [
                { name: "same", payload: row.payload },
                { name: "same", payload: row.payload },
              ];
            }
            return [{ name: "canonical" }];
          },
        },
      ],
      passingRegistry()
    );
    const diagnostics = result.diagnostics.join("\n");

    expect(result.ok).toBe(false);
    expect(result.rows).toBe(4);
    expect(diagnostics).toContain("missing payload");
    expect(diagnostics).toContain("case is missing a payload");
    expect(diagnostics).toContain("seeded materializer");
    expect(diagnostics).toContain("return a non-empty array");
    expect(diagnostics).toContain("duplicate case name");
  });

  it("normalizes the most relevant union branch deterministically", () => {
    const issues = [
      {
        code: "invalid_union",
        path: [],
        message: "Invalid input",
        errors: [
          [
            {
              code: "invalid_value",
              path: ["model"],
              message: "Wrong model",
            },
            {
              code: "invalid_type",
              path: ["input", "other"],
              message: "Wrong branch",
            },
          ],
          [
            {
              code: "invalid_type",
              path: ["input", "image_url"],
              message: "Expected string",
            },
          ],
        ],
      },
    ];

    expect(normalizeZodIssues(issues)).toEqual([
      { path: "input.image_url", message: "Expected string" },
    ]);
  });

  it("returns zero for success and one for setup or schema failure", async () => {
    const sourcePath = "scripts/compare-fixture-cost.mjs";
    const fixtureModule = {
      sourcePath,
      lineup: [
        {
          label: "fixture",
          provider: "fixture",
          endpoint: "generate",
          payload: {},
        },
      ],
      schemaValidationCases: (row: { payload: object }) => [
        { name: "canonical", payload: row.payload },
      ],
    };
    const successOutput = captureOutput();
    const successErrors = captureOutput();
    const success = await main({
      root: repositoryRoot,
      stdout: successOutput.stream,
      stderr: successErrors.stream,
      discoverCompareCostScripts: async () => [sourcePath],
      loadCompareCostModule: async () => fixtureModule,
      schemaRegistry: passingRegistry(),
    });

    expect(success).toBe(0);
    expect(successOutput.text()).toContain(
      "pass — 1 files, 1 rows, 1 cases, 0 skips"
    );
    expect(successErrors.text()).toBe("");

    const loadErrors = captureOutput();
    const loadFailure = await main({
      root: repositoryRoot,
      stdout: captureOutput().stream,
      stderr: loadErrors.stream,
      discoverCompareCostScripts: async () => [sourcePath],
      loadCompareCostModule: async () => {
        throw new Error("seeded module load failure");
      },
      schemaRegistry: passingRegistry(),
    });
    expect(loadFailure).toBe(1);
    expect(loadErrors.text()).toContain(sourcePath);
    expect(loadErrors.text()).toContain("seeded module load failure");

    const schemaErrors = captureOutput();
    const schemaFailure = await main({
      root: repositoryRoot,
      stdout: captureOutput().stream,
      stderr: schemaErrors.stream,
      discoverCompareCostScripts: async () => [sourcePath],
      loadCompareCostModule: async () => fixtureModule,
      schemaRegistry: new Map([
        [
          "fixture:generate",
          {
            safeParse: () => ({
              success: false,
              error: {
                issues: [
                  {
                    code: "custom",
                    path: ["input", "value"],
                    message: "Seeded rejection",
                  },
                ],
              },
            }),
          },
        ],
      ]),
    });
    expect(schemaFailure).toBe(1);
    expect(schemaErrors.text()).toContain("input.value: Seeded rejection");
    expect(schemaErrors.text()).not.toContain("offline-schema-check");
  });

  it("stops before row validation when the schema registry cannot load", async () => {
    const sourcePath = "scripts/compare-fixture-cost.mjs";
    const brokenSourcePath = "scripts/compare-broken-cost.mjs";
    const errors = captureOutput();
    const status = await main({
      root: repositoryRoot,
      stdout: captureOutput().stream,
      stderr: errors.stream,
      discoverCompareCostScripts: async () => [sourcePath, brokenSourcePath],
      loadCompareCostModule: async (
        _filePath: string,
        options: { sourcePath: string }
      ) => {
        if (options.sourcePath === brokenSourcePath) {
          throw new Error("seeded module load failure");
        }
        return {
          sourcePath,
          lineup: [
            {
              label: "fixture",
              provider: "fixture",
              endpoint: "generate",
              payload: {},
            },
          ],
          schemaValidationCases: (row: { payload: object }) => [
            { name: "canonical", payload: row.payload },
          ],
        };
      },
      importKie: async () => {
        throw new Error("seeded schema registry load failure");
      },
    });
    const output = errors.text();

    expect(status).toBe(1);
    expect(output).toContain(
      "fail — 2 files, 0 rows, 0 cases, 0 skips, 2 errors"
    );
    expect(output).toContain(brokenSourcePath);
    expect(output).toContain("seeded module load failure");
    expect(output.match(/seeded schema registry load failure/g)).toHaveLength(
      1
    );
    expect(output).not.toContain("unknown provider/endpoint association");
  });
});
