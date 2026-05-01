import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  teardownPolly,
  getPollyMode,
  recordingExists,
  type PollyContext,
} from "../harness";
import { ig } from "@apicity/ig";

const recordingName = "ig/container-status";

describe("ig get.v25.container", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) {
      await teardownPolly(ctx);
      ctx = undefined;
    }
  });

  it("returns status_code and status for a container", async () => {
    if (getPollyMode() === "replay" && !recordingExists(recordingName)) {
      return;
    }

    ctx = setupPolly(recordingName);

    const provider = ig({
      accessToken: process.env.IG_ACCESS_TOKEN ?? "ig-test-token",
    });

    const containerId = process.env.IG_TEST_CONTAINER_ID ?? "17841400000000000";
    const res = await provider.get.v25.container(containerId, {
      fields: "status_code,status",
    });

    expect(res.id).toBe(containerId);
    expect([
      "EXPIRED",
      "ERROR",
      "FINISHED",
      "IN_PROGRESS",
      "PUBLISHED",
    ]).toContain(res.status_code);
  });

  it("exposes the container method", () => {
    const provider = ig({ accessToken: "ig-test-token" });
    expect(typeof provider.get.v25.container).toBe("function");
  });
});
