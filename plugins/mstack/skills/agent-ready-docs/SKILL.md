---
name: agent-ready-docs
description: Audit and fix websites and documentation to score 100/100 on AFDocs (afdocs.dev) and Mintlify Agent Rank (mintlify.com/score) checks. Use this skill whenever the user mentions agent score, agent-readiness, AFDocs, agent-rank, agent-friendly docs, improving AI readability of docs, llms.txt, llms-full.txt, skill.md, MCP server discoverability, content-start-position, page-size-html, markdown content negotiation, or shares any agent-readiness scoring report with failing/warning checks. Stack-agnostic — works for Mintlify docs, Next.js, Astro, Hugo, plain HTML.
---

# Agent Ready Docs

Get a site to **100/100 on agent-readiness scoring** — the checks at [afdocs.dev](https://afdocs.dev) and Mintlify's [agent-rank dashboard](https://mintlify.com/score). **You are not done until the score has improved.**

This skill is stack-agnostic. The rules apply to docs sites, marketing pages, product sites, and anything else being scored. Every site's structure is different — treat the patterns here as **diagnostic categories**, not a checklist of literal files to fix. When implementation examples appear, they're illustrative; the user's stack might be Next.js, Astro, Hugo, Mintlify, plain HTML, or something else entirely.

For **Mintlify-hosted docs**, many route-level agent-readiness features are platform-owned. Do not add custom route handlers for `/llms.txt`, `/llms-full.txt`, `.md` URLs, `Accept: text/markdown`, `/.well-known/agent-skills/*`, or `/mcp` unless the site is headless/custom-front-end or reverse-proxied in a way that bypasses Mintlify.

## Position in the mstack migration workflow

For source-replica migrations, run this skill after `/preview-qa` and `/han-review`, not before them. Agent-readiness changes are useful, but they must not silently break source parity:

- Do not add visible frontmatter descriptions that the source page does not render.
- Do not rename source-backed page titles, sidebar labels, or CTAs solely for score optimization.
- If you split pages, move pages, add navigation entries, or change visible content, rerun `/fix-broken-links` and `/preview-qa`.
- Prefer agent-only improvements such as generated platform metadata, `Visibility for="agents"`, and Markdown availability fixes when they preserve the human-facing replica.

## When to reach for this

- Any AFDocs/Mintlify scoring report shared with failing/warning checks
- "make my docs agent-friendly", "improve my agent score / agent-rank score", "100/100 agent readiness", "improving AI readability of docs"
- Mentions of `llms.txt`, `llms-full.txt`, `skill.md`, MCP server discovery
- Setting up content negotiation (`Accept: text/markdown`)
- Investigating why a Mintlify scorecard shows page-size-html FAIL when local AFDocs CLI passes

## Mintlify-hosted docs: fast-path workflow

When the user is working inside a Mintlify project (has `docs.json`), use this focused loop before the deeper diagnostic workflow below.

### 1. Get the docs URL

If not provided, read `docs.json` for the configured URL or ask the user for the deployed docs URL. `mint.json` is deprecated; only use it when working on an old project that has not migrated yet.

```bash
jq -r '.url // empty' docs.json
```

### 2. Baseline score

```bash
npx afdocs check <url> --format scorecard --sampling deterministic
```

Record the score and failing categories.

### 3. Detailed diagnostics

```bash
npx afdocs check <url> --format text --verbose --fixes
```

Lists every failing check with the affected page(s), what is wrong, and suggested remediation.

### 4. Fix — Mintlify-specific quick wins

Work through failures in priority order. These are fast and high-value for Mintlify docs:

| Category | Issue | Fix |
|---|---|---|
| Content discoverability | Page not in `navigation` | Add page to the correct `navigation` group in `docs.json` |
| Content discoverability | No title | Add a clear `title` to the page's frontmatter |
| Content discoverability | Missing description | Add a one-sentence `description` to page frontmatter; Mintlify uses it in generated `llms.txt` |
| Markdown availability | Human-only UI instructions | Use `<Visibility for="agents">` for agent-specific Markdown output and `<Visibility for="humans">` for web-only UI guidance |
| Markdown availability | Tabs/Accordions hide critical content | Move critical content out of collapsed components or add an agent-facing summary |
| Markdown availability | Code-only page | Add prose explanation around code snippets |
| Page size | Page too long | Split into focused sub-pages; add anchor links in the parent |

Fix issues in batches by category, not one micro-edit per re-run.

### 5. Verify platform-provided features before implementing anything

Mintlify-hosted docs can already build the core agent-readiness surface:

| Element | Mintlify-hosted support | What to do in the docs repo |
|---|---|---|
| `llms.txt` | Built in at `/llms.txt` and `/.well-known/llms.txt`; custom root `llms.txt` overrides generated output | Usually add/fix page `description` fields and navigation. Only add custom `llms.txt` when generated output is too large or needs curated sections |
| `llms-full.txt` | Built in at `/llms-full.txt` and `/.well-known/llms-full.txt`; custom root file overrides generated output | Usually leave generated. Add custom only if score reports size/validity issues |
| Markdown URL support | Built in: append `.md` to page URLs | Do not implement routes. Fix source MDX if Markdown output is incomplete |
| Content negotiation | Built in for `Accept: text/markdown` and `Accept: text/plain` | Do not implement middleware on hosted docs |
| Agent-only Markdown content | Built in with `<Visibility for="agents">` | Use it for agent instructions that should not appear in the web UI |
| HTML llms discovery | Built in with `Link` and `X-Llms-Txt` headers on page responses | Verify deployed headers if reverse-proxied |
| `skill.md` / skill discovery | Built in. Mintlify can generate `skill.md`; custom root `skill.md` or `.mintlify/skills/*/SKILL.md` overrides/adds skills; discovery lives under `/.well-known/agent-skills/` and `/.well-known/skills/` | Add custom skills when generated output is not specific enough |
| MCP server | Built in at `/mcp` for published Mintlify docs, returning search and docs-filesystem tools | Verify with JSON-RPC; do not implement a custom MCP server for hosted docs |
| Cache headers | Built in on Mintlify docs responses with revalidation-friendly `Cache-Control` | If reverse-proxied, verify the proxy preserves sane headers |

References checked: Mintlify docs for `llms.txt`, Markdown export, `skill.md`, MCP, and `Visibility`; live HTTP checks against Mintlify's hosted docs confirmed `.md`, `Accept: text/markdown`, `llms` files, skills discovery, cache headers, and `/mcp`.

### 6. Iterate

```bash
npx afdocs check <url> --format scorecard --sampling deterministic
```

- **Score improved?** Check if further gains are practical. If near the ceiling or remaining issues are structural (third-party embeds, etc.), report progress and stop.
- **Score unchanged?** Re-read `--verbose --fixes` output and try a different category.
- **More issues remain?** Repeat from step 4.

Do not stop until the score has improved at least once from baseline. Do not hide content to hit a score — fixes must genuinely improve readability. If a fix requires structural changes (splitting pages, adding navigation entries) that seem risky, confirm with the user first.

---

## The two scorers (read this first)

There are two services that score against the same [spec](https://agentdocsspec.com/spec/), and they don't measure identically:

| Aspect | **AFDocs CLI** (afdocs.dev) | **Mintlify Agent Rank** (mintlify.com/score) |
|---|---|---|
| Source | Open: [agent-ecosystem/afdocs](https://github.com/agent-ecosystem/afdocs) | Hosted dashboard at `mintlify.com/score/<slug>` |
| HTML→md conversion | Turndown after stripping `<script>` AND `<style>` | Turndown after stripping `<style>` ONLY |
| Triggering | `npx -y afdocs check <url>` | Auto on tracked sites; "Rerun" button on detail page |
| Cache | Per-run | Several hours between reruns |

**The crucial difference**: Mintlify keeps `<script>` content in conversion. On many modern sites, `<script>` blocks contain serialized hydration data — for example, Next.js emits `self.__next_f.push(...)` blocks containing the entire React tree as JSON; other frameworks emit `<script id="__NEXT_DATA__">`, Astro islands, Nuxt `__NUXT__`, etc. All of that text gets converted to markdown by Mintlify's scorer. AFDocs CLI strips it and tells you everything is fine.

**If a user reports a Mintlify failure that AFDocs CLI says is passing, this is almost always why.** Reproduce locally:

```js
import TurndownService from "turndown";
const html = await (await fetch(url)).text();

// Mintlify-style measurement (the strict one)
const stripped = html.replace(/<style[\s\S]*?<\/style>/g, ""); // KEEP scripts
const md = new TurndownService().turndown(stripped);
console.log("Mintlify-style markdown size:", md.length);
```

If the size is much higher than `npx afdocs check` reports, you've found it.

## Workflow

### 1. Get the actual failing checks before changing anything

Don't guess. Get the data first.

- **AFDocs CLI** — run it yourself:
  ```bash
  npx -y afdocs check https://example.com --max-links 50 --format scorecard
  ```
  Add `--checks page-size-html,content-start-position` to target specific checks. `-v` for per-page details.

- **Mintlify Agent Rank dashboard** — open the dashboard page for the site, expand the failing check to see the message and details. If you need precise per-page numbers, open DevTools → Network and copy the JSON response that the page fetches when it loads — there's a `report.results[]` array with each check's `id`, `status`, `message`, and a `details` object containing the offending page and measurements. Without those numbers you're guessing.

### 2. Fix in priority order

Read the relevant reference file when you start fixing each category:

- [`references/checks-cheatsheet.md`](references/checks-cheatsheet.md) — every AFDocs check, what triggers fail/warn, and the fix intent (stack-agnostic)
- [`references/llms-files.md`](references/llms-files.md) — llms.txt, llms-full.txt, skill.md format and pitfalls
- [`references/mcp-server.md`](references/mcp-server.md) — what an MCP server needs to satisfy the check, with one concrete implementation
- [`references/nextjs-gotchas.md`](references/nextjs-gotchas.md) — **Next.js App Router-specific** patterns. Read only if the user's site is Next.js. The patterns there have analogs in other frameworks; the fundamentals (serialized hydration data, dynamic imports, DOM ordering) generalize but the code does not.

### 3. Verify locally before pushing

The whole point of reproducing the scorer locally is so you don't burn deploy cycles. After every meaningful change:

```js
import TurndownService from "turndown";
const td = new TurndownService();

const html = await (await fetch("http://localhost:3000/")).text();

// Mintlify-style (strict)
const mintlify = td.turndown(html.replace(/<style[\s\S]*?<\/style>/g, ""));
console.log("Mintlify md:", mintlify.length, mintlify.length > 100000 ? "FAIL" : mintlify.length > 50000 ? "WARN" : "PASS");

// AFDocs-CLI-style (lenient)
const afdocs = td.turndown(html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, ""));
console.log("AFDocs CLI md:", afdocs.length);
```

To find which page is the offender, sweep the sitemap:
```js
const sitemapXml = await (await fetch(`${baseUrl}/sitemap.xml`)).text();
const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
for (const u of urls) { /* fetch + measure */ }
```

### 4. After deploy, trigger a rerun

- **AFDocs CLI**: just rerun.
- **Mintlify Agent Rank**: click the **"Rerun"** button on the detail page (`mintlify.com/score/<slug>`). The dashboard caches scoring results — without explicit rerun you'll see stale numbers for hours. If the user can't find the button, ask them to refresh the page; if still stale, tell them to wait or paste the Network response from DevTools so you can verify the deployed code is actually correct.

## The diagnostic categories (where things usually break)

These are the common failure modes regardless of stack. The user's specific implementation will vary; the patterns here are about *what to look for*.

### A. Inflated `page-size-html` (Mintlify-only or both)

Symptom: page-size-html FAIL or WARN with much larger numbers in Mintlify than in AFDocs CLI.

**Diagnose**: fetch the HTML, sort `<script>` blocks by size, look at the biggest ones. Common culprits:

- **Serialized hydration / SSR streaming data**: Next.js (`self.__next_f.push`), Nuxt (`__NUXT__`), Astro islands, Remix root state, etc. If you see kilobytes of object literals inside a script, that's it.
- **Inline JSON-LD** (`<script type="application/ld+json">`): each block is fully converted. SoftwareSourceCode + FAQ schemas can easily be 4-5K each.
- **Theme/init scripts**: usually small (~500 chars), but contribute to content-start position.

**Fix patterns** (find what applies to the user's stack):

- Reduce data flowing into hydration payload. Don't pass big arrays as props from server to client components — keep them in module-scope JS instead.
- For verbose third-party widgets (toasters, modals, analytics consoles) with big config objects: defer loading to client-only via dynamic import / lazy loading so their config doesn't end up in SSR HTML.
- For static long lists: render only the first chunk SSR, lazy-load the rest after hydration.
- See [`references/nextjs-gotchas.md`](references/nextjs-gotchas.md) for concrete Next.js patterns; the same principles apply to other frameworks.

### B. Bad `content-start-position`

Symptom: H1 or first paragraph appears too far into the converted markdown (over 10%).

**Diagnose**: convert HTML to markdown locally, look at the first ~5K characters. Whatever isn't your H1 is what's pushing it down.

**Fix patterns**:

- **JSON-LD blocks in `<head>` get converted to text and appear at the very top.** Move them to the end of `<body>`. SEO crawlers find JSON-LD anywhere; position only matters for HTML→markdown.
- **DOM order ≠ visual order.** If your `<header>` comes before `<main>` in HTML, its nav text gets counted before content. Decouple DOM from visual using CSS `order` on flex/grid children: keep `<main>` first in DOM, visually present `<header>` on top.
- **Long titles and verbose nav items**: a `<title>` like "Activity Icon - Animated React Component | Site" is 50+ chars before the H1 even starts. Trim where you can.
- **40-char rule**: AFDocs's algorithm skips lines under 40 chars or with link-density >50% as "nav". A header link like "[Star on GitHub (7,536 stars)](url)" is over 40 chars *and* mostly link, but might still count as content depending on how the heuristic ranks it. Shorten dynamic counters or remove them from SSR.

### C. Bad llms.txt structure or links

Symptom: `llms-txt-size`, `llms-txt-links-resolve`, or `llms-txt-links-markdown` failing.

**Common issues**:

- File too big (>50K chars) — split into a small root + nested index file.
- Broken links from placeholder URLs in code blocks: `https://site.com/r/{name}.json` gets parsed as a literal URL by some checkers. Use angle brackets: `<name>` (not parsed).
- Same-origin links pointing to HTML pages instead of `.md` variants.
- Stale URLs after content moved.

See [`references/llms-files.md`](references/llms-files.md) for full format rules.

### D. Markdown content gaps

Symptom: `markdown-content-parity` warning — the markdown response is missing sections that the HTML page has.

**Fix**: render the same content sections in your markdown route. If HTML shows a "Related" or "Similar" block, include it as a list in markdown too.

### E. Missing MCP server

Symptom: `mcp-server-discoverable` FAIL.

**Mintlify-hosted fix**: verify the deployed docs domain serves Mintlify's built-in `/mcp` endpoint. If the site is behind a reverse proxy, make sure `/mcp` is forwarded to Mintlify and not intercepted.

**Custom/headless fix**: implement a small JSON-RPC endpoint at `/mcp` that responds to `initialize` and `tools/list`. Just one or two useful tools is enough for the check. See [`references/mcp-server.md`](references/mcp-server.md).

### F. Content negotiation / .md URL support

Symptom: `content-negotiation` or `markdown-url-support` FAIL.

**Mintlify-hosted fix**: this is built in. If it fails, check that the URL is a published Mintlify page and that any reverse proxy forwards `.md` paths and `Accept` headers.

**Custom/headless fix**: serve markdown when `Accept: text/markdown` is sent, OR when `.md` is appended to any URL.

## Per-check quick reference

For full recipes see [`references/checks-cheatsheet.md`](references/checks-cheatsheet.md). Quick map:

| Failing check | First thing to try |
|---|---|
| `llms-txt-exists` | Add a `/llms.txt` route returning `text/plain` |
| `llms-txt-size` | If >50K, split into nested (root + nested category index) |
| `llms-txt-links-resolve` | HEAD-check every link; remove or fix 4xx/5xx; replace `{...}` placeholders with `<...>` |
| `llms-txt-links-markdown` | Replace HTML/JSON-page links with `.md` variants |
| `llms-txt-directive-html` | Add a link to `/llms.txt` somewhere in HTML (e.g., `sr-only` blockquote) |
| `llms-txt-directive-md` | For Mintlify-hosted docs, verify generated Markdown includes the documentation-index blockquote; for custom stacks, prepend `> [llms.txt](/llms.txt)` |
| `page-size-html` (Mintlify-only fail) | See category A above |
| `page-size-markdown` | A `text/plain` endpoint (often `llms-full.txt`) is too big — compress with templates |
| `content-start-position` | See category B above |
| `content-negotiation` | Mintlify-hosted: built in. Custom/headless: support `Accept: text/markdown` rewriting to `.md` route |
| `markdown-url-support` | Mintlify-hosted: built in. Custom/headless: append `.md` to any URL → returns markdown |
| `markdown-content-parity` | Markdown response must include same content sections as HTML |
| `mcp-server-discoverable` | Mintlify-hosted: verify built-in `/mcp`. Custom/headless: implement `/mcp` Streamable HTTP server |
| `cache-header-hygiene` | Mintlify-hosted: verify platform/proxy headers. Custom/headless: set `Cache-Control: max-age=...` (under 24h) |
| `auth-gate-detection` | Don't gate docs behind auth |

## Common pitfalls

- **Placeholder URLs in code blocks**: `npx install "https://example.com/r/{name}.json"` — link checkers parse `{name}` and fetch a literal `{name}.json` URL → 404. Use angle brackets: `<name>`.
- **Twitter/X external links**: bot-detected, often flagged as broken. Remove from llms.txt or leave with awareness that warnings are expected.
- **`/mcp` returns 406 on plain GET** by spec (requires `Accept: application/json, text/event-stream`) — don't put `[MCP](/mcp)` as a markdown link in llms.txt; reference it in prose with backticks.
- **Mintlify shows different numbers than CLI**: it's the `<script>` stripping difference — use Mintlify-style locally to repro.
- **The "100/100" sweet spot**: passing `page-size-html` requires the converted markdown to be **under 100K** (warn under 50K). On heavyweight stacks, getting under 100K is often enough; getting under 50K can require more aggressive trimming. WARN doesn't fail the category badly.

## See also

- [`references/checks-cheatsheet.md`](references/checks-cheatsheet.md) — every check with fix recipe
- [`references/nextjs-gotchas.md`](references/nextjs-gotchas.md) — Next.js App Router-specific patterns (only if user's site is Next.js)
- [`references/llms-files.md`](references/llms-files.md) — llms.txt, llms-full.txt, skill.md format rules and verified patterns
- [`references/mcp-server.md`](references/mcp-server.md) — minimal Streamable HTTP MCP server, with a Next.js example
- AFDocs spec: <https://agentdocsspec.com/spec/>
- AFDocs source: <https://github.com/agent-ecosystem/afdocs>
