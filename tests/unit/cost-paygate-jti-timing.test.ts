import { describe, it, expect } from "vitest";

import {
  dispatchWithPaidGate,
  mintOtp,
  type PayGateConfig,
  type ReplayStore,
} from "../../packages/provider/cost/src/paygate";

const SECRET = "test-secret";

/**
 * A replay store whose contents can be snapshotted at any point. Backed by a
 * plain Set so the test can observe exactly which jtis are present during and
 * after a dispatch.
 */
function makeSnapshotStore(): ReplayStore & { snapshot(): string[] } {
  const seen = new Set<string>();
  return {
    has: (jti) => seen.has(jti),
    add: (jti) => {
      seen.add(jti);
    },
    snapshot: () => [...seen],
  };
}

/**
 * Invariant: the OTP jti is consumed BEFORE `dispatch()` runs. If dispatch
 * later throws (network error, upstream 5xx, abort), the jti remains in the
 * replay store and a retry must mint a fresh OTP.
 *
 * This is intentional — without it, a hostile caller could replay an OTP on
 * every transient failure.
 */
describe("dispatchWithPaidGate — jti consumption timing", () => {
  it("consumes the jti before dispatch is invoked", async () => {
    const store = makeSnapshotStore();
    const config: PayGateConfig = { secret: SECRET, replayStore: store };
    const request = {
      model: "wan/2-7-text-to-video",
      input: { duration: 5 },
    };
    const otp = mintOtp(SECRET, {
      dotPath: "api.v1.jobs.createTask",
      request,
    });

    let storeSnapshotDuringDispatch: string[] | undefined;
    const dispatch = async () => {
      storeSnapshotDuringDispatch = store.snapshot();
      return "ok";
    };

    const result = await dispatchWithPaidGate(
      "kie",
      "POST",
      "api.v1.jobs.createTask",
      request,
      { otp },
      dispatch,
      config
    );
    expect(result).toBe("ok");
    // The jti was added to the store before dispatch ran.
    expect(storeSnapshotDuringDispatch).toHaveLength(1);
  });

  it("leaves the jti consumed when dispatch throws", async () => {
    const store = makeSnapshotStore();
    const config: PayGateConfig = { secret: SECRET, replayStore: store };
    const request = {
      model: "wan/2-7-text-to-video",
      input: { duration: 5 },
    };
    const otp = mintOtp(SECRET, {
      dotPath: "api.v1.jobs.createTask",
      request,
    });

    const dispatch = async () => {
      throw new Error("simulated network failure");
    };

    await expect(
      dispatchWithPaidGate(
        "kie",
        "POST",
        "api.v1.jobs.createTask",
        request,
        { otp },
        dispatch,
        config
      )
    ).rejects.toThrow("simulated network failure");

    // The jti stays consumed despite the dispatch failure — a retry must
    // mint a fresh OTP.
    expect(store.snapshot()).toHaveLength(1);
  });
});
