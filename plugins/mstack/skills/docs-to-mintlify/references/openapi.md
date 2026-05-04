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

For each spec, add a navigation group that points at it:

```json
{ "group": "Core API", "openapi": "openapi/core.json" }
```

Or use object form for hybrid editing:

```json
{ "group": "Core API", "openapi": { "source": "openapi/core.json", "directory": "api-reference" } }
```

Confirm `docs.json` contains an `"openapi"` key somewhere in the API Reference tab. If it does not, the playground will not render.

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
