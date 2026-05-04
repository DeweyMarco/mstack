---
name: mstack
description: Mintlify documentation workflows for migration, broken link repair, landing pages, docs styling, and launch-quality preview review. Use when working on Mintlify docs, docs.json, MDX conversion, Mintlify previews, or documentation polish.
---

# mstack

This repository is a bundle of Mintlify documentation skills.

## Cursor usage

For best results in Cursor, install the individual skills into `~/.cursor/skills`:

```bash
./scripts/install-cursor.sh
```

After installation, Cursor can discover each workflow independently:

- `docs-to-mintlify`
- `fix-broken-links`
- `preview-qa`
- `han-review`
- `create-landing-page`
- `style-docs`

## Fallback

If this repository was cloned directly into `~/.cursor/skills/mstack`, use the nested skills under `plugins/mstack/skills/`:

- For docs migration, read `plugins/mstack/skills/docs-to-mintlify/SKILL.md`.
- For broken links, read `plugins/mstack/skills/fix-broken-links/SKILL.md`.
- For mechanical parity QA before han-review, read `plugins/mstack/skills/preview-qa/SKILL.md`.
- For final launch-quality review, read `plugins/mstack/skills/han-review/SKILL.md`.
- For landing pages, read `plugins/mstack/skills/create-landing-page/SKILL.md`.
- For docs styling, read `plugins/mstack/skills/style-docs/SKILL.md`.
