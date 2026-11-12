# Third-party notices

Brook’s Digital Universe retains the original theme and dependency notices.
This inventory distinguishes shipped site code/assets, externally loaded runtimes,
and design/build tools. Exact versions and review scope: `docs/iteration-5-compliance.md`.

## Site and theme

- **Chirpy 7.6.0**, Cotes Chung: MIT. Original copyright and complete grant remain
  in the repository’s `LICENSE` and `licenses/Chirpy-MIT.txt`; the theme was extended, not relicensed or replaced.
- **Bootstrap 5.3.8**, Bootstrap Authors: MIT. Text: `licenses/Bootstrap-MIT.txt`.
- **Popper 2.11.8**, Federico Zivolo: MIT. Text: `licenses/Popper-MIT.txt`.
- **Chirpy static-assets**, commit `5cde3f0076b62e45fc68291893cf7d93e122adb7`:
  MIT for that repository, with component licenses continuing to apply.
  Text: `licenses/Chirpy-static-MIT.txt`. The submodule is retained; fifth-round
  changes do not copy its third-party files into new UI.

The retained legacy blog references additional libraries via `_data/origin/`:
tocbot, Simple-Jekyll-Search, Mermaid, Day.js, GLightbox,
loading-attribute-polyfill, Clipboard.js and MathJax. These references and their
upstream notices are retained, not newly copied or modified in iteration 5.
The fifth-round pages use native JavaScript/CSS and local system fonts.
The configured legacy CDN aliases were resolved during review; complete notices
are also retained under `licenses/Legacy-*.txt`: tocbot 4.36.8 (MIT),
Simple-Jekyll-Search 1.10.0 (MIT), Mermaid 11.17.2 (MIT), Day.js 1.11.23 (MIT),
GLightbox 3.3.1 (MIT), loading-attribute-polyfill 2.1.1 (MIT), Clipboard.js 2.0.11
(MIT), and MathJax 4.1.3 (Apache 2.0). These are review-time alias resolutions,
not a change to the inherited runtime version configuration.

## Fonts and icons

- The new Universe/Atlas UI’s icon sprite, brand SVG and Mote are project assets;
  no third-party icon set or illustration was copied for iteration 5.
- Local platform fonts are referenced by CSS name; font files are not distributed.
- The legacy blog’s **Lato** and **Source Sans** font families are under the SIL
  Open Font License 1.1. Verified upstream texts are retained as
  `licenses/Lato-OFL.txt` and `licenses/Source-Sans-OFL.txt`.
- Legacy **Font Awesome Free** uses CC BY 4.0 for icons, SIL OFL 1.1 for fonts,
  and MIT for code. Its upstream license bundle is in
  `licenses/Font-Awesome-Free.txt`. New UI SVG icons are not derived from it.

## Python runtime

**Pyodide 0.27.7** is loaded only when requested from
`https://cdn.jsdelivr.net/pyodide/v0.27.7/full/`.
Pyodide source is MPL 2.0 (`licenses/Pyodide-MPL-2.0.txt`);
source is available at `https://github.com/pyodide/pyodide/tree/0.27.7`.
Its distribution includes CPython 3.12.7, whose upstream license/history are
retained at `licenses/CPython.txt`. Bundled packages have their own licenses:
this notice does not replace those upstream notices. No interpreter source was
modified or vendored by iteration 5.

## Geographic data and product captures

- Campus representative points originate from **OpenStreetMap contributors**,
  ODbL 1.0, with the source identifiers, Mapcarta links and date retained in
  `_data/campus.yml`. Copyright and license:
  `https://www.openstreetmap.org/copyright`.
  The map and homepage product capture visibly attribute the data. The preview is
  an actual capture of this project’s point atlas, not a new basemap or photo.
- Retained globe coastline asset: **Natural Earth**, public domain. Official
  dataset repository: `https://github.com/nvkelso/natural-earth-vector`.
  Its README states public-domain status; the original globe asset is preserved,
  although it is no longer the fifth-round homepage’s main image.
- No new external photos, map tiles, geocoding service or font/image CDN was added.

## Design and development tools

**Hallmark 2.0.0**, commit `4f6a46c6dc325d40ab268c93e25c7b96676ebccd`,
MIT, Copyright (c) 2026 Hallmark contributors.
Source: `https://github.com/Nutlope/hallmark`.
Design rules, review scripts and scaffold informed the redesign; scaffold token
and base conventions were adapted. Its complete notice is retained at
`licenses/Hallmark-MIT.txt`. Tool installation and scratch outputs are not shipped
as website runtime code. No Hallmark sample theme, photo or logo was copied.

