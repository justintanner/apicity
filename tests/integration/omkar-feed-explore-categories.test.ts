import { afterEach, describe, expect, it } from "vitest";

import { createOmkar } from "@apicity/omkar";
import { OmkarExploreCategorySchema } from "@apicity/omkar/zod";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";

describe("omkar feed.explore.categories integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("lists the Explore tabs that feed.explore accepts", async () => {
    ctx = setupPolly("omkar/feed-explore-categories");
    const omkar = createOmkar({
      apiKey: process.env.OMKAR_API_KEY ?? "omkar-test-key",
    });

    const result = await omkar.feed.explore.categories();

    expect(result.category_count).toBe(result.categories.length);
    for (const category of result.categories) {
      expect(category.name).toEqual(expect.any(String));
    }
    // The schema's category enum is the list Omkar answered.
    expect(result.categories.map((category) => category.id)).toEqual(
      OmkarExploreCategorySchema.options
    );
  });
});
