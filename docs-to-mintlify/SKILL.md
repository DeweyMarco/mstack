---
name: docs-to-mintlify
description: Converts an existing documentation site into a Mintlify-compatible repo. Use when the user provides a docs site URL and wants it cloned/migrated to Mintlify with proper MDX files, components, and docs.json navigation.
---

# Docs to Mintlify Conversion

## Instructions

### 1. Gather Mintlify context first
- Use your Mintlify tools (`search_mintlify`, `query_docs_filesystem_mintlify`) to build context on:
  - How Mintlify structures pages and navigation in `docs.json`
  - The full list of available Mintlify components (callouts, cards, tabs, accordions, code blocks, steps, tooltips, etc.)
  - Best practices for MDX page structure (frontmatter: `title`, `description`, `sidebarTitle`, `icon`)
- Keep the component list in mind throughout the entire conversion — use Mintlify components wherever the original content has a semantically equivalent element

### 2. Discover all pages on the source site (exhaustive crawl, not just visible nav)
- Build a canonical URL inventory before writing any MDX files.
- Discovery must include all of the following sources:
  - Sitemap: check `[DOCS_SITE_URL]/sitemap.xml` and **recursively fetch every nested sitemap**. A `sitemap.xml` whose root element is `<sitemapindex>` is a list of sub-sitemaps; each child `<sitemap><loc>...</loc></sitemap>` must be fetched separately and its `<url><loc>...</loc></url>` entries merged into the inventory. Do not treat the index file itself as the URL list.
  - Navigation UI: header tabs, sidebar groups, footer links, and "related pages".
  - In-page links: recursively follow internal docs links until no new docs URLs are found.
  - Version/language variants (if present): include every published doc version/language in scope.
  - Programmatic artifacts: if the source exposes `llms.txt`, docs index JSON, or route manifests, ingest them too.
- Crawl depth rule: keep traversing internal docs links until two consecutive passes discover zero new in-scope docs pages.
- Normalize discovered URLs (remove hash fragments, canonicalize trailing slash behavior, dedupe query-only variants unless they represent distinct content).
- Track discovery in a parity manifest table with: `source_url`, `normalized_path`, `nav_section`, `status` (`todo|done|blocked`), and `notes`.
- Append `.md` to page URLs to get raw markdown as a starting point where possible, but still verify rendered content for missing sections/components.
- Do not stop at the first-level sidebar; deep nested and cross-linked pages are required.

#### 2.1 Raw-markdown fetch gotchas
- Before converting anything, download the full corpus into a `mirror/` staging directory, one `.md` per URL. Validate each fetch:
  - If any downloaded file starts with `<!DOCTYPE html>` or `<html`, the `.md` endpoint did not serve raw markdown — you got the rendered page instead. Those files must be re-fetched from an alternate endpoint or their content must be scraped from the rendered HTML.
  - Common cause on GitBook sites: the bare space root (e.g. `https://docs.example.com/product`) does **not** respond to `.md`. Use `readme.md` at the root (`https://docs.example.com/product/readme.md`) or the explicit root page slug. Always spot-check `curl -sS <root>.md | head -3` before assuming the pattern works uniformly.
- For sites with > 50 pages, fetch in parallel. A typical shell recipe:
  ```bash
  cat all-urls.txt | xargs -P 20 -I {} bash -c 'curl -sS --max-time 30 -o "mirror/$(echo {} | sed s#https://docs.example.com/##).md" "{}.md"'
  ```
  Expect some URLs to 404 or return HTML; re-fetch those with the alternate strategy above before moving on.
- Many doc platforms append a machine-readable footer to `.md` output (for example, GitBook emits `---\n# Agent Instructions: Querying This Documentation\n...`). Strip this footer from every file before converting — it will otherwise show up on every page as literal content.

