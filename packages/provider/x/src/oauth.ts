import {
  XOAuthOptions,
  XOAuthTokenRequest,
  XOAuthTokenResponse,
  XOAuthProvider,
  XError,
} from "./types";
import { XOAuthTokenRequestSchema } from "./zod";
import { attachExamples } from "./example";

export function createXOAuth(opts: XOAuthOptions): XOAuthProvider {
  const baseURL = opts.baseURL ?? "https://api.x.com";
  const doFetch = opts.fetch ?? fetch;
  const timeout = opts.timeout ?? 30000;
  const basic = btoa(`${opts.clientId}:${opts.clientSecret}`);

  function attachAbortHandler(
    signal: AbortSignal,
    controller: AbortController
  ): void {
    if (signal.aborted) {
      controller.abort();
      return;
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  // The token endpoint reports failures in the RFC 6749 shape
  // `{ error, error_description }`, not the X v2 `{ errors: [...] }` /
  // `{ title, detail }` shapes the rest of the API uses.
  function formatErrorMessage(status: number, body: unknown): string {
    if (typeof body === "object" && body !== null) {
      const b = body as { error?: string; error_description?: string };
      if (b.error_description) {
        return `X OAuth error ${status}: ${b.error_description}`;
      }
      if (b.error) return `X OAuth error ${status}: ${b.error}`;
    }
    return `X OAuth error: ${status}`;
  }

  // sig-ok: numeric URL segments (`/2/`) become identifier-safe (`v2`)
  // POST https://api.x.com/2/oauth2/token
  // Docs: https://docs.x.com/x-api/fundamentals/authentication/oauth-2-0/user-access-token
  // Confidential clients authenticate with Basic clientId:clientSecret; the
  // grant_type field selects authorization-code (PKCE) exchange vs refresh.
  const token = Object.assign(
    async (
      req: XOAuthTokenRequest,
      signal?: AbortSignal
    ): Promise<XOAuthTokenResponse> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      if (signal) {
        attachAbortHandler(signal, controller);
      }

      const form = new URLSearchParams();
      form.set("grant_type", req.grant_type);
      if (req.grant_type === "authorization_code") {
        form.set("code", req.code);
        form.set("redirect_uri", req.redirect_uri);
        form.set("code_verifier", req.code_verifier);
      } else {
        form.set("refresh_token", req.refresh_token);
      }

      try {
        const res = await doFetch(`${baseURL}/2/oauth2/token`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${basic}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: form,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let resBody: unknown = null;
          try {
            resBody = await res.json();
          } catch {
            // ignore parse errors
          }
          throw new XError(
            formatErrorMessage(res.status, resBody),
            res.status,
            resBody
          );
        }

        return (await res.json()) as XOAuthTokenResponse;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof XError) throw error;
        throw new XError(`X request failed: ${error}`, 500);
      }
    },
    { schema: XOAuthTokenRequestSchema }
  );

  return attachExamples({
    post: {
      v2: {
        oauth2: {
          token,
        },
      },
    },
  });
}
