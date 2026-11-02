# Iteration 5 open-source resource review

Reviewed 2026-11-02. This is a source/provenance inventory, not a claim that every
transitive upstream distribution has been independently legally audited.

## New and changed resources

| Resource | Action | Evidence and handling |
| --- | --- | --- |
| Runtime dependencies | None added, removed or upgraded | `package.json` / lockfile dependency sets unchanged; only test commands change |
| Hallmark design/scaffold | Continued use of installed 2.0.0 | Actual repository LICENSE read: MIT, 2026 Hallmark contributors; complete text added to `licenses/Hallmark-MIT.txt` for adapted token/base conventions |
| Home campus preview and social card | New project screenshots | Captured the real local map with its existing six points, plus the actual Home for the social card; visible OSM/ODbL attribution on Home; complete map gains always-visible attribution, previously inside data notes |
| UI code and content | Project-authored YAML/includes/native JS/CSS | No copied theme demo, third-party illustration, icon pack, photo or font binary |
| Existing SVG icons/Mote | Retained | Project files from preceding iterations; no new third-party art imported |
| Existing campus data | Unchanged | `_data/campus.yml` retains WGS84 points, six OSM IDs, Mapcarta URLs, checked date and ODbL; no inferred coordinates or geography |
| Existing Natural Earth globe | File retained, Home emphasis removed | Official `nvkelso/natural-earth-vector` README fetched and read: public-domain data. Terms website blocked by network policy; no claim to have opened it |
| Bootstrap/Popper/Chirpy | Retained | Read package/repository licenses, preserved original MIT copyrights and complete texts |
| Pyodide | Retained pinned lazy CDN runtime | Fetched 0.27.7 repository LICENSE (MPL 2.0); fixture lock records CPython 3.12.7; fetched that exact CPython license. Added texts/source links, no runtime source modification |
| Legacy fonts / Font Awesome | Retained external references | Read official Lato OFL, Adobe Source Sans OFL and Font Awesome Free license bundle; preserved copies. New UI uses system fonts and original SVG icons |
| Prettier formatter | Development tool only | `npm view prettier@3.6.2 license --json` returned MIT; no code/asset redistribution or new package dependency |

## Sources actually checked

- Local `LICENSE`, `jekyll-theme-chirpy.gemspec`, installed Bootstrap and Popper
  LICENSE files; pinned chirpy-static-assets repository LICENSE.
- `https://raw.githubusercontent.com/Nutlope/hallmark/4f6a46c6dc325d40ab268c93e25c7b96676ebccd/LICENSE`
  (read from the matching local clone).
- `https://raw.githubusercontent.com/pyodide/pyodide/0.27.7/LICENSE`
- `https://raw.githubusercontent.com/python/cpython/v3.12.7/LICENSE`
- `https://raw.githubusercontent.com/google/fonts/main/ofl/lato/OFL.txt`
- `https://raw.githubusercontent.com/adobe-fonts/source-sans/release/LICENSE.md`
- `https://raw.githubusercontent.com/FortAwesome/Font-Awesome/7.x/LICENSE.txt`
- `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/README.md`
- Official OSM website repository `config/locales/en.yml` copyright/licensing
  text, which names the Open Data Commons Open Database License. Original source
  IDs and attribution links remain public; the homepage capture creates no new
  geographic database or uncredited map layer.

## Package metadata inventory

The unchanged npm lockfile contains 848 package records. Metadata reports MIT,
ISC, Apache, BSD, MPL, OFL-adjacent/CC and other grants; it is a metadata scan,
not an invented “all MIT” verdict. Two records omit the license field:
`npm/node_modules/qrcode-terminal` and `svg-tags`. Their actual installed LICENSE
files were opened: Apache 2.0 and MIT respectively. Both are existing development
transitives, not new website resources. Existing Jekyll/legacy CDN dependency
references remain unchanged; this iteration does not vendor their code. Their
actual CDN license files were also fetched: tocbot 4.36.8, search 1.10.0, Mermaid
11.17.2, Day.js 1.11.23, GLightbox 3.3.1, loading polyfill 2.1.1 and Clipboard.js
2.0.11 are MIT; MathJax 4.1.3 is Apache 2.0. Exact upstream copyright/grant texts
are preserved in licenses/Legacy-*.txt. Versions are the response-header alias
resolutions at review time, not a claim to pin or change the old configuration.

## Recurring process

`AGENTS.md` now requires a per-iteration resource review, provenance/license checks
before copying, retained copyright/full grants when needed, updated notices and a
`docs/iteration-N-compliance.md` record even when no resources are added.
Future content can add new subjects without adding external dependencies.
