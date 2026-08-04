# Company asset workflow

Use this workflow whenever the user supplies assets or a source company site/repository exists. The goal is to use the company's own visual system intentionally, not merely to place its logo above a generic template.

## 1. Inventory before designing

Inspect the project and source before writing the landing-page layout.

- Read `docs.json` for `logo`, `favicon`, `colors`, `fonts`, social images, and existing asset paths.
- When URLs are not provided, derive the customer domain from the parity manifest, `docs.json` logo/navbar links, repository name, page metadata, or company name. Do not wait for the user to paste the marketing URL.
- Search the repository for SVG, PNG, WebP, AVIF, GIF, MP4, WebM, and font files. Record dimensions and file sizes for raster/video assets.
- On the rendered source page, inspect `<img>`, `<picture>`, `srcset`, video posters/sources, CSS `background-image`, masks, favicons, and Open Graph images. Inspect linked stylesheets and CSS variables when the visible asset URL is indirect.
- Inspect the canonical marketing/product website even when the user supplied only a docs URL. Use the website's visual system when the docs source is sparse, stale, or visually generic.
- Check the source's light and dark modes. Logos, screenshots, diagrams, and decorative textures can each have mode-specific files.
- Check supplied brand folders or product repositories before downloading from the public site; those often contain cleaner vectors and higher-resolution exports.

Map candidates by role: navbar mark, hero visual, product proof, feature/card thumbnails, background texture, customer proof, closing CTA, favicon, and social preview. Add this mapping to the existing parity manifest when one exists; otherwise keep it in temporary working notes rather than shipping a new metadata file.

## 2. Select assets by evidence

Use this priority order for each role:

1. A user-supplied or company-repository asset explicitly intended for that role.
2. The exact asset used by the source docs or company landing page.
3. Another approved company asset that communicates the same product concept and fits the required aspect ratio.
4. A Mintlify-native typographic or CSS treatment when no suitable company asset exists.

Do not replace an available product screenshot with a generic illustration, trace a wordmark from a raster screenshot, or use a marketing photograph as decoration when its license or ownership is unclear. Preserve visible source copy embedded in diagrams unless it is obsolete or illegible.

## 3. Localize and normalize

- Put landing-page assets in a predictable project-owned directory such as `/images/landing/` or the repo's established asset directory. Use descriptive lowercase filenames and retain light/dark suffixes.
- Validate every download before wiring it into `docs.json` or MDX: HTTP success, expected `Content-Type`, matching file signature, non-trivial byte size, and usable dimensions. Open SVGs as text and reject any file that contains HTML; SPA fallback pages are commonly downloaded under plausible image filenames.
- Preserve SVG for logos, diagrams, and illustrations when the source file is trustworthy. Do not rasterize vectors solely for convenience.
- Keep the highest useful raster resolution, but avoid shipping oversized originals when a lossless metadata strip or a visually equivalent WebP/AVIF export materially reduces weight. Never upscale a source.
- Preserve transparency, animation, and video poster frames when they are part of the source experience. Add `muted`, `playsInline`, and a useful poster to autoplay video.
- Use root-relative paths in MDX and `docs.json`. Avoid hotlinking critical visuals; upstream cache rules, URL revisions, or anti-hotlinking can break the landing page later.
- Do not copy third-party stock, customer logos, or partner marks unless the user supplied them, the project already uses them, or the source clearly establishes company authorization for the replica.

## 4. Compose around the assets

- Let the asset's native aspect ratio and focal point drive the container. Use `object-contain` for UI, diagrams, and logos; use `object-cover` only for photography or artwork with an intentional crop.
- Treat words, UI labels, faces, and product controls inside media as protected content. Never use `object-cover`, square aspect classes, or fixed-height crops that clip them. Read raster/video dimensions before choosing the container and verify representative animation frames, not only the first frame.
- Match the source placement before adding polish: full-bleed background, framed product UI, floating illustration, card thumbnail, or subtle texture are different roles.
- Do not stack glow effects, gradients, and patterns over a strong company visual. Give product UI enough contrast and breathing room to remain readable.
- Navigation-card media must communicate the linked task. If the source design uses rich product proof, do not ship large empty patterned panels with a tiny generic icon; use validated customer media, a compact source-backed product UI treatment, or reduce the media area's height.
- Pair separate light/dark assets with `block dark:hidden` and `hidden dark:block`. When one asset works in both modes, verify contrast rather than duplicating it unnecessarily.
- Use meaningful alt text when the image communicates product information. Use `alt=""` when it is decorative or repeats adjacent text.

## 5. Verify the shipped result

- Confirm every local asset path returns successfully in `mint dev`, and run `mint broken-links` plus `mint a11y`.
- Check that no critical landing-page image points at a temporary URL, a source build hash likely to expire, or a localhost path.
- Compare source and preview screenshots at the same desktop/mobile viewport in light and dark mode. Check crop, scale, sharpness, transparency, background compatibility, and whether the asset appears in the same visual role.
- Confirm every raster and video stays below Mintlify's file limit and that the first fold does not load unnecessary offscreen media eagerly.
- Record any deliberate substitution or missing source asset as a parity delta for `/preview-qa` and `/han-review`.
