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
2. Read the parity manifest (`parity-manifest.json` or `parity-manifest.md`) when present, and use it as the source of truth for source URLs, sidebar labels, H1s, subtitles, converted files, and exclusions.
3. Inspect the relevant page files to understand the current structure and component usage.
4. Identify the primary user journeys that need to be obvious on the page.
5. Reuse source labels and IA unless the user explicitly asks to depart from the source or the source is clearly broken.

## Source-parity rule

For migration work, do not redesign away from the source by default. Your job is to make the Mintlify version feel polished while preserving the customer's visible IA, terminology, page hierarchy, chrome, and body structure. If a parity manifest exists, every navigation or page-structure change must preserve the manifest page set:

- No `done` manifest page becomes orphaned from `docs.json`.
- No source sidebar label is renamed without a source-backed reason.
- No source H1 or visible subtitle is replaced with agent-written copy.
- Any intentional departure from the source is noted in the handoff.

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
- **Do not wrap a single page in a sibling group whose label matches the page label.** A `{ "group": "Overview", "pages": ["api-reference/introduction"] }` next to multi-page sibling groups (`V2 endpoints`, `V1 endpoints`) renders as a redundant `Overview > Overview` row pair in the sidebar. Tab-level `pages` arrays accept a mix of string slugs and group objects, so flatten the single page to a top-level entry alongside the sibling groups. See [reference.md → Single-page wrapper groups create duplicate sidebar entries](reference.md). This is a `/preview-qa` Gate 3 check.
- **Rename duplicated category landing pages with `sidebarTitle: "Overview"`.** When a multi-page group's landing page shares the group's title (sidebar shows `Manage > Manage > About...` or `Cortex MCP > Cortex MCP > Configuring...`), set `sidebarTitle: "Overview"` in the landing page's frontmatter. The page's H1, URL, and SEO title stay the same; only the sidebar label changes. Apply consistently across **every** duplicated group/page pair in one pass — the defect almost never appears in isolation, and partial fixes are obvious to reviewers. Skip this when the landing page is the *only* page in its group (then the group itself should be flattened — see previous bullet).
- **Use icons only on top-level major sections.** Sub-groups and individual pages stay icon-free. Icons on every level (top groups *and* their sub-groups *and* the pages inside) read as decorative noise rather than section signals — the parent icon already established the section. The single exception is a flattened single-page peer (per the previous bullet): when an `Overview` page sits as a peer of iconed sibling groups at the same level, keep its `frontmatter.icon` so it doesn't read as an orphaned subpage. See [reference.md → Icon hierarchy: top-level only](reference.md). This is a `/preview-qa` Gate 3 check.

### Mintlify collapsible navigation guardrail (critical)

Check this proactively during every source-mirror review, not only when the user asks. If the source site's sidebar shows chevrons / caret toggles next to section headers, the preview must show them too. Missing collapsibility is one of the most common silent parity gaps on first-pass migrations.

**Core rules**

