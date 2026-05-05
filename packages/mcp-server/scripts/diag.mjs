// Diagnose which endpoints fail to resolve. Compare TSV vs registry.
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
const toolByName = new Map();
for (const e of eps) {
  if (!toolByName.has(e.toolName)) toolByName.set(e.toolName, []);
  toolByName.get(e.toolName).push(`${e.method} ${e.dotPath}`);
}

console.log(`TSV rows: ${rows.length}, registered: ${eps.length}`);
console.log(`Unique tool names: ${toolByName.size}`);

const collisions = [...toolByName.entries()].filter(([, v]) => v.length > 1);
console.log(`\nCollisions (${collisions.length}):`);
for (const [name, sigs] of collisions.slice(0, 15)) {
  console.log(`  ${name}: ${sigs.join(" | ")}`);
}

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
