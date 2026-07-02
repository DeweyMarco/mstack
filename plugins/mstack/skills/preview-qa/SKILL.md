---
name: preview-qa
description: Mechanical parity QA gate that runs every deterministic check on a Mintlify preview before handing it to /han-review. Use after /style-docs, before /han-review, or any time a preview is about to be shown to a customer, designer, or stakeholder. Catches chrome, icon, collapsibility, background, and structural-parity defects so /han-review can focus on subjective polish.
---

# Preview QA

Self-check skill that walks every deterministic parity gate on a Mintlify preview before it is shown to a human reviewer. Every gate has a clear pass/fail signal. This skill is a **hard gate** — do not declare a preview ready for `/han-review` until every gate below passes.

## When to use

- After `/style-docs`, `/create-landing-page`, and the second `/fix-broken-links` pass; before `/han-review` in the migration workflow.
- Before sharing a preview URL with a customer, designer, or stakeholder.
- After any substantive change to `docs.json`, `custom.css`, or a page that mirrors a source URL.

The Han review is for subjective polish — *does this feel launch-ready?*. Preview QA is for the long tail of mechanical defects that are deterministic to detect: missing chevrons, blank icons, monotone backgrounds, asymmetric CTAs, dropped pages, wrong icon library, mismatched per-section anchors. The preview must not contain any of these when a human reviewer sees it.

## Inputs

- The preview repo, with `mint dev` runnable locally.
- The live source URL, plus one URL per section if the source has section-specific chrome (Framework, Templates, API reference, etc.).
- A list of pages that mirror source URLs — typically every page produced by `/docs-to-mintlify`, plus any custom pages from `/create-landing-page`.

## Position in the workflow

```
/docs-to-mintlify → /fix-broken-links → /style-docs → /create-landing-page → /fix-broken-links → /preview-qa → /han-review → optional /agent-ready-docs
```

`/preview-qa` is the last automated gate before the human review. It does not produce new content; it verifies what is already there. On any failure, route to the appropriate fix skill, then re-run `/preview-qa` from gate 1. If `/agent-ready-docs` runs after `/han-review` and changes visible content, navigation, or page splits, re-run `/fix-broken-links` and `/preview-qa`.

## The QA standard

Every gate below must pass before declaring the preview ready for `/han-review`. Each gate states what to verify, how to verify, and where to fix on failure.

### Gate 1 — Configuration and validation

Run these first; they are cheapest and catch the largest class of defects.

- [ ] `docs.json` parses as valid JSON. `python3 -m json.tool docs.json > /dev/null` exits 0.
- [ ] `mint validate` passes with zero parser errors.
- [ ] `mint broken-links` passes with zero broken refs. On failure → `/fix-broken-links`.
- [ ] No orphan `.mdx` files: every MDX file under managed directories appears in the `docs.json` navigation, and every nav entry resolves to an existing file. **Exception**: the site root file (`index.mdx`, or whichever file Mintlify serves at `/`) is *expected* to be orphan from sidebar groups — it's reached via the navbar logo and `/`. Listing it inside a sidebar `pages` array produces a duplicate entry; see Gate 3 *Site root not duplicated as sidebar entry*. On failure → `/style-docs` "Restructuring a large, flat navigation".
- [ ] `mint a11y` warnings either fixed or explicitly accepted in the QA report.
- [ ] **No root `custom.js`** (or any other `.js` file at the repo root) is being relied on for runtime behavior. Mintlify v4 does not execute root-level JS — it inlines the file as Next.js data and never runs it. If a `custom.js` exists, verify whether it is dead code (delete) or whether the behavior it tries to provide should be re-routed to native Mintlify config, a build-time `docs.json` updater, or GTM. See `style-docs/SKILL.md` → *Custom JavaScript rules* and `style-docs/reference.md` → *No arbitrary custom JavaScript in Mintlify*.

### Gate 1.5 — Port-artifact sweep (for HTML-scraped sources)

`mint validate` accepts dozens of malformed-but-parseable patterns that render as visibly broken Cards, Steps, code blocks, and admonitions. Run this gate **after** Gate 1 and **before** Gate 2 — every regex below must return zero hits before continuing. These patterns are documented in full (with detection commands and corrected MDX) at `docs-to-mintlify/references/mdx-conversion.md → Port-artifact patterns to detect and fix in the transformer`. If any hit, route to that reference and patch the originating transformer rule before regenerating the affected files; do not hand-fix individual pages, the patterns recur across hundreds of files.

