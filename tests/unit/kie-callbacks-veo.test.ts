import { describe, it, expect, expectTypeOf } from "vitest";

import type {
  VeoGenerateCallbackPayload,
  VeoGet4kVideoCallbackPayload,
} from "../../packages/provider/kie/src/callbacks-veo";
import {
  extractKieWebhookTaskId,
  verifyKieWebhookRequest,
  signKieWebhook,
} from "../../packages/provider/kie/src/webhook";

// Drive the shipped callback types + webhook helper against documented
// generate + 4k callback shapes (docs.kie.ai/veo3-api/*-callbacks).

const GENERATE_SUCCESS: VeoGenerateCallbackPayload = {
  code: 200,
  msg: "Veo3.1 video generated successfully.",
  data: {
    taskId: "veo_task_abcdef123456",
    promptJson: '{"aspectRatio":"16:9","model":"veo3_fast","prompt":"cat"}',
    info: {
      resultUrls: ["http://example.com/video1.mp4"],
      originUrls: ["http://example.com/original_video1.mp4"],
      resolution: "1080p",
    },
    fallbackFlag: false,
  },
};

const GENERATE_FAILURE: VeoGenerateCallbackPayload = {
  code: 400,
  msg: "Your prompt was flagged by Website as violating content policies.",
  data: {
    taskId: "veo_task_abcdef123456",
    fallbackFlag: false,
  },
};

const GET_4K_SUCCESS: VeoGet4kVideoCallbackPayload = {
  code: 200,
  msg: "4K Video generated successfully.",
  data: {
    taskId: "veo_task_example123",
    info: {
      resultUrls: [
        "https://file.aiquickdraw.com/v/example_task_1234567890.mp4",
      ],
      imageUrls: ["https://file.aiquickdraw.com/v/example_task_1234567890.jpg"],
    },
  },
};

const GET_4K_FAILURE: VeoGet4kVideoCallbackPayload = {
  code: 500,
  msg: "The 4K version of this video is unavailable. Please try a different video.",
  data: {
    taskId: "veo_task_abcdef123456",
  },
};

describe("Veo callback payload types (ac-divrze)", () => {
  it("accepts documented generate success and failure shapes", () => {
    expectTypeOf(GENERATE_SUCCESS).toEqualTypeOf<VeoGenerateCallbackPayload>();
    expectTypeOf(GENERATE_FAILURE).toEqualTypeOf<VeoGenerateCallbackPayload>();
    expect(GENERATE_SUCCESS.data.taskId).toBe("veo_task_abcdef123456");
    expect(GENERATE_SUCCESS.data.info?.resultUrls?.[0]).toContain(".mp4");
    expect(GENERATE_FAILURE.code).toBe(400);
  });

  it("accepts documented 4K success and failure shapes", () => {
    expectTypeOf(GET_4K_SUCCESS).toEqualTypeOf<VeoGet4kVideoCallbackPayload>();
    expectTypeOf(GET_4K_FAILURE).toEqualTypeOf<VeoGet4kVideoCallbackPayload>();
    expect(GET_4K_SUCCESS.data.info?.imageUrls).toHaveLength(1);
    expect(GET_4K_FAILURE.code).toBe(500);
  });

  it("extracts taskId for webhook verification from generate payload", () => {
    expect(extractKieWebhookTaskId(GENERATE_SUCCESS)).toBe(
      "veo_task_abcdef123456"
    );
    const secret = "test-webhook-hmac-key";
    const timestamp = "1769670760";
    const signature = signKieWebhook(
      GENERATE_SUCCESS.data.taskId,
      timestamp,
      secret
    );
    expect(
      verifyKieWebhookRequest({
        secret,
        headers: {
          "X-Webhook-Timestamp": timestamp,
          "X-Webhook-Signature": signature,
        },
        body: GENERATE_SUCCESS,
      })
    ).toBe(true);
  });
});
