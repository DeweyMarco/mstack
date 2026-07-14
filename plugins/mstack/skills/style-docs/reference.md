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

### Brand color ramp: `primary` / `light` / `dark` semantics

`docs.json` `colors` exposes three brand tokens. Their names suggest "the color" / "its light variant" / "its dark variant", but in practice they map to specific *render contexts* — and getting the semantics wrong produces a preview that looks fine in light mode and quietly muddy or off-hue in dark mode.

| Token | Rendered as | Constraint |
|---|---|---|
| `colors.primary` | Light-mode emphasis: links, active sidebar item, anchor underlines, code-block accents, headings hover | The on-brand main color. |
| `colors.light` | **Dark-mode emphasis** — same surfaces as `primary`, but on dark backgrounds | Must be **lighter / brighter** than `primary` so it pops against the dark canvas. |
| `colors.dark` | Buttons, hover states, pressed states in **both** modes | Must be **darker** than `primary`. |

Two failure modes are routine and silent:

1. **`colors.light` is in a different hue family from `primary` / `dark`.** The mode toggle then visibly shifts the brand hue (e.g. green primary becomes teal in dark mode). The most common cause is auto-generating `colors.light` from a "lighter shade" picker that drifts hue alongside lightness — most pickers default to HSL or CIE, both of which can move hue when you increase the lightness slider. Pin all three tokens to the same hue (within ~5°) before shipping.
2. **`colors.light` is darker than `primary`.** Reads as a defect: dark mode emphasis loses contrast against the dark background, so links and the active sidebar item look "muddy" instead of accent-bright. This usually happens when an agent reaches for `colors.light` thinking it means "the color used in light mode" rather than "the lighter variant used *for* dark mode emphasis".

How to build the ramp deterministically:

1. Fix `colors.primary` to the brand's signature value (whatever the marketing site / brand kit uses).
2. Compute `colors.light` by holding `primary`'s hue and saturation constant and increasing lightness by ~15–20% (in HSL space) so the result is visibly brighter on a dark background. For #00C805 (Robinhood green), `#4FE055` is the conservative on-brand choice; `#5BFF5B` is a punchier alternative; `#3DEB7A` pulls slightly toward mint. The right answer depends on how saturated the brand wants the dark-mode accent to feel, but all three preserve hue.
3. Compute `colors.dark` by holding `primary`'s hue and saturation constant and decreasing lightness by ~5–10%. For #00C805, `#00A904` works.
4. Verify by sampling all three swatches on a hue wheel and confirming they sit within ~5° of each other. Mint vs. pure green is a ~36° shift — a much bigger gap than this rule allows.

| Brand mode | Surfaces using each token |
|---|---|
| Light | Body bg = white-ish; emphasis = `primary`; buttons / hover = `dark` |
| Dark  | Body bg = near-black; emphasis = `light`; buttons / hover = `dark` |

Verification (mandatory after any `colors` change):

- Toggle `mint dev` between light and dark and visually confirm the active sidebar item, links, anchor underlines, and code-block accents all read as the same hue family across both modes.
- If anything shifts hue when you toggle, `colors.light` is the wrong hue — re-derive it from `primary` per the rule above.
- If dark-mode accents look muddy / low-contrast, `colors.light` is too dark — bump lightness until it pops against the dark background while staying on hue.
- If light-mode buttons or hover states look indistinguishable from `primary`, `colors.dark` is too close to `primary` — drop lightness another few points.

This is a `/preview-qa` Gate 5 check (brand color parity) and a `/han-review` non-negotiable (dark-mode polish).

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

### Background `decoration` is tinted by `colors.primary`

`docs.json` `background.decoration` (`"windows"`, `"grid"`, `"gradient"`) draws a decorative pattern over the page chrome. All three options derive their color from `colors.primary` — there is no separate decoration-color knob. The result is a faint tint of the brand color on every region that paints the body bg.

This is correct when the source has a matching decorative pattern, and a defect everywhere else. Most source sites are flat — a single solid color, almost always white in light mode and near-black in dark — so a default `"windows"` decoration produces a preview that "looks Mintlify-y" but does not match the source.

Canonical failure (Achievers port): the source's [`getting-started`](https://developer.achievers.com/docs/getting-started) sampled `#ffffff` across the entire viewport. The preview had:

```json
"background": {
  "decoration": "windows"
}
```

with `"colors": { "primary": "#6c2c8c" }` (purple), which painted a subtle lavender pattern (`#f0e9f3` / `#f8f5f9`) over the whole page. `mint validate` clean, decoration renders, every pixel is the wrong color.

How to detect:

- Pixel-sample the source body bg at four points (header, sidebar gutter, content area, right margin) at the same viewport as the preview. Use a browser eyedropper or `playwright.screenshot()` + a pixel reader.
- Repeat on the running preview at the same URL.
- If the source samples are uniform (e.g. all `#ffffff`) and any preview sample is even one byte off, suspect `background.decoration`.
- Grep `docs.json` for `"decoration"`. If present and the source is flat, the decoration is the cause.

