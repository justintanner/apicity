import { afterEach, describe, expect, it } from "vitest";

import { createTiktokCreativeCenter } from "@apicity/tiktok-creative-center";
import type { TiktokCreativeCenterGetTopContentsListRequest } from "@apicity/tiktok-creative-center";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

// The latest weekly list end on 2026-10-28, from Creative Center's overview
// (lastWeeklyEndTimestamp 1792886400 = 2026-10-25T00:00Z).
const THAILAND_WEEK: TiktokCreativeCenterGetTopContentsListRequest = {
  countryCode: "TH",
  periodDimension: 3,
  periodEndTimestamp: 1792886400,
  orderByMetric: 1,
  contentLabelIDs: "",
  page: 1,
  limit: 20,
};

async function expectThailandWeek(organicOnly: boolean): Promise<void> {
  const tcc = createTiktokCreativeCenter();

  const result =
    await tcc.ads.creativeOne.report.creativeCenterGetTopContentsList({
      ...THAILAND_WEEK,
      organicOnly,
    });

  expect(result.BaseResp.StatusCode).toBe(0);
  // Logged out, Creative Center answers page 1 with 4 rows whatever the
  // request asked for.
  expect(result.pagination).toMatchObject({ page: 1, limit: 4 });
  expect(result.entityInfos).toHaveLength(4);
  for (const entity of result.entityInfos ?? []) {
    // Ids above 2^53 come back as strings with every digit.
    expect(entity.itemInfo.itemID).toMatch(/^\d{16,}$/);
    expect(entity.itemInfo.authorID).toMatch(/^\d{16,}$/);
    expect(entity.itemInfo.creatorID).toMatch(/^\d{16,}$/);
    expect(entity.itemMetrics?.videoViews).toEqual(expect.any(Number));
    expect(entity.itemAuthorInfo?.handlerName).toEqual(expect.any(String));
  }
}

describe("tiktok-creative-center ads.creativeOne.report.creativeCenterGetTopContentsList integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("gets the Thailand weekly top videos", async () => {
    ctx = setupPolly("tiktok-creative-center/top-contents-list-th-weekly-all");
    await expectThailandWeek(false);
  });

  it("gets the Thailand weekly top videos without sponsored posts", async () => {
    ctx = setupPolly(
      "tiktok-creative-center/top-contents-list-th-weekly-organic"
    );
    await expectThailandWeek(true);
  });
});
