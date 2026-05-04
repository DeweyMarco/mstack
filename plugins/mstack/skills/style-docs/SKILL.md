---
name: style-docs
description: Style and polish documentation sites in a Mintlify-native way using strong visual hierarchy, scannable information architecture, accessible theming, and component-first layouts. Use when the user asks to style docs, redesign a docs homepage, improve docs UI/UX, make a site feel more Mintlify, polish or restructure navigation (tabs, groups, nested subgroups), reorganize a flat sidebar, or improve clarity and usability.
---

# Style Docs

Use this skill to make docs sites feel polished, trustworthy, and easy to use without drifting away from Mintlify conventions.

## Core principle

Optimize for fast comprehension and first-task success:

1. Prefer Mintlify-native components and `docs.json` settings before custom CSS.
2. Make the next action obvious: quickstart, API reference, guides, or support.
3. Prioritize scannability, consistency, contrast, and familiar navigation over visual flair.

## Start here

Before making styling changes:

1. Read `docs.json` to understand theme, colors, fonts, logos, navigation, and icon library.
2. Inspect the relevant page files to understand the current structure and component usage.
3. Identify the primary user journeys that need to be obvious on the page.
4. Reuse existing labels and IA where possible unless they are clearly confusing.

## Mintlify-first styling rules

### 1. Use configuration before custom code

Prefer these levers first:

- `docs.json` theme, colors, fonts, logos, favicon, background, and appearance settings
- page `mode` frontmatter (`default`, `wide`, `custom`, `frame`, `center`) based on page purpose
- Mintlify components such as `Card`, `CardGroup`, `Columns`, `Steps`, `Accordion`, `Tabs`, `CodeGroup`, `Note`, `Tip`, `Warning`, and `Frame`

Only add custom CSS when Mintlify configuration and built-in components cannot achieve the desired result cleanly.

### 2. Default layout choices

- Use `mode: "custom"` for homepages and landing pages that need full layout control.
- Use `wide` when content needs more horizontal room but still follows standard docs structure.
- Use standard pages for normal documentation content whenever possible.
- Preserve clear page rhythm with repeated containers, predictable spacing, and obvious section starts.

### 3. Prefer component patterns users already understand

- Use cards for navigation, not for decorative clutter.
- Use `Steps` for onboarding and first-run flows.
- Use `Accordion` for optional detail, not core instructions.
- Use `Tabs` and `CodeGroup` to let users choose a language or framework once and keep that choice consistent on the page.
- Use callouts sparingly to highlight important caveats, warnings, or tips.

### 4. Edit existing components in place (minimum-diff rule)

When adding or changing a single element on a page, edit the existing component tree in place. Never replace a working layout primitive (`<CardGroup>`, `<Card>`, `<Columns>`, `<Steps>`, `<Tabs>`, `<AccordionGroup>`) with custom HTML or CSS just to add a child element.

- If the page already uses `<CardGroup cols={2}>`, keep it and add the new child inside an existing `<Card>`.
- If a CTA needs to live next to a code snippet inside a `<Card>`, put the CTA inside that `<Card>` body — not in a sibling `<div>` that recreates the card visually.
- Introducing a new wrapper class (`.pw-templates-cta`, `.pw-starting-examples`, etc.) to host content that already had a Mintlify primitive is a regression. Reach for `custom.css` only to style children of existing components, not to replace them.

The diff for a new element on an otherwise-correct page should usually be one or two lines of MDX plus, at most, one new class in `custom.css`. If your diff is bigger, you are probably rebuilding layout that did not need rebuilding.

### 5. Buttons and CTAs

Mintlify has no native `<Button>` component. The canonical pattern for an action / CTA inside docs is a styled `<a>` with a class defined in `custom.css`.

