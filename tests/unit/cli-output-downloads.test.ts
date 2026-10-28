import { once } from "node:events";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { createServer, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { runEndpoint } from "../../packages/cli/src/main";
import {
  DOWNLOAD_STALL_TIMEOUT_MS,
  downloadUrlsInResult,
} from "../../packages/cli/src/output";
import type { InstantiatedProvider } from "../../packages/cli/src/providers";

// ac-xy195o: `apicity fal storage.upload.initiate` printed nothing until it
// was killed. Its answer, `{ file_url, upload_url }`, went through the media
// walk, which GETs every `file_url`. Nothing exists there until the caller
// PUTs the bytes, and fal's CDN holds that GET open without answering (a live
// probe saw no headers in 45 s), so the walk never settled. An upload ticket
// now comes back as sent, and any other download is abandoned once it stalls.

const HOME = mkdtempSync(join(tmpdir(), "apicity-cli-home-"));
const TRICKLE_CHUNKS = 30;
const CAPTIONS = "1\n00:00:00,000 --> 00:00:01,000\nA cat.\n";

/** A loopback server whose routes misbehave on purpose; no network involved. */
let server: Server;
let base: string;
const requested: string[] = [];

const ROUTES: Record<string, (res: ServerResponse) => void> = {
  "/preview.png": (res) => {
    res.writeHead(200, { "content-type": "image/png" });
    res.end(Buffer.from([1, 2, 3]));
  },
  "/one.png": (res) => {
    res.writeHead(200, { "content-type": "image/png" });
    res.end(Buffer.from([1]));
  },
  "/two.png": (res) => {
    res.writeHead(200, { "content-type": "image/png" });
    res.end(Buffer.from([2]));
  },
  "/three.png": (res) => {
    res.writeHead(200, { "content-type": "image/png" });
    res.end(Buffer.from([3]));
  },
  // fal returns captions, configs and 3D models under `url` as text/plain,
  // application/json and model/*.
  "/captions.srt": (res) => {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end(CAPTIONS);
  },
  // A web page whose body never ends: reading it would stall the download.
  "/page": (res) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.write("<!DOCTYPE html><html>");
  },
  // Takes the request and never answers, as fal's CDN does for an object
  // nobody has uploaded yet.
  "/silent": () => {},
  // Sends the headers and one chunk, then goes quiet.
  "/stalls": (res) => {
    res.writeHead(200, { "content-type": "video/mp4" });
    res.write(Buffer.from([0]));
  },
  // Slow but steady: chunks 50 ms apart, so the whole transfer outlasts the
  // 1 s stall budget its test uses while no single gap comes near it.
  "/trickle": (res) => {
    res.writeHead(200, { "content-type": "audio/mpeg" });
    let sent = 0;
    const tick = setInterval(() => {
      res.write(Buffer.from([sent]));
      sent += 1;
      if (sent === TRICKLE_CHUNKS) {
        clearInterval(tick);
        res.end();
      }
    }, 50);
    res.on("close", () => clearInterval(tick));
  },
};

