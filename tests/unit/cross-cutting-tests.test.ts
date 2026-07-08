import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CROSS_CUTTING_TESTS,
  listCrossCuttingTests,
} from "../../scripts/lib/cross-cutting-tests.mjs";
import { repoRoot } from "../../scripts/lib/provider-scope.mjs";

describe("cross-cutting integration tests", () => {
  it("lists at least the recording-enumeration tests", () => {
    expect(CROSS_CUTTING_TESTS).toContain(
      "tests/integration/upload-recordings.test.ts"
    );
    expect(CROSS_CUTTING_TESTS).toContain(
      "tests/integration/multipart-recordings.test.ts"
    );
  });

  it("every listed test exists on disk", () => {
    for (const relativePath of listCrossCuttingTests()) {
      expect(
        fs.existsSync(path.join(repoRoot, relativePath)),
        relativePath
      ).toBe(true);
    }
  });

  it("every listed test enumerates the whole recordings tree", () => {
    // The defining property of a cross-cutting test: it recursively walks the
    // entire tests/recordings corpus (rather than a fixed provider subset), so
    // a recording added under any provider can break it. Guard the list against
    // drift by asserting each entry both references the recordings root and
    // recursively reads a directory.
    for (const relativePath of listCrossCuttingTests()) {
      const source = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
      expect(source, relativePath).toContain("../recordings");
      expect(source, relativePath).toContain("readdirSync");
    }
  });

  it("returns a fresh copy so callers cannot mutate the source list", () => {
    const first = listCrossCuttingTests();
    first.push("tests/integration/should-not-persist.test.ts");
    expect(listCrossCuttingTests()).not.toContain(
      "tests/integration/should-not-persist.test.ts"
    );
  });
});
