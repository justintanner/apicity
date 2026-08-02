import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  createKie,
  type GrokVideoExtendRequestInput,
  type MediaGenerationRequest,
} from "@apicity/kie";
import { GrokVideoExtendRequestSchema } from "@apicity/kie/zod";
import { TEST_PAYGATE_SECRET, mintKieCreateTaskOtp } from "../../harness";

const baseInput = {
  task_id: "completed-480p-task",
  prompt: "Continue the scene with a gentle camera drift.",
};

const typedFixtures = [
  {
    model: "grok-imagine/extend",
    resolution: "480p",
    input: { ...baseInput, extend_at: 0, extend_times: "6" },
  } satisfies GrokVideoExtendRequestInput,
  {
    model: "grok-imagine/extend",
    resolution: "720p",
    input: { ...baseInput, extend_at: 2.5, extend_times: "10" },
  } satisfies GrokVideoExtendRequestInput,
] satisfies MediaGenerationRequest[];

function rawRequest(
  extendAt: unknown,
  extendTimes: unknown,
  includeExtendAt = true
): Record<string, unknown> {
  return {
    model: "grok-imagine/extend",
    resolution: "480p",
    input: {
      ...baseInput,
      ...(includeExtendAt ? { extend_at: extendAt } : {}),
      extend_times: extendTimes,
    },
  };
}

describe("KIE Grok Extend evidence-backed contract", () => {
  it.each([0, 1, 2, 2.5, 10_000])(
    "accepts and preserves extend_at number %s",
    (extendAt) => {
      const request = rawRequest(extendAt, "6");
      const parsed = GrokVideoExtendRequestSchema.parse(request);

      expect(parsed.input.extend_at).toBe(extendAt);
      expect(parsed.input.extend_times).toBe("6");
    }
  );

  it.each(["6", "10"] as const)(
    "accepts and preserves string extend_times %s",
    (extendTimes) => {
      const request = rawRequest(2.5, extendTimes);
      const parsed = GrokVideoExtendRequestSchema.parse(request);

      expect(parsed.input.extend_at).toBe(2.5);
      expect(parsed.input.extend_times).toBe(extendTimes);
    }
  );

  it("keeps extend_at required and does not materialize a default", () => {
    const result = GrokVideoExtendRequestSchema.safeParse(
      rawRequest(undefined, "6", false)
    );

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some(
        (issue) => issue.path.join(".") === "input.extend_at"
      )
    ).toBe(true);
  });

  it.each([-1, "0", null])(
    "rejects unsupported extend_at value %j",
    (extendAt) => {
      const result = GrokVideoExtendRequestSchema.safeParse(
        rawRequest(extendAt, "6")
      );

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some(
          (issue) => issue.path.join(".") === "input.extend_at"
        )
      ).toBe(true);
    }
  );

  it.each([6, 10, 7, "7", 6.5, "06", " 6", "+6", null, undefined])(
    "rejects unsupported extend_times value %j",
    (extendTimes) => {
      const result = GrokVideoExtendRequestSchema.safeParse(
        rawRequest(2, extendTimes)
      );

      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some(
          (issue) => issue.path.join(".") === "input.extend_times"
        )
      ).toBe(true);
    }
  );

  it.each(typedFixtures)(
    "guards and transports caller representations unchanged",
    async (request) => {
      const mockFetch = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 200,
            msg: "success",
            data: { taskId: "extended-task" },
          }),
          { status: 200 }
        )
      );
      const provider = createKie({
        apiKey: "test-key",
        fetch: mockFetch,
        paygate: { secret: TEST_PAYGATE_SECRET },
      });

      await provider.post.api.v1.jobs.createTask(
        request,
        mintKieCreateTaskOtp(request)
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const init = mockFetch.mock.calls[0]?.[1] as RequestInit | undefined;
      expect(JSON.parse(String(init?.body))).toEqual(request);
    }
  );

  it.each([
    { request: rawRequest(-1, "6"), path: "input.extend_at" },
    { request: rawRequest("2", "6"), path: "input.extend_at" },
    { request: rawRequest(2, 6), path: "input.extend_times" },
    { request: rawRequest(2, "7"), path: "input.extend_times" },
  ])("rejects $path before fetch", async ({ request, path }) => {
    const mockFetch = vi.fn();
    const provider = createKie({
      apiKey: "test-key",
      fetch: mockFetch,
      paygate: { secret: TEST_PAYGATE_SECRET },
    });
    let error: unknown;

    try {
      await provider.post.api.v1.jobs.createTask(
        request as unknown as MediaGenerationRequest,
        mintKieCreateTaskOtp(request)
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({ name: "KieError", status: 400 });
    expect((error as Error).message).toContain(path);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("keeps the historical Grok Extend HAR byte-for-byte immutable", () => {
    const harPath = resolve(
      import.meta.dirname,
      "../../recordings/kie_2079838932/" +
        "grok-video-extend_884144663/recording.har"
    );
    const bytes = readFileSync(harPath);
    const hash = createHash("sha256").update(bytes).digest("hex");
    const har = JSON.parse(bytes.toString("utf8")) as {
      log: {
        entries: Array<{
          request: { postData?: { text?: string } };
          response: { status: number };
        }>;
      };
    };
    const entry = har.log.entries[0];
    const body = JSON.parse(entry?.request.postData?.text ?? "null") as {
      input: { extend_at: unknown; extend_times: unknown };
    };

    expect(hash).toBe(
      "994e2713d18af423bed0cdd71dcdcfb723484261d2c34818d01b9612588e47f6"
    );
    expect(body.input.extend_at).toBe(0);
    expect(body.input.extend_times).toBe("6");
    expect(entry?.response.status).toBe(200);
  });
});
