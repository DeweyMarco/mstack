# GitBook Normalization

Use this reference for any GitBook-hosted site or any `.md` output containing `{% ... %}`, `<mark style="color:...">`, `<figure>`, `<table data-view="cards">`, or `<div data-gb-custom-block>`.

Apply these transforms before lifting content into Mintlify components:

1. Strip the GitBook agent-instructions footer: match `\n---\n# Agent Instructions[\s\S]*$` and delete to end of file.
2. Convert hint blocks `{% hint style="info|success|warning|danger" %}...{% endhint %}` to Mintlify callouts. Recommended mapping: `info -> <Info>`, `success -> <Tip>`, `warning -> <Warning>`, `danger -> <Warning>`.
3. Convert tab blocks `{% tabs %}{% tab title="X" %}...{% endtab %}{% endtabs %}` to `<Tabs><Tab title="X">...</Tab></Tabs>`. Escape double quotes in titles to single quotes.
4. Convert stepper blocks `{% stepper %}{% step %}...{% endstep %}{% endstepper %}` to `<Steps><Step title="...">...</Step></Steps>`. If a step lacks a title, derive one from the first heading or bolded line; otherwise use `Step N`.
5. Convert embed blocks `{% embed url="X" %}...{% endembed %}` to `[X](X)`.
6. Drop self-closing file blocks `{% file src="..." %}` or convert to a download link if `src` is a real URL.
7. For all `{% ... %}` regexes, tolerate URL-encoded `%` characters. Do not use `\{%\s*[^%]*%\}`; use non-greedy `\{%[\s\S]*?%\}`.
8. Strip leftover `{% ... %}` tags with the same non-greedy regex. Leftover GitBook fences crash MDX.
9. Handle GitBook custom-block HTML variants:
   - `<div data-gb-custom-block data-tag="hint" data-style="X" class="..."><p>...</p></div>` -> equivalent callout.
   - `<div data-gb-custom-block data-tag="tabs">...</div>` -> `{% tabs %}...{% endtabs %}`.
   - `<div data-gb-custom-block data-tag="tab" data-title='X'>...</div>` -> `{% tab title="X" %}...{% endtab %}`.
   - Then strip remaining `<div data-gb-custom-block ...>` openers and orphan `</div>` closers.
