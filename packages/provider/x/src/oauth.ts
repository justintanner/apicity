import {
  XOAuthOptions,
  XOAuthTokenRequest,
  XOAuthTokenResponse,
  XOAuthProvider,
  XError,
} from "./types";
import { XOAuthTokenRequestSchema } from "./zod";
import { attachExamples } from "./example";
import { createTransport } from "./transport";

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

export function createXOAuth(opts: XOAuthOptions): XOAuthProvider {
  const baseURL = opts.baseURL ?? "https://api.x.com";
  const timeout = opts.timeout ?? 30000;
  const basic = btoa(`${opts.clientId}:${opts.clientSecret}`);

  const transport = createTransport({
    baseUrl: baseURL,
    timeoutMs: timeout,
    fetchImpl: opts.fetch,
    defaultHeaders: () => ({ Authorization: `Basic ${basic}` }),
    parseErrorBody: (status, body) => ({
      message: formatErrorMessage(status, body),
    }),
    errorClass: XError,
  });

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
      const form = new URLSearchParams();
      form.set("grant_type", req.grant_type);
      if (req.grant_type === "authorization_code") {
        form.set("code", req.code);
        form.set("redirect_uri", req.redirect_uri);
        form.set("code_verifier", req.code_verifier);
      } else {
        form.set("refresh_token", req.refresh_token);
      }

      return transport.postForm<XOAuthTokenResponse>("/2/oauth2/token", form, {
        signal,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
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
