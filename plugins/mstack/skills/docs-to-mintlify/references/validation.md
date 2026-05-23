# Validation and Quality Gates

## Parser Validation

Use `mint broken-links` as the primary headless validator. It surfaces both MDX parse errors and unresolved internal links without waiting for `mint dev`.

Validation loop:

1. Re-run the transformer on the full corpus, or convert a small hand batch.
2. Run `mint broken-links` and inspect output for `parsing error`.
3. Fix every MDX parse error immediately, usually by adjusting a transformer rule.
4. Re-run until `parsing error` count is zero.
5. Continue to navigation and final `mint dev` verification only after parser errors are gone.

Treat these parser errors as blockers:

- `Expected a closing tag for <Warning>`
- `Unexpected character "\" in attribute name`
- `Unexpected closing slash "/" in tag`
- `Could not parse expression with acorn`
- `Unexpected closing tag </div>, expected corresponding closing tag for <Tab>`

If one file in a batch fails parsing, stop converting new pages and repair that file or the transformer first. Always inspect the exact file and line named in parser output.

## macOS Copy Artifact Check

After copying transformer output into the repo with `cp -R`, list the tree for files matching `* 2.mdx` or `* 2/`. Delete duplicated artifacts before parity checks.

## Quality Check

- Compare live source pages against converted MDX.
- Every section, heading, paragraph, list, code block, and table must be present.
- Use Mintlify components wherever the original has an equivalent pattern.
- Navigation order in `docs.json` must match the live site sidebar.
- No broken internal links; update hrefs to match new file paths.
- Run `mint dev` or `mint validate` after `mint broken-links` is parser-clean.

## Port-Artifact Sweep (mandatory for HTML-scraped sources)

`mint validate` and `mint broken-links` only catch parser-level breakage. They do **not** catch content that parses fine but renders as visibly broken cards, steps, code blocks, or admonitions — the nine "port-artifact" patterns documented in [mdx-conversion.md → Port-artifact patterns to detect and fix in the transformer](mdx-conversion.md).

Before declaring the conversion complete, run a sweep for every pattern and confirm zero hits. The session that produced this skill shipped 1,914 pages with all parser gates clean and then discovered 400+ pages of broken rendering — `/preview-qa` and four agent sweeps later, the cleanup was still not complete. Catch it here, not after.

Sweep commands (run from repo root):

```bash
# Pattern A — broken-card link smash (multi-line)
python3 -c "import re,glob; [print(f) for f in glob.glob('**/*.mdx', recursive=True) if re.search(r'\[\s*[\U0001F000-\U0001FFFF☀-➿][^\]]*?####[^\]]*?\]\([^)]+\)', open(f).read(), re.DOTALL)]"

# Pattern B — inline emoji card
grep -rlE '\[[^a-zA-Z0-9 ]+[A-Z][^]]+\]\([^)]+\)' --include='*.mdx' .

# Pattern C — broken Steps (link-wrapped numbers)
python3 -c "import re,glob; [print(f) for f in glob.glob('**/*.mdx', recursive=True) if re.search(r'\[\s*\d+\s*\n\s*\n\s*###[^\]]+\]\([^)]+\)', open(f).read(), re.DOTALL)]"

# Pattern D — orphan emoji + heading + body (no bracket anchor)
python3 -c "import re,glob; [print(f) for f in glob.glob('**/*.mdx', recursive=True) if re.search(r'^[\U0001F000-\U0001FFFF☀-➿]\s*\n\s*\n####\s', open(f).read(), re.MULTILINE)]"

# Pattern E — prism-code fences
grep -rl '```prism-code' --include='*.mdx' .

# Pattern F — Docusaurus admonitions in frontmatter
grep -rlE '^description:\s*"?:::' --include='*.mdx' .

# Pattern G — HTML escape leakage in prose
grep -rl '&lt;\|&gt;' --include='*.mdx' . | xargs -I{} grep -L '```' {} 2>/dev/null

# Pattern H — orphan --- rules
python3 -c "import re,glob; [print(f) for f in glob.glob('**/*.mdx', recursive=True) if re.search(r'^---\s*\n\s*\n---', open(f).read(), re.MULTILINE)]"

# Pattern J — source chrome leakage
grep -rlE '^(Copy page|Edit on GitHub|Was this helpful)' --include='*.mdx' .
```

Pattern I (whole-page link-smash) cannot be reliably grepped — surface it by sampling 10–20 index-style pages (`overview.mdx`, `index.mdx`, `all-*.mdx`) and reading the first paragraph in `mint dev`.

Every sweep must return zero results before parity gate. If any returns hits, fix the transformer rule (not the file output) and re-run the full conversion.

## Parity Gate

Before finishing:

- `discovered_pages_count == converted_pages_count + explicitly_excluded_pages_count`
- Every discovered page is marked `done`, `blocked`, or `excluded` in the parity manifest.
- Blocked and excluded pages include a concrete reason; blocked pages also include a recommended next action.
- Re-run link crawl on converted docs to ensure no orphaned in-scope source pages were skipped.
- Every `.mdx` file created during conversion appears in the `docs.json` navigation tree.
- There are no dangling references in `docs.json`.
- `docs.json` includes root-level `contextual` config.
- If the site has API docs, every OpenAPI spec in `openapi/` is referenced from `docs.json` via `openapi`, root-level `api` config is present, and every `api-reference/*.mdx` file exists in navigation.

## Key Rules

- Crawl exhaustively; do not rely on top-level navigation only.
- Expand sitemap indexes by fetching every nested sitemap.
- For GitBook sources, mirror raw files first, validate none are HTML, and strip GitBook footers before converting.
- For large corpora, use a deterministic transformer.
- Normalize MDX acorn traps before validation.
- Rewrite internal links to root-absolute `/path` form.
- Never mention "clone", "preview", or "migration" in page content or filenames.
- Do not invent content. Every word must come from the source site.
- A conversion is not complete until the repo is parser-clean in Mintlify.