10. Convert `<mark style="color:blue;">...</mark>` to inner text only.
11. Convert `<figure><img src="..." alt="..."></figure>` to markdown image `![alt](src)`. Drop empty `<figcaption></figcaption>`.
12. For GitBook card tables, strip `data-view`, `data-hidden`, `data-card-target`, `data-type`, `data-size`, and `data-align` attributes. Converting to `<CardGroup>` is optional.
13. Self-close void HTML tags: `<br/>`, `<hr/>`, `<img ... />`.
14. Unescape GitBook backslash escapes before further processing: `\[`, `\]`, `\(`, `\)`, `\{`, `\}`, `` \` ``, `\_`, `\*`.

Common failures from skipped GitBook cleanup:

- `Unexpected closing tag </div>`
- `Unexpected closing slash "/" in tag`
- `Unexpected closing tag </div>, expected corresponding closing tag for <Tab>`
- Leftover `{% ... %}` fences that crash the MDX parser

## When the GitBook source repository is available

When the user provides the source GitBook repo (e.g. via a zip of the `.gitbook/` directory or a clone of the source repo), it closes the two biggest content-quality gaps that web-scrape pipelines hit: missing image assets and unexpanded `{% include %}` directives. Always ask whether a source repo is available before resigning to placeholder content.

### Image asset recovery

Web-scraping GitBook produces `/files/<id>` URLs that point at the GitBook CDN. Many of these eventually 404 (asset versioning, expired references), leaving `*[Image: ...]*` placeholders in the converted MDX. The source `.gitbook/assets/` directory has the originals.

Recovery pipeline:

1. Copy `.gitbook/assets/` (and any nested per-space asset directories) into the preview repo at `/images/`, preserving the directory structure so source-relative references resolve.
2. For each preview MDX, locate its source `.md` and rebuild the image references from the source's `![alt](path)` and `<figure>` blocks, wrapping each in `<Frame><img src="/images/..." alt="..." /></Frame>`.
3. Skip pages whose source lives in a different GitBook space than what the zip contains — flag them as `blocked` in the parity manifest with a `source not in provided assets` note rather than guessing.

### Expand `{% include %}` directives before counting images

GitBook's `{% include "../shared/foo.md" %}` directive pulls another source file's body inline at render time. Many include-hosted images appear nowhere in the host page's raw source, so a naïve scrape misses them entirely.

When walking source `.md` files to enumerate images per page, recursively inline `{% include %}` targets before extracting image references. The host page's image list should include everything the rendered page renders, regardless of which file the asset reference lives in.

### Cross-source page links

GitBook pages and assets reference each other by opaque IDs, not by slug. The converter must resolve every reference type to a Mintlify route:

| Pattern | Source | Resolution |
|---|---|---|
| `/files/<id>` | Inline image | Look up in `.gitbook/assets/` or the GitBook CDN, then rewrite to `/images/<filename>` |
| `/pages/<id>` | Same-space page link | Look up in a `site-index.json` built during the crawl (`{id → normalized_path}`) and rewrite to the Mintlify route |
| `/spaces/<id>/pages/<id>` | Cross-space page link | Same as above, but the page may live in a different space; if the space isn't in scope, mark the link `blocked` |

Build `site-index.json` (or equivalent ID-to-path map) as a side effect of the crawl, then run the link rewriter as a second pass — trying to resolve IDs on the fly during conversion produces flaky output.

### Vestigial GitBook header anchors

GitBook exports occasionally inject empty `<a id="..." href="#..."></a>` anchors above each heading. They render as invisible but trip `mint a11y`'s "anchor with no accessible name" check. Strip them in an audit pass:

```
rg -l '<a\s+id="[^"]+"\s+href="#[^"]+"></a>' -g '*.mdx'
```

Replace matches with empty string. No content is lost — Mintlify auto-generates heading anchors from the heading text.

## MDX-breaking source artifacts (not GitBook-specific, but very common)

These bite every conversion pipeline, not only GitBook. Catch them in the transformer rather than after `mint broken-links` complains.

### Image URLs containing `(`, `)`, or other markdown-significant characters

Markdown's `![alt](url)` parser breaks if the URL itself contains an unescaped `(` or `)` — most often from filenames like `Screenshot (1).png` or CDN paths with `(thumb)` suffixes. The parser truncates the URL at the first `)`, producing 404s on every affected image even though the source HTML renders them fine.

Fix in the transformer: when the URL contains `(`, `)`, `[`, `]`, or unescaped whitespace, emit an HTML `<img>` tag instead of markdown syntax:

```mdx
{/* BAD — link checker resolves only to `https://cdn.example.com/img` */}
![Diagram](https://cdn.example.com/img (1).png)

{/* GOOD — HTML tag tolerates parens */}
<img src="https://cdn.example.com/img (1).png" alt="Diagram" />
```

### macOS Screenshot filenames use U+202F (NARROW NO-BREAK SPACE)

The macOS Screenshot tool inserts U+202F (NARROW NO-BREAK SPACE) between the time and AM/PM in filenames (`Screenshot 2024-01-15 at 3.45.12 PM.png` — that's a narrow nbsp before `PM`). Browsers and OS file pickers treat U+202F and regular space (U+0020) interchangeably, but Mintlify's link checker resolves URLs with a regular space and reports the asset as broken.

Normalize in two places:

1. **Filenames on disk** — rename each file to replace U+202F with U+0020.
2. **MDX references** — search/replace U+202F in the URL portion of every image reference.

Detect with:

```bash
rg -l $'\u202f' -g '*.mdx'
```

### Empty table headers render as blank rows

Source HTML tables that use `|  |  |  |` for the header row (intentionally blank to use the first body row as visual headers) render in Mintlify as a literal blank header strip above the body. Either rebuild the table with real headers (preferred) or drop the header row entirely so the first body row becomes the header.

Common in transformation-filter / output-format docs and any API field reference scraped from a JS-rendered table widget.

### Oversized auto-generated reference pages

Data-source field references, API endpoint catalogs, and similar machine-emitted pages frequently exceed 200 KB each — the source rendering pipeline runs them through a custom field-explorer widget client-side, but a naïve HTML-to-MDX scrape inlines the entire JSON payload into the MDX.

Symptoms: `mint dev` build times balloon, `mint validate` warns on file size, and Mintlify's agent-score reports flag the pages as oversized.

Fix: write a per-source custom converter for these pages that emits clean Markdown tables (or a `<ResponseField>` cascade) from the underlying JSON metadata. A Salesforce fields page can go from 237 KB of inlined HTML to 101 KB of clean Markdown tables this way.