- Place the anchor **inside** the existing layout component (for example, inside a `<Card>` body), not as a sibling that replaces or wraps the layout.
- Define the button class once in `custom.css` (background, hover, dark-mode override, focus state) and reuse it across pages.
- Do not invent a `.pw-cta-card` / `.pw-templates-cta` wrapper to host a button. The host is whatever Mintlify component already exists on the page.
- For multiple CTAs that share a visual style, use the same class on each — do not duplicate the CSS per page.

Minimal example:

```mdx
<Card title="Getting Started" icon="bolt">
  Install with `pip install pathway`.

  <a className="pw-btn-accent" href="/developers/user-guide/introduction/first_realtime_app_with_pathway">Starting examples</a>
</Card>
```

```css
.pw-btn-accent {
  display: inline-flex;
  padding: 0.625rem 1.25rem;
  background-color: var(--pw-accent);
  color: #ffffff !important;
  border-radius: 0.375rem;
  font-weight: 600;
  text-decoration: none !important;
}
.pw-btn-accent:hover { background-color: var(--pw-accent-hover); }
```

## Docs UX rules

### Visual hierarchy

- Put the page purpose and primary action near the top.
- Lead with the most important choice or outcome, then supporting detail.
- Use short section titles and short paragraphs.
- Avoid walls of text. Break content into cards, steps, tabs, and small sections.

### Navigation and information architecture

- Group content by user intent: getting started, guides, API reference, SDKs, troubleshooting, support.
- Keep naming concrete and user-facing.
- Do not invent generic labels like `Overview 1`, `Resources`, or `Learn more` when a more specific label exists.
- Keep primary journeys visible without requiring deep navigation.

### Mintlify collapsible navigation guardrail (critical)

When the user asks to make a sidebar "collapsible" or to reduce a long scroll:

