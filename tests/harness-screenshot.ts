/**
 * Renders a HAR viewer HTML file in headless Chromium and captures a
 * full-page screenshot. Used by CI to attach a visual artifact to PRs.
 *
 * Usage:
 *   npx tsx tests/harness-screenshot.ts <input.html> <output.png> [--width N]
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

interface ScreenshotOptions {
  htmlPath: string;
  outPath: string;
  width: number;
}

function parseArgs(argv: string[]): ScreenshotOptions {
  const positional: string[] = [];
  let width = 1920;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--width" && argv[i + 1]) {
      width = parseInt(argv[++i], 10);
    } else if (!arg.startsWith("-")) {
      positional.push(arg);
    }
  }

  const htmlPath = positional[0];
  const outPath = positional[1];

  if (!htmlPath || !outPath) {
    throw new Error(
      "Usage: tsx tests/harness-screenshot.ts <input.html> <output.png> [--width N]"
    );
  }

  return {
    htmlPath: path.resolve(htmlPath),
    outPath: path.resolve(outPath),
    width,
  };
}

// Chromium hard-limits screenshot dimensions to ~16384px on each axis.
// Leave some headroom so we never bump into the cap.
const MAX_SCREENSHOT_HEIGHT = 14000;

async function captureScreenshot(opts: ScreenshotOptions): Promise<void> {
  if (!fs.existsSync(opts.htmlPath)) {
    throw new Error(`Input HTML not found: ${opts.htmlPath}`);
  }

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: opts.width, height: 1080 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto("file://" + opts.htmlPath);
    await page.waitForLoadState("networkidle").catch(() => {
      // Some media URLs may 404 — that's fine, we still capture what loaded.
    });
    // Give base64 data URLs and any pending image decodes a moment to render.
    await page.waitForTimeout(2000);

    const pageHeight = await page.evaluate(
      () => document.documentElement.scrollHeight
    );

    if (pageHeight <= MAX_SCREENSHOT_HEIGHT) {
      await page.screenshot({ path: opts.outPath, fullPage: true });
    } else {
      // Page is too tall for a single screenshot — clip to the cap.
      // Reviewers can still get the full content via the interactive viewer.
      console.warn(
        `Page height ${pageHeight}px exceeds cap ${MAX_SCREENSHOT_HEIGHT}px — clipping.`
      );
      await page.screenshot({
        path: opts.outPath,
        clip: { x: 0, y: 0, width: opts.width, height: MAX_SCREENSHOT_HEIGHT },
      });
    }
  } finally {
    await browser.close();
  }
}

const opts = parseArgs(process.argv.slice(2));
await captureScreenshot(opts);
const stat = fs.statSync(opts.outPath);
console.log(
  `Wrote ${opts.outPath} (${(stat.size / 1024).toFixed(1)} KB) at width ${opts.width}px`
);
