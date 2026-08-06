import { describe, it, expect } from "vitest";
import {
  RunwayGenerateCallbackPayloadSchema,
  RunwayExtendCallbackPayloadSchema,
  RunwayAlephCallbackPayloadSchema,
} from "../../packages/provider/kie/src/callbacks-runway";

describe("Runway callback payloads (ac-7plevp)", () => {
  it("parses generate success and failure", () => {
    expect(
      RunwayGenerateCallbackPayloadSchema.safeParse({
        code: 200,
        msg: "All generated successfully.",
        data: {
          task_id: "ee603959-debb-48d1-98c4-a6d1c717eba6",
          video_id: "485da89c-7fca-4340-8c04-101025b2ae71",
          video_url: "https://file.com/k/xxxxxxx.mp4",
          image_url: "https://file.com/m/xxxxxxxx.png",
        },
      }).success
    ).toBe(true);

    expect(
      RunwayGenerateCallbackPayloadSchema.safeParse({
        code: 400,
        msg: "Inappropriate content detected. Please replace the image or video.",
        data: {
          task_id: "ee603959-debb-48d1-98c4-a6d1c717eba6",
          video_id: "",
          video_url: "",
          image_url: "",
        },
      }).success
    ).toBe(true);
  });

  it("exports extend and aleph aliases that accept the same shape", () => {
    const body = {
      code: 200,
      msg: "ok",
      data: { task_id: "t1", video_url: "https://example.com/v.mp4" },
    };
    expect(RunwayExtendCallbackPayloadSchema.safeParse(body).success).toBe(
      true
    );
    expect(RunwayAlephCallbackPayloadSchema.safeParse(body).success).toBe(true);
  });
});
