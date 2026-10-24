import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Polly } from "@pollyjs/core";
import FetchAdapter from "@pollyjs/adapter-fetch";
import { pollyEntryId, type Har, type HarEntry } from "@apicity/har";

// pollyEntryId once rebuilt queries with URLSearchParams, which Polly's
// url-parse + qs identity does not match (ac-9e2ha7).
const root = path.resolve("tests/recordings");
const queryParts = (url: string) => new URL(url).search.slice(1).split("&");
const repeatedKey = (url: string) => {
  const keys = queryParts(url).map((part) => part.split("=")[0]);
  return new Set(keys).size < keys.length;
};
const valuelessKey = (url: string) =>
  queryParts(url).some((part) => part !== "" && !part.includes("="));
const CORPUS: Array<{
  shape: string;
  file: string;
  has: (url: string) => boolean;
}> = [
  {
    shape: "escaped spaces, *, = and '",
    file: "dolthub_1325419171/sql-read-select_751489121/recording.har",
    has: (url) => ["%20", "%2A", "%3D", "%27"].every((s) => url.includes(s)),
  },
  {
    shape: "an escaped comma",
    file: "kie_2079838932/models-catalog-filtered_2666713159/recording.har",
    has: (url) => url.includes("%2C"),
  },
  {
    shape: "a repeated key",
    file: "elevenlabs_2379486140/convai-agent-testing_2232602436/recording.har",
    has: repeatedKey,
  },
  {
    shape: "a repeated key",
    file: "xai_3613880225/collections-documents-batchget_2925998328/recording.har",
    has: repeatedKey,
  },
  {
    shape: "valueless keys",
    file: "s3_106018211/bucket-config_3411174552/recording.har",
    has: valuelessKey,
  },
  {
    shape: "a valueless key beside an escaped value",
    file: "s3_106018211/bulk-versioning_2486007404/recording.har",
    has: (url) => valuelessKey(url) && url.includes("%2F"),
  },
];

describe("pollyEntryId query identity", () => {
  it.each(CORPUS)(
    "reproduces committed _ids with $shape ($file)",
    ({ file, has }) => {
      const har = JSON.parse(
        readFileSync(path.join(root, file), "utf8")
      ) as Har;
      // A request body is identity of its own; these pins are about the URL.
      const entries = har.log.entries.filter(
        (entry) => !entry.request.postData && has(entry.request.url)
      );
      expect(entries.length, file).toBeGreaterThan(0);
      for (const entry of entries)
        expect(pollyEntryId(entry), entry.request.url).toBe(entry._id);
    }
  );
});

// Polly's own identity for a header-less fetch(url) with its default URL
// matching, read in an intercept handler; nothing reaches the network.
const context = {
  fetch: (async () => {
    throw new Error("every request is intercepted");
  }) as typeof fetch,
  Request,
  Response,
  Headers,
};
let polly: Polly;
let seen: { id?: string; url: string } | undefined;
beforeAll(() => {
  polly = new Polly("har-polly-identity", {
    adapters: [FetchAdapter],
    adapterOptions: { fetch: { context } },
    logLevel: "silent",
  });
  polly.server.any().intercept((req, res) => {
    seen = { id: req.id, url: req.url };
    res.status(200).send("");
  });
});
afterAll(() => polly.stop());

async function pollyIdentity(url: string) {
  seen = undefined;
  await context.fetch(url);
  return seen!;
}

const entryFor = (url: string): Pick<HarEntry, "request"> => ({
  request: {
    method: "GET",
    url,
    httpVersion: "HTTP/1.1",
    cookies: [],
    headers: [],
    queryString: [],
    headersSize: -1,
    bodySize: 0,
  },
});

const base = "https://example.com/v1/items";
const URLS: Array<[string, string]> = [
  ["raw reserved characters", `${base}?q=SELECT * FROM t WHERE c = 'AU'`],
  ["form-encoded spaces", `${base}?q=SELECT+*+FROM+t&plus=a%2Bb`],
  ["RFC 3986 marks", `${base}?star=*&tilde=%7E&comma=a,b&marks=!'()`],
  ["repeated keys", `${base}?types=llm&types=folder&b=2&a=1`],
  ["valueless keys", `${base}?uploads&prefix=a%2Fb&cors`],
  ["empty values and keys", `${base}?a&a=1&b=&=x&&`],
  ["bracket arrays", `${base}?ids%5B%5D=k1&ids%5B%5D=k2`],
  ["indexed and nested keys", `${base}?a[1]=y&a[0]=x&f[b]=2&f[a]=1`],
  ["integer-like keys", `${base}?2=a&10=b&a=c`],
  ["non-ASCII", `${base}?caf%C3%A9=%C3%BC&é=ü`],
  [
    "more than 20 repeats",
    `${base}?${Array.from({ length: 25 }, (_, i) => `a=${i}`).join("&")}&b=x&b=y`,
  ],
  ["a fragment", `${base}?b=1&a=2#section`],
];

describe("pollyEntryId against Polly", () => {
  it.each(URLS)("hashes %s as Polly does", async (_, url) => {
    const recorded = await pollyIdentity(url);
    // A capture records the WHATWG serialization; Polly records its own.
    expect(pollyEntryId(entryFor(new Request(url).url))).toBe(recorded.id);
    expect(pollyEntryId(entryFor(recorded.url))).toBe(recorded.id);
  });
});
