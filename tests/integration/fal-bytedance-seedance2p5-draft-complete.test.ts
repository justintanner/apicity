import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createFal, FalError } from "@apicity/fal";

// Error-path recording: fal's free validator 422 for an empty draft_id. The
// success recording below completes a real draft (ac-qstko3).
describe("fal bytedance seedance2p5 draft complete integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/bytedance-seedance2p5-draft-complete");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should reject an empty draft_id with a validator 422", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const err = await provider.run.bytedance.seedance2p5.draft
      .complete({ draft_id: "" })
      .then(
        () => undefined,
        (e: unknown) => e
      );

    expect(err).toBeInstanceOf(FalError);
    expect((err as FalError).status).toBe(422);
    const body = (err as FalError).body as {
      detail?: Array<{ type?: string; loc?: unknown[] }>;
    };
    expect(Array.isArray(body.detail)).toBe(true);
    expect(
      body.detail?.some(
        (d) =>
          d.type === "string_too_short" &&
          Array.isArray(d.loc) &&
          d.loc.includes("draft_id")
      )
    ).toBe(true);
  }, 900000);
});

// The completion is chained to the draft that
// fal-bytedance-seedance2p5-text-to-video.test.ts records. A draft_id is bound
// to the caller that generated it and stays valid for seven days, so this test
// reads the id from that recording instead of paying for a second draft. In
// replay it is the committed id, so the request body matches the recording; to
// re-record, record the draft first.
function recordedDraftId(): string {
  const dir = path.resolve(
    import.meta.dirname,
    "..",
    "recordings",
    "fal_2801268556"
  );
  const name = fs
    .readdirSync(dir)
    .find((entry) =>
      entry.startsWith("bytedance-seedance2p5-text-to-video-draft_")
    );
  if (!name) {
    throw new Error(
      "record fal/bytedance-seedance2p5-text-to-video-draft first"
    );
  }
  const har = JSON.parse(
    fs.readFileSync(path.join(dir, name, "recording.har"), "utf8")
  ) as {
    log: { entries: Array<{ response: { content: { text?: string } } }> };
  };
  const body = JSON.parse(
    har.log.entries[0]?.response.content.text ?? "{}"
  ) as { draft_id?: unknown };
  if (typeof body.draft_id !== "string" || body.draft_id === "") {
    throw new Error("the draft recording carries no draft_id");
  }
  return body.draft_id;
}

describe("fal bytedance seedance2p5 draft complete success integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("fal/bytedance-seedance2p5-draft-complete-success");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should complete the recorded draft at 1080p", async () => {
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });

    const result = await provider.run.bytedance.seedance2p5.draft.complete({
      draft_id: recordedDraftId(),
    });

    expect(result.video.url.startsWith("http")).toBe(true);
    expect(typeof result.video.content_type).toBe("string");
    expect(typeof result.seed).toBe("number");
    expect(
      result.draft_id === null ||
        result.draft_id === undefined ||
        typeof result.draft_id === "string"
    ).toBe(true);
  }, 900000);
});
