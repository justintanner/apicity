import { describe, it, expect } from "vitest";

import {
  HappyHorse11TextToVideoRequestSchema,
  type HappyHorse11TextToVideoParsedRequest,
  type HappyHorse11TextToVideoRequestInput,
} from "@apicity/kie";
import type { XUsersMeParsedRequest, XUsersMeRequestInput } from "@apicity/x";
import { XUsersMeRequestSchema } from "@apicity/x/zod";

describe("request input aliases", () => {
  it("keeps defaulted request inputs optional while parsed aliases materialize defaults", () => {
    const input = {
      model: "happyhorse-1-1/text-to-video",
      input: {
        prompt: "a paper boat crossing a quiet pond",
      },
    } satisfies HappyHorse11TextToVideoRequestInput;

    const parsed: HappyHorse11TextToVideoParsedRequest =
      HappyHorse11TextToVideoRequestSchema.parse(input);

    expect(parsed.input.resolution).toBe("1080p");
    expect(parsed.input.aspect_ratio).toBe("16:9");
    expect(parsed.input.duration).toBe(5);
  });

  it("exposes X users/me request input and parsed aliases", () => {
    const input = {
      "user.fields": ["username", "name"],
    } satisfies XUsersMeRequestInput;

    const parsed: XUsersMeParsedRequest = XUsersMeRequestSchema.parse(input);

    expect(parsed["user.fields"]).toEqual(["username", "name"]);
  });
});