- `expanded` only affects nested groups (a `group` inside another group's `pages` list).
- Top-level groups are always expanded in Mintlify and **cannot** be collapsed.
- If a section is long because `group.pages` contains many direct string paths, adding `expanded: false` alone will not change the scroll length.
- Never remove pages to shorten navigation. Reorganize only.

**Pattern A — Long single section needs an inner toggle**

For one flat section that is too long to scroll, preserve the section overview page as the first direct page and move the remaining direct pages into a nested subgroup such as `Guides` with `expanded: false`. The inner subgroup gets a chevron; the outer section stays as a header.

**Pattern B — Wrapper-group demotion (whole tab should be collapsible)**

When the source's sidebar shows every section with its own chevron (Introduction, Connect, Transform, etc. each toggle independently), the preview's tab needs **wrapper-group demotion**:

- Wrap all of a tab's existing top-level groups inside a single outer "wrapper" group.
- This demotes every original section to nested-group status, which makes them eligible for `expanded: false`.
- Set `"expanded": false` on every demoted section so they start collapsed; Mintlify auto-expands whichever section contains the active page.
- The wrapper's name is rarely visible on its own — pick a name that matches the tab label (`"User Guide"` for the User Guide tab, `"API docs"` for the API docs tab, `"Templates"` for the Templates anchor) so it reads naturally if it ever surfaces.
- See [reference.md → Wrapper-group demotion for collapsible sections](reference.md) for the JSON pattern and a worked before/after example.

Apply Pattern A when one section is the problem; apply Pattern B when every section in a tab needs to be collapsible.

**Validate parity after restructuring**

- Same unique page paths before vs after for the affected tab or section.
- No duplicate page paths.
- No `*.mdx` file under the affected product prefix is orphaned from nav.

Fail the task if any parity check fails; fix the restructuring logic instead of hand-dropping pages.

### Multi-product top dropdowns — `navigation.products` (theme-sensitive)

When the source's chrome shows a product selector next to the logo (clickable label like "Knowledge base" / "API Documentation" that swaps the entire tab bar and sidebar when selected — e.g. the Benchling docs or Supermetrics docs), the right surface is `navigation.products`, **not** a row of top-level `tabs`. The give-away in the source is that selecting the dropdown changes *both* the visible tabs and the sidebar contents.

Two non-obvious constraints that cost real time when missed:

1. **Theme matters — and mstack is always on `luma`.** `navigation.products` renders as a navbar dropdown next to the logo only on themes that support it (`luma` and `aspen` confirmed working). On `maple` the same config falls through to a sidebar-rendered selector that looks like a defect — one of several reasons mstack never uses `maple` (see *Theme choice affects the navbar architecture* below and `create-landing-page` → Gotcha 2 → "Theme policy"). Because every mstack preview is on `luma`, the product selector just works; if you ever encounter a `maple` site, convert it to `luma` before debugging the config.
2. **Flatten `products[*].tabs` into `products[*].groups`.** Each product can contain `tabs` *or* `groups`. Leaving `tabs` in place renders a second tab row in the navbar (below the product selector), crowding out the selector label. Each product's groups should sit directly in the sidebar so the navbar only shows: logo · `<Product selector>` · search · utility links · CTA.

Canonical shape:

```json
{
  "navigation": {
    "products": [
      {
        "product": "Knowledge base",
        "icon": "book",
        "groups": [/* sidebar groups for product 1 */]
      },
      {
        "product": "API Documentation",
        "icon": "code",
        "groups": [/* sidebar groups for product 2 */]
      }
    ]
  }
}
```

Mintlify also renders a second copy of the selector at the top of the sidebar by default. If the source only shows the navbar copy, hide the sidebar copy in `custom.css` rather than removing it from config:

```css
#sidebar [data-product-selector] { display: none; }
```

Verify after editing by loading a page from each product and confirming (a) the navbar shows the product label + icon + chevron, (b) clicking it opens a menu of the other products, and (c) the sidebar shows only that product's groups.

### Tabs vs sibling groups — match the source toggle

Mintlify `tabs` always render as a visible toggle bar above the page content. The buttons are intrinsic to the `tabs` shape — there is no setting that hides them. So `tabs` is a chrome decision, not just an internal nav structure.

Decide between `tabs` and sibling `groups` from the source, never from the file system or convenience:

| Source shows | Use in `docs.json` |
|---|---|
| Visible tab toggle buttons above the page (e.g. Stripe's Payments / Connect / Issuing) | `tabs` |
| One continuous sidebar with multiple sections, no top-of-page toggle (e.g. Pathway) | sibling `groups` under one parent (or root-level `groups`) |

Both directions are defects:

- **`tabs` where the source has no toggle** — most common, usually because an agent reaches for `tabs` to satisfy the "one type of child per level" nesting rule when wrapping content under an anchor, dropdown, or tab. The fix is to flatten `tabs` to sibling `groups`. See [reference.md → Flattening `tabs` to sibling `groups`](reference.md).
- **Sibling `groups` where the source shows a tab toggle** — less common but equally wrong. The fix is to promote the groups into `tabs` modeled on the source's top-of-page sections. See *Restructuring a large, flat navigation* below for the taxonomy and parity rules that govern this direction.

This applies in all three contexts: at the navigation root, inside a dropdown's `anchors`, and inside an anchor's children. The check is always the same — fetch the source page being mirrored and look at what is rendered above the sidebar / content. If a tab-button row is present, the preview needs `tabs`; if not, the preview needs sibling `groups`.

### Restructuring a large, flat navigation

Apply this workflow when `docs.json` has a single tab with many flat groups, when a tab has more than ~15 groups, or when the site spans multiple distinct product lines. Follow every step — skipping one is the main source of first-pass mistakes.

**1. Model tabs on the customer's real product taxonomy, not on folder names.**

- Before designing tabs, look at the customer's public docs landing page (for example via `WebFetch` or the external-links context) and use its top-level sections as your tab list.
- If the customer site exposes Payments / API Reference / Developer Tools at the top, your tabs should mirror that — even when the repo folders are organized differently.
- Only invent a tab when a product area is large enough to justify its own top-level space (rule of thumb: >50 pages or a distinct user persona).
- Do not use `tabs` if the source has no top-of-page tab toggle. Use sibling `groups` instead. See *Tabs vs sibling groups — match the source toggle* above.

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

### Do not duplicate the sidebar in category landing-page bodies

Migration transformers (especially for GitBook and Docusaurus sources) often emit a synthesized "Explore guides for X below" intro plus a `<CardGroup>` listing every child page on each category landing page. The sidebar already lists those children — the in-body CardGroup is a verbatim duplicate of the navigation a click away.

When the source's category landing page has its own intro paragraph or description, keep it. When the source page is empty (the agent inserted the boilerplate `Explore X below` + auto-generated `<CardGroup>` because the source had no body), strip both. The page should render with just the title and any real description, and let the sidebar handle discovery.

Detection: grep for repeated synthesized phrases (`Explore guides for`, `Explore X below`, `In this section you'll find`) followed by `<CardGroup>` whose `<Card href>` values match the page's siblings in `docs.json`.

### Icon parity — match the source's icon usage

Don't add icons to top-level tabs, groups, or nested groups *unless the source actually uses them*. Many docs sites use clean text-only navigation, and adding Font Awesome icons everywhere — even tasteful ones — visibly diverges from the source brand.

Check the source navbar and sidebar before adding any `icon` field. If the source is icon-free, strip `icon:` from every tab and nested group in `docs.json`. The reverse is also a defect: if the source shows distinct icons per top-level section, mirror them (see *Pick the icon library before mapping icons* below for the library-mismatch trap).

## Homepage and landing page rules

For docs homepages and landing pages:

1. Use a strong hero with one clear headline, one supporting sentence, and one primary CTA.
2. Make the first meaningful action visible above the fold.
3. Follow the hero with scannable navigation cards.
4. Add a quick-start or first-request section early.
5. Keep support, community, or secondary resources lower on the page.
6. End with a closing CTA only if it helps the main journey.

Avoid marketing-style bloat. A docs homepage should help users start and orient quickly.

### Chrome continuity — match the homepage's navbar/tabs to the rest of the site

The single most jarring homepage defect is a visible chrome shift between `/` and every other docs page. Symptoms: the navbar logo jumps a few pixels, the tab row reflows, the demo CTA changes shape, the search bar reposition. Reviewers describe it as "jarring", "stitched together", or "two different sites". Almost always the cause is the same: the landing page uses `mode: "custom"` with a bespoke `<div role="banner">` header that looks *close* to Mintlify's standard navbar but isn't pixel-identical.

Pick the chrome strategy before building the landing:

- **Shared chrome (default).** When the rest of the docs use Mintlify's standard navbar + tab strip (Stripe, HubSpot, Vercel, and most modern dev-docs sites do this), the homepage should reuse the same chrome. Set `mode: "custom"` on the homepage — on `luma` it keeps the navbar + tab strip while natively hiding the sidebar, TOC, page header, and footer-nav — and move marketing-nav items into `docs.json` (`navbar.links` for the link row, `navbar.primary` for the CTA). Zero visible seam. Two traps: `mode: "wide"` does **not** hide the sidebar, and CSS-only sidebar hiding breaks silently when Mintlify's DOM ids shift (`#sidebar` → `#sidebar-content`). Because `mode: "custom"` also strips all built-in margins, every homepage section must supply its own max-width container with horizontal gutters. See `create-landing-page` → Gotcha 2 → Strategy B for the full spec.
- **Bespoke header (occasional).** Only when the source's marketing site has a navbar that *cannot* be replicated with `docs.json` alone (composed logo + tagline, multi-row chrome, unusual layout) and the customer explicitly wants it on the homepage only. Accept that the chrome shift will be visible and ship the bespoke header at pixel parity with the standard navbar's height, font weights, and spacing.

Default to shared chrome. The bespoke-header path almost always produces the "jarring shift" feedback within a review cycle; switching back is cheap (the existing hero + sections survive intact), so prefer to start there.

#### Theme choice affects the navbar architecture (full-bleed heroes)

**mstack always uses `luma` and never `maple`** — and the navbar architecture is the main reason. A full-bleed hero homepage under a full-width sticky navbar is free on `luma` (one full-width sticky `header#navbar`) but expensive on `maple`, which splits the nav into a fixed logo `#sidebar` plus a separate `#navbar-transition-maple` tab strip starting at x≈304px — a full-bleed hero bleeds through both and the bar isn't full-width or solid on scroll without ~100+ lines of fragile CSS. Set `"theme": "luma"` on every site; if you inherit a `maple` site (or `mint init` scaffolds one), convert it to `luma` rather than writing CSS to fake the bar. Theme is site-wide, so re-check a normal content page after switching. This is the same class of theme-sensitivity as `navigation.products` above; see `create-landing-page` → Gotcha 2 → "Theme policy" for the DOM detail.

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

   **Verify the wrapping anchor's label against the source.** When you use the wrapping-anchor pattern (an `anchor` with `groups` instead of `href`) to satisfy the "one type of child per level" nesting rule, Mintlify renders the wrapper's label as a visible clickable tab in the sidebar — *not* as invisible scaffolding. Before introducing a wrapper labelled "Documentation", "Templates", "Reference", etc., check the source sidebar for a matching label. If the source has no such label, the wrapper introduces a chrome defect; pick a label that exists on the source, or drop the link-button anchors so `groups` can sit directly under the dropdown without a wrapper. Do **not** try to put `groups` as a sibling of `anchors` inside a `dropdown` to remove the wrapper — Mintlify rejects this structure and the navbar disappears entirely. See reference.md for the schema warning and supported alternatives.
4. **Check collapsibility behavior on the source.** Look for chevrons / carets next to each section header in the source sidebar. If the source's sections collapse/expand independently and the preview shows everything fully expanded with no toggles, the preview is missing a collapsibility pass. Apply the right pattern from the *Mintlify collapsible navigation guardrail* above (Pattern A for one long section, Pattern B / wrapper-group demotion for a whole tab). Toggle a section open and closed on the source to confirm before mirroring — some sites use static section headers that visually resemble chevrons but aren't interactive.
5. **Verify visually after editing.** Open the preview in `mint dev` and confirm each section shows the right anchor buttons in the right order with the right icons, and that section toggles match the source. JSON validity is not enough — see the validation workflow below.

### Top horizontal bar — one row, one config surface

If the source paints a single horizontal row of links above (or below) its navbar — `Guides | API Explorer | Discussions | News | Status | Tech Blog`, etc. — every item in that row must live in **one** Mintlify config surface: `navigation.tabs`. Splitting the row across `navigation.tabs`, `navbar.links`, and `navigation.global.anchors` is the most common cause of "horizontal bar doesn't match" defects, because each of those surfaces renders in a different region of the UI:

| `docs.json` surface | Where it renders | Use for |
|---|---|---|
| `navigation.tabs` | The inline horizontal tab row under the navbar | Every item the source shows in its single horizontal bar — internal pages and external destinations alike |
| `navbar.links` | Top-right of the navbar, next to the primary CTA | Right-side utility links the source actually anchors right (sign-in, contact, login on small sites that don't have a CTA button) |
| `navbar.primary` | The right-most CTA button in the navbar | The single primary action (Log In, Get a demo, Sign up) |
| `navigation.global.anchors` | Persistent anchor rail at the **top of the sidebar** (left side, below the tab row) | Only when the source shows a sidebar-anchor rail — never as a fallback for "this item didn't fit in tabs" |

The trap is reaching for `navbar.links` whenever an item is external (Status pages, Discourse forums, blogs hosted off-site) and reaching for `navigation.global.anchors` whenever an item has an icon. Both produce a fragmented preview where the source's one row becomes three separate UI surfaces, often with the same items registered twice and rendering twice.

**`navigation.tabs` accepts `href`.** External destinations belong in `tabs` with `href`, not in `navbar.links`:

```json
{
  "navigation": {
    "tabs": [
      { "tab": "Guides", "groups": [/* ... */] },
      { "tab": "API Explorer", "groups": [/* ... */] },
      { "tab": "Discussions", "href": "https://discuss.example.com" },
      { "tab": "News and Updates", "groups": [/* ... */] },
      { "tab": "Status", "href": "https://status.example.com" },
      { "tab": "Tech Blog", "href": "https://blog.example.com" }
    ]
  },
  "navbar": {
    "primary": { "type": "button", "label": "Log In", "href": "https://app.example.com/login" }
  }
}
```

Workflow when mirroring a source navbar:

1. **Open the source navbar and count items left-to-right.** Note for each item: internal page or external URL, plain link or button.
2. **Emit them into `navigation.tabs` in that exact order.** Internal items use the standard `{ "tab": "...", "groups": [...] }` shape; external items use `{ "tab": "...", "href": "..." }`.
3. **Reserve `navbar.links` and `navbar.primary` for items the source actually anchors to the right side of the navbar** (utility links, CTA buttons). If the source has no right-side links, `navbar.links` should be absent entirely.
4. **Reserve `navigation.global.anchors` for sidebar-top anchor rails.** If the source has no sidebar anchor rail, `navigation.global.anchors` should be absent entirely. Do not treat it as a "leftover" surface for items that didn't fit in `tabs`.
5. **Audit for duplicates after editing.** No item should be registered in more than one of `tabs` / `navbar.links` / `global.anchors`.

This applies in both directions — promoting items into `tabs` to fix a fragmented row, and removing items from `tabs` when the source shows them on the right side or in the sidebar rail. The check is always the same: open the source, identify each visible region, map each item to exactly one surface.

### Logo and brand mark parity

The navbar logo is a separate chrome dimension that fails in characteristic ways. The single biggest trap: the source's top-left mark is rarely *just* a wordmark. It is usually composed — wordmark plus a subtitle ("Developers", "Docs", "for Teams"), or wordmark plus a version badge, or wordmark plus a thin tagline. Pulling only the wordmark SVG from the source's static assets gives you a logo that looks "close" but is missing visible content.

Steps to land logo parity in one pass instead of three:

1. **Inspect the source navbar visually first, not the static asset.** Open the live source URL, look at the top-left, and identify every element that renders there. Screenshot the navbar and zoom in. Common compositions:
   - Wordmark + stacked subtitle text (Pathway: `pathway` over `developers`).
   - Wordmark + inline subtitle (`Stripe Docs`, where `Docs` is a separate span).
   - Wordmark + version / channel badge (`v2`, `Beta`).
   - Wordmark + product-line label (`for Teams`).
2. **Inspect the source DOM, not just the asset.** The navbar logo is often `<img src="logo.svg">` *plus* a sibling `<span>` or `<div>` rendered by the source's framework. If you only download `logo.svg` and ship it, you drop the sibling element. Open DevTools on the source navbar, find the logo container, and read every child node — text, SVG, or both.
3. **Bake composed elements into the SVG.** Mintlify's `logo.light` / `logo.dark` are single image references — there is no native "logo + tagline" composition. If the source's mark is composed, reconstruct it as a single SVG: extend the `viewBox`, add a `<text>` element with the subtitle (font-family list with sensible fallbacks: source font → web-safe → system), and set fills per mode. See [reference.md → Logo composition and sizing](reference.md) for the canonical SVG pattern.
4. **Adjust `img.nav-logo` height when the SVG is taller than a wordmark.** Mintlify renders the navbar logo at a default `h-6` (24px). A two-line composed mark at 24px collapses both lines into illegibility. Override in `custom.css`:

   ```css
   img.nav-logo { height: 2.75rem; }
   ```

   Pick the height by measuring the source's rendered logo height (DevTools → computed → `height`), not by eye. Confirm against the source navbar; the wordmark glyph height in the preview should match the wordmark glyph height in the source.
5. **Light + dark variants always.** `logo.light` is the file used in light mode, `logo.dark` in dark mode. The source's brand color usually flips — dark text on light, light text on dark. Build the two SVGs with explicit `fill` colors (do not rely on `currentColor` and a Mintlify mode hook; those don't exist for navbar logos). Verify both modes side-by-side against the source.
6. **Match `logo.href`** to whatever the source's logo links to (usually the docs root or the marketing root). A logo that links to the wrong destination is a chrome defect even when the visual is pixel-perfect.

When in doubt, do a side-by-side screenshot of the source navbar and the preview navbar at the same viewport. The full top-left mark — every glyph, every tagline, every badge — must match.

### Frontmatter renders visibly — never fabricate it

Treat MDX frontmatter as visible page chrome, not as out-of-band metadata. Every supported field has a rendering side effect:

- `title` -> page H1 + browser tab + (often) sidebar entry
- `sidebarTitle` -> sidebar label
- `description` -> **subtitle text directly below the H1**, plus `<meta name="description">`
- `icon` -> sidebar icon next to the entry
- `mode` -> page width / chrome / TOC visibility

The recurring trap is `description`. It looks like SEO metadata, and converters tend to auto-generate it from the body's first paragraph or a `Welcome to the <Product> developer hub`-style template. Mintlify renders that synthesized string verbatim as a subtitle on the page, which means a fabricated description is *visible content the source doesn't have* — a direct violation of the project's content-preservation rule.

The rule for every frontmatter field:

- If the source page renders matching text/icon/chrome -> copy it **verbatim**.
- If the source does not -> **omit the field**.
- Never paraphrase, summarize, or template-fill a frontmatter value to make a field "feel complete".

Specifically for `description`: only set it when the source page has explicit subtitle / lead text rendered under the H1. Otherwise leave `description` out entirely. Empty SEO `<meta description>` is acceptable; visible subtitle text the source doesn't have is not. See [reference.md → Frontmatter renders visibly](reference.md). `/preview-qa` Gate 2 audits this against the live source.

**Do not add site root `index.mdx` to a sidebar group by default.** Mintlify serves `index.mdx` at `/` even when it is hidden from navigation. Include it only when the source visibly has a Home entry or the page must participate in navigation-backed search/assistant indexing, and then prefer a dedicated top-level page or Home tab. The recurring defect is `index.mdx` inside a "Getting Started" group next to an `Overview` page, which renders duplicate `Home` and `Overview` rows. See [reference.md → Site root `index.mdx` and the sidebar](reference.md). A deliberately hidden homepage is an allowed exception to the `/preview-qa` Gate 1 "no orphan MDX" rule.

### Browser tab `<title>` parity

The browser tab title is a parity dimension that sits outside the visible chrome and is the easiest source-mirror gap to miss. It does not surface in `mint validate`, it is not part of the sidebar audit, and the user only sees it in their tab strip — so it lives or dies on a deliberate check.

Mintlify generates the browser tab `<title>` for every page from this template:

```
<frontmatter.title> - <docs.json.name>
```

The separator (` - `, hyphen with surrounding spaces) is hardcoded by Mintlify. There is **no native override** for the browser tab `<title>` — `og:title` and `twitter:title` frontmatter overrides only affect Open Graph / Twitter card titles, not the browser tab itself. See [reference.md → Browser tab title and SEO meta tags](reference.md) for the full mechanism breakdown.

Practical implications:

- **`title` controls both the page H1 and the browser tab.** They cannot diverge through `title` alone. If the source uses a short browser-tab title and a long H1, you must pick one.
- **The separator is fixed.** If the source uses ` | ` or ` — `, the preview will still render ` - `. Document this as a known divergence in the QA report; do not try to patch it with custom JS (see *Custom JavaScript rules*).
- **`docs.json.name` is the suffix.** Match the navbar text on the source — usually a short product name, not the legal name.

When the source's browser tab format differs from its H1 (common: long marketing-style H1, short product-name browser tab):

| Source pattern | Recommended frontmatter |
|---|---|
| H1 long, tab short ("Welcome to Foo Documentation!" / "Welcome \| Foo") | Set `title` to the short tab version. Place the long H1 as the first `# Heading` in the MDX body. |
| H1 and tab match (most pages) | Use the source's title verbatim in `title`. |
| H1 contains characters Mintlify drops (rare) | Set `title` to the cleaned tab version, place the original as `# Heading` in the body. |

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
| Page background color — **single tone** (light + dark) | `docs.json` → `background.color`. **Do not** combine with `background.decoration` unless the source has a matching decorative pattern — `decoration` ignores `color` and tints the page with `colors.primary`. See [reference.md → Background `decoration` is tinted by `colors.primary`](reference.md). |
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
- **Logo composition** — the source's navbar mark is often a wordmark *plus* a subtitle, badge, or tagline rendered as a sibling DOM element. Pulling only the wordmark SVG drops the rest. Inspect the source navbar visually and in DevTools before grabbing assets, then bake the composed mark into a single SVG and bump `img.nav-logo` height in `custom.css` so both lines stay legible. See *Logo and brand mark parity* above and [reference.md → Logo composition and sizing](reference.md). Do not try to recreate the subtitle via Mintlify config — there is no native "logo + tagline" field.
- **`colors.light` / `colors.dark`** — these are the **brand color** in each mode, not the page background. Putting `#ffffff` in `colors.light` turns every CTA white. Two further constraints, both silent failures: (a) `colors.light` is the **dark-mode emphasis** color and must be visibly **lighter / brighter** than `colors.primary` so it pops against a dark background; making it darker than `primary` produces muddy links and an unreadable active sidebar item in dark mode. (b) All three tokens (`primary`, `light`, `dark`) must sit in the same hue family (within ~5°). The recurring trap is generating `colors.light` from a "lighter shade" picker that drifts hue alongside lightness — e.g. green primary at hue ~122° paired with a "lighter" mint/teal at hue ~158° — so the brand visibly shifts hue when the user toggles theme. See [reference.md → Brand color ramp: `primary` / `light` / `dark` semantics](reference.md) for the deterministic ramp recipe.
- **Font weights** — when `@import`-ing a font, request the weights you actually use (e.g. `400,500,600,700`). Missing weights silently fall back to the nearest available, producing inconsistent heading thickness.
- **Single-tone backgrounds when the source is multi-tone** — if the source site uses different colors for the page chrome, the sidebar panel, the navbar, and the main content (very common: grey page / light-grey sidebar / white content), setting only `body { background: ... }` paints everything one color because Mintlify's regions inherit the body bg by default. Override each region in `custom.css` using the selectors documented in [reference.md → Mintlify layout regions and selectors](reference.md). The most common trap: the sidebar panel is `#sidebar-content`, **not** `#sidebar` — guessing `#sidebar` produces a styled-but-still-grey sidebar that passes a quick visual check.
- **Stray `background.decoration` tinting a plain source** — `docs.json` `background.decoration` (`"windows"`, `"grid"`, `"gradient"`) draws a pattern derived from `colors.primary`. When the source is a flat solid color (most often `#ffffff`), the decoration paints a faint tint of the brand color over every region — a purple primary produces a lavender cast (`#f0e9f3`-ish), a teal primary produces a pale teal cast, etc. JSON validates, the decoration renders, and every preview pixel is subtly wrong. Detect by pixel-sampling the source body bg at four points; if uniform, drop the `background` block entirely (Mintlify defaults to white) or set `background.color.light/dark` explicitly — never alongside `decoration`. See [reference.md → Background `decoration` is tinted by `colors.primary`](reference.md).

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

## Custom JavaScript rules

Mintlify v4 has **no native support for arbitrary custom JavaScript**. There is no `customScripts`, no `head`, no `<script>` injection in the `docs.json` schema. Root-level `.js` files (e.g. a `custom.js` next to `custom.css`) are inlined as Next.js data payloads (`self.__next_f.push([1, "..."])`), **not** as executable `<script>` tags. They will not run in the browser, and the failure is silent — `mint dev` builds, the file is served, nothing runs.

Do not write a root `custom.js` and assume it will execute. This is the most expensive trap in custom Mintlify work.

Three correct paths when behavior must run in the browser:

1. **Mintlify's native components and `docs.json` settings.** Almost every common ask (GitHub link in the navbar, external sidebar link, primary CTA, dropdown anchors, themed colors) has a native solution. Exhaust this option first — see [reference.md → Navbar and external sidebar links](reference.md) for the canonical patterns.
2. **Build-time mutation of `docs.json`.** For data that needs to be "live-ish" (GitHub star count, latest release version, etc.), write a small Node script that fetches the value and patches `docs.json` in place, and wire it into a CI job or pre-commit hook. The label is then static at build time but updates whenever the script runs. See [reference.md → Live-ish data via build-time updater](reference.md).
3. **Google Tag Manager** (`integrations.gtm.tagId` in `docs.json`). This is the only supported in-browser JS injection. Configure a custom HTML tag in GTM that runs the JS you need. Heavyweight; only reach for it when paths 1 and 2 cannot meet the requirement.

Before writing any client-side JS, confirm with the user which of the three paths they want. Do not default to writing a `custom.js` file.

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
