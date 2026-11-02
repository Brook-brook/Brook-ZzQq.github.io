# Brook's Atlas

**Mapping Knowledge. Building Intelligence. Exploring Possibilities.**

A Jekyll digital laboratory for GIS × AI × Code × Interactive Learning.
Public identity: **Brook**. Production publishing uses the built-site Actions workflow.

## Explore

- `/`: Atlas homepage with a local SVG globe.
- `/explore/`: Geo, AI and Code labs.
- `/playground/`: prisoner/stag games, C++ copying and Mercator scale.
- `/playground/nash/`: editable 2×2 pure-strategy equilibrium explorer.
- `/playground/python/`: real Python via lazy Pyodide Worker.
- `/knowledge/`: searchable Markdown tutorials and a linked knowledge map.
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
For a root-domain installation, set `baseurl: ""` and verify that configuration.

## Verify

```sh
npm test
npm run test:atlas
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

Add a Markdown file to `_atlas_notes/` with the metadata used by existing notes.
The collection builds lists and note pages automatically. Tutorials added in this
iteration are labelled laboratory tutorials, not personal experience or accolades.

Only pure-strategy equilibria are enumerated. C++ is a semantic visualization;
unsafe shallow-copy code is not executed. GIS uses spherical/local approximations.
The AI flow is a deterministic demonstration, not a real LLM/Agent. Python uses a
browser virtual filesystem, output cap and 5-second run timeout.

## Project memory

- [Development rules](AGENTS.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Roadmap and limits](docs/ROADMAP.md)
- [Audit and validation](docs/ATLAS-ITERATION-2.md)

For GitHub Pages, select **Settings → Pages → Source → GitHub Actions**.
The publish workflow builds and deploys `feat/atlas-iteration-2`, the branch Brook
has selected. Do not publish the raw source directory as static HTML.
See [publishing and recovery](docs/PUBLISHING.md). No automatic merge is performed.

## Credits

Built on [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) under the
existing MIT license. [Original theme README](docs/CHIRPY_README.md).
Globe coastline data: [Natural Earth](https://www.naturalearthdata.com/), public
domain. Python runtime: [Pyodide](https://pyodide.org/), pinned to 0.27.7 and
loaded only on request. Playwright and axe are development-only dependencies.
