import { describe, expect, it } from "vitest";
import { findPackCity } from "../../scripts/lib/pack-city.mjs";

describe("release-pack city discovery", () => {
  it("looks past a rig's own pack into its parent city", () => {
    const files = new Set([
      "/workspace/city/rig/pack.toml",
      "/workspace/city/pack.toml",
      "/workspace/city/city.toml",
    ]);
    expect(
      findPackCity("/workspace/city/rig", (path: string) => files.has(path))
    ).toBe("/workspace/city");
  });

  it("accepts the city root itself and nested worktrees", () => {
    const exists = (path: string) => path === "/workspace/city/city.toml";
    expect(findPackCity("/workspace/city", exists)).toBe("/workspace/city");
    expect(findPackCity("/workspace/city/rig/worktrees/fix", exists)).toBe(
      "/workspace/city"
    );
  });

  it("does not invent a city for a standalone checkout", () => {
    expect(findPackCity("/standalone/repo", () => false)).toBeNull();
  });
});
