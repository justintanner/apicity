import { describe, expect, it } from "vitest";
import {
  createKie,
  type GeminiOmniCharacterCreateResponse,
} from "@apicity/kie";
import { GeminiOmniCharacterCreateRequestSchema } from "@apicity/kie/zod";

/**
 * `post.api.v1.omni.character.create` with an injected fetch: no network
 * and no recording (ac-hh2g59). A live call would create a character that
 * persists in the operator's KIE account, and the catalog pricingDesc is
 * null, so the cost is unknown. No answered ask names that endpoint, that
 * unknown cost, and that side effect, so this test does not record a HAR.
 */
const REQUEST = {
  descriptions: "A short person in a red coat, facing the camera.",
  image_urls: ["https://example.com/character.png"],
};

const RESPONSE: GeminiOmniCharacterCreateResponse = {
  code: 200,
  msg: "success",
  data: {
    characterId: "char_test",
    characterName: "Ada",
    imageUrl: "https://example.com/character.png",
  },
};

describe("kie post.api.v1.omni.character.create (injected fetch)", () => {
  it("posts the documented body and returns the documented shape", async () => {
    const seen: {
      url: string;
      method: string;
      body: string;
      auth: string | null;
    }[] = [];
    const provider = createKie({
      apiKey: "test-key",
      fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        seen.push({
          url: String(input),
          method: init?.method ?? "GET",
          body: String(init?.body ?? ""),
          auth: headers.get("authorization"),
        });
        return new Response(JSON.stringify(RESPONSE), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch,
    });

    const leaf = provider.post.api.v1.omni.character.create;
    expect(leaf.schema).toBe(GeminiOmniCharacterCreateRequestSchema);
    expect(leaf.schema.safeParse(REQUEST).success).toBe(true);

    await expect(leaf(REQUEST)).resolves.toEqual(RESPONSE);
    expect(seen).toEqual([
      {
        url: "https://api.kie.ai/api/v1/omni/character/create",
        method: "POST",
        body: JSON.stringify(REQUEST),
        auth: "Bearer test-key",
      },
    ]);
  });
});