How to fix:

- **Source is plain white (or any single solid color):** delete the `background` block entirely. Mintlify defaults to white in light mode. If you want to be explicit (e.g. lock white in dark mode, or guard against a future theme change), use `color` only — never alongside `decoration`:

  ```json
  "background": {
    "color": {
      "light": "#ffffff",
      "dark": "#ffffff"
    }
  }
  ```

- **Source has a multi-tone layout but no decoration:** still drop `decoration`; use the multi-tone `custom.css` pattern from *Multi-tone background layouts* above.
- **Source has a decorative pattern that genuinely matches a Mintlify decoration:** keep `decoration`, but only after side-by-side screenshot confirmation. Do not assume a decoration is "close enough."

Rule of thumb: if you did not deliberately choose a decoration to match an observed source pattern, the `background` block should be omitted from `docs.json`.

### Logo composition and sizing

Mintlify renders the navbar logo as a single `<img class="nav-logo">` sized at `h-6` (24px tall) by default, sourced from `docs.json` `logo.light` / `logo.dark`. There is **no** native field for "logo plus subtitle", "logo plus badge", or "logo plus tagline" — `logo.href` is just the link target, not a sibling element. So when the source's navbar mark is composed (a wordmark plus stacked subtitle, an inline badge, etc.), the only supported way to mirror it is to bake the composition into a single SVG and adjust the navbar logo height in `custom.css`.

How to identify a composed mark on the source:

- Open the source URL, screenshot the top-left, and zoom in. If you see two distinct typographic elements (e.g. `pathway` set above `developers`), the mark is composed.
- Open DevTools on the source's navbar logo container. If `<img class="logo">` has a sibling `<span>`, `<div>`, or `<svg>` rendering text — that's the second element.
- Check the source's CSS for the logo container. A `display: flex; flex-direction: column;` or similar pattern on the logo wrapper is the giveaway: the mark was composed in HTML/CSS, not in a single SVG file.

Canonical SVG pattern for a wordmark + stacked subtitle (Pathway example):

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 240">
  <!-- wordmark glyph paths -->
  <g fill="#232a34">
    <!-- ...path data for the wordmark... -->
  </g>
  <!-- subtitle text, positioned to align with the wordmark's left edge -->
  <text
    x="170"
    y="225"
    font-family="'Open Sauce One', 'Open Sans', 'Inter', 'Helvetica', sans-serif"
    font-size="48"
    font-weight="500"
    fill="#232a34"
  >developers</text>
