# Kie Ideogram V3 Reframe callability evidence

- Checked at: 2026-08-12T04:55:04Z
- Decision: unsupported
- Scope: Kie Ideogram V3 Reframe only

The first-party materials checked below mention or price Reframe, but they do
not provide a stable callable API contract for it. The official documentation
index does not list a Reframe page, the checked candidate documentation URL
returns 404, and the frozen pricing URL also returned 404 when checked live.
The current English Kie V3 page mentions reframing in marketing copy but does
not expose Reframe as a model type or provide its request contract. The
neighboring Text To Image, Edit, and Remix contracts are not evidence for a
Reframe route or schema and were not used to infer one.

## Required facts

| Fact                               | Official source                                                                                                                                                              | Found? | Observed result                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full request URL and method        | [Kie Ideogram V3 page](https://kie.ai/ideogram/v3); [Kie docs index](https://docs.kie.ai/llms.txt); [candidate Reframe docs](https://docs.kie.ai/market/ideogram/v3-reframe) | No     | The live V3 page has no Reframe request form or route. `llms.txt` lists six Ideogram pages but no Reframe page. The candidate Reframe page returns `404 Not Found`. Existing Ideogram pages document `POST https://api.kie.ai/api/v1/jobs/createTask` for other model IDs only; that neighboring route was not assigned to Reframe. |
| Exact model ID/path                | [Kie Ideogram V3 page](https://kie.ai/ideogram/v3); [Kie docs index](https://docs.kie.ai/llms.txt)                                                                           | No     | The live page lists `V3 Text To Image`, `V3 Edit`, and `V3 Remix` as model types, but no Reframe model type or ID. The documentation index has no Reframe entry. The pricing display names do not establish an API model ID/path.                                                                                                   |
| Complete request body              | [Kie Ideogram V3 page](https://kie.ai/ideogram/v3); [candidate Reframe docs](https://docs.kie.ai/market/ideogram/v3-reframe)                                                 | No     | No Reframe payload, required fields, optional fields, defaults, validation rules, or encoding contract was found. The visible V3 fields belong to Text To Image, Edit, or Remix and were not reused.                                                                                                                                |
| Success response envelope          | [Kie docs index](https://docs.kie.ai/llms.txt); [candidate Reframe docs](https://docs.kie.ai/market/ideogram/v3-reframe)                                                     | No     | No Reframe creation response was found. The documented `code`/`msg`/`data.taskId` envelope on neighboring model pages cannot be attributed to Reframe without a Reframe creation contract.                                                                                                                                          |
| Result retrieval/callback contract | [Kie common task details](https://docs.kie.ai/market/common/get-task-detail); [Kie Ideogram V3 page](https://kie.ai/ideogram/v3)                                             | No     | The common page documents the generic `GET https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...` lifecycle and callback concepts, but no Reframe creation contract establishes that it returns a Reframe task or result. No Reframe-specific retrieval or callback contract was found.                                              |

## First-party source checks

- [Kie Ideogram V3](https://kie.ai/ideogram/v3) is a current English
  first-party marketing page. It mentions text-to-image, editing, reframing,
  and remixing, and its prose describes reframing use cases. Its model-type
  list and visible request fields contain Text To Image, Edit, and Remix only;
  it does not expose a Reframe model selector, request URL, method, payload,
  response, or result contract.
- [Kie documentation index](https://docs.kie.ai/llms.txt) was checked for
  `reframe`. There was no match. Its Ideogram entries are Character,
  Character Edit, Character Remix, V3 Text To Image, V3 Edit, and V3 Remix.
- [The candidate Reframe documentation URL](https://docs.kie.ai/market/ideogram/v3-reframe)
  was checked directly and returned `404 Not Found`.
- The official neighboring pages
  [V3 Text To Image](https://docs.kie.ai/market/ideogram/v3-text-to-image),
  [V3 Edit](https://docs.kie.ai/market/ideogram/v3-edit), and
  [V3 Remix](https://docs.kie.ai/market/ideogram/v3-remix) each document a
  callable contract for its own model ID. None documents Reframe, so none was
  used as a proxy.
- The frozen pricing evidence records use the official source URL
  `https://kie.ai/ideogram-reframe` for the display names `Ideogram V3
Reframe, image to image, Quality`, `Balanced`, and `Turbo`. That URL was
  checked live and returned `404 Not Found` at the checked time. The local
  records are
  `tests/fixtures/kie-pricing-evidence/kie-pricing-snapshot-2026-08-11T09-18-45-401Z.json`
  and its corresponding source/reconciliation evidence; they establish
  pricing rows and an anchor, not an API contract.
- Localized pages such as
  `https://kie.ai/es/ideogram-reframe` and
  `https://kie.ai/ru/ideogram-reframe` contain marketing or guide prose but
  no complete request URL/method, model ID, request body, success envelope,
  or result retrieval contract. They are not stable API evidence and were not
  used to infer support.

## Approved unsupported branch

Keep the Ideogram V3 Reframe pricing rows unsupported. Do not modify the Kie
model catalogue, request schemas, runtime guards, pricing keys, endpoint map,
or reconciliation artifacts. This evidence note is the only change for this
bead. If a stable first-party contract later appears with all five required
facts, review the implementation plan and decomposition before making any
provider or pricing interface changes.
