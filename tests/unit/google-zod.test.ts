import { describe, expect, it } from "vitest";
import {
  createGoogle,
  GOOGLE_INTERACTION_MODELS,
  GoogleError,
  GoogleGenerateContentRequestSchema,
  GoogleImageConfigSchema,
  GoogleInteractionCreateRequestSchema,
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

describe("Google Vertex Interactions API schemas and global routes", () => {
  it("lists Gemini Omni 1.2 and 1.1 Flash in GOOGLE_INTERACTION_MODELS", () => {
    expect(GOOGLE_INTERACTION_MODELS).toContain("gemini-omni-1.2-flash");
    expect(GOOGLE_INTERACTION_MODELS).toContain(
      "gemini-omni-1.1-flash-preview"
    );
  });

  it("validates Gemini Omni 1.2/1.1 video generation, edit, delivery, and limit rules", () => {
    // Minimal 1.2 T2V inline 3s 360p
    expect(
      GoogleInteractionCreateRequestSchema.safeParse({
        model: "gemini-omni-1.2-flash",
        store: false,
        input: [
          {
            type: "user_input",
            content: [{ type: "text", text: "A red paper boat on a pond." }],
          },
        ],
        response_format: [
          {
            type: "video",
            delivery: "inline",
            aspect_ratio: "16:9",
            resolution: "360p",
            duration: "3s",
          },
        ],
      }).success
    ).toBe(true);

    // 1.2 accepts 15s; rejects 16s and 2s
    expect(
      GoogleInteractionCreateRequestSchema.safeParse({
        model: "gemini-omni-1.2-flash",
        input: "A sunset",
        response_format: [
          { type: "video", delivery: "inline", duration: "15s" },
        ],
      }).success
    ).toBe(true);
    expect(
      GoogleInteractionCreateRequestSchema.safeParse({
        model: "gemini-omni-1.2-flash",
        input: "A sunset",
        response_format: [
          { type: "video", delivery: "inline", duration: "16s" },
        ],
      }).success
    ).toBe(false);
    expect(
      GoogleInteractionCreateRequestSchema.safeParse({
        model: "gemini-omni-1.2-flash",
        input: "A sunset",
        response_format: [
          { type: "video", delivery: "inline", duration: "2s" },
        ],
      }).success
    ).toBe(false);

    // 1.1 preview accepts 10s; rejects 11s
    expect(
      GoogleInteractionCreateRequestSchema.safeParse({
        model: "gemini-omni-1.1-flash-preview",
        input: "A sunset",
        response_format: [
          { type: "video", delivery: "inline", duration: "10s" },
        ],
      }).success
    ).toBe(true);
    expect(
      GoogleInteractionCreateRequestSchema.safeParse({
        model: "gemini-omni-1.1-flash-preview",
        input: "A sunset",
        response_format: [
          { type: "video", delivery: "inline", duration: "11s" },
        ],
      }).success
    ).toBe(false);

    // delivery="uri" requires gcs_uri; delivery="inline" forbids gcs_uri
    expect(
      GoogleInteractionCreateRequestSchema.safeParse({
        model: "gemini-omni-1.2-flash",
        input: "A sunset",
        response_format: [{ type: "video", delivery: "uri" }],
      }).success
    ).toBe(false);
    expect(
      GoogleInteractionCreateRequestSchema.safeParse({
        model: "gemini-omni-1.2-flash",
        input: "A sunset",
        response_format: [
          { type: "video", delivery: "uri", gcs_uri: "gs://bucket/out/" },
        ],
      }).success
    ).toBe(true);
    expect(
      GoogleInteractionCreateRequestSchema.safeParse({
        model: "gemini-omni-1.2-flash",
        input: "A sunset",
        response_format: [
          { type: "video", delivery: "inline", gcs_uri: "gs://bucket/out/" },
        ],
      }).success
    ).toBe(false);

    // v1 rejects flat Content blocks at input[0] (must wrap in user_input step)
    expect(
      GoogleInteractionCreateRequestSchema.safeParse({
        model: "gemini-omni-1.2-flash",
        input: [{ type: "text", text: "A sunset" }],
      }).success
    ).toBe(false);

    // Unsupported system_instruction, tools, >10 images, >3 videos rejected
    expect(
      GoogleInteractionCreateRequestSchema.safeParse({
        model: "gemini-omni-1.2-flash",
        input: "A sunset",
        system_instruction: "Be cinematic",
      }).success
    ).toBe(false);
    expect(
      GoogleInteractionCreateRequestSchema.safeParse({
        model: "gemini-omni-1.2-flash",
        input: [
          {
            type: "user_input",
            content: Array.from({ length: 11 }, () => ({
              type: "image" as const,
              data: "AAAA",
              mime_type: "image/jpeg" as const,
            })),
          },
        ],
      }).success
    ).toBe(false);
    expect(
      GoogleInteractionCreateRequestSchema.safeParse({
        model: "gemini-omni-1.1-flash-preview",
        input: [
          {
            type: "user_input",
            content: Array.from({ length: 4 }, () => ({
              type: "video" as const,
              data: "AAAA",
              mime_type: "video/mp4" as const,
            })),
          },
        ],
      }).success
    ).toBe(false);
  });

  it("routes POST/GET interactions with OAuth2 Bearer auth and parses string error codes", async () => {
    const calls: Array<{ url: string; method?: string; auth?: string | null }> =
      [];
    const google = createGoogle({
      apiKey: "unused-api-key",
      oauthToken: "oauth-token-123",
      fetch: (async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(
          typeof input === "string" || input instanceof URL ? input : input.url
        );
        const headers = new Headers(init?.headers);
        calls.push({
          url,
          method: init?.method,
          auth: headers.get("authorization"),
        });
        if (url.endsWith("/missing-id")) {
          return new Response(
            JSON.stringify({
              error: {
                message: "Requested entity was not found.",
                code: "not_found",
              },
            }),
            { status: 404, headers: { "content-type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ id: "int-1", status: "completed" }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }) as typeof fetch,
    });

    const created = await google.v1.projects.locations.global.interactions(
      "my-project",
      {
        model: "gemini-omni-1.2-flash",
        store: false,
        input: "A boat on a pond",
      }
    );
    expect(created).toEqual({ id: "int-1", status: "completed" });

    const fetched = await google.get.v1.projects.locations.global.interactions(
      "my-project",
      "int-1"
    );
    expect(fetched).toEqual({ id: "int-1", status: "completed" });

    await expect(
      google.get.v1.projects.locations.global.interactions(
        "my-project",
        "missing-id"
      )
    ).rejects.toMatchObject({
      name: "GoogleError",
      status: 404,
      code: "not_found",
    } satisfies Partial<GoogleError>);

    expect(calls[0]).toEqual({
      url: "https://aiplatform.googleapis.com/v1/projects/my-project/locations/global/interactions",
      method: "POST",
      auth: "Bearer oauth-token-123",
    });
    expect(calls[1]).toEqual({
      url: "https://aiplatform.googleapis.com/v1/projects/my-project/locations/global/interactions/int-1",
      method: "GET",
      auth: "Bearer oauth-token-123",
    });
  });
});
