# API and OpenAPI

Use this only when the source site has API or endpoint documentation. Skip entirely for pure content sites.

## Build the OpenAPI Spec

- Group endpoints by product/service.
- Create one OpenAPI spec per product. Never merge unrelated products and never split one product across files.
- Store specs at `openapi/<product>.json` or `openapi/<product>.yaml`.

Each spec must include:

- `openapi: "3.1.0"` or `3.0.x`
- `info.title`, `info.description`, `info.version`
- `servers[]` with the real production base URL
- Root or per-operation `security` plus a matching `components.securitySchemes` entry
- `tags[]` with `name` and `description` for every tag used
- For every operation: `operationId`, `summary`, `description`, `tags`, request parameters/body, and at least one documented success response plus relevant errors
- Reusable schemas under `components.schemas` referenced with `$ref`
- Realistic `example` or `examples` on every request body and success response

## Wire Specs Into docs.json

Authoring the spec is only half the job. A spec that is not referenced from `docs.json` via `openapi`, and is not paired with root-level `api` config, produces no playground.

Add root-level `api` config:

```json
"api": {
  "playground": { "display": "interactive" },
  "examples": { "languages": ["curl", "javascript", "python", "php", "ruby", "go", "java"] },
  "mdx": {
    "server": "https://api.example.com/v1",
    "auth": { "method": "basic" }
  }
}
```

For each spec, add a navigation group that points at it. **Prefer the documented string form**:

```json
{ "group": "Core API", "openapi": "openapi/core.json" }
```

The object form (`{ "source": "...", "directory": "..." }`) is supported for hybrid editing but has caused auto-generated pages to silently fail to resolve in past projects. If you need a custom directory, verify the playground pages actually render via `mint dev` before declaring done — switching back to the string form is the most reliable fix.

Confirm `docs.json` contains an `"openapi"` key somewhere in the API Reference tab. If it does not, the playground will not render.

## Tag naming → URL slugs (critical, almost undocumented)

Mintlify auto-generates one page per operation at `/<group-path>/<tag-slug>/<operation-slug>`. The slug rules are non-obvious and bracketed/prefixed tag names produce URL-encoded routes (`/api-reference/%5Bintegrations%5D-aws/...`) that work but read as broken and tank SEO.

The actual character handling (verified by probing against live Mintlify builds):

| Character class | Behavior |
|---|---|
| Alphanumerics, `[`, `]`, `:`, `&` | Preserved literally |
| `.`, `/`, `(`, `)` | Dropped, no separator inserted (`shields.io` → `shieldsio`) |
| Spaces and other punctuation | Become a single `-` |

Examples:

- `[csharp] Upload Nuget packages.lock.json` → `[csharp]-upload-nuget-packageslockjson`
- `Gets allowlist of IP addresses & ranges` → `gets-allowlist-of-ip-addresses-&-ranges`

**Sanitize tag names before wiring the spec.** If the source spec uses bracket prefixes for grouping (`[Integrations] AWS`, `Custom Data [Advanced]`), rewrite them to drop the brackets while preserving alphabetical grouping (`Integrations AWS`, `Custom Data Advanced`). The sidebar still groups all `Integrations *` tags together, and URLs become clean (`/api-reference/integrations-aws/...`).

Apply the same rewrite to every reference: tag definitions in `tags[]`, the `tags` array on each operation, and any prose that links to the auto-generated pages.

## Hand-written readme pages that dump inline OpenAPI JSON

GitBook (and some other doc exports) often produce `api-reference/<tag>.mdx` pages where every operation is rendered as `## <Summary>\n> <Summary>\n` followed by a `json` code fence containing a full OpenAPI snippet (8-10 KB per operation). The actual interactive playground content auto-generates at `/api-reference/<tag>/<operation>` from the merged spec — the readme pages just need to *link* to it.