- [ ] **Pattern A — broken-card link smash:** multi-line `[emoji\n\n#### Title\n\nbody](url)` blocks. Run:
  `python3 -c "import re,glob; print(sum(1 for f in glob.glob('**/*.mdx', recursive=True) if re.search(r'\[\s*[\U0001F000-\U0001FFFF☀-➿][^\]]*?####[^\]]*?\]\([^)]+\)', open(f).read(), re.DOTALL)))"`
- [ ] **Pattern B — inline emoji card:** `[📋Title](url)` with emoji glued to label. Run:
  `grep -rlE '\[[^a-zA-Z0-9 ]+[A-Z][^]]+\]\([^)]+\)' --include='*.mdx' . | wc -l`
- [ ] **Pattern C — broken Steps:** link-wrapped `[1\n\n### Title\n\nbody](url)`. Run:
  `python3 -c "import re,glob; print(sum(1 for f in glob.glob('**/*.mdx', recursive=True) if re.search(r'\[\s*\d+\s*\n\s*\n\s*###[^\]]+\]\([^)]+\)', open(f).read(), re.DOTALL)))"`
- [ ] **Pattern D — orphan emoji + heading + body (no bracket anchor):** the trap pattern; do not skip even if Pattern A is clean. Run:
  `python3 -c "import re,glob; print(sum(1 for f in glob.glob('**/*.mdx', recursive=True) if re.search(r'^[\U0001F000-\U0001FFFF☀-➿]\s*\n\s*\n####\s', open(f).read(), re.MULTILINE)))"`
- [ ] **Pattern E — `prism-code` fences:** `grep -rl '\`\`\`prism-code' --include='*.mdx' . | wc -l`. Each hit is a code block with disabled syntax highlighting.
- [ ] **Pattern F — Docusaurus admonitions in frontmatter:** `grep -rlE '^description:\s*"?:::' --include='*.mdx' . | wc -l`. Each hit renders `:::warning` literally under the page H1.
- [ ] **Pattern G — HTML escape leakage outside code fences:** placeholders like `&lt;bucket&gt;` or raw `<bucket>` rendering as JSX. Visually spot-check 10 connector / SDK reference pages.
- [ ] **Pattern H — orphan `---` rules:** `python3 -c "import re,glob; print(sum(1 for f in glob.glob('**/*.mdx', recursive=True) if re.search(r'^---\s*\n\s*\n---', open(f).read(), re.MULTILINE)))"`
- [ ] **Pattern I — whole-page link-smash:** open every `index.mdx`, `overview.mdx`, and `all-*.mdx` in `mint dev`. Any page where the body renders as one giant clickable region is a link-smash and needs hand rebuild into a `<CardGroup>`.
- [ ] **Pattern J — source chrome leakage:** `grep -rlE '^(Copy page|Edit on GitHub|Was this helpful)' --include='*.mdx' . | wc -l`

On any non-zero result → route to `/docs-to-mintlify` and patch the transformer rule. **Do not** hand-fix individual files; the bug is in the conversion and will recur the next time the corpus is regenerated.

### Gate 2 — Source-mirror parity (per page)

For each preview page that mirrors a source URL:

