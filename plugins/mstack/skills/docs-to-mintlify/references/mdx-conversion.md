# MDX Conversion

## Scale Decision

If the corpus has more than about 50 pages, do not convert by hand. Write a deterministic transformer script that reads every file from `mirror/`, applies normalization rules, and writes `.mdx` files into the repo. Hand-editing 1000 pages will drift; a script you can re-run is the only reliable path.

Hand-editing is appropriate only for small sites or for a handful of files the script cannot reasonably handle.

## Page Conversion

For every page in the discovered inventory:

- Start from raw `.md` output if available; otherwise scrape rendered content.
- Add source-backed frontmatter: `title`, plus `description` only when the source renders matching lead text; add `sidebarTitle` or `icon` only when the source navigation supplies them.
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
- Description: **only set `description` if the source page has explicit subtitle / lead text directly under the page title** (a `<p class="lead">`, an `og:description`-style standfirst rendered above the body, or similar). In Mintlify, `description` is **not** pure metadata — it renders as a visible subtitle directly below the page H1, *and* it populates `<meta name="description">` for SEO. Synthesizing one from the body produces visible content the source does not have.
  - Source has subtitle text -> copy that text **verbatim** into `description`.
  - Source has no subtitle text -> **omit `description` entirely**. Do not fall back to "first paragraph", do not paraphrase the title, do not use a generic `Welcome to the <Product> developer hub`-style filler. An empty/missing `description` is correct when the source has none. SEO `<meta description>` will still be acceptable; matching the source's rendered page chrome takes priority over SEO completeness here.
  - The script must not invent description text. If you cannot extract a subtitle deterministically, leave the field out and let `/preview-qa` Gate 2 confirm the omission against the source.
- If the source does have subtitle text, before writing description YAML, strip all markdown/HTML syntax:
  - Markdown links `[text](url)` -> `text`
  - Images `![alt](url)` -> remove
  - Inline code/bold/italic markers -> strip
  - HTML tags `<...>` -> strip
  - Collapse whitespace and trim to about 200 characters
  - Replace smart quotes so YAML does not choke
- Wrap `title:`, `sidebarTitle:`, and `description:` values in double quotes and replace embedded `"` with `'`.
- **Never fabricate any frontmatter value.** Every frontmatter field in Mintlify has a visible side effect — `title` renders as the page H1 and browser tab, `sidebarTitle` renders in the sidebar, `description` renders as the subtitle under the H1, `icon` renders next to the sidebar entry. Treating frontmatter as out-of-band metadata is the single most common source of "the preview shows text the source doesn't" defects. Copy from source or omit; never generate.

## MDX Syntax Safety

- Keep frontmatter values plain text. Never put JSX/HTML tags in frontmatter fields.
- Pair and scope callouts correctly: `<Info>...</Info>`, `<Warning>...</Warning>`, `<Tip>...</Tip>`, `<Note>...</Note>`.
- Prefer whole-block transforms over piecemeal tag insertion. If source structure is ambiguous, leave it as plain markdown instead of risking broken JSX.
- Generated transformers must preserve block boundaries. Never emit a fenced code block or Mintlify component opening/closing tag on the same line as prose, a list item, or another component tag. Normalize these invalid forms before writing files:
  - `1. Do this. <Info>` -> list item line, blank line, `<Info>` on its own line.
  - `Text before ``` ...` -> text line, blank line, fenced block on its own lines.
  - `</Note> The next sentence` -> `</Note>` on its own line, blank line, next sentence.
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

## Port-artifact patterns to detect and fix in the transformer

When porting from sites that render Cards / Steps / CardGroups as composed widgets (Docusaurus, Nuxt Content, GitBook, in-house React docs), naive HTML-to-markdown extraction collapses each widget into one of nine recurring artifacts. Every one validates as "Markdown" and passes `mint validate` but renders as visibly broken content. The transformer must detect and rewrite all nine **before** writing MDX, otherwise the cleanup falls onto `/preview-qa` and the agent has to sweep thousands of pages after the fact.

Each pattern below has a detection regex (run against `mirror/` files) and the corrected MDX output.

### Pattern A — broken-card link smash (multi-line)

Source widget: a Card with an emoji/icon header, a heading, and body copy.

```
[💬

#### Conversational search

Ask questions in plain language and get direct answers from your catalog.](/path/to/page)
```

Detection (Python): files containing `re.search(r'\[\s*[\U0001F000-\U0001FFFF☀-➿][^\]]*?####[^\]]*?\]\([^)]+\)', content, re.DOTALL)`.

Corrected output: a `<Card>` inside a `<CardGroup>` or `<Columns>`. Map the emoji to a Font Awesome Free icon (see emoji map below).

```mdx
<Card title="Conversational search" icon="comments" href="/path/to/page">
  Ask questions in plain language and get direct answers from your catalog.
