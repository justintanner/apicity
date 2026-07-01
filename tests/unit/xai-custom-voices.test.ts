import { describe, expect, it, vi } from "vitest";

import { createXai } from "../../packages/provider/xai/src/xai";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function audioResponse(bytes: Uint8Array): Response {
  return new Response(bytes, {
    status: 200,
    headers: { "Content-Type": "audio/wav" },
  });
}

describe("xAI custom voices endpoint wiring", () => {
  it("creates custom voices as multipart form data", async () => {
    const responseBody = {
      voice_id: "nlbqfwie",
      name: "Friendly Narrator",
      language: "en",
      tone: "warm",
    };
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse(responseBody));
    const provider = createXai({ apiKey: "xai-test", fetch: mockFetch });
    const file = new Blob([new Uint8Array([1, 2, 3])], {
      type: "audio/wav",
    });

    const result = await provider.post.v1.customVoices({
      file,
      filename: "reference.wav",
      name: "Friendly Narrator",
      description: "Warm, conversational tone for narration.",
      gender: "female",
      accent: "American",
      age: "young",
      language: "en",
      use_case: "narration",
      tone: "warm",
    });

    expect(result).toEqual(responseBody);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.x.ai/v1/custom-voices");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer xai-test",
    });
    expect(init.headers).not.toMatchObject({
      "Content-Type": expect.any(String),
    });
    const form = init.body as FormData;
    expect(form.get("name")).toBe("Friendly Narrator");
    expect(form.get("description")).toBe(
      "Warm, conversational tone for narration."
    );
    expect(form.get("gender")).toBe("female");
    expect(form.get("accent")).toBe("American");
    expect(form.get("age")).toBe("young");
    expect(form.get("language")).toBe("en");
    expect(form.get("use_case")).toBe("narration");
    expect(form.get("tone")).toBe("warm");
    expect(form.get("file")).toBeInstanceOf(Blob);
  });

  it("lists and retrieves custom voices from the inference API", async () => {
    const listBody = {
      voices: [{ voice_id: "nlbqfwie", name: "Friendly Narrator" }],
      pagination_token: null,
    };
    const getBody = {
      voice_id: "voice1234",
      name: "Support Voice",
    };
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(listBody))
      .mockResolvedValueOnce(jsonResponse(getBody));
    const provider = createXai({ apiKey: "xai-test", fetch: mockFetch });

    await expect(
      provider.get.v1.customVoices({
        limit: 50,
        pagination_token: "next-page",
      })
    ).resolves.toEqual(listBody);
    await expect(provider.get.v1.customVoices("voice/1234")).resolves.toEqual(
      getBody
    );

    const [listUrl, listInit] = mockFetch.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(listUrl).toBe(
      "https://api.x.ai/v1/custom-voices?limit=50&pagination_token=next-page"
    );
    expect(listInit.method).toBe("GET");

    const [getUrl, getInit] = mockFetch.mock.calls[1] as [string, RequestInit];
    expect(getUrl).toBe("https://api.x.ai/v1/custom-voices/voice%2F1234");
    expect(getInit.method).toBe("GET");
  });

  it("updates metadata, downloads reference audio, and deletes voices", async () => {
    const updatedBody = {
      voice_id: "nlbqfwie",
      description: "Updated after a tuning pass.",
      tone: "calm",
    };
    const audioBytes = new Uint8Array([1, 2, 3, 4]);
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(updatedBody))
      .mockResolvedValueOnce(audioResponse(audioBytes))
      .mockResolvedValueOnce(jsonResponse({ deleted: true }));
    const provider = createXai({ apiKey: "xai-test", fetch: mockFetch });

    await expect(
      provider.patch.v1.customVoices("voice/1234", {
        description: "Updated after a tuning pass.",
        tone: "calm",
      })
    ).resolves.toEqual(updatedBody);
    await expect(
      provider.get.v1.customVoices.audio("voice/1234")
    ).resolves.toEqual(audioBytes.buffer);
    await expect(
      provider.delete.v1.customVoices("voice/1234")
    ).resolves.toEqual({ deleted: true });

    const [patchUrl, patchInit] = mockFetch.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(patchUrl).toBe("https://api.x.ai/v1/custom-voices/voice%2F1234");
    expect(patchInit.method).toBe("PATCH");
    expect(patchInit.headers).toMatchObject({
      Authorization: "Bearer xai-test",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(patchInit.body as string)).toEqual({
      description: "Updated after a tuning pass.",
      tone: "calm",
    });

    const [audioUrl, audioInit] = mockFetch.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(audioUrl).toBe(
      "https://api.x.ai/v1/custom-voices/voice%2F1234/audio"
    );
    expect(audioInit.method).toBe("GET");

    const [deleteUrl, deleteInit] = mockFetch.mock.calls[2] as [
      string,
      RequestInit,
    ];
    expect(deleteUrl).toBe("https://api.x.ai/v1/custom-voices/voice%2F1234");
    expect(deleteInit.method).toBe("DELETE");
  });

  it("validates documented create and update payload fields", () => {
    const provider = createXai({ apiKey: "xai-test" });

    const fileOnly = provider.post.v1.customVoices.schema.safeParse({
      file: new Blob([new Uint8Array([0])], { type: "audio/mpeg" }),
    });
    expect(fileOnly.success).toBe(true);

    const invalidCreate = provider.post.v1.customVoices.schema.safeParse({
      file: new Blob([new Uint8Array([0])], { type: "audio/mpeg" }),
      gender: "robot",
    });
    expect(invalidCreate.success).toBe(false);

    const clearMetadata = provider.patch.v1.customVoices.schema.safeParse({
      description: null,
      tone: "calm",
    });
    expect(clearMetadata.success).toBe(true);

    const emptyString = provider.patch.v1.customVoices.schema.safeParse({
      description: "",
    });
    expect(emptyString.success).toBe(false);
  });
});
