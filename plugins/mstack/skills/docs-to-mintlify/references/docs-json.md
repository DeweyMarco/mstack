# docs.json

## Navigation

- Mirror the exact navigation structure from the live site for all discovered in-scope pages.
- Use `tabs` for top-level tabs, each with `tab` and `groups`, or `products` for product-style top-level tabs, each with `product`, `description`, `icon`, and `groups`. Match the existing repo pattern.
- Use `groups` with `group` and `pages` arrays for sidebar sections.
- File paths in `pages` arrays must not include `.mdx`.
- Preserve **customer-authored** `colors`, `logo`, `favicon`, `fonts`, `navbar`, `footer`, and `seo` unless updating them is explicitly requested. **Exception:** if these fields contain Mintlify starter defaults (anything inherited from `mint init` or a docs template), they are placeholders to audit, not existing config to keep. The Blog global anchor, Twitter/GitHub footer socials, and "Get started" CTA from the default starter are the usual offenders.
- Add root-level `api` config whenever the site has OpenAPI specs.
- Validate with `python3 -c "import json; json.load(open('docs.json'))"` after every structural edit.

### Chrome Audit (Parity Migrations)

For migrations whose goal is to match an existing site, every top-level chrome element in `docs.json` must mirror what the source actually shows. Verify each of these against the rendered source:

- `navigation.global.anchors` — count and labels must match the source's top-nav anchors. If the source has 5, you have 5; not 6, not 4.
- `navbar.links` — top-nav text links (separate from anchors, when the source uses both).
- `navbar.primary` — the right-side CTA button. Absent if the source has no CTA.
- `footer.socials` and `footer.links` — only what appears on the source footer. Default Twitter/GitHub socials from the starter are the most common parity miss.
- `seo.metatags` — mirror the source's meta description and OG tags, not Mintlify's defaults.
- **Default mode is remove, not add.** When unsure whether the source has a feature, delete it from `docs.json` and re-add only after confirming on the live site. Extras survive every other QA pass because they look "normal" — the only way to catch them is to audit each chrome field against a fresh `curl` of the source.

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

For sites with more than 50 pages, do not hand-edit `docs.json`. Build it with a script — but choose the right source first. There are two tiers, in priority order.

### Tier 1 (preferred): Mirror the source's published navigation tree

Most modern doc frameworks publish their navigation as data. When that data is available, use it directly — you don't have to infer the sidebar from folder layout, and the result matches the live site by construction. The validation gate "navigation order matches the live site sidebar exactly" is satisfied during generation instead of caught later in QA.

Common sources, in roughly decreasing order of how often you'll see them:

| Framework | Where the nav lives |
|---|---|
| Nuxt Content | `[any-page]/_payload.json` → `navigation` (or `body.navigation`) key — embedded in every payload |
| Docusaurus | `sidebars.js` / `sidebars.ts` in the source repo |
| VitePress | `.vitepress/config.ts` → `themeConfig.sidebar` |
| GitBook | `SUMMARY.md` at the repo root |
| Mkdocs | `mkdocs.yml` → `nav:` key |
| Sphinx | `toctree::` directives in `index.rst` |
| Mintlify | `docs.json` itself (already structured — no conversion needed) |

Recipe:

1. Pull the source's nav tree (parse the JSON, JS module, YAML, or markdown — whatever the source uses).
2. Walk the tree node-by-node and emit Mintlify's `{ "tab": ..., "groups": [...] }` / `{ "group": ..., "pages": [...] }` shape. Preserve the source's group order, group labels, and nesting depth verbatim.
3. Convert each leaf URL to its repo-relative MDX path (no `.mdx` extension).
4. Run the parity walker described in Tier 2 step 5 below. Treat any on-disk MDX that the source nav doesn't reference as an orphan: file it under a "More" / "Reference" group, or confirm with the user that it was always-orphaned on the source site too (in which case delete it).
5. Validate with `python3 -c "import json; json.load(open('docs.json'))"`.

**When NOT to use Tier 1:** if the customer is migrating *because* their old nav was confusing, mirroring it defeats the purpose. Use Tier 2, or apply `/style-docs` "Restructuring a large, flat navigation" after Tier 1 lands. Default to Tier 1 for fidelity-first migrations and ask the user before deviating.

### Tier 2 (fallback): Walk the directory tree

Use this when the source has no programmatic nav (rare on modern frameworks but common on older custom-built sites), or when the user explicitly wants you to restructure the IA during migration:

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
