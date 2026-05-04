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

## Parity Gate

Before finishing:

- `discovered_pages_count == converted_pages_count + explicitly_excluded_pages_count`
- Every discovered page is marked `done` or `blocked` in the parity manifest.
- Blocked pages include a concrete blocker reason and recommended next action.
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
