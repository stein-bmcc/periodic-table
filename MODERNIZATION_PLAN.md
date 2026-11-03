# Periodic table modernization plan

Review date: November 3, 2026. This document proposes changes; the application has not been modified.

## Recommended direction

Keep this a small static teaching site using semantic HTML, modern CSS, and vanilla JavaScript. Use CSS Grid for the page and card collection, Flexbox within cards, native dialogs for overlays, and one syntax highlighter. Keep content readable in the HTML rather than making JavaScript responsible for rendering the whole site. A framework or application bundler is unnecessary for this scope.

Use plain CSS with custom properties as the styling source of truth. The existing Sass mainly supplies colors and nesting; removing its compilation requirement would simplify contributions. Add only lightweight development tools for formatting, linting, serving locally, and regression checks, with documented commands and pinned dependencies.

## Findings in the current repository

| Area | Evidence | Implication |
| --- | --- | --- |
| Layout | `index.html` uses Foundation `.row` / `.columns`; `sass/style.scss` floats card list items at 50%, 25%, and 20% widths. | Replace framework layout and floats together. |
| Cards | `.type`, `.parents`, `.frequency`, and `.importance` float; `.name` uses padding and clearing. | Centering depends on content and padding rather than available space. |
| JavaScript | jQuery 2.0.3, Foundation 5.0.3, Modernizr, and a large inline script. | Native filtering and dialog APIs can replace the active framework interactions. |
| Highlighting | Five old Snippet containers and 24 `code.highlight` blocks; highlight.js 9.15.10 and a separate line-number plugin. | Standardize examples before removing either highlighter. |
| Coverage | 55 cards, 30 existing overlays. | 25 cards have no dedicated overlay/trigger; the existing `h1` overlay already discusses all heading levels. |
| HTML | The `address` overlay is a direct child of the element `<ul>`; the `html` description includes an unescaped `<html>` tag; the `a` definition has a stray closing `span`. | Fix document validity before relying on DOM traversal. |
| Sources | Empty MDN source links exist for `footer`, `main`, and `span`; several older definitions lack individual source links. | Audit all definitions, not just new entries. |
| Styling categories | Cards carry several color classes, such as `basic-content core text` or `page-section core grouping`. | Later CSS rules silently decide the visible category color. Separate visual category from filter memberships. |
| Credits | Root `LICENSE` contains GPLv3; footer labels original/modified content CC BY-SA 4.0 and separately cites MDN and HTML5 Doctor. | Document the scope of each license and the provenance of reused material. |
| Maintenance | No package manifest, automated checks, or documented build; `.brackets.json` configures an old editor Sass workflow. | Establish a small, reproducible contributor workflow. |

The inventory above is based on source inspection. Contrast measurements below are calculations from declared CSS colors, not a completed browser accessibility audit.

## 1. Grid layout and Flexbox cards

- Replace Foundation wrappers with semantic `header`, `main`, filter controls, card list, and `footer` regions. Use Grid for the page regions and responsive card collection.
- Use an adaptive grid such as `repeat(auto-fit, minmax(min(100%, 11rem), 1fr))` with `gap`. Tune the minimum card width against the longest names and metadata. Do not reorder cards visually away from DOM/keyboard order.
- Give each `.element` three sections: a top metadata row, a flexible name region, and a bottom metadata row.
- Use `display: flex; flex-direction: column` on `.element`. Top and bottom rows use Flexbox with left/right alignment. The name region uses `flex: 1`, `align-items: center`, and `justify-content: center`.
- Use equal flexible widths for the two metadata cells, `min-inline-size: 0`, and wrapping. Keep each metadata row tall enough for wrapped text; use matching top/bottom minimum sizes so the name remains visually centered. Avoid fixed heights that clip enlarged text.
- Preserve the requested classes: `.type` upper left, `.parents` upper right, `.name` centered horizontally and vertically, `.frequency` lower left, `.importance` lower right.
- Use one explicit visual category per card, e.g. `data-category="embedded"`; store overlapping filter memberships separately.
- Use CSS custom properties for text, background, category colors, spacing, and focus styles. Remove text shadows from card links.

