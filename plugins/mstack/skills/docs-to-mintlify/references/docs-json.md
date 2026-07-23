# docs.json

## Navigation

- Mirror the exact navigation structure from the live site for all discovered in-scope pages.
- Use `tabs` for top-level tabs, each with `tab` and `groups`, or `products` for product-style top-level tabs, each with `product`, `description`, `icon`, and `groups`. Match the existing repo pattern.
- **Tab cap: never more than 4 top-level tabs.** If the nav needs more than 4 top-level sections, use `navigation.products` (product switcher dropdown) instead of a longer tab row — see *Tab cap* below.
- Use `groups` with `group` and `pages` arrays for sidebar sections.
- File paths in `pages` arrays must not include `.mdx`.
- Preserve **customer-authored** `colors`, `logo`, `favicon`, `fonts`, `navbar`, `footer`, and `seo` unless updating them is explicitly requested. **Exception:** if these fields contain Mintlify starter defaults (anything inherited from `mint init` or a docs template), they are placeholders to audit, not existing config to keep. The Blog global anchor, Twitter/GitHub footer socials, and "Get started" CTA from the default starter are the usual offenders.
- **Always set `theme` to `"luma"`. Never use `maple`.** `luma` is the mstack standard for every preview — its single full-width sticky navbar handles full-bleed heroes, product selectors (`navigation.products`), and homepage↔content chrome continuity natively, while `maple`'s split navbar repeatedly costs hours of fragile CSS workarounds (see `create-landing-page` → Gotcha 2 → "Theme policy"). `mint init` scaffolds `maple` by default — always overwrite it with `"luma"`. `maple` is never an acceptable choice, including on customer request. If a customer explicitly and specifically insists on a non-luma look, the only fallbacks are the other supported themes (`mint`, `palm`, `willow`, `aspen`, `linden`, `almond`, `sequoia`), and you should flag the tradeoff first — but default to `luma` and never reach for `maple`.
- Add root-level `api` config whenever the site has OpenAPI specs.
- Validate with `python3 -c "import json; json.load(open('docs.json'))"` after every structural edit.

### Navigation quality gate

Run this small cleanup before writing generated navigation. It prevents the most common preview defects without redesigning the source IA:

- Put a section landing or overview page first in its group, and include every page exactly once.
- Do not place the site root `index` inside an existing sidebar group unless the source visibly has a Home row.
- Flatten single-page wrapper groups when the group label duplicates the page's `sidebarTitle` or `title`.
- Keep icons on top-level sections only; nested groups and ordinary pages should not repeat them.
- When the source uses collapsible sidebar sections, set `expanded: false` on nested groups only; the setting has no effect on top-level groups.
- Preserve source labels, order, and nesting. Do not invent tabs or regroup content merely to make the tree look cleaner.
- Before saving, recursively collect page strings from `tabs`, `products`, `groups`, and `pages`; fail if there are missing pages, dangling paths, or duplicates.

### Chrome Audit (Parity Migrations)

For migrations whose goal is to match an existing site, every top-level chrome element in `docs.json` must mirror what the source actually shows. Verify each of these against the rendered source:

- `navigation.tabs` — every item the source paints in its single horizontal row above (or below) the navbar belongs here, in source-visual order, left-to-right. External destinations (Status pages, off-site forums, blogs) use `{ "tab": "...", "href": "..." }` — do not push them to `navbar.links` just because they leave the docs site. See *One visible horizontal row = one config surface* below. Exception: when the source row paints **more than 4 items**, do not reproduce it — restructure into `navigation.products` per the *Tab cap* rule below.
- `navigation.global.anchors` — only present when the source shows a persistent **sidebar** anchor rail (icon + label list at the top of the sidebar). If absent on the source, the field should be absent in `docs.json`. Do not use this surface as a fallback for items that didn't fit in `navigation.tabs`.
- `navbar.links` — only the right-side utility text links the source actually anchors to the right of the navbar (e.g. sign-in, contact). Items the source shows in its inline horizontal row do not belong here even when they are external.
- `navbar.primary` — the single right-side CTA button. Absent if the source has no CTA.
- `footer.socials` and `footer.links` — only what appears on the source footer. Default Twitter/GitHub socials from the starter are the most common parity miss.
- `seo.metatags` — mirror the source's meta description and OG tags, not Mintlify's defaults. **Always merge in `"robots": "noindex"`** (see *Search-engine indexing* below) — mirroring the source's other metatags does not exempt the preview from this.
- **Default mode is remove, not add.** When unsure whether the source has a feature, delete it from `docs.json` and re-add only after confirming on the live site. Extras survive every other QA pass because they look "normal" — the only way to catch them is to audit each chrome field against a fresh `curl` of the source.

#### One visible horizontal row = one config surface

The most common chrome defect on first-pass migrations is splitting the source's single horizontal nav row across multiple surfaces in `docs.json`. The source paints six items in one row, the migration emits three in `navigation.tabs`, two in `navbar.links`, and one in `navigation.global.anchors`, and the preview's "horizontal bar" no longer matches the source's. JSON validates; chrome doesn't.

Rule for navbar generation:

1. Inspect the source navbar and identify each visible region — the inline horizontal row, the right-side utility links, the right-side CTA, the sidebar anchor rail (if any).
2. Map each item to exactly one `docs.json` surface using the table in `style-docs/SKILL.md` → *Top horizontal bar — one row, one config surface*.
3. For the inline horizontal row: emit every item into `navigation.tabs` in source-visual order, using `href` on the tab entry for external destinations rather than rerouting them to `navbar.links` — unless the row has more than 4 items, in which case restructure into `navigation.products` per the *Tab cap* rule below instead of emitting a 5+-tab row.
4. After emitting, audit for duplicates: no item should appear in more than one of `navigation.tabs`, `navbar.links`, `navigation.global.anchors`. If the same external link is registered twice, drop it from `navbar.links` / `global.anchors` and keep it in `tabs`.

