---
name: docs-to-mintlify
description: Converts an existing documentation site into a Mintlify-compatible repo. Use when the user provides a docs site URL and wants it cloned/migrated to Mintlify with proper MDX files, components, and docs.json navigation.
---

# Docs to Mintlify Conversion

Convert an existing docs site into a parser-clean Mintlify repo with 1:1 content parity, complete navigation, no orphaned pages, and a durable parity manifest that later skills can verify against.

## The requester's brief comes first

When the request that started the migration says how the site should be organized ("four tabs: customer, researcher, API, changelog", "a product dropdown for the three sites", "organize the API reference the way they have it today"), that is the spec. It outranks the source site's structure and every default in this skill. Read it before the crawl, build it in the first pass, and list in the final report how each wish was met. A site named only as a look or layout reference ("make it resemble docs.example.com") is not a content source: do not crawl or migrate it.

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
- **Prefer the source files to the rendered HTML.** If the docs are built from a public git repo (the requester linked one, or pages carry "Edit this page" links), clone it and convert the Markdown or MDX directly; a Docusaurus or MkDocs repo also gives you the real sidebar config. Scrape only what the repo does not hold.
- **When the source blocks you** (403, bot wall, login), work down this list before giving up: the platform's public API (Zendesk `/api/v2/help_center/articles.json`, Intercom, ReadMe, GitBook, Document360), `sitemap.xml`, a real browser with a normal user agent, then an archived copy. Pages that are still unreachable are `blocked` in the manifest and named at the top of the final report. Never fill the gap with placeholder or invented articles, and never ship a page whose body only says the content is on the live site.
- **Leave out what is not documentation**, and mark each `excluded` with the reason: sign-in, sign-up, account, profile and password screens; error and 404 pages; cookie and consent pages; drafts, test and internal pages (`_temp_`, `TEST of ...`, `FOR_X_ONLY`); and pages the source's own navigation does not link to. Terms and privacy pages become footer links, not sidebar pages. When the only source is a marketing site, leave out news, events, careers and legal pages.
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
- Add clean frontmatter and remove duplicated H1s. A `description` renders as the subtitle under the title, so take it from the source page's own subtitle or meta description as one complete plain-text sentence. It is never a slice of the body, a fragment that starts or stops mid-sentence, or text carrying Markdown, links or table syntax, and it must not repeat the page's first paragraph, or the intro renders twice. A page whose source has neither gets no description.
- Clean titles and paths as part of the transformer: strip the site-name suffix the source appends to every title (" - Acme Documentation"), and strip numeric ids and `-2` suffixes from slugs, adding a redirect for each path that changes. Write titles through a YAML serializer, not string concatenation, so a title containing a colon does not end up wrapped in a second pair of quotes (`title: "'Part 1: Setup'"`).
- Download every image, video and downloadable file into the repo and reference it by a root-relative path. Never hotlink the source: its servers and the browser's cross-origin rules block other origins, so the images load in `mint dev` and break on the deployed preview.
- Rewrite links to pages you migrated as internal links. A preview that sends readers back to the source site for a page it already has reads as unfinished. No link may be left without a target, and no `localhost` URL may appear anywhere in the repo.
- Replace source patterns with Mintlify components where equivalent: callouts, steps, cards, tabs, accordions, code blocks, parameter fields, response fields, and tooltips.
- Never add "clone", "preview", or "migration" to page content or filenames.
- Changelog / release-notes sections do **not** convert page-per-entry: consolidate them into a single `<Update>` timeline page with `rss: true`, real publish dates (not sitemap `lastmod`), and redirects preserving per-entry URLs. Read [references/changelogs.md](references/changelogs.md) before converting one.
- Read [references/mdx-conversion.md](references/mdx-conversion.md), and read [references/gitbook.md](references/gitbook.md) for GitBook sources.

### 5. Handle API Docs Only When Present