</svg>
```

Notes on the SVG:

- **`viewBox` height is the original wordmark height plus the subtitle row height.** A wordmark-only SVG of `0 0 680 190` becomes roughly `0 0 680 240` once a subtitle is stacked below.
- **Subtitle `x` matches the wordmark's left edge** in viewBox units (typically the same `x` the source uses for its left padding — measure on the source). Do not assume `x="0"`; the source usually offsets the subtitle by the wordmark's leading whitespace.
- **Font fallbacks must include web-safe fonts.** The source's brand font may not be loaded in the navbar render context. List the brand font first, then a similar web font (`Open Sans`, `Inter`), then a system fallback (`Helvetica`, `sans-serif`).
- **Set `fill` explicitly per mode.** `currentColor` does not pick up Mintlify's dark-mode toggle for navbar SVGs — produce two files: `logo/light.svg` (dark fill) and `logo/dark.svg` (light fill).

Sizing override in `custom.css`:

```css
img.nav-logo {
  height: 2.75rem;
}
```

How to pick the height value:

1. On the source, DevTools → inspect the rendered logo container → read computed `height`.
2. Translate to a Mintlify-friendly unit (`rem` if the value is a typography-scale multiple, otherwise `px`).
3. Apply the override, reload `mint dev`, and confirm the wordmark glyph height in the preview matches the wordmark glyph height in the source. Adjust by 1–2px increments if it is just off.

A taller `img.nav-logo` makes the entire navbar slightly taller. Confirm there is no clipping of adjacent elements (search bar, primary CTA, top-right links). If the navbar feels cramped, set `--navbar-height` (or the equivalent custom property in `custom.css`) explicitly.

Light + dark variants in `docs.json`:

```json
{
  "logo": {
    "light": "/logo/light.svg",
    "dark": "/logo/dark.svg",
    "href": "https://example.com/docs"
  }
}
```

Verification checklist (every item is part of `/preview-qa` Gate 3):

- [ ] Side-by-side screenshot of source navbar vs preview navbar at the same viewport. Every glyph, subtitle, badge, tagline matches.
- [ ] Both light and dark mode tested.
- [ ] Mobile viewport (≤ 768px) — composed marks sometimes need a smaller height override at narrow widths; if the source uses a different mark on mobile, mirror that too.
- [ ] `logo.href` points to the same destination as the source navbar logo's link.

### Frontmatter renders visibly — never fabricate it

Mintlify's frontmatter is **not** out-of-band metadata. Every supported field has a visible rendering side effect, which means generating a value the source doesn't have produces visible content the source doesn't have. The single most common defect class from this misconception is a fabricated `description` showing up as a page subtitle.

| Frontmatter field | Where it renders visibly | Also affects |
|---|---|---|
| `title` | Page H1 + browser tab title | SEO `<title>`, often the sidebar entry |
| `sidebarTitle` | Sidebar label for the page | — (sidebar-only) |
| `description` | **Subtitle text directly below the H1** + `<meta name="description">` | Sharing previews when no `og:description` is set |
| `icon` | Sidebar icon next to the entry | — |
| `mode` (`custom`, `wide`, `default`) | Page chrome / width / TOC visibility | — |

The trap: `description` looks like SEO metadata and tooling tends to auto-generate it (e.g. "first substantive paragraph of the body", or a templated `Welcome to the <Product> developer hub`-style filler). Mintlify renders that synthesized string as a visible subtitle on the page. The result is a preview that says `Welcome to the Pathway developer hub` directly under the H1 when the source page has no such subtitle — a clean miss against the project's content-preservation rule.

**The rule:** for every frontmatter field, the value must come from the source or be omitted. Specifically:

- `title` -> source page H1, verbatim.
- `sidebarTitle` -> source sidebar label, verbatim. Omit if it equals `title`.
- `description` -> only set if the source page has explicit subtitle / lead text rendered under the H1. Copy verbatim. Otherwise **omit** the field. Do not synthesize from the body, do not paraphrase the title, do not use a generic welcome / overview filler.
- `icon` -> only set if the source sidebar shows an icon for that entry. Match the icon's identity, not just "any icon".

Verifying frontmatter parity is part of `/preview-qa` Gate 2. The fastest way to catch a fabricated `description` is to load the page in `mint dev` and look directly under the H1: any subtitle text that is not on the source's rendered page is a defect, regardless of whether it parses as valid YAML or improves SEO.

If the source has no subtitle and you have already shipped a fabricated `description`, the fix is one line: delete the field. Do not move the text into the body to "preserve it" — it was never source content.

### Browser tab `<title>` and SEO meta tags

Mintlify generates the browser tab `<title>` for every page from a fixed template:

```
<frontmatter.title> - <docs.json.name>
```

This means three things matter for browser tab parity:

| Lever | Where | Effect |
|---|---|---|
| Page-specific portion | `frontmatter.title` per MDX | First half of the browser tab — also drives the page H1 |
| Site-wide suffix | `docs.json` → `name` | Second half of the browser tab — also drives the navbar product label |
| Separator | Hardcoded by Mintlify | ` - ` (hyphen with surrounding spaces). **No native override.** |

What is **not** available, despite often being requested:

- **No `seo.title` or `metatags.title` override for the browser tab.** Mintlify's `seo.metatags` block in `docs.json` and the SEO frontmatter fields (`og:title`, `twitter:title`, `og:description`, `twitter:description`, `og:image`, `keywords`, etc.) all affect Open Graph / Twitter card sharing previews and search-engine snippets — not the browser tab itself. Setting `og:title` does not change `document.title`.
- **No way to change the ` - ` separator.** If the source uses ` | `, ` — `, or any other separator, the preview will still render ` - `. Document this as a known divergence; do not try to patch it.
- **No `custom.js` workaround.** Mintlify v4 does not execute root-level JS — see *No arbitrary custom JavaScript in Mintlify* below. A `document.title = ...` script will not run.

The Mintlify-supported parity options:

1. **Match what Mintlify can do.** Set `frontmatter.title` to the page-specific portion the source uses on its browser tab, and `docs.json.name` to the short site name the source uses on its browser tab. Accept the ` - ` separator as a known, documented divergence.
2. **Pick one when source's H1 and browser tab diverge.** `frontmatter.title` controls both; they cannot differ. Common patterns:
   - Source H1 = "Welcome to Foo Developer Documentation!", source browser tab = "Welcome | Foo". Set `frontmatter.title: "Welcome"` (matches the tab) and put the long H1 in the MDX body as `# Welcome to Foo Developer Documentation!`. The H1 is preserved verbatim per the project's content-preservation rule, and the browser tab matches the source's tab format (modulo separator).
   - Source H1 = browser tab. Easiest case — use the verbatim title in `frontmatter.title`.
3. **SEO / sharing parity.** For Open Graph / Twitter card titles, use the per-page frontmatter overrides (`og:title`, `twitter:title`). These do not affect the browser tab but improve link-preview parity on social platforms.

When auditing browser tab parity, check every page that mirrors a source URL by loading it locally in `mint dev` and reading the actual browser tab — not just the frontmatter. The frontmatter `title` plus `docs.json.name` is the source of truth, but a wrong `name` field at the site level produces a uniform error across every page that's invisible in any single page's frontmatter diff.

### No arbitrary custom JavaScript in Mintlify

Mintlify v4 has no `customScripts`, no `head` field in `docs.json`, no `<script>` injection mechanism. Root-level `.js` files (the obvious analogue to `custom.css`) are inlined as Next.js data payloads via `self.__next_f.push([1, "..."])` and are **not** executed as scripts. The file is served, the build succeeds, and nothing runs in the browser. The failure is silent.

