/**
 * Convert an upstream URL path into apicity's dotted namespace segments.
 *
 * Rule (from CLAUDE.md): method paths mirror upstream URL paths segment-by-
 * segment; kebab- or snake-case segments become camelCase; path parameters
 * like `{id}` are dropped (they're arguments, not namespaces).
 *
 * Hostnames contribute their *subdomain* labels (the part before the
 * registrable two-label domain), minus conventional `api`/`www`. This lets
 * providers like fal that split services across subdomains
 * (`queue.fal.run`, `api.fal.ai`) produce distinct dotPaths.
 *
 * Pass `{ keepFullHostname: true }` for providers like `free` that wrap
 * multiple unrelated hosts — then every hostname label is retained as a
 * distinguishing prefix (e.g. `tmpfiles.org`, `catbox.moe`).
 *
 *   urlToDotPath("https://api.openai.com/v1/chat/completions")
 *     → ["v1", "chat", "completions"]
 *   urlToDotPath("/v1/language-models")            → ["v1", "languageModels"]
 *   urlToDotPath("/v1/batches/{id}/cancel")        → ["v1","batches","cancel"]
 *   urlToDotPath("https://queue.fal.run/requests") → ["queue","requests"]
 *   urlToDotPath("https://catbox.moe/user/api.php", { keepFullHostname: true })
 *     → ["catbox","moe","user"]   (api.php is a server-script filename → dropped)
 */
export function urlToDotPath(url, { keepFullHostname = false } = {}) {
  if (!url || typeof url !== "string") return null;
  const parsed = parseUrl(url);
  if (!parsed) return null;
  const { hostname, pathname } = parsed;
  const hostSegments = hostname ? hostLabels(hostname, keepFullHostname) : [];
  const pathSegments = pathname
    .split("/")
    .flatMap((s) => s.split(":"))
    .map(stripPlaceholders)
    .filter((s) => s.length > 0)
    .filter((s) => !isServerScriptFilename(s));
  const segments = [...hostSegments, ...pathSegments].map(toCamelCase);
  return segments.length ? segments : null;
}

export function urlToDotString(url, options) {
  const segments = urlToDotPath(url, options);
  return segments ? segments.join(".") : null;
}

const CONVENTIONAL_HOST_LABELS = new Set(["api", "www"]);
const SCRIPT_EXTENSIONS = /^\w+\.(php|html?|cgi|aspx?|jsp)$/i;

function parseUrl(url) {
  const cleaned = url
    .split("?")[0]
    .split("#")[0]
    .replace(/\{query\}$/, "");
  if (cleaned.startsWith("/")) {
    return { hostname: null, pathname: cleaned };
  }
  const m = cleaned.match(/^https?:\/\/([^/]+)(\/.*)?$/i);
  if (!m) return null;
  return { hostname: m[1].toLowerCase(), pathname: m[2] ?? "/" };
}

function hostLabels(hostname, keepFullHostname) {
  const all = hostname.split(".");
  const kept = keepFullHostname ? all : all.slice(0, -2);
  return kept.filter((l) => !CONVENTIONAL_HOST_LABELS.has(l));
}

function isServerScriptFilename(segment) {
  return SCRIPT_EXTENSIONS.test(segment);
}

function stripPlaceholders(segment) {
  return segment.replace(/\{[^}]+\}/g, "");
}

function toCamelCase(segment) {
  if (!/[-_]/.test(segment)) return segment;
  const words = segment.split(/[-_]+/).filter(Boolean);
  if (words.length === 0) return segment;
  return (
    words[0].toLowerCase() +
    words
      .slice(1)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("")
  );
}
