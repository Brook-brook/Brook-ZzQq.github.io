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


## Iteration 14 review

Original synthetic evaluation data, native calculation/SVG and UI add no packages,
fonts, images or copied third-party implementation. Scikit-learn's official docs
and COPYING were read at commit 7b2b14e0a89eedfa514dc9885e35a0ecade20cd0
(BSD-3-Clause, 2007–2026 developers); concepts/formulas are cited, no code, figures
or documentation files are redistributed and the library is not loaded. Existing
Mote and full project notices remain. See docs/iteration-14-compliance.md.

## Iteration 15 review

Spatial kNN, the 80-point synthetic fixture, planar SVG, validation and new learning
route are original work; no dependency, map asset, font or icon is added. Concepts
were checked in scikit-learn's BSD-3-Clause documentation at
7b2b14e0a89eedfa514dc9885e35a0ecade20cd0 and mlr3spatiotempcv's README/FAQ at
f97b5b0ef4e6b480a861fe0d724307313579e417 (LICENSE.md actually read: LGPL v3).
No source code, image, documentation file or library from either project is
redistributed or linked at runtime. Existing full notices/Mote remain. See
docs/iteration-15-compliance.md for actual source, synthetic-data and privacy scope.

## Iteration 16 review

The practice workspace, local literal filtering, original teaching prompts,
recovery changes and tests add no project dependencies, fonts, images, map data or
external model service. Existing full notices, Mote and permanent journal IDs remain.
Methods refer to the already-attributed public notes; no news body or course is copied.

Hallmark 2.0.0 was read/run at 04977e15f3dfd6ee4b74c887dac3eb52665d6c92;
its actual MIT LICENSE was reviewed and the existing licenses/Hallmark-MIT.txt
remains. A transient ignored puppeteer-core25.17.0 tool (Apache-2.0 package metadata)
ran the local browser audit only; it is not a repository/site dependency or asset.
No Hallmark theme/photo/logo or upstream implementation is redistributed.
See docs/iteration-16-compliance.md for exact scope, storage/privacy and test limits.

## Iteration 17 review

Original tool contracts, native computation/UI, teaching examples and tests add no
dependency, image, font, icon or model service. Campus OSM representative data is
reused unchanged with ODbL attribution and the original 2026-11-02 check date.

MCP's official 2025-11-25 Tools/Architecture specifications and actual LICENSE were
read at modelcontextprotocol/modelcontextprotocol commit
06e923405df3df242f1471b9300d9db90ebd10fd. That LICENSE describes a MIT-to-Apache-2.0
transition, remaining MIT contributions and CC-BY-4.0 for non-spec documentation;
this notice does not flatten its mixed licensing into a single MIT claim. Only
independent conceptual explanation with pinned references is added; no upstream
code, diagrams, sample messages or library are copied or loaded. Existing full
licenses, Mote and the previously installed ignored Hallmark tool remain.
See docs/iteration-17-compliance.md.

## Iteration 18 review

Knowledge's original editorial connections, public metadata validation, native
selection and scoped styles add no dependency, copied code, external font, image,
icon or new map data. Existing Mote, original conceptual SVG and every earlier
license/attribution remain. Hallmark's already-reviewed pinned tooling is reused
only for the actual local design audit. Relations are AI-assisted reading
suggestions based on the existing public tutorials, not newly verified news,
empirical evidence, private journals or inferred personal progress.
See docs/iteration-18-compliance.md.

## Iteration 19 review

The public-goods model, native UI, mathematical examples, guide and tests are
original, AI-assisted work. No runtime package, image, font, icon, map point or
external execution service is added. Existing attribution and licenses remain.

Actually read the public-goods tutorial and full LICENSE at `oTree-org/otree-docs`
commit `47bb7435ef39f1f356afe22f29ab232ed71fbf69` as a conceptual mechanism
reference. No oTree source code, diagram, runtime or human experiment is used.
Its MIT-style permission grant also contains an undertaking to name/cite the
authors in publications of experiments conducted with the software. This notice
does not describe it as unqualified MIT. The complete actual text is preserved
in [licenses/oTree-docs-LICENSE.txt](licenses/oTree-docs-LICENSE.txt), including
the upstream copyright names and publication reference.