This is `/preview-qa` Gate 3's "Top horizontal-bar single-row parity" check — generating the right shape upfront avoids the post-hoc cleanup.

#### Tab cap: at most 4 top-level tabs

`navigation.tabs` must never contain more than 4 entries, regardless of what the source shows. A 5+-item tab row is crowded chrome and a defect in its own right, so when the source paints more than 4 items in its horizontal row (or a restructure produces more than 4 top-level sections):

1. Group the sections by product or audience and emit them as `navigation.products` — the navbar then shows a compact product switcher next to the logo instead of the long row.
2. Move external destinations that lived in the row (`href` tab entries) to `navbar.links`; a products layout has no tab row to host them.
3. Record the divergence from the source's row in the parity manifest / QA report so `/preview-qa`'s "Top horizontal-bar single-row parity" check reads the switcher as intentional, not as missing tabs.

Follow `style-docs/SKILL.md` → *Multi-product top dropdowns — `navigation.products`* for the shape rules (`groups` not `tabs` inside each product, hiding the duplicate sidebar selector).

#### Per-tab sidebar parity for multi-tab sites

Mintlify's per-tab nav model means **every top-level tab has its own independent sidebar** (`tabs[i].groups[]`). For sites with many top-level sections (developer portals, product hubs, enterprise docs platforms), the conversion is not "one nav" but "N navs" — and each section's sidebar must mirror the **source's sidebar for that same section**, not be inferred from the file tree. Under the *Tab cap* rule above, a source with 5+ tabs lands as `navigation.products`; the per-section discipline below applies identically to each `products[i].groups[]`.

The recurring failure mode: a transformer flattens the file system into one top-level tab and dumps every other tab's pages into a generic `Reference` or `Misc` group. JSON validates, every page is reachable, every link works — but the sidebar on `/connect-data/*` shows BI tools next to changelog entries next to admin SDK references, none of which the source has in that sidebar.

Mirror per-tab. For each tab the source has:

1. **Fetch the source tab's rendered sidebar** — not via WebFetch's summarization but via Chrome MCP / `mcp__claude-in-chrome__*` so you can read the actual DOM hierarchy of the sidebar tree. WebFetch collapses nested groups into flat link lists and silently loses the group/subgroup structure.
2. **Capture the visible group order, subgroup order, and per-page sidebar label.** Top-level groups become `groups`, nested groups become `groups[].pages[]` with a nested `{ "group": ..., "pages": [...] }` shape. Subgroup labels visible in the source must appear verbatim in `docs.json`.
3. **Map every page in the source's tab sidebar to a converted MDX file** using the parity manifest's `normalized_path`. Pages that exist in the file tree but are not in the source tab's sidebar belong to a different tab — do not include them.
4. **Emit one tab's groups at a time.** When restructuring an existing site, do not edit multiple tabs' `groups` in the same pass — agents working in parallel collide on the same `docs.json`, and the merge is hard to reason about. The session that produced this skill ran five tab-restructure agents serially (or with explicit non-overlapping ownership) for exactly this reason.
5. **Validate per tab.** After each tab is emitted, `mint validate` must pass and the count of pages in that tab must equal the count of source pages in the same tab's sidebar (modulo intentional `excluded` entries in the parity manifest).

Anti-pattern to avoid: emoji / Font Awesome icons on top-level tabs in `navigation.tabs[].icon` when the source does not use them. Mintlify renders these as visible chips next to the tab label. Strip every `icon:` from `tabs[]` unless you can point at the matching glyph on the source — the session shipped `rocket`, `plug`, `magnifying-glass-chart`, `shield-halved`, `sliders`, `code`, `circle-question` on tabs that the source displayed as plain text labels, and they all had to be ripped out later.

Verification:

- Open the live source in Chrome (`mcp__claude-in-chrome__navigate`), click each tab, screenshot the sidebar, and compare side-by-side against `mint dev` on the same tab path.
- Repeat for every tab. Per-tab parity is `/preview-qa` Gate 3's "Per-page sidebar parity (no stacked sidebars)" check — emitting the right per-tab structure upfront is far cheaper than restructuring later.

For OpenAPI-backed sections, reference the spec directly on the group. Do not list auto-generated endpoint pages manually:

```json
{ "group": "Core API", "openapi": "openapi/core.json" }
```

```json
{ "group": "Core API", "openapi": { "source": "openapi/core.json", "directory": "api-reference" } }
```

## Search-engine indexing

Every generated `docs.json` must keep the preview out of search-engine indexes. Set `seo.metatags.robots` to `noindex`:

```json
"seo": {
  "metatags": {
    "robots": "noindex"
  }
}
```

- This is **mandatory and non-negotiable** — these are preview deployments, not the customer's production site, and must never be indexed.
- Add it even when preserving or mirroring other `seo` fields (meta description, OG tags). Merge `"robots": "noindex"` into the existing `seo.metatags` block rather than dropping the mirrored tags.
- If the source site or an existing `docs.json` already sets `robots` to something else, override it to `noindex`.
- This overrides the "preserve customer-authored `seo`" rule above for the `robots` key specifically.

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

**After mirroring, polish scannability (safe for fidelity migrations too).** Mirroring source verbatim often reproduces flat sections and long, repetitive sidebar labels. Once Tier 1 lands, apply `/style-docs` → "Nest flat groups, and collapse nested subgroups by default" and "Shorten long, repetitive sidebar labels with `sidebarTitle`". Both preserve parity — page `title`/H1 and the full page set stay verbatim; only the sidebar label and grouping change — so they are safe to run even on fidelity-first previews.

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
