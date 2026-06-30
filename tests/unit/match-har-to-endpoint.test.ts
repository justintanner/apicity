import { describe, expect, it } from "vitest";
import {
  compileTsvUrlPattern,
  findMatchingRow,
  matchHarEntryLenient,
  matchHarEntryStrict,
} from "../../scripts/lib/match-har-to-endpoint.mjs";

interface HarEntry {
  request: {
    method: string;
    url: string;
  };
}

interface EndpointRow {
  provider: string;
  dotPath: string;
  method: string;
  fullUrl: string;
  docsUrl: string;
}

function harEntry(url: string, method = "GET"): HarEntry {
  return {
    request: {
      method,
      url,
    },
  };
}

function endpointRow(overrides: Partial<EndpointRow> = {}): EndpointRow {
  return {
    provider: "openai",
    dotPath: "v1.files.content",
    method: "GET",
    fullUrl: "https://api.openai.com/v1/files/{file_id}/content",
    docsUrl: "https://docs.example.com",
    ...overrides,
  };
}

describe("compileTsvUrlPattern", () => {
  it("requires full URL matches while allowing path parameter segments", () => {
    const pattern = compileTsvUrlPattern(
      "https://api.openai.com/v1/files/{file_id}/content"
    );

    expect(
      pattern.test("https://api.openai.com/v1/files/file-abc/content")
    ).toBe(true);
    expect(pattern.test("https://api.openai.com/v1/files/file-abc")).toBe(
      false
    );
    expect(
      pattern.test("https://api.example.com/v1/files/file-abc/content")
    ).toBe(false);
  });

  it("strips query markers and literal query suffixes from TSV URLs", () => {
    const markerPattern = compileTsvUrlPattern(
      "https://catbox.moe/user/api.php{query}"
    );
    const queryPattern = compileTsvUrlPattern(
      "https://api.example.com/v1/items?limit={limit}"
    );

    expect(markerPattern.test("https://catbox.moe/user/api.php")).toBe(true);
    expect(queryPattern.test("https://api.example.com/v1/items")).toBe(true);
  });
});

describe("matchHarEntryStrict", () => {
  it("matches method and full URL exactly after path parameter expansion", () => {
    const row = endpointRow();

    expect(
      matchHarEntryStrict(
        harEntry("https://api.openai.com/v1/files/file-abc/content"),
        row
      )
    ).toBe(true);
    expect(
      matchHarEntryStrict(
        harEntry("https://api.openai.com/v1/files/file-abc"),
        row
      )
    ).toBe(false);
  });

  it("strips HAR query strings and rejects method mismatches", () => {
    const row = endpointRow();

    expect(
      matchHarEntryStrict(
        harEntry("https://api.openai.com/v1/files/file-abc/content?audit=true"),
        row
      )
    ).toBe(true);
    expect(
      matchHarEntryStrict(
        harEntry("https://api.openai.com/v1/files/file-abc/content", "POST"),
        row
      )
    ).toBe(false);
  });
});

describe("matchHarEntryLenient", () => {
  it("matches provider-equivalent paths across different hostnames", () => {
    expect(
      matchHarEntryLenient(
        harEntry("https://fal.run/fal-ai/fast-sdxl"),
        endpointRow({
          provider: "fal",
          dotPath: "v1.falAi.fastSdxl",
          fullUrl: "https://api.fal.ai/v1/fal-ai/fast-sdxl",
        })
      )
    ).toBe(true);
  });

  it("drops a leading API version segment before comparing paths", () => {
    expect(
      matchHarEntryLenient(
        harEntry("https://api.openai.com/models"),
        endpointRow({
          dotPath: "v1.models",
          fullUrl: "https://api.openai.com/v1/models",
        })
      )
    ).toBe(true);
  });

  it("strips query markers before path comparison", () => {
    expect(
      matchHarEntryLenient(
        harEntry("https://catbox.moe/user/api.php?reqtype=fileupload", "POST"),
        endpointRow({
          provider: "free-media-upload",
          dotPath: "catbox.upload",
          method: "POST",
          fullUrl: "https://catbox.moe/user/api.php{query}",
        })
      )
    ).toBe(true);
  });
});

describe("findMatchingRow", () => {
  it("returns a strict match before trying provider-scoped lenient matches", () => {
    const strict = endpointRow({ dotPath: "v1.files.content.strict" });
    const lenient = endpointRow({
      provider: "openai",
      dotPath: "v1.files.lenient",
      fullUrl: "https://alt.example.com/v1/files/{file_id}/content",
    });

    expect(
      findMatchingRow(
        harEntry("https://api.openai.com/v1/files/file-abc/content"),
        [lenient, strict],
        { provider: "openai" }
      )
    ).toBe(strict);
  });

  it("requires a provider before lenient fallback is considered", () => {
    const row = endpointRow({
      provider: "fal",
      dotPath: "v1.falAi.fastSdxl",
      fullUrl: "https://api.fal.ai/v1/fal-ai/fast-sdxl",
    });
    const entry = harEntry("https://fal.run/fal-ai/fast-sdxl");

    expect(findMatchingRow(entry, [row])).toBeNull();
    expect(findMatchingRow(entry, [row], { provider: "fal" })).toBe(row);
  });

  it("keeps lenient fallback scoped to the requested provider", () => {
    const otherProvider = endpointRow({
      provider: "other",
      dotPath: "v1.falAi.fastSdxl",
      fullUrl: "https://api.fal.ai/v1/fal-ai/fast-sdxl",
    });

    expect(
      findMatchingRow(
        harEntry("https://fal.run/fal-ai/fast-sdxl"),
        [otherProvider],
        { provider: "fal" }
      )
    ).toBeNull();
  });

  it("chooses the most specific lenient row when several rows match", () => {
    const generic = endpointRow({
      provider: "fal",
      dotPath: "model.root",
      fullUrl: "https://api.fal.ai/v1/fal-ai",
    });
    const specific = endpointRow({
      provider: "fal",
      dotPath: "model.operation",
      fullUrl: "https://api.fal.ai/v1/fal-ai/fast-sdxl",
    });

    expect(
      findMatchingRow(
        harEntry("https://fal.run/fal-ai/fast-sdxl"),
        [generic, specific],
        { provider: "fal" }
      )
    ).toBe(specific);
  });

  it("returns null when neither strict nor lenient matching finds a row", () => {
    expect(
      findMatchingRow(
        harEntry("https://api.openai.com/v1/models"),
        [endpointRow()],
        { provider: "openai" }
      )
    ).toBeNull();
  });
});