- `expanded` only affects nested groups (a `group` inside another group's `pages` list).
- Top-level groups are always expanded in Mintlify and cannot be collapsed.
- If a section is long because `group.pages` contains many direct string paths, adding `expanded: false` alone will not change the scroll length.
- For long flat sections, preserve the section overview page as the first direct page and move the remaining direct pages into a nested subgroup such as `Guides` with `expanded: false`.
- Never remove pages to shorten navigation. Reorganize only.
- After restructuring, validate parity before saving:
  - same unique page paths before vs after for the affected tab or section
  - no duplicate page paths
  - no `*.mdx` file under the affected product prefix is orphaned from nav

Fail the task if any parity check fails; fix the restructuring logic instead of hand-dropping pages.

### Restructuring a large, flat navigation

Apply this workflow when `docs.json` has a single tab with many flat groups, when a tab has more than ~15 groups, or when the site spans multiple distinct product lines. Follow every step — skipping one is the main source of first-pass mistakes.

**1. Model tabs on the customer's real product taxonomy, not on folder names.**

- Before designing tabs, look at the customer's public docs landing page (for example via `WebFetch` or the external-links context) and use its top-level sections as your tab list.
- If the customer site exposes Payments / API Reference / Developer Tools at the top, your tabs should mirror that — even when the repo folders are organized differently.
- Only invent a tab when a product area is large enough to justify its own top-level space (rule of thumb: >50 pages or a distinct user persona).

**2. Plan before writing. Do a scale audit first.**

- Count pages per current group and per second-level path prefix. This reveals which sections need nested subgroups and which should stay flat.
- A group with >40 pages should almost always be nested. A group with <3 pages usually belongs merged into a "Reference" or sibling group.
- Never hand-edit `docs.json` for a site with hundreds of pages. Write a small script that reads the original groups, assigns pages to tabs, nests them, and validates.

**3. Pair each landing page with its folder — always.**

- When `foo/bar.mdx` exists as a sibling of `foo/bar/*.mdx` files, the landing MDX is the **first page of the "bar" group**, not a separate entry. Losing this pairing is the most common bug.
- When collecting pages under `root`, treat `root/<key>` (single-page leaf) as the overview slot for `buckets[<key>]` whenever that bucket already has deeper children. Otherwise the landing shows up as an orphan in "Get Started".

**4. Every page appears exactly once.**

- If a page is in a product tab, do not also put it in a shared "General" or "Landing Pages" group. Tabs own their own landing pages.
- Validate the build: `set(new_pages) == set(old_pages) + synthetic_landings` and no key in `Counter(new_pages)` has count > 1. Treat any violation as a blocker before writing.

**5. Include orphan MDX files that exist on disk but were never in the nav.**

- List top-level `.mdx` files and compare against the current nav. If `introduction.mdx`, `quickstart.mdx`, `dashboard-setup.mdx` (or similar) exist but aren't referenced, add them to the appropriate tab's "Get Started" group as synthetic entries.

**6. Avoid both under- and over-subdivision.**

- Do not dump dozens of unrelated leaf pages into "Get Started" or "Overview". Promote each leaf to its own 1-page group in the bucket list and then either (a) label it if it's a distinct product, or (b) merge it into a trailing "Reference" group if it's administrative (changelog, glossary, faqs, support, etc.).
- Do not create 20+ single-page subgroups inside one parent group. If an ordered list of keys mostly resolves to 1-page entries (typical of webhook events or error categories), split them into 3–5 semantically named subgroups instead (e.g. "Setup & Testing", "Payment Events", "RazorpayX Events").
- Good nesting depth: 2–3 levels. Beyond that, readers lose the thread.

**7. Label with the customer's terminology.**

- Humanize folder names into natural titles: `rbl-ybl-current-account` → "RBL & YBL Current Accounts", `cod-magic-checkout` → "COD Magic Checkout", `mpos` → "mPOS".
- Keep a small humanization map next to the script. Default to title-case of the slug only when no better label exists.

**8. Validate before saving.**

Every restructure script must print, and pass, these gates before writing:

- `old_unique_pages == new_unique_pages` (minus intentional synthetic additions, listed explicitly).
- `Missing from new: 0`.
- `Extra in new (beyond synthetic): 0`.
- `Duplicates: 0`.

If any gate fails, fix the algorithm — do not hand-patch the output.

**9. Back up first.**

Always copy `docs.json` to a temp backup before running a rebuild script, and restore it between iterations so each run starts from the original input.

### Clarity and trust

- Remove placeholder copy, vague CTAs, and decorative sections that do not help users complete a task.
- Use realistic labels, examples, and card descriptions.
- Match the site's existing terminology consistently.

## Homepage and landing page rules

For docs homepages and landing pages:

1. Use a strong hero with one clear headline, one supporting sentence, and one primary CTA.
2. Make the first meaningful action visible above the fold.
3. Follow the hero with scannable navigation cards.
4. Add a quick-start or first-request section early.
5. Keep support, community, or secondary resources lower on the page.
6. End with a closing CTA only if it helps the main journey.

Avoid marketing-style bloat. A docs homepage should help users start and orient quickly.

## Matching a source site's branding

When the goal is to make a Mintlify preview look like an existing source site (during or after `/docs-to-mintlify`), do not eyeball colors, fonts, or layout. Extract the source's design tokens **and** layout structure directly from its rendered output, then mirror them deterministically in `docs.json`, MDX, and `custom.css`. Eyeballing or inferring from prose produces "close-but-wrong" results that fail QA.

### Mirror the source layout, not just the tokens

Branding parity covers tokens; layout parity covers structure. Both are required.

Before changing a page that mirrors a source URL:

1. **Fetch the source URL.** Use `WebFetch` (or `curl`) on the exact page the user referenced. Read the rendered DOM — column counts, card counts, which elements have CTAs, exact button labels, exact `href` targets, heading order.
2. **Do not infer layout from the user's prose.** The user describes the *change*, not the full target state. "There should be a red button with starting examples and Pathway templates" describes one delta, but the actual source page may have CTAs on every card, a specific column count, and a specific section ordering. Confirm against the live DOM before editing.
3. **Apply repeated visual patterns to every sibling.** If the source shows the same pattern across siblings — matching CTAs in every card, identical badges per row, the same icon style on every tile — apply the change to *every* sibling, not only the one named in the user's prompt. Doing one of two CTAs is a partial migration, not a finished one.
4. **Confirm visually before stopping.** Compare side-by-side against the live source: column count, CTA presence per element, label text, hover state, dark mode. Any mismatch is a defect, not a follow-up.

This is the single most common source of round-trip churn in preview work. A typical regression: the live page has two cards with red buttons in a 2-column grid; the agent reads the user's one-sentence prompt, stacks the cards vertically, and only adds a button to the card the user named. Three follow-up turns later, the layout is finally right. All of it would have been caught by fetching the source URL on turn one.

### Audit sidebar / navbar chrome per section, not just globally

Page-body parity is not enough. Many source sites change the sidebar anchor buttons, navbar links, or top-of-sidebar CTAs *per section* (Framework pages show one anchor set; Templates pages show a different anchor set; API reference shows a third).

When mirroring a section that has its own sidebar chrome:

1. **Fetch the live source page in that section** and list every anchor / button / icon visible in its sidebar header. Then fetch a page in a *different* section and compare. If the lists differ, the source uses per-section anchors and the preview must do the same.
2. **Match the icons to the same source heroicons / Lucide / Font Awesome glyph the live site uses.** Get the icon names from the rendered HTML (search the page source for the visible icon class), do not guess from the label.
3. **Use per-dropdown / per-tab `anchors` arrays in `docs.json`.** Each dropdown or tab can carry its own `anchors` block. Put the section-specific link buttons there, not in `navigation.global.anchors`. Putting them in `global.anchors` makes them appear on every page, including the wrong section. See [reference.md → Per-dropdown sidebar anchors](reference.md) for the wrapping-anchor pattern that lets a dropdown carry both link-button anchors and content groups.
4. **Verify visually after editing.** Open the preview in `mint dev` and confirm each section shows the right anchor buttons in the right order with the right icons. JSON validity is not enough — see the validation workflow below.

### Pick the icon library before mapping icons

Mintlify's `docs.json` `icon` fields default to **Font Awesome**, not Lucide. Lucide names like `cpu`, `arrow-right-left`, `file-search-2`, `life-buoy` will silently fail to render under the default config — the anchor button shows up but the icon is blank.

Before mapping any source icons:

1. **Check `docs.json` for `icons.library`.** If it is unset, the site is using Font Awesome. If it is `"lucide"`, the site is using Lucide.
2. **Map source icons to that library.** Common heroicon → Font Awesome mappings: `cpu-chip` → `microchip`, `arrows-right-left` → `arrow-right-arrow-left`, `document-magnifying-glass` → `file-magnifying-glass`, `lifebuoy` → `life-ring`, `play` → `play`, `code-bracket` → `code`. For Lucide, the names are usually the closer match: `cpu`, `arrow-right-left`, `file-search-2`, `life-buoy`.
3. **Or change the library** by setting `"icons": { "library": "lucide" }` in `docs.json`, but only if you intend to use Lucide everywhere on the site. Mixing libraries page-by-page leads to inconsistent visual weight.
4. **Always visually verify** after icon changes — see the validation workflow below.

### Extract the live styling tokens

Most modern docs sites publish their design tokens as CSS custom properties (`--color-primary-500`, `--font-heading`, etc.) and reference them throughout the rendered stylesheet:

```bash
# All CSS custom properties on :root
curl -sS https://docs.example.com/ | grep -oE -- '--[a-z-]+:[^;]+;' | sort -u

# Just the color palette
curl -sS https://docs.example.com/ | grep -oE -- '--color-[a-z0-9-]+:\s*#[0-9a-fA-F]+' | sort -u

# Default font-family rules (catch fonts not exposed as variables)
curl -sS https://docs.example.com/ | grep -oE 'font-family:[^;}]+' | sort -u | head -20
```

If variables aren't in the initial HTML (SPA), fetch the linked stylesheet directly — find `<link rel="stylesheet" href="...">` in the source and `curl` that URL.

### Identify font hosts

For each non-system font name in the `font-family` rules, find where it's hosted:

- **System stacks** (`-apple-system, BlinkMacSystemFont, ...`) — no action; matches by default.
- **Google Fonts** — confirm at `fonts.google.com/specimen/<Name>`. Mintlify's `docs.json` `fonts.family` loads Google Fonts natively.
- **Fontshare** (common for Open Sauce One, Satoshi, Switzer, General Sans, Cabinet Grotesk) — `@import url('https://api.fontshare.com/v2/css?f[]=<slug>@400,500,700&display=swap');` at the top of `custom.css`.
- **Self-hosted / proprietary** — check the source's `@font-face` rules; often a CDN you can `@import`. If licensed and not redistributable, fall back to the closest open equivalent (Inter for most modern sans-serifs) and note the substitution.

### Map tokens to the right config layer

Mintlify covers a fixed subset of theming via `docs.json`. Everything beyond that goes in `custom.css`. Putting tokens in the wrong layer is the most common reason a preview looks subtly off.

| Token | Goes in |
|---|---|
| Primary brand color (light + dark variants) | `docs.json` → `colors.primary`, `colors.light`, `colors.dark` |
| Default appearance (light vs dark) | `docs.json` → `appearance.default` |
| Page background color — **single tone** (light + dark) | `docs.json` → `background` |
| Multi-tone background layout (separate page / sidebar / navbar / content colors) | `custom.css` per region — `docs.json` `background` only sets one tone. See [reference.md → Mintlify layout regions and selectors](reference.md) and [reference.md → Multi-tone background layouts](reference.md) for the DOM map and canonical pattern. |
| Body font family | `docs.json` → `fonts.family` |
| Site name in navbar | `docs.json` → `name` |
| Logo files (light/dark) | `docs.json` → `logo.light`, `logo.dark`, `logo.href` |
| Heading font (different from body) | `custom.css` (`@import` + `h1, h2, h3, h4, h5, h6 { font-family: ...; }`) |
| Code font | `custom.css` (`@import` + `code, pre { font-family: ...; }`) |
| Full color palette as CSS variables (e.g. `--brand-50` through `--brand-900`) | `custom.css` on `:root` |
| Link colors (different from `colors.primary`) | `custom.css` with dark-mode override |
| Card hover treatments, inline-code pill, gray outer background | `custom.css` |
| Heading colors that differ from body text | `custom.css` |

### Common misses

Each of these typically costs a round of QA if missed.

- **`appearance.default`** — Mintlify defaults to dark. If the source site loads in light mode, set `"default": "light"` explicitly. Spot-check: open the source in incognito with no system preference and observe which mode loads.
- **`name` field** — match the navbar text on the source site, not the legal product name. "Pathway" beats "Pathway Developer Documentation"; "Stripe Docs" beats "Stripe API Reference".
- **Logo subscript or wordmark** — if the source logo has a custom subscript ("Product / Developers"), bake it into the SVG. Don't try to recreate it via custom CSS — fragile and theme-version-dependent.
- **`colors.light` / `colors.dark`** — these are the **brand color** in each mode, not the page background. Putting `#ffffff` in `colors.light` turns every CTA white.
- **Font weights** — when `@import`-ing a font, request the weights you actually use (e.g. `400,500,600,700`). Missing weights silently fall back to the nearest available, producing inconsistent heading thickness.
- **Single-tone backgrounds when the source is multi-tone** — if the source site uses different colors for the page chrome, the sidebar panel, the navbar, and the main content (very common: grey page / light-grey sidebar / white content), setting only `body { background: ... }` paints everything one color because Mintlify's regions inherit the body bg by default. Override each region in `custom.css` using the selectors documented in [reference.md → Mintlify layout regions and selectors](reference.md). The most common trap: the sidebar panel is `#sidebar-content`, **not** `#sidebar` — guessing `#sidebar` produces a styled-but-still-grey sidebar that passes a quick visual check.

### Verify the match

Side-by-side at matching URLs (`mint dev` vs live source). Compare in this order: page background, primary CTA, link color, heading font weight + style, code block font, sidebar entry color, hover states. If anything is off, re-pull the relevant token from the live site — do not adjust by eye.

## Theming and branding rules

- Use one primary accent color consistently for emphasis, interactive states, and CTA treatment.
- Keep the accent palette restrained. Avoid rainbow UI unless the brand clearly calls for it.
- Use supported `docs.json` settings for theme, colors, fonts, logos, and background before page-level overrides.
- Use light and dark variants for logos, favicons, and important images when needed.
- Keep typography readable and stable. Choose fonts that support scanning, not novelty.

## Dark mode and responsiveness

- Every important text, border, and background treatment must work in both light and dark modes.
- Verify hover, focus, and active states in both themes.
- Collapse multi-column sections cleanly on mobile.
- Ensure buttons and CTAs remain easy to tap on small screens.
- Hide or simplify decorative elements on mobile if they reduce clarity.

## Media and imagery

- Every meaningful image needs descriptive alt text.
- Decorative images should stay secondary and should not carry essential instructions.
- Use `noZoom` when screenshots are purely presentational and click-to-zoom would distract.
- Prefer paired light and dark images when contrast or legibility changes across themes.

## Custom CSS rules

When custom CSS is necessary:

1. Keep it surgical and scoped.
2. Prefer stable selectors and documented Mintlify hooks over fragile internal classes.
3. Prefer reusable classes or CSS files over large inline `style` objects.
4. Avoid broad global overrides unless the user explicitly wants a full site reskin.
5. Be careful with selectors on Mintlify internals because some references may change across updates.

Use Tailwind utility classes when supported. Tailwind arbitrary values are not reliably supported, so use custom CSS for values outside the standard utility set.

## Accessibility baseline

Always check for:

- one clear H1 per page via frontmatter `title`
- sequential heading hierarchy
- descriptive alt text
- sufficient color contrast
- meaningful link and button labels
- keyboard-reachable interactions

Run `mint a11y` when practical after substantial styling changes.

## Validation workflow

After styling changes:

1. Verify the main path from homepage to first successful task.
2. Check dark mode and light mode.
3. Check desktop and mobile layouts.
4. Confirm all navigation targets exist.
5. Run `mint broken-links` when links changed.
6. Run `mint a11y` when layout, color, or imagery changed substantially.

### Visual verification gate (chrome / icon / sidebar changes)

For any change that touches docs chrome — sidebar anchor buttons, navbar links, icons in `docs.json`, footer, top CTAs, dropdown structure — JSON validity is **not** a substitute for visual confirmation. Many failure modes (wrong icon library, missing icon, broken anchor, wrong dropdown context) parse as valid JSON and render as a blank slot.

Required gate before declaring chrome work done:

1. Run `mint dev` locally on the affected branch.
2. Take a screenshot of the affected page in the local preview. The repo includes a Puppeteer setup bundled with `mint`; use it for headless screenshots.
3. Take a screenshot of the same URL on the live source site (same viewport, same theme).
4. Diff visually: every anchor button has its icon, the icons match the source glyphs, the sidebar order matches, and the hover/focus states are intact.
5. Repeat in dark mode if the site supports it.

Do not declare an icon, anchor, or sidebar change done based on JSON validation alone. The most common silent failure is a Lucide icon name under a Font Awesome library config — the anchor button renders, the icon is blank, and the JSON is perfectly valid.

## Default response behavior

When using this skill:

1. Start by identifying the user journey and current IA.
2. Explain the styling direction in terms of usability, scannability, and Mintlify fit.
3. Prefer a small number of high-impact changes over broad visual churn.
4. Report what improved orientation, clarity, and polish.
5. Call out any remaining gaps in responsiveness, dark mode, or accessibility.

## Additional reference

For detailed design heuristics and Mintlify-specific implementation notes, read [reference.md](reference.md).
