# Next.js Gotchas for Agent-Ready Scoring

> **This file is Next.js App Router-specific.** The fundamentals (serialized hydration data, dynamic imports, DOM ordering) generalize — most modern SSR frameworks have analogous patterns — but the code examples here are written for Next.js. If your stack is Astro, Nuxt, Remix, SvelteKit, plain HTML, etc., translate the principles to your equivalents.

The reason Next.js apps need extra attention is described in the parent `SKILL.md` under "the two scorers" — Mintlify keeps `<script>` content during HTML→markdown conversion, and Next.js streams server components by emitting inline `<script>` blocks containing the entire React tree as JSON. That data ends up in your "page size" and "content-start position" measurements.

## Why Next.js apps fail Mintlify's `page-size-html`

When Next.js streams server components, it emits inline `<script>` blocks like:

```html
<script>
self.__next_f.push([1, "5:[\"$\",\"section\",null,{...entire react tree as JSON...}]"])
</script>
```

This is the **RSC payload** — the entire serialized component tree, including:
- Every prop you pass to a `"use client"` component (serialized as JSON)
- HTML attribute sets for SSR'd components
- Verbose third-party widget configs (Sonner Toaster's `toastOptions.classNames` is a classic offender)
- JSON-LD blocks (also `<script>` tags, technically)

Mintlify's scorer keeps these scripts and converts their text content. AFDocs CLI strips them. So Mintlify says "page is 124K markdown" while local AFDocs CLI says "1K markdown". Both run Turndown — different config.

## Diagnosis

To find what's bloating the page, fetch the HTML and look at the biggest scripts:

```js
const html = await (await fetch(url)).text();
const matches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
matches.sort((a, b) => b[1].length - a[1].length);
for (const m of matches.slice(0, 5)) {
  console.log(m[1].length, "chars |", m[1].slice(0, 100));
}
```

Look for:
- `self.__next_f.push([1, "...long string with object trees..."])` — RSC payload, likely contains props
- `application/ld+json` — JSON-LD; check what schema types
- Inline scripts like theme initialization (`((a,b,c,d,...)=>{...})("class","theme",...)`) — small but contribute to content-start position

## Fix patterns

### 1. Don't pass big arrays as props to client components

A client component (`"use client"`) imports its own modules — they go into the JS bundle, not the HTML. But **props** flow from server components → serialized as JSON in RSC payload → in HTML.

**Before** (bad — assume some `getItems()` returns hundreds of records, of any kind: components, articles, products, etc.):
```tsx
// app/page.tsx (server)
import { getItems } from "@/data";
import { ItemList } from "@/components/list";

const Home = () => {
  const items = getItems();   // hundreds of records
  return <ItemList items={items} />;  // → tens of K of JSON in HTML
};
```

**After**:
```tsx
// app/page.tsx (server)
import { ItemList } from "@/components/list";
const Home = () => <ItemList />;
```

```tsx
// components/list.tsx (client)
"use client";
import { ITEM_LIST } from "@/data";

const ALL_ITEMS = ITEM_LIST.map(({ name, keywords }) => ({ name, keywords }));

export const ItemList = () => {
  // use ALL_ITEMS directly — it lives in the JS bundle
};
```

This pattern applies to **anything with size**: arrays of records, lookup maps, configuration objects.

### 2. Verbose third-party widgets — make them ssr:false

Some popular libraries (Sonner Toaster being a classic) take big config objects with verbose className/style strings. Those props get serialized into RSC payload on every page that includes the layout.

```tsx
// components/toaster.tsx
"use client";

import dynamic from "next/dynamic";

const Sonner = dynamic(() => import("sonner").then((m) => m.Toaster), {
  ssr: false,
});

export const Toaster = () => (
  <Sonner
    position="top-center"
    toastOptions={{
      classNames: {
        toast: "your-very-long-tailwind-string",
        title: "...",
        // ...
      },
    }}
  />
);
```

```tsx
// app/layout.tsx
import { Toaster } from "@/components/toaster";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
```

`ssr: false` means the dynamic import only resolves on the client. The component's props are NOT serialized into RSC payload.

The same approach works for any heavy widget that doesn't need SSR — analytics consoles, chat bubbles, modals, tooltips, etc.

### 3. JSON-LD scripts to end of body, not head

Scripts in `<head>` get converted to text by Turndown and appear at the very top of the markdown — pushing your H1 down. Move them to the end of `<body>`. SEO crawlers find JSON-LD anywhere in the document.

```tsx
// Bad (default pattern):
<head>
  <JsonLdScripts />
</head>
<body>
  <main>{children}</main>
</body>

// Good:
<body>
  <main>{children}</main>
  <Header />
  <Footer />
  <JsonLdScripts />   {/* moved to end */}
</body>
```

For per-page JSON-LD (Breadcrumb, Product, Article, etc.), put them AFTER the main `<section>`:

```tsx
return (
  <>
    <section>{/* H1, content */}</section>
    <BreadcrumbJsonLd ... />
    <ArticleJsonLd ... />
  </>
);
```

### 4. DOM-reorder Header after main, keep visual order via CSS

`content-start-position` measures where the first H1/H2 sits in the converted markdown. If `<Header />` comes before `<main>` in DOM, the header's nav links (and any text in it) get counted before content.

Reorder DOM, decouple visual order via CSS `order` on flex children:

```tsx
// app/layout.tsx
<div className="root">  {/* flex column */}
  <main className="flex-1">{children}</main>  {/* DOM order 1 */}
  <Header />                                   {/* DOM order 2 */}
  <Footer />                                   {/* DOM order 3 */}
</div>
```

```css
/* globals.css */
.root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.root > header { order: 1; }   /* visually top */
.root > main   { order: 2; }
.root > footer { order: 3; }
```

DOM order: main → header → footer (so converter sees content first).
Visual order: header → main → footer (CSS `order` rearranges flex children visually).

This trick is independent of Next.js — same CSS works in any framework.

### 5. Virtualize long lists for SSR

If your page renders hundreds of items by default (gallery, catalog, archive, etc.), the SSR'd HTML is huge. Render only the first 18-30 items server-side; lazy-load the rest after hydration with `IntersectionObserver`:

```tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";

const INITIAL_VISIBLE = 18;
const CHUNK_SIZE = 50;

export const ItemList = () => {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const items = ALL_ITEMS;  // module-scope, not props
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((n) => Math.min(n + CHUNK_SIZE, items.length));
        }
      },
      { rootMargin: "400px" }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, items.length]);

  return (
    <div className="grid">
      {visibleItems.map((item) => <Card key={item.id} {...item} />)}
      {hasMore && <div ref={sentinelRef} aria-hidden />}
    </div>
  );
};
```

When the user starts searching/filtering, switch back to rendering the full filtered set — search results are bounded by query and not problematic for size.

### 6. Don't put placeholders that look like URLs in code blocks

Link checkers regex out URLs from your `llms.txt` and visit them. A code block like:

````
```bash
npx install "https://example.com/r/{name}.json"
```
````

…parses the literal string `https://example.com/r/{name}.json` as a URL and fetches it → 404 → `llms-txt-links-resolve` fails.

Use angle brackets instead: `<name>`. They don't trigger the parser:

````
```bash
npx install "https://example.com/r/<name>.json"
```
````

(This isn't actually Next.js-specific, but tends to come up alongside other fixes.)

### 7. Trim title length

Page `<title>` is converted to text and appears before everything. Long SEO-style titles ("Detail Page Title - Subtitle - Brand Name | Site") burn 50+ chars before content. Shorter is better for content-start position. Aim for `${item} | ${site}` (~30 chars).

In Next.js, this is in `generateMetadata`:

```ts
export const generateMetadata = async ({ params }) => {
  return {
    title: `${itemName} | ${SITE.NAME}`,  // short
    // ...
  };
};
```

### 8. Header text under 40 chars per line

The content-start algorithm skips lines under 40 chars OR with link density >50% as "nav". If your header has a button like `Star on GitHub (7,536 stars) 7,536` (~70 chars, mostly link), it counts as content — pushing real content position later. Shorten it or break into shorter lines.

## Verifying locally before push

After applying fixes, ALWAYS verify with the actual conversion before pushing:

```js
import TurndownService from "turndown";

const url = "http://localhost:3000/";  // or production
const html = await (await fetch(url)).text();
const td = new TurndownService();

// Mintlify-style (the strict one)
const mintlifyMd = td.turndown(html.replace(/<style[\s\S]*?<\/style>/g, ""));
console.log(`HTML: ${html.length}, Mintlify md: ${mintlifyMd.length}`);
console.log(`Status: ${mintlifyMd.length > 100000 ? "FAIL" : mintlifyMd.length > 50000 ? "WARN" : "PASS"}`);

// Find content-start position
const h1Idx = Math.max(mintlifyMd.indexOf("===\n"), mintlifyMd.indexOf("# "));
console.log(`H1 at ${h1Idx} chars (${(h1Idx / mintlifyMd.length * 100).toFixed(1)}%)`);
```

Sweep the sitemap to find the worst page:

```js
const sitemapXml = await (await fetch(`${baseUrl}/sitemap.xml`)).text();
const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const worst = [];
for (const u of urls) {
  const html = await (await fetch(u)).text();
  const md = td.turndown(html.replace(/<style[\s\S]*?<\/style>/g, ""));
  if (md.length > 50000) worst.push({ u, md: md.length });
}
console.log(worst.sort((a,b) => b.md - a.md).slice(0, 10));
```

This is faster than waiting for a Mintlify rerun (several-hour cache TTL).