- First determine whether the source has API or endpoint docs. Skip this step entirely for pure content sites.
- If API docs exist, create one OpenAPI spec per product, wire each spec into `docs.json`, add the root-level `api` config, and verify that the playground renders.
- Find the customer's own spec before anything else: links on the reference pages, the network requests the reference makes, `/openapi.json` and `/swagger.json`, the JSON that a Redoc, Stoplight, ReadMe or Swagger UI page embeds, and the company's public GitHub. Convert Swagger 2.0 to OpenAPI 3 and fix whatever stops Mintlify loading it.
- A spec that fails validation is repaired, never dropped. Read the errors `mint validate` reports and fix their causes with a script: unresolved `$ref`s, duplicate `operationId`s, schemas missing `type`, invalid examples. If one operation or schema cannot be repaired, cut that one out, keep the rest of the spec, and report what was cut.
- If an API has no spec anywhere, build one from the source's own endpoint pages. Those pages already state each method, path, parameter, request body, response and example, so a script can turn them into one OpenAPI 3 file per API, with the server URL and authentication the source documents. Carry each page's prose into the operation's `description`, and record only what the source documents: no invented endpoints, fields or types. Where a page is too loose to parse, write that one endpoint as an MDX page with `api: "METHOD /path"` frontmatter, `<ParamField>` and `<ResponseField>`, and `api.mdx.server` set in `docs.json`, which still has a playground.
- **The API reference is never shipped as stubs, link-outs to the live site, an iframe, one monolithic page, or hand-written endpoint pages with no playground.** These are the most common reason a preview is sent back. If the source has an API reference, the preview has endpoint pages with a working playground in an "API Reference" tab, grouped the way the source groups them.
- Several spec versions (`1.0.0` to `1.4.0`, `v1` and `v2 beta`) become a version switcher that defaults to the newest, not one tab per version and not a sidebar group named after the version number.
- When the source has hand-written per-endpoint pages (ReadMe.com reference sections are the canonical case), overlay the playground on those migrated pages with per-page `openapi:` frontmatter — never mount the spec as a separate auto-generated tab/group duplicating the same operations at a second URL space. See [references/openapi.md](references/openapi.md) → "Hand-migrated endpoint pages + a spec".
- Do not leave unreferenced OpenAPI specs or duplicate hand-written endpoint pages.
- Read [references/openapi.md](references/openapi.md) before authoring or wiring API reference content.

### 6. Build or Update docs.json

- Mirror the live site's navigation structure for all discovered in-scope pages.
- Mirror labels and order, not only membership. Section and page labels use the source's exact wording and casing ("API essentials", not "Api Essentials"), and pages keep the source's order so Previous and Next follow its reading order. Never sort alphabetically.
- Never list a section twice, once as flat pages and again as a group of the same name.
- No sidebar is one long flat list. Where the source has groups, use them; where it has none, group by topic into collapsible groups (see `/style-docs` → *Restructuring a large, flat navigation*).
- Every section, product and tab opens on an overview page with real content: the source's own overview where it has one, otherwise a short intro and cards for the pages beneath it. A page that is only a title and a tagline is a defect.
- Mirror nesting depth, not just membership: when a source sidebar entry has child pages beneath it (ReadMe parent pages with children, GitBook nested items), model it as a **nested group** whose first page is the parent page carrying `sidebarTitle: "Overview"` so its label doesn't duplicate the group name. Never flatten a parent's children into siblings — a flat list where the source shows an expandable sub-group is a nav-parity defect.
- Deliberately choose among root-level `groups`, `tabs`, `products`, and `versions`. All are optional: use the surface that best matches the source IA and intended user journeys, and do not select one from section count alone.
- Check whether tabs, a product switcher, or a version switcher would keep unrelated journeys out of the same sidebar, but keep root-level groups when a continuous sidebar is clearer. See [references/docs-json.md](references/docs-json.md) → "Navigation surface selection".
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
- The chosen navigation surface is intentional and verified in preview; tabs, products, and versions are used only when they improve the source IA rather than to satisfy a fixed threshold.
- `docs.json` includes root-level `contextual` config.
- `docs.json` sets `seo.metatags.robots` to `noindex`.
- If API docs exist, every OpenAPI spec is referenced from `docs.json` and paired with root-level `api` config, and no operation is exposed at two URL spaces (hand-migrated page + auto-generated playground page).
- If the source has an API reference, every endpoint has a native page with a playground, from the source's spec or one built from its endpoint pages, and none of it is a stub, a link-out, an iframe, or a hand-written page with no playground.
- No spec was dropped because it failed validation.
- Navigation labels, casing and order match the source; no sidebar is a long flat list; every section's overview page has content.
- No non-documentation pages (auth screens, error pages, drafts, test pages) were migrated, and no page holds placeholder or invented content.
- Every image and media file is committed to the repo; `grep -rn 'src="http' --include='*.mdx' .` returns only deliberate external embeds.
- No root `llms.txt`, `llms-full.txt` or `skill.md` was written by hand, and `grep -rn localhost` over the content returns nothing.
- If the source has a changelog, it is a single `<Update>` timeline page with `rss: true`, dates matching the source's real publish dates, and redirects covering every per-entry source URL.
- `mint broken-links` reports zero parser errors before `mint dev` verification, and no internal link is broken. Links to paths the source has since renamed are resolved through the source's own redirects (see `/fix-broken-links`).
- No title is wrapped in a second pair of quotes, and no `description` starts with a lowercase letter, ends in `…`, or contains `](`, `|` or a backtick.
- The repo is parser-clean in Mintlify, not merely visually plausible in edited files.
