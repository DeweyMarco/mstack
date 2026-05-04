---
name: improve-agent-score
description: Improve the agent-readability score of a Mintlify docs site using the afdocs CLI. Use when the user mentions agent score, afdocs, improving AI readability of docs, or asks to improve how well agents can read/parse the docs site.
---

# Improve Agent Score

Raise the [afdocs](https://afdocs.dev) agent-readability score of the docs site. **You are not done until the score has improved.**

## Context

The agent score (0–100) measures how well AI agents can locate, parse, and use your documentation. Scores are visible at [mintlify.com/score](https://www.mintlify.com/score). Common failure categories:

- **Content discoverability** — pages that agents can't find or index
- **Markdown availability** — content not exposed in machine-readable form
- **Page size / truncation risk** — pages too long for agent context windows

## Step 1: Get the docs URL

If the user didn't provide a URL, detect it from the project config:

```bash
cat docs.json 2>/dev/null | grep -m1 '"url"' || cat mint.json 2>/dev/null | grep -m1 '"url"'
```

Use the URL from `"url"` or `"name"` (e.g. `https://docs.example.com`).

## Step 2: Get the baseline score

```bash
npx afdocs check <url> --format scorecard
```

Record the overall score and which categories are failing.

## Step 3: Get detailed diagnostics

```bash
npx afdocs check <url> --format text --verbose --fixes
```

This lists every failing check with:
- The specific page(s) affected
- What is wrong
- Suggested remediation

## Step 4: Fix issues

Work through failures in priority order — highest-impact checks first. Common fixes:

| Category | Issue | Fix |
|---|---|---|
| Content discoverability | Page not in `navigation` | Add page to the correct `navigation` group in `docs.json` / `mint.json` |
| Content discoverability | No `<title>` or `sidebarTitle` | Add a clear, descriptive `title` to the page's frontmatter |
| Content discoverability | Missing `description` frontmatter | Add a one-sentence `description` to the page frontmatter |
| Markdown availability | Tabs/Accordions hide content | Move critical content out of collapsed components or add a plain-text summary |
| Markdown availability | Code-only page | Add prose explanation around code snippets |
| Page size | Page exceeds truncation threshold | Split long pages into focused sub-pages; add anchor links in the parent |

Fix issues in batches by category — don't make one micro-edit per re-run.

## Step 5: Re-run and iterate

```bash
npx afdocs check <url> --format scorecard
```

Compare the new score to the baseline.

- **Score improved?** Check if further gains are practical; if the score is near the ceiling or remaining issues are structural (e.g. third-party embeds), report progress and stop.
- **Score unchanged?** Re-read the `--verbose --fixes` output carefully and try a different category of fix.
- **More issues remain?** Repeat from Step 4.

## Important

- **Do not stop** until the score has improved at least once from the baseline.
- Prefer frontmatter fixes (`title`, `description`, `sidebarTitle`) — they are fast and high-value.
- Do not hide content from agents to hit a score; fixes must genuinely improve readability.
- If a fix requires structural changes (splitting a page, adding navigation entries) that seem risky, confirm with the user before applying.
- Use `--sampling deterministic` for reproducible scores when comparing runs.
