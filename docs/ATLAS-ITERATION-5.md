# Iteration 5: a living digital garden

Branch `feat/atlas-iteration-5` starts from fourth-round `4d32f15`.
Fourth-round PR #3 is still unmerged; this iteration does not assume main contains
it. No Pages source, publish workflow, production branch, URL or baseurl changed.

## What changed

The umbrella is Brook’s Digital Universe: a personal space that can grow beyond
current GIS/AI/code interests. Campus remains an important work rather than the
whole identity. No learning streaks, course percentages, life events or achievements
were fabricated. Growth records on Home explicitly describe actual website work.

- Home: personal introduction, working tutorial-preview tabs with keyboard support,
  one actual campus product capture, latest Markdown notes, real runnable experiments,
  and source-linked build records. Different sections use distinct layouts.
- Study: new `/study/` route, automatic categories, client-side search, empty state,
  tutorial dates, reading links and matching experiment links. Knowledge and all
  old article URLs remain; notes highlight Study in navigation.
- Projects: `_data/projects.yml`, optional record-specific disclosures, status,
  technology, real links and optional featured previews. Planned work has no false
  demo. The generic Home feature renderer also reads its image, caption and links
  from the record, so another selected project cannot accidentally inherit map copy.
- Shared Obsidian shell and motion persist. One featured image has pointer light;
  reduced motion and native navigation remain. No runtime dependency or framework
  was added; Home does not load a map engine or Python interpreter.
- Visible OSM attribution is now on the complete map as well as the Home preview.
  Notices and actual license texts are retained; future iterations must repeat the
  compliance review. Public identity stays Brook; no private contact details added.

## Main files

| Area | Files |
| --- | --- |
| Pages/shell | `index.html`, `study/index.html`, `projects/index.html`, `_layouts/atlas.html`, `_data/atlas.yml` |
| Content | `_data/projects.yml`, `_data/universe.yml`, existing `_atlas_notes/` |
| Shared rendering | `_includes/universe-notebook.html`, `universe-feature.html`, `universe-project.html`, `study-index.html` |
| Visuals/interaction | `assets/css/universe.css`, shared `obsidian.css` / `atlas-tokens.css`, `assets/js/atlas/universe.js`, actual map/social captures |
| Preservation | Small Knowledge focus/label improvements, note breadcrumbs, broadened About copy, visible map attribution |
| Verification/process | `tests/universe-browser.mjs`, CI review artifact, `design.md`, `AGENTS.md`, notices, `licenses/`, compliance report |

## Actual Hallmark workflow

The previously installed Hallmark 2.0.0 was reused, not claimed as a new tool call
that does not exist. Baseline study covered Home, Projects and retained Knowledge;
original output: [before](iteration-5/hallmark-before.txt).

Home received a full page/hero sweep. Content-index interactions and preservation
received an app-scope rendered `--kept` sweep over Home, Projects, Knowledge and
Study. These are separate checks: Home was also checked with page layout gates.
The new/shared style sources are the sweep target; the inherited `atlas.css`
retained for older labs/blog-style routes is **not** claimed globally lint-clean.
An initial broader source audit exposed that inherited debt; there was no attempt
to turn every old unused style into a new design in this iteration.

- [Home final sweep](iteration-5/hallmark-home.txt): 0 FAIL, 0 REFLEX, 0 WARN.
- [Index/preservation sweep](iteration-5/hallmark-indexes.txt): 0 FAIL, 0 REFLEX,
  0 WARN; all 18 baseline links and the preexisting search field retained.
- Eleven old marketing/figurative headings were changed on record. The old globe
  file and Natural Earth notice remain, while the main visual no longer fixes the
  site to a geographic identity.
- User-requested glass/motion exceptions and full question titles wrapping to two
  phone lines are recorded. `design.md` locks this house style. The short owner
  lede and state fills have explicit judged answers.
- [Hero review](iteration-5/hero-review.md): two findings fixed and rescored
  resolved. Phone spacing was tightened to bring the excerpt and links into the
  first screen; internal progress language became useful reader guidance.
- [Independent finish review](iteration-5/finish-review.md): **ship**, zero ranked
  findings. It inspected complete desktop/phone pages and actual interactions at
  320, 375 and 1440px. No horizontal overflow or page errors were found.

