---
name: docs-to-mintlify
description: Converts an existing documentation site into a Mintlify-compatible repo. Use when the user provides a docs site URL and wants it cloned/migrated to Mintlify with proper MDX files, components, and docs.json navigation.
---

# Docs to Mintlify Conversion

Convert an existing docs site into a parser-clean Mintlify repo with 1:1 content parity, complete navigation, no orphaned pages, and a durable parity manifest that later skills can verify against.

## Reference Loading

Load only the reference files needed for the current conversion:

- For crawl strategy, raw markdown mirroring, and parity inventory: read [references/discovery.md](references/discovery.md).
- For frontmatter, component conversion, MDX safety, and link rewriting: read [references/mdx-conversion.md](references/mdx-conversion.md).
- For GitBook sources or any `{% ... %}` / `data-gb-custom-block` export syntax: read [references/gitbook.md](references/gitbook.md).
- For API or endpoint documentation: read [references/openapi.md](references/openapi.md).
- For changelog / release-notes / "What's new" sections: read [references/changelogs.md](references/changelogs.md).
- For `docs.json`, navigation, OpenAPI wiring, and the contextual menu: read [references/docs-json.md](references/docs-json.md).
- For parser checks, broken links, parity gates, and final QA: read [references/validation.md](references/validation.md).

## Workflow

### 1. Gather Mintlify Context

- Use your Mintlify tools (`search_mintlify`, `query_docs_filesystem_mintlify`) to confirm current `docs.json` structure, Mintlify components, MDX page conventions, and API playground configuration.
- Keep Mintlify components in mind throughout the conversion; use them wherever the source content has a semantic equivalent.

### 2. Discover the Full Source Corpus

- Build a canonical URL inventory before writing MDX.
- Crawl sitemaps, nested sitemap indexes, navigation UI, footer links, related pages, in-page links, version/language variants, `llms.txt`, docs index JSON, and route manifests.
- Keep traversing internal docs links until two consecutive passes discover zero new in-scope docs pages.
- Track every page in a parity manifest with `source_url`, `source_title`, `source_sidebar_label`, `source_h1`, `source_description`, `normalized_path`, `nav_section`, `converted_file`, `status`, and `notes`.
- Keep the manifest in the repo as `parity-manifest.json` or `parity-manifest.md` so `/style-docs`, `/preview-qa`, and `/han-review` can compare against the same source inventory instead of re-inferring it from memory.
- Read [references/discovery.md](references/discovery.md) before crawling.

### 3. Audit the Existing Repo

- Read the existing `docs.json`, or note that it does not exist.
- List existing `.mdx` and `.md` files.
- Compare the repo against the discovered URL inventory.
- Update existing content to reach parity; do not duplicate pages.

### 4. Convert Pages to Mintlify MDX

- For small sites, convert in batches of 5-15 pages and validate between batches.
- For corpora over roughly 50 pages, write a deterministic transformer script that reads from `mirror/` and writes `.mdx` files. Re-run the script after rule fixes instead of hand-patching generated output.
- Preserve all source text exactly. The goal is reading parity, not a summary.
- Add clean frontmatter and remove duplicated H1s.
- Replace source patterns with Mintlify components where equivalent: callouts, steps, cards, tabs, accordions, code blocks, parameter fields, response fields, and tooltips.
- Never add "clone", "preview", or "migration" to page content or filenames.
- Changelog / release-notes sections do **not** convert page-per-entry: consolidate them into a single `<Update>` timeline page with `rss: true`, real publish dates (not sitemap `lastmod`), and redirects preserving per-entry URLs. Read [references/changelogs.md](references/changelogs.md) before converting one.
- Read [references/mdx-conversion.md](references/mdx-conversion.md), and read [references/gitbook.md](references/gitbook.md) for GitBook sources.

### 5. Handle API Docs Only When Present

- First determine whether the source has API or endpoint docs. Skip this step entirely for pure content sites.
- If API docs exist, create one OpenAPI spec per product, wire each spec into `docs.json`, add the root-level `api` config, and verify that the playground renders.
- When the source has hand-written per-endpoint pages (ReadMe.com reference sections are the canonical case), overlay the playground on those migrated pages with per-page `openapi:` frontmatter — never mount the spec as a separate auto-generated tab/group duplicating the same operations at a second URL space. See [references/openapi.md](references/openapi.md) → "Hand-migrated endpoint pages + a spec".
- Do not leave unreferenced OpenAPI specs or duplicate hand-written endpoint pages.
- Read [references/openapi.md](references/openapi.md) before authoring or wiring API reference content.

### 6. Build or Update docs.json

- Mirror the live site's navigation structure for all discovered in-scope pages.
- Mirror nesting depth, not just membership: when a source sidebar entry has child pages beneath it (ReadMe parent pages with children, GitBook nested items), model it as a **nested group** whose first page is the parent page carrying `sidebarTitle: "Overview"` so its label doesn't duplicate the group name. Never flatten a parent's children into siblings — a flat list where the source shows an expandable sub-group is a nav-parity defect.
- Use `tabs` or `products` according to the existing repo pattern — but never more than 4 top-level tabs. If the nav needs more than 4 top-level sections, use `navigation.products` (product switcher dropdown) instead of a longer tab row. See [references/docs-json.md](references/docs-json.md) → "Tab cap".
- Use `groups` with `group` and `pages` arrays for sidebar sections.
- For OpenAPI-backed sections, reference the spec with the `openapi` key instead of listing generated endpoints manually.
- Ensure every converted site has the root-level `contextual` menu config.
- Always set `seo.metatags.robots` to `noindex` so the preview deployment is never indexed by search engines.
- Validate JSON after every structural edit.
- Read [references/docs-json.md](references/docs-json.md) before editing `docs.json`.

### 7. Finalize the Parity Manifest

- Update the manifest after conversion so every discovered page has `converted_file`, `status`, and `notes` filled in.
- Mark only these statuses: `done`, `blocked`, or `excluded`.
- For `blocked` and `excluded`, include a concrete source-specific reason in `notes`.
- Confirm every `done` file appears in `docs.json`, and every `docs.json` page maps back to a manifest row unless it is a synthetic Mintlify-only page such as the custom homepage.

### 8. Validate Before Finishing

- Run `mint broken-links` before `mint dev`; treat every MDX parser error as a blocker.
- Confirm no orphaned `.mdx` files, dangling navigation entries, skipped discovered pages, or unreferenced OpenAPI specs remain.
- Run final parity and quality checks before declaring the conversion complete.
- Read [references/validation.md](references/validation.md) for the exact gates.

## Completion Criteria

- `discovered_pages_count == converted_pages_count + explicitly_excluded_pages_count`.
- Every discovered page is marked `done`, `blocked`, or `excluded` with a concrete reason for non-`done` statuses.
- A repo-local parity manifest exists and includes `source_url`, `normalized_path`, `converted_file`, `nav_section`, `status`, and `notes` for every discovered page.
- Every created `.mdx` file appears in the `docs.json` navigation tree.
- `docs.json` includes root-level `contextual` config.
- `docs.json` sets `seo.metatags.robots` to `noindex`.
- If API docs exist, every OpenAPI spec is referenced from `docs.json` and paired with root-level `api` config, and no operation is exposed at two URL spaces (hand-migrated page + auto-generated playground page).
- If the source has a changelog, it is a single `<Update>` timeline page with `rss: true`, dates matching the source's real publish dates, and redirects covering every per-entry source URL.
- `mint broken-links` reports zero parser errors before `mint dev` verification.
- The repo is parser-clean in Mintlify, not merely visually plausible in edited files.
