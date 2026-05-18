# llms.txt, llms-full.txt, skill.md

The trio of "agent-friendly" files at the site root. Each has a specific role and specific gotchas. **Format rules are stack-agnostic.** Implementation depends on what the user is using — static files in a `public/` folder, route handlers in a framework, edge functions, etc. Use the user's stack; don't force them onto a particular tool.

For **Mintlify-hosted docs**, these files and routes are mostly platform-owned:

- `llms.txt` is generated at `/llms.txt` and `/.well-known/llms.txt`.
- `llms-full.txt` is generated at `/llms-full.txt` and `/.well-known/llms-full.txt`.
- `.md` page URLs and `Accept: text/markdown`/`Accept: text/plain` are built in.
- `skill.md` and skills discovery are built in; custom skills live at root `skill.md` or `.mintlify/skills/<name>/SKILL.md`.

Only add custom files when generated output is too broad, too large, or insufficiently specific for the score/user need.

## llms.txt

The index. Linked from your homepage and crawled first by agents. **Keep it small and clean.**

### Required structure

```text
# Site Name

> One-line tagline.

## Docs

- [Title 1](https://site.com/page1.md): description
- [Title 2](https://site.com/page2.md): description

## (other named sections — Optional, Skills, Ports, etc.)
```

The check `llms-txt-directive` requires a `## Docs` (or `## Documentation`) section to exist. Without it, the check fails even if your file is valid markdown.

### Critical pitfalls

**Same-origin links must point to `.md` URLs**, not HTML. The `llms-txt-links-markdown` check measures the ratio. Aim for 100% same-origin → `.md`. External links don't count toward the ratio.

**All links must resolve.** Run `HEAD` against every link before you ship. Threshold is 90% same-origin success. Common breakers:

- A code block with `npx install "https://site.com/r/{name}.json"` — the link parser sees `{name}` as a literal URL part and tries to fetch `{name}.json` → 404. Use `<name>` (angle brackets are not parsed as URL parts).
- A `https://x.com/handle` link — bot-detected, often returns non-200. Either remove from llms.txt or accept a single warning.
- Stale URLs after content moves.

**Size threshold: pass ≤ 50K, fail > 100K characters.** If you have hundreds of items in `## Articles`/`## Components`/`## Products`, the file balloons. Fix with **nested splitting**:

Root `/llms.txt` (small):
```text
# Site

> Tagline.

## Docs
- [Home](/index.md)
- [Skill](/skill.md)
- [Full corpus](/llms-full.txt)

## Articles
- [Full articles index (nested)](/articles/llms.txt)
```

Nested `/articles/llms.txt` (full list):
```text
# Site — articles index

> All articles. Up one level: /llms.txt

## Articles
- [Article one](https://site.com/articles/one.md)
- [Article two](https://site.com/articles/two.md)
... (compact, one line per item)
```

The root stays under 50K. The nested file can be larger but should stay under 100K.

### Implementation

The simplest path is a static `public/llms.txt` file that you regenerate on build. If your inventory is dynamic (database-backed, file-system-derived, etc.) you'll want a route/handler that builds the content on request. Both work — the scorer doesn't care how you generate it, only what you serve.

In Mintlify-hosted docs, the simplest path is usually no custom file: Mintlify generates `llms.txt` from `docs.json`, page frontmatter, and API specs. Improve the generated file by adding clear page `description` frontmatter and making sure important pages are represented in navigation. Add a custom root `llms.txt` only when you need curated sections or size control.

If you have nested files like `/articles/llms.txt`, watch out for routing conflicts with dynamic segments at the same path level (e.g., `/articles/[slug]`) — most frameworks prefer the static path, but verify.

## llms-full.txt

The "long-context corpus" — a single file with all content for agents that can ingest large context.

**Size threshold: pass between 500 and 5,000,000 chars.** Both too small and too large fail.

**The page-size-markdown check applies here.** Since the response is `text/plain`, the scorer measures the raw body without HTML→md conversion. You're racing against a 50K warn / 100K fail budget for the converted-markdown size check.

Mintlify-hosted docs generate `llms-full.txt` automatically. Prefer the generated file unless the score reports a size/validity issue. If you add a custom root `llms-full.txt`, keep it compact and template repeated patterns once.

### Compress aggressively with templates

If you have hundreds of similar items, **don't repeat install/usage blocks per item**. Put templates in the header, list items compactly. Example transformation for a library:

**Before** (~400 chars per item × 405 items = 162K — fails):
```text
## Activity

URL: https://site.com/activity
Markdown: https://site.com/activity.md

Animated activity icon.

Install:

\`\`\`bash
npx install activity
\`\`\`

Use:

\`\`\`tsx
import { Activity } from "lib/activity";
\`\`\`

Keywords: activity, fitness, exercise
```