Symptoms that an agent has fallen into this trap:

- A `custom.js` file exists in the repo root.
- The DOM never contains the elements the script was supposed to inject.
- DevTools network shows the file as `text/javascript` but DevTools console logs from the script never appear.
- View-source shows the file's contents wrapped in `self.__next_f.push([1, "<file contents as a string>"])`.

The supported paths for runtime behavior, in order of preference:

| Path | Use when | How |
|---|---|---|
| Native Mintlify config / components | Almost every common ask | `docs.json` settings, components, `url:` frontmatter, `type: "github"` navbar links — see *Navbar and external sidebar links* below |
| Build-time mutation of `docs.json` | "Live-ish" data that doesn't need per-pageview freshness (star counts, version strings) | Node script + `npm run` entry + CI / pre-commit hook — see *Live-ish data via build-time updater* below |
| Google Tag Manager | Truly in-browser JS that nothing else can satisfy | `"integrations": { "gtm": { "tagId": "GTM-XXXXXX" } }` in `docs.json`, then a custom-HTML tag in GTM |

Before reaching for any of the three, confirm with the user that the requirement actually needs runtime JS. Most chrome / navbar / sidebar customization needs do **not** — they have native config solutions that the next two sections cover.

### Site root `index.mdx` and the sidebar

`index.mdx` is the site homepage — Mintlify serves it at `/` and the navbar logo links there by default. It is reachable without a sidebar entry. The recurring trap is adding `"index"` (or the homepage slug) to an existing sidebar group's `pages` array without checking the source. That can produce a duplicate sidebar entry whose label depends on the homepage's frontmatter:

- If `index.mdx` has `sidebarTitle: "Home"` and the next page in the same group is `getting-started.mdx` (whose `title` is "Overview"), the sidebar shows `Home` *and* `Overview` stacked at the top of Getting Started — neither matches the source, which usually shows just one entry.
- If `index.mdx` has no `sidebarTitle` and its `title` happens to match the next page's title, the sidebar shows two identically-labelled entries that both link to different URLs. Reviewers read this as a bug.

When the source has no Home row in that group, drop `"index"` from its `pages` array. The homepage stays at `/` (logo click + direct URL still work), and the sidebar's first entry becomes whatever the source shows. If the source has a top-level Home tab or the page needs navigation-backed search/assistant indexing, register it as a dedicated top-level page/tab instead of burying it in a docs group.

```json
// Before — duplicate "Home" / "Overview" at the top of Getting Started
{
  "group": "Getting Started",
  "pages": [
    "index",
    "docs/getting-started",
    "docs/authentication"
  ]
}

// After — sidebar matches source
{
  "group": "Getting Started",
  "pages": [
    "docs/getting-started",
    "docs/authentication"
  ]
}
```

Notes:

- A deliberately hidden `index.mdx` is an intentional exception to the `/preview-qa` Gate 1 "no orphan MDX" rule, but hidden pages are excluded from Mintlify search and assistant indexing by default. Register the homepage at the top level when discoverability is required.
- If the source site *does* show a "Home" entry in the sidebar (some ReadMe.io and GitBook themes do this), keep `index` in the group but verify the label matches the source — usually `sidebarTitle: "Home"` on `index.mdx` plus dropping any other "Overview" / "Welcome" page that would duplicate it.
- The same trap applies to landing-page slugs introduced by `/create-landing-page` (e.g. `developers/index.mdx` for a dropdown root). If the dropdown's logo or first tab already lands the user on that page, do not also list it as a sidebar entry inside the dropdown's groups.

Verifying: load the preview in `mint dev`, click each tab/dropdown, and check the first one or two sidebar entries against the source. If you see a "Home" or duplicate-label entry the source doesn't have, look in `docs.json` for `"index"` (or your site's root slug) inside a sidebar group and remove it.

### Single-page wrapper groups create duplicate sidebar entries

A sidebar `group` whose `pages` array contains exactly one entry — and whose group label matches that page's `sidebarTitle` (or `title` if `sidebarTitle` is unset) — renders as **two stacked, identically-labelled rows** in the sidebar:

```
Overview          <- the group header
  Overview        <- the lone page inside the group
```

The group header is itself clickable scaffolding, so the user sees `Overview > Overview` and assumes one of them is broken. This is a sibling defect to *Site root `index.mdx` and the sidebar* above: both produce duplicate sidebar entries, both are silent under `mint validate`, and both are fixed by removing one wrapping layer rather than renaming a page.

The trap usually shows up in API reference tabs where the converter wraps a single `introduction.mdx` (or `overview.mdx`) in a one-page group so it can sit next to multi-page sibling groups (`V2 endpoints`, `V1 endpoints`, etc.). The wrapping reads as "every section is a group, for symmetry", but the symmetric fix is wrong here because Mintlify tabs accept `pages` arrays that mix string entries and group objects natively.

