import { afterEach, describe, expect, it } from "vitest";

import { createEndless } from "@apicity/endless";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("endless social.trends.public integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets the public X trends for worldwide", async () => {
    ctx = setupPolly("endless/trends-worldwide");
    const endless = createEndless();

    const result = await endless.social.trends.public({ region: "worldwide" });

    expect(result.region).toBe("worldwide");
    expect(result.captured_at).toEqual(expect.any(String));
    expect(result.trends.length).toBeGreaterThan(0);
    for (const trend of result.trends) {
      expect(trend.name).toEqual(expect.any(String));
      expect(
        trend.tweet_volume === null || typeof trend.tweet_volume === "number"
      ).toBe(true);
    }
    expect(result.timeline[0]).toMatchObject({
      captured_at: expect.any(String),
      names: expect.any(Array),
    });
    expect(result.longest[0]).toMatchObject({
      name: expect.any(String),
      snapshots: expect.any(Number),
    });
  });
});
