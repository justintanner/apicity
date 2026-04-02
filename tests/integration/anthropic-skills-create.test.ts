import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { anthropic } from "@nakedapi/anthropic";

describe("anthropic skills create integration", () => {
  let ctx: PollyContext;

  beforeEach(() => {
    ctx = setupPolly("anthropic/skills-create");
  });

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it("should create a skill", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test",
    });

    // Create a simple test file
    const content = new Blob(["function test() { return true; }"], {
      type: "application/javascript",
    });
    const file = new File([content], "test-skill.js", {
      type: "application/javascript",
    });

    const result = await provider.post.v1.skills.create({
      displayTitle: "Test Skill",
      files: [file],
      description: "A test skill for validation",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.displayTitle).toBeDefined();
  });

  it("should list skills", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test",
    });

    const result = await provider.get.v1.skills.list();

    expect(result).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("should get a skill by id", async () => {
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test",
    });

    const result = await provider.get.v1.skills.retrieve({
      skillId: process.env.ANTHROPIC_SKILL_ID ?? "test-skill-id",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.displayTitle).toBeDefined();
  });
});
