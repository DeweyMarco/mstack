# mstack — Claude Code Skills for Mintlify

This repo is a marketplace plugin for Mintlify documentation workflows, compatible with both Claude Code and Codex.

## Structure

```
mstack/
└── plugins/
    └── mstack/
        ├── .claude-plugin/plugin.json   # Claude Code manifest
        ├── .codex-plugin/plugin.json    # Codex manifest
        └── skills/
            ├── docs-to-mintlify/SKILL.md        # migrate any docs site to Mintlify
            ├── fix-broken-links/SKILL.md         # run mint broken-links until clean
            ├── han-review/SKILL.md               # launch-quality QA pass for previews
            ├── create-landing-page/SKILL.md      # build custom index.mdx
            └── style-docs/
                ├── SKILL.md                      # polish docs IA, components, and theming
                └── reference.md                  # extended design heuristics
```

## Development

Each skill lives in `plugins/mstack/skills/<name>/SKILL.md` with YAML frontmatter:

```markdown
---
name: skill-name
description: One-sentence description used for trigger matching.
---

# Skill Name
...
```

To add a skill: create a new directory under `plugins/mstack/skills/` with a `SKILL.md`.

Commits to main auto-push to GitHub via the post-commit hook.

## Testing

Test skills manually by invoking them in a Mintlify project repo. For migration skills, use a small docs site (< 20 pages) as a test case.
