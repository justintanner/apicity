import { describe, it, expect } from "vitest";
import {
  buildQuery,
  extractVideoId,
  decodeHtmlEntities,
  parseTranscriptXml,
} from "../../packages/provider/youtube/src/youtube";

describe("buildQuery", () => {
  it("returns empty string for empty params", () => {
    expect(buildQuery({})).toBe("");
  });

  it("builds query string with single param", () => {
    expect(buildQuery({ part: "snippet" })).toBe("?part=snippet");
  });

  it("builds query string with multiple params", () => {
    expect(buildQuery({ part: "snippet", id: "123" })).toBe(
      "?part=snippet&id=123"
    );
  });

  it("skips undefined params", () => {
    expect(buildQuery({ part: "snippet", chart: undefined })).toBe(
      "?part=snippet"
    );
  });

  it("handles numeric params", () => {
    expect(buildQuery({ maxResults: 50 })).toBe("?maxResults=50");
  });

  it("handles mixed params", () => {
    expect(
      buildQuery({
        part: "snippet",
        maxResults: 10,
        pageToken: undefined,
        id: "abc",
      })
    ).toBe("?part=snippet&maxResults=10&id=abc");
  });
});

describe("extractVideoId", () => {
  it("returns raw video ID", () => {
    expect(extractVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from standard watch URL", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("extracts ID from short URL", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from embed URL", () => {
    expect(extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("returns null for invalid ID", () => {
    expect(extractVideoId("too-short")).toBe(null);
  });

  it("returns null for random URL", () => {
    expect(extractVideoId("https://example.com/video")).toBe(null);
  });

  it("returns null for empty string", () => {
    expect(extractVideoId("")).toBe(null);
  });

  it("handles video ID with hyphens and underscores", () => {
    expect(extractVideoId("aB_c-D1e2F3")).toBe("aB_c-D1e2F3");
  });
});

describe("decodeHtmlEntities", () => {
  it("decodes &quot;", () => {
    expect(decodeHtmlEntities("&quot;hello&quot;")).toBe('"hello"');
  });

  it("decodes &amp;", () => {
    expect(decodeHtmlEntities("A &amp; B")).toBe("A & B");
  });

  it("decodes &lt; and &gt;", () => {
    expect(decodeHtmlEntities("&lt;tag&gt;")).toBe("<tag>");
  });

  it("decodes &#39;", () => {
    expect(decodeHtmlEntities("It&#39;s great")).toBe("It's great");
  });

  it("decodes &#x27;", () => {
    expect(decodeHtmlEntities("It&#x27;s great")).toBe("It's great");
  });

  it("decodes &apos;", () => {
    expect(decodeHtmlEntities("It&apos;s great")).toBe("It's great");
  });

  it("decodes multiple entities", () => {
    expect(
      decodeHtmlEntities("&quot;A&quot; &amp; &lt;B&gt; &apos;C&apos;")
    ).toBe("\"A\" & <B> 'C'");
  });

  it("returns plain text unchanged", () => {
    expect(decodeHtmlEntities("hello world")).toBe("hello world");
  });
});

describe("parseTranscriptXml", () => {
  it("parses single transcript segment", () => {
    const xml = '<text start="1.23" dur="4.56">Hello world</text>';
    const result = parseTranscriptXml(xml);
    expect(result).toEqual([
      { start: 1.23, duration: 4.56, text: "Hello world" },
    ]);
  });

  it("parses multiple transcript segments", () => {
    const xml =
      '<text start="0.0" dur="2.0">First</text><text start="2.0" dur="3.0">Second</text>';
    const result = parseTranscriptXml(xml);
    expect(result).toEqual([
      { start: 0, duration: 2, text: "First" },
      { start: 2, duration: 3, text: "Second" },
    ]);
  });

  it("returns empty array for empty XML", () => {
    expect(parseTranscriptXml("")).toEqual([]);
  });

  it("returns empty array when no text elements", () => {
    expect(parseTranscriptXml("<root><other/></root>")).toEqual([]);
  });

  it("decodes HTML entities in text", () => {
    const xml = '<text start="1.0" dur="2.0">A &amp; B</text>';
    const result = parseTranscriptXml(xml);
    expect(result).toEqual([{ start: 1, duration: 2, text: "A & B" }]);
  });

  it("handles text with extra attributes on element", () => {
    const xml = '<text start="5.0" dur="1.0" some-attr="value">Content</text>';
    const result = parseTranscriptXml(xml);
    expect(result).toEqual([{ start: 5, duration: 1, text: "Content" }]);
  });
});
