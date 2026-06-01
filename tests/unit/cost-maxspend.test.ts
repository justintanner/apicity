import { describe, it, expect } from "vitest";
import {
  maxSpendPreflight,
  MaxSpendError,
} from "../../packages/provider/cost/src/paid-endpoints";
describe("maxSpend preflight contract", () => {
  describe("maxSpendPreflight", () => {
    it("allows paid endpoint with maxSpend > 0", () => {
      expect(() =>
        maxSpendPreflight("kie", "POST", "api.v1.jobs.createTask", 5)
      ).not.toThrow();
    });

    it("blocks paid endpoint with omitted maxSpend (defaults to 0)", () => {
      expect(() =>
        maxSpendPreflight("kie", "POST", "api.v1.jobs.createTask")
      ).toThrow(MaxSpendError);
    });

    it("blocks paid endpoint with maxSpend = 0", () => {
      expect(() =>
        maxSpendPreflight("kie", "POST", "api.v1.jobs.createTask", 0)
      ).toThrow(MaxSpendError);
    });

    it("blocks paid endpoint with maxSpend < 0", () => {
      expect(() =>
        maxSpendPreflight("kie", "POST", "api.v1.jobs.createTask", -1)
      ).toThrow(MaxSpendError);
    });

    it("allows free endpoint with omitted maxSpend", () => {
      expect(() =>
        maxSpendPreflight("openai", "POST", "v1.chat.completions")
      ).not.toThrow();
    });

    it("allows free endpoint with maxSpend = 0", () => {
      expect(() =>
        maxSpendPreflight("openai", "POST", "v1.chat.completions", 0)
      ).not.toThrow();
    });

    it("allows free endpoint with maxSpend > 0", () => {
      expect(() =>
        maxSpendPreflight("openai", "POST", "v1.chat.completions", 5)
      ).not.toThrow();
    });

    it("error names the endpoint and shows maxSpend", () => {
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

    it("error includes structured fields", () => {
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

  describe("MaxSpendError", () => {
    it("has the correct name", () => {
      const error = new MaxSpendError("x", "GET", "a.b", 0);
      expect(error.name).toBe("MaxSpendError");
    });
  });
});
