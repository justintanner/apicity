import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  buildRegistry,
  type Endpoint,
} from "../../packages/mcp-server/src/registry";
import {
  zodToJsonSchema,
  type JsonSchema,
} from "../../packages/mcp-server/src/schema";

interface ChildProcessError {
  message?: string;
  stdout?: Buffer;
  stderr?: Buffer;
}

const BUILT_DECLARATION_PROVIDERS = [
  {
    packageName: "@apicity/kie",
    declarationPath: "packages/provider/kie/dist/src/index.d.ts",
  },
  {
    packageName: "@apicity/openai",
    declarationPath: "packages/provider/openai/dist/src/index.d.ts",
  },
  {
    packageName: "@apicity/xai",
    declarationPath: "packages/provider/xai/dist/src/index.d.ts",
  },
];

describe("Zod runtime compatibility", () => {
  beforeAll(() => {
    const missingProviders = BUILT_DECLARATION_PROVIDERS.filter(
      ({ declarationPath }) => !existsSync(resolve(declarationPath))
    );

    if (missingProviders.length === 0) {
      return;
    }

    runAndReport(
      pnpmCommand(),
      [
        ...missingProviders.flatMap(({ packageName }) => [
          "--filter",
          packageName,
        ]),
        "run",
        "build",
      ],
      120000
    );
  }, 120000);

  it("validates built provider schemas through the unified Zod 4 runtime", async () => {
    // dist/ exists only after the beforeAll build, so the static tests/
    // typecheck gate (which runs on fresh worktrees) must not resolve these
    // specifiers; import through a variable and type the result from source.
    const importBuilt = <T>(distPath: string): Promise<T> =>
      import(distPath) as Promise<T>;
    const [{ createKie }, { createOpenAi }, { createXai }] = await Promise.all([
      importBuilt<typeof import("@apicity/kie")>(
        "../../packages/provider/kie/dist/src/index.js"
      ),
      importBuilt<typeof import("@apicity/openai")>(
        "../../packages/provider/openai/dist/src/index.js"
      ),
      importBuilt<typeof import("@apicity/xai")>(
        "../../packages/provider/xai/dist/src/index.js"
      ),
    ]);

    const openai = createOpenAi({ apiKey: "sk-test" });
    expect(
      openai.post.v1.chat.completions.schema.safeParse({
        messages: [{ role: "user", content: "Hello" }],
      }).success
    ).toBe(true);

    const kie = createKie({ apiKey: "kie-test" });
    expect(
      kie.post.api.v1.jobs.createTask.schema.safeParse({
        model: "gpt-image-2-text-to-image",
        input: {
          prompt: "A serene mountain lake at sunrise.",
          aspect_ratio: "1:1",
          resolution: "2K",
        },
      }).success
    ).toBe(true);

    const xai = createXai({ apiKey: "xai-test" });
    expect(
      xai.post.v1.chat.completions.schema.safeParse({
        model: "grok-3",
        messages: [{ role: "user", content: "Hello" }],
      }).success
    ).toBe(true);
  });

  it("compiles built declaration schema surfaces for consumers", () => {
    runAndReport(
      process.execPath,
      [
        resolve("node_modules/typescript/bin/tsc"),
        "--noEmit",
        "--target",
        "ES2022",
        "--module",
        "ESNext",
        "--moduleResolution",
        "Node",
        "--lib",
        "ES2022,DOM",
        "--strict",
        "--skipLibCheck",
        "false",
        "--esModuleInterop",
        "tests/fixtures/zod-compat-consumer.ts",
      ],
      90000
    );
  }, 90000);

  it("discovers and converts MCP schemas from unified Zod providers", async () => {
    const endpoints = await withEnv(
      {
        OPENAI_API_KEY: "sk-test",
        KIE_API_KEY: "kie-test",
        XAI_API_KEY: "xai-test",
      },
      () =>
        buildRegistry({
          enabledProviders: ["openai", "kie", "xai"],
        })
    );

    const openai = zodToJsonSchema(
      findEndpoint(endpoints, "openai", "POST", "v1.embeddings").schema
    );
    expect(requiredFields(openai)).toEqual(
      expect.arrayContaining(["input", "model"])
    );
    expect(objectProperties(openai).input).toHaveProperty("anyOf");

    const kie = zodToJsonSchema(
      findEndpoint(endpoints, "kie", "POST", "api.v1.jobs.createTask").schema
    );
    expect(requiredFields(kie)).toEqual(
      expect.arrayContaining(["model", "input"])
    );
    expect(objectProperties(kie).model).toEqual(
      expect.objectContaining({
        enum: expect.arrayContaining(["gpt-image-2-text-to-image"]),
      })
    );

    const xai = zodToJsonSchema(
      findEndpoint(endpoints, "xai", "POST", "v1.chat.completions").schema
    );
    expect(requiredFields(xai)).toEqual(expect.arrayContaining(["messages"]));
    expect(objectProperties(xai).messages).toEqual(
      expect.objectContaining({ type: "array" })
    );
  });
});

async function withEnv<T>(
  values: Record<string, string>,
  fn: () => Promise<T>
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    process.env[key] = value;
  }
  try {
    return await fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function findEndpoint(
  endpoints: Endpoint[],
  provider: string,
  method: string,
  dotPath: string
): Endpoint {
  const endpoint = endpoints.find(
    (candidate) =>
      candidate.provider === provider &&
      candidate.method === method &&
      candidate.dotPath === dotPath
  );
  expect(endpoint).toBeDefined();
  return endpoint as Endpoint;
}

function objectProperties(schema: JsonSchema): Record<string, JsonSchema> {
  expect(schema.type).toBe("object");
  expect(schema.properties).toEqual(expect.any(Object));
  return schema.properties as Record<string, JsonSchema>;
}

function requiredFields(schema: JsonSchema): string[] {
  return Array.isArray(schema.required)
    ? schema.required.filter(
        (field): field is string => typeof field === "string"
      )
    : [];
}

function pnpmCommand(): string {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

function runAndReport(command: string, args: string[], timeout: number): void {
  try {
    execFileSync(command, args, {
      cwd: resolve("."),
      stdio: "pipe",
      timeout,
    });
  } catch (error) {
    const child = error as ChildProcessError;
    throw new Error(
      [child.message, child.stdout?.toString(), child.stderr?.toString()]
        .filter(Boolean)
        .join("\n")
    );
  }
}
