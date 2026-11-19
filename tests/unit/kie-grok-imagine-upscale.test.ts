import { describe, expect, it, vi } from "vitest";
import { KieError } from "@apicity/kie";
import { createKie } from "../../packages/provider/kie/src/kie";
import { modelInputSchemas } from "../../packages/provider/kie/src/model-schemas";
import {
  GrokVideoUpscaleRequestSchema,
  GrokVideoUpscaleResolutionSchema,
  type GrokVideoUpscaleRequest,
} from "../../packages/provider/kie/src/zod";
import { TEST_PAYGATE_SECRET, mintKieCreateTaskOtp } from "../harness";

// grok-imagine/upscale's resolution input, from
// https://docs.kie.ai/market/grok-imagine/upscale.md as read on 2026-11-19
// (ac-xnzcl4): the target resolution, 720p (default) or 1080p. The source is
// the referenced grok-imagine video task's resolution, which the request does
// not carry.
const model = "grok-imagine/upscale";

const parse = (input: Record<string, unknown>) =>
  GrokVideoUpscaleRequestSchema.safeParse({ model, input });

describe("Grok Imagine upscale resolution", () => {
  it("names the two documented targets", () => {
    expect(GrokVideoUpscaleResolutionSchema.options).toEqual(["720p", "1080p"]);
  });

  it("defaults the target to 720p when omitted", () => {
    const result = parse({ task_id: "task_grok_12345678" });
    expect(result.success).toBe(true);
    expect(result.data?.input.resolution).toBe("720p");
  });

  it.each(["720p", "1080p"])("accepts the %s target", (resolution) => {
    const result = parse({ task_id: "task_grok_12345678", resolution });
    expect(result.success).toBe(true);
    expect(result.data?.input.resolution).toBe(resolution);
  });

  it.each(["480p", "1080P", "4k", 1080, null])(
    "rejects the undocumented target %s",
    (resolution) => {
      const result = parse({ task_id: "task_grok_12345678", resolution });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["input", "resolution"]);
    }
  );

  it("still requires task_id", () => {
    expect(parse({ resolution: "1080p" }).success).toBe(false);
  });

  it("describes the target in the model descriptor", () => {
    const fields = modelInputSchemas[model]?.fields;
    expect(fields?.resolution).toMatchObject({
      type: "string",
      enum: ["720p", "1080p"],
    });
    expect(fields?.resolution?.required).toBeUndefined();
    expect(fields?.resolution?.description).toContain("default 720p");
    expect(Object.keys(fields ?? {})).toEqual(["task_id", "resolution"]);
  });
});

describe("Grok Imagine upscale createTask guard", () => {
  const providerWith = (fetch: typeof globalThis.fetch) =>
    createKie({
      apiKey: "test-key",
      baseURL: "https://api.kie.ai",
      fetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });

  it("sends the caller's body unchanged, with or without a target", async () => {
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            code: 200,
            msg: "success",
            data: { taskId: "t" },
          }),
          { status: 200 }
        )
      )
    );
    const provider = providerWith(mockFetch);
    const requests: GrokVideoUpscaleRequest[] = [
      { model, input: { task_id: "task_grok_12345678" } },
      { model, input: { task_id: "task_grok_12345678", resolution: "1080p" } },
    ];
    for (const request of requests) {
      await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );
    }
    expect(mockFetch).toHaveBeenCalledTimes(2);
    for (const [index, [, init]] of mockFetch.mock.calls.entries()) {
      expect(JSON.parse(init.body as string)).toEqual(requests[index]);
    }
  });

  it("rejects an undocumented target before any network call", async () => {
    const mockFetch = vi.fn();
    const provider = providerWith(mockFetch);
    const request = {
      model,
      input: { task_id: "task_grok_12345678", resolution: "480p" },
    } as unknown as GrokVideoUpscaleRequest;
    const rejection = await provider.post.api.v1.jobs
      .createTask(request, mintKieCreateTaskOtp(request))
      .then(
        () => undefined,
        (error: unknown) => error
      );
    expect(rejection).toBeInstanceOf(KieError);
    expect((rejection as KieError).status).toBe(400);
    expect((rejection as KieError).message).toContain("input.resolution");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
