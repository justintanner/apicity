// Regression guard for the fal/xai timer guard itself (ac-6lf6.5).
//
// Proves the deliverable's acceptance: the guard fails on a seeded real-timer
// violation and passes on a cleaned (fake-timer) tree. Exercises the pure
// detector from scripts/check-test-timers.mjs so it runs in-process with no
// subprocess. This file is intentionally NOT named fal*/xai*, so the guard does
// not scan its fixture strings (which contain `setTimeout(` on purpose).
import { describe, expect, it } from "vitest";
import {
  findTimerViolations,
  isFalXaiTestFile,
} from "../../scripts/check-test-timers.mjs";

describe("findTimerViolations", () => {
  it("passes a clean fake-timer test file", () => {
    const clean = `
      beforeEach(() => vi.useFakeTimers());
      it("retries", async () => {
        const p = wrapped("req");
        await vi.advanceTimersByTimeAsync(100);
        await p;
      });
    `;
    expect(findTimerViolations(clean)).toEqual([]);
  });

  it("flags a real setTimeout sleep when fake timers are absent", () => {
    const seeded = `
      function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
      it("waits", async () => { await sleep(800); });
    `;
    const violations = findTimerViolations(seeded);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("real-timer-call");
    expect(violations[0].line).toBe(3);
  });

  it("flags setInterval too", () => {
    const seeded = `const id = setInterval(() => tick(), 10);`;
    const violations = findTimerViolations(seeded);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("real-timer-call");
  });

  it("flags node:timers/promises imports", () => {
    const seeded = `import { setTimeout } from "node:timers/promises";`;
    const violations = findTimerViolations(seeded);
    expect(violations.some((v) => v.rule === "node-timers-promises")).toBe(
      true
    );
  });

  it("exempts files that install fake timers even if they call setTimeout", () => {
    const fake = `
      vi.useFakeTimers();
      await new Promise((r) => setTimeout(r, 100));
      await vi.advanceTimersByTimeAsync(100);
    `;
    expect(findTimerViolations(fake)).toEqual([]);
  });

  it("does not flag string references or spies (not real calls)", () => {
    const spy = `
      const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 50);
    `;
    expect(findTimerViolations(spy)).toEqual([]);
  });

  it("does not flag commented-out timers", () => {
    const commented = `
      // await new Promise((r) => setTimeout(r, 100));
      /* setInterval(fn, 10); */
      const x = 1;
    `;
    expect(findTimerViolations(commented)).toEqual([]);
  });
});

describe("isFalXaiTestFile", () => {
  it("matches fal/xai test files by name and subdirectory", () => {
    for (const rel of [
      "tests/unit/fal-middleware.test.ts",
      "tests/unit/xai-ratelimit.test.ts",
      "tests/integration/fal.test.ts",
      "tests/functional/xai-core.test.ts",
      "tests/unit/xai/middleware.test.ts",
    ]) {
      expect(isFalXaiTestFile(rel)).toBe(true);
    }
  });

  it("ignores other providers and non-test files", () => {
    for (const rel of [
      "tests/unit/openai-middleware.test.ts",
      "tests/unit/fireworks-middleware.test.ts",
      "tests/unit/kimicoding-middleware.test.ts",
      "scripts/check-test-timers.mjs",
      "tests/unit/fal-middleware.ts",
    ]) {
      expect(isFalXaiTestFile(rel)).toBe(false);
    }
  });
});
