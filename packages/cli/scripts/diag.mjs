// Hand-run diagnostic (no package.json script): which endpoint-docs.tsv rows
// fail to resolve, per provider. Needs `pnpm --filter @apicity/cli run build`.
import { buildRegistry, loadTsv } from "../dist/src/index.js";

process.env.OPENAI_API_KEY ||= "fake";
process.env.ANTHROPIC_API_KEY ||= "fake";
process.env.XAI_API_KEY ||= "fake";
process.env.FIREWORKS_API_KEY ||= "fake";
process.env.FAL_API_KEY ||= "fake";
process.env.KIE_API_KEY ||= "fake";
process.env.KIMI_CODING_API_KEY ||= "fake";
process.env.DASHSCOPE_API_KEY ||= "fake";
process.env.ELEVENLABS_API_KEY ||= "fake";
process.env.X_ACCESS_TOKEN ||= "fake";
process.env.IG_ACCESS_TOKEN ||= "fake";

const rows = await loadTsv();
const eps = await buildRegistry();

console.log(`TSV rows: ${rows.length}, registered: ${eps.length}`);

const haveByKey = new Set(
  eps.map((e) => `${e.provider}|${e.method}|${e.dotPath}`)
);
const missing = rows.filter(
  (r) => !haveByKey.has(`${r.provider}|${r.method}|${r.dotPath}`)
);
console.log(`\nMissing from registry: ${missing.length}`);
const missingByProvider = new Map();
for (const m of missing) {
  if (!missingByProvider.has(m.provider)) missingByProvider.set(m.provider, []);
  missingByProvider.get(m.provider).push(`${m.method} ${m.dotPath}`);
}
for (const [p, list] of [...missingByProvider.entries()].sort()) {
  console.log(`  ${p} (${list.length}):`);
  for (const sig of list.slice(0, 4)) console.log(`    ${sig}`);
  if (list.length > 4) console.log(`    ... +${list.length - 4} more`);
}
