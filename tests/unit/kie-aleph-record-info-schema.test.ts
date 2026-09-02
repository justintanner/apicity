import { describe, expect, it } from "vitest";
import {
  AlephRecordInfoResponseSchema,
  type AlephRecordInfo,
} from "@apicity/kie";

const TASK_ID = "e0f98783d0eaf265cc23568594fcf009";

describe("KIE Aleph record-info schema", () => {
  it("accepts the captured numeric-timestamp generating envelope", () => {
    const response = {
      code: 200,
      msg: "success",
      data: {
        taskId: TASK_ID,
        paramJson:
          '{"videoUrl":"https://static.aiquickdraw.com/tools/example/1767525918769_QyvTNib2.mp4","aspectRatio":"16:9","prompt":"Transform the clip into a hand-painted watercolor animation."}',
        response: null,
        completeTime: null,
        createTime: 1787045781000,
        successFlag: 0,
        errorCode: null,
        errorMessage: null,
      },
    } satisfies AlephRecordInfo;

    expect(AlephRecordInfoResponseSchema.safeParse(response).success).toBe(
      true
    );
  });

  it("accepts numeric epoch timestamps in a successful terminal envelope", () => {
    const response = {
      code: 200,
      msg: "success",
      data: {
        taskId: TASK_ID,
        paramJson: "{}",
        response: {
          resultVideoUrl:
            "https://tempfile.aiquickdraw.com/k/aleph-success.mp4",
        },
        completeTime: 1_787_045_882_000,
        createTime: 1_787_045_781_000,
        successFlag: 1,
        errorCode: null,
        errorMessage: null,
      },
    } satisfies AlephRecordInfo;

    expect(AlephRecordInfoResponseSchema.safeParse(response).success).toBe(
      true
    );
  });

  it("accepts string timestamps in a successful terminal envelope", () => {
    const response = {
      code: 200,
      msg: "success",
      data: {
        taskId: TASK_ID,
        paramJson: "{}",
        response: {
          resultVideoUrl:
            "https://tempfile.aiquickdraw.com/k/aleph-success.mp4",
        },
        completeTime: "2026-08-18 09:18:02",
        createTime: "2026-08-18 09:16:21",
        successFlag: 1,
        errorCode: null,
        errorMessage: null,
      },
    } satisfies AlephRecordInfo;

    const parsed = AlephRecordInfoResponseSchema.parse(response);

    expect(parsed.data?.createTime).toBe("2026-08-18 09:16:21");
    expect(parsed.data?.completeTime).toBe("2026-08-18 09:18:02");
  });

  it("accepts numeric epoch timestamps in a failed terminal envelope", () => {
    const response = {
      code: 200,
      msg: "success",
      data: {
        taskId: TASK_ID,
        paramJson: "{}",
        response: null,
        completeTime: 1_787_045_882_000,
        createTime: 1_787_045_781_000,
        successFlag: 3,
        errorCode: 500,
        errorMessage: "internal error, please try again later",
      },
    } satisfies AlephRecordInfo;

    expect(AlephRecordInfoResponseSchema.safeParse(response).success).toBe(
      true
    );
  });
});