</Card>
```

### Pattern B — inline emoji card

Source widget: a compact card link with an emoji glued to the label.

```
[📋Sample apps](/path/to/sample-apps)
```

Detection: `re.search(r'\[[\U0001F000-\U0001FFFF☀-➿]+[A-Z][^\]]+\]\([^)]+\)', content)`.

Corrected output: a single-line `<Card>` with the emoji promoted to `icon=`.

```mdx
<Card title="Sample apps" icon="clipboard" href="/path/to/sample-apps" />
```

### Pattern C — broken Steps (link-wrapped numbers)

Source widget: a numbered Steps list rendered with each step as a clickable card.

```
[1

### Understand the framework

Learn about the Apps Framework, its capabilities, and core architectural concepts.](/path/to/apps-framework)
→
[2

### Application architecture

...](/path/to/application-architecture)
```

Detection: `re.search(r'\[\s*\d+\s*\n\s*\n\s*###[^\]]+\]\([^)]+\)', content, re.DOTALL)`.

Corrected output: a `<Steps>` block where the link becomes a trailing `[Title →](url)` inside each `<Step>` body.

```mdx
<Steps>
  <Step title="Understand the framework">
    Learn about the Apps Framework, its capabilities, and core architectural concepts.

    [Apps Framework →](/path/to/apps-framework)
  </Step>
</Steps>
```

### Pattern D — orphan emoji + heading + body (no link wrapper)

The hardest pattern to catch because there are **no brackets** to grep for. Naive scrapers split a Card widget into three loose lines and emit them as a paragraph + H4 + paragraph.

```
📝

#### Generate descriptions

AI analyzes table names, lineage, and query patterns to write business-meaningful descriptions.

📄

#### Generate READMEs

Produce higher-level documentation for tables, datasets, and BI assets.
```

Detection: `re.search(r'^[\U0001F000-\U0001FFFF☀-➿]\s*\n\s*\n####\s', content, re.MULTILINE)`.

Corrected output: collect every consecutive `emoji \n\n #### Title \n\n body` triple into a `<CardGroup cols={2}>` with the headings promoted to `<Card title=>` and the emoji mapped to `icon=`.

The original sweep in the session missed Pattern D for an hour because the agent only searched for lines starting with `[`. Always test the detection regex on a known Pattern D file before declaring the sweep complete.

### Pattern E — `prism-code` fenced blocks