Completion check: cards align consistently at narrow and wide widths, long metadata wraps, filtering leaves no gaps, and zoom does not clip text. Dialog contents must not inherit card sizing rules.

### Selected category palette

Use the following palette for the five category controls plus All. Core uses a softer pastel green; All uses very light grey with black text; Setup uses dark charcoal grey with white text. Core Text, Core Media, and Page Structure retain their proposed backgrounds based on the original element colors.

| Category/control | Background | Text | Calculated contrast |
| --- | --- | --- | --- |
| All | `#F2F3F4` | `#000000` | 18.90:1 |
| Core | `#D5EDCE` | `#222222` | 12.75:1 |
| Core Text | `#FAF1BA` | `#222222` | 13.91:1 |
| Core Media | `#F7AAAA` | `#222222` | 8.55:1 |
| Page Structure | `#E3CFF6` | `#222222` | 11.00:1 |
| Setup | `#303740` | `#FFFFFF` | 12.03:1 |

All six text/background combinations exceed AA contrast for normal text. Implement these pairs as CSS custom properties. Preserve the foreground pairing for all card text if these colors are applied to cards; do not inherit the old orange link or importance colors. Multiple filter memberships must not make a card change its visual category. Verify hover, focus, and selected states separately, and indicate the active filter with more than color alone.

## 2. Vanilla JavaScript and accessible interactions

- Move the inline script into a small module such as `js/main.js`, loaded with `type="module"`.
- Use `const`/`let`, `querySelectorAll`, `classList` or data attributes, and `addEventListener`. Cache the card collection and use one filter handler with `data-filter` values.
- Replace filter links with `button type="button"`, indicate the active filter with `aria-pressed`, and announce the visible count through a polite status region.
- Toggle `hidden` on the card `<li>` elements. Ensure Grid styles do not override `[hidden]`. Remove slide animations initially; if motion is later added, respect `prefers-reduced-motion`.
- Remove unused `filterMultipleElements`, handlers for commented-out controls, debug logging, and obsolete commented code. The unused multi-filter function currently checks classes on list items even though those classes live on `.element`.
- Replace Foundation Reveal with native `<dialog>` and `showModal()` / `close()`. Provide an accessible name from its heading, sensible initial focus, an explicit labeled close button, Escape dismissal, and verified return of focus to the trigger. Test tab containment and background inertness in browsers.
- Place dialogs outside the filtered list so filtering does not hide an open dialog's ancestor. Native dialogs also remove the need for the old modal backdrop and positioning code.
- Prefer meaningful fragment links to content enhanced into dialogs, so definitions remain reachable without scripting. Plan and test this fallback before hiding dialog content by default; native closed dialogs alone do not provide it.
- Once replacements work, remove Foundation and jQuery imports and their unused vendored files, plus Modernizr, FastClick, placeholder, cookie helpers, and related CSS only after checking references.

Reference: [MDN dialog element and accessibility guidance](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).

## 3. One code-example format and highlighter

Recommend **Prism** for this small static site, using only the grammars examples require: markup, plus CSS/JavaScript if present. Use a pinned stable release and keep its MIT notice. Prism's repository says v2 is under development and contributions are restricted to security fixes during that work; do not adopt the development branch or assume old plugin APIs apply to it.

- Normalize examples to escaped `<pre><code class="language-markup">…</code></pre>` content. Recover the original code from the old text-only blocks rather than preserving generated token spans or duplicate copies.
- Highlight with one implementation; remove Snippet, highlight.js, its line-number plugin, their CSS, and unused theme assets after migration.
- Provide copy functionality with clear success/failure feedback. Prism has a Copy to Clipboard plugin that depends on Toolbar; verify keyboard and screen-reader behavior if using it.
- Preserve a plain-text view using a small vanilla JS control if the old “text” option remains useful for teaching. It can switch highlighting without keeping two independent editable copies of the example.
- Make line numbers optional and exclude them from copied code. Horizontal scrolling belongs inside the code block, with a visible keyboard focus style where scrolling needs focus.
- Audit every syntax token against its actual background. A theme name or popularity is not evidence of AA contrast.

