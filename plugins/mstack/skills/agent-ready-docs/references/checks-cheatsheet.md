# AFDocs Checks Cheatsheet

Stack-agnostic reference. Every check has: what it measures, threshold, common cause when failing, and the fix intent. Implementation depends on the user's stack — this file describes *what* to do, not *how* to write it in framework X. Code examples are illustrative.

## Content Discoverability

### `llms-txt-exists`
**Looks for**: `/llms.txt` returning `text/*` (not HTML), non-empty body.
**Fix**: Add a route or static file that serves `/llms.txt` with `Content-Type: text/plain`. Don't return HTML even on errors.
**Mintlify-hosted**: Built in at `/llms.txt` and `/.well-known/llms.txt`. Add a custom root `llms.txt` only when generated output needs curation.

### `llms-txt-valid`
**Looks for**: `# H1` first line, at least one markdown link `[text](url)`.
**Fix**: Start with `# Site Name`, include a `## Docs` section with at least one link.

### `llms-txt-size`
**Threshold**: pass ≤ 50K, fail > 100K characters.
**Fix when failing**: If you list hundreds of items inline, split into a small root + nested index. Root lists docs sections and links to nested files (e.g. `/articles/llms.txt`). The nested files contain the long item lists.

### `llms-txt-links-resolve`
**Threshold**: ≥ 90% of same-origin links return 200 (HEAD or GET).
**Common cause**: Stale links, placeholder URLs like `{name}` parsed literally, broken redirects.
**Fix**: HEAD-check every link locally; replace `{placeholder}` with `<placeholder>` in code blocks (angle brackets aren't parsed as URL parts); fix or remove dead links.

### `llms-txt-links-markdown`
**Threshold**: ≥ 50% of same-origin links point to `.md` URLs.
**Fix**: Where you currently link to HTML pages from llms.txt, link to their `.md` equivalents instead. External links don't count.
**Mintlify-hosted**: Generated `llms.txt` links to `.md` page variants automatically. If this fails, look for custom `llms.txt` content or reverse-proxy path handling.

### `llms-txt-directive-html`
**Looks for**: a link to `/llms.txt` somewhere in the HTML of doc pages.
**Fix**: Put a small `sr-only` blockquote `<blockquote class="sr-only"><a href="/llms.txt">llms.txt</a></blockquote>` near the top of `<main>`, OR add a header link, OR a meta tag. Anywhere visible to the parser.
**Mintlify-hosted**: Mintlify adds `Link` and `X-Llms-Txt` headers to page responses. Verify headers if the site is reverse-proxied before adding visible content.

### `llms-txt-directive-md`
**Looks for**: a blockquote near top of EVERY markdown page that links to llms.txt.
**Fix**: In every markdown response, prepend the body with `> [llms.txt](https://site.com/llms.txt)` directly after the H1. The shortest form (just the link in a blockquote) is enough.
**Mintlify-hosted**: Markdown exports include a documentation-index blockquote. Fix source MDX/frontmatter rather than attempting to customize route output.

## Markdown Availability

### `markdown-url-support`
**Looks for**: appending `.md` to any URL returns markdown content.
**Fix**: Add a routing rule that recognizes `.md` URLs and serves a markdown variant. The exact mechanism depends on the stack — middleware, rewrite rule, separate route handler, or pre-rendered `.md` files alongside `.html`.
**Mintlify-hosted**: Built in for published pages.

### `content-negotiation`
**Looks for**: `GET /` with `Accept: text/markdown` returns markdown.
**Fix**: Sniff the `Accept` header on incoming requests and dispatch to the markdown variant when it requests `text/markdown`. Same routing layer that handles `.md` URLs typically.
**Mintlify-hosted**: Built in for `Accept: text/markdown` and `Accept: text/plain`. If this fails, check reverse-proxy forwarding.

## Page Size and Truncation Risk

### `rendering-strategy`
**Looks for**: pages have server-rendered content (not pure CSR).
**Fix**: Make sure your pages render meaningful content server-side. Pure JS-app shells with `<div id="root"></div>` and nothing else fail this.

### `page-size-markdown`
**Threshold**: each page < 50K chars markdown (warn) / < 100K (fail).
**Common cause**: A `text/plain` endpoint (e.g., `/llms-full.txt`) returns too much raw content — Mintlify counts it as-is without conversion.
**Fix**: If you have a "full corpus" file with hundreds of items, **don't repeat install/usage blocks per item**. Put templates once in the header, list items compactly. This typically gives ~75% size reduction.

### `page-size-html` ⚠ Mintlify gotcha
**Threshold**: pass ≤ 50K, warn 50-100K, fail > 100K converted markdown.
**Mintlify-specific**: Mintlify keeps `<script>` content. AFDocs CLI strips it. Reproduce locally:
```js
// Mintlify-style
const md = turndown(html.replace(/<style[\s\S]*?<\/style>/g, ""));
// AFDocs-CLI-style
const md = turndown(html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, ""));
```
**Common causes** (in roughly decreasing impact):
- Framework hydration payload in inline scripts (Next.js `__next_f.push`, Nuxt `__NUXT__`, etc.)
- Long lists rendered in full SSR (every item adds to the tree)
- Verbose third-party widget configs (toasters, modals)
- Multiple inline JSON-LD blocks
**Fix intent**: trim what's flowing into hydration data. Big arrays passed as props to client components → move to module-scope JS imports. Heavy widgets → load client-only. SSR'd long lists → render only first chunk, lazy-load the rest.

If the user's site is Next.js, see [`nextjs-gotchas.md`](nextjs-gotchas.md). For other stacks the same principles apply but the code differs.

### `content-start-position`
**Threshold**: pass ≤ 10%, warn 10-50%, fail > 50% (position of first H1/H2 in converted markdown).
**Algorithm**: cumulative char count walks every line; lines short (<40 chars) or high-link-density (>50%) are skipped as "nav" but still counted toward position. First "meaningful" content sets the position.
**Common causes**:
- JSON-LD scripts in `<head>` add 4-5K of pre-content text (each block is fully converted to markdown text).
- Header navigation with verbose items (long button labels, dynamic counters) that don't get classified as nav by the algorithm.
- Long page `<title>` tags.
**Fix intent**:
1. Move JSON-LD to end of `<body>`, not `<head>`. SEO crawlers find them anywhere; their position only matters for HTML→markdown conversion.
2. Decouple DOM order from visual order so `<main>` content comes first in HTML byte order, while header still appears at top visually (CSS `order` on flex children does this cleanly).
3. Trim long `<title>` and verbose header items.
4. On detail pages, move per-page JSON-LD (Breadcrumb, Product, Article) AFTER the main `<section>` instead of before it.

## Content Structure

### `tabbed-content-serialization`
**Looks for**: tab groups serialize URL state and convert under 50K.
**Fix**: When using tabs, bind active tab to URL state so the conversion captures all tab panels.

### `markdown-code-fence-validity`
**Looks for**: all code fences (```) properly closed in markdown responses.
**Fix**: Lint your markdown templates; double-check that template-string interpolations don't break fences.

### `section-header-quality` (typically SKIP)
Skipped when no tab panels with headers exist. Safe to ignore.

## URL Stability and Redirects

### `http-status-codes`
**Looks for**: bad URLs return 4xx (not 200 with HTML error page).
**Fix**: Make sure your 404 handler returns 404 status, not 200 with a "page not found" body.

### `redirect-behavior`
**Looks for**: no unexpected redirects.
**Fix**: Don't redirect on docs URLs unless absolutely necessary; use canonical URLs.

## Observability and Content Health

### `llms-txt-coverage`
**Looks for**: llms.txt covers a reasonable % of sitemap doc pages.
**Fix**: Make sure all docs/items in sitemap have corresponding entries in llms.txt or its nested files.

### `markdown-content-parity`
**Threshold**: ≥ 95% content overlap between HTML and markdown versions.
**Common cause**: HTML page has sections (e.g., "Similar items", "Related", "Comments") that aren't in the markdown response.
**Fix**: Render the same sections in the markdown response. If HTML shows 6 similar items, include them as a `## Similar` list in markdown.
**Mintlify-hosted**: Use `<Visibility for="agents">` for agent-only Markdown content and `<Visibility for="humans">` for web-only UI content. Fix the MDX source; do not implement a separate Markdown route.

### `cache-header-hygiene`
**Looks for**: `Cache-Control` set on docs endpoints; max-age under 24h or revalidation directives.
**Fix**: Add `Cache-Control: public, max-age=3600, must-revalidate` to llms.txt, llms-full.txt, skill.md, /mcp routes, and other docs/agent-facing endpoints.
**Mintlify-hosted**: Built-in docs responses use revalidation-friendly cache headers. If a check fails, inspect any reverse proxy or CDN in front of Mintlify.

## Authentication and Access

### `auth-gate-detection`
**Looks for**: docs pages publicly accessible.
**Fix**: Don't put docs behind auth. If you must, expose at least the markdown variants publicly.

### `auth-alternative-access` (often SKIP)
Skipped when all docs are public. Safe.

## MCP / Extension checks

### `mcp-server-discoverable`
**Looks for**: `POST /mcp` accepts JSON-RPC `initialize` and `tools/list`.
**Fix**: See [`mcp-server.md`](mcp-server.md) for the protocol and a working implementation.
**Mintlify-hosted**: Built in at `/mcp` for published docs. Verify forwarding on custom domains or reverse proxies before implementing anything.

### `mcp-tool-count`
**Threshold**: ≥ 1 tool registered.
**Fix**: Register at least one useful tool — search/list/get patterns work well.
**Mintlify-hosted**: Built-in MCP exposes documentation search/filesystem tools.

### `skill-md`
**Looks for**: `/.well-known/agent-skills/index.json` (preferred) or legacy `/skill.md`.
**Fix**: A static `/skill.md` markdown response is the simplest. Include skill name, when to use it, install instructions, and constraints.
**Mintlify-hosted**: Built in. Mintlify can generate `skill.md`, and custom root `skill.md` or `.mintlify/skills/*/SKILL.md` files override/add skills. Prefer the `/.well-known/agent-skills/index.json` discovery endpoint when verifying.

### `llms-full-exists` / `llms-full-size` / `llms-full-valid`
**Threshold for size**: 500 ≤ chars ≤ 5,000,000 (so don't make it tiny OR huge).
**For valid**: needs `# H1` + at least 2 headings.
**Fix**: Provide a single comprehensive corpus file with templates in header and compact item list. See [`llms-files.md`](llms-files.md).
**Mintlify-hosted**: Built in at `/llms-full.txt` and `/.well-known/llms-full.txt`. Add a custom root file only if generated output causes a score failure.
