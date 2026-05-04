# Style Docs Reference

Use this file when the task involves a substantial redesign, homepage polish, or deeper docs UX decisions.

## Mintlify implementation notes

### Page modes

- `custom`: best for landing pages and homepages; removes most page chrome and gives the most layout freedom.
- `wide`: good for content that needs more width without becoming a custom landing page.
- `default`: best for regular docs content.

Choose the simplest mode that supports the desired UX.

### High-signal Mintlify components

- `Card`, `CardGroup`, `Columns`: section navigation and scannable choices
- `Steps`: onboarding, setup, and first-run flows
- `Tabs`, `CodeGroup`: language and framework switching
- `Accordion`: optional detail and secondary content
- `Frame`: visual separation for images or embeds
- `Note`, `Tip`, `Warning`: important context, used sparingly

### Theme and brand levers in `docs.json`

Prefer site-wide settings over one-off page styling:

- `theme`
- `colors.primary`, `colors.light`, `colors.dark`
- `logo.light`, `logo.dark`
- `favicon.light`, `favicon.dark`
- `appearance.default`, `appearance.strict`
- `fonts.family`, `fonts.heading`, `fonts.body`
- `icons.library`
- `background.decoration`, `background.color`, `background.image`

### Icon library (Font Awesome by default)

`docs.json` `icon` fields — anchors, cards, frontmatter — default to **Font Awesome**, not Lucide. If `icons.library` is unset, every icon name in the file must be a valid Font Awesome icon. Lucide names like `cpu`, `arrow-right-left`, `file-search-2`, `life-buoy` will silently fail under the default config: the anchor button renders, the icon slot is blank, and the JSON validates fine.

Two options:

1. **Stay on Font Awesome (default).** Map source heroicons / Lucide names to Font Awesome equivalents.
2. **Switch the whole site to Lucide** by setting `"icons": { "library": "lucide" }` in `docs.json`. Only do this if you want Lucide everywhere — mixing libraries page by page produces inconsistent visual weight.

Common heroicon → library mappings (verified rendering):

| Source heroicon | Font Awesome | Lucide |
|---|---|---|
| `cpu-chip-16-solid` | `microchip` | `cpu` |
| `arrows-right-left-16-solid` | `arrow-right-arrow-left` | `arrow-right-left` |
| `document-magnifying-glass` | `file-magnifying-glass` | `file-search-2` |
| `code-bracket-16-solid` | `code` | `code` |
| `lifebuoy-solid` | `life-ring` | `life-buoy` |
| `play-16-solid` | `play` | `play` |

Always extract the source icon name from the rendered HTML on the live site (search the DOM for the visible icon class), not by guessing from the label. Then map deterministically against the table above and verify visually with `mint dev` + screenshots before declaring done.

### Mintlify layout regions and selectors

Mintlify renders every page into a small, stable set of layout regions. Most styling tasks that target chrome (backgrounds, borders, padding around the sidebar / navbar / content) need to pick the right region selector — guessing wastes an iteration.

| Region | Stable selector(s) | Notes |
|---|---|---|
| Outer page (everything behind the chrome) | `body`, `html` | Default Mintlify body bg cascades to every region that doesn't override it |
| Top navbar | `#navbar`, `header#navbar`, `header.sticky` | Includes search and right-side links |
| Left sidebar panel (page nav) | `#sidebar-content` | **Not `#sidebar`.** `#sidebar` is the wrapper; `#sidebar-content` is the painted panel. Targeting `#sidebar` alone leaves the panel showing the body bg through it |
| Main content area (article body) | `#content-area`, `#content-container`, `main > article` | The white "page" the user reads |
| Right-hand "On this page" TOC | `#table-of-contents`, `aside#toc` | Often inherits the content bg |
| Footer | `footer`, `#footer` | |

Confirm the live DOM in the running `mint dev` preview before targeting these — Mintlify occasionally renames internals across major versions. Use the browser inspector or a Playwright/Puppeteer one-liner that prints `document.querySelector('#sidebar-content')` to verify before writing CSS.

### Multi-tone background layouts

Many docs sites use a layered background palette — typically a medium grey for the page chrome, a light grey for the sidebar and/or navbar, and white for the main content. `docs.json` `background` sets exactly **one** tone (the body), and Mintlify's default CSS lets the sidebar, navbar, and content inherit it. Setting `background` alone produces a flat, monotone preview that does not match a multi-tone source.

To match a multi-tone source, define one CSS variable per tone on `:root`, then override each region with its stable selector:

```css
:root {
  --pw-page-bg:    #e5e5e5;  /* outer page chrome */
  --pw-panel-bg:   #f2f2f2;  /* sidebar / navbar panel */
  --pw-content-bg: #ffffff;  /* article body */
}

html, body { background-color: var(--pw-page-bg) !important; }

#navbar,
header#navbar,
header.sticky {
  background-color: var(--pw-content-bg) !important;
}

#sidebar-content {
  background-color: var(--pw-panel-bg) !important;
}

#content-area,
#content-container,
main > article {
  background-color: var(--pw-content-bg) !important;
}

html.dark,
html.dark body { background-color: #0b1220 !important; }
html.dark #navbar,
html.dark #sidebar-content,
html.dark #content-area { background-color: #0f172a !important; }
```

Notes:

