import { describe, expect, it, vi } from "vitest";
import {
  fillOnePasswordEnv,
  resolveOnePasswordReferences,
  type OpInject,
} from "../../packages/cli/src/one-password";

const references = {
  OPENAI_API_KEY: "op://test/OPENAI_API_KEY/password",
  XAI_API_KEY: "op://test/XAI_API_KEY/password",
};

async function resolveBatch(
  mode: "references" | "vault",
  env: NodeJS.ProcessEnv,
  injectSecrets: OpInject
): Promise<void> {
  if (mode === "references") {
    await resolveOnePasswordReferences({ references, env, injectSecrets });
  } else {
    await fillOnePasswordEnv({
      vault: "test",
      serviceAccountToken: "synthetic-token",
      enabledProviders: ["openai", "xai"],
      env,
      listItemTitles: async () => Object.keys(references),
      injectSecrets,
    });
  }
}

describe.each(["references", "vault"] as const)(
  "multiline 1Password values through %s",
  (mode) => {
    it.each([
      "-----BEGIN KEY-----\nfirst\nsecond\n-----END KEY-----\n",
      "\r\nfirst\r\nsecond\r\n",
      "first\nXAI_API_KEY=not-the-other-key\nlast=value",
      "  first\n\n雪='quoted'\n  ",
    ])("preserves value bytes in one batch: %j", async (value) => {
      const env: NodeJS.ProcessEnv = {};
      const values: Record<string, string> = {
        [references.OPENAI_API_KEY]: value,
        [references.XAI_API_KEY]: "other-key",
      };
      // Model literal template substitution, without spawning op or reading
      // any real credential. Keep the template's framing intact.
      const injectSecrets = vi.fn(async (template: string) =>
        template.replace(/\{\{\s*(op:\/\/\S+)\s*\}\}/g, (_, ref: string) => {
          expect(values).toHaveProperty(ref);
          return values[ref];
        })
      );

      await resolveBatch(mode, env, injectSecrets);

      expect(env).toEqual({ OPENAI_API_KEY: value, XAI_API_KEY: "other-key" });
      expect(injectSecrets).toHaveBeenCalledOnce();
    });

    it.each(["collision", "truncated", "wrong-key", "nul"])(
      "rejects %s output without exporting or disclosing a value",
      async (fault) => {
        const env: NodeJS.ProcessEnv = { UNRELATED: "keep" };
        const secret = "synthetic-private-value";
        const injectSecrets = vi.fn(async (template: string) => {
          const delimiter = `\n${template.split("\n")[1]}\n`;
          let output = template.replace(/\{\{[^}]+\}\}/g, () => secret);
          if (fault === "collision") {
            output = output.replace(secret, () => secret + delimiter);
          } else if (fault === "truncated") {
            output = output.slice(0, -delimiter.length);
          } else if (fault === "wrong-key") {
            output = output.replace("XAI_API_KEY=", "OTHER_KEY=");
          } else {
            output = output.replace(secret, () => secret + "\0tail");
          }
          return output;
        });

        await expect(resolveBatch(mode, env, injectSecrets)).rejects.toThrow(
          /^1Password op inject returned malformed batch output\.$/
        );
        expect(env).toEqual({ UNRELATED: "keep" });
        expect(injectSecrets).toHaveBeenCalledOnce();
      }
    );
  }
);
