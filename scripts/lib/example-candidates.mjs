/** Derive the same sanitized payload for selection and provenance checks. */
// Replace inline base64 data URIs and any string longer than the threshold
// with a short placeholder. HAR recordings often inline binary inputs (image
// or audio bytes) which are useless in copy-paste examples and balloon bundle
// size. Threshold chosen to preserve real-world prompts and pasted text while
// truncating the obvious offenders.
const STRING_TRUNCATE_LIMIT = 256;

export function exampleCandidate(entry, row, providerHint) {
  const method = entry?.request?.method?.toUpperCase();
  const bodyText = entry?.request?.postData?.text;
  const mime = entry?.request?.postData?.mimeType ?? "";
  if (
    typeof bodyText === "string" &&
    bodyText.length > 0 &&
    (mime.includes("application/json") || isMultipartRelated(mime))
  ) {
    return parseJsonPayload(bodyText);
  }
  if (
    providerHint === "fireworks" &&
    !hasRequestBody(entry) &&
    isSuccessfulResponse(entry)
  ) {
    return { payload: {}, payloadString: "{}" };
  }
  if (method === "GET" && row) return extractCompleteQueryPayload(entry, row);
  return null;
}

function sanitizePayload(value) {
  if (typeof value === "string") {
    if (value.startsWith("data:") && value.includes(";base64,")) {
      const mime = value.slice(5, value.indexOf(";base64,"));
      return `<inline ${mime || "binary"} data URL — replace with a real URL or upload>`;
    }
    if (value.length > STRING_TRUNCATE_LIMIT) {
      return `${value.slice(0, 60)}… <truncated ${value.length} chars>`;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitizePayload);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitizePayload(v);
    return out;
  }
  return value;
}

function parseJsonPayload(bodyText) {
  try {
    return {
      payload: sanitizePayload(JSON.parse(bodyText)),
      payloadString: bodyText,
    };
  } catch {
    return null;
  }
}

function isMultipartRelated(mime) {
  return mime.toLowerCase().startsWith("multipart/related");
}

function hasRequestBody(entry) {
  const postData = entry?.request?.postData;
  if (!postData) return false;
  if (typeof postData.text === "string" && postData.text.length > 0) {
    return true;
  }
  return Array.isArray(postData.params) && postData.params.length > 0;
}

function isSuccessfulResponse(entry) {
  const status = Number(entry?.response?.status);
  return Number.isFinite(status) && status >= 200 && status < 300;
}

function extractCompleteQueryPayload(entry, row) {
  if (!isSuccessfulResponse(entry)) return null;
  const url = new URL(entry.request.url, "https://example.invalid");
  if (hasBareQueryMarker(url.search)) return null;
  const params = url.searchParams;
  if ([...params.keys()].length === 0) return null;

  // Query-string examples are useful only when the query object is the full
  // callable payload. If the concrete HAR path contains extra segments beyond
  // the placeholder-stripped TSV path, the endpoint also needs path arguments
  // (for example `comments.byUser(address, params)`), so a query-only example
  // would be incomplete.
  const harPath = pathSegments(entry.request.url).join("/");
  const tsvPath = pathSegments(row.fullUrl)
    .filter((seg) => !isPlaceholder(seg))
    .join("/");
  if (tsvPath === "") return null;
  if (harPath !== tsvPath) return null;

  const payload = {};
  for (const [key, value] of params) {
    const next = coerceQueryValue(value);
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const prev = payload[key];
      payload[key] = Array.isArray(prev) ? [...prev, next] : [prev, next];
    } else {
      payload[key] = next;
    }
  }
  return {
    payload,
    payloadString: JSON.stringify(payload),
  };
}

function hasBareQueryMarker(search) {
  return search
    .slice(1)
    .split("&")
    .some((part) => part.length > 0 && !part.includes("="));
}

function coerceQueryValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) {
    const n = Number(value);
    if (
      Number.isFinite(n) &&
      (Number.isSafeInteger(n) ||
        (!Number.isInteger(n) && Math.abs(n) <= Number.MAX_SAFE_INTEGER))
    ) {
      return n;
    }
  }
  return value;
}

function pathSegments(url) {
  const parsed = new URL(stripQueryMarker(url), "https://example.invalid");
  return parsed.pathname
    .split("/")
    .filter((seg) => seg.length > 0)
    .map((seg) => decodeURIComponent(seg));
}

function isPlaceholder(seg) {
  return seg.startsWith("{") && seg.endsWith("}");
}

function stripQueryMarker(url) {
  return url.replace(/\{query\}/g, "");
}