**Before — `Overview > Overview` duplicate**

```json
{
  "tab": "API reference",
  "groups": [
    {
      "group": "Overview",
      "pages": ["api-reference/introduction"]
    },
    {
      "group": "V2 endpoints (with fee tiers)",
      "pages": [/* ... */]
    },
    {
      "group": "V1 endpoints (without fee tiers)",
      "pages": [/* ... */]
    }
  ]
}
```

**After — single Overview entry, peer of V2 / V1**

```json
{
  "tab": "API reference",
  "pages": [
    "api-reference/introduction",
    {
      "group": "V2 endpoints (with fee tiers)",
      "pages": [/* ... */]
    },
    {
      "group": "V1 endpoints (without fee tiers)",
      "pages": [/* ... */]
    }
  ]
}
```

Notes:

- Switch the tab from `groups` to `pages`. Tab-level `pages` accepts both string slugs and group objects in the same array — that is the documented way to mix a top-level page with sibling groups.
- The `introduction.mdx` page's own `sidebarTitle: "Overview"` (or `title: "Overview"` if no sidebar title) becomes the single rendered label. Verify it matches the source's overview / intro label verbatim.
- If the introduction page also carries an `icon:` in its frontmatter, it now renders next to the sidebar entry — useful for visual peer parity with the V2 / V1 groups when those carry icons. See *Icon hierarchy: top-level only* below for when to keep / drop the icon.
- The same pattern applies inside `dropdowns` and `anchors`: any single-page wrapping group whose label matches its sole child should be flattened to a string slug entry.

Detection: open `docs.json` and look for any `{ "group": "X", "pages": ["<one slug>"] }` shape. For each match, open the slug's MDX and compare its `sidebarTitle` / `title` to the group label. If they match (case-insensitive), the entry is a duplicate-Overview defect.

This is a `/preview-qa` Gate 3 check.

### Icon hierarchy: top-level only

Mintlify renders a sidebar `icon` next to every `group` header (from `docs.json`) and next to every page entry (from `frontmatter.icon`). When icons are applied at every level — top-level groups, sub-groups inside them, and individual pages — the sidebar becomes visually noisy: the icons stop signaling "this is a major section" and start competing with each other for the reader's attention.

The rule: **icons are reserved for top-level major sections.** Sub-groups and individual pages stay icon-free.

Concretely:

| Sidebar element | Icon? |
|---|---|
| Top-level group inside a tab (e.g. `Get started`, `Authentication`, `Concepts`) | Yes — pick an icon that signals the section's purpose. |
| Top-level entry inside a tab that is a **single page** flattened from a one-page group (e.g. an `Overview` page sitting as a peer of `V2 endpoints` / `V1 endpoints` — see *Single-page wrapper groups create duplicate sidebar entries* above) | Yes — keep the page-level `frontmatter.icon` so the entry reads as a peer of its iconed siblings, not as an orphaned subpage. |
| Sub-group inside a top-level group (e.g. `Account`, `Market data`, `Trading` inside `V2 endpoints`) | **No** — strip the `icon:` from the sub-group entry in `docs.json`. |
| Individual page inside a group (e.g. `quickstart.mdx`, `concepts/orders.mdx`) | **No** — strip the `icon:` from the page's MDX frontmatter. |

The visual logic: a top-level group icon tells the user "this is a section". A sub-group or page icon next to it adds nothing — the parent already established the section, and the icon now reads as decorative clutter. The exception is the single-page-peer case: when a flattened single page sits next to iconed group siblings at the same level, dropping its icon leaves it looking orphaned (a label without an icon next to two labels with icons), so it keeps the page-level icon to maintain peer symmetry.

How to apply consistently across an existing site:

