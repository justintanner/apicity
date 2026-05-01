import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  recordingExists,
  type PollyContext,
} from "../harness";
import { ig } from "@apicity/ig";

const recordingName = "ig/media-publish";

describe("ig post.v25.mediaPublish", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("publishes a finished container and returns the post id", async () => {
    if (getPollyMode() === "replay" && !recordingExists(recordingName)) {
      return;
    }

    ctx = setupPolly(recordingName);

    const provider = ig({
      accessToken: process.env.IG_ACCESS_TOKEN ?? "ig-test-token",
    });

    const igUserId = process.env.IG_USER_ID ?? "17841400000000000";
    const containerId = process.env.IG_TEST_CONTAINER_ID ?? "17841400000000000";

    const res = await provider.post.v25.mediaPublish(igUserId, {
      creation_id: containerId,
    });

    expect(typeof res.id).toBe("string");
    expect(res.id).toMatch(/^[0-9]+$/);
  });

  it("exposes a Zod schema with safeParse", () => {
    const provider = ig({ accessToken: "ig-test-token" });
    const endpoint = provider.post.v25.mediaPublish;
    expect(endpoint.schema).toBeDefined();
    expect(typeof endpoint.schema.safeParse).toBe("function");

    const valid = endpoint.schema.safeParse({
      creation_id: "17841400000000000",
    });
    expect(valid.success).toBe(true);

    // creation_id must be a numeric string
    const badId = endpoint.schema.safeParse({
      creation_id: "not-numeric",
    });
    expect(badId.success).toBe(false);

    // creation_id is required
    const missing = endpoint.schema.safeParse({});
    expect(missing.success).toBe(false);
  });
});
