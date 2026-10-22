import { describe, expect, it } from "vitest";
import {
  Seedance25DraftRequestSchema,
  Seedance25RequestSchema,
} from "../../packages/provider/kie/src/zod";
import { computeEstimate } from "../../packages/provider/cost/src/compute";

const model = "bytedance/seedance-2-5-draft";
const payload = {
  model,
  input: { draft_task_id: "draft-123", resolution: "1080p" },
};

describe("Seedance 2.5 draft rendering", () => {
  it("accepts the documented render contract and defaults", () => {
    expect(Seedance25DraftRequestSchema.parse(payload).input).toEqual({
      ...payload.input,
      return_last_frame: false,
      nsfw_checker: false,
    });
    for (const output_format of ["mp4", "mov"]) {
      expect(
        Seedance25DraftRequestSchema.safeParse({
          ...payload,
          input: { ...payload.input, output_format },
        }).success
      ).toBe(true);
    }
  });
  it.each([
    { resolution: "1080p" },
    { draft_task_id: "", resolution: "1080p" },
    { draft_task_id: "id" },
    { draft_task_id: "id", resolution: "720p" },
    { ...payload.input, output_format: "value:mp4" },
    { ...payload.input, return_last_frame: "false" },
  ])("rejects invalid render input %j", (input) => {
    expect(
      Seedance25DraftRequestSchema.safeParse({ model, input }).success
    ).toBe(false);
  });
  it.each(["480p", "720p", "1080p"])(
    "restricts draft generation at %s",
    (resolution) => {
      const result = Seedance25RequestSchema.safeParse({
        model: "bytedance/seedance-2-5",
        input: { draft: true, resolution },
      });
      expect(result.success).toBe(resolution === "480p");
      if (result.success) expect(result.data.input.draft).toBe(true);
    }
  );
  it("requires inherited billing information instead of guessing from a task id", () => {
    const estimate = (costHints?: {
      durationSeconds?: number;
      inputDurationSeconds?: number;
    }) => computeEstimate({ provider: "kie", payload, costHints });
    expect(estimate().usd).toBe(0);
    expect(estimate().warnings.join(" ")).toContain("inputDurationSeconds");
    expect(estimate({ durationSeconds: 4 }).usd).toBe(0);
    expect(estimate({ durationSeconds: 4, inputDurationSeconds: -1 }).usd).toBe(
      0
    );
    expect(
      estimate({ durationSeconds: 4, inputDurationSeconds: 0 }).usd
    ).toBeCloseTo(3.16);
    expect(
      estimate({ durationSeconds: 4, inputDurationSeconds: 6 }).usd
    ).toBeCloseTo(4.75);
  });
});
