import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic skills delete integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("anthropic/skills-delete");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should delete a skill", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test",
    });

    const result = await provider.delete.v1.skills.del({
      skillId: process.env.ANTHROPIC_SKILL_ID ?? "test-skill-id",
    });

    expect(result).toBeDefined();
  });

  it("should delete a skill version", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test",
    });

    const result = await provider.delete.v1.skills.versions.del({
      skillId: process.env.ANTHROPIC_SKILL_ID ?? "test-skill-id",
      version: "1.0.0",
    });

    expect(result).toBeDefined();
  });
});
