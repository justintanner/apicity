/**
 * Print the frontier price catalog as one JSON object on stdout.
 *
 * `docs/frontier.md` is rendered by a plain Node script. This file is the
 * bridge: it runs under `node --import tsx` and reads the same price
 * function `frontier()` uses. It does not download a price.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatFrontierPrice,
  frontierPrice,
} from "../../packages/provider/cost/src/frontier/price.ts";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);
const FRONTIER = path.join(ROOT, "scripts", "frontier");

interface EndpointRecord {
  provider: string;
  dotPath: string;
  modelId?: string;
  pricingKey?: string;
}

const catalog: Record<
  string,
  { price: ReturnType<typeof frontierPrice>; text: string }
> = {};

for (const entry of readdirSync(FRONTIER, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(FRONTIER, entry.name, "endpoints.json");
  const map = JSON.parse(readFileSync(file, "utf8")) as Record<
    string,
    EndpointRecord[]
  >;
  for (const [model, list] of Object.entries(map)) {
    list.forEach((endpoint, index) => {
      const price = frontierPrice(endpoint);
      catalog[`${entry.name}\t${model}\t${index}`] = {
        price,
        text: formatFrontierPrice(price),
      };
    });
  }
}

process.stdout.write(JSON.stringify(catalog));
