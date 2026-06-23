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
- Read [references/mdx-conversion.md](references/mdx-conversion.md), and read [references/gitbook.md](references/gitbook.md) for GitBook sources.

### 5. Handle API Docs Only When Present

- First determine whether the source has API or endpoint docs. Skip this step entirely for pure content sites.
- If API docs exist, create one OpenAPI spec per product, wire each spec into `docs.json`, add the root-level `api` config, and verify that the playground renders.
- Do not leave unreferenced OpenAPI specs or duplicate hand-written endpoint pages.
- Read [references/openapi.md](references/openapi.md) before authoring or wiring API reference content.

### 6. Build or Update docs.json

- Mirror the live site's navigation structure for all discovered in-scope pages.
- Use `tabs` or `products` according to the existing repo pattern.
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
- If API docs exist, every OpenAPI spec is referenced from `docs.json` and paired with root-level `api` config.
- `mint broken-links` reports zero parser errors before `mint dev` verification.
- The repo is parser-clean in Mintlify, not merely visually plausible in edited files.
