import { describe, it, expect } from "vitest";

import {
  DoltHubOptionsSchema,
  DoltHubSqlReadRequestSchema,
  DoltHubSqlWriteRequestSchema,
  DoltHubWritePollRequestSchema,
  DoltHubDatabaseCreateRequestSchema,
  DoltHubBranchesListRequestSchema,
  DoltHubBranchCreateRequestSchema,
  DoltHubPullsListRequestSchema,
  DoltHubPullCreateRequestSchema,
  DoltHubPullGetRequestSchema,
  DoltHubPullMergeRequestSchema,
} from "../../packages/provider/dolthub/src/zod";

describe("Zod schema validation edge cases", () => {
  describe("null and undefined handling", () => {
    it("should reject null payload", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse(null);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject undefined payload", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse(undefined);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject array as payload", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse([]);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject string as payload", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse("string");
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject number as payload", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse(123);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject boolean as payload", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse(true);
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("empty object handling", () => {
    it("should accept empty object for options schema (all optional)", () => {
      const result = DoltHubOptionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept empty object for database create (all optional)", () => {
      const result = DoltHubDatabaseCreateRequestSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should reject empty object when required fields missing", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("owner"))).toBe(
        true
      );
      expect(
        result.error?.issues.some((i) => i.path.includes("database"))
      ).toBe(true);
      expect(result.error?.issues.some((i) => i.path.includes("query"))).toBe(
        true
      );
    });
  });

  describe("type validation edge cases", () => {
    it("should reject string where number expected", () => {
      const result = DoltHubOptionsSchema.safeParse({
        timeout: "not-a-number",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject number where string expected", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse({
        owner: 123,
        database: "test",
        query: "SELECT 1",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("enum validation edge cases", () => {
    it("should reject invalid visibility enum", () => {
      const result = DoltHubDatabaseCreateRequestSchema.safeParse({
        visibility: "secret",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should accept valid visibility enum values", () => {
      const result1 = DoltHubDatabaseCreateRequestSchema.safeParse({
        visibility: "public",
      });
      const result2 = DoltHubDatabaseCreateRequestSchema.safeParse({
        visibility: "private",
      });
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it("should reject invalid revisionType enum", () => {
      const result = DoltHubBranchCreateRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        revisionType: "tag",
        revisionName: "main",
        newBranchName: "feature",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should accept valid revisionType enum values", () => {
      const values = ["branch", "ref", "commit"];
      for (const value of values) {
        const result = DoltHubBranchCreateRequestSchema.safeParse({
          owner: "dolthub",
          database: "test",
          revisionType: value as "branch" | "ref" | "commit",
          revisionName: "main",
          newBranchName: "feature",
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid filterByState enum", () => {
      const result = DoltHubPullsListRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        filterByState: "Draft",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should accept valid filterByState enum values", () => {
      const values = ["Open", "Closed", "Merged"];
      for (const value of values) {
        const result = DoltHubPullsListRequestSchema.safeParse({
          owner: "dolthub",
          database: "test",
          filterByState: value as "Open" | "Closed" | "Merged",
        });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid filterByReviewStatus enum", () => {
      const result = DoltHubPullsListRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        filterByReviewStatus: "Pending",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should accept valid filterByReviewStatus enum values", () => {
      const values = ["Approved", "AssignedReviewer", "Rejected", "Reviewed"];
      for (const value of values) {
        const result = DoltHubPullsListRequestSchema.safeParse({
          owner: "dolthub",
          database: "test",
          filterByReviewStatus: value as
            | "Approved"
            | "AssignedReviewer"
            | "Rejected"
            | "Reviewed",
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("min length validation", () => {
    it("should reject empty string for owner", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse({
        owner: "",
        database: "test",
        query: "SELECT 1",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject empty string for database", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse({
        owner: "dolthub",
        database: "",
        query: "SELECT 1",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject empty string for query", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        query: "",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject empty string for fromBranch", () => {
      const result = DoltHubSqlWriteRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        fromBranch: "",
        toBranch: "main",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject empty string for toBranch", () => {
      const result = DoltHubSqlWriteRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        fromBranch: "main",
        toBranch: "",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject empty string for operationName", () => {
      const result = DoltHubWritePollRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        operationName: "",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject empty string for revisionName", () => {
      const result = DoltHubBranchCreateRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        revisionType: "branch",
        revisionName: "",
        newBranchName: "feature",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject empty string for newBranchName", () => {
      const result = DoltHubBranchCreateRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        revisionType: "branch",
        revisionName: "main",
        newBranchName: "",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });

    it("should reject empty string for pullId", () => {
      const result = DoltHubPullGetRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        pullId: "",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });

  describe("SQL read schema", () => {
    it("should validate with minimal fields", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        query: "SELECT 1",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with all fields", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        ref: "main",
        query: "SELECT 1",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing owner", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse({
        database: "test",
        query: "SELECT 1",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("owner"))).toBe(
        true
      );
    });

    it("should reject missing database", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse({
        owner: "dolthub",
        query: "SELECT 1",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("database"))
      ).toBe(true);
    });

    it("should reject missing query", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("query"))).toBe(
        true
      );
    });
  });

  describe("SQL write schema", () => {
    it("should validate with minimal fields", () => {
      const result = DoltHubSqlWriteRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        fromBranch: "main",
        toBranch: "feature",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with all fields", () => {
      const result = DoltHubSqlWriteRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        fromBranch: "main",
        toBranch: "feature",
        query: "INSERT INTO t VALUES (1)",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing fromBranch", () => {
      const result = DoltHubSqlWriteRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        toBranch: "feature",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("fromBranch"))
      ).toBe(true);
    });

    it("should reject missing toBranch", () => {
      const result = DoltHubSqlWriteRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        fromBranch: "main",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("toBranch"))
      ).toBe(true);
    });
  });

  describe("Write poll schema", () => {
    it("should validate with minimal fields", () => {
      const result = DoltHubWritePollRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        operationName: "op-123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing operationName", () => {
      const result = DoltHubWritePollRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("operationName"))
      ).toBe(true);
    });
  });

  describe("Database create schema", () => {
    it("should validate with minimal fields", () => {
      const result = DoltHubDatabaseCreateRequestSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should validate with all fields", () => {
      const result = DoltHubDatabaseCreateRequestSchema.safeParse({
        description: "Test database",
        ownerName: "dolthub",
        repoName: "test",
        visibility: "public",
      });
      expect(result.success).toBe(true);
    });

    it("should accept partial fields", () => {
      const result = DoltHubDatabaseCreateRequestSchema.safeParse({
        description: "Test",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Branches list schema", () => {
    it("should validate with minimal fields", () => {
      const result = DoltHubBranchesListRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing owner", () => {
      const result = DoltHubBranchesListRequestSchema.safeParse({
        database: "test",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("owner"))).toBe(
        true
      );
    });
  });

  describe("Branch create schema", () => {
    it("should validate with minimal fields", () => {
      const result = DoltHubBranchCreateRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        revisionType: "branch",
        revisionName: "main",
        newBranchName: "feature",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing revisionName", () => {
      const result = DoltHubBranchCreateRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        revisionType: "branch",
        newBranchName: "feature",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("revisionName"))
      ).toBe(true);
    });

    it("should reject missing newBranchName", () => {
      const result = DoltHubBranchCreateRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        revisionType: "branch",
        revisionName: "main",
      });
      expect(result.success).toBe(false);
      expect(
        result.error?.issues.some((i) => i.path.includes("newBranchName"))
      ).toBe(true);
    });
  });

  describe("Pulls list schema", () => {
    it("should validate with minimal fields", () => {
      const result = DoltHubPullsListRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with all fields", () => {
      const result = DoltHubPullsListRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        pageToken: "token-123",
        filterByState: "Open",
        filterByReviewStatus: "Approved",
        query: "search",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Pull create schema", () => {
    it("should validate with minimal fields", () => {
      const result = DoltHubPullCreateRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
      });
      expect(result.success).toBe(true);
    });

    it("should validate with all fields", () => {
      const result = DoltHubPullCreateRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        title: "Fix bug",
        description: "Detailed description",
        fromBranchOwnerName: "user1",
        fromBranchRepoName: "repo1",
        fromBranchName: "feature",
        toBranchOwnerName: "dolthub",
        toBranchRepoName: "test",
        toBranchName: "main",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Pull get schema", () => {
    it("should validate with minimal fields", () => {
      const result = DoltHubPullGetRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        pullId: "123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing pullId", () => {
      const result = DoltHubPullGetRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("pullId"))).toBe(
        true
      );
    });
  });

  describe("Pull merge schema", () => {
    it("should validate with minimal fields", () => {
      const result = DoltHubPullMergeRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        pullId: "123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing pullId", () => {
      const result = DoltHubPullMergeRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes("pullId"))).toBe(
        true
      );
    });
  });

  describe("multiple validation errors", () => {
    it("should collect all validation errors", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse({
        // Missing owner, database, query
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThanOrEqual(3);
      expect(result.error?.issues.some((i) => i.path.includes("owner"))).toBe(
        true
      );
      expect(
        result.error?.issues.some((i) => i.path.includes("database"))
      ).toBe(true);
      expect(result.error?.issues.some((i) => i.path.includes("query"))).toBe(
        true
      );
    });

    it("should return success when valid", () => {
      const result = DoltHubSqlReadRequestSchema.safeParse({
        owner: "dolthub",
        database: "test",
        query: "SELECT 1",
      });
      expect(result.success).toBe(true);
    });
  });
});