- [ ] **Body structure** matches: column count, card count, step count, tab count, section ordering. See `style-docs/SKILL.md` → *Mirror the source layout, not just the tokens*.
- [ ] **Repeated patterns** applied to every sibling: matching CTAs in every card, identical badges per row, the same icon style on every tile. Partial application of a repeated pattern is the most common preview-quality regression.
- [ ] **Component-first**: existing layout primitives (`<CardGroup>`, `<Card>`, `<Columns>`, `<Steps>`, `<Tabs>`, `<AccordionGroup>`) preserved. No custom HTML wrapper added to host a single child. See `style-docs/SKILL.md` → *Edit existing components in place*.
- [ ] **Wording preserved**: card titles, section headers, descriptions copied verbatim from source — no paraphrasing. Per the project's migration rules (`AGENTS.md`).
- [ ] **Frontmatter parity** (every page): every visible-rendering frontmatter field matches the source.
  - `title` matches the source page H1 (or, when the source's H1 and browser tab diverge, see the *Browser tab `<title>` parity* gate below).
  - `sidebarTitle` matches the source sidebar label, or is omitted if it equals `title`.
  - `description` matches the source's rendered subtitle text under the H1 *verbatim*, or is **omitted** when the source has no subtitle. **A `description` value that doesn't appear on the source is a defect**, regardless of whether it parses as valid YAML or improves SEO — Mintlify renders `description` as visible subtitle text below the H1, not just as a `<meta>` tag. To verify, load the page in `mint dev` and read the line directly under the H1; if any text appears there that is not on the source's rendered page, the fix is to delete `description:` from the file's frontmatter (do not move the text into the body). See `style-docs/SKILL.md` → *Frontmatter renders visibly* and `style-docs/reference.md` → *Frontmatter renders visibly*. The most common origin is `/docs-to-mintlify` synthesizing `description` from the body or a generic `Welcome to the <Product> developer hub` filler.
  - `icon` is set only when the source sidebar shows a matching icon for that entry.
- [ ] **Browser tab `<title>` parity**: open the page in `mint dev`, read the actual browser tab, and compare to the same URL on the live source. Mintlify renders `<frontmatter.title> - <docs.json.name>` with a hardcoded ` - ` separator and no native override. Two failure modes to catch:
  - `frontmatter.title` does not match the page-specific portion of the source's browser tab — fix per page.
  - `docs.json.name` does not match the site-wide suffix of the source's browser tab — fix once at the site level.
  
  If the source uses a different separator (` | `, ` — `), document the divergence in the QA report; it is not natively fixable and does not block handoff. See `style-docs/SKILL.md` → *Browser tab `<title>` parity* and `style-docs/reference.md` → *Browser tab `<title>` and SEO meta tags*.

On failure → fix in place using the minimum-diff rule. If the issue is structural across many pages, route to `/style-docs`.

### Gate 3 — Chrome parity (global and per-section)

Run **per dropdown and per tab**, not only globally. Many source sites show different sidebar anchor buttons per section, and a global-only check will miss this.

- [ ] **Global chrome** matches source: top navbar links (count and label), footer socials and links (count and label), primary CTA, search behavior.
- [ ] **Top horizontal-bar single-row parity.** Open the source navbar and count the items it paints in its inline horizontal row, left-to-right. Every one of those items must live in `navigation.tabs` in the same order — internal pages as page references, external destinations as `tabs` entries with `href`. The same item must not also appear in `navbar.links` or `navigation.global.anchors`; duplicate registrations render the entry twice (once in the tab row, once in the sidebar rail or top-right of the navbar). If the preview's tab row is shorter than the source's, the missing items have almost certainly been mis-routed to `navbar.links` (because they're external) or to `navigation.global.anchors` (because they have icons) — promote them into `tabs` rather than leaving the row split. Reserve `navbar.links` for right-side utility links the source actually anchors to the right (sign-in, contact), `navbar.primary` for the right-side CTA button, and `navigation.global.anchors` for a persistent anchor rail at the top of the **sidebar** (not the navbar). See `style-docs/SKILL.md` → *Top horizontal bar — one row, one config surface*.
- [ ] **Navbar logo parity (composed marks).** Side-by-side screenshot the top-left of the source vs. the preview at the same viewport. Verify every typographic element matches: wordmark, *and* any stacked subtitle (e.g. "developers"), inline subtitle, version badge, or tagline the source renders in the same logo container. Pulling only the source's wordmark SVG and shipping it as `logo.light` / `logo.dark` is the most common defect — it produces a logo that looks "almost right" but is missing visible content. Composed marks must be baked into a single SVG (Mintlify has no native `logo + tagline` field) and `img.nav-logo` height bumped in `custom.css` so multi-line marks stay legible at the default 24px. Verify in **both light and dark** mode; verify `logo.href` matches the source link target. See `style-docs/SKILL.md` → *Logo and brand mark parity* and `style-docs/reference.md` → *Logo composition and sizing*.
- [ ] **Per-section sidebar anchors** match source. Fetch a page from each section (e.g. Framework, Templates, API reference) and list every anchor button in the sidebar header. Compare across sections. If the source's anchor lists differ per section, the preview's must too — use per-dropdown `anchors` arrays in `docs.json`, not `navigation.global.anchors`. See `style-docs/reference.md` → *Per-dropdown sidebar anchors*.
- [ ] **Wrapping-anchor labels match source.** When `docs.json` uses the wrapping-anchor pattern (an `anchor` with `groups` instead of `href`), Mintlify renders the wrapper's `anchor` string as a **visible clickable tab in the sidebar** — not as hidden scaffolding. List every wrapping anchor in the preview's `docs.json` and compare each label against what the source actually shows in the same dropdown context. Common defect: a "Documentation" or "Templates" wrapper introduced to satisfy Mintlify's "one type of child per level" nesting rule shows up as a blue tab the source doesn't have. See `style-docs/reference.md` → *Per-dropdown sidebar anchors* (the "Critical: the wrapping anchor's label is visible" subsection). Do **not** attempt to put `groups` as a sibling of `anchors` inside a `dropdown` to remove the wrapper — Mintlify rejects that structure and the entire navbar disappears.
- [ ] **Anchor icons render**, not just validate. Mintlify defaults to **Font Awesome** — Lucide names silently produce blank icon slots that pass JSON validation. Confirm every icon by screenshot. See `style-docs/SKILL.md` → *Pick the icon library before mapping icons* and `style-docs/reference.md` → *Icon library (Font Awesome by default)*.
- [ ] **No template defaults remain**: Blog anchor from `mint init`, Twitter / GitHub socials, "Get started" CTA, default favicon, default site name. These look normal at a glance and are the most common chrome-parity misses.
- [ ] **Top-of-page tab toggle matches source.** Mintlify `tabs` always render as a visible toggle bar above the page (e.g. "User Guide / API docs"); the buttons are intrinsic to the `tabs` shape. The check is parity in both directions:
  - If the source shows a tab-button row above the page (e.g. Stripe's Payments / Connect / Issuing), the preview must use `tabs` so the same toggle appears.
  - If the source shows no tab-button row above the page (e.g. Pathway), the preview's `docs.json` must not use `tabs` — flatten to sibling `groups`.
  
  Both directions are defects. Fetch the source page being mirrored, look at what is rendered above the sidebar/content area, and match. See `style-docs/SKILL.md` → *Tabs vs sibling groups — match the source toggle* and `style-docs/reference.md` → *Flattening `tabs` to sibling `groups`*.
- [ ] **Site root not duplicated as sidebar entry.** Open `docs.json` and confirm the site root slug (`"index"`, or whichever file Mintlify serves at `/`) does **not** appear inside any sidebar group's `pages` array. Mintlify already exposes `index.mdx` via the navbar logo and `/`; listing it inside a group adds a second clickable item whose label is driven by the homepage's `sidebarTitle` (or `title` if `sidebarTitle` is unset). The classic symptom is a Getting Started sidebar that opens with both `Home` (from `index.mdx`'s `sidebarTitle: "Home"`) and `Overview` (from the next page's `title`), where the source shows only one. The exception: if the source sidebar deliberately renders a "Home" entry, keep `"index"` in the group but verify the label matches the source verbatim and drop any duplicate "Welcome" / "Overview" sibling. See `style-docs/reference.md` → *Site root `index.mdx` and the sidebar*.
- [ ] **No single-page wrapper groups with duplicate labels.** Grep `docs.json` for any sidebar group whose `pages` array contains exactly one entry, and check whether the group label matches that page's `sidebarTitle` (or `title` if unset). If they match, the sidebar renders the entry twice — once as the group header, once as the lone page — producing the classic `Overview > Overview` defect. Most common in API reference tabs that wrap an `introduction.mdx` in a one-page `Overview` group next to multi-page sibling groups (`V2 endpoints`, `V1 endpoints`). The fix is to switch the tab from `groups` to `pages` and flatten the single page to a string slug entry alongside the sibling group objects — tab-level `pages` accepts both shapes in the same array. See `style-docs/reference.md` → *Single-page wrapper groups create duplicate sidebar entries*.
- [ ] **Icon hierarchy: top-level only.** Audit `docs.json` for `icon:` fields on **nested** groups (groups inside another group's `pages` list) and audit MDX frontmatter for `icon:` on subpages inside iconed groups. Both should be empty — icons are reserved for top-level major sections (e.g. `Get started`, `Authentication`, `Concepts` in a Documentation tab; `Overview`, `V2 endpoints`, `V1 endpoints` in an API reference tab). Sub-groups (`Account`, `Market data`, `Trading` inside V2) and individual pages inside groups should not carry icons — they read as decorative noise rather than section signals once the parent icon has established the section. The one intentional exception: a single-page top-level peer (e.g. an `Overview` page flattened from a one-page group, sitting next to iconed sibling groups at the same level) keeps its page-level `frontmatter.icon` so it doesn't render as an orphaned label-only entry next to iconed siblings. Verify by opening the rendered sidebar in `mint dev` and reading the icon column top-to-bottom for each tab — every iconed row should be a top-level major section, every sub-row should be icon-free. See `style-docs/reference.md` → *Icon hierarchy: top-level only*.
- [ ] **External destinations are not stuffed into a group's `pages` array.** Open `docs.json` and confirm every entry inside any sidebar group's `pages` is either a page slug string or a nested group object — never a `{ "anchor": "...", "href": "..." }` shape. Mintlify's schema rejects external `href` entries inside a group's `pages`; the failure mode is silent on some versions (entry dropped) and a parse error on others. If the source shows a sidebar entry that jumps to an external URL or a different internal page, route it via stub MDX + `url:` frontmatter (sidebar-click only) or stub MDX + `docs.json` `redirects` (sidebar click + direct URL hit). See `style-docs/reference.md` → *External `href` is not allowed inside a group's `pages` array*.
- [ ] **Homepage chrome: sidebar hidden, margins present.** Open `/` in `mint dev`. The docs sidebar must not render — `index.mdx` must use `mode: "custom"` (`mode: "wide"` does *not* hide the sidebar, and CSS-only hiding breaks when Mintlify's DOM ids shift, e.g. `#sidebar` → `#sidebar-content`). Then check margins at desktop and mobile widths: no text or card touches the viewport edge, every section shares one max-width column with horizontal gutters, the first section clears the tab strip, and the page ends with bottom padding (`mode: "custom"` strips all built-in margins). Navigate `/` ↔ any content page and confirm the navbar + tab strip stay completely still. See `create-landing-page` → Gotcha 2 → Strategy B.
- [ ] **Changelog is a native `<Update>` timeline with real publish dates.** If the source has a changelog: it is a **single** page of `<Update>` blocks newest-first with `rss: true` — not one MDX page per entry — with `docs.json` redirects covering every per-entry source URL. Spot-check dates: the oldest and newest labels plus three random entries must match the publish dates rendered on the source (sitemap `<lastmod>` is a re-index timestamp, not a publish date — clustered dates are the tell). Labels are unique; same-day pairs are disambiguated with time-of-day on **both** entries, never with slugs. See `docs-to-mintlify/references/changelogs.md`.
- [ ] **No parallel API playground URL space.** If endpoint pages were hand-migrated from the source, the interactive playground must overlay them via per-page `openapi:` frontmatter at the source's URLs. A separate auto-generated tab/group exposing the same operations at a second path (e.g. `/api-playground/*` next to `/reference/*`) is a defect. See `docs-to-mintlify/references/openapi.md` → *Hand-migrated endpoint pages + a spec*.
- [ ] **Per-page sidebar parity (no stacked sidebars).** For each preview page that mirrors a source URL, list every entry rendered in its sidebar — anchors, wrapping-anchor labels, group labels, nested-group labels, and page links. Compare against the rendered sidebar on the same URL on the source. The two lists must match. Two failure modes to catch, both of which pass JSON validation:
  - **Extra entries from a different top-level source section** ("stacked sidebars") — most often caused by collapsing two source sections (e.g. `User Guide` and `API docs`) into sibling `groups` under one wrapping `anchor`, which makes both render together on every page in that anchor.
  - **Visible group / wrapping-anchor labels the source does not show** — e.g. a `"User Guide"` group label introduced as scaffolding when the source's sidebar starts directly at `Introduction`.
  
  The fix is structural, not cosmetic — see the failure-routing table below.

### Gate 4 — Sidebar collapsibility parity

- [ ] If the source sidebar shows chevrons / caret toggles next to section headers and the sections collapse/expand independently, the preview does too. Mintlify top-level groups **cannot** be collapsed; if every section in a tab needs a chevron, apply wrapper-group demotion. See `style-docs/SKILL.md` → *Mintlify collapsible navigation guardrail* and `style-docs/reference.md` → *Wrapper-group demotion for collapsible sections*.
- [ ] Toggle each section open and closed in the running preview to confirm. Static section headers that visually resemble chevrons but are not interactive should not be mirrored as collapsible.
- [ ] After collapsibility restructuring, page-set parity holds: `set(new_pages) == set(old_pages)` (no page lost, no page duplicated).

### Gate 5 — Background and theme parity

- [ ] **Background pixel-sample (mandatory).** Pick four points on the source page (header, sidebar gutter, content area, right margin) at the same viewport as the preview, and sample the body bg color with a browser eyedropper or `playwright.screenshot()` + a pixel reader. Repeat on the running preview at the same URL. The two color sets must match byte-for-byte. **JSON validity is not enough**: a `docs.json` block like `"background": { "decoration": "windows" }` validates fine but paints a `colors.primary`-derived tint over the page (e.g. `#6c2c8c` purple primary → `#f0e9f3`-ish lavender cast), so the preview looks subtly off-brand against a plain-white source. If the source samples are uniform and the preview's are not, grep `docs.json` for `"decoration"` — when present and the source is flat, drop the `background` block (Mintlify defaults to white) or set `background.color.light/dark` explicitly. Never combine `decoration` with `color`. See `style-docs/reference.md` → *Background `decoration` is tinted by `colors.primary`*.
- [ ] **Multi-tone region match**: if the source has multiple background tones (page chrome, sidebar, navbar, content), the preview's `custom.css` overrides each region individually. `docs.json` `background` only sets one tone. See `style-docs/reference.md` → *Mintlify layout regions and selectors* and *Multi-tone background layouts*.
- [ ] **Brand color** (`colors.primary`, `colors.light`, `colors.dark`) matches source. Also verify ramp internal consistency, independent of source-match: (a) all three tokens sit in the same hue family (within ~5°) — no green primary paired with a teal/mint `light`, etc.; (b) `colors.light` is visibly **lighter / brighter** than `colors.primary` so dark-mode emphasis (links, active sidebar item, anchor underlines) pops against the dark background; (c) `colors.dark` is **darker** than `colors.primary` so buttons / hover states read as pressed in both modes. The recurring trap is generating `colors.light` from a "lighter shade" picker that drifts hue alongside lightness, producing an accent that visibly shifts hue when the theme toggles. Verify by toggling `mint dev` between light and dark and confirming the active sidebar item, links, anchor underlines, and code-block accents all read as the same hue family across both modes. See `style-docs/reference.md` → *Brand color ramp: `primary` / `light` / `dark` semantics*.
- [ ] **Link color, heading color, code-block color** match source.
- [ ] **Fonts** load and render — no silent fallback to system fonts. If a font is `@import`-ed, the requested weights are present in the URL.
- [ ] **Default appearance** (`light` vs `dark`) matches source first-load behavior. Spot-check by opening the source in incognito with no system preference.

### Gate 6 — Visual verification (mandatory for chrome / icon / sidebar / background changes)

JSON validity is **not** a substitute for visual confirmation. The most common silent failures all parse as valid:

- Lucide icon name under default Font Awesome library → anchor renders, icon slot is blank.
- `#sidebar` instead of `#sidebar-content` → CSS rule applied, sidebar still shows the body bg through it.
- `expanded: false` on a top-level group → setting accepted, no chevron appears.
- A new wrapper-group with the wrong page-set → `mint validate` clean, but a page is silently missing from nav.

Process:

- [ ] `mint dev` is running on the affected branch.
- [ ] For every page changed since the last `/preview-qa` pass, capture a screenshot of the local preview and a screenshot of the same URL on the live source at the same viewport. Use the Puppeteer setup bundled with `mint`, or `playwright` if installed. Include the browser **tab strip** in at least one screenshot per page so browser-tab `<title>` parity is verifiable visually.
- [ ] Diff visually: anchor icons present and matching, sidebar section list matches, section toggles match, hover/focus states intact, body structure matches, browser tab title matches Mintlify's `<frontmatter.title> - <name>` template against the source.
- [ ] Repeat in **dark mode**.
- [ ] Repeat at **mobile viewport** (≤ 768px).
- [ ] Save screenshots to a temp directory and reference the path in the QA report so the human reviewer can spot-check.

### Gate 7 — Output report

Produce a brief report listing each gate with status. Append it to the handoff message, PR description, or hand it directly to the `/han-review` invocation.

Format:

```
## Preview QA report — <date>, <branch>

**Pages reviewed:** N mirrored, M custom/landing.
**Source URLs:** <list>
**Screenshots:** <path>

| Gate | Status | Notes |
|------|--------|-------|
| 1. Config + validation         | PASS / FAIL | mint validate clean; mint broken-links clean |
| 1.5. Port-artifact sweep       | PASS / FAIL | 10 patterns checked; zero hits on A–J |
| 2. Source-mirror parity        | PASS / FAIL | <count> pages diffed; <count> mismatches fixed |
| 3. Chrome parity               | PASS / FAIL | per-dropdown anchors verified for <sections> |
| 4. Collapsibility parity       | PASS / FAIL | wrapper-group demotion applied to <tabs> |
| 5. Background + theme          | PASS / FAIL | <N>-tone layout: <hex values> |
| 6. Visual verification         | PASS / FAIL | screenshots in <path>, light + dark + mobile |

Ready for /han-review: YES / NO
```

If any gate is FAIL, list the specific defects and fix them before re-running. Do not hand off to `/han-review` with any FAIL status.

## Failure routing

| Gate | Failure mode | Route to |
|------|--------------|----------|
| 1 | Broken links | `/fix-broken-links`, then re-run from Gate 1 |
| 1 | Orphan MDX or nav gaps | `/style-docs` "Restructuring large flat navigation" |
| 1.5 | Any port-artifact pattern (A–J) returns >0 hits | Route to `/docs-to-mintlify` and patch the transformer rule named in `docs-to-mintlify/references/mdx-conversion.md` → "Port-artifact patterns". Regenerate the affected files; do **not** hand-fix individual pages. After regeneration re-run from Gate 1 |
| 2 | Body structure / repeated patterns missing | Fix in place (minimum-diff); `/style-docs` only if scope is broad |
| 2 | Custom HTML where Mintlify primitive should be | Fix in place per `style-docs/SKILL.md` "Edit existing components in place" |
| 2 | Fabricated `description` (subtitle on preview that source doesn't have) | Delete the `description:` line from the page's frontmatter. Do not move the text into the body. If the same fabrication appears across many pages, it likely came from `/docs-to-mintlify` — patch the conversion rule per `docs-to-mintlify/references/mdx-conversion.md` "Description" before regenerating |
| 2 | Frontmatter `title` / `sidebarTitle` / `icon` doesn't match source | Re-extract from the source rendered page; never invent. If unsure, omit the field |
| 2 | Browser tab `<title>` mismatch (per page) | Adjust `frontmatter.title` per `style-docs/SKILL.md` "Browser tab `<title>` parity"; if H1 / tab diverge on source, pick the short version for `title` and put the long H1 in the MDX body |
| 2 | Browser tab `<title>` mismatch (site-wide suffix) | Adjust `docs.json.name` once; verify the navbar product label still matches |
| 3 | Navbar logo missing subtitle / badge / tagline that the source shows | Reconstruct a composed SVG (wordmark + subtitle as `<text>`) per `style-docs/reference.md` "Logo composition and sizing"; update `logo.light` / `logo.dark`; bump `img.nav-logo` height in `custom.css`; verify in light + dark + mobile |
| 3 | Source's single horizontal bar split across `navigation.tabs` + `navbar.links` + `navigation.global.anchors` | Promote every item the source paints in its top horizontal row into `navigation.tabs` in source-visual order (use `href` on the tab entry for external destinations). Remove the same items from `navbar.links` and `navigation.global.anchors`. Keep only right-side utility links in `navbar.links` and the primary CTA in `navbar.primary`. See `style-docs/SKILL.md` → *Top horizontal bar — one row, one config surface* |
| 3 | Per-section anchors wrong | Edit `docs.json` per `style-docs/reference.md` "Per-dropdown sidebar anchors" |
| 3 | Wrapping-anchor label visible but not on source | Rename the wrapper to a label that exists on the source, drop the link-button anchors so `groups` sits directly under the dropdown, or hide via CSS targeting `a.nav-anchor` with the specific text. **Never** restructure to put `groups` as a sibling of `anchors` inside a `dropdown` — see schema warning in `style-docs/reference.md` |
| 3 | Blank icon slots | Match library to source per `style-docs/reference.md` "Icon library" |
| 3 | Tab toggle present but source has none | Flatten `tabs` to sibling `groups` per `style-docs/reference.md` "Flattening tabs to sibling groups" |
| 3 | Tab toggle missing but source has one | Promote sibling `groups` to `tabs` (model the tabs on the source's top-of-page sections) per `style-docs/SKILL.md` "Restructuring a large, flat navigation" step 1 |
| 3 | Per-page sidebar shows entries (group labels, wrapping-anchor labels, or pages) the source's same-URL sidebar doesn't show | Promote each leaking source section to its own sibling `anchor` (or `tab` if the source has a top-of-page toggle). Drop any wrapper `anchor` whose label isn't on the source so its `groups` sit directly under the dropdown. See `style-docs/reference.md` → "Per-dropdown sidebar anchors". Re-run `/preview-qa` from Gate 1 — this restructure touches `docs.json` and can regress collapsibility (Gate 4) and chrome (Gate 3) |
| 3 | Site root duplicated as sidebar entry (e.g. `Home` + `Overview` stacked at the top of Getting Started) | Remove `"index"` (or your site's root slug) from the offending sidebar group's `pages` array. The homepage stays reachable via `/` and the navbar logo. If the source actually does show a "Home" entry, keep `"index"` and instead drop the duplicate "Welcome" / "Overview" sibling — verify the label matches the source verbatim. See `style-docs/reference.md` → "Site root `index.mdx` and the sidebar" |
| 3 | Single-page wrapper group renders as `Overview > Overview` (or any duplicate-label pair) | Switch the offending tab/dropdown/anchor from `groups` to `pages` and flatten the single-page wrapper to a string slug entry alongside the sibling group objects. Tab-level `pages` arrays accept both shapes in the same array. Verify the page's `sidebarTitle` / `title` matches the source's overview/intro label verbatim. See `style-docs/reference.md` → "Single-page wrapper groups create duplicate sidebar entries" |
| 3 | Icons rendered on every level (top groups, sub-groups, individual pages) | Strip `icon:` from every nested group entry in `docs.json` and from every page's MDX frontmatter, except for top-level major sections. Keep page-level `icon:` only on a flattened single-page peer that sits next to iconed sibling groups at the same level (preserves visual peer parity). Verify in `mint dev` that the sidebar's icon column is dense at the top level and empty inside each section. See `style-docs/reference.md` → "Icon hierarchy: top-level only" |
| 3 | Source sidebar shows a link to an external URL or a different internal page; preview tried to use `{ "anchor", "href" }` inside a group's `pages` and the entry doesn't render | Replace the inline shape with a stub MDX page added to the group as a string slug. For sidebar-click navigation only, add `url: "<destination>"` to the stub's frontmatter. For sidebar click + direct-URL parity (legacy bookmarks, search-indexed URLs), add a `docs.json` `redirects` rule from the stub's slug to the destination and keep the stub minimal. If the source shows the link in a top horizontal bar instead of the sidebar, promote it to `navigation.tabs` with `href` per `style-docs/SKILL.md` → "Top horizontal bar — one row, one config surface". See `style-docs/reference.md` → "External `href` is not allowed inside a group's `pages` array" |
| 3 | Sidebar visible on the homepage, or homepage content touches the viewport edges | Set `mode: "custom"` on `index.mdx` (not `wide`, not CSS hiding) and wrap every section in the shared `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` container per `create-landing-page` → Gotcha 2 → Strategy B |
| 3 | Changelog migrated page-per-entry, dates clustered / mismatching the source, or duplicate `<Update>` labels | Route to `/docs-to-mintlify` → `references/changelogs.md`: consolidate into a single `<Update>` timeline with `rss: true` + redirects, re-scrape the source's embedded `created_at` (never sitemap `lastmod`), disambiguate same-day pairs with time-of-day |
| 3 | Same API operations exposed at two URL spaces (hand-migrated pages + auto-generated playground tab) | Add per-page `openapi: "METHOD /path"` frontmatter to the migrated pages and delete the parallel tab per `docs-to-mintlify/references/openapi.md` → *Hand-migrated endpoint pages + a spec*; re-run `/fix-broken-links` |
| 4 | Sections not collapsible when source is | Apply wrapper-group demotion per `style-docs/reference.md` "Wrapper-group demotion for collapsible sections" |
| 5 | Monotone preview against multi-tone source | Per-region `custom.css` per `style-docs/reference.md` "Multi-tone background layouts" |
| 5 | Source body bg is plain (uniform pixel sample) but preview shows a tinted cast (lavender / teal / pink derived from `colors.primary`) | Drop `background.decoration` from `docs.json`. If the source is plain white and you want to lock it explicitly across modes, replace with `background.color.light/dark`. Never keep `decoration` alongside `color` — `decoration` overrides flat color. See `style-docs/reference.md` → "Background `decoration` is tinted by `colors.primary`" |
| 5 | Brand accents shift hue when toggling between light and dark mode (e.g. green primary becomes teal in dark mode); or dark-mode links / active sidebar item look muddy and low-contrast | Re-derive `colors.light` from `colors.primary` by holding hue + saturation constant and increasing lightness ~15–20% (HSL space). All three brand tokens (`primary`, `light`, `dark`) must sit within ~5° on the hue wheel; `light` must be visibly brighter than `primary`; `dark` must be darker. The recurring origin is generating `colors.light` from a "lighter shade" picker that drifts hue alongside lightness. See `style-docs/reference.md` → "Brand color ramp: `primary` / `light` / `dark` semantics" |
| 6 | Visual mismatch not surfaced by JSON validation | Re-fetch source token / icon name / selector; do not adjust by eye |

After any routed fix, re-run `/preview-qa` from Gate 1. Do not skip gates after routing — earlier gates can regress when later fixes touch `docs.json` or `custom.css`.

## Completion criteria

- Every gate shows PASS.
- Every defect found has been fixed in place; no deferred items.
- The QA report is included in the handoff to `/han-review` (PR description, comment, or chat message).

## What this skill does NOT do

- **Subjective polish.** "Does this feel premium?" "Is the homepage hierarchy convincing?" "Are the labels concrete enough?" — that is `/han-review`.
- **Information architecture redesign.** Use `/style-docs` → *Restructuring a large, flat navigation*.
- **New content migration.** Use `/docs-to-mintlify`.
- **Broken-link diagnosis loops.** Use `/fix-broken-links`.
- **Landing-page authoring.** Use `/create-landing-page`.

`/preview-qa` is a verification skill, not an authoring skill. If a gate fails and the fix is more than an in-place edit, route to the appropriate skill above, then come back here.
