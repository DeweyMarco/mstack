---
name: preview-qa
description: Mechanical parity QA gate that runs every deterministic check on a Mintlify preview before handing it to /han-review. Use after /style-docs, before /han-review, or any time a preview is about to be shown to a customer, designer, or stakeholder. Catches chrome, icon, collapsibility, background, and structural-parity defects so /han-review can focus on subjective polish.
---

# Preview QA

Self-check skill that walks every deterministic parity gate on a Mintlify preview before it is shown to a human reviewer. Every gate has a clear pass/fail signal. This skill is a **hard gate** — do not declare a preview ready for `/han-review` until every gate below passes.

## When to use

- After `/style-docs` and before `/han-review` in the migration workflow.
- Before sharing a preview URL with a customer, designer, or stakeholder.
- After any substantive change to `docs.json`, `custom.css`, or a page that mirrors a source URL.

The Han review is for subjective polish — *does this feel launch-ready?*. Preview QA is for the long tail of mechanical defects that are deterministic to detect: missing chevrons, blank icons, monotone backgrounds, asymmetric CTAs, dropped pages, wrong icon library, mismatched per-section anchors. The preview must not contain any of these when a human reviewer sees it.

## Inputs

- The preview repo, with `mint dev` runnable locally.
- The live source URL, plus one URL per section if the source has section-specific chrome (Framework, Templates, API reference, etc.).
- A list of pages that mirror source URLs — typically every page produced by `/docs-to-mintlify`, plus any custom pages from `/create-landing-page`.

## Position in the workflow

```
/docs-to-mintlify → /fix-broken-links → /create-landing-page → /style-docs → /preview-qa → /han-review
```

`/preview-qa` is the last automated gate before the human review. It does not produce new content; it verifies what is already there. On any failure, route to the appropriate fix skill, then re-run `/preview-qa` from gate 1.

## The QA standard

Every gate below must pass before declaring the preview ready for `/han-review`. Each gate states what to verify, how to verify, and where to fix on failure.

### Gate 1 — Configuration and validation

Run these first; they are cheapest and catch the largest class of defects.