- Pull each tone directly from the live source (`curl ... | grep background-color` or browser inspector). Do not eyeball.
- `#sidebar-content`, not `#sidebar` — see the layout-regions table above. This is the single most common reason a multi-tone fix lands but the sidebar still looks wrong on first preview.
- Always pair light-mode rules with dark-mode equivalents (`html.dark` selectors) so the layering reads correctly when the user toggles theme.
- Verify with `mint dev` + a screenshot in both modes before declaring done — see the validation workflow in `SKILL.md`.

### Per-dropdown sidebar anchors

Mintlify navigation has a strict nesting rule: **each navigation element can contain one type of child element at each level**. A dropdown can have either `anchors` *or* `groups` / `tabs` directly underneath it, not both at the same level.

This matters when the source site shows section-specific sidebar buttons (e.g. Framework pages show `Developer Guide`, `Connectors`, `LLM Tooling`, `API Docs`, `Get Help`; Templates pages show `RAG Templates`, `ETL Templates`, `Run a Template`, `Get Help`). Putting these in `navigation.global.anchors` is wrong — they will appear in every section.

Pattern: give each dropdown its own `anchors` array, and wrap the existing content under a single container anchor inside the same dropdown. This satisfies the "one type of child per level" rule.

```json
{
  "navigation": {
    "dropdowns": [
      {
        "dropdown": "Pathway Templates",
        "anchors": [
          { "anchor": "RAG Templates",   "icon": "file-magnifying-glass", "href": "/developers/templates#rag-templates" },
          { "anchor": "ETL Templates",   "icon": "microchip",             "href": "/developers/templates#live-data-pipeline" },
          { "anchor": "Run a Template",  "icon": "play",                  "href": "/developers/templates/run-a-template" },
          { "anchor": "Get Help",        "icon": "life-ring",             "href": "/developers/user-guide/development/get-help" },
          {
            "anchor": "Templates",
            "groups": [
              { "group": "Getting Started", "pages": ["..."] },
              { "group": "YAML Snippets",   "pages": ["..."] }
            ]
          }
        ]
      }
    ]
  }
}
```

The four link-button anchors sit at the top of the sidebar; the wrapping `Templates` anchor carries the actual page navigation underneath. Remove `navigation.global.anchors` once each dropdown has its own anchor set, otherwise the global anchors stack on top of the per-dropdown ones.

Verify after editing:

- JSON parses with `cat docs.json | python3 -m json.tool` (or equivalent).
- Each dropdown shows its own anchors and only its own anchors when navigated to.
- Icons render — see the icon library section above.
- Internal `href`s resolve to real pages (`mint broken-links`).

### Custom styling cautions

- Tailwind utility classes work well for most layout and spacing needs.
- Tailwind arbitrary values are not reliably supported.
- Large inline `style` usage can cause layout shift on load, especially on custom pages.
- If a custom value is needed, prefer a scoped CSS file.
- Use Mintlify's documented selectors and data attributes when targeting built-in UI.

## Docs UI/UX heuristics

### 1. Optimize for first-task success

The page should answer:

- What is this documentation for?
- Where should I start?
- What should I click next?

If the user cannot answer those quickly, the page is not done.

### 2. Design for scanning, not deep reading

- Put the most important information first.
- Use short paragraphs and meaningful headings.
- Make cards, section titles, and CTA labels understandable without surrounding context.
- Keep key paths visible above the fold when possible.

### 3. Keep the information architecture obvious

Default grouping for developer docs:

- Quickstart / Getting started
- Guides / Tutorials
- API reference
- SDKs / Libraries
- Webhooks / Events
- Troubleshooting
- Support / Community

Use the product's real terminology where it exists.

### 4. Reduce cognitive load

- Reuse the same section patterns across pages.
- Avoid too many competing CTAs.
- Avoid decorative sections that don't move the task forward.
- Keep icon use purposeful and consistent with the configured icon library.

### 5. Build trust through specificity

- Card copy should describe real outcomes, not generic aspirations.
- Code samples should be realistic and runnable.
- Empty states, labels, and CTA text should never feel templated.

### 6. Accessibility is part of polish

- Ensure good contrast in both themes.
- Ensure interactive elements are visible on keyboard focus.
- Provide descriptive alt text for meaningful images.
- Keep heading order sequential.
- Do not rely on color alone to communicate meaning.

## Recommended homepage structure

Use this order by default unless the content strongly suggests another flow:

1. Hero: one headline, one support line, primary CTA, optional secondary CTA
2. Primary navigation cards
3. Quick-start steps or first API call
4. Secondary sections such as guides, SDKs, or reference
5. Support and community
6. Closing CTA only if it reinforces the main journey

## When to say no

Avoid these patterns unless the user explicitly asks for them and they still serve usability:

- Overly decorative gradients or backgrounds that weaken contrast
- Multiple equally prominent CTAs in the hero
- Large custom wrappers when a Mintlify component already solves the need
- Generic card labels
- Hidden first steps
- Custom CSS that restyles the entire product without a strong reason

## Practical review checklist

- Can a new user find the first step immediately?
- Are the main destinations obvious and labeled well?
- Is the page still clear in dark mode?
- Does the layout hold up on mobile?
- Are there any placeholder labels or weak descriptions?
- Are images accessible and necessary?
- Did custom CSS stay minimal and scoped?
