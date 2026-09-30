import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createKie } from "@apicity/kie";

// The committed listing the enum is filled from (REQ-007 of ac-wma4p9).
// Only HTTP-200 entries whose body carries a `data` array count.
const LISTING = path.resolve(
  __dirname,
  "../recordings/kie_2079838932/openai-models_1708814780/recording.har"
);

function listingIds(): string[] {
  const har = JSON.parse(readFileSync(LISTING, "utf8")) as {
    log: {
      entries: {
        response: { status: number; content: { text?: string } };
      }[];
    };
  };
  const ids: string[] = [];
  const add = (id: string) => {
    if (!ids.includes(id)) ids.push(id);
  };
  for (const entry of har.log.entries) {
    if (entry.response.status !== 200) continue;
    const body = JSON.parse(entry.response.content.text ?? "null") as {
      data?: { id: string }[];
      models?: { slug: string }[];
    } | null;
    if (!body || !Array.isArray(body.data)) continue;
    for (const model of body.models ?? []) add(model.slug);
    for (const model of body.data) add(model.id);
  }
  return ids;
}

function parse(model: unknown) {
  return createKie({ apiKey: "x" }).post.openai.v1.responses.schema.safeParse({
    model,
    input: "ping",
  });
}

describe("openai.v1.responses accepts the Codex listing (REQ-008)", () => {
  it("parses every models[].slug and data[].id the listing returned", () => {
    const ids = listingIds();
    expect(ids.length).toBeGreaterThan(0);
    for (const model of ids) {
      expect(parse(model).success, model).toBe(true);
    }
  });

  it("still parses the two documented ids", () => {
    expect(parse("kimi-k3").success).toBe(true);
    expect(parse("deepseek-v4-1-flash").success).toBe(true);
  });

  it.each(["gpt-five", "gpt-", "grok-4-6"])("still rejects %s", (model) => {
    expect(parse(model).success).toBe(false);
  });
});
