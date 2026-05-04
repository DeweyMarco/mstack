# mstack

A collection of Claude Code skills for Mintlify documentation workflows.

## Skills

| Skill | Description |
|-------|-------------|
| [`/docs-to-mintlify`](./docs-to-mintlify/SKILL.md) | Convert any existing docs site into a Mintlify-compatible repo with proper MDX files, components, and navigation |
| [`/fix-broken-links`](./fix-broken-links/SKILL.md) | Fix all broken links in a Mintlify project until `mint broken-links` reports success |
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

## Skills overview

### `/docs-to-mintlify`

Converts any existing documentation site into a Mintlify-compatible repo. Handles exhaustive crawling, GitBook syntax normalization, MDX safety rules, OpenAPI reference generation, and navigation wiring.

### `/fix-broken-links`

Runs `mint broken-links`, diagnoses each issue, applies fixes, and loops until the check passes clean.

### `/han-review`

Applies a high bar QA workflow for previews that must feel launch-ready: pixel-perfect UI, Mintlify-first implementation, and full responsive + dark-mode validation.

### `/create-landing-page`

Builds a custom `index.mdx` landing page with all known Mintlify gotchas handled upfront: stripped semantic HTML, Tailwind-only styling, single-path SVG icons, and chrome-hiding CSS.

### `/style-docs`

Polishes docs sites using `docs.json` configuration, Mintlify components, and UX rules focused on fast comprehension and first-task success. Includes a navigation restructuring workflow for large flat sidebars.

## License

MIT