- [ ] `docs.json` parses as valid JSON. `python3 -m json.tool docs.json > /dev/null` exits 0.
- [ ] `mint validate` passes with zero parser errors.
- [ ] `mint broken-links` passes with zero broken refs. On failure → `/fix-broken-links`.
- [ ] No orphan `.mdx` files: every MDX file under managed directories appears in the `docs.json` navigation, and every nav entry resolves to an existing file. On failure → `/style-docs` "Restructuring a large, flat navigation".
- [ ] `mint a11y` warnings either fixed or explicitly accepted in the QA report.
- [ ] **No root `custom.js`** (or any other `.js` file at the repo root) is being relied on for runtime behavior. Mintlify v4 does not execute root-level JS — it inlines the file as Next.js data and never runs it. If a `custom.js` exists, verify whether it is dead code (delete) or whether the behavior it tries to provide should be re-routed to native Mintlify config, a build-time `docs.json` updater, or GTM. See `style-docs/SKILL.md` → *Custom JavaScript rules* and `style-docs/reference.md` → *No arbitrary custom JavaScript in Mintlify*.

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
- [ ] **Navbar logo parity (composed marks).** Side-by-side screenshot the top-left of the source vs. the preview at the same viewport. Verify every typographic element matches: wordmark, *and* any stacked subtitle (e.g. "developers"), inline subtitle, version badge, or tagline the source renders in the same logo container. Pulling only the source's wordmark SVG and shipping it as `logo.light` / `logo.dark` is the most common defect — it produces a logo that looks "almost right" but is missing visible content. Composed marks must be baked into a single SVG (Mintlify has no native `logo + tagline` field) and `img.nav-logo` height bumped in `custom.css` so multi-line marks stay legible at the default 24px. Verify in **both light and dark** mode; verify `logo.href` matches the source link target. See `style-docs/SKILL.md` → *Logo and brand mark parity* and `style-docs/reference.md` → *Logo composition and sizing*.
- [ ] **Per-section sidebar anchors** match source. Fetch a page from each section (e.g. Framework, Templates, API reference) and list every anchor button in the sidebar header. Compare across sections. If the source's anchor lists differ per section, the preview's must too — use per-dropdown `anchors` arrays in `docs.json`, not `navigation.global.anchors`. See `style-docs/reference.md` → *Per-dropdown sidebar anchors*.
- [ ] **Wrapping-anchor labels match source.** When `docs.json` uses the wrapping-anchor pattern (an `anchor` with `groups` instead of `href`), Mintlify renders the wrapper's `anchor` string as a **visible clickable tab in the sidebar** — not as hidden scaffolding. List every wrapping anchor in the preview's `docs.json` and compare each label against what the source actually shows in the same dropdown context. Common defect: a "Documentation" or "Templates" wrapper introduced to satisfy Mintlify's "one type of child per level" nesting rule shows up as a blue tab the source doesn't have. See `style-docs/reference.md` → *Per-dropdown sidebar anchors* (the "Critical: the wrapping anchor's label is visible" subsection). Do **not** attempt to put `groups` as a sibling of `anchors` inside a `dropdown` to remove the wrapper — Mintlify rejects that structure and the entire navbar disappears.
- [ ] **Anchor icons render**, not just validate. Mintlify defaults to **Font Awesome** — Lucide names silently produce blank icon slots that pass JSON validation. Confirm every icon by screenshot. See `style-docs/SKILL.md` → *Pick the icon library before mapping icons* and `style-docs/reference.md` → *Icon library (Font Awesome by default)*.
- [ ] **No template defaults remain**: Blog anchor from `mint init`, Twitter / GitHub socials, "Get started" CTA, default favicon, default site name. These look normal at a glance and are the most common chrome-parity misses.
- [ ] **Top-of-page tab toggle matches source.** Mintlify `tabs` always render as a visible toggle bar above the page (e.g. "User Guide / API docs"); the buttons are intrinsic to the `tabs` shape. The check is parity in both directions:
  - If the source shows a tab-button row above the page (e.g. Stripe's Payments / Connect / Issuing), the preview must use `tabs` so the same toggle appears.
  - If the source shows no tab-button row above the page (e.g. Pathway), the preview's `docs.json` must not use `tabs` — flatten to sibling `groups`.
  
  Both directions are defects. Fetch the source page being mirrored, look at what is rendered above the sidebar/content area, and match. See `style-docs/SKILL.md` → *Tabs vs sibling groups — match the source toggle* and `style-docs/reference.md` → *Flattening `tabs` to sibling `groups`*.

### Gate 4 — Sidebar collapsibility parity

- [ ] If the source sidebar shows chevrons / caret toggles next to section headers and the sections collapse/expand independently, the preview does too. Mintlify top-level groups **cannot** be collapsed; if every section in a tab needs a chevron, apply wrapper-group demotion. See `style-docs/SKILL.md` → *Mintlify collapsible navigation guardrail* and `style-docs/reference.md` → *Wrapper-group demotion for collapsible sections*.
- [ ] Toggle each section open and closed in the running preview to confirm. Static section headers that visually resemble chevrons but are not interactive should not be mirrored as collapsible.
- [ ] After collapsibility restructuring, page-set parity holds: `set(new_pages) == set(old_pages)` (no page lost, no page duplicated).

### Gate 5 — Background and theme parity

- [ ] **Backgrounds**: every region painted by the preview matches the corresponding source region. If the source has multiple background tones (page chrome, sidebar, navbar, content), the preview's `custom.css` overrides each region individually. `docs.json` `background` only sets one tone. See `style-docs/reference.md` → *Mintlify layout regions and selectors* and *Multi-tone background layouts*.
- [ ] **Brand color** (`colors.primary`, `colors.light`, `colors.dark`) matches source.
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
| 2 | Body structure / repeated patterns missing | Fix in place (minimum-diff); `/style-docs` only if scope is broad |
| 2 | Custom HTML where Mintlify primitive should be | Fix in place per `style-docs/SKILL.md` "Edit existing components in place" |
| 2 | Fabricated `description` (subtitle on preview that source doesn't have) | Delete the `description:` line from the page's frontmatter. Do not move the text into the body. If the same fabrication appears across many pages, it likely came from `/docs-to-mintlify` — patch the conversion rule per `docs-to-mintlify/references/mdx-conversion.md` "Description" before regenerating |
| 2 | Frontmatter `title` / `sidebarTitle` / `icon` doesn't match source | Re-extract from the source rendered page; never invent. If unsure, omit the field |
| 2 | Browser tab `<title>` mismatch (per page) | Adjust `frontmatter.title` per `style-docs/SKILL.md` "Browser tab `<title>` parity"; if H1 / tab diverge on source, pick the short version for `title` and put the long H1 in the MDX body |
| 2 | Browser tab `<title>` mismatch (site-wide suffix) | Adjust `docs.json.name` once; verify the navbar product label still matches |
| 3 | Navbar logo missing subtitle / badge / tagline that the source shows | Reconstruct a composed SVG (wordmark + subtitle as `<text>`) per `style-docs/reference.md` "Logo composition and sizing"; update `logo.light` / `logo.dark`; bump `img.nav-logo` height in `custom.css`; verify in light + dark + mobile |
| 3 | Per-section anchors wrong | Edit `docs.json` per `style-docs/reference.md` "Per-dropdown sidebar anchors" |
| 3 | Wrapping-anchor label visible but not on source | Rename the wrapper to a label that exists on the source, drop the link-button anchors so `groups` sits directly under the dropdown, or hide via CSS targeting `a.nav-anchor` with the specific text. **Never** restructure to put `groups` as a sibling of `anchors` inside a `dropdown` — see schema warning in `style-docs/reference.md` |
| 3 | Blank icon slots | Match library to source per `style-docs/reference.md` "Icon library" |
| 3 | Tab toggle present but source has none | Flatten `tabs` to sibling `groups` per `style-docs/reference.md` "Flattening tabs to sibling groups" |
| 3 | Tab toggle missing but source has one | Promote sibling `groups` to `tabs` (model the tabs on the source's top-of-page sections) per `style-docs/SKILL.md` "Restructuring a large, flat navigation" step 1 |
| 4 | Sections not collapsible when source is | Apply wrapper-group demotion per `style-docs/reference.md` "Wrapper-group demotion for collapsible sections" |
| 5 | Monotone preview against multi-tone source | Per-region `custom.css` per `style-docs/reference.md` "Multi-tone background layouts" |
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