**After** (~80 chars per item × 405 items = ~32K — passes):

Header (written once):
```text
# Site — full documentation

> Tagline.

# Installation

Install pattern: `npx install <name>`

# Usage

Import pattern: `import { PascalName } from "lib/<name>"`

# Items
```

Items (compact):
```text
- `arrow-right` → `ArrowRight` — keywords: arrow, forward, next
- `circle-check` → `CircleCheck` — keywords: tick, done, complete
- ...
```

The pattern works for any catalog: components, articles, products, recipes, plugins, etc. Move the repetitive boilerplate into the header once; keep items as one-liners with just the unique data.

## skill.md

A single-page operating guide for an agent skill. Used by Claude/Cursor/etc when the user asks the model to perform a task involving your product.

### Discovery

The check `skill-md` looks for either:
1. `/.well-known/agent-skills/index.json` (preferred, but more setup), OR
2. `/skill.md` (legacy, simpler)

A static `/skill.md` is the path of least resistance.

Mintlify-hosted docs support both generated and custom skills. Mintlify can generate `skill.md` for public docs. To override it, add a root `skill.md`. To publish multiple skills, add `.mintlify/skills/<skill-name>/SKILL.md`; Mintlify serves discovery manifests at `/.well-known/agent-skills/index.json` and `/.well-known/skills/index.json`, plus individual skill files. If a site is reverse-proxied, forward `/skill.md`, `/.well-known/skills/*`, and `/.well-known/agent-skills/*` to Mintlify.

### Structure

```yaml
---
name: site-name
description: Install and use X from https://site.com
---

# Site Name skill

Use this skill when a user asks to <task description>, or references this site.

## Discover available items

- Index: https://site.com/llms.txt
- Per-item: https://site.com/<name>.md

## Install one item

\`\`\`bash
npx install <name>
\`\`\`

## Use the item

(code example)

## Constraints

- Required runtime versions
- Recommended companions
- Anything that must be set up

## Common pitfalls

- Item naming conventions (kebab-case vs PascalCase)
- Ordering matters
- ...
```

### Markdown directive at top

Like all `.md` responses, prefix the body (after the H1) with the llms.txt blockquote (for the `llms-txt-directive-md` check):

```text
# Site Name skill

> [llms.txt](https://site.com/llms.txt)

(rest of skill)
```

## Markdown directive on every .md page

Every `.md` response from your site must have a blockquote near the top linking to `/llms.txt`. The shortest form that passes is:

```text
> [llms.txt](/llms.txt)
```

Lower than 40 chars but contains the link with proper blockquote syntax. If your scorer is more strict, use the longer form: `> For the complete documentation index, see [llms.txt](/llms.txt).`

Mintlify-hosted Markdown exports include a documentation-index blockquote automatically. Do not add this text to every MDX file unless a real score report says the generated Markdown is missing the directive.

## Content negotiation + .md URL support

Two checks (`content-negotiation` and `markdown-url-support`) are about the same routing trick. The site should:

1. Return markdown when `Accept: text/markdown` is sent
2. Return markdown when the URL has `.md` appended

How to wire it depends on the stack:

- **Static-site generators** (Hugo, Astro, etc.): pre-render both `page.html` and `page.md` at build time. Configure your CDN/server to look at the Accept header for content negotiation.
- **Server frameworks with middleware** (Next.js, SvelteKit, Nuxt, Remix): a single middleware can both rewrite `.md` URLs to a markdown route AND inspect the `Accept` header to dispatch.
- **Mintlify-hosted docs**: this is built in for `.md` URLs, `Accept: text/markdown`, and `Accept: text/plain`.

The point is: when an agent fetches `your-site.com/foo` with `Accept: text/markdown`, OR `your-site.com/foo.md`, return the markdown variant. How you do that is your call.

## Markdown alternate link in HTML head

Each HTML page should advertise its `.md` variant via a `<link>` tag (helps content-aware agents):

```html
<link rel="alternate" type="text/markdown" href="/page.md" />
```

In framework metadata APIs this typically maps to a `types: { "text/markdown": "/page.md" }` field; in static generators you add it to your head template.

## Renderer parity

Whatever you serve at `/page.md` should contain the same substantive content as `/page` HTML. The `markdown-content-parity` check measures this. If your HTML page has 6 "Related items" sections that aren't in the markdown response, that's a 6-section gap — fix by rendering the same sections in markdown.

Mintlify-hosted docs derive Markdown output from MDX source. Use `<Visibility for="agents">` for content that should appear only in Markdown exports, and `<Visibility for="humans">` for web-only UI guidance. This is the supported way to tailor agent output without maintaining separate pages.
