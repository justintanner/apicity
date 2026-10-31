import { afterEach, describe, expect, it } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createXai, XaiError } from "@apicity/xai";

describe("xAI deferred image get integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  // A bogus request id costs nothing: xAI answers 404 not-found, the same
  // body it gives a bogus video request id, so the route is live.
  it("surfaces an unknown request id as XaiError 404", async () => {
    ctx = setupPolly("xai/image-get-not-found");
    const provider = createXai({
      apiKey: process.env.XAI_API_KEY ?? "xai-test-key",
    });

    const err = await provider.get.v1
      .images("00000000-0000-4000-8000-000000000000")
      .then(
        () => undefined,
        (e: unknown) => e
      );

    expect(err).toBeInstanceOf(XaiError);
    expect((err as XaiError).status).toBe(404);
    expect((err as XaiError).body).toMatchObject({ code: "not-found" });
  });
});
