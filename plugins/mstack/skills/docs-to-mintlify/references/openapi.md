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

## Avoid Duplicates

- If endpoint pages are generated from OpenAPI, do not also hand-author endpoint MDX files for the same operations.
- If source endpoint pages contain rich content beyond the spec, keep them in a separate group such as "Extended Guides" so they do not collide with generated API pages.

## Verify Playground Rendering

Before marking API work done:

- Grep `docs.json` for `"openapi"` and confirm one hit per product spec.
- Grep `docs.json` for every `api-reference/*.mdx` file created.
- Run `mint dev` and open one endpoint page from each spec.
- Confirm the right-hand playground shows method, path, auth fields, and at least one code sample.
- If the playground is incomplete, fix missing `servers`, `security`, or examples in the spec.
