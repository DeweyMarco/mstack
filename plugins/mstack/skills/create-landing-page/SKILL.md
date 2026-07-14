---
name: create-landing-page
description: Build custom Mintlify docs landing pages (index.mdx) with source-backed company assets, hero sections, navigation cards, quick-start steps, and responsive dark-mode support. Use when creating or redesigning a documentation landing page, index.mdx, custom Mintlify homepage, or branded docs home.
---

# Create Landing Page

Repeatable workflow for building custom Mintlify docs landing pages (`index.mdx`). For migrations, this is replica-first: match the source landing page's visible hierarchy, copy, CTAs, card structure, and brand assets before applying Mintlify polish.

## Before You Start

1. Read the project's `docs.json` to understand navigation structure, brand colors, and existing page paths.
2. Read the parity manifest when present so landing-page cards and CTAs point to source-backed page paths.
3. Inventory the company's available assets before choosing the visual direction. When a source site, brand repository, or supplied asset folder exists, read [references/company-assets.md](references/company-assets.md) and map each useful asset to a landing-page role.
4. If the user provided an original docs/homepage URL, inspect its rendered page plus raw HTML/CSS for visible colors, logo, favicon, hero/background media, top-level layout, section order, card counts, CTA labels, and footer/header structure before designing. Prefer those source-site assets and styles over stale or generic `docs.json` values.
5. Confirm which docs pages already exist so all card/button `href` values point to real paths.
6. Verify the `mint` CLI runs and the `data-docs-theme` in use (`maple`, `mint`, `palm`, `willow`, `aspen`, `luma`, `linden`, `almond`, `sequoia`).
7. Decide whether `index` belongs in navigation based on the source chrome and discoverability requirements (see "docs.json Registration" below). Never add it to an existing sidebar group by default.

## Replica-first landing rule

When the task is migrating or replicating a company's docs site, mirror the source homepage first:

- Preserve the source section order unless it conflicts with Mintlify rendering constraints.
- Preserve visible copy for headings, subtitles, card titles, card descriptions, and CTA labels.
- Match card/grid counts, repeated CTA patterns, hero media, navbar/footer links, and first-fold hierarchy.
- Use Mintlify-native components or Tailwind utilities to implement the structure, but do not swap in a generic docs-template layout just because it looks cleaner.
- If a source element cannot be reproduced safely in Mintlify, approximate it visibly and record the delta for `/preview-qa` and `/han-review`.

## Company assets are the default visual material

When company assets are available, build the page around them instead of reaching first for generic gradients, stock illustrations, or unrelated iconography. Read [references/company-assets.md](references/company-assets.md) for the inventory, selection, localization, and verification workflow.

- Prefer the company's actual wordmark, product UI, diagrams, illustrations, textures, and approved photography in the same roles they serve on the source site.
- Preserve original SVGs and the highest-resolution raster source. Do not recreate a logo from a screenshot, upscale a small image, or substitute a generic icon when an approved asset exists.
- Copy approved assets into the docs repo and use root-relative paths. Do not leave critical landing-page visuals hotlinked to the source website or a temporary CDN URL.
- Match light/dark variants and intended crops. A correct file used against the wrong background or cropped around the wrong focal point is still a parity defect.
- If the source has no suitable visual for a section, use restrained Mintlify-native layout and typography; do not invent a new brand language.

## Critical Mintlify Gotchas (read this before writing any JSX)

These issues cost real time on past projects. Account for them upfront.

### Gotcha 1: Mintlify strips semantic HTML5 elements

MDX compilation silently removes `<header>`, `<footer>`, and `<nav>` elements and all their children. The page will render with missing chunks and no error.

**Rule:** Always use `<div>` for structural wrappers on a custom landing page. Reserve `<section>` for the hero (it survives). For accessibility, add `role` attributes instead:

```mdx
{/* BAD — will be stripped from output */}
<header className="w-full bg-white">...</header>
<nav className="flex gap-4">...</nav>
<footer className="bg-black">...</footer>

{/* GOOD — renders reliably */}
<div role="banner" className="w-full bg-white">...</div>
<div role="navigation" className="flex gap-4">...</div>
<div role="contentinfo" className="bg-black">...</div>
```

Also safe: `<section>`, `<div>`, `<span>`, `<a>`, `<img>`, `<svg>`, `<h1>`–`<h6>`, `<p>`, `<ul>`/`<li>`, `<button>`.