beforeAll(async () => {
  server = createServer((req, res) => {
    const path = new URL(req.url ?? "/", "http://loopback").pathname;
    requested.push(path);
    const route = ROUTES[path];
    if (route) return route(res);
    res.writeHead(404).end();
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

afterEach(() => {
  requested.length = 0;
  vi.restoreAllMocks();
});

function outputDir(): string {
  return mkdtempSync(join(tmpdir(), "apicity-cli-out-"));
}

describe("an upload ticket", () => {
  const TICKET = {
    file_url: "https://v3b.fal.media/files/b/0a96d564/QR9a1l_cat1.jpg",
    upload_url:
      "https://v3b.fal.media/files/b/0a96d564/QR9a1l_cat1.jpg?signature=test",
  };
  const fal = {
    storage: {
      upload: { initiate: () => TICKET, initiateMultipart: () => TICKET },
    },
  } as unknown as InstantiatedProvider;

  for (const dotPath of [
    "storage.upload.initiate",
    "storage.upload.initiateMultipart",
  ]) {
    it(`comes back from fal ${dotPath} with neither URL fetched`, async () => {
      // Rejecting rather than hanging, so a regression fails here instead of
      // timing out.
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockRejectedValue(new Error("unexpected fetch"));
      const dir = outputDir();
      const out: string[] = [];
      const err: string[] = [];

      const exit = await runEndpoint(
        "fal",
        [
          dotPath,
          "--data",
          JSON.stringify({ file_name: "cat1.jpg", content_type: "image/jpeg" }),
          "--output-dir",
          dir,
          "--quiet",
        ],
        { out: (text) => out.push(text), err: (text) => err.push(text) },
        {
          env: { HOME, FAL_API_KEY: "fal-test" },
          stdoutIsTTY: false,
          instantiate: () => Promise.resolve(fal),
        }
      );

      expect(exit).toBe(0);
      expect(err).toEqual([]);
      expect(JSON.parse(out[0])).toEqual(TICKET);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(readdirSync(dir)).toEqual([]);
    });
  }

  it("is recognized per object, so other media in the result still downloads", async () => {
    const ticket = {
      file_url: `${base}/ticket/cat1.jpg`,
      upload_url: `${base}/ticket/cat1.jpg?signature=test`,
    };

    const result = (await downloadUrlsInResult(
      { ticket, preview: { url: `${base}/preview.png` } },
      outputDir(),
      "fal__storage.upload.initiate"
    )) as Record<string, Record<string, string>>;

    expect(result.ticket).toEqual(ticket);
    expect([...readFileSync(result.preview.url_savedTo)]).toEqual([1, 2, 3]);
    expect(requested).toEqual(["/preview.png"]);
  });
});

describe("a provider whose URLs are web pages", () => {
  // ac-cle0z4: every row of an Endless TikTok trends answer carries `url`, a
  // TikTok video page, and the walk fetched and saved each one as HTML.
  it("comes back from endless with no URL fetched", async () => {
    const trends = {
      region: "thailand",
      videos: [{ id: "1", url: `${base}/preview.png` }],
      longest: [{ video: { id: "1", url: `${base}/preview.png` } }],
    };
    const endless = {
      social: { tiktokTrends: { public: () => trends } },
    } as unknown as InstantiatedProvider;
    const dir = outputDir();
    const out: string[] = [];
    const err: string[] = [];

    const exit = await runEndpoint(
      "endless",
      [
        "social.tiktokTrends.public",
        "--region",
        "thailand",
        "--output-dir",
        dir,
        "--quiet",
      ],
      { out: (text) => out.push(text), err: (text) => err.push(text) },
      {
        env: { HOME },
        stdoutIsTTY: false,
        instantiate: () => Promise.resolve(endless),
      }
    );

    expect(exit).toBe(0);
    expect(err).toEqual([]);
    expect(JSON.parse(out[0])).toEqual(trends);
    expect(requested).toEqual([]);
    expect(readdirSync(dir)).toEqual([]);
  });
});

describe("a URL that answers with a web page", () => {
  // ac-ht9p12: OpenAI web-search citations, ElevenLabs docs links and Endless
  // trend rows put page links under `url`, and each was saved as `.bin` HTML.
  it("is left as sent, with its body unread", async () => {
    const dir = outputDir();
    const page = { citation: { url: `${base}/page` } };

    const result = await downloadUrlsInResult(
      page,
      dir,
      "openai__v1.responses",
      {
        stallTimeoutMs: 1_000,
      }
    );

    expect(result).toEqual(page);
    expect(requested).toEqual(["/page"]);
    expect(readdirSync(dir)).toEqual([]);
  });

  it("does not stop other text from saving", async () => {
    const result = (await downloadUrlsInResult(
      { captions: { url: `${base}/captions.srt` } },
      outputDir(),
      "fal__run.captions"
    )) as Record<string, Record<string, string>>;

    expect(result.captions.url_savedTo).toMatch(/\.srt$/);
    expect(readFileSync(result.captions.url_savedTo, "utf8")).toBe(CAPTIONS);
  });
});

describe("several downloads from one result", () => {
  // ac-ht9p12: names were timestamped to the millisecond, so parallel
  // downloads that finished together overwrote each other.
  it("keep one file per URL when they finish in the same millisecond", async () => {
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(
      "2026-10-28T10:00:00.000Z"
    );
    const dir = outputDir();

    const result = (await downloadUrlsInResult(
      {
        items: [
          { url: `${base}/one.png` },
          { url: `${base}/two.png` },
          { url: `${base}/three.png` },
        ],
      },
      dir,
      "test__several"
    )) as { items: Record<string, string>[] };

    const saved = result.items.map((item) => item.url_savedTo);
    expect(saved.map((path) => [...readFileSync(path)])).toEqual([
      [1],
      [2],
      [3],
    ]);
    expect(readdirSync(dir).sort()).toEqual([
      "test__several__2026-10-28T10-00-00-000Z-1.png",
      "test__several__2026-10-28T10-00-00-000Z-2.png",
      "test__several__2026-10-28T10-00-00-000Z-3.png",
    ]);
  });

  it("leave a single download's name unnumbered", async () => {
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(
      "2026-10-28T10:00:00.000Z"
    );
    const dir = outputDir();

    await downloadUrlsInResult({ url: `${base}/one.png` }, dir, "test__single");

    expect(readdirSync(dir)).toEqual([
      "test__single__2026-10-28T10-00-00-000Z.png",
    ]);
  });
});

describe("a download that stalls", () => {
  it("is abandoned when no response arrives, without naming the URL", async () => {
    const dir = outputDir();
    const started = Date.now();

    const result = (await downloadUrlsInResult(
      { url: `${base}/silent?X-Amz-Signature=not-a-real-signature` },
      dir,
      "test__silent",
      { stallTimeoutMs: 200 }
    )) as Record<string, string>;

    expect(result.url_savedTo).toBe(
      "error: download stalled: no data for 200 ms"
    );
    expect(Date.now() - started).toBeLessThan(10_000);
    expect(readdirSync(dir)).toEqual([]);
  });

  it("is abandoned when the body stops arriving", async () => {
    const dir = outputDir();

    const result = (await downloadUrlsInResult(
      { video_url: `${base}/stalls` },
      dir,
      "test__stalls",
      { stallTimeoutMs: 200 }
    )) as Record<string, string>;

    expect(result.video_url_savedTo).toBe(
      "error: download stalled: no data for 200 ms"
    );
    expect(readdirSync(dir)).toEqual([]);
  });

  it("is measured as silence, so a slow but steady transfer completes", async () => {
    const started = Date.now();

    const result = (await downloadUrlsInResult(
      { audio_url: `${base}/trickle` },
      outputDir(),
      "test__trickle",
      { stallTimeoutMs: 1_000 }
    )) as Record<string, string>;

    // The transfer outlasted the budget, so a cap on total time would have
    // cut it off; only the gaps between chunks are measured.
    expect(Date.now() - started).toBeGreaterThan(1_000);
    expect([...readFileSync(result.audio_url_savedTo)]).toEqual(
      Array.from({ length: TRICKLE_CHUNKS }, (_, i) => i)
    );
  });

  it("is bounded by default", () => {
    expect(DOWNLOAD_STALL_TIMEOUT_MS).toBe(60_000);
  });
});
