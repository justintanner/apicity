import { afterEach, describe, expect, it } from "vitest";

import { createTiktokCreativeCenter } from "@apicity/tiktok-creative-center";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("tiktok-creative-center ads.creativeOne.report.getTopContentsOverview integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets the latest daily, weekly and monthly list ends", async () => {
    ctx = setupPolly("tiktok-creative-center/top-contents-overview");
    const tcc = createTiktokCreativeCenter();

    const overview = await tcc.ads.creativeOne.report.getTopContentsOverview();

    expect(overview.BaseResp.StatusCode).toBe(0);
    for (const end of [
      overview.lastDailyEndTimestamp,
      overview.lastWeeklyEndTimestamp,
      overview.lastMonthlyEndTimestamp,
    ]) {
      // Unix seconds at a UTC midnight.
      expect(end).toEqual(expect.any(Number));
      expect((end ?? 1) % 86_400).toBe(0);
    }
    expect(overview.lastMonthlyEndTimestamp).toBeLessThanOrEqual(
      overview.lastWeeklyEndTimestamp ?? 0
    );
  });
});