Alternative: Shiki is a good option if we later choose a content build step. Build-time highlighting can ship static highlighted HTML without a browser highlighter, but introduces more tooling than this first update needs.

Sources: [Prism usage](https://prismjs.com/), [development status](https://github.com/PrismJS/prism/blob/v2/README.md), [MIT license](https://github.com/PrismJS/prism/blob/master/LICENSE), [Copy to Clipboard](https://prismjs.com/plugins/copy-to-clipboard/), [Shiki](https://shiki.style/guide/).

## 4. Complete and correct existing overlays

Use the same content structure everywhere: element heading → definition → specific source link and attribution → example HTML → close control. Prefer current MDN definitions for new content. For existing HTML5 Doctor content, retain attribution where the material is retained and verify both provenance and current technical accuracy.

Cards currently missing a dedicated overlay/trigger:

- Setup: `script`.
- Headings: `h2`, `h3`, `h4`, `h5`, `h6`. They can all link to one shared headings dialog, with focus returning to the actual trigger.
- Lists: `dt`, `dd`.
- Grouping: `blockquote`, `pre`, `figure`, `figcaption`.
- Tables: `table`, `tr`, `td`, `th`.
- Media: `video`, `audio`.
- Forms: `form`, `input`, `label`, `button`, `select`, `option`, `textarea`.

Prioritize `video`, `audio`, and forms, then complete the remaining gaps. Every card should open a relevant complete explanation, even where closely related cards share one dialog.

Examples should teach accessible usage: video controls and captions, audio controls and a transcript link, explicit form labels, appropriate input types, intentional button types, meaningful image alternatives, and table headers/captions. Show code as text; do not execute example scripts or submit example forms.

Audit the existing educational content too. Remove IE-specific `X-UA-Compatible` boilerplate from introductory examples; correct the explanation that calls doctype an element; revise the image description's treatment of `alt`; and explain that block/inline labels describe typical display behavior rather than rigid HTML content models. Parent labels such as “body” are teaching shorthand and must not imply exhaustive permitted-parent rules. Explain the subjective frequency/importance scale, including `1*`.

HTML5 Doctor now describes its Element Index as historical and directs readers to the current standard and MDN: [archive guidance](https://html5doctor.com/using-the-archive/).

## 5. Suggested additions and filter memberships

These recommendations include newer HTML features and older elements missing from this repository. They are an editorial teaching proposal, not official HTML categories or an assertion that every entry is newly introduced.

Treat the five requested filters as overlapping memberships. **Core** means introductory essentials; **Core Text** means useful text semantics; **Core Media** means common media and their supporting elements; **Page Structure** covers semantic regions and page-level UI containers; **Setup** covers document configuration and advanced templating infrastructure, not just children of `head`. A specialized filter does not automatically imply Core membership, matching the current distinction for `video` and `audio`.

“All only” below means none of those five filters: retain the more precise visual/category grouping (Forms, Tables, Text, or Embedded). This avoids putting every HTML element into an introductory Core list.

| Element(s) to add | Suggested memberships | Priority and teaching purpose |
| --- | --- | --- |
| `picture` | Core Media | First batch: responsive image formats and art direction; retain the fallback `img`. |
| `source` | Core Media | First batch: supporting sources for `picture`, `video`, and `audio`. |
| `track` | Core Media | First batch: timed text, especially video captions. |
| `details`, `summary` | Page Structure | First batch: native disclosure UI; explain the pair together. |
| `dialog` | Page Structure | First batch: native dialog UI and the mechanism used by this project. |
| `search` | Page Structure | First batch: semantic region for search/filter controls; distinct from an input type. |
| `time` | Core Text | First batch: human-readable dates/times with machine-readable `datetime`. |
| `mark` | Core Text | First batch: contextual relevance/highlighting, distinct from emphasis. |
| `code` | Core, Core Text | First batch: semantic code text; pair with existing `pre` for blocks. |
| `hr` | Core, Core Text | First batch: thematic break rather than a purely decorative line. |
| `abbr`, `q`, `cite`, `small` | Core Text | Next batch: abbreviations, short quotations, titles of works, and side comments. |
| `sub`, `sup` | Core Text | Next batch: typographic conventions such as subscripts and superscripts. |
| `iframe` | Core Media | Next batch: embedded documents, with a useful title and contextual security guidance. |
| `canvas` | All only; Embedded | Next batch: script-drawn graphics and accessible alternatives; more advanced than Core Media. |
| `fieldset`, `legend` | All only; Forms | First batch: accessible groups of related form controls. |
| `datalist`, `output`, `optgroup` | All only; Forms | Next batch: suggestions, calculation output, and grouped options; explain limitations. |
| `progress`, `meter` | All only; Forms | Next batch: distinguish task completion from a scalar measurement. |
| `caption`, `thead`, `tbody`, `tfoot` | All only; Tables | First batch: complete the current table lessons. |
| `colgroup`, `col` | All only; Tables | Later: column grouping/styling, after table semantics. |
| `noscript` | Setup | Next batch: fallback content when scripting is unavailable; explain head/body restrictions. |
| `template` | Setup | Next batch: inert reusable markup and an introduction to template use. |
| `slot` | Setup | Later: Web Component composition; requires a shadow DOM explanation. |
| `hgroup` | Page Structure | Later: current heading-plus-related-paragraph semantics. |
| `data`, `wbr`, `kbd`, `samp`, `var` | All only; Text | Later: specialized semantics and word-break opportunities. |
| `ins`, `del`, `s`, `u`, `bdi`, `bdo`, `ruby`, `rt`, `rp` | All only; Text | Later: editorial changes, annotations, directionality, and ruby text. |
| `base` | Setup | Later: document-wide base URL/target behavior, including its surprising effects. |
| `embed`, `object`, `map`, `area` | All only; Embedded | Optional reference expansion: embedded resources and image maps, with accessibility context. |

Do not add deprecated elements to the normal teaching table. Review experimental or limited-support additions, such as `selectedcontent`, separately against current MDN compatibility and the intended browser baseline. SVG and MathML may deserve a future cross-reference, but they should not be labeled HTML elements.

Use the [current MDN element index](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements) for the expansion audit. Specific references: [picture](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture), [search](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/search), [template](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/template), [selectedcontent](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/selectedcontent). The memberships above are recommendations, not classifications supplied by MDN.

Also review existing memberships: `main` is currently excluded from Core, while several generic elements are included; form basics currently appear only under All. I recommend considering `main`, `form`, `label`, `input`, and `button` for Core, with `figure` and `figcaption` retained in Core Media. Decide this as an explicit curriculum change rather than a side effect of CSS refactoring.

## 6. Credits, sources, and licensing

- Create a provenance inventory for each reused definition/example: page title, author/contributor attribution, exact URL, license, and whether adapted. Fix empty source links and use current HTTPS URLs.
- MDN's policy distinguishes prose (CC BY-SA 2.5 or later, unless indicated otherwise) from code samples (CC0 for samples added on/after August 20, 2010; MIT for older samples). Attribute reused prose to Mozilla Contributors, link the specific page, and identify adaptations. Do not apply one blanket label to every kind of MDN material.
- The footer currently claims HTML5 Doctor content is CC BY-NC 2.0. That claim was not verified from the current Element Index/About pages during this review. Verify the applicable original terms and attribution; do not relabel retained third-party text as original CC BY-SA material. Prefer MDN for new definitions and replace old sourced material only with a clearly recorded provenance change.
- Clarify the relationship between the root GPLv3 code license and the footer's CC BY-SA 4.0 educational-content statement. Document code/content scopes and third-party exceptions in README and a credits/notices file. Preserve existing rights and notices; any deliberate relicense needs a separate owner decision.
- Remove the visible Foundation credit once no Foundation-derived implementation remains. If any copied or modified framework code remains, retain applicable notices. Removing a script import alone is insufficient if its files or derived styles are still distributed.
- Remove obsolete library credits only with the corresponding code, styles, and assets. Add Prism attribution and its license notice if selected. Keep a concise visible credits section plus a complete third-party notices file.

Source: [MDN attribution and copyright policy](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Attrib_copyright_license). Final notice text should follow the verified provenance inventory.

## 7. Contrast and accessibility verification

Target WCAG 2.2 AA: at least **4.5:1 for normal text**, **3:1 for large text** (24 CSS px regular or approximately 18.67 CSS px bold), and **3:1 for required non-text control/state indicators** against adjacent colors. Aim for 4.5:1 for all text here to simplify maintenance. Check text within every syntax token, not only the default code color.

Representative current CSS failures:

| Combination | Declared colors | Calculated ratio |
| --- | --- | --- |
| Body/footer links on white | `#cc8400` / `#ffffff` | 3.06:1 |
| Setup filter text | `#93969b` / `#e3e4e5` | 2.33:1 |
| Core Text filter text | `#c2a80d` / `#faf1ba` | 2.06:1 |
| Importance on Forms cards | `#e9965c` / `#64a643` | 1.27:1 |
| Atom One Light comments | `#a0a1a7` / `#fafafa` | 2.47:1 |

The orange importance text fails 4.5:1 against every declared category background (approximately 1.19–2.04:1). A promising minimal change is a dark foreground such as `#222222`: it calculates at least 5.36:1 against all nine current category backgrounds. Preserve category backgrounds where possible, darken text/links, and use underline/weight/borders to communicate links and state. Recalculate any revised palette rather than assuming these baseline results still apply.

Implementation verification must cover actual computed colors in default, visited, hover, focus, selected, and any disabled states; dialogs; source/credit links; code tokens; copy controls; and line numbers. Include browser automation with axe and a contrast report, plus manual keyboard/screen-reader checks, 200% text enlargement, and 400% zoom/reflow at a 320 CSS px equivalent viewport. Code may scroll horizontally within its own region. Automated results alone do not establish accessibility conformance.

References: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [text contrast explanation](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

## Proposed implementation sequence

1. **Baseline and content inventory:** record filter membership/counts, overlay targets, source/license provenance, and screenshots at representative sizes. Fix invalid markup; define the browser baseline and code/content license scopes.
2. **Layout and palette:** introduce Grid, Flexbox cards, explicit visual categories, and contrast-tested CSS tokens; replace Foundation typography/buttons/panels/reset rules used by the page.
3. **Interactions:** replace filtering and Reveal with vanilla JS and native dialogs; verify keyboard behavior and the no-script content fallback; remove Foundation/jQuery and unused helpers.
4. **Examples:** normalize old snippets, introduce Prism with an audited theme and copy/plain-text behavior, and remove both old highlighting systems and unused themes.
5. **Content completion and additions:** fill existing overlay gaps, correct old lessons, then add the first-batch elements above with approved memberships and per-entry attribution. Complete later batches separately.
6. **Credits and delivery checks:** finish notices/README, remove obsolete files/editor configuration, add lightweight linting/HTML validation and meaningful browser checks for filtering, dialogs, example copying, coverage, and accessibility.

Definition of done: all retained and added cards have reachable definitions, valid source links, and useful examples; requested card positioning works responsively; filters and dialogs work by keyboard; applicable text/background pairs pass AA; third-party code/content notices match what is distributed; and the site remains deployable as static files.

Working assumptions: current evergreen Chrome, Firefox, Safari, and Edge; maintain the teaching-focused curated table rather than implement the entire HTML standard immediately; preserve existing element order and filter behavior until an explicit curriculum change; use no production UI framework. These can be revised before implementation.
