# Iteration 3 · Lavender campus exploration

## Baseline and scope

Branch `feat/atlas-iteration-3` starts from the latest
`feat/atlas-iteration-2` commit `5d39d2f`. The initial working tree was clean.
Read the shared layout, Explore, theme/CSS/JS, tests, data, project memory and
publishing workflows. The live `/explore/` address could not be read through the
available web/executor access; all visual claims below concern the built preview.

Initial problems: green palette embedded in CSS and artwork; generic Explore
link directory; only color transitions; no actual campus map/data; separate legacy
theme preferences. Existing Python, game theory, C++ and GIS labs were retained.

## Implementation

- Global lavender tokens and optional light palette. Retained globe/brand/social
  assets recolored. Legacy blog shares tokens and theme choice, layout preserved.
- Explore campus hero, cartographic reference grid, original Mote mascot, category
  filters, a source-backed point atlas and preserved Geo/AI/Code discovery links.
- Point atlas: search, six records, category and favorite filters, details, OSM
  links, zoom/pan/keyboard, grid/point/label layers, expandable sidebar, load/retry,
  truthful empty states and browser-local favorites/view persistence.
- Enter/stagger, spring feedback, bounded magnetic CTA, limited card tilt/local
  highlight and native cross-document page transitions. No new runtime library.
- No invented road or building geometry; dining/housing points remain unfilled.
  This is a point atlas, not walking navigation. See `CAMPUS_DATA.md`.

## Visual QA and revision

Actual Chromium previews captured at 390, 768 and 1440px, with normal and reduced
motion. After inspecting the first full-page screenshots, revisions included:

1. Replace an unexpectedly green emoji with a text star; constrain code glyph width.
2. Separate source links from locate actions and increase map/list text size.
3. Reserve space around mobile controls, increase pin/favorite targets, and use
   callout leaders for nearby locations instead of shifting geographic coordinates.
4. Keep marker size constant when zooming; show details in view after selection.
5. Carry the palette/theme into retained legacy pages.

Screenshots and preview instructions are listed below after final verification.

## Verification commands

```sh
npm ci
npm run build
npm test
npm run test:atlas
bash tools/test.sh
node tools/check-pages-build.mjs _site/Brook-ZzQq.github.io
python3 -m http.server 4173 --directory _site
# Separate terminal:
npm run test:atlas:browser
npm run test:atlas:python
```

`test:atlas` includes the prior six tests, four campus model tests and the raw-source
publication regression (11 total). Browser tests cover all 15 primary pages in
both themes/three sizes and campus interactions, motion cancellation, storage and
network failure. Python uses the real pinned interpreter; local QA routes official
runtime files from the existing fixture, not a mock. Full results follow below.

## Deployment and review

**Production config is unchanged.** `.github/workflows/pages.yml`, its feature-2
publish trigger, `_config.yml` URL/baseurl and the upstream publishing files are
unchanged from `5d39d2f`. No Pages setting is changed; no merge, deploy or manual
publish dispatch occurs in this iteration. CI only gains a review artifact upload.

After the PR CI succeeds, download `atlas-iteration-3-preview` from its CI run's
Artifacts section (7-day retention). Extract, serve that directory with
`python3 -m http.server 8000`, and open:
`http://127.0.0.1:8000/Brook-ZzQq.github.io/explore/`.
The preview contains a built site, so Ruby/Node are not needed to view it.

Source preview: check out `feat/atlas-iteration-3`, `npm ci`, `npm run build`,
`bundle install`, `bundle exec jekyll serve`; open
`http://127.0.0.1:4000/Brook-ZzQq.github.io/explore/`.

## Limits / next steps

- Source-check additional dining/housing points before filling those categories.
- For a full campus basemap, obtain licensed roads/buildings/boundary geometry;
  current display must continue to identify itself as a point atlas.
- Native View Transitions enhance supported browsers; normal links remain the
  fallback. Mouse-only effects are suppressed for touch/reduced motion.
- Automated axe checks are not full manual screen-reader certification. No live
  Safari, real-device performance profile or Lighthouse score is claimed.

## Final local results

| Check | Actual result |
| --- | --- |
| `npm run build` | PASS, retained theme frontend assets |
| `npm test` | PASS, ESLint and existing SCSS lint |
| `npm run test:atlas` | PASS, 11 model/publication tests |
| `bash tools/test.sh` | PASS, production Jekyll; 36 files and 144 internal links |
| `node tools/check-pages-build.mjs _site/Brook-ZzQq.github.io` | PASS, built layout and assets |
| `npm run test:atlas:browser` | PASS, 15 primary pages × 3 sizes × 2 themes, then campus checks |
| Campus-specific checks | PASS, 390/768/1440px; search/category/empty/favorite/layers/details, pan/zoom/keyboard, view restoration, bounded magnet, reduced-motion cancellation |
| Failure/fallback checks | PASS, failed data fetch, denied storage, no-JS source cards and coarse-pointer/touch interaction |
| Legacy theme bridge | PASS, shared dark/light choice and computed purple palette; no new JS exceptions observed |
| `npm run test:atlas:python` | PASS, real Pyodide examples, exception, output cap, timeout, reload/stop |
| Root-path build + campus browser checks | PASS, empty baseurl with the same local data/controls |
| Production config diff against `5d39d2f` | EMPTY, including Pages workflow, publish/CD workflows and `_config.yml` |

Automated contrast scans wait until one-shot entrance animations finish; they do
not suppress contrast rules. Normal-motion magnetic and map feedback tests remain
active. Reduced-motion checks cancel CSS and Web Animations rather than just
speeding them up. Screenshot revisions were visually inspected, including tablet.
No direct deployed-site or Safari verification is claimed.

### Screenshots

- [Explore desktop](iteration-3/screenshots/explore-1440.png)
- [Explore tablet](iteration-3/screenshots/explore-768.png)
- [Explore mobile](iteration-3/screenshots/explore-390.png)
- [Campus point atlas](iteration-3/screenshots/map-desktop.png)

The built preview needs a local HTTP server; double-clicking an HTML file cannot
reliably load native modules and fetched JSON. The retained production URL still
serves iteration 2 until a separate publishing decision is made.
