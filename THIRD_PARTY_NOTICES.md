# Licenses and third-party notices

## Site code and educational content

The existing root [LICENSE](LICENSE) is the GNU General Public License, version 3. It continues to cover the site's original application code (HTML scaffolding, CSS, JavaScript, and development scripts). This update does not replace or relicense the repository's historical code.

Educational definitions, teaching notes, and original examples in the current page are distributed under [Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/), consistent with the previous educational-content notice. Third-party material retains its own terms. See [CONTENT_SOURCES.md](CONTENT_SOURCES.md) for the per-entry inventory.

## MDN Web Docs

Definitions are adapted summaries of the linked MDN pages by **Mozilla Contributors**, with notes written for this table. Each entry includes its page link and identifies the adaptation. MDN prose is available under CC BY-SA 2.5 or later unless otherwise indicated; this table distributes its adaptations under CC BY-SA 4.0.

Examples were written for this update rather than copied from MDN. MDN's separate code-example policy (CC0 for examples added on or after August 20, 2010, MIT for older examples) therefore does not license these original examples.

[MDN attribution and copyright policy](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Attrib_copyright_license).

## Prism 1.30.0

Prism supplies syntax highlighting. Its core, markup grammar, and Line Numbers plugin are vendored in `js/vendor/prism.js`; the exact version is pinned in `package-lock.json`. The source is copied without changes apart from concatenation and a version header. The site supplies its own contrast-tested token colors and a vanilla JavaScript copy control after each example.

Prism's bundled license names copyright © 2012 Lea Verou and grants the MIT license. The full upstream notice is preserved in [js/vendor/PRISM-LICENSE.txt](js/vendor/PRISM-LICENSE.txt).

- [Prism website](https://prismjs.com/)
- [Upstream repository](https://github.com/PrismJS/prism)

## Removed dependencies and historical content

Foundation/ZURB, jQuery and its helpers, Modernizr, the Snippet-based syntaxhighlighter, highlight.js, its line-number plugin, and their styles/assets are no longer distributed in the current source tree. The replacement layout, styling, filtering, dialogs, and code controls were newly implemented. Their former credits are removed from the current page.

The old definitions and examples, including material formerly attributed to HTML5 Doctor, have been replaced with the MDN-attributed summaries and original examples listed above. The former HTML5 Doctor license claim was not independently verified and is not repeated as a current license grant. Historical versions in Git retain their original notices; removing current dependencies/content does not change the terms of those versions.

Development-only tools in `node_modules` are not shipped with the static site and retain their package licenses.
