import { describe, expect, expectTypeOf, it } from "vitest";
import {
  AlephRecordInfoResponseSchema,
  type AlephRecordInfo,
  type AlephRecordInfoData,
} from "@apicity/kie";

const TASK_ID = "e0f98783d0eaf265cc23568594fcf009";
const OBSERVED_PARAM_JSON =
  '{"videoUrl":"https://static.aiquickdraw.com/tools/example/1767525918769_QyvTNib2.mp4","aspectRatio":"16:9","prompt":"Transform the clip into a hand-painted watercolor animation."}';

describe("KIE Aleph record-info schema", () => {
  it("accepts the observed intermediate envelope for the recorded task", () => {
    const response = {
      code: 200,
      msg: "success",
      data: {
        taskId: TASK_ID,
        paramJson: OBSERVED_PARAM_JSON,
        response: null,
        completeTime: null,
        createTime: 1_787_045_781_000,
        successFlag: 0,
        errorCode: null,
        errorMessage: null,
      },
    } satisfies AlephRecordInfo;

    expect(AlephRecordInfoResponseSchema.safeParse(response).success).toBe(
      true
    );
  });

  it("accepts the observed failure envelope for the recorded task", () => {
    const response = {
      code: 200,
      msg: "success",
      data: {
        taskId: TASK_ID,
        paramJson: OBSERVED_PARAM_JSON,
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

  it("accepts a constructed numeric-timestamp success envelope", () => {
    // Constructed from the observed envelope shape; no Aleph task has ever
    // succeeded in this repository.
    const response = {
      code: 200,
      msg: "success",
      data: {
        taskId: TASK_ID,
        paramJson: OBSERVED_PARAM_JSON,
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

  it("preserves a constructed string-timestamp success envelope", () => {
    // Constructed from the observed envelope shape; no Aleph task has ever
    // succeeded in this repository.
    const response = {
      code: 200,
      msg: "success",
      data: {
        taskId: TASK_ID,
        paramJson: OBSERVED_PARAM_JSON,
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

  it("rejects a constructed envelope with a boolean createTime", () => {
    const response = {
      code: 200,
      msg: "success",
      data: {
        taskId: TASK_ID,
        paramJson: OBSERVED_PARAM_JSON,
        response: null,
        completeTime: null,
        createTime: true,
        successFlag: 0,
        errorCode: null,
        errorMessage: null,
      },
    };

    expect(AlephRecordInfoResponseSchema.safeParse(response).success).toBe(
      false
    );
  });

  it("pins the constructed numeric timestamp interface types", () => {
    const data: AlephRecordInfoData = {
      taskId: TASK_ID,
      createTime: 1_787_045_781_000,
    };

    expectTypeOf(data.createTime).toEqualTypeOf<string | number | undefined>();
    expectTypeOf(data.completeTime).toEqualTypeOf<
      string | number | null | undefined
    >();
  });
});
