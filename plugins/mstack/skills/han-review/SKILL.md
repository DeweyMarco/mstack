---
name: han-review
description: Enforce CEO-level preview quality for Mintlify docs with pixel-perfect UI and UX standards. Use when reviewing customer previews, redesigning docs homepages, responding to Han feedback, or when the user asks for a polished, production-ready Mintlify experience.
---

# Han Review

High-bar QA and design workflow for Mintlify previews that must feel production-ready and close to the customer's existing experience.

## Core Principle

Optimize for trust and familiarity:

1. Match the customer's current information architecture and UX patterns where possible.
2. Prefer Mintlify-native components over custom CSS.
3. Treat every placeholder, rough edge, and mismatch as a bug to fix.

## Prerequisite

Before invoking `/han-review`, run `/preview-qa` and confirm every gate reports PASS. `/preview-qa` is the mechanical parity gate; it catches the deterministic defects (blank icons under the wrong library, missing chevrons, monotone-vs-multi-tone backgrounds, asymmetric CTAs, dropped pages) that this skill should not be spending review cycles on. If `/preview-qa` reports FAIL on any gate, fix the defects and re-run `/preview-qa` from gate 1 before continuing here.

`/han-review` is for subjective polish; `/preview-qa` is for mechanical parity. Do not skip the prerequisite.

## When To Apply This Skill

Apply automatically when the request includes terms like:

- Han review
- preview quality
- pixel perfect
- polish this page
- make it match customer site
- remove placeholder text

## Non-Negotiable Standards

### 1) Pixel-Perfect UI

- No placeholder copy in navigation, search, cards, buttons, or CTAs.
- Typography, spacing, alignment, and icon sizing must be visually consistent.
- Homepage sections should mirror the customer's hierarchy and scannability.
- **Customer recognition test:** inspect the canonical marketing/product website, not only the old docs. With the logo hidden, the homepage's typography, colors, backgrounds, button/card language, imagery, and density must still be recognizable as that customer. A polished generic template fails this test.
- **Real media and safe crops:** use validated customer assets when available. Reject image URLs that return HTML or the wrong MIME type, preserve native aspect ratios for UI and media containing words, and fail any crop that clips labels, controls, faces, or focal content.
- **No empty showcase cards:** large card media areas must contain source-backed product proof or a task-specific product UI treatment. A tiny generic icon floating in a mostly empty patterned panel is unfinished when richer customer material exists.
- Light and dark modes both look intentional (no broken contrast states).
- **Chrome parity (parity migrations only):** verify global anchors, navbar links, footer socials/links, and primary CTA match the source — count and label each one against a fresh fetch of the live site. Template defaults (Blog anchor, Twitter/GitHub socials, "Get started" CTA from `mint init`) are the most common parity misses because they look normal at a glance.
- **Per-section chrome parity:** chrome parity must be checked **per dropdown / per tab**, not only globally. Many source sites show different sidebar anchor buttons in each section (e.g. Framework pages show one anchor set, Templates pages show another). Fetch a page from each section and compare anchor lists individually. If they differ on the source, they must differ on the preview — use per-dropdown `anchors` arrays in `docs.json`, not `navigation.global.anchors`.
- **Sidebar collapsibility parity:** if the source sidebar shows chevrons / caret toggles next to section headers and the sections collapse/expand independently, the preview must too. Mintlify top-level groups cannot be collapsed; if every section in a tab needs a chevron, apply wrapper-group demotion (wrap all top-level groups inside one outer group, set `expanded: false` on each demoted section). Check this proactively during QA — the user should not have to ask. A preview where every section is permanently expanded against a source whose sections collapse is a parity defect, not a stylistic choice.
- **Icons render, not just validate:** every icon referenced from `docs.json` (anchors, cards, frontmatter) must visibly render in the preview. Mintlify defaults to Font Awesome; Lucide names silently produce blank icon slots that pass JSON validation. Confirm by screenshot, not by parsing.
- **Structural parity (parity migrations only):** for each page that mirrors a source URL, fetch the source and verify body-level structure against the preview — column count of card grids, number of cards / steps / tabs per section, presence and label of every CTA per card, ordering of sections. Repeated visual patterns (matching CTAs in every card, identical badges per row) must be applied to every sibling on the preview, not only the ones the user named in the most recent prompt. Partial application of a repeated pattern is the most common preview-quality regression.

