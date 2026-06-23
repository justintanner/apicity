# Zod Compatibility

Apicity provider packages may carry either Zod 3 or Zod 4 as their package-local
runtime dependency. New or upgraded providers should use Zod 4 unless there is a
specific compatibility reason to leave that package on Zod 3.

The stable cross-provider contract is the endpoint `.schema` surface:

- `.parse(data)` returns the typed payload.
- `.safeParse(data)` returns `{ success: true, data }` or
  `{ success: false, error: { issues } }`.
- `error.issues` entries expose `path`, `message`, and `code` when available.

Provider declaration files should not require consumers to unify all providers
on the same Zod major just to read or call endpoint `.schema` fields. Packages
that use Zod 4 expose endpoint schemas through a small structural
`ApicitySchema<T>` type in `src/types.ts`; package-local `./zod` exports may
still expose the concrete Zod types for callers who import that package's schema
module directly.

The MCP server must not import a shared Zod runtime for schema discovery. It
duck-types provider schemas and converts both Zod 3 and Zod 4 internals into
JSON Schema, degrading unknown shapes to `{}` rather than failing discovery.