### 3. Audit what's already in the repo
- Read the existing `docs.json` (or note it doesn't exist yet)
- List all existing `.mdx` and `.md` files in the repo
- Compare existing content against the full discovered URL inventory for 1:1 parity gaps
- Note what needs to be created vs. updated

### 4. Convert each page to Mintlify MDX

**Scale decision:** if the corpus has more than ~50 pages, do not convert pages by hand. Write a deterministic transformer script (Python is the easiest choice) that reads every file from the `mirror/` staging directory, applies the normalization rules below, and writes `.mdx` files into the repo. Hand-editing 1000 pages will always drift; a script you can re-run is the only way to stay consistent and land a clean parser pass. Hand-editing is appropriate only for small sites or for patching a handful of files the script can't handle.

For every page in the discovered inventory:
- Start from the `.md` raw output if available, otherwise scrape the rendered content
- Add proper frontmatter: `title`, `description`, and optionally `sidebarTitle` / `icon`
- Replace content patterns with Mintlify components where semantically equivalent:
  - Note boxes / warnings / tips → `<Note>`, `<Warning>`, `<Tip>`, `<Info>`
  - Step-by-step instructions → `<Steps>` with `<Step>` children
  - Grouped options or features → `<CardGroup>` with `<Card>` children
  - Tabbed content → `<Tabs>` with `<Tab>` children
  - Collapsible sections → `<Accordion>` / `<AccordionGroup>`
  - Code samples → fenced code blocks with language + optional `filename` and `expandable`
  - Parameter/property lists → `<ParamField>` or `<ResponseField>` in API contexts
  - Inline definitions → `<Tooltip>`
- Preserve all text content exactly — the goal is 1:1 reading parity, not a summary
- Do not add any mention of "clone", "preview", or "migration" in page content

#### 4.0.1 Frontmatter extraction (title + description)
- **Title:** take the first `# H1` line of the raw markdown, then remove that H1 from the body so it is not rendered twice (Mintlify renders the frontmatter title as the page heading). Fall back to a title-cased path segment if no H1 exists.
- **Description:** pick the first substantive paragraph in the body (not a heading, not a code fence, not a table row, not a list item, not a pure HTML/image block). Before writing it into YAML you **must** strip all markdown/HTML syntax or the frontmatter will contain garbage. Minimum normalizations:
  - Markdown links `[text](url)` → `text` (not `texturl`).
  - Images `![alt](url)` → remove entirely.
  - Inline code/bold/italic markers `` ` `` `*` `_` → strip.
  - HTML tags `<...>` → strip.
  - Collapse whitespace and trim to ~200 characters.
  - Escape or replace smart quotes (`\u2018 \u2019 \u201c \u201d`) so the YAML parser does not choke.
- Wrap both `title:` and `description:` values in double quotes and replace any embedded `"` with `'` to avoid YAML escaping edge cases.

#### 4.0.2 GitBook-specific syntax normalization (mandatory if the source is GitBook)
GitBook-hosted sites (any site whose `.md` output contains `{% ... %}` fences, `<mark style="color:...">`, `<figure>`, `<table data-view="cards">`, or `<div data-gb-custom-block>`) needs a normalization pass **before** you try to lift content into Mintlify components. Apply these transforms in order; missing any one will produce broken MDX.

1. **Strip the agent-instructions footer** appended by GitBook: match `\n---\n# Agent Instructions[\s\S]*$` and delete to end of file.
2. **Hint blocks** `{% hint style="info|success|warning|danger" %}...{% endhint %}` → Mintlify callouts. Recommended mapping: `info → <Info>`, `success → <Tip>`, `warning → <Warning>`, `danger → <Warning>`.
3. **Tab blocks** `{% tabs %}{% tab title="X" %}...{% endtab %}{% endtabs %}` → `<Tabs><Tab title="X">...</Tab></Tabs>`. Escape double quotes in the title to single quotes.
4. **Stepper blocks** `{% stepper %}{% step %}...{% endstep %}{% endstepper %}` → `<Steps><Step title="...">...</Step></Steps>`. If a step lacks a title, derive one from the first `#` heading or bolded line; otherwise fall back to `Step N`.
5. **Embed blocks** `{% embed url="X" %}...{% endembed %}` → a plain markdown link `[X](X)`.
6. **Self-closing file blocks** `{% file src="..." %}` → drop (or convert to a download link if the src is a real URL). Your regex must tolerate URL-encoded `%` characters in the src: **do not** use `\{%\s*[^%]*%\}` — it stops at the first `%` inside a URL. Use a non-greedy body: `\{%[\s\S]*?%\}`.
7. **Final catch-all** for any leftover `{% ... %}` tag: strip it with the same non-greedy regex above. Leftover GitBook fences will crash the MDX parser.
8. **GitBook "custom-block" HTML variants** (some pages emit tabs/hints as HTML rather than `{% %}`):
   - `<div data-gb-custom-block data-tag="hint" data-style="X" class="..."><p>...</p></div>` → convert to the equivalent hint callout. These can be multi-line or single-line; handle both.
   - `<div data-gb-custom-block data-tag="tabs">...</div>` → `{% tabs %}...{% endtabs %}`.
   - `<div data-gb-custom-block data-tag="tab" data-title='X'>...</div>` → `{% tab title="X" %}...{% endtab %}` (then the tab transformer picks it up). Note `data-title` is frequently single-quoted in GitBook exports.
   - After those transforms, strip any remaining `<div data-gb-custom-block ...>` openers and orphan `</div>` closers. Orphan `</div>` lines at the end of `<p>...</p></div>` sequences are a common export artifact and will crash acorn with `Unexpected closing tag </div>` or `Unexpected closing slash "/" in tag`.
9. **Color/mark wrappers** `<mark style="color:blue;">...</mark>` → keep only the inner text (drop the tag).
10. **Figures** `<figure><img src="..." alt="..."></figure>` → markdown image `![alt](src)`. A bare `<figcaption></figcaption>` without content can be dropped.
11. **GitBook card tables** `<table data-view="cards"><thead>...<th data-hidden data-card-target data-type="content-ref">...</table>` render fine as plain HTML tables once GitBook's custom attributes are stripped. Strip `data-view`, `data-hidden`, `data-card-target`, `data-type`, `data-size`, and `data-align` attributes. Converting them to `<CardGroup>` is optional polish and not required to reach a clean parser pass.
12. **Void HTML tags** `<br>`, `<hr>`, and `<img ...>` without a trailing `/` must be self-closed (`<br/>`, `<hr/>`, `<img ... />`) — MDX treats them as JSX and requires self-closing.
13. **GitBook backslash escapes**: raw markdown often contains `\[text\]\(url\)`, `` \` ``, `\_`, `\*` where GitBook pre-escaped punctuation. Unescape `\[`, `\]`, `\(`, `\)`, `\{`, `\}`, `` \` `` before further processing so links and code render correctly.

### 4.1 MDX syntax safety rules (mandatory)
- Keep frontmatter values plain text. Never put JSX/HTML tags in frontmatter fields.
  - Valid: `description: "How to validate webhook signatures."`
  - Invalid: `description: "<Info>"`
- All callout components must be properly paired and scoped:
  - `<Info>...</Info>`, `<Warning>...</Warning>`, `<Tip>...</Tip>`, `<Note>...</Note>`
  - Do not leave orphan opening/closing tags.
- Prefer whole-block transforms over piecemeal tag insertion.
  - First copy the full source block as plain markdown.
  - Then wrap the entire block in a Mintlify component only if the opening and closing tags are obvious and complete.
  - If the source structure is ambiguous, leave it as plain markdown instead of risking broken JSX.
- Do not close a callout before its intended content ends.
  - If code examples belong outside a callout, move them fully outside.
  - If code examples belong inside a callout, keep the entire fenced block inside.
- Keep fenced code blocks balanced and valid:
  - Every opening fence must have a closing fence.
  - Do not leave raw JSON/JS lines outside fences where MDX might parse them as JSX.
- Never place raw code, shell commands, JSON, or language samples immediately after an opening callout tag unless you have already written the matching closing tag and confirmed the whole block is balanced.
- For JSX props containing quotes (for example, `<Step title=...>`), avoid escaped quotes in double-quoted attributes.
  - Prefer single-quoted prop values when the text contains double quotes.
  - Example: `<Step title='Click "Create API Key" in Settings'>`
- Avoid backslash-escaped quotes inside JSX attributes.
  - Valid: `<Step title='Click "Create API Key" in Settings'>`
  - Invalid: `<Step title="Click \"Create API Key\" in Settings">`
- Never emit standalone closing tags at the top of a page (for example `</Info>` without a matching opener).
- Common parser failures to check for explicitly before moving on:
  - orphan closers such as `</Warning>` or `</Info>`
  - unclosed callouts where a later code block or heading should have been outside the component
  - JSX attributes with escaped quotes, stray backslashes, or truncated prop values
  - raw table/code/list text accidentally left inside JSX context

#### 4.1.1 Acorn / MDX parser gotchas (the exact things that break when you skip them)
MDX parses every non-fenced line through acorn (a JavaScript parser). These patterns look like innocent text in the source but are syntax errors in MDX — each one I hit during a real 1000-page conversion:

- **Angle-bracket URL autolinks** `<https://example.com>` — MDX reads `<https:` as an opening tag and chokes. Replace `<((?:https?|mailto):[^>\s]+)>` with just the inner URL (markdown will still auto-link a bare URL).
- **Bare `<` as text** (`use < for less than`, `<= v1.28`, `**<** and **>**`) — any `<` that is not immediately followed by an ASCII letter, `/`, or `!` must be escaped to `&lt;`. Also catch `<` at end of line and `<` followed by whitespace.
- **Pseudo-tags like `<image:product_001.jpg>`** — same rule; not a valid JSX tag so escape the `<` to `&lt;`.
- **`{ ... }` in prose** — MDX treats `{` as the start of a JSX expression. JSON snippets in tables (`| cell | {"enabled": true} |`) and HTML `<td>{...}</td>` cells blow up. Escape `{` → `\{` and `}` → `\}` inside pipe-style markdown tables and inside `<td>` / `<th>` content. Since this skill never emits real JSX expressions in content, escaping all stray braces outside code fences is safe.
- **`.md` / `.mdx` extensions on internal links** (`user-management.md#create-a-group`) — Mintlify's link resolver expects no extension. Strip the extension before rewriting the link; keep any `#fragment` or `?query` suffix.
- **Links using relative paths** (e.g. `../../management/user-management` from a deep page) frequently misresolve once the file tree changes. Rewrite every non-external link target to a **root-absolute** `/path/from/repo/root` form. See 4.1.2 below.
- **Orphan `</div>`** from malformed GitBook exports — strip these after the GitBook normalization pass; see step 4.0.2.8.
- **`<div data-gb-custom-block ...>` without a handled `data-tag`** — strip the opening tag too; otherwise MDX hunts for a matching closer.
- **Single-page failures during a bulk run** are almost always one of the above. When acorn reports `line:col - Could not parse expression with acorn` or `Unexpected closing tag`, open the file at that exact line first; the fix is nearly always one of the items in this list.

#### 4.1.2 Rewrite relative links to root-absolute paths (mandatory)
Source docs typically use relative links (`../../sibling`, `child/grandchild`, `./neighbor.md`). These break as soon as you reorganize the tree or when Mintlify resolves from a different base than the source platform. After all content transforms, rewrite links in this order:

1. Match both markdown links `[text](target)` (but not images `![alt](target)`) and HTML `<a href="target">`.
2. Skip any target starting with `http://`, `https://`, `mailto:`, `tel:`, `/`, or `#` — they are already absolute or in-page.
3. Split off any `#fragment` or `?query` suffix, preserve it, and re-attach after resolution.
4. Strip a trailing `.md` or `.mdx` extension from the path.
5. Join the remaining path against the current file's directory and normalize (`os.path.normpath` in Python, `path.resolve` in Node). If the result escapes the repo root (`..` at the front), leave the original target — it is a source-level bug you cannot auto-fix.
6. Prepend a leading `/` and write back: `[text](/resolved/absolute/path#fragment)`.

Run `mint broken-links` after this pass. Image references that point to paths you did not scrape (e.g. GitBook hosts images on a CDN but the source page used a local path) will remain as broken-link noise; those are content issues, not conversion bugs.

### 4.2 Parser validation gate (mandatory, do not skip)
- For hand-edited small batches: convert 5-15 pages, then validate before continuing.
- For scripted bulk conversion: run the full transformer end-to-end, then validate. When the parser flags errors, fix the transformer and re-run — do **not** hand-patch individual output files except for one-off source-level bugs that no rule can reasonably catch.
- Use `mint broken-links` as the primary headless validator. It surfaces **both** MDX parse errors (emitted inline as `parsing error <path>:<line>:<col> - ...`) **and** unresolved internal links in one pass, without needing to wait for `mint dev` to finish starting up. `mint dev` is the second-line check once `broken-links` is clean.
- Use this loop:
  1. (Re)run the transformer on the full corpus, or convert a small hand batch.
  2. Run `mint broken-links` and grep its output for `parsing error`.
  3. Fix every MDX parse error immediately — usually by adjusting a transformer rule (see 4.1.1) and re-running the script.
  4. Re-run until `parsing error` count is zero.
  5. Only then continue to navigation (step 6) and final `mint dev` verification.
- Treat these parser errors as release blockers, not follow-up cleanup:
  - `Expected a closing tag for <Warning>`
  - `Unexpected character "\" in attribute name`
  - `Unexpected closing slash "/" in tag`
  - `Could not parse expression with acorn` (almost always stray `{` / `}` in prose or an `<` that looks like a tag)
  - `Unexpected closing tag </div>, expected corresponding closing tag for <Tab>` (mis-paired GitBook tab export)
- If one file in a batch fails parsing, stop converting new pages and repair the broken file (or the transformer rule) first.
- Before finalizing, spot-check the exact files named in parser output rather than assuming the nearby edit was correct.
- **macOS copy artifact check:** after copying the transformer output into the repo with `cp -R`, list the tree for files matching `* 2.mdx` or `* 2/`. macOS Finder occasionally duplicates files with a ` 2` suffix, which then appear as phantom pages in the navigation. Delete them before running the parity check.

### 5. Handle API reference pages (only if the site has API docs)

First determine whether the source site has any API/endpoint documentation — if it does not, skip this step entirely and treat all pages as regular MDX content.

**If API docs exist, complete every sub-step below. Do not stop after authoring the spec — an unreferenced spec produces no playground.**

#### 5.1 Build the OpenAPI spec(s)
- Group endpoints by product/service. Create **one OpenAPI spec per product**, never merge unrelated products, never split a product across multiple specs.
- Location: `openapi/<product>.json` (JSON) or `openapi/<product>.yaml` (YAML). Either format works — pick one and be consistent.
- The spec **must** include all of the following, or the Mintlify playground will render incomplete:
  - `openapi: "3.1.0"` (or `3.0.x`) at the top.
  - `info.title`, `info.description`, `info.version`.
  - `servers[]` with the real production base URL (for example, `https://api.example.com/v1`).
  - `security` at the root (or per-operation) plus a matching entry under `components.securitySchemes` (`basicAuth`, `bearerAuth`, `apiKeyAuth`, or `oauth2`).
  - `tags[]` with a `name` and a `description` for every tag used — Mintlify uses these to build sidebar subgroups and section intros.
  - For every operation: `operationId`, `summary`, `description`, `tags`, request parameters/body, and at least one documented response (`200`/`201` minimum, plus relevant `4xx`/`5xx`).
  - Reusable schemas under `components.schemas` referenced via `$ref` — do not inline the same object twice.
  - A realistic `example` or `examples` block on every request body and success response so the playground pre-fills sensible values.

#### 5.2 Wire specs into `docs.json` (this step is mandatory — the playground does not appear otherwise)
- Add a **root-level `api` config** so the interactive playground turns on and uses the correct base URL / auth:
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
- For each spec, add a navigation **group** that points at the spec using the `openapi` key. Two equivalent forms exist — use whichever matches the repo layout:
  - Short form (lets Mintlify auto-group by OpenAPI `tags`):
    ```json
    { "group": "Core API", "openapi": "openapi/core.json" }
    ```
  - Object form (when you want MDX stubs generated into a specific directory for hybrid editing):
    ```json
    { "group": "Core API", "openapi": { "source": "openapi/core.json", "directory": "api-reference" } }
    ```
- Confirm after the edit that `docs.json` actually contains the `"openapi": ...` key somewhere in the API Reference tab. If it does not, the playground will not render — no exceptions.

#### 5.3 Authoring the surrounding prose pages
- Create an overview `.mdx` page for each API product: base URL, versioning, rate limits, pagination, error model.
- Create an authentication `.mdx` page that documents how credentials are obtained and passed.
- Create a sandbox / test-mode `.mdx` page if the source has one.
- Wire every one of those MDX files into the API Reference tab in `docs.json` — orphaned files that exist on disk but are not referenced in navigation are a failure mode of this skill and must be avoided.

#### 5.4 Avoid duplicate / orphan endpoint pages
- If you generate endpoint pages from OpenAPI, **do not also hand-author stub MDX files** for the same endpoints (for example, `api/orders/create.mdx` when `createOrder` already exists in the spec). Pick exactly one source of truth per endpoint.
- If the source site has rich hand-written endpoint pages that add value beyond the spec (extended examples, language-specific SDK snippets), keep them — but put them in a separate navigation group labeled clearly (for example, "Extended Guides") so they do not collide with the OpenAPI-generated pages.

#### 5.5 Verify the playground renders
Before marking the API section done:
- Grep `docs.json` for `"openapi"` — confirm at least one hit per product spec.
- Grep `docs.json` for every `api-reference/*.mdx` file you created — confirm each is referenced.
- Run `mint dev` and open one endpoint page from each spec. Confirm the right-hand playground shows method, path, auth fields, and at least one code sample. If it does not, the spec is missing `servers`, `security`, or examples — fix the spec, do not hack the config.

### 6. Build / update docs.json
- Mirror the exact navigation structure from the live site for all discovered in-scope pages
- Use `tabs` array for top-level tabs (each with `tab` + `groups`) or `products` array for product-style top-level tabs (with `product`, `description`, `icon`, `groups`) — match whatever pattern the rest of the config already uses
- Use `groups` with `group` + `pages` arrays for sidebar sections
- For OpenAPI-backed sections, reference the spec directly on the group. Do **not** list auto-generated endpoint pages manually:
  - Short form: `{ "group": "Core API", "openapi": "openapi/core.json" }`
  - Object form: `{ "group": "Core API", "openapi": { "source": "openapi/core.json", "directory": "api-reference" } }`
- Add the root-level `api` config described in 5.2 whenever the site has any OpenAPI spec — without it the playground defaults are wrong
- Preserve existing `colors`, `logo`, `favicon`, `fonts`, `navbar`, `footer`, `seo`, and `contextual` settings unless updating them is explicitly requested
- File paths in `pages` arrays must not include the `.mdx` extension
- Validate with `python3 -c "import json; json.load(open('docs.json'))"` after every structural edit

#### 6.1 Auto-generate navigation for large corpora
For sites with more than ~50 pages, build `docs.json` from the directory tree with a script rather than by hand. A minimal recipe:

1. Walk the repo tree. For each directory, emit a `{ "group": <Title>, "pages": [...] }` entry. Recurse into subdirectories as nested groups.
2. **Promote a landing page to `pages[0]` of its group** whenever one of the following exists, in priority order:
   - a sibling file with the same basename as the directory: `ai/ai-model-hub.mdx` for `ai/ai-model-hub/`.
   - a nested file with the same basename: `ai/ai-model-hub/ai-model-hub.mdx`.
   - an `overview.mdx` inside the directory.
   Remove that page from the rest of the `pages` array so it does not appear twice.
3. Human-friendly group names: kebab-case directory names (`network-services`) become Title Case (`Network Services`). Keep a small allow-list for common acronyms (`API`, `SDK`, `DNS`, `VPN`, `CDN`, `DCD`, `FAQ`, `VDC`, `IAM`, `NLB`, `ALB`, etc.) so they are not title-cased into `Api`, `Sdk`, `Dns`.
4. After emitting the JSON, run a **parity walker** that descends through `navigation.tabs[*].groups` / nested `pages` and collects every string entry (page path). Compare that set against the on-disk set of `.mdx` files:
   - Missing from nav (on disk but not referenced) → orphaned pages. Fix the generator so it picks them up, do not leave orphans.
   - Referenced but not on disk → dangling references. Fix the generator or delete the stale entry.
   The parity walker must traverse `tabs`, `groups`, and `pages` keys only — never recurse into arbitrary `group`/`tab` string values, or every label will be mis-counted as a page reference.
5. Before finishing, re-run `python3 -c "import json; json.load(open('docs.json'))"` to confirm the JSON is still valid after the generator wrote it.

### 7. Quality check
- Mentally (or literally) do a side-by-side comparison: live site page vs. converted MDX
- Every section, heading, paragraph, list, code block, and table must be present
- Mintlify components should be used wherever the original has an equivalent pattern
- Navigation order in `docs.json` must match the live site sidebar exactly
- No broken internal links — update hrefs to match the new file paths
- Repo-wide parser gate (mandatory):
  - Run `mint dev` or `mint validate` across the converted repo.
  - Resolve every MDX parser error before finishing.
  - Do not leave malformed JSX/callout syntax for a later pass.
- Parity gate (mandatory before finishing):
  - `discovered_pages_count == converted_pages_count + explicitly_excluded_pages_count`
  - Every discovered page is marked `done` or `blocked` in the parity manifest (no silent omissions)
  - Blocked pages must include a concrete blocker reason and recommended next action
  - Re-run link crawl on converted docs to ensure no orphaned in-scope source pages were skipped
  - If the site has API docs: every OpenAPI spec in `openapi/` is referenced from `docs.json` via an `openapi` key, the root `api` config is present, and every `api-reference/*.mdx` file exists in the navigation tree. A spec sitting on disk with no `docs.json` reference is treated as a failure, not as "done".

### Key rules
- Crawl exhaustively: never rely on only top-level navigation; include deep nested pages and recursively discovered internal links
- Sitemap indexes (`<sitemapindex>`) must be fully expanded — fetch every nested `<sitemap>` before building the URL inventory
- When the source is GitBook, download all `.md` raw files into a staging mirror first; validate none came back as HTML; strip the `# Agent Instructions` footer before converting
- For corpora over ~50 pages, write a deterministic transformer script instead of hand-editing — re-running a script is the only way to keep 1000+ pages consistent
- Escape/normalize every MDX acorn trap listed in 4.1.1 (angle-bracket URLs, bare `<` / `<=` / `{...}` in prose, void HTML tags, backslash-escaped markdown, orphan `</div>`). Skipping any one of these guarantees a parser error somewhere in the corpus.
- Rewrite all internal links to root-absolute `/path` form (section 4.1.2). Relative links break silently as soon as the tree shifts.
- Validate with `mint broken-links` (catches parse errors *and* dead links) before `mint dev`; a single `parsing error` line in its output is a blocker.
- Never mention "clone", "preview", or "migration" anywhere in page content or filenames
- Only create OpenAPI specs if the source site actually has API/endpoint documentation — skip entirely for pure content sites
- One OpenAPI spec per product — combine all endpoints for that product, never split across files
- **Authoring an OpenAPI spec is only half the job. A spec that is not referenced from `docs.json` via the `openapi` key — and is not paired with a root-level `api` config — produces no playground. Treat the wiring step (5.2) as equally mandatory as writing the spec itself.**
- Never leave hand-written endpoint MDX files that duplicate operations already in an OpenAPI spec — pick one source of truth
- Every `.mdx` file created during conversion must appear in the `docs.json` navigation tree. Orphan files are a failure
- Always check what's already in the repo before creating files — update existing files to reach parity rather than duplicating
- Keep frontmatter minimal: only include fields that add value. When auto-deriving `description:`, strip markdown/HTML syntax first (see 4.0.1) — raw markdown in frontmatter produces garbage like `With IONOS Cloud Compute Enginehttps://docs.example.com/...`.
- Do not invent content — every word must come from the source site
- A conversion is not complete until the repo is parser-clean in Mintlify, not just visually plausible in the edited files
