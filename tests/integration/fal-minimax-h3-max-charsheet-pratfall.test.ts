import { appendFileSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { computeEstimate } from "@apicity/cost";
import {
  createFal,
  FalError,
  type FalMinimaxH3MaxReferenceToVideoRequest,
} from "@apicity/fal";
import {
  CHARSHEET_PRATFALL_PROMPT,
  CHARSHEET_PRATFALL_SOFT_PROMPT,
  CHARSHEET_URL,
} from "../charsheet-pratfall-helpers";
import {
  recordingExists,
  setupPolly,
  teardownPolly,
  type PollyContext,
} from "../harness";

// Live re-read 2026-11-25, before the paid call. GET
// https://api.fal.ai/v1/models/pricing?endpoint_id=minimax/h3-max/reference-to-video
// returned one row: 0.05 USD per billable second. The local floor still
// prices 768P at 0.08 USD/s, which is 8 of those units for 5 seconds
// (0.40 USD) and warns that the output can run about 0.7 s long and that
// reference tokens past 4,096 are extra. A POST with aspect_ratio "2:1"
// returned HTTP 422, x-fal-billable-units 0, and listed 9:16 among the
// allowed ratios. This schema has no audio switch, so the clip stays at
// the route default. The prompt prepends "Image 1" because the field
// documents references that way. The paid call is request
// 01a213a1-7739-7853-86e9-2a5baf2ad0a1 (8 billable units, 0.40 USD).
const ENDPOINT = "minimax/h3-max/reference-to-video";
const UNIT_USD = 0.05;
const FLOOR_USD = 0.4;
const RECORDING_CEILING_USD = 2;
const PLAN_CAP_USD = 10;
const LEDGER = "/gc/apicity/plans/ac-gupjgo/evidence/spend-ledger.tsv";

function planSpendUsd(): number {
  let text = "";
  try {
    text = readFileSync(LEDGER, "utf8");
  } catch {
    return 0;
  }
  return text
    .split("\n")
    .slice(1)
    .reduce((sum, line) => {
      const usd = Number(line.split("\t")[5]);
      return sum + (Number.isFinite(usd) ? usd : 0);
    }, 0);
}

function header(headers: unknown, name: string): string | null {
  if (!headers) return null;
  if (typeof (headers as { get?: unknown }).get === "function") {
    return (headers as { get: (n: string) => string | null }).get(name);
  }
  if (Array.isArray(headers)) {
    const hit = headers.find(
      (item: { name?: string }) => item.name?.toLowerCase() === name
    );
    return hit ? String((hit as { value?: unknown }).value ?? "") : null;
  }
  const record = headers as Record<string, unknown>;
  const value = record[name] ?? record[name.toLowerCase()];
  return value == null ? null : String(value);
}

const moderation = (message: string) =>
  /moderat|safety|policy|refus|prohibited|violat/i.test(message);

const transient = (message: string, status?: number) =>
  (status !== undefined && status >= 500) ||
  /timeout|temporar|unavailable|try again|upstream/i.test(message);

describe("fal MiniMax H3 Max charsheet pratfall", () => {
  let ctx: PollyContext | undefined;

  afterEach(async () => {
    if (ctx) await teardownPolly(ctx);
  });

  it("generates a 768P 5s 9:16 reference-to-video", async () => {
    const name = "fal/minimax-h3-max-charsheet-pratfall";
    const live =
      process.env.POLLY_MODE === "record" ||
      (process.env.POLLY_MODE === "record-missing" && !recordingExists(name));
    let prompt =
      "Image 1 is the reference character sheet.\n" + CHARSHEET_PRATFALL_PROMPT;
    let result: { video: { url: string } } | null = null;
    let billedUsd = 0;
    let requestId = "";
    // createFal captures global fetch, so it has to come after Polly.
    ctx = setupPolly(name);
    const provider = createFal({
      apiKey: process.env.FAL_API_KEY ?? "fal-test-key",
      timeout: 900000,
    });
    const generate = provider.run.minimax.h3Max.referenceToVideo;
    let units: string | null = null;
    let statusCode = 0;
    ctx.polly.server.any().on("beforeResponse", (_req, response) => {
      statusCode = response.statusCode;
      const headers = (response as { headers?: unknown }).headers;
      units = header(headers, "x-fal-billable-units");
      requestId =
        header(headers, "x-fal-request-id") ??
        header(headers, "x-fal-served-from") ??
        requestId;
    });

    for (let attempt = 0; attempt < 2 && !result; attempt++) {
      const request: FalMinimaxH3MaxReferenceToVideoRequest = {
        prompt,
        reference_image_urls: [CHARSHEET_URL],
        duration: 5,
        resolution: "768P",
        aspect_ratio: "9:16",
      };
      expect(generate.schema.safeParse(request).success).toBe(true);
      const estimate = computeEstimate({
        provider: "fal",
        endpoint: ENDPOINT,
        payload: request,
      });
      expect(estimate.usd).toBeCloseTo(FLOOR_USD, 6);
      expect(estimate.usd).toBeLessThanOrEqual(RECORDING_CEILING_USD);
      expect(estimate.warnings.join(" ")).toContain("lower bound");
      if (live && attempt === 0) {
        const spent = planSpendUsd();
        if (spent + estimate.usd > PLAN_CAP_USD) {
          throw new Error(
            `plan spend ${spent} + ${estimate.usd} would cross ${PLAN_CAP_USD} USD`
          );
        }
      }

      try {
        result = await generate(request);
      } catch (error) {
        const status = error instanceof FalError ? error.status : statusCode;
        const detail =
          error instanceof FalError
            ? `${error.message} ${JSON.stringify(error.body)}`
            : String(error);
        const retry =
          attempt === 0 && (moderation(detail) || transient(detail, status));
        if (retry && moderation(detail)) {
          prompt =
            "Image 1 is the reference character sheet.\n" +
            CHARSHEET_PRATFALL_SOFT_PROMPT;
        }
        if (retry) {
          const failedUnits = Number(units);
          if (live && Number.isFinite(failedUnits) && failedUnits > 0) {
            appendFileSync(
              LEDGER,
              [
                new Date().toISOString(),
                "ac-7ky39s",
                "fal",
                ENDPOINT,
                requestId || "unknown",
                (failedUnits * UNIT_USD).toFixed(6),
                "n/a (fal has no balance API)",
                "n/a (fal has no balance API)",
                `billed failure before retry; units ${units}`,
              ].join("\t") + "\n"
            );
          }
          continue;
        }
        throw error;
      }
      expect(statusCode).toBe(200);
      const parsedUnits = Number(units);
      billedUsd = Number.isFinite(parsedUnits) ? parsedUnits * UNIT_USD : 0;
      if (live) {
        appendFileSync(
          LEDGER,
          [
            new Date().toISOString(),
            "ac-7ky39s",
            "fal",
            ENDPOINT,
            requestId || "unknown",
            billedUsd.toFixed(6),
            "n/a (fal has no balance API)",
            "n/a (fal has no balance API)",
            `billable units ${units ?? "missing"} x ${UNIT_USD} USD; local 768P floor ${FLOOR_USD}`,
          ].join("\t") + "\n"
        );
      }
    }

    expect(result).not.toBeNull();
    expect(result?.video.url).toMatch(/^https:\/\//);
    if (live && result) {
      console.log(
        JSON.stringify({
          recording: name,
          requestId,
          video: result.video.url,
          usd: billedUsd,
        })
      );
    }
  }, 900000);
});