Playwright, axe, Jekyll, Rouge, Rollup and the existing build toolchain remain
under their own licenses and lockfiles. Prettier 3.6.2 (MIT) was invoked for source
formatting only; it is not a new runtime or project dependency. The npm lockfile’s
license metadata was inventoried during the fifth-round review; it does not
substitute for checking actual licenses when adding or copying resources.

## Iteration 6 research and learning additions

No new runtime or development package, font, icon, image, map/data source or
copied third-party implementation is added. The RSS/Atom teaching fixtures,
normalization code, note rendering and publication hook are original project
work. Browser XML/URL APIs and Ruby date/URI are platform/standard-library APIs.
Existing dependencies, license texts and asset attribution above remain intact.

The public BestBlogs reading note independently summarizes evidence at commit
`756ffbddf5cf4cd87e383a82b7c997563032e93f` and links upstream files. No BestBlogs
implementation, Prompt, DSL, image, OPML or article body is redistributed. Its
CLI/Skills declare MIT locally; no root-wide license was verified. See
`docs/iteration-6-compliance.md` and the retained seven research reports.

## Iteration 7 design reference

VoltAgent awesome-design-md, commit fcc70284932276d085f01ef9f83edde90b1258cb:
MIT, Copyright (c) 2026 VoltAgent. Full notice:
licenses/VoltAgent-awesome-design-md-MIT.txt. Used to study design documentation
and tonal/component principles; no brand UI implementation, proprietary font,
logo, photo or third-party mascot was incorporated. New styling is original;
the small Mote illustration already belongs to this project.

## Iteration 8 learning ecosystem

No new third-party package, source implementation, course material, font, icon,
image or map/data source is integrated. Learning routes, self-check prompts,
local journal/backup logic and tests are original project work using existing
notes/labs and platform APIs. Existing Mote and all license notices remain.
Environment setup restores the existing npm/Ruby development dependencies;
it does not add application dependencies. See docs/iteration-8-compliance.md.

## Iteration 9 Observatory

No new third-party dependency, font, image, icon, map dataset or source-code
implementation is incorporated. The directory links research publishers, public
institutions and news agencies; those materials retain their own rights. Only
bibliographic metadata and independently written short reading hints are used;
no news/report text, chart, dataset or brand asset is reproduced. Tutorials,
reading-list/export logic, styles and tests are original project work. Existing
Mote and all notices remain. See docs/iteration-9-compliance.md and
docs/OBSERVATORY_CONTENT.md for provenance and update/privacy boundaries.

## Iteration 10 public feed metadata

No runtime/development package, font, icon, image, map data or third-party source
implementation was added. The collector/parser, archive, UI, tests and local-note
logic are original project code using Python/Node/browser standard APIs and the
existing Actions toolchain. All earlier full license notices remain.

Public RSS/Atom publishers: arXiv, OpenAI, Hugging Face, Federal Reserve, Bank for
International Settlements, European Parliament and United Nations News. Their
titles, URLs and source-supplied dates retain the publishers' rights and terms;
they are not relicensed under this repository's code license. Attribution and
original links are retained. No article/report/abstract bodies, images, paywall
content or publisher UI is copied. The initial real snapshot includes one 403
and an empty arXiv feed; failure/empty results are disclosed, not bypassed.
See `_data/observatory_feeds.json` and docs/iteration-10-compliance.md.

## Iteration 11 focused reading

No dependency, font, icon, image, map data, third-party implementation or new feed
is integrated. Reading-room UI, native-dialog logic, local retrieval, outline
helpers, question sets and tests are original project work. The existing Mote and
lavender tokens are reused. Guide links refer to the existing independently written
AI/world reading-method notes and their already-attributed sources; no publisher
body, abstract, table or proprietary lesson is reproduced. See
docs/iteration-11-compliance.md. All earlier license notices remain.


## Iteration 12 review

Public discovery, homepage routes and project filters add no dependencies, copied
third-party code, fonts, images or external requests beyond existing resources.
Native search/magnifier implementation is original; the original local Mote is
reused. Existing licenses and notices remain. Details: docs/iteration-12-compliance.md.


## Iteration 13 review

Search refinement adds no dependencies, third-party snippets, fonts, icons or
external assets. Explicit technical aliases, native matching/highlighting and
controls are original project code. Existing Mote and full license texts remain.
See docs/iteration-13-compliance.md for resource and privacy boundaries.
