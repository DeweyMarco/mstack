# Discovery and Mirroring

## Exhaustive Crawl

Build a canonical URL inventory before writing any MDX files. Discovery must include:

- Sitemap: check `[DOCS_SITE_URL]/sitemap.xml` and recursively fetch every nested sitemap. A `sitemap.xml` whose root element is `<sitemapindex>` lists sub-sitemaps; fetch each child `<sitemap><loc>...</loc></sitemap>` and merge its `<url><loc>...</loc></url>` entries. Do not treat the index file itself as the URL list.
- Navigation UI: header tabs, sidebar groups, footer links, and related pages.
- In-page links: recursively follow internal docs links until no new docs URLs are found.
- Version/language variants, if present.
- Programmatic artifacts: `llms.txt`, docs index JSON, or route manifests.

Crawl depth rule: keep traversing internal docs links until two consecutive passes discover zero new in-scope docs pages.

Normalize discovered URLs by removing hash fragments, canonicalizing trailing slash behavior, and deduping query-only variants unless they represent distinct content.

Track discovery in a parity manifest table with: `source_url`, `normalized_path`, `nav_section`, `status` (`todo|done|blocked|stale`), and `notes`. Use `stale` for sitemap entries that 404 on every endpoint pattern (the page was removed but the sitemap was never updated) — these are excluded from both fetch and the final `docs.json` parity check, not blockers.

Do not stop at the first-level sidebar; deep nested and cross-linked pages are required.

## Raw Markdown Fetch Gotchas

Append `.md` to page URLs to get raw markdown where possible, but always verify rendered content for missing sections/components.

Before converting anything, download the full corpus into a `mirror/` staging directory, one `.md` per URL. Validate each fetch:

- If any downloaded file starts with `<!DOCTYPE html>` or `<html`, the `.md` endpoint served rendered HTML instead of raw markdown. Re-fetch from an alternate endpoint or scrape rendered HTML.
- Common GitBook issue: the bare space root, such as `https://docs.example.com/product`, often does not respond to `.md`. Use `readme.md` at the root, such as `https://docs.example.com/product/readme.md`, or the explicit root page slug. Spot-check `curl -sS <root>.md | head -3` before assuming the pattern works uniformly.
- Many platforms append a machine-readable footer to `.md` output, such as GitBook's `---\n# Agent Instructions: Querying This Documentation\n...`. Strip this footer from every file before converting.

For sites with more than 50 pages, fetch in parallel. Example pattern:

```bash
cat all-urls.txt | xargs -P 20 -I {} bash -c 'curl -sS --max-time 30 -o "mirror/$(echo {} | sed s#https://docs.example.com/##).md" "{}.md"'
```

Expect some URLs to 404 or return HTML. Distinguish two cases before moving on:

- **Wrong endpoint pattern.** The page exists but `.md` (or `_payload.json` on Nuxt sites) doesn't resolve for it — usually a root/landing slug or a special section index. Try the alternate strategies above (`readme.md`, explicit slug, scrape rendered HTML) and re-fetch.
- **Stale sitemap entry.** The URL 404s on **every** endpoint pattern you try. The sitemap claims the page exists but it really doesn't — common on any auto-generated sitemap that doesn't trigger on content removal (Nuxt, Docusaurus, GitBook, custom Next.js sites all do this). Mark `status: stale` in the parity manifest, exclude from `mirror/`, and exclude from the final `docs.json` parity check. Do not let stale entries block the migration. A small percentage is normal — the Pathway migration had 22/289.

## Nuxt Content Sites

Nuxt-based docs (Nuxt Content module) expose a structured AST per page that converts far more reliably than scraped HTML. Recognize these sites by:

- `<div id="__nuxt">` in the rendered HTML and a `window.__NUXT__` global
- A `/_payload.json` endpoint at every page URL (e.g. `[PAGE_URL]/_payload.json`) that returns JSON, not 404
- `/_nuxt/...` static assets in the network tab

When those signals are present, prefer `_payload.json` over the rendered HTML or any `.md` endpoint:

- Each payload contains the page body as a structured AST (Nuxt Content's "minimark" format — `{ type, tag, props, children }` nodes). A deterministic transformer over this tree produces cleaner MDX than HTML scraping, with no risk of dropped sections from rendering quirks.
- Each payload also embeds the **site-wide navigation tree** (typically under a `navigation` or `body.navigation` key). Use this tree to drive `docs.json` generation — it mirrors the live sidebar exactly and is more reliable than directory inference (see Tier 1 nav extraction in `docs-json.md`).
- Spot-check before committing: `curl -sS <PAGE_URL>/_payload.json | python3 -m json.tool | head -60` should show structured nodes (`"type": "element"`, `"tag": "h1"`, etc.), not HTML.

Fetch recipe for the full corpus:

```bash
cat all-urls.txt | xargs -P 20 -I {} bash -c 'curl -sS --max-time 30 -o "mirror/$(echo {} | sed s#https://docs.example.com/##).json" "{}/_payload.json"'
```

Gotchas specific to Nuxt sites:

- **Stale sitemap entries are common on Nuxt.** Nuxt's sitemap module doesn't always trigger on content removal, so expect a small percentage of dead entries (the Pathway migration hit 22/289). See the general stale-entry policy above — mark `status: stale` and move on.
- **Build the tag map before writing the transformer.** Minimark ASTs use site-specific custom tags for callouts, alerts, figures, and prose blocks (e.g. `pw-info`, `prose-warning`, custom `<MyAlert>` components registered in the source repo). Grep every payload for unique `tag` values first, then map each one explicitly to a Mintlify component or a fallback. Any unmapped tag silently passes through as raw text.
- **Pick one canonical URL form.** `pathway.com/foo` and `pathway.com/foo/` may both 200, but typically only one serves `/_payload.json`. Decide trailing-slash policy during URL inventory and apply it everywhere — mixed forms will create duplicate `mirror/` files and ghost entries in the parity check.
- **Some Nuxt setups serve `_payload.js` (executable) instead of `_payload.json`.** If the JSON endpoint 404s site-wide but you still see `<div id="__nuxt">`, check for `.js` and parse the embedded payload with a small Node helper. This is rarer in modern Nuxt 3 with payload extraction enabled, but worth a 30-second check before falling back to HTML.
