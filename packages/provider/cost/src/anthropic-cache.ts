// Cache controls may occur on the request, system blocks or message blocks.
export function anthropicCacheTtl(value: unknown): "5m" | "1h" | "invalid" {
  let ttl: "5m" | "1h" | "invalid" = "5m";
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node === null || typeof node !== "object") return;
    for (const [key, child] of Object.entries(node)) {
      if (
        key === "cache_control" &&
        child !== null &&
        typeof child === "object"
      ) {
        const declared = (child as Record<string, unknown>).ttl;
        if (declared !== undefined && declared !== "5m" && declared !== "1h") {
          ttl = "invalid";
        } else if (declared === "1h" && ttl !== "invalid") {
          ttl = "1h";
        }
      } else {
        visit(child);
      }
    }
  };
  visit(value);
  return ttl;
}
