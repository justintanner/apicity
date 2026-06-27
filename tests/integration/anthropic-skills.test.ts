import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupPolly, teardownPolly, type PollyContext } from "../harness";
import { createAnthropic } from "@apicity/anthropic";
import type { AnthropicSkill, AnthropicSkillVersion } from "@apicity/anthropic";

describe("anthropic skills integration", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  describe("list skills", () => {
    beforeEach(() => {
      ctx = setupPolly("anthropic/skills-list");
    });

    it("should list available skills", async () => {
      const provider = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
      });

      const result = await provider.v1.skills.list();

      expect(Array.isArray(result.data)).toBe(true);
      expect(typeof result.has_more).toBe("boolean");
      expect(result.data.length).toBeGreaterThan(0);

      const skill: AnthropicSkill = result.data[0];
      expect(skill.id).toBeDefined();
      expect(skill.type).toBe("skill");
      expect(["custom", "anthropic"]).toContain(skill.source);
    });
  });

  describe("retrieve skill", () => {
    beforeEach(() => {
      ctx = setupPolly("anthropic/skills-retrieve");
    });

    it("should retrieve a single skill by id", async () => {
      const provider = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
      });

      const list = await provider.v1.skills.list();
      expect(list.data.length).toBeGreaterThan(0);

      const id = list.data[0].id;
      const result = await provider.v1.skills.retrieve(id);

      expect(result.id).toBe(id);
      expect(result.type).toBe("skill");
      expect(["custom", "anthropic"]).toContain(result.source);
      expect(result.created_at).toBeDefined();
    });
  });

  describe("list skill versions", () => {
    beforeEach(() => {
      ctx = setupPolly("anthropic/skill-versions-list");
    });

    it("should list versions for a skill", async () => {
      const provider = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-test-key",
      });

      const list = await provider.v1.skills.list();
      expect(list.data.length).toBeGreaterThan(0);

      const id = list.data[0].id;
      const result = await provider.v1.skills.versions.list(id);

      expect(Array.isArray(result.data)).toBe(true);
      expect(typeof result.has_more).toBe("boolean");
      expect(result.data.length).toBeGreaterThan(0);

      const version: AnthropicSkillVersion = result.data[0];
      expect(version.id).toBeDefined();
      expect(version.type).toBe("skill_version");
      expect(version.skill_id).toBe(id);
      expect(version.version).toBeDefined();
    });
  });
});
