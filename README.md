# Brook’s Digital Universe

**A personal digital garden for learning, building and exploring.**

A Jekyll personal space for learning notes, projects, creative experiments and
new interests. Brook’s Atlas remains its campus-map work.
Public identity: **Brook**. Production publishing uses the built-site Actions workflow.

## Iteration 7 UI refinement

The lavender garden refinement is on `feat/atlas-iteration-7`, based on sixth-round
`07a2b5e`. It studies awesome-design-md without copying branded assets.
[Report/screenshots](docs/ATLAS-ITERATION-7.md),
[reference study](docs/design-research-iteration-7.md),
[compliance](docs/iteration-7-compliance.md). Publishing remains unchanged.

## Iteration 6 review

Source-based research notes and a local RSS/Atom learning experiment are on
`feat/atlas-iteration-6`, based on research commit `3d49c7f` (fifth-round product
baseline `a4b24a6`). This is a review branch, with no automatic merge/publication.
See [scope and validation](docs/ATLAS-ITERATION-6.md),
[initial audit](docs/iteration-6-audit.md), [content authoring](docs/STUDY_CONTENT.md)
and [license review](docs/iteration-6-compliance.md).

## Iteration 5 review

The new Home, Study and data-driven Projects are on `feat/atlas-iteration-5`,
based on the **unmerged** fourth-round branch (`4d32f15`). Production publishing
is unchanged. See [report, screenshots and preview instructions](docs/ATLAS-ITERATION-5.md),
[product audit](docs/iteration-5-audit.md), [compliance review](docs/iteration-5-compliance.md)
and [third-party notices](THIRD_PARTY_NOTICES.md).

## Explore

- `/`: personal introduction, real tutorial notebook, selected work and build records.
- `/study/`: searchable tutorials and source-based research; type/category/query filters can be shared by URL.
- `/explore/`: sourced Zijingang point atlas, search, favorites and Geo/AI/Code lab links.
- `/playground/`: prisoner/stag games, C++ copying and Mercator scale.
- `/playground/nash/`: editable 2×2 pure-strategy equilibrium explorer.
- `/playground/python/`: real Python via lazy Pyodide Worker.
- `/playground/research/`: edit local RSS/Atom, inspect URL normalization/deduplication and download unreviewed JSON; no network or AI.
- `/knowledge/`: retained relationship map and tutorial index; all article URLs remain valid.
- `/projects/`, `/about/`: accurate project states and public introduction.
- `/journal/`: preserved Chirpy demo posts; old `/atlas/` routes redirect.

## Develop and preview

Requires Ruby 3.3+ and Node 24 (the retained theme toolchain uses modern Node).

```sh
npm ci
npm run build
bundle install
bundle exec jekyll serve
```

Open `http://127.0.0.1:4000/Brook-ZzQq.github.io/`.
For a local root-path preview without editing deployment configuration, run
`bundle exec jekyll serve --baseurl ""` and open `http://127.0.0.1:4000/`.
A plain Python server cannot compile Jekyll source; use the built CI preview
if you do not have Ruby. See the iteration report for exact ZIP instructions.

## Verify

```sh
npm test
npm run test:atlas
npm run test:study:build
bash tools/test.sh
python3 -m http.server 4173 --directory _site
# In another terminal:
npm run test:atlas:browser
npm run test:atlas:python
```

Local browser tests default to `/usr/bin/chromium`. Set `CHROMIUM_PATH` to use a
different installation. CI uses Playwright Chromium. Tests cover 390/768/1440px,
both themes, keyboard access, axe checks, links, lab interactions and real Python.
Python tests need the pinned jsDelivr runtime; no model/service credentials exist.

## Content and boundaries

Add tutorials or source-checked research Markdown to `_atlas_notes/`; see
[the metadata/publication rules](docs/STUDY_CONTENT.md). Research without complete
evidence or the required status does not become a public article. Study categories,
latest notes and article pages update automatically. Add project records to
`_data/projects.yml`; optional details, links, preview and `featured: true` drive
Projects and Home without separate page edits. Notebook choices and factual
build records live in `_data/universe.yml`. No CMS or database is needed. Content labels distinguish laboratory tutorials and project research, without
claiming personal experience or accolades. Source checking is not owner approval.

Only pure-strategy equilibria are enumerated. C++ is a semantic visualization;
unsafe shallow-copy code is not executed. GIS uses spherical/local approximations.
The AI flow is a deterministic demonstration, not a real LLM/Agent. Python uses a
browser virtual filesystem, output cap and 5-second run timeout.

## Project memory

- [Development rules](AGENTS.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Roadmap and limits](docs/ROADMAP.md)
- [Locked product/design direction](design.md)
- [Iteration 6 report](docs/ATLAS-ITERATION-6.md)
- [Study content model](docs/STUDY_CONTENT.md)
- [Iteration 5 product audit](docs/iteration-5-audit.md)
- [Iteration 5 screenshots and validation](docs/ATLAS-ITERATION-5.md)
- [Open-source review](docs/iteration-5-compliance.md)
- [Iteration 4 foundation](docs/ATLAS-ITERATION-4.md)
- [Iteration 2 engineering audit](docs/ATLAS-ITERATION-2.md)

For GitHub Pages, select **Settings → Pages → Source → GitHub Actions**.
The publish workflow builds and deploys `feat/atlas-iteration-2`, the branch Brook
has selected. Do not publish the raw source directory as static HTML.
See [publishing and recovery](docs/PUBLISHING.md). No automatic merge is performed.

## Credits

Built on [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) under the
existing MIT license. [Original theme README](docs/CHIRPY_README.md).
Globe coastline data: [Natural Earth](https://www.naturalearthdata.com/), public
domain. Python runtime: [Pyodide](https://pyodide.org/), pinned to 0.27.7 and
loaded only on request. Playwright and axe are development-only dependencies. Full upstream notices and
license texts are retained in THIRD_PARTY_NOTICES.md and licenses/. Every future
iteration updates its own compliance report, even without new dependencies.
