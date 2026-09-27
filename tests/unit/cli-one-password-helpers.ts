/** Requested substitutions, without the transport framing around them. */
export function injectionRequests(template: string): string {
  return (template.match(/^[A-Z_][A-Z0-9_]*=\{\{[^\r\n]+\}\}$/gm) ?? []).join(
    "\n"
  );
}

/** Render synthetic single-line answers while preserving the real template. */
export function renderInjection(template: string, answer: string): string {
  const values = Object.fromEntries(
    answer
      .split(/\r?\n/)
      .filter((line) => line.includes("="))
      .map((line) => {
        const eq = line.indexOf("=");
        return [line.slice(0, eq), line.slice(eq + 1)];
      })
  );
  return template.replace(
    /^([A-Z_][A-Z0-9_]*)=\{\{[^\r\n]+\}\}$/gm,
    (_, key: string) => `${key}=${values[key] ?? ""}`
  );
}
