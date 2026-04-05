// Tests for Fal helper functions — no API calls
// Tests buildQueryString and other utilities from fal.ts
import { describe, it, expect } from "vitest";
import { buildQueryString } from "../../packages/provider/fal/src/fal";

describe("buildQueryString", () => {
  it("should return empty string for empty params", () => {
    const result = buildQueryString({});
    expect(result).toBe("");
  });

  it("should build query string from single param", () => {
    const result = buildQueryString({ foo: "bar" });
    expect(result).toBe("?foo=bar");
  });

  it("should build query string from multiple params", () => {
    const result = buildQueryString({ foo: "bar", baz: "qux" });
    expect(result).toBe("?foo=bar&baz=qux");
  });

  it("should handle undefined values by skipping them", () => {
    const result = buildQueryString({
      foo: "bar",
      skip: undefined,
      baz: "qux",
    });
    expect(result).toBe("?foo=bar&baz=qux");
  });

  it("should URL-encode special characters", () => {
    const result = buildQueryString({ key: "value with spaces" });
    expect(result).toBe("?key=value+with+spaces");
  });

  it("should URL-encode special symbols", () => {
    const result = buildQueryString({ key: "hello&world=foo" });
    expect(result).toBe("?key=hello%26world%3Dfoo");
  });

  it("should handle non-ASCII characters", () => {
    const result = buildQueryString({ key: "Hello 世界" });
    expect(result).toBe("?key=Hello+%E4%B8%96%E7%95%8C");
  });

  it("should handle numbers as values", () => {
    const result = buildQueryString({ count: 42, limit: 100 });
    expect(result).toBe("?count=42&limit=100");
  });

  it("should handle booleans as values", () => {
    const result = buildQueryString({ active: true, deleted: false });
    expect(result).toBe("?active=true&deleted=false");
  });

  it("should handle arrays by repeating the key", () => {
    const result = buildQueryString({ tags: ["a", "b", "c"] });
    expect(result).toBe("?tags=a&tags=b&tags=c");
  });

  it("should handle empty arrays", () => {
    const result = buildQueryString({ tags: [] });
    expect(result).toBe("");
  });

  it("should handle mixed params with arrays and primitives", () => {
    const result = buildQueryString({
      query: "search",
      tags: ["api", "test"],
      limit: 10,
    });
    expect(result).toBe("?query=search&tags=api&tags=test&limit=10");
  });

  it("should handle null values by converting to string", () => {
    const result = buildQueryString({ key: null });
    expect(result).toBe("?key=null");
  });

  it("should preserve key case (no conversion)", () => {
    const result = buildQueryString({
      CamelCase: "value",
      snake_case: "value2",
    });
    expect(result).toBe("?CamelCase=value&snake_case=value2");
  });

  it("should handle empty string values", () => {
    const result = buildQueryString({ key: "" });
    expect(result).toBe("?key=");
  });

  it("should handle date objects by converting to string", () => {
    const date = new Date("2024-01-15T10:30:00.000Z");
    const result = buildQueryString({ since: date });
    // Date is converted using String() which calls toString(), not toISOString()
    expect(result).toMatch(/\?since=Mon\+Jan\+15\+2024/);
    expect(result).toMatch(/10%3A30%3A00/);
  });

  it("should handle complex URL values", () => {
    const result = buildQueryString({
      redirect: "https://example.com/callback?token=abc123",
    });
    expect(result).toBe(
      "?redirect=https%3A%2F%2Fexample.com%2Fcallback%3Ftoken%3Dabc123"
    );
  });

  it("should maintain insertion order of keys", () => {
    const result = buildQueryString({ z: "last", a: "first", m: "middle" });
    expect(result).toBe("?z=last&a=first&m=middle");
  });

  it("should handle array with single element", () => {
    const result = buildQueryString({ ids: ["single"] });
    expect(result).toBe("?ids=single");
  });

  it("should handle array with URL-encoded values", () => {
    const result = buildQueryString({ items: ["hello world", "foo&bar"] });
    expect(result).toBe("?items=hello+world&items=foo%26bar");
  });
});
