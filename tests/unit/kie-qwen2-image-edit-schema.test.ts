import { describe, expect, it, vi } from "vitest";

import { createKie, KieError, type MediaGenerationRequest } from "@apicity/kie";
import {
  CreateTaskRequestSchema,
  Qwen2ImageEditRequestSchema,
} from "@apicity/kie/zod";

import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import { mintKieCreateTaskOtp, TEST_PAYGATE_SECRET } from "../harness";

const VALID_INPUT = {
  prompt: "replace the sky with a sunset",
  image_url: "@asset/photo.png",
} as const;
const OMITTED_SEED = Symbol("omitted seed");
const SEED_CASES = [
  { label: "omitted", seed: OMITTED_SEED, accepted: true },
  { label: "zero", seed: 0, accepted: true },
  { label: "positive integer", seed: 42, accepted: true },
  { label: "negative integer", seed: -1, accepted: true },
  {
    label: "integer above the safe range",
    seed: Number.MAX_SAFE_INTEGER + 1,
    accepted: true,
  },
  {
    label: "integer below the safe range",
    seed: Number.MIN_SAFE_INTEGER - 1,
    accepted: true,
  },
  { label: "fraction", seed: 0.5, accepted: false },
  { label: "numeric string", seed: "1", accepted: false },
] as const;

function imageEditRequest(seed: (typeof SEED_CASES)[number]["seed"]) {
  return {
    model: "qwen2/image-edit",
    input: {
      ...VALID_INPUT,
      ...(seed === OMITTED_SEED ? {} : { seed }),
    },
  };
}

// The request schema validates the construction boundary: media fields may
// still hold not-yet-uploaded local slugs (kie.ai enforces URL reachability
// server-side at task-creation time). `.min(1)` keeps the empty string
// rejected and the field required.
describe("qwen2/image-edit request schema", () => {
  it("accepts a local slug in input.image_url", () => {
    const result = Qwen2ImageEditRequestSchema.safeParse({
      model: "qwen2/image-edit",
      input: VALID_INPUT,
    });
    expect(result.success).toBe(true);
  });

  it.each(SEED_CASES)(
    "$label has the same direct and public schema outcome",
    ({ seed, accepted }) => {
      const request = imageEditRequest(seed);
      const direct = Qwen2ImageEditRequestSchema.safeParse(request);
      const publicResult = CreateTaskRequestSchema.safeParse(request);

      expect(direct.success).toBe(accepted);
      expect(publicResult.success).toBe(direct.success);
      if (!direct.success || !publicResult.success) return;

      if (seed === OMITTED_SEED) {
        expect(direct.data.input).not.toHaveProperty("seed");
        expect(publicResult.data.input).not.toHaveProperty("seed");
      } else {
        expect(direct.data.input.seed).toBe(seed);
        expect(publicResult.data).toMatchObject({ input: { seed } });
      }
    }
  );

  it("rejects a fractional seed before transport", async () => {
    const mockFetch = vi.fn<typeof globalThis.fetch>(async () => {
      throw new Error("fractional seed must not reach fetch");
    });
    const provider = createKie({
      apiKey: "test-key",
      fetch: mockFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    const request = {
      model: "qwen2/image-edit",
      input: { ...VALID_INPUT, seed: 0.5 },
    } satisfies MediaGenerationRequest;

    const rejection: unknown = await provider.post.api.v1.jobs
      .createTask(request, mintKieCreateTaskOtp(request))
      .catch((error: unknown) => error);

    expect(rejection).toBeInstanceOf(KieError);
    if (!(rejection instanceof KieError)) throw rejection;
    expect(rejection.status).toBe(400);
    expect(rejection.body).toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ path: ["input", "seed"] }),
      ]),
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("describes the discovery seed as an integer", () => {
    expect(modelInputSchemas["qwen2/image-edit"].fields.seed.type).toBe(
      "integer"
    );
  });

  it("rejects an empty input.image_url", () => {
    const result = Qwen2ImageEditRequestSchema.safeParse({
      model: "qwen2/image-edit",
      input: {
        prompt: "replace the sky with a sunset",
        image_url: "",
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing input.image_url", () => {
    const result = Qwen2ImageEditRequestSchema.safeParse({
      model: "qwen2/image-edit",
      input: {
        prompt: "replace the sky with a sunset",
      },
    });
    expect(result.success).toBe(false);
  });
});
