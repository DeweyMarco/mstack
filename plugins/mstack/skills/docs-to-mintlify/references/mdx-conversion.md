# MDX Conversion

## Scale Decision

If the corpus has more than about 50 pages, do not convert by hand. Write a deterministic transformer script that reads every file from `mirror/`, applies normalization rules, and writes `.mdx` files into the repo. Hand-editing 1000 pages will drift; a script you can re-run is the only reliable path.

Hand-editing is appropriate only for small sites or for a handful of files the script cannot reasonably handle.

## Page Conversion

For every page in the discovered inventory:

- Start from raw `.md` output if available; otherwise scrape rendered content.
- Add frontmatter: `title`, `description`, and optionally `sidebarTitle` or `icon`.
- Replace content patterns with Mintlify components where semantically equivalent:
  - Note boxes / warnings / tips -> `<Note>`, `<Warning>`, `<Tip>`, `<Info>`
  - Step-by-step instructions -> `<Steps>` with `<Step>` children
  - Grouped options or features -> `<CardGroup>` with `<Card>` children
  - Tabbed content -> `<Tabs>` with `<Tab>` children
  - Collapsible sections -> `<Accordion>` / `<AccordionGroup>`
  - Code samples -> fenced code blocks with language plus optional `filename` and `expandable`
  - Parameter/property lists -> `<ParamField>` or `<ResponseField>` in API contexts
  - Inline definitions -> `<Tooltip>`
- Preserve all text content exactly. Do not summarize.
- Do not add any mention of "clone", "preview", or "migration" in page content.

## Frontmatter Extraction

- Title: take the first `# H1` line of raw markdown, then remove that H1 from the body so it is not rendered twice. Fall back to a title-cased path segment if no H1 exists.
- `sidebarTitle`: if you used Tier 1 nav extraction (Nuxt `_payload.json.navigation`, Docusaurus sidebar labels, GitBook `SUMMARY.md` link text, etc.), the source nav already carries a per-page short label. Compare it against the extracted H1:
  - If the nav label **equals** the H1, omit `sidebarTitle` — `title` covers both rendered heading and sidebar entry.
  - If the nav label is **shorter** than the H1 (the common case — marketing-style H1 like `Welcome to <Product> Developer Documentation!` paired with a terse sidebar entry like `Welcome`), write both: `title:` keeps the full H1, `sidebarTitle:` keeps the short nav label.
  - If the nav label is **longer** than the H1, the script almost certainly grabbed the wrong source (page `<title>`, breadcrumb, or `og:title` instead of sidebar text). Fix the extraction — do not paper over it with `sidebarTitle`.
  - **Why this matters:** Mintlify's sidebar is typically ~240px wide. A 40-character marketing H1 wraps or ellipsizes there next to four-character siblings — it looks broken. The source site already solves this with a short sidebar label; preserve that distinction.
  - This rule only fires when Tier 1 nav extraction is in use. The Tier 2 directory-walk fallback has no sidebar label to compare against, so `title` carries both roles by default.
- Description: pick the first substantive paragraph in the body. Skip headings, code fences, table rows, list items, and pure HTML/image blocks.
- Before writing description YAML, strip all markdown/HTML syntax:
  - Markdown links `[text](url)` -> `text`
  - Images `![alt](url)` -> remove
  - Inline code/bold/italic markers -> strip
  - HTML tags `<...>` -> strip
  - Collapse whitespace and trim to about 200 characters
  - Replace smart quotes so YAML does not choke
- Wrap `title:`, `sidebarTitle:`, and `description:` values in double quotes and replace embedded `"` with `'`.

## MDX Syntax Safety

- Keep frontmatter values plain text. Never put JSX/HTML tags in frontmatter fields.
- Pair and scope callouts correctly: `<Info>...</Info>`, `<Warning>...</Warning>`, `<Tip>...</Tip>`, `<Note>...</Note>`.
- Prefer whole-block transforms over piecemeal tag insertion. If source structure is ambiguous, leave it as plain markdown instead of risking broken JSX.
- Do not close a callout before its intended content ends.
- Keep fenced code blocks balanced.
- Do not leave raw JSON, shell, or language samples outside fences where MDX can parse them as JSX.
- For JSX props containing quotes, prefer single-quoted prop values: `<Step title='Click "Create API Key" in Settings'>`.
- Avoid backslash-escaped quotes inside JSX attributes.
- Never emit standalone closing tags at the top of a page.

## Acorn / MDX Parser Gotchas

MDX parses every non-fenced line through acorn. Normalize these patterns:

- Angle-bracket URL autolinks like `<https://example.com>`: replace with the bare URL.
- Bare `<` as text, such as `use < for less than`, `<= v1.28`, or `**<**`: escape to `&lt;` unless it starts a real JSX/HTML tag.
- Pseudo-tags like `<image:product_001.jpg>`: escape the `<`.
- `{ ... }` in prose: escape braces outside code fences, especially inside markdown tables and `<td>` / `<th>` content.
- Internal links ending in `.md` or `.mdx`: strip the extension while preserving fragments and queries.
- Orphan `</div>` or unhandled `<div data-gb-custom-block ...>`: strip after GitBook normalization.

When acorn reports `line:col - Could not parse expression with acorn` or `Unexpected closing tag`, open the exact file and line first.

## Rewrite Relative Links to Root-Absolute Paths

After all content transforms, rewrite internal links in this order:

1. Match markdown links `[text](target)` but not images, and HTML `<a href="target">`.
2. Skip targets starting with `http://`, `https://`, `mailto:`, `tel:`, `/`, or `#`.
3. Split off any `#fragment` or `?query` suffix and preserve it.
4. Strip trailing `.md` or `.mdx`.
5. Join the remaining path against the current file's directory and normalize. If the result escapes the repo root, leave the original target.
6. Prepend a leading `/` and write back.

Run `mint broken-links` after this pass.
