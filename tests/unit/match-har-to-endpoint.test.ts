import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  compileTsvUrlPattern,
  findMatchingRow,
  matchHarEntryLenient,
  matchHarEntrySpanning,
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

const catalog: EndpointRow[] = readFileSync("scripts/endpoint-docs.tsv", "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => {
    const [provider, dotPath, method, fullUrl, docsUrl] = line.split("\t");
    return { provider, dotPath, method, fullUrl, docsUrl };
  });

function catalogRow(provider: string, method: string, dotPath: string) {
  const row = catalog.find(
    (r) =>
      r.provider === provider && r.method === method && r.dotPath === dotPath
  );
  if (!row) throw new Error(`no catalog row ${provider} ${method} ${dotPath}`);
  return row;
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

  it("lets a listed placeholder span whole segments and keeps the rest to one", () => {
    const url = "https://queue.fal.run/{endpoint_id}/requests/{request_id}";
    const spanning = compileTsvUrlPattern(url, ["endpoint_id"]);

    expect(
      compileTsvUrlPattern(url).test(
        "https://queue.fal.run/fal-ai/flux/dev/requests/r1"
      )
    ).toBe(false);
    expect(
      spanning.test("https://queue.fal.run/fal-ai/flux/dev/requests/r1")
    ).toBe(true);
    expect(
      spanning.test("https://queue.fal.run/fal-ai/flux/dev/requests/r1/x")
    ).toBe(false);
    expect(spanning.test("https://queue.fal.run/fal-ai//requests/r1")).toBe(
      false
    );
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

  it("matches version-normalized paths with concrete placeholder segments", () => {
    expect(
      matchHarEntryLenient(
        harEntry("https://runtime.example.com/files/file-abc/content"),
        endpointRow({
          fullUrl: "https://api.openai.com/v1/files/{file_id}/content",
        })
      )
    ).toBe(true);
  });

  it("matches list paths when an overloaded placeholder segment is omitted", () => {
    expect(
      matchHarEntryLenient(
        harEntry("https://api.openai.com/v1/batches?limit=2"),
        endpointRow({
          dotPath: "v1.batches",
          fullUrl: "https://api.openai.com/v1/batches/{idOrOpts}",
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

  it("rejects method mismatches before lenient path comparison", () => {
    expect(
      matchHarEntryLenient(
        harEntry("https://fal.run/fal-ai/fast-sdxl", "POST"),
        endpointRow({
          provider: "fal",
          dotPath: "v1.falAi.fastSdxl",
          fullUrl: "https://api.fal.ai/v1/fal-ai/fast-sdxl",
        })
      )
    ).toBe(false);
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
      findMatchingRow(harEntry("https://api.openai.com/v1/models"), [], {
        provider: "openai",
      })
    ).toBeNull();

    expect(
      findMatchingRow(
        harEntry("https://api.openai.com/v1/models"),
        [endpointRow()],
        { provider: "openai" }
      )
    ).toBeNull();
  });
});

describe("fal queue endpoint ids", () => {
  // fal endpoint ids are owner/model[/variant], and the queue rows put them in
  // the URL unencoded, so one `[^/]+` segment cannot match them (ac-bynay5).
  const base = "https://queue.fal.run/fal-ai/flux/dev";
  const request = "01a15e15-e01b-7052-af20-d94990a75498";

  it.each([
    ["POST", base, "v1.queue.submit"],
    [
      "POST",
      `${base}?fal_webhook=https%3A%2F%2Fexample.com`,
      "v1.queue.submit",
    ],
    ["GET", `${base}/requests/${request}/status`, "v1.queue.status"],
    ["GET", `${base}/requests/${request}`, "v1.queue.result"],
  ])("matches %s %s to fal %s", (method, url, dotPath) => {
    const entry = harEntry(url, method);
    const row = catalogRow("fal", method, dotPath);

    expect(matchHarEntryStrict(entry, row)).toBe(false);
    expect(matchHarEntrySpanning(entry, row)).toBe(true);
    expect(findMatchingRow(entry, [row], { provider: "fal" })).toBe(row);
    expect(findMatchingRow(entry, catalog, { provider: "fal" })).toBe(row);
    expect(findMatchingRow(entry, catalog)).toBe(row);
  });

  it("leaves a queue submit to a catalogued model path with the model's row", () => {
    const entry = harEntry(
      "https://queue.fal.run/bria/fibo-2/generate",
      "POST"
    );

    expect(findMatchingRow(entry, catalog, { provider: "fal" })).toBe(
      catalogRow("fal", "POST", "bria.fibo2.generate")
    );
  });

  it("spans segments only for the fal endpoint id on its own host", () => {
    const other = endpointRow({
      provider: "other",
      dotPath: "queue.submit",
      method: "POST",
      fullUrl: "https://queue.example.com/{endpoint_id}",
    });
    const deep = harEntry("https://queue.example.com/acme/model/dev", "POST");
    const submit = catalogRow("fal", "POST", "v1.queue.submit");

    expect(matchHarEntrySpanning(deep, other)).toBe(false);
    expect(findMatchingRow(deep, [other], { provider: "other" })).toBeNull();
    expect(
      matchHarEntrySpanning(
        harEntry("https://api.fal.ai/v1/models/requests/a/b/payloads"),
        catalogRow("fal", "GET", "v1.models.requests.payloads")
      )
    ).toBe(false);
    for (const url of [
      "https://queue.fal.run/",
      "https://queue.fal.run/fal-ai//dev",
      "https://fal.run/fal-ai/flux/dev",
    ]) {
      expect(matchHarEntrySpanning(harEntry(url, "POST"), submit)).toBe(false);
    }
    expect(matchHarEntrySpanning(harEntry(base, "GET"), submit)).toBe(false);
  });
});
