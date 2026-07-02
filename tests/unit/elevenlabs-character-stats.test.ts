import { describe, expect, it, vi } from "vitest";

import { createElevenLabs } from "../../packages/provider/elevenlabs/src";
import { ElevenLabsUsageCharacterStatsRequestSchema } from "../../packages/provider/elevenlabs/src/zod";

describe("ElevenLabs character usage stats endpoint", () => {
  it("gets character stats with required unix query parameters", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          time: [1738252091000, 1739404800000],
          usage: {
            All: [49, 1053],
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
    const provider = createElevenLabs({
      apiKey: "el-test",
      baseURL: "https://api.elevenlabs.io",
      fetch: mockFetch,
    });

    const result = await provider.v1.usage.characterStats({
      start_unix: 1685574000,
      end_unix: 1688165999,
    });

    expect(result).toEqual({
      time: [1738252091000, 1739404800000],
      usage: {
        All: [49, 1053],
      },
    });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://api.elevenlabs.io/v1/usage/character-stats?start_unix=1685574000&end_unix=1688165999"
    );
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({
      "xi-api-key": "el-test",
    });
    expect(init.body).toBeUndefined();
    expect(provider.get.v1.usage.characterStats).toBe(
      provider.v1.usage.characterStats
    );
    expect(provider.v1.usage.characterStats.schema).toBe(
      ElevenLabsUsageCharacterStatsRequestSchema
    );
  });

  it("validates required integer query parameters", () => {
    expect(
      ElevenLabsUsageCharacterStatsRequestSchema.safeParse({
        start_unix: 1685574000,
        end_unix: 1688165999,
      }).success
    ).toBe(true);
    expect(
      ElevenLabsUsageCharacterStatsRequestSchema.safeParse({
        start_unix: 1685574000,
      }).success
    ).toBe(false);
    expect(
      ElevenLabsUsageCharacterStatsRequestSchema.safeParse({
        start_unix: "1685574000",
        end_unix: 1688165999,
      }).success
    ).toBe(false);
  });
});
