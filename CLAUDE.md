# mstack — Claude Code Skills for Mintlify

This repo is a marketplace plugin for Mintlify documentation workflows, compatible with Claude Code, Codex, and Cursor.

## Structure

```
mstack/
├── SKILL.md                              # Cursor compatibility shim
├── scripts/
│   └── install-cursor.sh                 # Copies skills into ~/.cursor/skills
└── plugins/
    └── mstack/
        ├── .claude-plugin/plugin.json   # Claude Code manifest
        ├── .codex-plugin/plugin.json    # Codex manifest
        └── skills/
            ├── docs-to-mintlify/SKILL.md        # migrate any docs site to Mintlify
            ├── fix-broken-links/SKILL.md         # run mint broken-links until clean
            ├── agent-ready-docs/
            │   ├── SKILL.md                      # get any site to 100/100 agent-readiness (stack-agnostic)
            │   └── references/
            │       ├── checks-cheatsheet.md      # every AFDocs check with fix recipes
            │       ├── llms-files.md             # llms.txt, llms-full.txt, skill.md format rules
            │       ├── mcp-server.md             # minimal Streamable HTTP MCP server
            │       └── nextjs-gotchas.md         # Next.js App Router-specific patterns
            ├── preview-qa/SKILL.md               # mechanical parity gate before han-review
            ├── han-review/SKILL.md               # launch-quality QA pass for previews
            ├── create-landing-page/SKILL.md      # build custom index.mdx
            └── style-docs/
                ├── SKILL.md                      # polish docs IA, components, and theming
                └── reference.md                  # extended design heuristics
```

## Conventions

- **Theme: always `luma`, never `maple`.** Every mstack preview uses the `luma` theme. `luma`'s single full-width sticky navbar handles full-bleed hero homepages, `navigation.products` selectors, and homepage↔content chrome continuity natively; `maple`'s split navbar repeatedly costs hours of fragile CSS. `mint init` scaffolds `maple` — always overwrite it with `luma`, and convert any inherited `maple` site before styling. Deviate to another supported theme only on an explicit, specific customer request; `maple` is never an option. Detail lives in `create-landing-page` → Gotcha 2 → "Theme policy" and `docs-to-mintlify/references/docs-json.md`.
- **Tab cap: never more than 4 top-level tabs.** When a nav needs more than 4 top-level sections, use a `navigation.products` product switcher dropdown instead of a longer tab row — even when the source paints 5+ items in its row (a deliberate parity divergence; record it in the QA report). Detail lives in `style-docs` → "Multi-product top dropdowns — `navigation.products`" and `docs-to-mintlify/references/docs-json.md` → "Tab cap".

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

## Workflow order

For a migration from an existing docs site, run the skills in this order — each step assumes the previous one's outputs:

1. `/docs-to-mintlify` — crawls the source, generates MDX + `docs.json`, and writes a parity manifest (the only skill that creates `docs.json`)
2. `/fix-broken-links` — cleans up refs broken by slug normalization; re-run after any later step that moves pages
3. `/style-docs` — polishes IA, chrome, components, collapsibility, and theming against the parity manifest; if it restructures navigation, loop back to `/fix-broken-links`
4. `/create-landing-page` — completes mandatory customer-website discovery, extracts validated brand assets and visual evidence, then builds a docs-first `index.mdx` native to that customer
5. `/fix-broken-links` — runs again after landing-page cards, header links, and footer links are added
6. `/preview-qa` — mechanical parity gate (chrome, icons, collapsibility, backgrounds, structural parity, visual verification); re-run from gate 1 after any fix
7. `/han-review` — final human-quality QA gate; only invoke after `/preview-qa` reports all gates PASS
8. `/agent-ready-docs` — optional post-parity AFDocs / Mintlify Agent Rank pass; if it changes visible content, navigation, or page splits, rerun `/fix-broken-links` and `/preview-qa`

For a greenfield site (no source), skip step 1 and hand-bootstrap a minimal `docs.json` + stub pages before `/style-docs`.

For Cursor, run `./scripts/install-cursor.sh` after changing skills. Cursor expects each skill at `~/.cursor/skills/<skill-name>/SKILL.md`; do not install into `~/.cursor/skills-cursor`, which is reserved for Cursor-managed built-in skills.

Commits to main auto-push to GitHub via the post-commit hook.

## Testing

Test skills manually by invoking them in a Mintlify project repo. For migration skills, use a small docs site (< 20 pages) as a test case.

For previews generated through `sophiabarness/preview-automation`, run the repo-local eval framework after the Cursor agent has merged its PRs:

```bash
node evals/run-preview-eval.mjs \
  --preview-repo /path/to/company-preview \
  --source-url https://docs.example.com \
  --company company \
  --preview-url https://company-preview.mintlify.app
```

The runner writes reports under `evals/runs/`, which is gitignored.
