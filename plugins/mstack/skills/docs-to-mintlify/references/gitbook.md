# GitBook Normalization

Use this reference for any GitBook-hosted site or any `.md` output containing `{% ... %}`, `<mark style="color:...">`, `<figure>`, `<table data-view="cards">`, or `<div data-gb-custom-block>`.

Apply these transforms before lifting content into Mintlify components:

1. Strip the GitBook agent-instructions footer: match `\n---\n# Agent Instructions[\s\S]*$` and delete to end of file.
2. Convert hint blocks `{% hint style="info|success|warning|danger" %}...{% endhint %}` to Mintlify callouts. Recommended mapping: `info -> <Info>`, `success -> <Tip>`, `warning -> <Warning>`, `danger -> <Warning>`.
3. Convert tab blocks `{% tabs %}{% tab title="X" %}...{% endtab %}{% endtabs %}` to `<Tabs><Tab title="X">...</Tab></Tabs>`. Escape double quotes in titles to single quotes.
4. Convert stepper blocks `{% stepper %}{% step %}...{% endstep %}{% endstepper %}` to `<Steps><Step title="...">...</Step></Steps>`. If a step lacks a title, derive one from the first heading or bolded line; otherwise use `Step N`.
5. Convert embed blocks `{% embed url="X" %}...{% endembed %}` to `[X](X)`.
6. Drop self-closing file blocks `{% file src="..." %}` or convert to a download link if `src` is a real URL.
7. For all `{% ... %}` regexes, tolerate URL-encoded `%` characters. Do not use `\{%\s*[^%]*%\}`; use non-greedy `\{%[\s\S]*?%\}`.
8. Strip leftover `{% ... %}` tags with the same non-greedy regex. Leftover GitBook fences crash MDX.
9. Handle GitBook custom-block HTML variants:
   - `<div data-gb-custom-block data-tag="hint" data-style="X" class="..."><p>...</p></div>` -> equivalent callout.
   - `<div data-gb-custom-block data-tag="tabs">...</div>` -> `{% tabs %}...{% endtabs %}`.
   - `<div data-gb-custom-block data-tag="tab" data-title='X'>...</div>` -> `{% tab title="X" %}...{% endtab %}`.
   - Then strip remaining `<div data-gb-custom-block ...>` openers and orphan `</div>` closers.
10. Convert `<mark style="color:blue;">...</mark>` to inner text only.
11. Convert `<figure><img src="..." alt="..."></figure>` to markdown image `![alt](src)`. Drop empty `<figcaption></figcaption>`.
12. For GitBook card tables, strip `data-view`, `data-hidden`, `data-card-target`, `data-type`, `data-size`, and `data-align` attributes. Converting to `<CardGroup>` is optional.
13. Self-close void HTML tags: `<br/>`, `<hr/>`, `<img ... />`.
14. Unescape GitBook backslash escapes before further processing: `\[`, `\]`, `\(`, `\)`, `\{`, `\}`, `` \` ``, `\_`, `\*`.

Common failures from skipped GitBook cleanup:

- `Unexpected closing tag </div>`
- `Unexpected closing slash "/" in tag`
- `Unexpected closing tag </div>, expected corresponding closing tag for <Tab>`
- Leftover `{% ... %}` fences that crash the MDX parser