## Screenshots

| Page | Desktop | Phone |
| --- | --- | --- |
| Home | [1440px](iteration-5/screenshots/home-desktop.png) | [375px](iteration-5/screenshots/home-mobile.png) |
| Study | [1440px](iteration-5/screenshots/study-desktop.png) | [375px](iteration-5/screenshots/study-mobile.png) |
| Projects | [1440px](iteration-5/screenshots/projects-desktop.png) | [375px](iteration-5/screenshots/projects-mobile.png) |

[Home before](iteration-5/screenshots/home-before.png) shows the earlier fixed
Geo/AI/Code presentation. All screenshots are real Chromium renders, not concepts.
The campus and social images are actual local product captures as well.

## Validation

Local final results are below; CI evidence is added after the PR run. Tests exercise
actual browser behavior; static checking is not treated as a browser preview.

- `npm run build`: passed.
- `npm test`: passed, ESLint and retained Sass lint.
- `npm run test:atlas`: 11 model/build-guard tests passed.
- `bash tools/test.sh`: production Jekyll build and HTMLProofer passed, 37 HTML
  files and 148 internal links.
- `npm run test:atlas:browser`: passed. Existing 15 routes × 3 widths × 2 themes;
  campus filters/favorites/layers/persistence/keyboard/touch/error/no-JS;
  Obsidian 320/390/768/1440/1920 checks; new three-page Universe checks in
  390/768/1440 × both themes, notebook keyboard controls, Study empty/reset,
  project disclosure, truthful planned state, old routes and no-JS content.
- `PYODIDE_FIXTURE=work/pyodide ... npm run test:atlas:python`: passed with the real
  pinned interpreter, examples, error, cap, timeout, reload and stop. Fixture serves
  actual downloaded distribution bytes locally rather than mocking Python.
- Root-path Jekyll build, artifact guard and Universe browser suite: passed,
  all three new pages × three sizes × both themes, plus no-JS. Project-prefix
  artifact guard also passed (nine homepage assets and retained routes/bundles).
- `git diff --check`: passed.

One intermediate browser run overlapped regeneration of the served directory and
returned a temporary 404. The final run used a frozen build and completed; this
was not hidden by weakening a test. Existing interaction assertions remain.

## How to preview without changing production

After the PR’s Ruby 3.3 CI run succeeds, download **atlas-iteration-5-preview**
from that Actions run’s Artifacts section and unzip it. The extracted parent
contains the inner `Brook-ZzQq.github.io` folder.

Serve that **parent**, not the raw source checkout or the inner folder:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/Brook-ZzQq.github.io/` and `/study/` beneath the same
prefix. Python serves compiled files only; it does not interpret Jekyll source.
With Ruby 3.3+/Node 24 installed, source preview instead uses:

```sh
npm ci
npm run build
bundle install
bundle exec jekyll serve
```

Open `http://127.0.0.1:4000/Brook-ZzQq.github.io/`.

## Adding content

Add a Markdown tutorial with existing front matter to `_atlas_notes/`; article
URLs, Study entries/categories and latest Home notes update automatically. Dates
are publication metadata, not inferred learning progress.

Add a record to `_data/projects.yml`; details, stacks, links and preview are optional.
Mark implemented work `featured: true` to include its own data-driven Home feature.
An image preview requires a real destination and dimensions/alt text; geographic
captures also require visible attribution. Do not give planned records fake demos.
Edit `_data/universe.yml` for selected notebook excerpts and factual build records.
No empty Growth page, CMS, database or rigid future-interest taxonomy was added.

## Compliance and remaining limits

[Compliance review](iteration-5-compliance.md), [notices](../THIRD_PARTY_NOTICES.md)
and complete verified license texts in `licenses/` document actual sources.
No new runtime dependency, external font, photo library, map tile or private data.
The public website was not redeployed; its Pages domain is inaccessible under the
current execution environment’s network policy. Verification used real Chromium,
not physical Safari/iOS hardware. Existing tutorials preserve code/text formulas;
no heavy new math-rendering runtime or full course/progress system is claimed.
