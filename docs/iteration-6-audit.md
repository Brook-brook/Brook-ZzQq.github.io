# Iteration 6 audit

Date: 2026-11-04 (Asia/Shanghai).

## Actual starting point

Clean working tree at research commit `3d49c7f`, extending fifth-round `a4b24a6`.
Both remote branches exist; neither is assumed deployed. New branch:
`feat/atlas-iteration-6`. PR base: `docs/bestblogs-research`, keeping research
and product changes separately reviewable. Keep Jekyll, native JS/CSS/SVG,
Obsidian Glass, navigation, Pages workflow, URL and baseurl.

## Findings and chosen scope

1. Study hardcodes tutorial labels and experiment links. Research needs provenance
   and optional lab links, without breaking existing tutorial defaults.
2. Home, Knowledge, previews, sitemap and direct article routes consume the same
   collection. Gate unpublished research before generation, including stale output
   cleanup; list filtering alone is insufficient.
3. Search supports one category group. Add content type, intersection filtering,
   shareable URLs and reset while preserving keyboard/no-JS behavior.
4. Publicly readable research should link fixed evidence and the full reports,
   preserving the distinction between source checks and owner publication approval.
5. A local editable RSS/Atom experiment makes the research learning path runnable,
   without network fetching, AI scores, credentials, storage or automatic publishing.

## Planned files and preservation

Atlas layout, Study/notebook includes, Home/Knowledge, content records, new source
notes, isolated research lab assets, small Jekyll publication hook, tests and docs.
Keep maps, Python/other labs, legacy article routes, project honesty and privacy.

Existing pages retain their locked system, not a full Hallmark redesign. New lab:
app-screen scope, editable source, visible row decisions and inspectable JSON.
No marketing hero, new theme, decorative metrics or fake AI controls.

Validate 390/768/1440, both themes, actual screenshots, long identifiers, focus,
reduced motion, no JS, stale/error/empty lab states, publication fixtures, root
and project paths. Review licensing even without new dependencies or assets.
