import { describe, it, expect, afterEach } from "vitest";
import {
  setupPolly,
  setupPollyForFileUploads,
  teardownPolly,
  recordingExists,
  getPollyMode,
  type PollyContext,
} from "../harness";
import { anthropic } from "@nakedapi/anthropic";

// Check if we're in replay mode and recordings exist
const replayMode = getPollyMode() === "replay";
const hasCreateRecording = recordingExists("anthropic/skills-create");
const hasListRecording = recordingExists("anthropic/skills-list");
const hasRetrieveRecording = recordingExists("anthropic/skills-retrieve");
const hasVersionsCreateRecording = recordingExists(
  "anthropic/skills-versions-create"
);
const hasVersionsListRecording = recordingExists(
  "anthropic/skills-versions-list"
);
const hasDeleteRecording = recordingExists("anthropic/skills-delete");
const hasVersionsDeleteRecording = recordingExists(
  "anthropic/skills-versions-delete"
);

describe("anthropic skills", () => {
  let ctx: PollyContext;

  afterEach(async () => {
    await teardownPolly(ctx);
  });

  it.skipIf(replayMode && !hasCreateRecording)(
    "should create a skill with files",
    async () => {
      ctx = setupPollyForFileUploads("anthropic/skills-create");
      const provider = anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      });

      // Create a test file blob
      const content = JSON.stringify({
        name: "test_skill",
        description: "A test skill for API testing",
      });
      const file = new Blob([content], { type: "application/json" });

      const result = await provider.v1.skills.create("Test Skill", [
        { data: file, path: "skill.json" },
      ]);

      expect(result.id).toBeTruthy();
      expect(result.type).toBe("skill");
      expect(result.display_title).toBe("Test Skill");
      expect(result.source).toBe("custom");
      expect(result.latest_version).toBeTruthy();
      expect(result.created_at).toBeTruthy();
      expect(result.updated_at).toBeTruthy();
    }
  );

  it.skipIf(replayMode && !hasListRecording)("should list skills", async () => {
    ctx = setupPolly("anthropic/skills-list");
    const provider = anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
    });

    const result = await provider.v1.skills.list({ limit: 5 });

    expect(result.data).toBeInstanceOf(Array);
    expect(result.has_more).toBeDefined();
    expect(result.next_page).toBeDefined();

    if (result.data.length > 0) {
      expect(result.data[0].id).toBeTruthy();
      expect(result.data[0].type).toBe("skill");
      expect(result.data[0].display_title).toBeTruthy();
      expect(result.data[0].source).toBeDefined();
      expect(result.data[0].latest_version).toBeTruthy();
      expect(result.data[0].created_at).toBeTruthy();
    }
  });

  it.skipIf(replayMode && !hasRetrieveRecording)(
    "should retrieve a skill",
    async () => {
      ctx = setupPolly("anthropic/skills-retrieve");
      const provider = anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      });

      // First, list skills to get a valid ID
      const list = await provider.v1.skills.list({ limit: 1 });
      expect(list.data.length).toBeGreaterThan(0);
      const skillId = list.data[0].id;

      const result = await provider.v1.skills.retrieve(skillId);

      expect(result.id).toBe(skillId);
      expect(result.type).toBe("skill");
      expect(result.display_title).toBeTruthy();
      expect(result.source).toBeDefined();
      expect(result.latest_version).toBeTruthy();
      expect(result.created_at).toBeTruthy();
      expect(result.updated_at).toBeTruthy();
    }
  );

  it.skipIf(replayMode && !hasVersionsCreateRecording)(
    "should create a skill version",
    async () => {
      ctx = setupPollyForFileUploads("anthropic/skills-versions-create");
      const provider = anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      });

      // First, create a skill to have a valid skill ID
      const content = JSON.stringify({
        name: "test_skill",
        description: "A test skill for API testing",
      });
      const file = new Blob([content], { type: "application/json" });

      const skill = await provider.v1.skills.create("Test Skill for Version", [
        { data: file, path: "skill.json" },
      ]);

      // Now create a new version
      const versionContent = JSON.stringify({
        name: "test_skill",
        description: "Updated test skill for API testing",
        version: "1.1.0",
      });
      const versionFile = new Blob([versionContent], {
        type: "application/json",
      });

      const result = await provider.v1.skills.versions.create(skill.id, [
        { data: versionFile, path: "skill.json" },
      ]);

      expect(result.id).toBeTruthy();
      expect(result.type).toBe("skill_version");
      expect(result.skill_id).toBe(skill.id);
      expect(result.version).toBeTruthy();
      expect(result.name).toBeTruthy();
      expect(result.directory).toBeTruthy();
      expect(result.created_at).toBeTruthy();
    }
  );

  it.skipIf(replayMode && !hasVersionsListRecording)(
    "should list skill versions",
    async () => {
      ctx = setupPolly("anthropic/skills-versions-list");
      const provider = anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      });

      // First, list skills to get a valid ID
      const list = await provider.v1.skills.list({ limit: 1 });
      expect(list.data.length).toBeGreaterThan(0);
      const skillId = list.data[0].id;

      const result = await provider.v1.skills.versions.list(skillId, {
        limit: 5,
      });

      expect(result.data).toBeInstanceOf(Array);
      expect(result.has_more).toBeDefined();
      expect(result.next_page).toBeDefined();

      if (result.data.length > 0) {
        expect(result.data[0].id).toBeTruthy();
        expect(result.data[0].type).toBe("skill_version");
        expect(result.data[0].skill_id).toBe(skillId);
        expect(result.data[0].version).toBeTruthy();
        expect(result.data[0].name).toBeTruthy();
      }
    }
  );

  it.skipIf(replayMode && !hasDeleteRecording)(
    "should delete a skill",
    async () => {
      ctx = setupPolly("anthropic/skills-delete");
      const provider = anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      });

      // Create a skill to delete
      const content = JSON.stringify({
        name: "test_skill_to_delete",
        description: "A temporary skill for deletion testing",
      });
      const file = new Blob([content], { type: "application/json" });

      const skill = await provider.v1.skills.create("Skill To Delete", [
        { data: file, path: "skill.json" },
      ]);

      const result = await provider.v1.skills.del(skill.id);

      expect(result.id).toBe(skill.id);
      expect(result.type).toBe("skill_deleted");
    }
  );

  it.skipIf(replayMode && !hasVersionsDeleteRecording)(
    "should delete a skill version",
    async () => {
      ctx = setupPolly("anthropic/skills-versions-delete");
      const provider = anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-test-key",
      });

      // First, create a skill with a version
      const content = JSON.stringify({
        name: "test_skill_for_version_delete",
        description: "A test skill for version deletion testing",
      });
      const file = new Blob([content], { type: "application/json" });

      const skill = await provider.v1.skills.create(
        "Skill For Version Delete",
        [{ data: file, path: "skill.json" }]
      );

      // Get the versions
      const versions = await provider.v1.skills.versions.list(skill.id, {
        limit: 1,
      });
      expect(versions.data.length).toBeGreaterThan(0);

      const version = versions.data[0].version;
      const result = await provider.v1.skills.versions.del(skill.id, version);

      expect(result.id).toBe(versions.data[0].id);
      expect(result.type).toBe("skill_version_deleted");
    }
  );
});
