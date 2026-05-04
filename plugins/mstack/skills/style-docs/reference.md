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
