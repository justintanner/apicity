import { describe, it, expect } from "vitest";
import {
  dispatchWithPaidGuard,
  MaxSpendError,
} from "../../packages/provider/cost/src/paid-endpoints";

describe("dispatchWithPaidGuard", () => {
  it("passes through for free endpoints without maxSpend", async () => {
    const dispatch = async () => "ok";
    const result = await dispatchWithPaidGuard(
      "openai",
      "POST",
      "v1.chat.completions",
      {},
      undefined,
      dispatch
    );
    expect(result).toBe("ok");
  });

  it("passes through for free endpoints with maxSpend", async () => {
    const dispatch = async () => "ok";
    const result = await dispatchWithPaidGuard(
      "openai",
      "POST",
      "v1.chat.completions",
      { model: "gpt-4o", messages: [{ role: "user", content: "hi" }] },
      5,
      dispatch
    );
    expect(result).toBe("ok");
  });

  it("blocks paid endpoint with omitted maxSpend", async () => {
    const dispatch = async () => "ok";
    await expect(
      dispatchWithPaidGuard(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        undefined,
        dispatch
      )
    ).rejects.toThrow(MaxSpendError);
  });

  it("blocks paid endpoint with maxSpend = 0", async () => {
    const dispatch = async () => "ok";
    await expect(
      dispatchWithPaidGuard(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        0,
        dispatch
      )
    ).rejects.toThrow(MaxSpendError);
  });

  it("allows paid endpoint with maxSpend > 0 when dispatch succeeds", async () => {
    const dispatch = async () => "ok";
    const result = await dispatchWithPaidGuard(
      "kie",
      "POST",
      "api.v1.jobs.createTask",
      {
        model: "wan/2-7-text-to-video",
        prompt: "test",
        input: { duration: 5 },
      },
      5,
      dispatch
    );
    expect(result).toBe("ok");
  });

  it("does not call dispatch when guard blocks", async () => {
    let called = false;
    const dispatch = async () => {
      called = true;
      return "ok";
    };
    try {
      await dispatchWithPaidGuard(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {},
        undefined,
        dispatch
      );
    } catch {
      // expected
    }
    expect(called).toBe(false);
  });

  it("propagates dispatch errors", async () => {
    const dispatch = async () => {
      throw new Error("network failure");
    };
    await expect(
      dispatchWithPaidGuard(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        {
          model: "wan/2-7-text-to-video",
          prompt: "test",
          input: { duration: 5 },
        },
        5,
        dispatch
      )
    ).rejects.toThrow("network failure");
  });
});
