# Brook's Atlas — implementation and validation

## Baseline and scope

The starting workspace was clean at `ae677a8` (Chirpy 7.6 template), matching remote
`master`. Previous Atlas commits mentioned in an old delivery screenshot were not
present locally or remotely. Brook explicitly ended recovery and authorized a
fresh implementation from the two briefs, prioritizing the first one.

This branch builds that authorized product on the existing Jekyll architecture.
It does not claim to recover the unavailable first implementation. The initial
isolated checkpoint is `32aa11a`; subsequent commits complete and verify it.

## Implemented

- Atlas root homepage with a vector orthographic globe and clickable lab entries.
- Explore → Geo/AI/Code, Projects, Knowledge, Playground and About.
- Responsive menu, dark/light themes, local theme preference, skip link, focus
  styling, keyboard-accessible code regions and reduced-motion behavior.
- Markdown note collection with four new lab tutorials, metadata, TOC, highlighted
  code, linked experiments, knowledge graph, search and category filters.
- Configurable prisoner/stag games, payoff matrices, pure equilibrium marking,
  welfare comparison, plus an editable generic 2×2 pure equilibrium explorer.
- Four-step C++ object/resource copying visualization, shallow/deep comparison,
  mutation, explicit A destruction and correct dangling-pointer warnings.
- Spherical Mercator local length/area scale with a labelled deterministic GIS × AI
  workflow. No real model invocation, GIS backend or personal location data.
- Python Playground using pinned Pyodide 0.27.7 in a lazy Worker. Three examples,
  real code execution, loading/error states, stop/reload, fresh execution globals,
  output cap and 5-second timeout. No runtime download on initial page load.
- Preserved legacy blog/posts at `/journal/` and original post routes, with a
  template-content notice. Old `/atlas/` preview paths redirect to the new routes.

## Build and hosting

Jekyll 4.4.1 / Ruby 3.3 were used locally in a Docker container because the executor
has no Ruby installation. The restricted environment blocked `index.rubygems.org`;
compatible gems were obtained from the allowed `rubygems.org` API/download service,
installed locally, then the complete graph was verified by Bundler. TLS validation
and the session proxy remained enabled. Temporary installation files are ignored.

Default `url`/`baseurl` describe the GitHub **project** Pages URL, not a user-root
site. Both project-path and empty-baseurl builds were tested. The existing nested
Pages starter workflow remains inactive. CI builds/tests only; no deployment was
enabled, dispatched, merged or executed.

Live site verification remains unavailable because the executor policy rejects
`brook-brook.github.io`. This is a network verification limit, not evidence that
the live site is down. The PR is the review/delivery artifact.

## Validation results

| Command / check | Actual outcome |
| --- | --- |
| `npm run build` | PASS, retained Chirpy CSS/JS assets build |
| `npm test` | PASS, ESLint and existing SCSS lint |
| `npm run test:atlas` | PASS, 6 model tests, including equilibrium/welfare, ties, matching pennies, Mercator and ownership |
| `bash tools/test.sh` | PASS, production Jekyll build + HTMLProofer; 36 files, 140 internal links |
| `npm run test:atlas:browser` | PASS, real Chromium, 15 Atlas pages × 3 viewport widths × 2 themes |
| `npm run test:atlas:python` | PASS, actual Pyodide in Chromium, three examples, exception, output cap, infinite-loop timeout, reload and stop |
| Empty-baseurl build and browser check | PASS, root-path configuration with all 15 pages and lab interactions |
| C++ deep-copy snippet compile/run | PASS, `g++ -std=c++17 -Wall -Wextra -pedantic -fsanitize=address`, then run; assertions before/after A destruction |

Browser checks include internal page/anchor links, local asset responses, JS errors,
page overflow, axe WCAG A/AA rules, menus/Escape, skip navigation, theme persistence,
search/empty state, payoff updates, C++ steps, latitude changes, Nash presets and
Python load failure/retry. No-JS navigation and all notes were also checked.
390px/768px/1440px screenshots were inspected for layout; screenshots stay in
ignored `work/`. Axe is automated coverage, not full screen-reader certification.

For deterministic Python QA in this restricted environment, Playwright routed
CDN requests to byte-for-byte official files downloaded from the pinned jsDelivr
release. This executes the real WebAssembly interpreter, not a fake runtime.
The ordinary test uses the live CDN when no `PYODIDE_FIXTURE` is supplied. Direct
first-load CDN behavior can still vary with a visitor's network; load failures and
retry are supported and tested.

## Known limits / next iteration

- No public-goods module, mixed-strategy solver, full C++ curriculum, real GIS
  Agent or unverified external project is claimed as complete.
- Python is the browser port, with a virtual filesystem and package/system limits.
  Fresh globals are created per run; this is not a full interpreter state reset.
- Original Chirpy demo routes retain their upstream libraries and external assets.
  Atlas pages use local CSS/JS/SVG; only Python requests an external runtime.
- No Lighthouse score, real-device profile or external-link reliability claim.
- Review and explicitly approve production publication separately.

See `ROADMAP.md`, `DESIGN_SYSTEM.md`, and root `AGENTS.md` for ongoing rules.

## Review visuals and resource footprint

- [Desktop homepage](screenshots/home-desktop.png)
- [Mobile homepage](screenshots/home-mobile.png)
- [Tablet homepage](screenshots/home-tablet.png)

Homepage CSS, theme/site scripts and globe total about 93 KB uncompressed
(about 31 KB gzip, excluding HTML and favicon). No font/tile/framework/runtime
request is required by the homepage. These are byte measurements, not measured
visitor load-time or Core Web Vitals claims.

## Follow-up: fix raw-source publication

Brook selected `feat/atlas-iteration-2` as the Pages branch and reported a plain
page showing YAML front matter. The corresponding Pages run `41442756275` only
checked out and uploaded files; it never ran Node or Jekyll. The inherited source
`.nojekyll` flag caused a raw-source static deployment.

The follow-up removes the source flag, adds `.github/workflows/pages.yml` with
Node + Jekyll + link checks, and validates the exact uploaded directory using
`tools/check-pages-build.mjs`. Only the generated site receives `.nojekyll`.
Source must be switched to GitHub Actions. Current tools cannot update the Pages
administration setting, so that one repository-setting step belongs to Brook.
Earlier statements about deployment being disabled describe the initial delivery;
this follow-up repairs the publication Brook has now initiated.
