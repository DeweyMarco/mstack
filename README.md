# mstack

A collection of Claude Code skills for Mintlify documentation workflows.

## Skills

| Skill | Description |
|-------|-------------|
| [`/docs-to-mintlify`](./plugins/mstack/skills/docs-to-mintlify/SKILL.md) | Convert any existing docs site into a Mintlify-compatible repo with proper MDX files, components, navigation, and a parity manifest |
| [`/fix-broken-links`](./plugins/mstack/skills/fix-broken-links/SKILL.md) | Fix all broken links in a Mintlify project until `mint broken-links` reports success |
| [`/style-docs`](./plugins/mstack/skills/style-docs/SKILL.md) | Style and polish docs sites with strong source-parity IA, Mintlify-native components, and accessible theming |
| [`/create-landing-page`](./plugins/mstack/skills/create-landing-page/SKILL.md) | Build replica-first custom Mintlify docs landing pages with source-matched structure, hero sections, navigation cards, and dark-mode support |
| [`/preview-qa`](./plugins/mstack/skills/preview-qa/SKILL.md) | Mechanical parity gate that runs every deterministic check on a preview (chrome, icons, collapsibility, backgrounds, structural parity, visual verification) before handing off to `/han-review` |
| [`/han-review`](./plugins/mstack/skills/han-review/SKILL.md) | CEO-level QA and design review to make Mintlify previews feel production-ready |
| [`/agent-ready-docs`](./plugins/mstack/skills/agent-ready-docs/SKILL.md) | Optional post-parity pass to raise the [afdocs](https://afdocs.dev) and Mintlify Agent Rank score without regressing source parity |

## Installation

### Claude Code

Add this repo as a plugin marketplace in your Claude Code settings:

```json
{
  "plugins": {
    "marketplaces": [
      "https://github.com/mintlify/mstack"
    ]
  }
}
```

Or clone and add locally:

```bash
git clone https://github.com/mintlify/mstack ~/.claude/plugins/marketplaces/mstack
```

### Cursor

Clone the repo, then install the individual skills into Cursor's personal skills directory:

```bash
git clone https://github.com/mintlify/mstack
cd mstack
./scripts/install-cursor.sh
```

By default this copies skills to `~/.cursor/skills`. To install somewhere else, set `CURSOR_SKILLS_DIR`:

```bash
CURSOR_SKILLS_DIR=/path/to/.cursor/skills ./scripts/install-cursor.sh
```

## Workflow order

When migrating an existing docs site to Mintlify, apply the skills in this order. Each step assumes the previous one has produced its outputs.

1. **`/docs-to-mintlify`** — crawl the source site, generate MDX files + `docs.json` navigation, and write a parity manifest. This is the only skill that creates `docs.json` from scratch.
2. **`/fix-broken-links`** — clean up cross-page refs that broke during slug normalization. Re-run after any later step that moves or renames pages.
3. **`/style-docs`** — polish IA, components, chrome, tabs/groups, collapsibility, and theming against the parity manifest. May restructure navigation, in which case re-run `/fix-broken-links`.
4. **`/create-landing-page`** — build a custom replica-first `index.mdx` after navigation, brand tokens, and page paths are stable.
5. **`/fix-broken-links`** — run again after landing-page cards, header links, and footer links are added.
6. **`/preview-qa`** — mechanical parity gate. Walks every deterministic check (chrome, icons, sidebar collapsibility, multi-tone backgrounds, structural parity, visual verification) and produces a PASS/FAIL report. Re-run from gate 1 after any fix.
7. **`/han-review`** — final CEO-level human-quality gate. Only invoke after `/preview-qa` reports all gates PASS. Often kicks work back to `/style-docs` or `/create-landing-page`; loop until it passes.
8. **`/agent-ready-docs`** — optional post-parity optimization for afdocs / Mintlify Agent Rank. If it changes visible content, navigation, or page splits, re-run `/fix-broken-links` and `/preview-qa`.

For a greenfield docs site (no source to migrate), skip step 1 and hand-bootstrap a minimal `docs.json` plus stub pages before `/style-docs`.

## Evals

This repo includes a lightweight eval runner for previews created by [`sophiabarness/preview-automation`](https://github.com/sophiabarness/preview-automation). That automation creates `<company>-preview`, launches a Cursor cloud agent that clones mstack into `./mstack/`, and expects the generated preview repo to ignore that helper checkout in both `.gitignore` and `.mintignore`.

After the automation has merged its PRs into `main`, clone the generated preview repo and run:

```bash
node evals/run-preview-eval.mjs \
  --preview-repo /path/to/company-preview \
  --source-url https://docs.example.com \
  --company company \
  --preview-url https://company-preview.mintlify.app
```

Reports are written to `evals/runs/<company>/`, which is gitignored. See [`evals/README.md`](./evals/README.md) for the full framework and options.

## Skills overview

### `/docs-to-mintlify`

Converts any existing documentation site into a Mintlify-compatible repo. Handles exhaustive crawling, parity manifest creation, GitBook syntax normalization, MDX safety rules, OpenAPI reference generation, and navigation wiring.

### `/fix-broken-links`

Runs `mint broken-links`, diagnoses each issue, applies fixes, and loops until the check passes clean.

### `/preview-qa`

Mechanical parity gate that runs before `/han-review`. Walks seven deterministic gates — config validation, source-mirror parity, chrome parity (global + per-section), sidebar collapsibility, background and theme parity, visual verification (preview vs source screenshots in light/dark/mobile), and a structured output report. Catches the long tail of defects (blank icons under the wrong library, missing chevrons, monotone-vs-multitone backgrounds, asymmetric CTAs) so `/han-review` can stay focused on subjective polish.

### `/han-review`

Applies a high bar QA workflow for previews that must feel launch-ready: pixel-perfect UI, Mintlify-first implementation, and full responsive + dark-mode validation.

### `/create-landing-page`

Builds a replica-first custom `index.mdx` landing page with all known Mintlify gotchas handled upfront: stripped semantic HTML, Tailwind-only styling, single-path SVG icons, and chrome-hiding CSS.

### `/style-docs`

Polishes docs sites using the parity manifest, `docs.json` configuration, Mintlify components, and UX rules focused on source familiarity, fast comprehension, and first-task success. Includes a navigation restructuring workflow for large flat sidebars.

### `/agent-ready-docs`

Raises the [afdocs](https://afdocs.dev) and Mintlify Agent Rank score by running diagnostics, fixing discoverability and Markdown availability issues, and looping until the score improves. In this migration stack it is a post-parity pass: do not add visible frontmatter, split pages, or alter navigation in ways that regress source parity without re-running `/preview-qa`.

## License

MIT
