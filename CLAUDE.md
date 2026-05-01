# mstack — Claude Code Skills for Mintlify

This repo is a skill pack for Mintlify documentation workflows. Each subdirectory is a Claude Code skill invoked via a `/` command.

## Structure

```
mstack/
├── docs-to-mintlify/   # /docs-to-mintlify — migrate any docs site to Mintlify
│   └── SKILL.md
├── fix-broken-links/   # /fix-broken-links — run mint broken-links until clean
│   └── SKILL.md
├── han-review/         # /han-review — launch-quality QA pass for previews
│   └── SKILL.md
├── create-landing-page/ # /create-landing-page — build custom index.mdx
│   └── SKILL.md
└── style-docs/         # /style-docs — polish docs IA, components, and theming
    ├── SKILL.md
    └── reference.md    # extended design heuristics
```

## Development

Each skill lives in its own directory as a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: skill-name
description: One-sentence description used for trigger matching.
---

# Skill Name
...
```

To add a skill: create a new directory with a `SKILL.md` and add it to the table in `README.md`.

## Testing

Test skills manually by invoking them in a Mintlify project repo. For migration skills, use a small docs site (< 20 pages) as a test case.
