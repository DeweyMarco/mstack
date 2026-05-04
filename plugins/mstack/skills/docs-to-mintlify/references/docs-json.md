# docs.json

## Navigation

- Mirror the exact navigation structure from the live site for all discovered in-scope pages.
- Use `tabs` for top-level tabs, each with `tab` and `groups`, or `products` for product-style top-level tabs, each with `product`, `description`, `icon`, and `groups`. Match the existing repo pattern.
- Use `groups` with `group` and `pages` arrays for sidebar sections.
- File paths in `pages` arrays must not include `.mdx`.
- Preserve existing `colors`, `logo`, `favicon`, `fonts`, `navbar`, `footer`, and `seo` unless updating them is explicitly requested.
- Add root-level `api` config whenever the site has OpenAPI specs.
- Validate with `python3 -c "import json; json.load(open('docs.json'))"` after every structural edit.

For OpenAPI-backed sections, reference the spec directly on the group. Do not list auto-generated endpoint pages manually:

```json
{ "group": "Core API", "openapi": "openapi/core.json" }
```

```json
{ "group": "Core API", "openapi": { "source": "openapi/core.json", "directory": "api-reference" } }
```

## Contextual Menu

Every newly converted Mintlify site must include a root-level `contextual` config so readers get the page context dropdown and AI tool shortcuts.

If `docs.json` already has a `contextual` object:

- Preserve existing custom options.
- Preserve existing `display` setting.
- Add missing standard options without removing custom objects.

If `docs.json` does not have `contextual`, add:

```json
"contextual": {
  "options": [
    "copy",
    "view",
    "assistant",
    "chatgpt",
    "claude",
    "perplexity",
    "grok",
    "aistudio",
    "devin",
    "windsurf",
    "mcp",
    "add-mcp",
    "cursor",
    "vscode",
    "devin-mcp"
  ]
}
```

Use the default header display unless the project already uses `"display": "toc"` or the user explicitly asks for the menu in the table of contents sidebar.

Custom contextual menu options are allowed, but each object must include `title`, `description`, `icon`, and `href`. For dynamic links, `href` can be an object with `base` and `query`; Mintlify supports `$page`, `$path`, and `$mcp` placeholders in query values.

## Auto-Generate Navigation for Large Corpora

For sites with more than 50 pages, build `docs.json` from the directory tree with a script rather than by hand:

1. Walk the repo tree. For each directory, emit a `{ "group": <Title>, "pages": [...] }` entry. Recurse into subdirectories as nested groups.
2. Promote a landing page to `pages[0]` of its group when one exists, in this order:
   - a sibling file with the same basename as the directory
   - a nested file with the same basename
   - an `overview.mdx` inside the directory
3. Remove promoted pages from the rest of the `pages` array so they do not appear twice.
4. Convert kebab-case directory names to Title Case. Keep an acronym allow-list such as `API`, `SDK`, `DNS`, `VPN`, `CDN`, `DCD`, `FAQ`, `VDC`, `IAM`, `NLB`, and `ALB`.
5. Run a parity walker that descends through `navigation.tabs[*].groups`, nested `groups`, and `pages`, collecting every string page entry.
6. Compare navigation entries against on-disk `.mdx` files. Fix the generator for orphaned pages or dangling references.

The parity walker must traverse `tabs`, `groups`, and `pages` keys only. Never recurse into arbitrary `group` or `tab` string values, or labels will be counted as page references.