### Gotcha 2: `mode: "custom"` hides the sidebar but keeps the navbar and tabs

`mode: "custom"` hides the sidebar, table of contents, and footer — but it keeps the top navbar and the product tabs bar. For a fully chromeless landing page with its own header, you need CSS to also hide the navbar and tabs and to reset the content offsets that the layout system still applies.

**Put this CSS in a root-level `custom.css` file, NOT in an inline `<style>` block.** Mintlify auto-loads `custom.css` and reliably injects it as `<style data-custom-css-index="0">`. Inline `<style>{`...`}</style>` blocks in `index.mdx` are silently stripped once they grow beyond a small handful of rules (see Gotcha 3) — so even the chrome-hiding CSS can vanish without warning when other rules pile up. These selectors are tested against the `maple` theme; other themes (`luma`, `aspen`, etc.) share most of them but verify against the rendered DOM if anything is off:

```css
/* custom.css at the repo root */
html[data-current-path="/"] #navbar,
html[data-current-path="/"] .nav-tabs,
html[data-current-path="/"] div:has(> .nav-tabs) {
  display: none !important;
}
html[data-current-path="/"] #content-container {
  margin-left: 0 !important;
  padding-top: 0 !important;
  gap: 0 !important;
  min-height: 0 !important;
}
html[data-current-path="/"] #content-area {
  width: 100% !important;
  max-width: none !important;
  min-width: 0 !important;
  margin-top: 0 !important;
  padding: 0 !important;
}
html[data-current-path="/"] #content {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
}
```

Why each rule matters:

- `#navbar` — both desktop and mobile navbars share this id. `mode: "custom"` keeps the navbar visible; hide it here when you're providing your own header.
- `.nav-tabs` — the product tabs list (e.g. "Get Started / Journeys / Integrations"). `mode: "custom"` keeps this visible.
- `div:has(> .nav-tabs)` — the tabs' direct parent wrapper (`<div class="hidden lg:flex px-12 h-12">`) has no id and leaves a 48px empty strip if not removed. `:has()` is supported in all modern browsers and reliably targets it.
- `#content-container` — applies `lg:ml-[19rem]` to reserve space for the sidebar and `pt-[120px]` for the mobile navbar. The sidebar is already hidden by `mode: "custom"`, but the layout margin may still be applied by the theme. Both offsets must be zeroed.
- `#content-area` and `#content` — apply a max-width that centers the content and leaves white space on either side. Override to 100% for true full-bleed.

**Do not use `div:has(> #navbar)`** — the desktop `#navbar`'s parent contains the whole page layout, so you would hide the entire site.

### Gotcha 3: Style with Tailwind utilities, never with custom CSS classes in an inline `<style>` block

This is the single biggest failure mode for landing pages. Mintlify's MDX compiler silently drops large `<style>{`...`}</style>` blocks during compilation. The class names on your JSX elements survive, but the CSS rules defining those classes do not — so the page renders as a wall of unstyled text. Symptoms: classes like `class="my-hero"` appear in the rendered HTML, but no matching `.my-hero { ... }` rule is present in any `<style>` tag.

**Strict rules to make styling reliable:**

1. **Style every element with Tailwind utility classes inline on the JSX.** Mintlify's build pipeline compiles them into `mint-` prefixed classes (e.g. `mint-rounded-xl`, `mint-bg-[#0c244c]`) inside `<style data-custom-css-index="0">`. This pipeline is reliable and you can verify it survived by greping the rendered HTML for `mint-` prefixed classes.
2. **Do NOT define custom CSS classes for the page** (`.symmetry-hero`, `.product-card`, etc.) inside an inline `<style>{`...`}</style>` block. Even when the syntax looks correct, MDX compilation drops them once the block grows past trivial size.
3. **`custom.css` at the repo root is the only reliable place for page-scoped CSS rules.** Mintlify auto-loads it and injects it as `<style data-custom-css-index="0">`. Use it for the chrome-hiding rules (Gotcha 2) and any unavoidable custom selectors. Scope homepage rules with `html[data-current-path="/"]` to avoid leaking to other pages.
4. **Never put a giant inline `<style>{`...`}</style>` block at the top of `index.mdx` to define visual classes.** If you find yourself writing more than ~25 lines of CSS inline, stop and move it to `custom.css`.

