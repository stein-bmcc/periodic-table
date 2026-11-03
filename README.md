# Periodic Table of HTML Elements

A static teaching reference with 73 cards, sourced definitions, and HTML examples. It uses CSS Grid, Flexbox, vanilla JavaScript, native dialogs, and a small local Prism build. There is no application framework, production build, or external runtime request.

## Run locally

Use Node.js 22 or later:

```sh
npm ci
npm run dev
```

Open [the local preview](http://127.0.0.1:4173). Use an HTTP server rather than opening `index.html` directly, so JavaScript modules load normally. Any static server can serve the site; Node.js is only needed for the supplied development tools.

## Editing

- **Content:** edit cards in `#elements` and their corresponding sections in `#definitions` in `index.html`. Every card must link to a real `definition-*` ID, and every definition needs a heading, description, specific source link, and escaped HTML example. Update `CONTENT_SOURCES.md` with its provenance.
- **Filters:** `data-filters` on each list item contains space-separated memberships: `setup`, `page-section`, `core`, `text`, `media`, `interactive`, and `form`. A blank value means the entry appears only under All. Memberships can overlap; they do not change when filtering. Buttons and card color groups follow All, Setup, Page Structure, Core, Core Text, Core Media, Interactive, Form. Neutral All-only cards lead the list. Shared Interactive/Form controls stay in the final Form group and retain its color.
- **Colors:** `data-category` on `.element` sets a single stable visual category. The eight approved foreground/background pairs are CSS custom properties in `css/style.css`. Keep all text within a colored card on the paired foreground.
- **Behavior:** `js/main.js` handles filtering, dialogs, copy, and non-selectable line numbers. Definitions remain normal fragment destinations without JavaScript or native dialog support. Examples are displayed as text and never executed.
- **Scope:** all original cards and existing filter memberships are retained, with Interactive and Form memberships added. Cards, definitions, and source records are now grouped in filter order rather than the original sequence. The title card now sits after head among the Setup entries, and main is rated common / priority 1. The reading guide includes a labeled card diagram and explains opinionated typical website usage separately from learning priority. The update adds the plan's 17 first-batch elements plus `title`, an essential missing Setup/Core entry. The later-batch and optional suggestions remain in `MODERNIZATION_PLAN.md` as a backlog.

## Checks

```sh
npm run lint
npm run format:check
PLAYWRIGHT_BROWSERS_PATH=node_modules/.cache/ms-playwright npx playwright install firefox webkit
npm test
```

The Chromium project uses an installed Google Chrome (`channel: "chrome"`). Firefox and WebKit use Playwright's test browsers in the ignored local cache. To run just Chrome, use `npm test -- --project=chromium`. Tests start the local server automatically when it is not already running.

`npm run check` runs HTML validation, JavaScript syntax checks, formatting checks, and browser tests. `npm run format` formats authored source. Browser tests cover every definition, filter memberships, keyboard focus, copying, fallback behavior, responsive reflow, axe AA checks, and computed text contrast including syntax tokens. Contrast reports are attached to Playwright test results.

Automated checks do not replace a human screen-reader review. Check VoiceOver/Safari or NVDA/Firefox before release, and verify real browser zoom and touch behavior on the intended devices.

## Prism and deployment

Prism 1.30.0 is vendored locally with its core, HTML markup grammar, and Line Numbers plugin. `npm run vendor:prism` reproduces `js/vendor/prism.js` and its license from the pinned npm package. The project supplies its own token palette and copy controls. The copy button follows each example; both button copying and manual text selection exclude line numbers.

Deploy `index.html`, `css/style.css`, `js/main.js`, `js/vendor/prism.js`, `js/vendor/PRISM-LICENSE.txt`, `LICENSE`, `CONTENT_SOURCES.md`, and `THIRD_PARTY_NOTICES.md` to any static host. No build step is required. Do not deploy `node_modules`, browser caches, or test reports.

## Licenses

Original site code retains the root GPLv3 license. Educational summaries and examples use CC BY-SA 4.0; MDN adaptations credit Mozilla Contributors individually. Prism uses MIT. See [third-party notices](THIRD_PARTY_NOTICES.md) and [content sources](CONTENT_SOURCES.md) for scope and attribution. Historical Git versions retain their original notices.
