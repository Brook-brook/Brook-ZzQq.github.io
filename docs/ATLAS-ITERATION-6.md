# Iteration 6: research, evidence and a runnable data experiment

Date: 2026-11-04 (Asia/Shanghai). Branch: `feat/atlas-iteration-6`.
Base: BestBlogs research `3d49c7f`, extending fifth-round product `a4b24a6`.
The review PR targets `docs/bestblogs-research`; no assumption of prior merges
or production deployment. Pages source, workflow, URL/baseurl stay unchanged.

## What a reader can do

- Study distinguishes laboratory tutorials from project research. Combine type,
  category and keyword/source/tag search; share the URL, reload the same filter,
  or reset it by keyboard. No-JS still exposes all public notes.
- The BestBlogs reading note links the exact researched commit and evidence,
  explains A/B/C/D, scoring/Schema/reading-side-effect findings and license limits.
  It does not offer an empty lab link or claim Brook manually approved it.
- A new RSS/Atom tutorial links `/playground/research/`. Edit XML, choose optional
  tracking removal, inspect normalized URLs and each retained/duplicate/invalid
  decision, then download JSON. It is real local processing, with no network,
  model call, stored pasted data, fake AI score or publish action.
- Home latest notes/experiment links and Projects connect this work to the garden.
  The campus work remains one project; old tutorials, map and programming labs
  and Knowledge URLs remain.

`source_checked` means source cross-checking, not owner approval or publication.
The experimental JSON intentionally keeps null summary/score and needs_review.
The page supports a declared subset of RSS2/Atom, not a production feed crawler,
full-text extractor or semantic deduplicator. See [authoring rules](STUDY_CONTENT.md).

## Central publication check

A small Jekyll post_read hook prunes unpublished/draft/unverified research before
indexes, previews, generators/sitemap and direct output. Checked records require
full provenance and explicit AI-assistance metadata; malformed checked records
fail the build. It also removes stale output when a prior research page is demoted.
This is a static publication safeguard, not a replacement for owner authorization.

The real-build fixture runner is part of existing `tools/test.sh`, so the same
checks run through the current CI test entry point without workflow edits.

## Design and actual correction loop

The locked lavender Obsidian system remains; no framework/theme/animation library
was added. New lab uses Hallmark app-screen scope, no marketing page scaffolding.
Source/JSON are the material; row decisions show actual data, not decorative stats.

Real screenshots exposed two problems beyond code/axe checks:

1. Inherited global dl grid squeezed provenance values into a character per line.
   The new component now resets its outer dl/details layout; a geometry assertion
   checks repository/date readability. This did not require rewriting old styles.
2. Phone pipeline labels broke awkwardly across four narrow columns. They now
   form a 2×2 sequence. XML/select phone text is 16px to avoid sub-16px form zoom;
   the primary run action sits beside the input heading, before the long sample.

[Initial provenance problem](iteration-6/screenshots/provenance-before-fix.png)
is retained as actual first-pass evidence. The final screenshot links below show
the corrected pages, not concepts or reused fifth-round images.

| Screen | Desktop | Phone |
| --- | --- | --- |
| Study | [1440](iteration-6/screenshots/study-desktop.png) | [390](iteration-6/screenshots/study-mobile.png) |
| Research note | [1440](iteration-6/screenshots/provenance-desktop.png) | [390](iteration-6/screenshots/provenance-mobile.png) |
| RSS lab/result | [1440](iteration-6/screenshots/research-desktop.png) | [390](iteration-6/screenshots/research-mobile.png) |

Hallmark render sweeps cover the new lab and Study in the existing shell. They
report zero Floor failures/unresolved Reflex findings or warnings. Existing
requested-glass waivers/finish answers remain; Study records a 49b waiver for full
article titles wrapping at 320px, matching the existing content style. A ledger
note about those established house-style waivers is retained. The inherited
atlas.css of older pages is not claimed globally lint-clean.