```mdx
{/* BAD — large inline style block; rules silently disappear in production */}
<style>{`
  .my-hero { background: linear-gradient(...); padding: 5rem 0; }
  .my-card { border: 1px solid #e5eaf0; border-radius: 12px; padding: 24px; }
  /* ...300 more lines... */
`}</style>
<section className="my-hero">...</section>
<div className="my-card">...</div>

{/* GOOD — inline Tailwind, compiles via the Mintlify pipeline */}
<section className="relative overflow-hidden bg-gradient-to-br from-[#0c244c] to-[#13315c] py-20">...</section>
<div className="rounded-xl border border-[#e5eaf0] dark:border-white/10 p-6">...</div>
```

Why Tailwind survives where custom classes don't: Tailwind utilities are processed by Mintlify's CSS pipeline at build time, deduplicated, and emitted as a separate compiled stylesheet. Inline `<style>` blocks go through the MDX pipeline, which treats `<style>{` as a JSX expression and is fragile under length and special characters.

### Gotcha 4: Inline SVG icons must be a single `<path>`, not multiple shape elements

MDX/JSX processing can silently drop individual children from an inline `<svg>` when the icon is composed of multiple shape elements like `<circle>`, `<rect>`, `<line>`, plus `<path>`. The result is a half-rendered icon (e.g., a magnifying glass that shows only the diagonal handle and is missing the lens circle), with no compile error and no warning.

**Rule:** Build every inline SVG icon as a single `<path>` with a `d` attribute that draws the entire shape. Do not mix `<circle>`, `<rect>`, `<line>`, etc. with `<path>` siblings inside the same `<svg>`.

```mdx
{/* BAD — circle is silently dropped on some Mintlify builds; only the handle renders */}
<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
  <path d="M21 21l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
</svg>

{/* GOOD — single path draws lens + handle in one stroke; renders reliably */}
<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
  <path
    d="M21 21l-5.2-5.2m0 0a7.5 7.5 0 1 0-10.6-10.6 7.5 7.5 0 0 0 10.6 10.6z"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</svg>
```

Additional rules for inline SVG icons:

- Use **inline `style={{flexShrink: 0}}`** instead of the `flex-shrink-0` class on icons inside flex containers — flex parents can otherwise squeeze the icon to zero width even when `width`/`height` attributes are set.
- Use an icon whose exported SVG has been inspected and reduced to one `<path>`. Heroicons, Lucide, and Phosphor often use multiple SVG elements, so the library name alone does not make an icon safe for this constraint.
- Prefer Font Awesome icons via the Mintlify `<Card icon="..."/>` prop or `<Icon icon="..."/>` component when an icon sits inside a Mintlify component — they are server-rendered and never affected by this issue.
- After adding an inline SVG, verify it renders fully in the browser. A partial icon (e.g., only the path, missing the circle) is the signature symptom of this gotcha.

### Gotcha 5: Confirm rendered output during iteration

After meaningful changes, fetch the dev server HTML and verify two separate things — that the **content** rendered AND that the **styles** are actually being applied. Failures in Gotcha 3 (CSS rules getting stripped) leave the elements present but unstyled, so a content-only check is not enough.

```bash
# 1. Content check — distinctive text from each major section must appear
curl -s http://localhost:3000/ | grep -c 'Book demo'
# expect: > 0

# 2. Style check — Tailwind compiled output must be present
curl -s http://localhost:3000/ | grep -o 'mint-[a-z0-9-]\+' | wc -l
# expect: hundreds-to-thousands of mint- prefixed classes for a real landing page

# 3. Anti-pattern check — there should be no orphaned custom class names without matching rules
# If you used a custom class like .symmetry-hero, confirm a matching rule exists somewhere:
curl -s http://localhost:3000/ | grep -c 'symmetry-hero {'
# expect: > 0 if you defined the class; 0 here means the rule was stripped (see Gotcha 3)
```

If a visible piece of text does not appear in the rendered HTML, an element is probably being stripped (see Gotcha 1) or a parent is `display:none`. If the text is there but the page looks unstyled, your CSS rules were stripped (see Gotcha 3) — switch to Tailwind utilities and move any remaining custom rules to `custom.css`. Do not rely on visual inspection alone — MDX silently drops content and CSS.

## docs.json Registration

`index.mdx` is served at `/` even when it is omitted from `docs.json` navigation. Include it only when the source has a visible Home tab/entry or when the page must participate in Mintlify navigation indexing. Omitted pages are hidden from navigation and, by default, excluded from search and assistant indexing.

When `index` is included, give it a dedicated top-level page or Home tab. Do not insert it into an existing Getting Started/sidebar group unless the source visibly has that entry; doing so commonly creates a duplicate `Home`/`Overview` row.

**Single-product (tabs at root):**
```json
{
  "navigation": {
    "tabs": [
      { "tab": "Home", "pages": ["index"] },
      { "tab": "Docs", "groups": [...] }
    ]
  }
}
```

**Multi-product (Developer Platform + Help Center, etc.):**
```json
{
  "navigation": {
    "products": [
      {
        "product": "Developer Platform",
        "tabs": [
          { "tab": "Home", "pages": ["index"] },
          { "tab": "Documentation", "groups": [...] }
        ]
      }
    ]
  }
}
```

Confirm `docs.json` has the required `theme`, `name`, `colors.primary`, and `navigation` fields. When company assets exist, configure source-verified `logo` and `favicon` paths; add `$schema` for editor validation when it is absent.

## Greenfield Section Order

Use this only when there is no source landing page to replicate. For migrations, preserve the source section order and omit sections the source does not have.

1. **Hero** — value prop headline, subheading, primary + secondary CTA buttons, optional hero image
2. **Quick Start** — `<Steps>` with 3–4 steps to first success; at least one code block; collapsible response in `<Accordion>`
3. **Feature Overview** — `<CardGroup cols={3}>` (6 cards), each showing a major product area with icon + 1–2 sentence description
4. **Popular Paths** — `<CardGroup cols={3}>` (4–6 cards) to the most-visited docs sections
5. **Resources / Community** — `<CardGroup cols={2}>` (4 cards) linking to GitHub, community, changelog, status page
6. **Closing CTA** — dark/brand-colored `<div>`, repeat headline + single primary CTA; optional decorative SVGs with `pointer-events-none`

## Page Skeleton

```mdx
---
mode: "custom"
title: "<source page title or company docs name>"
---

{/* 1. Optional custom <div role="banner"> site header (Tailwind classes inline) */}
{/* 2. Hero <section> with inner max-width container */}
{/* 3. Content <div>s with styled <h2> + subtitle + cards/steps */}
{/* 4. Optional closing CTA banner */}
{/* 5. Optional custom <div role="contentinfo"> footer */}
```

Chrome-hiding CSS lives in `custom.css` at the repo root, not inline (see Gotcha 2). All visual styling is inline Tailwind on each element (see Gotcha 3) — do not introduce a top-of-file `<style>` block to define custom classes.

Use only `<div>`, `<section>`, `<a>`, `<img>`, `<svg>`, `<h*>`, `<p>`, `<ul>`/`<li>`, `<span>`, `<button>`. Do **not** use `<header>`, `<footer>`, or `<nav>` (stripped by MDX — see Gotcha 1).

## Workflow

### 1. Frontmatter

- Set `mode: "custom"` and use the source page title or company docs name for `title`; do not hard-code `"Welcome"` when it is not the source title.
- `mode: "custom"` hides the sidebar, table of contents, and footer — but keeps the top navbar and tabs. When a fully chromeless design is desired (custom header replacing the navbar), add the CSS from Gotcha 2 to `custom.css` at the repo root. Do not put it in an inline `<style>` block (Gotcha 3).

### 2. Optional Custom Site Header

Only build one when the brand's marketing site has a distinctive navbar you are replicating. If the user is happy with Mintlify's default chrome, skip this section and omit the CSS overrides from Gotcha 2.

- Wrap everything in a single `<div role="banner">` (never `<header>` — see Gotcha 1).
- Use a two-row layout when replicating a typical SaaS header: marketing nav row + product/docs tabs row, separated by a `border-t` in the theme's border color.
- Inside each row, a `mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 lg:px-8` container keeps content aligned with the rest of the page.
- Links are plain `<a>` elements with `className` — do not wrap groups in `<nav>`.
- Use the source-verified logo files selected during the asset inventory, then update `docs.json` if its logo paths are stale. Include light/dark variants with `block dark:hidden` + `hidden dark:block` when both exist.
- Primary CTA = filled pill in the brand color; secondary CTA = outline pill. Match the rest of the page's button styling.
- Allow the tabs row to scroll horizontally on small screens: `overflow-x-auto` + `whitespace-nowrap` on each tab.
- Every tab `href` must resolve to a real docs page — grep the repo for `<section-slug>/overview.mdx` or similar entry points before wiring them up.

### 3. Hero Section

- Full-bleed section with generous vertical padding (`py-16`–`py-20`) and no page-level horizontal margin wrapper around the hero itself.
- Use `relative overflow-hidden` on the hero `<section>` for full-bleed backgrounds. Do **not** use the viewport-width breakout hack (`left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen` or `-mx-[50vw] w-screen`) — it causes horizontal overflow and scroll issues.
- Inner content should still use a max-width container (`max-w-5xl`–`max-w-7xl`), centered (`mx-auto`), with horizontal padding for readability.
- Two-column grid on desktop, single-column on mobile.
- Use source media when it carries the brand or explains the product; otherwise use the source brand color treatment or a restrained adaptive gradient. Do not cover a legible product screenshot with decorative effects merely to fill the hero.
- **Adapt the hero background to both modes** (see "Adaptive hero & CTA backgrounds" below). A permanently dark hero looks great in dark mode but clashes with a light navbar in light mode, and vice versa.
- `<h1>` heading with responsive sizing (`text-4xl` → `text-6xl`), `font-semibold`/`font-bold`, high-contrast color.
- `<p>` subtitle below the heading, `text-base`–`text-xl`, max-width constrained.
- Primary CTA button (brand background, links to quickstart) + secondary CTA button (outline style).
- Buttons: `rounded-lg`/`rounded-full`, hover transitions, `flex-wrap` + `gap-3`/`gap-4`, actionable text.
- For hero media, use the asset inventory's chosen file, intended crop, and light/dark variant. Add meaningful `alt` text for informative media and `alt=""` for purely decorative media; use `noZoom` and responsive sizing.

#### Adaptive hero & CTA backgrounds (required for any tinted/dark section)

The biggest visual failure on a landing page is leaving the hero and closing CTA permanently dark (or permanently brand-colored) "because they look great" — they look great in *one* mode and jarring in the other. Any section with a tinted, gradient, or dark background must define a light-mode variant **and** a dark-mode variant so the section blends with the surrounding chrome in both themes.

Pattern:

- Base classes describe the **light-mode** appearance. `dark:` variants describe the **dark-mode** appearance.
- Layer the variants on: background, border, decorative glow opacity, heading text, subtitle text, badge/pill, outline button background/border/text.
- The filled primary CTA (brand-color button) can usually keep one color in both modes — it carries the brand and acts as the visual anchor.
- The inline code preview pane, on the other hand, should stay **dark in both modes** (terminals are universally dark across Stripe, Linear, Vercel, etc.). Do not add `dark:` variants to it.

```mdx
{/* Hero section — light gradient in light mode, dark gradient in dark mode */}
<section className="relative overflow-hidden
  bg-gradient-to-br from-white via-[#f0f9fc] to-[#dceff7]
  dark:from-[#020e18] dark:via-[#031a2c] dark:to-[#062a47]">

  {/* Decorative glows: lighter opacity in light mode, brighter in dark */}
  <div className="pointer-events-none absolute -top-32 -right-32 h-[480px] w-[480px]
    rounded-full bg-[#00bef0] opacity-15 blur-3xl dark:opacity-20" />

  {/* Pill / eyebrow badge */}
  <div className="inline-flex items-center gap-2 rounded-full
    border border-[#00bef0]/30 bg-white/70 text-[#0a3a5e]
    dark:border-white/15 dark:bg-white/5 dark:text-[#7fe0f5]
    px-3 py-1 text-xs font-medium backdrop-blur-sm">...</div>

  {/* Heading + subtitle */}
  <h1 className="text-[#031a2c] dark:text-white ...">Headline</h1>
  <p className="text-slate-600 dark:text-[#cfe8f3]/90 ...">Subtitle</p>

  {/* Primary CTA — brand color stays the same in both modes */}
  <a className="bg-[#00bef0] text-[#031a2c] hover:bg-[#23c7e5] ...">Get started</a>

  {/* Secondary CTA — outline button needs full light + dark treatment */}
  <a className="border border-[#031a2c]/15 bg-white/80 text-[#031a2c]
    hover:bg-white hover:border-[#031a2c]/30
    dark:border-white/25 dark:bg-white/5 dark:text-white
    dark:hover:bg-white/10 dark:hover:border-white/40 ...">Browse docs</a>
</section>
```

Apply the same pattern to the closing CTA banner. In light mode add a subtle brand-tinted border (`border-[#00bef0]/20`) so the card has a clear edge against the page; in dark mode the gradient itself provides separation so set `dark:border-transparent`.

Verification: screenshot the page in both modes and confirm:

- Light mode: hero and closing CTA share the navbar's light tone (no large dark slab against a white page).
- Dark mode: hero and closing CTA look as they did before (dark gradient, white heading, brand glow).
- The filled brand-color CTA reads clearly in both modes.
- Outline buttons are legible in both modes (dark text on light bg, light text on dark bg).

### 4. Section Containers + Heading Blocks (required)

- Every major section below the hero must be wrapped in the same horizontal container: `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`.
- Each section starts with a heading block before cards/steps:
  - styled `<h2>` (`text-2xl`–`text-4xl`, `font-bold`, dark-mode-safe color)
  - subtitle `<p>` (`text-base`, muted tone, dark-mode-safe color)
- Section titles should be short and in Title Case. Prefer concise 1-4 word headings like `Quick Start`, `API Reference`, or `Resources`.
- Avoid long sentence-style section titles and avoid overline/eyebrow labels unless the user explicitly wants them.
- Do not rely on plain markdown headings alone for major sections; use explicit styled heading/subtitle markup.
- Add consistent spacing between sections (`mt-14`–`mt-20`).

### 5. Quick Start Section

- Use `<Steps>` with `<Step>` children, 3–4 steps.
- Logical progression (create account → credentials → authenticate → first call).
- Each step has a `title` prop and brief prose.
- Include at least one code snippet with language tag.
- Wrap example responses in `<Accordion>` or `<Note>`.
- Link to deeper docs from steps.

### 6. Navigation Cards

**Mintlify `<Card>` / `<CardGroup>`:**
- `<CardGroup cols={2}>` or `cols={3}`.
- Each card: `title`, `icon` (Font Awesome name), `href` (valid path), 1–2 sentence body.
- Optionally set `cta` prop for clarity.

**Custom image cards (when richer previews are needed):**
- `<a>` tag with `group`, `block`, `rounded-2xl`, `border`, `overflow-hidden`, `no-underline`.
- Hover border color change to brand color.
- Use source product thumbnails, diagrams, or illustrations assigned in the asset inventory. Keep a consistent aspect ratio without forcing unrelated crops; add `alt` + `noZoom`.
- Body: `<h3>` title, `<p>` description, arrow indicator with `group-hover` brand color.
- Grid: `grid-cols-1 md:grid-cols-2` (or `md:grid-cols-3`), `gap-4`–`gap-6`.

### 7. Mintlify Built-in Components

No imports needed — these are available in any MDX page:

| Component | Key props | Use for |
|-----------|-----------|---------|
| `<Card>` | `title`, `icon`, `href`, `cta` | Navigation tiles |
| `<CardGroup>` | `cols={2\|3}` | Grid wrapper for Cards |
| `<Columns>` | `cols={2\|3}` | Grid alternative (Cards without CardGroup) |
| `<Steps>` | — | Sequential tutorial wrapper |
| `<Step>` | `title` | Individual numbered step |
| `<AccordionGroup>` | — | Wrapper for multiple Accordions |
| `<Accordion>` | `title` | Collapsible section (e.g. response examples) |
| `<Frame>` | — | Embed wrapper for iframes / YouTube |
| `<Tip>` | — | Blue callout — suggestions |
| `<Note>` | — | Gray callout — important info |
| `<Warning>` | — | Red callout — cautions |

**Icon names** (Font Awesome 6 names used in Card `icon` prop): `code`, `plug`, `desktop`, `robot`, `book-open`, `rocket`, `graduation-cap`, `shuffle`, `clock`, `users`, `github`, `bullhorn`, `square-terminal`, `store`, `arrow-right`, `check`, `star`, `zap`, `layers`, `settings`, `shield`, `cpu`.

### 8. Support / Community Section (optional)

- At least one support link and one community link.
- Use `<Card>` components with icon, title, description, and `href`.

### 9. Closing CTA Banner (optional)

- Visually distinct from content sections — typically a rounded `<div>` with a tinted/gradient background.
- Strong heading + subtitle + CTA button linking to quickstart.
- **Must adapt to both modes** using the same light/dark pattern as the hero (see "Adaptive hero & CTA backgrounds" under Hero Section). A permanently dark banner at the bottom of a light page is the second most common landing-page polish failure after a permanently dark hero.
- In light mode add a subtle brand-tinted border (e.g. `border-[#00bef0]/20`) so the rounded card reads clearly against the page; in dark mode the gradient provides its own separation, so use `dark:border-transparent`.

### 10. Final Passes

**Element audit:** Confirm no `<header>`, `<footer>`, or `<nav>` tags remain (Gotcha 1). Grep the file: `rg -n '^\s*<(header|footer|nav)\b' index.mdx` should return zero hits.

**Render audit:** With `mint dev` running, pick a distinctive string from each major section (a heading, a button label, a card title) and confirm it appears in the server-rendered HTML:

```bash
curl -s http://localhost:3000/ | grep -c 'your distinctive string here'
# must return > 0; a zero means the element was stripped or is display:none
```

Check one string per section — hero, quick start, cards, and CTA banner at minimum.

**Chrome audit (when using the CSS from Gotcha 2):** open the rendered page and confirm:
- no empty 48px strip at the top (tabs wrapper removed)
- hero extends edge-to-edge (no 19rem gutter on the left)
- no default Mintlify navbar or sidebar visible

If chrome is still visible, your `custom.css` is not being picked up. Check that the file is at the repo root, that `mint dev` was restarted after creating it, and that the rules made it into the rendered HTML: `curl -s http://localhost:3000/ | grep -c 'data-current-path="/"\] #navbar'` should be `> 0`.

**Styling audit (Gotcha 3):** confirm Tailwind compiled successfully and no custom CSS rules were stripped:

```bash
# Tailwind classes must be present in the rendered output
curl -s http://localhost:3000/ | grep -o 'mint-[a-z0-9-]\+' | wc -l   # expect hundreds+

# Inline <style> block(s) in index.mdx should be small or absent
rg -n '<style>{`' index.mdx | wc -l   # expect 0
```

If the page renders as unstyled text in the browser but content is present in the HTML, the CSS rules were dropped — switch to inline Tailwind utilities and move any remaining selectors to `custom.css`.

**SVG icon audit (Gotcha 4):** every inline `<svg>` icon should contain exactly one `<path>` child — no `<circle>`, `<rect>`, or `<line>` siblings.

```bash
# Count inline SVGs whose body uses circle/rect/line — these are at risk of partial rendering
rg -n '<(circle|rect|line)\b' index.mdx | wc -l
# expect: 0
```

If any are flagged, replace the icon with an inspected single-path export or use a Mintlify `<Icon icon="..."/>` / configured-library icon on a `<Card>`.

**Dark mode:** Add a `dark:` variant wherever the base text, background, or border color loses contrast or breaks source parity in dark mode. Stable brand buttons and intentionally dark code panes do not need artificial variants. Pay special attention to the hero and closing CTA, then screenshot both modes.

**Responsive:** Multi-column → single-column on mobile. Text sizes scale down. Buttons stack vertically on small screens. Decorative elements hidden on mobile if needed.

**Section rhythm:** Each section has horizontal margins, styled `<h2>` titles, and subtitle text for scannability.

**Assets and branding:** Every prominent visual maps to a source, supplied, or company-repository asset; all critical files are local, light/dark variants are correct, crops preserve the focal point, and remote URLs remain only when the company intentionally hosts the asset as a durable embed. Use the source color system rather than imposing an arbitrary accent-count limit.

**Accessibility:** Meaningful `alt` text on informative images and empty `alt` text on decorative images. `role="banner"` / `role="navigation"` / `role="contentinfo"` on any `<div>`s that substitute for stripped semantic tags. Links have visual affordances beyond color. Sufficient contrast in both modes. No placeholder copy or commented-out JSX. Run `mint a11y` and fix relevant failures.

**Links:** Run `mint broken-links` or manually verify every `href` resolves to an existing page. Header tabs and footer columns are easy to miss — verify each one individually.
