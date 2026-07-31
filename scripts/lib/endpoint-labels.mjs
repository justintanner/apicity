/**
 * Rendered labels for generated provider READMEs.
 *
 * The walker's `ep.dotPath` (`logicalDotPath` in `endpoint-walk.mjs`) drops
 * every HTTP-method segment and every `stream`/`ws`/`run` segment, wherever
 * they appear. That makes two structurally different pairs of definition
 * sites collapse onto one label:
 *
 *   - verb aliases  — `fal.v1.models` and `fal.get.v1.models` are two
 *     declarations of the *same* endpoint, so they should render once;
 *   - stream variants — `post.coding.v1.messages` and
 *     `post.stream.coding.v1.messages` are different callables with different
 *     behaviour, so they should render twice under distinct labels.
 *
 * `resolveEndpointLabels` tells the two apart by comparing the *callee* path
 * (`fullDotPath` minus its leading verb segments) and returns both the label
 * to render each endpoint under and the set of endpoints worth rendering.
 */
import { METHOD_KEYS, STREAM_KEYS } from "./endpoint-walk.mjs";

/**
 * The rendered label for a single endpoint, ignoring collisions with its
 * siblings. Also the **fallback** docs-row lookup key in
 * `resolveEndpointDocRow` (`doc-gen.mjs`): that resolver keys on the rendered
 * label first, and falls back to this value so a relabelled block with no row
 * of its own still resolves to its canonical sibling's TSV row.
 */
export function displayDotPath(providerName, ep) {
  if (providerName !== "kie") {
    if (
      providerName === "elevenlabs" &&
      ep.fullDotPath &&
      ep.dotPath &&
      ep.fullDotPath.startsWith(`${ep.dotPath}.`)
    ) {
      const suffix = ep.fullDotPath.slice(ep.dotPath.length + 1);
      if (REST_ALIAS_SUFFIXES.has(suffix)) return ep.fullDotPath;
    }
    return ep.dotPath;
  }

  if (ep.file.endsWith("/suno.ts")) return `suno.${ep.fullDotPath}`;
  if (ep.file.endsWith("/veo.ts")) return `veo.${ep.fullDotPath}`;
  if (ep.file.endsWith("/chat.ts")) return `chat.${ep.fullDotPath}`;
  if (ep.file.endsWith("/claude.ts")) return ep.fullDotPath;
  return ep.fullDotPath ?? ep.dotPath;
}

const REST_ALIAS_SUFFIXES = new Set([
  "list",
  "retrieve",
  "create",
  "del",
  "delete",
  "update",
  "cancel",
  "get",
  "stream",
  "results",
]);

/**
 * Does this provider's surface carry a leading HTTP-verb namespace?
 *
 * Every provider but `s3` declares endpoints under a leading verb segment
 * (`get.v1.models`), so that segment is a namespace and is stripped when
 * comparing callee identity. `s3` declares its endpoints without one, so its
 * first segment is a real path segment and must never be stripped — doing so
 * would make unrelated `s3` endpoints compare equal and collapse.
 */
function hasVerbNamespace(providerName) {
  return providerName !== "s3";
}

/**
 * `ep.fullDotPath` with **leading** HTTP-verb segments removed and nothing
 * else. Two definition sites that share a callee path are verb aliases of one
 * endpoint.
 *
 * Head-only is load-bearing: filtering verbs globally would also strip the
 * *trailing* `.get` / `.delete` segments that elevenlabs, dolthub, and
 * fireworks document as real endpoints (`v1.convai.tools.get`).
 */
export function calleeDotPath(providerName, ep) {
  const segs = (ep.fullDotPath ?? ep.dotPath ?? "").split(".");
  let i = 0;
  if (hasVerbNamespace(providerName)) {
    while (i < segs.length && METHOD_KEYS.has(segs[i].toLowerCase())) i++;
  }
  return segs.slice(i).join(".") || (ep.dotPath ?? "");
}