1. **Audit `docs.json`** for every `{ "group": "...", "icon": "...", "pages": [...] }`. Categorize each as either top-level (inside a `tab` / `dropdown` / `anchor` directly) or nested (inside another group's `pages`). Strip `icon` from every nested entry.
2. **Audit MDX frontmatter** for every `icon:` field. For each match, ask: is this page a top-level peer of iconed sibling groups (rare — typically one per tab)? If yes, keep. If no — strip the `icon:` line.
3. **Re-run `mint dev`** and visually scan the sidebar of each tab. Every top-level row should have an icon; no sub-row should.

The two recurring traps:

- **Auto-conversion adds icons to every entry.** Some converters (and some boilerplate `docs.json` templates) attach icons to every group and page they create. The fix is the audit pass above — converters do not know which entries are "major sections".
- **The single-page-peer case is missed.** When flattening a single-page wrapper group (per the previous section), the page's own frontmatter `icon` becomes load-bearing for peer symmetry. Don't strip it as part of the icon audit; check sibling levels first.

Verification: open the rendered sidebar in `mint dev` and read the icon column top-to-bottom for each tab. Every iconed row should be a top-level major section; every sub-row should be icon-free. If the icon column has gaps inside a top-level section's children but is dense at the top level, the hierarchy is correct.

This is a `/preview-qa` Gate 3 check.

### Navbar and external sidebar links

These are the two ask patterns that most often tempt an agent into writing custom JS. Both have native Mintlify solutions.

**GitHub icon + label in the navbar (with or without a star count):**

`navbar.links` supports a `type: "github"` entry that renders Mintlify's GitHub mark plus an arbitrary label. Place it last in `navbar.links` to land at the right end of the navbar.

```json
{
  "navbar": {
    "links": [
      { "label": "Contact us", "href": "https://example.com/contact" },
      {
        "type": "github",
        "label": "63k",
        "href": "https://github.com/owner/repo"
      }
    ]
  }
}
```

`navbar.primary` also supports `type: "github"` for a primary-position GitHub link, but `navbar.links` is the right home when the GitHub link is one of several nav items.

**External link in the sidebar (e.g. a "GitHub" entry at the bottom of the User Guide):**

Create a stub MDX file with `url:` frontmatter. Mintlify auto-detects external URLs, sets `target="_blank"`, and adds an external-link arrow icon next to the label.

```mdx
---
title: "GitHub"
sidebarTitle: "GitHub"
icon: "github"
url: "https://github.com/owner/repo"
---
```

Reference the stub as a **string slug** in `docs.json` `pages`, not as a nested group, so it renders as a single clickable item rather than a collapsible header with a chevron:

```json
{
  "group": "Help and updates",
  "pages": [
    "developers/help",
    "developers/changelog"
  ]
},
"developers/github"
```

The stub MDX file's body content is irrelevant — Mintlify renders the external link before any user can read the page. Keep the file empty or add a single line explaining why it exists.

**Sidebar entries that jump to another *internal* page (not the page's own slug):**

The same `url:` frontmatter pattern works for internal targets — the source site's "API Explorer" sidebar entry that jumps to the first auto-generated reference page, the "Quickstart shortcut" that lands on a deep page in another tab, etc. Mintlify treats `url:` as the link href verbatim: external URLs get `target="_blank"` and the external-link arrow, internal paths render as a plain in-app link.

```mdx
---
title: "API Explorer"
sidebarTitle: "API Explorer"
url: "/api-reference/achievements/achievements"
---
```

When to prefer `url:` frontmatter vs `docs.json` `redirects`:

| Lever | Covers | Trade-offs |
|---|---|---|
| `url:` frontmatter on a stub MDX | Sidebar-click navigation only | Cleanest. The stub URL itself remains reachable; if a user types or bookmarks `/docs/api-explorer`, they land on an empty stub page |
| `docs.json` `redirects` rule + stub MDX | Both sidebar clicks **and** direct URL hits | More thorough. Required when the stub URL might be deep-linked (legacy bookmarks, search engine results, hand-typed URLs from migration). The `redirects` block runs server-side so the stub page is never rendered |

For migrations from ReadMe.io, GitBook, or any platform whose URLs are likely indexed or bookmarked, prefer the `redirects` approach so old links don't dead-end on a blank stub. Example for the Achievers migration that surfaced this pattern:

```json
{
  "redirects": [
    { "source": "/docs/api-explorer", "destination": "/api-reference/achievements/achievements" },
    { "source": "/docs/api-status",   "destination": "https://status.example.com" }
  ]
}
```

The stub MDX still has to exist (Mintlify groups only accept real page slug strings — see *External `href` is not allowed inside a group's `pages` array* below), but the redirect intercepts navigation before the stub renders. Add a `<Card>` or one-line `>` blockquote in the stub body as a graceful fallback in case the redirect ever misfires (e.g. local-dev caching).

### External `href` is not allowed inside a group's `pages` array

Mintlify's schema is strict about what can live inside a sidebar group's `pages` array: **page slug strings or nested group objects only.** External `href` entries — the `{ "anchor": "...", "href": "..." }` shape that works inside `tabs`, `dropdowns`, `menus`, `navbar.links`, `navigation.global.anchors`, and `footer` — are rejected. The exact failure is silent for some Mintlify versions (the entry is dropped from the rendered sidebar) and a parse error for others; either way the link does not appear.

```json
// INVALID — Mintlify drops or rejects this entry
{
  "group": "Development",
  "pages": [
    "docs/api-changelog",
    { "anchor": "API Status", "href": "https://status.example.com" }
  ]
}
```

The supported workarounds, in order of cleanliness:

1. **Promote to a `tab`, `dropdown` anchor, or `navbar` link.** External links are first-class citizens at every navigation level *except* group-`pages`. If the source shows the link in a top horizontal bar, route it to `navigation.tabs` (with `href`) per *Top horizontal bar — one row, one config surface* in `SKILL.md`. If it belongs at the right of the navbar, route it to `navbar.links` or `navbar.primary`. Use sidebar workarounds only when the source actually shows the link inside a sidebar group.
2. **Stub MDX + `url:` frontmatter** — see *External link in the sidebar* above. Cleanest for sidebar entries; covers sidebar clicks but not direct URL hits.
3. **Stub MDX + `docs.json` `redirects`** — see *Sidebar entries that jump to another internal page* above. Covers both sidebar clicks and direct URL hits; required when migrating from a platform whose URLs are likely indexed or bookmarked.

All three options keep `docs.json` schema-valid. The trap is iterating through invalid `{ "anchor", "href" }` shapes inside `pages` because the failure mode varies by Mintlify version and the schema error message is not always actionable. Verify the schema once at [mintlify.com/docs.json](https://mintlify.com/docs.json) instead of guessing.

### Live-ish data via build-time updater

When the ask is "show a value from a live API in the navbar / sidebar / page" (most often a GitHub star count, a release version, a download number), the lowest-friction supported answer is a build-time updater script that fetches the value and patches `docs.json` (or an MDX file) in place.

Pattern:

1. Add a Node script at `scripts/<name>.mjs` that reads the file, fetches the live value, formats it, and writes the file back only if the formatted value changed.
2. Add `"update-<thing>": "node scripts/<name>.mjs"` to `package.json`.
3. Wire `npm run update-<thing>` into a pre-commit hook, a scheduled GitHub Action, or just a manual command — depending on how fresh the value needs to be.

Example for a GitHub star count that updates the label of a `type: "github"` navbar link:

```js
// scripts/update-github-stars.mjs
import { readFile, writeFile } from "node:fs/promises";

const url = "https://api.github.com/repos/owner/repo";
const headers = process.env.GITHUB_TOKEN
  ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
  : {};

const { stargazers_count } = await fetch(url, { headers }).then(r => r.json());
const label = `${Math.floor(stargazers_count / 1000)}k`;

const docs = JSON.parse(await readFile("docs.json", "utf8"));
const githubLink = docs.navbar.links.find(l => l.type === "github");

if (githubLink && githubLink.label !== label) {
  githubLink.label = label;
  await writeFile("docs.json", JSON.stringify(docs, null, 2) + "\n");
  console.log(`Updated GitHub star label -> ${label}`);
}
```

Notes:

- Only writes when the formatted value changes — safe to run from a pre-commit hook or scheduled CI job without producing noisy diffs.
- Honor a `GITHUB_TOKEN` env var so CI can hit the higher rate limit (5000/hr instead of 60/hr).
- Format the value the same way the source site does (e.g. floor-to-thousands → `"63k"`, not `"63350"` or `"63.4k"`) so the docs match the source visually.
- Do not write a `custom.js` to fetch the value at runtime — see *No arbitrary custom JavaScript in Mintlify* above.

### Flattening `tabs` to sibling `groups`

Mintlify `tabs` always render as a visible toggle bar above the page content (the "User Guide / API docs" buttons, the "Payments / Connect / Issuing" buttons on Stripe, etc.). The buttons are intrinsic to the `tabs` shape — there is no setting that hides them. The decision is parity-driven in both directions:

- Source has a top-of-page tab toggle → use `tabs`. See *Restructuring a large, flat navigation* in `SKILL.md` for taxonomy and parity rules when adding tabs.
- Source has no top-of-page tab toggle → use sibling `groups`. The flatten pattern below is the canonical fix.

The flatten direction is the more common defect: while wrapping content under an anchor or dropdown to satisfy Mintlify's "one type of child per level" nesting rule, an agent picks `tabs` as the wrapping primitive and accidentally ships a toggle the source does not have. The fix is structural — replace `tabs` with `groups` and inline the inner-group wrappers.

**Before — top-of-page tab toggle, source has no such toggle**

```json
{
  "anchor": "Documentation",
  "tabs": [
    {
      "tab": "User Guide",
      "groups": [
        { "group": "Introduction", "pages": ["..."] },
        { "group": "Connect",      "pages": ["..."] }
      ]
    },
    {
      "tab": "API docs",
      "groups": [
        { "group": "API Reference", "pages": ["..."] },
        { "group": "pw.io",         "pages": ["..."] }
      ]
    }
  ]
}
```

**After — sibling groups, no toggle, same pages reachable**

```json
{
  "anchor": "Documentation",
  "groups": [
    {
      "group": "User Guide",
      "pages": [
        { "group": "Introduction", "pages": ["..."] },
        { "group": "Connect",      "pages": ["..."] }
      ]
    },
    {
      "group": "API docs",
      "pages": [
        { "group": "API Reference", "pages": ["..."] },
        { "group": "pw.io",         "pages": ["..."] }
      ]
    }
  ]
}
```

Notes:

- The transformation collapses one level of nesting: the `tab` → `groups` → `group` pattern becomes `group` → `pages` (with the inner groups inlined as items in the parent's `pages` array).
- Page-set parity must hold: `set(new_unique_pages) == set(old_unique_pages)`. Validate this before saving the file.
- If the outer `User Guide` and `API docs` headings should themselves be collapsible (chevrons next to each), apply *Wrapper-group demotion for collapsible sections* below — the two patterns compose cleanly.
- The same flatten pattern applies at the navigation root (`navigation.tabs` → `navigation.groups`) and inside dropdown `anchors`.

### Wrapper-group demotion for collapsible sections

Mintlify rule: top-level groups inside a tab are always rendered fully expanded and cannot be collapsed. `expanded: false` only takes effect on **nested** groups (groups inside another group's `pages` list).

When the source site shows every sidebar section with its own chevron toggle — for example Pathway's `/developers/user-guide/...` sidebar where each of Introduction, Connect, Transform, Temporal Data, etc. collapses independently — the preview needs **wrapper-group demotion**: wrap every original top-level group inside a single outer "wrapper" group. This demotes the originals to nested status, making them eligible for `expanded: false`.

Pick a wrapper name that matches the tab/anchor label so it reads naturally if it ever surfaces visually (`"User Guide"` for the User Guide tab, `"API docs"` for the API docs tab, `"Templates"` for the Templates anchor).

**Before — top-level groups, no chevrons possible**

```json
{
  "tab": "User Guide",
  "groups": [
    { "group": "Introduction", "pages": ["..."] },
    { "group": "Connect",      "pages": ["..."] },
    { "group": "Transform",    "pages": ["..."] }
  ]
}
```

**After — wrapper-group demotion, every section collapsible**

```json
{
  "tab": "User Guide",
  "groups": [
    {
      "group": "User Guide",
      "pages": [
        { "group": "Introduction", "expanded": false, "pages": ["..."] },
        { "group": "Connect",      "expanded": false, "pages": ["..."] },
        { "group": "Transform",    "expanded": false, "pages": ["..."] }
      ]
    }
  ]
}
```

Notes:

- Set `"expanded": false` on every demoted section. Mintlify auto-expands the section that contains the active page; the rest stay collapsed. This matches the typical source pattern (the visited section opens, others close).
- The wrapper itself stays expanded — that is what gives the chevrons to the sections inside.
- Apply the same pattern inside dropdown `anchors` if the dropdown's content sections need to be collapsible. The wrapping-anchor pattern from *Per-dropdown sidebar anchors* below already nests groups under a container anchor; just add `expanded: false` on each inner group.
- If a tab also has section-specific top-of-sidebar buttons, combine wrapper-group demotion with per-dropdown `anchors` — they are compatible.

Validate after restructuring:

- `set(new_unique_pages) == set(old_unique_pages)` — no page lost, no page duplicated.
- `mint validate` (or equivalent) passes.
- `mint dev` shows a chevron next to every section header that the source has a chevron on, and toggling them open/closed matches source behavior.

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

**Critical: the wrapping anchor's label is visible.**

The wrapping anchor (the one with `groups` instead of `href`) is not invisible scaffolding — Mintlify renders its `anchor` label as a clickable item in the sidebar (`<a class="link nav-anchor ...">` inside `#sidebar-content`). It looks like a small blue tab labelled with whatever string you put in `anchor`. So if you wrap content under `"anchor": "Documentation"`, a "Documentation" tab appears in the sidebar of every page in that dropdown — even if no such tab exists on the source site. This is the most common chrome defect introduced by the wrapping-anchor pattern.

Choose the wrapper label deliberately:

- **If the source has a matching label** in the same sidebar position, use that exact wording. The wrapper renders as the tab the source already shows — parity achieved with no extra cleanup.
- **If the source has no matching label**, the wrapping-anchor pattern as shown above introduces a visible tab the source does not have. Either pick a label that matches an existing source element, or do not use the wrapping-anchor pattern at all (drop the section-specific link-button anchors and let `groups` sit directly under the dropdown — the sidebar buttons go away, but no extraneous "Documentation" / "Templates" tab appears).

**Schema warning: the obvious "fix" breaks the navbar.**

Do not try to remove the wrapping anchor by putting `groups` (or `tabs`) as a sibling of `anchors` inside a `dropdown`. Mintlify rejects the structure — the navbar disappears entirely. The schema enforces the "one type of child per level" rule strictly: a `dropdown` may contain `anchors` *or* `groups` *or* `tabs`, but not a mix. Either the link-button anchors stay (with a wrapping anchor for the groups, accepting the visible label trade-off above), or the link-button anchors come out (and `groups` sits directly under the dropdown).

```json
// INVALID — Mintlify rejects, navbar disappears
{
  "dropdown": "Pathway Templates",
  "anchors": [ /* link buttons */ ],
  "groups":  [ /* page groups */ ]
}
```

If you must keep the link-button anchors *and* hide the wrapper label (because the source has neither a wrapper tab nor a way to combine link-buttons and groups under the same dropdown), the only Mintlify-supported workaround is targeted CSS in `custom.css` against the wrapper's specific class and text. Mintlify v4 does not run root-level `custom.js`, so a JS-based hide is not reliable — see *No arbitrary custom JavaScript in Mintlify* above.

Verify after editing:

- JSON parses with `cat docs.json | python3 -m json.tool` (or equivalent).
- Each dropdown shows its own anchors and only its own anchors when navigated to.
- The wrapping anchor's label either matches a label that exists on the source sidebar, or has been intentionally accepted as a known divergence and documented in the QA report.
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
