# mstack

A collection of Claude Code skills for Mintlify documentation workflows.

## Skills

| Skill | Description |
|-------|-------------|
| [`/docs-to-mintlify`](./docs-to-mintlify/SKILL.md) | Convert any existing docs site into a Mintlify-compatible repo with proper MDX files, components, and navigation |
| [`/fix-broken-links`](./fix-broken-links/SKILL.md) | Fix all broken links in a Mintlify project until `mint broken-links` reports success |
| [`/preview-qa`](./preview-qa/SKILL.md) | Mechanical parity gate that runs every deterministic check on a preview (chrome, icons, collapsibility, backgrounds, structural parity, visual verification) before handing off to `/han-review` |
| [`/han-review`](./han-review/SKILL.md) | CEO-level QA and design review to make Mintlify previews feel production-ready |
| [`/create-landing-page`](./create-landing-page/SKILL.md) | Build custom Mintlify docs landing pages with hero sections, navigation cards, and dark-mode support |
| [`/style-docs`](./style-docs/SKILL.md) | Style and polish docs sites with strong visual hierarchy, Mintlify-native components, and accessible theming |

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

1. **`/docs-to-mintlify`** — crawl the source site and generate MDX files + `docs.json` navigation. This is the only skill that creates `docs.json` from scratch.
2. **`/fix-broken-links`** — clean up cross-page refs that broke during slug normalization. Re-run after any later step that moves or renames pages.
3. **`/create-landing-page`** — build a custom `index.mdx`. Runs after migration because it reads `docs.json` and needs the real page inventory so card/button `href` values point to existing paths.
4. **`/style-docs`** — polish IA, components, and theming. May restructure navigation, in which case re-run `/fix-broken-links`.
5. **`/preview-qa`** — mechanical parity gate. Walks every deterministic check (chrome, icons, sidebar collapsibility, multi-tone backgrounds, structural parity, visual verification) and produces a PASS/FAIL report. Re-run from gate 1 after any fix.
6. **`/han-review`** — final CEO-level human-quality gate. Only invoke after `/preview-qa` reports all gates PASS. Often kicks work back to `/style-docs` or `/create-landing-page`; loop until it passes.

For a greenfield docs site (no source to migrate), skip step 1 and hand-bootstrap a minimal `docs.json` plus stub pages before `/create-landing-page`.

## Skills overview

### `/docs-to-mintlify`

Converts any existing documentation site into a Mintlify-compatible repo. Handles exhaustive crawling, GitBook syntax normalization, MDX safety rules, OpenAPI reference generation, and navigation wiring.

### `/fix-broken-links`

Runs `mint broken-links`, diagnoses each issue, applies fixes, and loops until the check passes clean.

### `/preview-qa`

Mechanical parity gate that runs before `/han-review`. Walks seven deterministic gates — config validation, source-mirror parity, chrome parity (global + per-section), sidebar collapsibility, background and theme parity, visual verification (preview vs source screenshots in light/dark/mobile), and a structured output report. Catches the long tail of defects (blank icons under the wrong library, missing chevrons, monotone-vs-multitone backgrounds, asymmetric CTAs) so `/han-review` can stay focused on subjective polish.

### `/han-review`

Applies a high bar QA workflow for previews that must feel launch-ready: pixel-perfect UI, Mintlify-first implementation, and full responsive + dark-mode validation.

### `/create-landing-page`

Builds a custom `index.mdx` landing page with all known Mintlify gotchas handled upfront: stripped semantic HTML, Tailwind-only styling, single-path SVG icons, and chrome-hiding CSS.

### `/style-docs`

Polishes docs sites using `docs.json` configuration, Mintlify components, and UX rules focused on fast comprehension and first-task success. Includes a navigation restructuring workflow for large flat sidebars.

## License

MIT
