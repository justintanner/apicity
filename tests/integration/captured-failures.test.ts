import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { exchangeSucceeded, type Har, type HarEntry } from "@apicity/har";
import { runHarCommand } from "../../packages/cli/src/har";
import {
  PROVIDERS,
  type InstantiatedProvider,
} from "../../packages/cli/src/providers";
import { resolveEndpointFn } from "../../packages/cli/src/registry";

// Every provider rejection apicity has seen is either caught before the
// network, with a message that restates the provider's rule, or listed in
// tests/failures/passthrough.json with a reason (ac-tsul8r). No Polly and no
// network: each file's failed request body goes through the endpoint's local
// validation with a fetch that only counts calls. docs/har-capture.md,
// "Failures become tests", has the triage procedure.
const root = path.resolve("tests/failures");

interface Sidecar {
  endpoint?: unknown;
  rule?: unknown;
  source?: unknown;
}
interface Passthrough {
  file: string;
  reason: string;
  providerMessage: string;
}
interface SafeParser {
  safeParse(value: unknown):
    | { success: true }
    | {
        success: false;
        error: { issues: Array<{ path: PropertyKey[]; message: string }> };
      };
}
interface Verdict {
  rejected: boolean;
  message: string;
  fetched: number;
}

const harFiles = readdirSync(root, { recursive: true })
  .filter((f): f is string => typeof f === "string" && f.endsWith(".har"))
  .map((f) => f.split(path.sep).join("/"))
  .sort();
const passthrough = JSON.parse(
  readFileSync(path.join(root, "passthrough.json"), "utf8")
) as Passthrough[];
const listed = new Map(passthrough.map((p) => [p.file, p]));

// These endpoints validate when called; every other `.schema` is metadata, so
// its safeParse is the local check.
const RUNTIME_VALIDATED = new Set([
  "kie POST api.v1.jobs.createTask",
  "xai POST v1.videos.generations",
]);

async function localVerdict(
  providerName: string,
  method: string,
  dotPath: string,
  body: unknown
): Promise<Verdict> {
  const spec = PROVIDERS[providerName];
  let fetched = 0;
  const fetch = async () => {
    fetched++;
    throw new Error("captured-failures: the request reached fetch");
  };
  const factory = (await import(spec.importPath))[spec.factoryName] as (
    options: Record<string, unknown>
  ) => InstantiatedProvider;
  const provider = factory({ [spec.optionKey]: "test-key", fetch });
  const fn = resolveEndpointFn(provider, method, dotPath);
  if (!fn)
    throw new Error(
      `${providerName} ${method} ${dotPath} resolves to no endpoint`
    );
  if (RUNTIME_VALIDATED.has(`${providerName} ${method} ${dotPath}`)) {
    try {
      await fn(body);
    } catch (error) {
      if (!fetched)
        return { rejected: true, message: (error as Error).message, fetched };
    }
    return { rejected: false, message: "", fetched };
  }
  const schema = fn.schema as SafeParser | undefined;
  if (!schema) throw new Error(`${providerName} ${dotPath} has no .schema`);
  const parsed = schema.safeParse(body);
  if (parsed.success) return { rejected: false, message: "", fetched };
  const message = parsed.error.issues
    .map((i) => `${i.path.map(String).join(".")}: ${i.message}`)
    .join("; ");
  return { rejected: true, message, fetched };
}

function payloadOf(entry: HarEntry): unknown {
  const text = entry.request.postData?.text;
  if (!text) return undefined;
  const body = JSON.parse(text) as Record<string, unknown>;
  // A multipart body is persisted as a summary; its fields are the payload.
  if (body?._multipart === true) {
    const fields = { ...body };
    delete fields._multipart;
    return fields;
  }
  return body;
}

function providerText(entry: HarEntry): string {
  const { text = "", encoding } = entry.response.content;
  return encoding === "base64"
    ? Buffer.from(text, "base64").toString("utf8")
    : text;
}

// The reason a captured failure breaks the rule, or undefined when it holds.
function problem(
  file: string,
  entry: HarEntry,
  sidecar: Sidecar,
  verdict: Verdict
): string | undefined {
  const said = providerText(entry).slice(0, 600);
  const rule = typeof sidecar.rule === "string" ? sidecar.rule : undefined;
  if (listed.has(file)) {
    return verdict.rejected
      ? `${file} is listed as a pass-through but apicity rejects it locally ` +
          `("${verdict.message}"): drop it from passthrough.json and give its ` +
          `sidecar the rule phrase`
      : undefined;
  }
  if (!rule)
    return (
      `${file} is neither caught locally nor listed as a pass-through; the ` +
      `provider said: ${said}`
    );
  if (!verdict.rejected)
    return (
      `${file}: apicity sends this payload, and the provider rejected it ` +
      `with: ${said}. Restate the rule locally (a .refine whose message ` +
      `contains "${rule}") or list the file in passthrough.json with a reason`
    );
  if (!verdict.message.includes(rule))
    return (
      `${file}: rejected locally with "${verdict.message}", which does not ` +
      `contain the sidecar rule "${rule}"; the provider said: ${said}`
    );
  if (verdict.fetched)
    return `${file}: the local rejection came after fetch was called`;
  return undefined;
}

