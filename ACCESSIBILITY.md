# Accessibility verification

Verified November 3, 2026 on the `modernization` implementation. This records checks performed, not a claim that automated testing establishes full WCAG conformance.

## Browser and interaction checks

The full 24-test suite passes across installed Google Chrome and Playwright Firefox/WebKit. Checks include:

- All 73 cards have source links, definitions, and HTML examples, and all 73 open and dismiss correctly in each browser.
- All eight filters display the expected memberships, expose their pressed state, update a polite result count, and leave card colors stable.
- Dialogs start focus on the close button, keep Tab/Shift+Tab within the content, close with Escape or the close button, and return focus to their opener. The native modal makes background content inert.
- Copy preserves the exact source text; clipboard failure provides a manual-copy instruction. Line numbers are hidden from assistive technology and excluded from both copied source and manually selected text. The copy button follows the example; there is no Plain Text toggle.
- Fragment links work with scripting disabled; definitions also remain available when native dialogs are unsupported. Blocking Prism still leaves readable source code.
- The page and dialog stay within a 320 CSS px viewport, the layout equivalent of a 1280px window at 400% zoom. Doubling the root text size also avoids page overflow. Code examples scroll within their own region.
- Desktop and 390px mobile screenshots were visually inspected, including a media example dialog. Card names are centered and metadata stays at the requested corners.

## Automated accessibility and contrast checks

axe-core checks for WCAG A/AA rules through WCAG 2.2 produce zero violations on the page and representative video dialog in all three browsers. A separate computed-style check examines visible text on the page, selected/hovered/focused filters, and every opened definition and highlighted example. It requires at least 4.5:1 for every measured text pair, including large text.

`npm test` writes per-browser `computed-contrast.json` files beneath `test-results/` and attaches them to Playwright results. Generated reports are ignored by Git.

The saved reports agree across all three engines: **18 distinct rendered text/background pairs**, with a lowest ratio of **6.56:1**. The final unsupported-dialog fallback and report-writing checks were also rerun successfully after the full suite.

| Use                             | Foreground | Background | Contrast |
| ------------------------------- | ---------- | ---------- | -------- |
| Default text                    | `#222222`  | `#FFFFFF`  | 15.91:1  |
| Source, status, and footer text | `#52565C`  | `#FFFFFF`  | 7.38:1   |
| All control / neutral cards     | `#000000`  | `#F2F3F4`  | 18.90:1  |
| Code-control buttons            | `#222222`  | `#F2F3F4`  | 14.32:1  |
| Core                            | `#222222`  | `#D5EDCE`  | 12.75:1  |
| Core Text                       | `#222222`  | `#FAF1BA`  | 13.91:1  |
| Core Media                      | `#222222`  | `#F7AAAA`  | 8.55:1   |
| Page Structure                  | `#222222`  | `#E3CFF6`  | 11.00:1  |
| Setup                           | `#FFFFFF`  | `#303740`  | 12.03:1  |
| Interactive                     | `#222222`  | `#CCE5F5`  | 12.19:1  |
| Form                            | `#222222`  | `#B3D5A8`  | 9.85:1   |
| Default example text            | `#222222`  | `#F5F6F8`  | 14.71:1  |
| Line numbers                    | `#52565C`  | `#F5F6F8`  | 6.83:1   |
| Comments / doctype              | `#515963`  | `#F5F6F8`  | 6.56:1   |
| Tags                            | `#852647`  | `#F5F6F8`  | 8.21:1   |
| Attribute names                 | `#164F86`  | `#F5F6F8`  | 7.78:1   |
| Attribute values / entities     | `#246239`  | `#F5F6F8`  | 6.74:1   |
| Punctuation                     | `#484B50`  | `#F5F6F8`  | 8.10:1   |

These opaque color pairs use WCAG relative luminance calculations. Links inherit the readable foreground in default, visited, hover, and focus states. Hover adds decoration rather than changing the colors. Selection adds an underline and checkmark rather than relying on color. The blue focus outline (`#004B80`) has at least 4.86:1 against its light surfaces; dark Setup surfaces use an inset white outline at 12.03:1. Required button/card boundaries use their high-contrast foreground. The code region's pale border is decorative; its keyboard-focus outline supplies the focus indicator.

## Human release review still needed

Perform an actual screen-reader session (for example VoiceOver/Safari or NVDA/Firefox), real browser 200%/400% zoom, touch-device use, and forced-colors/high-contrast checks on the intended platforms before claiming full conformance. Keyboard navigation was exercised through browser automation; a human assistive-technology session was not performed. The browser tests check the site's examples as displayed text, not the accessibility of hypothetical pages built from every snippet.

[WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · [Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
