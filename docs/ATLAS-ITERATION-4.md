# Iteration 4: Obsidian Glass

Base: unmerged `feat/atlas-iteration-3` at `ffba216`. Review branch:
`feat/atlas-iteration-4`. No production publishing settings or workflow changed.

## Result

Explore now opens on its working, sourced campus point atlas. The large marketing
hero, decorative orbit and repeated lab cards are replaced by a compact heading,
map-first workspace and learning index. The six original points and every source
link remain. This is a point atlas, not a road basemap or walking navigator.

Shared Obsidian tokens and glass dock extend to Atlas routes; retained blog colors
stay synchronized. Search/list, small controls and selected detail have three
glass depths, opaque fallback and cheaper phone blur. Detail occupies reserved
space on desktop and an inline sheet on mobile. No dependency or framework was
added to the site. Navigation uses native links and optional View Transitions.

Finite marker feedback, a moving dock indicator and one bounded magnetic CTA
respond to interaction. The working app skips decorative content reveals. Reduced
motion, keyboard navigation and no-script source links remain usable.

## Hallmark evidence and revision

Hallmark 2.0.0 was actually installed, studied and run before and after edits.
See [before-code audit](design-audit-iteration-4.md),
[original audit output](iteration-4/hallmark-before.txt),
[final audit output](iteration-4/hallmark-after.txt), and
[independent review](iteration-4/independent-review.md).

- Baseline: 19 FAIL, 70 REFLEX. Final: 0 FAIL, 0 REFLEX.
- `--kept`: 22/22 links and 1/1 fields retained. Five introduction/empty-state
  headings changed on record; all data qualifications and learning links kept.
- One warning remains: visible word count fell from 292 to 162. Manual inventory
  confirmed that removed words were slogans/duplicate introductions, with factual
  data notes and original learning descriptions retained.
- Glass is an explicit user-requested material; its generic wash warning is waived
  on record. Category/layer selected fills encode state, and glass edge plus shadow
  follows the requested material; both Finish warnings are answered on record.
- Independent finish review found three issues, all corrected: label-layer CSS
  specificity; detail reopening after layer changes because it shared `data-place`
  with list cards; and unclear list continuation. Detail now uses its own state
  hook. Filters moved above the map, allowing more records to show, with a scroll
  hint. A final phone screenshot prompted horizontally scrolling filters so the
  map remains visible on a small first screen.
- The layout explicitly retains navigation semantics for the source-link list;
  browser checks click the last scrolled record and confirm it opens correctly.

## Screenshots

| State | Before | After |
| --- | --- | --- |
| Desktop 1440×900 | [Before](iteration-4/screenshots/before-desktop.png) | [After](iteration-4/screenshots/after-desktop.png) |
| Phone 375px, full page | [Before](iteration-4/screenshots/before-mobile.png) | [After](iteration-4/screenshots/after-mobile.png) |
| Selected place | — | [Desktop](iteration-4/screenshots/selected-desktop.png), [390px phone](iteration-4/screenshots/selected-mobile.png) |

Screenshots came from real local Chromium. Hallmark emitted five renders and
checked eight widths. Existing Playwright suites and additional interaction
screenshots independently checked the live Jekyll build.

## Verification performed

| Command / check | Actual result |
| --- | --- |
| `npm run build` | PASS |
| `npm test` | PASS, ESLint and original Sass lint |
| `npm run test:atlas` | PASS, 11 model/build-guard tests |
| `bash tools/test.sh` | PASS, Jekyll production build; HTMLProofer 36 files / 144 internal links |
| `node tools/check-pages-build.mjs _site/Brook-ZzQq.github.io` | PASS, rendered artifact and basepath assets |
| Existing `tests/atlas-browser.mjs` | PASS, 15 pages × 3 widths × 2 themes, axe, links, labs, keyboard, no-JS |
| `node tests/campus-browser.mjs` | PASS, 390/768/1440, favorites, filters, layers, drag, state restore, touch, storage/network failures, legacy themes |
| `node tests/obsidian-browser.mjs` | PASS, 320/390/768/1440/1920, first-screen map, visible labels, closed-detail stability, unblocked controls, focus fallback, all source records, opaque glass fallback |
| `PYODIDE_FIXTURE=work/pyodide ... npm run test:atlas:python` | PASS, real pinned Pyodide: three examples, exception, output cap, timeout, reload, stop |
| Jekyll `--baseurl ''` and root-path Obsidian browser suite | PASS, all five widths; rendered-root artifact guard also PASS |
| `git diff --check` | PASS |

The original browser suite’s two exact color expectations were updated solely to
the new explicitly requested dark/light tokens. No interaction assertions were
removed or weakened. Project-installed Hallmark tooling is excluded from product
ESLint; the preexisting mixed quote style of the campus test gets a narrow style
rule, without mass-formatting its logic.

CI’s browser entry now also runs the new Obsidian suite. It uploads
`atlas-iteration-4-preview` for seven days. Only review CI artifact naming changed;
Pages deployment source, production workflow, URL and baseurl are unchanged.

## Preview without publishing

After the PR’s Ruby 3.3 CI job succeeds, download the
`atlas-iteration-4-preview` artifact from its Actions run and unzip it. The extracted
folder contains `Brook-ZzQq.github.io/explore/index.html`.

From the **parent of that inner `Brook-ZzQq.github.io` folder**:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/Brook-ZzQq.github.io/explore/`.
Do not serve an unbuilt source checkout with Python: it cannot compile Jekyll’s
layouts or Liquid. With Ruby/Node installed, source preview instead uses:

```sh
npm ci
npm run build
bundle install
bundle exec jekyll serve
```

Open `http://127.0.0.1:4000/Brook-ZzQq.github.io/explore/`.

## Limits

Production Pages could not be opened under the execution environment’s network
policy and was not modified. Browser verification used Chromium, not physical
Safari/iOS devices. The six-point data inventory is unchanged; dining/housing
remain intentionally empty. Next useful map work is additional verified data and
properly licensed cartographic context, separately from this design iteration.
