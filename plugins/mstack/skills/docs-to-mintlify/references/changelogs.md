# Changelogs

Read this whenever the source site has a changelog, release-notes, or "What's new" section — a dated stream of entries, each at its own URL. ReadMe.com `/changelog/*` sections are the canonical case; GitBook release-notes spaces and blog-style update feeds follow the same rules.

## One page, native `<Update>` timeline — never one page per entry

Mintlify's canonical changelog is a **single MDX page** composed of `<Update>` blocks, sorted newest-first. Do not emit one `.mdx` file per source entry — a 40-page changelog folder in the sidebar reads as a migration artifact, and reviewers flag it as "not the actual Mintlify changelog format" every time.

Target shape (`changelog.mdx` at the repo root, or wherever the nav slot lives):

```mdx
---
title: "Changelog"
rss: true
---

{/* source: /changelog/new-endpoints-for-company-location-details */}
<Update label="September 8, 2025" description="New Endpoints for Company Location Details" tags={["Added", "Public API"]}>
  ...entry body, converted like any other page...
</Update>
```

Rules:

- **Newest first.** Sort by publish date descending.
- **`rss: true`** in the frontmatter — Mintlify auto-generates an RSS feed at `<page-path>/rss.xml` for subscribers.
- **`label` carries the date, `description` carries the entry title.** Mintlify renders the label in the left timeline rail and as the anchor.
- **`tags` render Mintlify's tag-filter UI** in the sidebar. Lead each entry's tags with the source's entry-type chip when one exists (ReadMe renders Added / Fixed / Improved / Deprecated above each title), then add topic tags derived from the entry's slug + title. Tags are what make a long timeline navigable.
- **Keep a `{/* source: /changelog/<slug> */}` comment above each `<Update>`** so per-entry parity stays auditable against the manifest.

## URL parity via redirects

Every source entry had its own URL. Preserve them with `docs.json` `redirects` from each `/changelog/<slug>` to the consolidated page:

```json
"redirects": [
  { "source": "/changelog/new-endpoints-for-company-location-details", "destination": "/changelog", "permanent": true }
]
```

Verify with `curl -I` on a few old entry URLs against `mint dev` — expect a redirect status pointing at the consolidated page. Also repoint in-repo links (`index.mdx` cards, `llms.txt`, cross-references) directly at the consolidated page rather than relying on the redirects.

The source's changelog *listing* page (e.g. `/changelog` on ReadMe) usually has no fetchable `.md` endpoint — the consolidated Mintlify page **is** its replacement; mark it accordingly in the parity manifest rather than treating it as a gap.

## Publish dates: never trust sitemap `<lastmod>`

Hosted platforms rewrite `<lastmod>` on every bulk re-index — ReadMe does this on all pages at once — so sitemap timestamps cluster around a handful of recent re-index dates instead of spanning the real publish history. A changelog built from `lastmod` shows two years of entries "published" in the same three weeks. This is the single most common changelog-date defect.

Get the real publish date from the entry page itself:

- **ReadMe:** each entry page embeds its document state as JSON containing `"created_at"` (the publish timestamp) and `"type"` (`added` / `fixed` / `improved` / ...). Scrape both for every entry and cache them (e.g. `scripts/_sitemap-cache/changelog-metadata.json`) so re-runs don't re-fetch.
- **Other platforms:** prefer an embedded created/published timestamp; fall back to the date rendered on the entry page; use `lastmod` only as a last resort and flag it in the parity manifest `notes`.

Sanity gate before shipping: the oldest and newest labels on the built timeline must match the oldest and newest entries on the source's rendered changelog. If more than ~30% of entries share the same week, you are looking at re-index timestamps, not publish dates — go back and scrape.

## `<Update label>` uniqueness and same-day collisions

Mintlify requires every `<Update label>` on a page to be unique — the label doubles as the anchor id. When two entries share a publish date:

- Suffix **both** entries of the colliding pair with the entry's time-of-day: `September 8, 2025 · 4:28 PM` / `September 8, 2025 · 4:18 PM`. Applying the suffix to only the second entry looks inconsistent.
- Never disambiguate with the source slug in parentheses (`September 8, 2025 (new-endpoints-for-...)`) — it leaks internal identifiers into visible chrome.
- Entries with a unique date keep the plain `Month D, YYYY` label, matching Mintlify's own changelog.

## Reproducible build

For more than ~15 entries, generate `changelog.mdx` with a script (e.g. `scripts/build_changelog.py`) that reads the mirrored entry bodies plus the cached date/type metadata and emits the full timeline. Re-run the script after rule fixes instead of hand-patching the output — same policy as the main transformer.

If the corpus-wide transformer also regenerates pages, make sure it **does not re-emit the individual per-entry `.mdx` files** the consolidated page replaced. A transformer re-run that resurrects 43 orphan changelog pages is a silent regression; add the changelog directory to the transformer's skip list.