### 2) Pixel-Perfect UX

- Primary user paths are obvious (quick start, reference, guides).
- Labels are customer-facing and concrete, never generic filler.
- Interactions feel complete: hover, focus, active, and mobile behavior are coherent.

### 3) Mintlify-First Implementation

Default to Mintlify components before custom styling:

- Navigation + page structure from `docs.json`
- `CardGroup` / `Card` for section navigation
- `Steps` / `Step` for onboarding flows
- `Note`, `Tip`, `Warning`, `Accordion`, and tabs where appropriate
- Built-in page conventions before hand-rolled wrappers

Only add custom CSS when required to match customer branding or layout. Keep it minimal and scoped.

## Review Workflow

1. **Baseline alignment**
   - Fetch the live source URL for any page being reviewed for parity. Do not work from the user's prose alone.
   - Find and inspect the customer's canonical marketing/product website even when only a docs URL was supplied.
   - Compare the homepage against both the customer's current docs and the real website; use the website as visual truth when the docs are sparse or stale.
   - Preserve familiar IA labels and nav grouping (Home, Guides, APIs, Reference, Learn, etc.).
   - Diff body-level structure: column counts, card counts, presence and label of every CTA, section order. Treat any mismatch as a defect to fix, not a follow-up to defer.

2. **Component-first pass**
   - Replace custom constructs with Mintlify components where possible.
   - Keep custom classes only where components cannot achieve required fidelity.
   - When adding or changing a single element, edit the existing component tree in place. Do not replace `<CardGroup>` / `<Card>` / `<Columns>` / `<Steps>` with custom HTML to host one new child. The minimum-diff edit is almost always the correct edit.

3. **Polish pass**
   - Remove placeholders and ambiguous text.
   - Tighten headings, CTAs, spacing rhythm, and card descriptions.
   - Normalize fonts to match customer style as closely as possible using supported theme options first.

4. **Responsive + theme pass**
   - Validate mobile and desktop layouts.
   - Validate dark and light themes.
   - Ensure hover/focus states remain readable and intentional.

5. **Visual verification gate (chrome / icon / sidebar changes)**
   - For any change touching docs chrome (sidebar anchors, navbar links, icons, dropdowns, footer, top CTAs): run `mint dev` locally, screenshot the affected page in the preview, screenshot the same URL on the live source at the same viewport and theme, and diff visually.
   - JSON validation is not a substitute. The most common silent failure is an icon name from the wrong library (Lucide names under the default Font Awesome library) — the anchor renders, the icon slot is blank, and `docs.json` parses fine.
   - Repeat in dark mode if the site supports it.
   - Block completion until every anchor button shows the correct icon and every section's anchor list matches its source counterpart.

6. **Final acceptance pass**
   - Confirm the page feels launch-ready, not demo-ready.
   - Hide the logo and repeat the customer recognition test. If the design could be rebranded for another customer by swapping only logo and accent color, send it back to `/create-landing-page`.
   - If any section feels "template-ish", revise before finishing.

## Decision Rules

- If a Mintlify component can do the job at 90%+ fidelity, use it.
- If custom CSS is required, keep changes surgical and avoid global overrides.
- If unsure between visual flair and familiarity, choose familiarity.
- If one detail looks unfinished, assume customers will notice it.

## Response Style For Han-Driven Feedback

When reporting work:

- Call out what was changed to improve trust/familiarity.
- Explicitly mention where placeholders were removed.
- Explicitly mention which custom styles were avoided or reduced.
- Note any remaining deltas from the customer's current site and why they remain.
