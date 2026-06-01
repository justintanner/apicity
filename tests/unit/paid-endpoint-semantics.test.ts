import { describe, it, expect } from "vitest";
import {
  isPaidEndpoint,
  lookupPaidEndpoint,
  maxSpendPreflight,
  MaxSpendError,
  SpendBoundError,
  dispatchWithPaidGuard,
  spendBoundCheck,
} from "../../packages/provider/cost/src/paid-endpoints";
import { kie } from "@apicity/kie";

/**
 * Regression tests for paid-endpoint semantics.
 *
 * These tests lock down the contract described in the epic:
 * - Unlisted endpoints are free (no maxSpend required).
 * - Listed paid endpoints block when maxSpend is omitted or 0.
 * - Listed paid endpoints allow when maxSpend is > 0 and the estimate is
 *   within the bound.
 * - Matching is exact (no prefix, wildcard, regex, or sibling match).
 * - Blocking happens before HTTP dispatch.
 */

describe("paid endpoint semantics — regression", () => {
  describe("unlisted endpoints are treated as free", () => {
    it("does not require maxSpend for free endpoints", () => {
      expect(() =>
        maxSpendPreflight("openai", "POST", "v1.chat.completions")
      ).not.toThrow();
      expect(() =>
        maxSpendPreflight("kie", "GET", "api.v1.jobs.recordInfo")
      ).not.toThrow();
      expect(() =>
        maxSpendPreflight("xai", "POST", "v1.chat.completions")
      ).not.toThrow();
    });

    it("dispatchWithPaidGuard passes through free endpoints without maxSpend", async () => {
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

    it("isPaidEndpoint returns false for unlisted endpoints", () => {
      expect(isPaidEndpoint("openai", "POST", "v1.chat.completions")).toBe(
        false
      );
      expect(isPaidEndpoint("kie", "GET", "api.v1.jobs.recordInfo")).toBe(
        false
      );
      expect(isPaidEndpoint("xai", "POST", "v1.chat.completions")).toBe(false);
    });
  });

  describe("KIE POST api.v1.jobs.createTask blocks when maxSpend is omitted", () => {
    it("maxSpendPreflight throws MaxSpendError", () => {
      expect(() =>
        maxSpendPreflight("kie", "POST", "api.v1.jobs.createTask")
      ).toThrow(MaxSpendError);
    });

    it("dispatchWithPaidGuard throws MaxSpendError before dispatch", async () => {
      let called = false;
      const dispatch = async () => {
        called = true;
        return "ok";
      };
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
      expect(called).toBe(false);
    });

    it("kie provider createTask throws MaxSpendError without network call", async () => {
      const provider = kie({
        apiKey: "test-key",
        baseURL: "http://localhost:99999",
      });
      await expect(
        provider.post.api.v1.jobs.createTask({
          model: "grok-imagine/text-to-image",
          input: {
            prompt: "test",
            aspect_ratio: "1:1",
          },
        })
      ).rejects.toThrow(MaxSpendError);
    });
  });

  describe("KIE POST api.v1.jobs.createTask blocks when maxSpend = 0", () => {
    it("maxSpendPreflight throws MaxSpendError", () => {
      expect(() =>
        maxSpendPreflight("kie", "POST", "api.v1.jobs.createTask", 0)
      ).toThrow(MaxSpendError);
    });

    it("dispatchWithPaidGuard throws MaxSpendError before dispatch", async () => {
      let called = false;
      const dispatch = async () => {
        called = true;
        return "ok";
      };
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
      expect(called).toBe(false);
    });

    it("kie provider createTask throws MaxSpendError with maxSpend = 0", async () => {
      const provider = kie({
        apiKey: "test-key",
        baseURL: "http://localhost:99999",
      });
      await expect(
        provider.post.api.v1.jobs.createTask(
          {
            model: "grok-imagine/text-to-image",
            input: {
              prompt: "test",
              aspect_ratio: "1:1",
            },
          },
          0
        )
      ).rejects.toThrow(MaxSpendError);
    });
  });

  describe(
    "KIE POST api.v1.jobs.createTask allows when maxSpend = 5 and " +
      "estimated spend is <= 5 USD",
    () => {
      it("spendBoundCheck does not throw when estimate is within maxSpend", () => {
        expect(() =>
          spendBoundCheck("kie", "POST", "api.v1.jobs.createTask", 5, {
            usd: 3,
            warnings: [],
          })
        ).not.toThrow();
      });

      it("spendBoundCheck does not throw when estimate equals maxSpend", () => {
        expect(() =>
          spendBoundCheck("kie", "POST", "api.v1.jobs.createTask", 5, {
            usd: 5,
            warnings: [],
          })
        ).not.toThrow();
      });

      it("dispatchWithPaidGuard allows when maxSpend is sufficient", async () => {
        const dispatch = async () => "ok";
        const result = await dispatchWithPaidGuard(
          "kie",
          "POST",
          "api.v1.jobs.createTask",
          {
            model: "grok-imagine/text-to-image",
            input: {
              prompt: "test",
              aspect_ratio: "1:1",
            },
          },
          5,
          dispatch
        );
        expect(result).toBe("ok");
      });

      it("kie provider createTask does not throw MaxSpendError with maxSpend = 5", async () => {
        const provider = kie({
          apiKey: "test-key",
          baseURL: "http://localhost:99999",
        });
        let caught: unknown;
        try {
          await provider.post.api.v1.jobs.createTask(
            {
              model: "grok-imagine/text-to-image",
              input: {
                prompt: "test",
                aspect_ratio: "1:1",
              },
            },
            5
          );
        } catch (error) {
          caught = error;
        }
        expect(caught).toBeDefined();
        expect(caught).not.toBeInstanceOf(MaxSpendError);
        expect(caught).not.toBeInstanceOf(SpendBoundError);
      });
    }
  );

  describe(
    "exact matching only: no regex, prefix, wildcard, or sibling " +
      "endpoint match can mark an endpoint paid",
    () => {
      it("lookupPaidEndpoint returns undefined for prefix match", () => {
        expect(
          lookupPaidEndpoint("kie", "POST", "api.v1.jobs")
        ).toBeUndefined();
      });

      it("lookupPaidEndpoint returns undefined for suffix match", () => {
        expect(
          lookupPaidEndpoint("kie", "POST", "v1.jobs.createTask")
        ).toBeUndefined();
      });

      it("lookupPaidEndpoint returns undefined for sibling endpoint", () => {
        expect(
          lookupPaidEndpoint("kie", "POST", "api.v1.jobs.recordInfo")
        ).toBeUndefined();
      });

      it("lookupPaidEndpoint returns undefined for different method", () => {
        expect(
          lookupPaidEndpoint("kie", "GET", "api.v1.jobs.createTask")
        ).toBeUndefined();
      });

      it("lookupPaidEndpoint returns undefined for different provider", () => {
        expect(
          lookupPaidEndpoint("xai", "POST", "api.v1.jobs.createTask")
        ).toBeUndefined();
      });

      it("isPaidEndpoint returns false for all nearby endpoint names", () => {
        expect(isPaidEndpoint("kie", "POST", "api.v1.jobs")).toBe(false);
        expect(isPaidEndpoint("kie", "POST", "v1.jobs.createTask")).toBe(false);
        expect(isPaidEndpoint("kie", "POST", "api.v1.jobs.recordInfo")).toBe(
          false
        );
        expect(isPaidEndpoint("kie", "GET", "api.v1.jobs.createTask")).toBe(
          false
        );
        expect(isPaidEndpoint("xai", "POST", "api.v1.jobs.createTask")).toBe(
          false
        );
      });
    }
  );

  describe("blocking happens before HTTP dispatch", () => {
    it("dispatchWithPaidGuard does not call dispatch when maxSpend is omitted", async () => {
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

    it("dispatchWithPaidGuard does not call dispatch when maxSpend = 0", async () => {
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
          0,
          dispatch
        );
      } catch {
        // expected
      }
      expect(called).toBe(false);
    });

    it("kie provider does not make a network request when maxSpend is omitted", async () => {
      const provider = kie({
        apiKey: "test-key",
        baseURL: "http://localhost:99999",
      });
      await expect(
        provider.post.api.v1.jobs.createTask({
          model: "grok-imagine/text-to-image",
          input: {
            prompt: "test",
            aspect_ratio: "1:1",
          },
        })
      ).rejects.toThrow(MaxSpendError);
    });
  });

  describe("error messages are actionable", () => {
    it("MaxSpendError names the endpoint and shows maxSpend", () => {
      let caught: MaxSpendError | undefined;
      try {
        maxSpendPreflight("kie", "POST", "api.v1.jobs.createTask");
      } catch (error) {
        caught = error as MaxSpendError;
      }
      expect(caught).toBeInstanceOf(MaxSpendError);
      expect(caught!.message).toContain("kie POST api.v1.jobs.createTask");
      expect(caught!.message).toContain("maxSpend is 0 USD");
      expect(caught!.message).toContain("Pass an explicit maxSpend");
    });

    it("MaxSpendError includes structured fields", () => {
      let caught: MaxSpendError | undefined;
      try {
        maxSpendPreflight("kie", "POST", "api.v1.jobs.createTask", 0);
      } catch (error) {
        caught = error as MaxSpendError;
      }
      expect(caught!.provider).toBe("kie");
      expect(caught!.method).toBe("POST");
      expect(caught!.dotPath).toBe("api.v1.jobs.createTask");
      expect(caught!.maxSpend).toBe(0);
    });
  });
});