Reference: Chen, Daniel L., Martin Schonger, and Chris Wickens. 2016. “oTree: An
open-source platform for laboratory, online, and field experiments.” Journal of
Behavioral and Experimental Finance 9: 88–97. Only the contribution/multiplier/
equal-return mechanism is compared; the 4-player / 20-point / 1.6 example is ours,
not a reported experiment or empirical result. See docs/iteration-19-compliance.md.

## Iteration 20 AI / Agent foundations

Five Chinese foundation lessons, eight questions, reading focuses/connections,
the native curriculum and injectable Python request example are original,
AI-assisted work. No course prose, code, picture, embedding corpus, model output,
font or icon is copied. The website adds no SDK/runtime dependency or model call.

Actually read official documents and full licenses at these immutable commits:

- Hugging Face Agents Course `9b3d6b3887bc489510da0239d4c1bc1ee23fd40f` — Apache-2.0;
  full text: [HuggingFace-Agents-Course-LICENSE.txt](licenses/HuggingFace-Agents-Course-LICENSE.txt).
- Transformers `e18fcb1b8e2b8f597269887ccf4c5fea1e8f493d` — Apache-2.0;
  full text: [Transformers-LICENSE.txt](licenses/Transformers-LICENSE.txt).
- OpenAI Python `59738a289ee82c7b86bf1e10230cceb6daa9716d` — Apache-2.0 with the
  actual 2026 OpenAI notice; [OpenAI-Python-LICENSE.txt](licenses/OpenAI-Python-LICENSE.txt).
- OpenAI Agents SDK `64fbde5d02b42ae5f9db668eb0184cdb3fc9d775` — MIT;
  [OpenAI-Agents-SDK-LICENSE.txt](licenses/OpenAI-Agents-SDK-LICENSE.txt).
- Anthropic Claude cookbooks `ce8b2629efe8b24048b127b4c79af1e9cbab93d4` — MIT;
  [Claude-Cookbooks-LICENSE.txt](licenses/Claude-Cookbooks-LICENSE.txt).

An ignored local test venv installs OpenAI 3.50.0 and dependencies only to test
the real SDK against in-memory fake HTTP responses. No package is redistributed
or added to the site. Actual installed license metadata and the precise source/
testing limits are recorded in docs/ai-foundations-source-review.md and
docs/iteration-20-compliance.md. Existing Hallmark/asset licenses remain intact.

## Iteration 21 bounded loop and local SDK extension

The script-driven runtime model/UI, original Python loop, exercises and tests
are AI-assisted work. No source implementation, course output, icon, font, image
or new runtime package is copied. The exact existing six-point WGS84 catalog and
ODbL provenance/check date are reused, not independently refreshed.

The additional SDK function-call, input/output and includable-type documents were
read at the same pinned OpenAI Python commit above. Its full Apache-2.0 license
and all earlier reference licenses remain. Real SDK 3.50.0 is installed only in
an ignored offline-test environment. Fake in-memory responses do not demonstrate
live model performance, and no SDK/venv/bytecode is redistributed with the site.
See [iteration-21-compliance.md](docs/iteration-21-compliance.md).

## Iteration 22 literal retrieval and complete evidence

The fictional manual corpus, public task annotations, retrieval/context model,
interface and tests are original AI-assisted teaching work. No article body,
embedding corpus, model output, runtime package, font, icon or picture is copied.
The pinned Claude cookbooks evaluation README above was reread for the separation
of retrieval and end-to-end evaluation only; its complete MIT notice remains.
No upstream API experiment or performance result is reproduced. Existing brand,
Mote, source licenses and all earlier notices remain. See
[iteration-22-compliance.md](docs/iteration-22-compliance.md).
