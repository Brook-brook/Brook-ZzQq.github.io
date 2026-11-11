# Brook’s Digital Universe roadmap

## Implemented in the review branch

- Home, Explore, Geo Lab, AI Lab, Code Lab, Projects, Knowledge, About.
- Responsive navigation, persistent dark/light mode, accessible no-JS reading.
- Four Markdown tutorials with metadata, TOC, code blocks and experiment links.
- Knowledge map, client-side search, category filtering and empty state.
- Prisoner/stag payoff labs and editable 2×2 pure-strategy Nash explorer.
- Four-step C++ shallow/deep copy visualization with valid lifetime semantics.
- Spherical Mercator local scale/area experiment and labelled GIS × AI workflow.
- Lazy Pyodide Worker with examples, real execution, errors, output cap,
  stop/reload and timeout. Runtime downloads only after the visitor requests it.
- Existing Chirpy blog/posts remain accessible; old Atlas preview routes redirect.
- Automated model/browser checks plus an explicit build-before-deploy Pages workflow.

## Next useful increments

1. Public-goods game: explicit group size, contribution limits and social welfare.
2. C++ RAII/smart-pointer ownership examples; assignment and move semantics.
3. Map analysis with a verified dataset and CRS-aware distance/buffer operations.
4. Real GIS tool calling with permission boundaries, reproducible results and
   transparent execution logs. Current AI section is a concept demonstration.
5. Add verified personal projects after reviewing their actual source and state.

## Release preparation

Review the PR before merging. The default config targets the GitHub project URL
`https://brook-brook.github.io/Brook-ZzQq.github.io/`. For a different Pages path,
change `url`/`baseurl` and repeat the path tests. Publishing now uses `.github/workflows/pages.yml`, targeting the selected
`feat/atlas-iteration-2` branch. Pages Source must be **GitHub Actions**; see
`PUBLISHING.md`. The nested upstream starter remains inactive.

## Limits

No mixed-strategy solver, public-goods module, complete C++ course, real Agent,
backend storage or unverified external project is presented as completed. Pyodide
needs the pinned CDN at first load and is not a complete local Python environment.
Original theme demo posts remain labelled via the legacy blog entry; they are not
Brook's personal experience or newly authored learning notes.

## Iteration 3 review branch

Lavender shared tokens, meaningful motion and source-backed Zijingang point atlas.
See `ATLAS-ITERATION-3.md` and `CAMPUS_DATA.md`. Dining/housing data and a full
road/building basemap are future verification tasks, not completed map coverage.
The production feature-2 deploy trigger remains unchanged.


## Iteration 5

Home now connects real tutorials, projects, runnable experiments and factual build
records. Study is a first-class `/study/` entry backed by existing Markdown; old
Knowledge routes remain. Projects and optional homepage previews come from YAML.
No personal progress, life history or new interests were invented. Future growth
can add authored content without making current GIS/AI/code categories permanent.

A recurring open-source review is part of AGENTS.md, with notices and complete
verified license texts. The fourth-round map remains a featured work with its
original interactions and source data. Production still targets feature-2; review
branches are not automatically merged or deployed.


## Iteration 6 review branch

Implemented for review, not automatically published: typed Study notes and source
provenance, centralized research publication checks, combination filters/shareable
URLs, independently written BestBlogs/RSS notes and a local RSS/Atom-to-JSON lab.
Existing map and programming labs remain. Next: verify the usefulness of curated
notes before considering a separately bounded Research CLI/Agent. No live content
crawler, model scoring, recommendation service or automatic publication is added.

## Iteration 7 UI refinement

Shared purple-night/milk-lavender tokens, softer glass, rounded controls and the
original Mote remain the baseline. The referenced design documents informed the
UI without copying branded assets. See `ATLAS-ITERATION-7.md`.

## Iteration 8 learning ecosystem — review branch

Four freely accessible learning routes connect the six existing notes and actual
experiments: Python/data/evidence, projection/provenance, C++ ownership and game
models. Nine self-check steps have optional manual checks and local notes, a
continue link, and JSON export/previewed merge. Notes and relevant labs link back
to their routes. Storage failures and another tab's changes pause persistence
without claiming durable saving. No automatic mastery or engagement counters.

Next useful learning work: deepen one route with independently written worked
examples and explanation feedback, then add RAII/move or public-goods material
only alongside a real experiment. A durable cross-device journal needs a separate
storage/identity decision; there is no synchronization or account in this version.
The fourth-to-eighth-round branches remain review work until explicitly published.
