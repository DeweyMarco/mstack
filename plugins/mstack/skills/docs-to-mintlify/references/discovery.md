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

Track discovery in a parity manifest table with: `source_url`, `normalized_path`, `nav_section`, `status` (`todo|done|blocked`), and `notes`.

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

Expect some URLs to 404 or return HTML; re-fetch those with an alternate strategy before converting.