describe("captured payload failures (tests/failures)", () => {
  it("holds failure HARs and a pass-through list", () => {
    expect(harFiles.length).toBeGreaterThan(0);
    expect(Array.isArray(passthrough)).toBe(true);
  });

  it.each(harFiles)(
    "%s is caught locally or listed as a pass-through",
    async (file) => {
      const provider = file.split("/")[0];
      expect(Object.hasOwn(PROVIDERS, provider), file).toBe(true);
      const har = JSON.parse(
        readFileSync(path.join(root, file), "utf8")
      ) as Har;
      const failed = har.log.entries.filter(
        (e) => !exchangeSucceeded(provider, e)
      );
      expect(failed, `${file} must hold one failed exchange`).toHaveLength(1);
      const [entry] = failed;
      expect(entry.request.postData?.text, `${file} sent no body`).toBeTruthy();
      const sidecarPath = path.join(
        root,
        file.replace(/\.har$/, ".expect.json")
      );
      expect(existsSync(sidecarPath), `${file} has no .expect.json`).toBe(true);
      const sidecar = JSON.parse(readFileSync(sidecarPath, "utf8")) as Sidecar;
      expect(typeof sidecar.endpoint, `${file} sidecar endpoint`).toBe(
        "string"
      );
      expect(typeof sidecar.source, `${file} sidecar source`).toBe("string");
      const verdict = await localVerdict(
        provider,
        entry.request.method,
        sidecar.endpoint as string,
        payloadOf(entry)
      );
      expect(problem(file, entry, sidecar, verdict)).toBeUndefined();
    }
  );

  it("lists only existing failure HARs, once each, quoting the provider", () => {
    expect(new Set(passthrough.map((p) => p.file)).size).toBe(
      passthrough.length
    );
    for (const p of passthrough) {
      expect(harFiles, p.file).toContain(p.file);
      expect(p.reason.trim(), `${p.file} reason`).not.toBe("");
      const har = JSON.parse(
        readFileSync(path.join(root, p.file), "utf8")
      ) as Har;
      const texts = har.log.entries.map(providerText);
      const strings = texts.flatMap((text) => {
        try {
          return collectStrings(JSON.parse(text));
        } catch {
          return [];
        }
      });
      expect(
        [...texts, ...strings].some((s) => s.includes(p.providerMessage)),
        `${p.file} providerMessage is not in its response`
      ).toBe(true);
    }
  });

  it("pairs every sidecar with a failure HAR", () => {
    const sidecars = readdirSync(root, { recursive: true })
      .filter((f): f is string => typeof f === "string")
      .filter((f) => f.endsWith(".expect.json"))
      .map((f) =>
        f
          .split(path.sep)
          .join("/")
          .replace(/\.expect\.json$/, ".har")
      );
    for (const file of sidecars) expect(harFiles, file).toContain(file);
  });

  it("passes apicity har scrub --check", async () => {
    let err = "";
    const exit = await runHarCommand(
      ["scrub", "--check", ...harFiles.map((f) => path.join(root, f))],
      { out: () => {}, err: (s) => (err += s) }
    );
    expect(err).toBe("");
    expect(exit).toBe(0);
  });
});

describe("captured-failure verdicts", () => {
  it("runs xai video generation through its runtime validator", async () => {
    const request = {
      model: "grok-imagine-video",
      prompt: "A red panda waves once.",
      reference_images: [{ url: "https://example.com/panda.png" }],
    };
    const rejected = await localVerdict(
      "xai",
      "POST",
      "v1.videos.generations",
      {
        ...request,
        duration: 12,
      }
    );
    expect(rejected).toEqual({
      rejected: true,
      message:
        "duration must be at most 10 seconds for legacy reference-to-video",
      fetched: 0,
    });
    const sent = await localVerdict("xai", "POST", "v1.videos.generations", {
      ...request,
      duration: 8,
    });
    expect(sent).toEqual({ rejected: false, message: "", fetched: 1 });
  });

  it("quotes the provider when a failure is neither caught nor listed", () => {
    const entry = {
      request: { method: "POST", postData: { text: "{}" } },
      response: { content: { text: '{"detail":"Unsupported value"}' } },
    } as unknown as HarEntry;
    expect(
      problem(
        "fal/planted.har",
        entry,
        { endpoint: "x", source: "planted" },
        { rejected: false, message: "", fetched: 0 }
      )
    ).toBe(
      "fal/planted.har is neither caught locally nor listed as a " +
        'pass-through; the provider said: {"detail":"Unsupported value"}'
    );
  });
});

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object")
    return Object.values(value).flatMap(collectStrings);
  return [];
}