Detect these pages by grepping for repeated `\n```json\n{\n  "openapi":` patterns inside MDX bodies. Each operation block should be rewritten as a Card linking to the corresponding auto-generated playground page:

```mdx
<CardGroup cols={2}>
  <Card title="Retrieve entity Scorecard scores" icon="magnifying-glass"
        href="/api-reference/catalog-entities/retrieve-entity-scorecard-scores">
    <code>GET /api/v1/catalog/{tagOrId}/scorecards</code>
  </Card>
  <Card title="Create catalog entity" icon="plus"
        href="/api-reference/catalog-entities/create-catalog-entity">
    <code>POST /api/v1/catalog</code>
  </Card>
</CardGroup>
```

Rules for the rewrite script:

1. Merge adjacent cards within a single tag into one `<CardGroup cols={2}>` — one card per `<CardGroup>` produces a single-column wall on desktop.
2. Preserve the tag's intro prose and any `Required permissions` section above the card grid; only the operation blocks (heading + quote + JSON dump) get replaced.
3. Slugify `href` values using the rules in the previous section; verify with `mint broken-links` before shipping.
4. Delete the inline JSON dumps entirely — they are pure noise once the playground link exists.

## Surrounding Prose Pages

Create and wire these pages when the source has them:

- API product overview: base URL, versioning, rate limits, pagination, error model
- Authentication page: how credentials are obtained and passed
- Sandbox / test-mode page

Every created `api-reference/*.mdx` file must be referenced in `docs.json`.

## Embedding CLI / SDK examples alongside the playground

Customers regularly ask "how do I show the equivalent CLI command and SDK call next to each API endpoint?" Mintlify supports three patterns. Pick by where the snippets live and how often they repeat.

| Pattern | Source of truth | Render location | Best for |
|---|---|---|---|
| `x-codeSamples` on each operation | OpenAPI spec | Right-side request panel, next to the auto-generated `curl` | Per-endpoint, per-language snippets that should stay in sync with the spec |
| Reusable `/snippets/*.mdx` imported into endpoint MDX overrides | MDX in `/snippets/` | Wherever you import them in the endpoint MDX body | Patterns that repeat across many endpoints (auth, pagination, retry) — one source of truth, imported everywhere |
| `x-mint` extension blocks in the OpenAPI spec | OpenAPI spec | Mintlify-specific rendering hooks (see Mintlify docs for current capability) | Mintlify-native extensions when `x-codeSamples` is too limited |

**Default to `x-codeSamples`** for the prototype. It is a standard OAS extension, requires no MDX overrides, and Mintlify renders the snippets directly in the right-side panel alongside the auto-generated `curl`:

```json
{
  "paths": {
    "/queries": {
      "post": {
        "summary": "Create a query",
        "x-codeSamples": [
          {
            "lang": "shell",
            "label": "CLI",
            "source": "supermetrics queries create --data-source google-ads --json '{...}'"
          },
          {
            "lang": "python",
            "label": "Python SDK",
            "source": "from supermetrics import Supermetrics\n\nclient = Supermetrics(api_key=\"...\")\nresult = client.queries.create(data_source=\"google-ads\", payload={...})"
          }
        ]
      }
    }
  }
}
```

Reach for the MDX-override path when the snippet needs surrounding prose (a note about idempotency, a link to a deeper guide) or when the same snippet repeats verbatim across many endpoints — at that point a single `/snippets/auth-bearer.mdx` imported into N endpoint MDX files is cheaper to maintain than N copies in the spec.

When prototyping all three for evaluation, build the same operation in each pattern so reviewers can compare side-by-side; do not split one operation across patterns.

## SDK / CLI reference pages

When the customer has a public SDK or CLI repo, generate a dedicated reference page per package and put them in a `Developer Portal` product alongside the API reference (see "Developer Portal pattern" below). The hard part is that LLMs **confidently invent API surface** when summarizing SDK code — attribute names, field names, method signatures, exception classes. Every generated SDK/CLI page must go through an explicit audit pass against the source before shipping.

### Fabrication patterns to expect

These show up almost every time and reviewers will catch them, so catch them yourself first:

- Invented attribute names that "sound right" (`link.url` instead of `link.login_url`, `account.id` instead of `account_id`, `result.status` instead of `result.meta.status_code`).
- Wrong method signatures (positional vs keyword args, list-typed args called as strings, missing required parameters).
- Hallucinated convenience methods that don't exist in the real SDK.
- Missing whole surface areas: base exception classes, secondary resource clients, sync context-manager support, client kwargs (`timeout`, `base_url`, `custom_headers`), version constants.
- Wrong Python / Node / Go version requirements ("Python 3" when the real `pyproject.toml` requires `>=3.11`).
- Wrong or missing dependency lists.

### Audit-loop workflow

Run as a three-step loop, ideally with separate subagents per step so the auditor has no context bias from the writer:

1. **Generate** — clone the source repo locally and write the reference page from real source code, not from the README alone. Tables of methods/flags should cite the source file and line.
2. **Audit** — an independent agent (or a fresh subagent) re-clones the repo and diffs the rendered page against the real source: every attribute, every method signature, every field, every exception. Report every fabrication and every missing surface.
3. **Finalize** — close the gaps reported by the audit. Re-run the audit until it reports zero fabrications and zero missing surface for the user-facing API. Pages should trace 100% to source before shipping; "~95% comprehensive" is shorthand for "still has bugs."

This loop is what catches the `link.url` / `link.login_url` class of error before a customer or reviewer does. Skipping it ships fabrications.

### Developer Portal pattern

When the docs cover an API plus an SDK plus a CLI (and optionally other developer tools), the cleanest IA is a separate top-level product called **Developer Portal** containing each tool as a sibling group, with the marketing/Knowledge Base content as a peer product. This mirrors the Benchling / Stripe / HubSpot model.

Group ordering inside Developer Portal — fix once and respect everywhere:

1. **API Reference** (auto-generated from OpenAPI)
2. **CLI**
3. **SDK** (one group per language if multiple)

**Mirror the order in the product description.** If the description says "CLI, API reference, and SDK", reorder it to "API reference, CLI, and SDK" so the sentence matches the group order. Reviewers notice this kind of mismatch immediately; readers parse it as either a typo or as an indication that the docs were stitched together without a final pass.

When wiring this up in `docs.json`, follow the same `navigation.products` rules from `style-docs` (on the `luma` theme that mstack always uses, `groups` not `tabs` inside each product, hide the duplicate sidebar copy of the product selector).

## Hand-migrated endpoint pages + a spec: overlay, never a parallel tab

When the source has one hand-written page per endpoint (ReadMe.com reference sections are the canonical case) **and** you have or can assemble an OpenAPI spec, do **not** mount the spec as a separate auto-generated group or tab. That creates two URL spaces for the same operations — the migrated prose pages at the source's paths and a parallel "API Playground" set of generated pages — and reviewers flag the split immediately ("why are the API Reference and API Playground separated?").

Instead, overlay the interactive playground onto each existing migrated page with per-page frontmatter:

```mdx
---
title: "Get Loads"
openapi: "GET /api/p/v{version}/loads"
---

...the hand-migrated prose from the source page...
```

- The page keeps its migrated prose **and** gains Mintlify's Send Request panel, base URL, and auto-generated code samples for the referenced operation — all at the source's original URL.
- The method + path must match the spec's `paths` entry exactly. When the site has multiple specs, use the spec-qualified form: `openapi: "openapi/core.json GET /loads"`.
- Prose-only pages in the same section (overview, authentication, webhook lifecycle) simply omit the directive.
- Root-level `api` config in `docs.json` is still required for the playground and code-sample languages to render.
- Persist the page → operation mapping in the transformer script so regenerating the corpus preserves the wiring.

**ReadMe sources ship the spec inline.** Every ReadMe reference page embeds its operation's OpenAPI fragment in an `# OpenAPI definition` JSON block. Extract those fragments during the crawl and merge them into one spec per product (dedupe shared `components.schemas`, union `tags`) instead of hand-authoring a spec from prose.

## Avoid Duplicates

- If endpoint pages are generated from OpenAPI, do not also hand-author endpoint MDX files for the same operations.
- If source endpoint pages contain rich content beyond the spec, overlay the playground on them with per-page `openapi:` frontmatter (previous section) rather than keeping generated pages and prose pages side by side.

## Verify Playground Rendering

Before marking API work done:

- Grep `docs.json` for `"openapi"` and confirm one hit per product spec.
- Grep `docs.json` for every `api-reference/*.mdx` file created.
- Run `mint dev` and open one endpoint page from each spec.
- Confirm the right-hand playground shows method, path, auth fields, and at least one code sample.
- If the playground is incomplete, fix missing `servers`, `security`, or examples in the spec.