Original outputs: [lab](iteration-6/hallmark-lab.txt),
[Study](iteration-6/hallmark-study.txt). Fresh-context independent
[finish review](iteration-6/finish-review.md): ship, no ranked findings, 30 actual
page/width/theme captures plus result states, keyboard, no-JS and local links.

## Validation

Commands run with existing Node dependencies and the existing atlas-build Ruby
container. No new package, gem or tool installation was needed.

| Check | Actual result |
| --- | --- |
| npm run build | Passed |
| npm test | ESLint and existing Sass lint passed |
| npm run test:atlas | 20 passed: retained 11 model/build guards plus 9 URL/data tests |
| npm run test:study:build (container) | 10 real Jekyll cases / 74 assertions passed |
| bash tools/test.sh (container) | Publication checks, production Jekyll build and HTMLProofer passed; 40 HTML files, 160 internal links |
| Pages build guard | Rendered shell/assets/routes verified for project prefix and root path |
| npm run test:atlas:browser | Passed: retained suites plus new Study/research suites on the final built _site |
| npm run test:atlas:python | Real pinned Pyodide via CDN in Chromium passed: examples, exception, cap, timeout, reload and stop |
| Root-path Jekyll + new browser suites | Passed: Study/research at root; final 16px lab confirmation also passed |
| git diff --check | Passed before delivery |

Browser coverage includes 390/768/1440 × both themes, axe, navigation, keyboard,
old routes, no-JS, map interactions, source disclosure, filter intersection/URL
restoration, RSS/Atom/prefixed Atom, hostile CDATA/URLs, XML/size/item errors,
current JSON download, stale invalidation and no lab network/storage writes.

Saved logs: [build/link/publication](iteration-6/build-results.txt), [browser](iteration-6/browser-results.txt), [real Python](iteration-6/python-results.txt).

The last phone-font assertion initially ran against an older preview artifact;
that mismatch was corrected by building and testing the final `_site` separately.
It is not counted as a product pass. A dedicated confirming run verifies the
16px controls. Chromium is the tested browser; Safari/Firefox are not claimed.
External source links are pinned but not all checked for current online access.

## Main files

- Content: two `_atlas_notes/` articles, `_data/projects.yml`, `_data/universe.yml`.
- Shared rendering: `_layouts/atlas.html`, note-kind/provenance includes,
  Study/notebook includes, Home, retained Knowledge and Playground links.
- Local experiment: `playground/research/index.html`, research JS/models/CSS.
- Content/filter behavior: `assets/js/atlas/site.js`, `assets/css/study.css`,
  `_plugins/atlas-note-publication.rb`.
- Verification: publication fixtures, model tests, Study/research browser tests,
  shared expected-note discovery, existing-suite extensions and tools/test.sh.
- Process: README, authoring/design/roadmap/rules, notices, audit/compliance and
  this report with real screenshots.

No new third-party implementation/assets: [compliance review](iteration-6-compliance.md).

## Review and preview

Nothing was automatically merged/deployed. Review the branch/PR first.

For a local source checkout, use Ruby 3.3+ / Node24 and the existing README build
instructions. `bundle exec jekyll serve` exposes
`http://127.0.0.1:4000/Brook-ZzQq.github.io/study/` and
`http://127.0.0.1:4000/Brook-ZzQq.github.io/playground/research/`.
A Python server on uncompiled repository source cannot render this site.

For a Ruby-free preview, once the PR CI build succeeds, download that run's built
site artifact (the existing workflow still calls it `atlas-iteration-5-preview`;
check the run's branch/commit). Unzip it and serve the directory containing the
`Brook-ZzQq.github.io` folder with `python3 -m http.server 8000`. Then open:

- http://127.0.0.1:8000/Brook-ZzQq.github.io/study/
- http://127.0.0.1:8000/Brook-ZzQq.github.io/playground/research/

Next: test whether this small source-to-experiment path is useful. A separate
bounded Research CLI/Agent can follow actual learning needs; live aggregation,
personalization, model scoring and automatic publication remain unimplemented.
