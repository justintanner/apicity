import { afterEach, describe, expect, it, vi } from "vitest";
import { fireworks } from "@apicity/fireworks";

function createJsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("fireworks workflows.kontext", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds the kontext workflow request with the model path and JSON payload", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(createJsonResponse({ request_id: "req-123" }));
    const provider = fireworks({ apiKey: "fw-test-key", fetch: mockFetch });
    const payload = {
      prompt: "Turn this sketch into a watercolor painting",
      input_image: "https://example.com/sketch.png",
      aspect_ratio: "16:9",
      output_format: "png" as const,
      webhook_url: "https://example.com/hooks/fireworks",
      webhook_secret: "hook-secret",
      prompt_upsampling: true,
      safety_tolerance: 2,
      seed: 7,
    };

    const result = await provider.inference.v1.workflows.kontext(
      "flux-kontext-pro",
      payload
    );

    expect(result).toEqual({ request_id: "req-123" });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0];

    expect(url).toBe(
      "https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/flux-kontext-pro"
    );
    expect(init).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer fw-test-key",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ safety_tolerance: 6, ...payload }),
    });
  });

  it("builds getResult requests with the workflow result suffix", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      createJsonResponse({
        id: "req-123",
        status: "Pending",
        result: null,
        progress: 25,
        details: { queue_position: 2 },
      })
    );
    const provider = fireworks({ apiKey: "fw-test-key", fetch: mockFetch });

    const result = await provider.inference.v1.workflows.getResult(
      "flux-kontext-pro",
      {
        id: "req-123",
      }
    );

    expect(result).toMatchObject({
      id: "req-123",
      status: "Pending",
      progress: 25,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0];

    expect(url).toBe(
      "https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/flux-kontext-pro/get_result"
    );
    expect(init).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer fw-test-key",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: "req-123" }),
    });
  });

  it("validates required and enum-mapped kontext fields via Zod schema", () => {
    const provider = fireworks({ apiKey: "fw-test-key" });

    const valid = provider.inference.v1.workflows.kontext.schema.safeParse({
      prompt: "Add warm afternoon lighting",
      output_format: "jpeg",
      prompt_upsampling: false,
    });
    const missingPrompt =
      provider.inference.v1.workflows.kontext.schema.safeParse({});
    const invalidFormat =
      provider.inference.v1.workflows.kontext.schema.safeParse({
        prompt: "Use a film-camera look",
        output_format: "gif",
      });

    expect(valid.success).toBe(true);
    expect(missingPrompt.success).toBe(false);
    expect(
      missingPrompt.error?.issues.some((i) => i.path.includes("prompt"))
    ).toBe(true);
    expect(invalidFormat.success).toBe(false);
    expect(
      invalidFormat.error?.issues.some((i) => i.path.includes("output_format"))
    ).toBe(true);
  });
});