Some doc engines (Docusaurus + the `prism-react-renderer` plugin in particular) emit code blocks as ` ```prism-code ` fences instead of a language-tagged fence. Mintlify treats `prism-code` as a literal language and disables syntax highlighting.

```
​```prism-code
import json
from pyatlan.client.atlan import AtlanClient
​```
```

Detection: `grep -l '```prism-code' mirror/`.

Corrected output: detect the language by content (`import ` → python, `SELECT ` → sql, `{` opener → json, `$` line prefix → bash, etc.) and rewrite to a proper fence. In the session this affected **474 files** across `python`, `text`, `json`, `sql`, `bash`, and `yaml`. Build the language-detector once and apply it across the whole corpus — do not hand-fix per file.

### Pattern F — Docusaurus admonition leakage in frontmatter

Source `description:` frontmatter occasionally inherits the `:::warning` / `:::note` prefix from the page body.

```yaml
---
title: Connect Snowflake
description: ":::warning  This connector requires the SECURITYADMIN role."
---
```

Detection: `grep -lE '^description:\s*"?:::' mirror/`.

Corrected output: strip the `:::warning` (or `:::note` / `:::tip` / `:::info` / `:::caution`) prefix and any leading whitespace from `description:`. The body admonition should also be rewritten to `<Warning>` / `<Note>` / `<Tip>` / `<Info>` per the standard component mapping.

### Pattern G — HTML escape leakage in prose

Angle brackets in placeholder strings (`<bucket-name>`, `<epoch>`, `<10%`) leak into prose either as raw `<...>` (which acorn parses as JSX) or as the HTML-encoded `&lt;...&gt;` (which renders as literal text).

```
The qualifiedName should follow the pattern: default/s3/<epoch>/<bucket-name>/<prefix>/<name>,
```

Detection: search outside code fences for `<[a-z-]+>` (probable JSX) or `&lt;[a-zA-Z0-9-]+&gt;` (already-escaped).

Corrected output: wrap each placeholder in inline backticks: ``default/s3/`<epoch>`/`<bucket-name>`/`<prefix>`/`<name>`,``. **Do not** add nested backticks around a placeholder that already sits inside a wider backticked region — the session shipped four broken files this way before the fix.

### Pattern H — orphan `---` horizontal rules

Some scrapers emit `---` separators around removed widgets, leaving stacks of bare rules with nothing between them.

```
## Connector overview

---

---

- [Set up the connector](/path)
```

Detection: `re.search(r'^---\s*\n\s*\n---', content, re.MULTILINE)`.

Corrected output: collapse consecutive `---` blocks into a single rule, or drop entirely if the surrounding sections do not need separation.

### Pattern I — link-smash (entire page collapsed into one link)

Worst case: an index page where every card was wrapped in a single outer link. The whole page renders as one giant clickable blob.

```
[📊 Salesforce  CRM 📊 Snowflake  Data Warehouse 📊 Looker  BI ...](/path/to/all-apps)
```

Detection: a page where the entire body (or a very long prefix) is a single `[...](...)`.

Corrected output: parse out each emoji + title + category triple and rebuild as a `<CardGroup cols={2}>` with one `<Card>` per source entry. In the session this affected one file (`apps/packages/references/all-apps.mdx`, 43 cards) and required hand-rebuilding.

### Pattern J — source navbar / footer leakage

Boilerplate from the source's chrome ("Copy page", "Edit on GitHub", "Was this helpful?", a `> ` blockquote with the page URL) leaks into the converted body.

Detection: `grep -lE '^(Copy page|Edit on GitHub|Was this helpful)' mirror/`.

Corrected output: strip these lines during the scrape, not after. If they only appear on some pages, add them to the boilerplate-strip pass in the transformer.

## Emoji → Font Awesome Free icon map

Patterns A, B, and D depend on a stable emoji → icon mapping. Mintlify's default library is Font Awesome Free; Lucide names silently render as blank slots. Use this map (extend as needed for the source's emoji vocabulary):

| Emoji | Font Awesome Free name | Common use |
|---|---|---|
| 💬 | `comments` | conversation / chat / AI search |
| 🤖 | `robot` | AI / agent / automation |
| 🔍 | `magnifying-glass` | search / discovery |
| 📊 | `chart-column` | analytics / metrics / coverage |
| 🧪 | `flask` | experiments / testing |
| 📝 | `note-sticky` | notes / descriptions |
| 📄 | `file-lines` | documents / READMEs |
| 📋 | `clipboard` | sample apps / templates |
| 🔗 | `link` | integrations / connections |
| 🛡️ | `shield-halved` | governance / security |
| 🧠 | `brain` | AI / intelligence |
| ⚡ | `bolt` | real-time / alerts |
| 🌐 | `globe` | embedded / web |
| 🚀 | `rocket` | get-started / quickstart |
| 🔌 | `plug` | connectors |
| 🔧 | `wrench` | configuration / setup |
| ❓ | `circle-question` | FAQ / help |
| ⚙️ | `gear` | settings / configuration |
| 🤝 | `handshake` | partners / collaboration |

When in doubt, search `https://fontawesome.com/search?o=r&m=free` and pick the closest free icon. Never invent an icon name — Mintlify shows a blank slot on unknown names.

## Validation pass after detection

After running the nine detectors, the transformer should:

1. Emit a report listing each pattern with affected file counts.
2. Refuse to write any MDX until every detected pattern has either been rewritten or explicitly waived (with a written reason in the report).
3. Re-run `mint validate` *and* a structural diff sample of 5–10 random pages against their source URLs (see `/preview-qa` Gate 2) before handing off.

The pre-MDX detectors take minutes; an after-the-fact agent sweep across thousands of pages takes hours and tends to miss patterns that have no bracket anchor (Pattern D was missed twice in one session).

## Rewrite Relative Links to Root-Absolute Paths

After all content transforms, rewrite internal links in this order:

1. Match markdown links `[text](target)` but not images, and HTML `<a href="target">`.
2. Skip targets starting with `http://`, `https://`, `mailto:`, `tel:`, `/`, or `#`.
3. Split off any `#fragment` or `?query` suffix and preserve it.
4. Strip trailing `.md` or `.mdx`.
5. Join the remaining path against the current file's directory and normalize. If the result escapes the repo root, leave the original target.
6. Prepend a leading `/` and write back.

Run `mint broken-links` after this pass.
