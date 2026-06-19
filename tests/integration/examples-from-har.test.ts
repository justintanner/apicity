import { describe, expect, test } from "vitest";
import fs from "node:fs";
import { createOpenAi } from "@apicity/openai";
import { createAlibaba } from "@apicity/alibaba";
import { createXai } from "@apicity/xai";
import { createFal } from "@apicity/fal";
import { createFireworks } from "@apicity/fireworks";
import { findMatchingRow } from "../../scripts/lib/match-har-to-endpoint.mjs";

interface EndpointDocRow {
  provider: string;
  dotPath: string;
  method: string;
  fullUrl: string;
  docsUrl: string;
}

interface HarEntry {
  request: {
    method: string;
    url: string;
  };
}

function loadEndpointDocRows(): EndpointDocRow[] {
  return fs
    .readFileSync("scripts/endpoint-docs.tsv", "utf-8")
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const [provider, dotPath, method, fullUrl, docsUrl = ""] =
        line.split("\t");
      return { provider, dotPath, method, fullUrl, docsUrl };
    });
}

function loadFirstHarEntry(path: string): HarEntry {
  const har = JSON.parse(fs.readFileSync(path, "utf-8")) as {
    log: { entries: HarEntry[] };
  };
  return har.log.entries[0];
}

// Replay-safe: no Polly, no network. These tests verify that the
// HAR-derived examples extracted by `pnpm run gen:examples` end up
// attached to endpoint functions at runtime and pass schema validation.
describe("HAR-derived examples on endpoints", () => {
  test("openai chat completions has the chat-hello payload attached", () => {
    const client = createOpenAi({ apiKey: "test-key" });
    const ex = client.post.v1.chat.completions.example;
    expect(ex).toBeDefined();
    expect(ex?.source).toBe("openai/chat-hello");
    expect(ex?.payload).toMatchObject({
      model: expect.any(String),
      messages: expect.any(Array),
    });
  });

  test("an example payload validates against its endpoint's schema", () => {
    const client = createOpenAi({ apiKey: "test-key" });
    const fn = client.post.v1.chat.completions;
    const example = fn.example;
    const schema = fn.schema;
    expect(example).toBeDefined();
    expect(schema).toBeDefined();
    const result = (
      schema as { safeParse: (v: unknown) => { success: boolean } }
    ).safeParse(example?.payload);
    expect(result.success).toBe(true);
  });

  test("alibaba multimodal generation preserves real upstream quirks", () => {
    // The Alibaba payload nests `input.messages` and uses the qwen-image-edit
    // shape. This sanity-checks that the extractor picks a faithful payload
    // and didn't strip out distinguishing fields.
    const client = createAlibaba({ apiKey: "test-key" });
    const ex =
      client.post.api.v1.services.aigc.multimodalGeneration.generation.example;
    expect(ex).toBeDefined();
    const payload = ex?.payload as Record<string, unknown>;
    expect(payload).toHaveProperty("model");
    expect(payload).toHaveProperty("input.messages");
  });

  test("xai chat completions gets a green-path example via the lenient matcher", () => {
    const client = createXai({ apiKey: "test-key" });
    const ex = client.post.v1.chat.completions.example;
    expect(ex).toBeDefined();
    expect(ex?.source).toBe("xai/chat-hello");
  });

  test("xai documents search example validates against its endpoint schema", () => {
    const client = createXai({ apiKey: "test-key" });
    const fn = client.post.v1.documents.search;
    const ex = fn.example;
    expect(ex).toBeDefined();
    expect(ex?.source).toBe("xai/documents-search");
    const result = fn.schema.safeParse(ex?.payload);
    expect(result.success).toBe(true);
  });

  test("fal veo3.1 image-to-video keeps its image payload", () => {
    const client = createFal({ apiKey: "test-key" });
    const ex = client.run.veo3p1.imageToVideo.example;
    expect(ex).toBeDefined();
    expect(ex?.source).toBe("fal/veo3-1-image-to-video");
    expect(ex?.payload).toMatchObject({
      image_url: expect.any(String),
    });
  });

  test("fireworks RLOR trainer list HAR maps to its endpoint doc row", () => {
    const entry = loadFirstHarEntry(
      "tests/recordings/fireworks_626462085/" +
        "rlor-trainer-jobs-list_3865226960/recording.har"
    );
    const row = findMatchingRow(entry, loadEndpointDocRows(), {
      provider: "fireworks",
    }) as EndpointDocRow | null;

    expect(row?.dotPath).toBe("inference.v1.accounts.rlorTrainerJobs.list");
    expect(row?.fullUrl).toBe(
      "https://api.fireworks.ai/v1/accounts/{accountId}/rlorTrainerJobs"
    );
  });

  test("fireworks RFT jobs list uses its bodyless HAR as coverage", () => {
    const client = createFireworks({ apiKey: "test-key" });
    const ex =
      client.inference.v1.accounts.reinforcementFineTuningJobs.list.example;
    expect(ex).toBeDefined();
    expect(ex?.source).toBe("fireworks/rft-jobs-list");
    expect(ex?.payload).toEqual({});
  });
});
