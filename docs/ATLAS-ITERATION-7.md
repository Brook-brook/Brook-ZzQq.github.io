# Iteration 7: lavender garden UI

2026-11-04. Branch feat/atlas-iteration-7, based on sixth-round 07a2b5e.

The requested awesome-design-md repository was studied at fixed commit
fcc70284932276d085f01ef9f83edde90b1258cb. It is a design-document collection,
not an installed UI framework. [Research and source references](design-research-iteration-7.md).

## Changes

- Purple night canvas replaces near-black; light mode uses milk-lavender surfaces.
- Global semantic tokens retain readable plum text/contrasting actions in both themes.
- Existing glass layers use more transparent fills, solid fallback and lighter phone depth.
- Rounded primary actions, note tabs, filters and controls create a softer rhythm.
- Existing original Mote appears gently in the actual working notebook, with no idle animation.
- Reduced transparency disables backdrop filtering; keyboard focus and reduced motion remain.

No navigation/functionality/framework/dependency migration; map, source-based notes,
RSS/Atom processing, Python and old experiments remain. No production settings or
workflow changes, automatic merging or deployment.

## Actual previews

| | Light | Dark |
| --- | --- | --- |
| Phone | [390px](iteration-7/screenshots/home-390-light.png) | [390px](iteration-7/screenshots/home-390-dark.png) |
| Desktop | [1440px](iteration-7/screenshots/home-1440-light.png) | [1440px](iteration-7/screenshots/home-1440-dark.png) |

Real Chromium captures, not generated mockups. Phone light screenshot was visually
inspected: readable notebook, rounded controls, gentle lavender hierarchy, retained
project image and actual content. Sixth-round screenshots remain the prior-state record.

## Verification

npm run build, npm test, npm run test:atlas and the normal Jekyll/HTMLProofer
pipeline were run using existing dependencies/container. Publication fixtures:
10 cases/74 assertions. HTMLProofer: 40 files/160 internal links. Model tests:20.
The full browser suite covers 390/768/1440, both themes, keyboard/no-JS/axe,
map/labs, note filtering and RSS export. All suites passed; final results recorded in iteration-7/browser-results.txt. The original Atlas route sweep passed all three widths before an old campus palette assertion was reached; that assertion was updated to the requested new colors and all remaining suites rerun successfully. Reduced-transparency emulation confirmed backdrop-filter:none; real Pyodide smoke also passed. Root-path build and artifact checks passed.
Chromium is the tested browser; Safari/Firefox are not claimed tested.

No new third-party assets or packages; [compliance review](iteration-7-compliance.md).
DESIGN rules and source reference are documented for subsequent iterations.

## Preview

Use the PR's compiled CI artifact after it succeeds (existing artifact name
atlas-iteration-5-preview), not the raw repository ZIP. Unzip, serve the directory
containing Brook-ZzQq.github.io via python3 -m http.server 8000, then open
http://127.0.0.1:8000/Brook-ZzQq.github.io/ .
Or use bundle exec jekyll serve on the source checkout. Production stays unchanged.