function hasLeadingVerb(providerName, ep) {
  if (!hasVerbNamespace(providerName)) return false;
  const first = (ep.fullDotPath ?? "").split(".")[0] ?? "";
  return METHOD_KEYS.has(first.toLowerCase());
}

function streamSegmentCount(ep) {
  const segs = (ep.fullDotPath ?? ep.dotPath ?? "").split(".");
  return segs.filter((seg) => STREAM_KEYS.has(seg.toLowerCase())).length;
}

/**
 * Resolve the rendered label of every endpoint in one provider's walk.
 *
 * Returns `{ labels, rendered }`:
 *   - `labels` — Map keyed by the endpoint objects passed in, valued by the
 *     label to render that endpoint under;
 *   - `rendered` — the input endpoints minus collapsed verb aliases, in input
 *     order. Endpoints dropped here are absent from `labels` too.
 *
 * Within a `(displayDotPath, method)` collision group:
 *   1. sub-group by `calleeDotPath`; members of one sub-group are verb aliases
 *      of a single path, so only one survives — preferring the site with no
 *      leading verb segment, whose `ep.file` / `ep.fullUrl` is the bare
 *      declaration;
 *   2. a lone surviving sub-group keeps the base label;
 *   3. otherwise the canonical sub-group — fewest `STREAM_KEYS` segments,
 *      tie-broken by shortest then lexicographically-first `calleeDotPath` —
 *      keeps the base label, and every other sub-group is labelled with its
 *      own `fullDotPath` (the real access path, so the rendered label
 *      resolves — `calleeDotPath` groups but does not necessarily resolve).
 *
 * Rule 3 is what keeps `fal v1.serverless.logs POST` (a real TSV row whose
 * definition site is `v1.serverless.logs.stream`) on its documented label
 * instead of renaming both siblings.
 */
export function resolveEndpointLabels(providerName, endpoints) {
  const labels = new Map();
  const dropped = new Set();

  const groups = new Map();
  for (const ep of endpoints) {
    const base = displayDotPath(providerName, ep);
    const key = `${base}\t${ep.method ?? ""}`;
    const group = groups.get(key) ?? { base, members: [] };
    group.members.push(ep);
    groups.set(key, group);
  }

  for (const { base, members } of groups.values()) {
    if (members.length === 1) {
      labels.set(members[0], base);
      continue;
    }

    const byCallee = new Map();
    for (const ep of members) {
      const callee = calleeDotPath(providerName, ep);
      const list = byCallee.get(callee) ?? [];
      list.push(ep);
      byCallee.set(callee, list);
    }

    const survivors = [];
    for (const [callee, list] of byCallee) {
      const keep =
        list.find((ep) => !hasLeadingVerb(providerName, ep)) ?? list[0];
      for (const ep of list) if (ep !== keep) dropped.add(ep);
      survivors.push({ callee, ep: keep });
    }

    if (survivors.length === 1) {
      labels.set(survivors[0].ep, base);
      continue;
    }

    const canonical = survivors.reduce((best, cur) =>
      isMoreCanonical(cur, best) ? cur : best
    );
    for (const survivor of survivors) {
      // `callee` is the *identity* key — "are these two sites the same
      // endpoint?" — and need not resolve on the provider object, because
      // stripping the leading verb is what makes verb aliases compare equal.
      // The label chosen here is *rendered* as a copy-pasteable call, so it
      // must resolve; use `fullDotPath`, which is by construction the real
      // access path from the provider root.
      labels.set(
        survivor.ep,
        survivor === canonical
          ? base
          : (survivor.ep.fullDotPath ?? survivor.callee)
      );
    }
  }

  return { labels, rendered: endpoints.filter((ep) => !dropped.has(ep)) };
}

function isMoreCanonical(a, b) {
  const aStreams = streamSegmentCount(a.ep);
  const bStreams = streamSegmentCount(b.ep);
  if (aStreams !== bStreams) return aStreams < bStreams;
  if (a.callee.length !== b.callee.length)
    return a.callee.length < b.callee.length;
  return a.callee < b.callee;
}
