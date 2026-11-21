import { describe, expect, it } from "vitest";
import {
  createGoogle,
  GoogleError,
  GoogleGenerateContentRequestSchema,
  GoogleImageConfigSchema,
  GoogleThinkingConfigSchema,
} from "@apicity/google";

describe("Google Nano Banana 2.1 schemas and global project route", () => {
  it("accepts all 14 Nano Banana 2.1 aspect ratios and 1K/2K/4K sizes", () => {
    for (const aspectRatio of [
      "1:1",
      "2:3",
      "3:2",
      "3:4",
      "4:3",
      "1:4",
      "4:1",
      "4:5",
      "5:4",
      "1:8",
      "8:1",
      "9:16",
      "16:9",
      "21:9",
    ] as const) {
      expect(
        GoogleImageConfigSchema.safeParse({
          aspectRatio,
          imageSize: "1K",
          personGeneration: "ALLOW_ALL",
          prominentPeople: "ALLOW_PROMINENT_PEOPLE",
          imageOutputOptions: { mimeType: "image/png" },
        }).success
      ).toBe(true);
    }

    for (const imageSize of ["1K", "2K", "4K"] as const) {
      expect(GoogleImageConfigSchema.safeParse({ imageSize }).success).toBe(
        true
      );
    }
  });

  it("rejects unsupported image sizes and aspect ratios", () => {
    expect(
      GoogleImageConfigSchema.safeParse({ imageSize: "512" }).success
    ).toBe(false);
    expect(GoogleImageConfigSchema.safeParse({ imageSize: "8K" }).success).toBe(
      false
    );
    expect(
      GoogleImageConfigSchema.safeParse({ aspectRatio: "16:10" }).success
    ).toBe(false);
  });

  it("parses responseModalities, imageConfig, and thinkingConfig", () => {
    const parsed = GoogleGenerateContentRequestSchema.safeParse({
      contents: [{ role: "user", parts: [{ text: "A red origami crane" }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
        thinkingConfig: { thinkingLevel: "MINIMAL", includeThoughts: false },
      },
    });
    expect(parsed.success).toBe(true);
    expect(
      GoogleThinkingConfigSchema.safeParse({ thinkingLevel: "EXTREME" }).success
    ).toBe(false);
  });

  it("routes project-scoped global generateContent calls to locations/global", async () => {
    let calledUrl = "";
    const google = createGoogle({
      apiKey: "test-key",
      fetch: (async (input: string | URL | Request) => {
        calledUrl = String(
          typeof input === "string" || input instanceof URL ? input : input.url
        );
        return new Response(JSON.stringify({ candidates: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }) as typeof fetch,
    });

    await google.v1.projects.locations.global.publishers.google.models.generateContent(
      "my-project",
      "gemini-nano-banana-2.1",
      {
        contents: [{ role: "user", parts: [{ text: "A red origami crane" }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
        },
      }
    );

    expect(calledUrl).toBe(
      "https://aiplatform.googleapis.com/v1/projects/my-project/locations/global/publishers/google/models/gemini-nano-banana-2.1:generateContent"
    );
  });

  it("enforces the 14 input-image limit for gemini-nano-banana-2.1 before fetch", async () => {
    let called = false;
    const google = createGoogle({
      apiKey: "test-key",
      fetch: (async () => {
        called = true;
        return new Response(JSON.stringify({ candidates: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }) as typeof fetch,
    });

    const imagePart = {
      inlineData: { mimeType: "image/png", data: "AAAA" },
    };

    // 14 images succeeds and invokes fetch.
    await expect(
      google.v1.projects.locations.global.publishers.google.models.generateContent(
        "my-project",
        "gemini-nano-banana-2.1",
        {
          contents: [
            {
              role: "user",
              parts: [
                { text: "Combine these" },
                ...Array.from({ length: 14 }, () => imagePart),
              ],
            },
          ],
        }
      )
    ).resolves.toEqual({ candidates: [] });
    expect(called).toBe(true);

    // 15 images fails pre-fetch with GoogleError 400.
    called = false;
    await expect(
      google.v1.projects.locations.global.publishers.google.models.generateContent(
        "my-project",
        "gemini-nano-banana-2.1",
        {
          contents: [
            {
              role: "user",
              parts: [
                { text: "Combine these" },
                ...Array.from({ length: 15 }, () => imagePart),
              ],
            },
          ],
        }
      )
    ).rejects.toMatchObject({
      name: "GoogleError",
      status: 400,
    } satisfies Partial<GoogleError>);
    expect(called).toBe(false);
  });
});
