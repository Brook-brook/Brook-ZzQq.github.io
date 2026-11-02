# Iteration 5: product and implementation audit

Date: 2026-11-02. Clean starting point: `feat/atlas-iteration-4` at `4d32f15`.
Fourth-round changes are committed/pushed; PR #3 targets the still-unmerged third
round. Fifth-round branch is `feat/atlas-iteration-5`, not main or production.

## Current inventory

Jekyll + YAML + Markdown + native JavaScript/SVG. No framework migration needed.
Home still presents GIS/AI/code as fixed primary fields; its globe and campus copy
narrow the site’s long-term identity. Explore is a complete six-point campus app,
not a basemap, with search, filters, favorites, layers, keyboard and session state.
Four real Markdown laboratory tutorials use `atlas_notes`, with retained
`/knowledge/:name/` URLs. Knowledge has working search/categories and a relation
map; **there is no Study route yet**. Projects contains four hardcoded entries,
including a truthful future-plan entry. About states interests, not verified
professional achievements. No personal growth/learning-progress dataset exists.
The old Chirpy blog is explicitly retained demo content, not Brook’s biography.

Fourth-round shared Obsidian tokens/glass/motion and all labs are reusable.
Hallmark 2.0.0 is installed in `.agents/skills/hallmark`; actual rendered audit,
brand scaffold and independent review outputs exist in the iteration-4 report.
Fifth-round baseline renders cover Home, Projects and retained Knowledge.
The active Pages workflow still publishes feature-2 only. It will not be changed.

## Product correction

The site is Brook’s open-ended personal digital space. A current GIS focus does
not establish a permanent hierarchy of interests. Home should connect learning,
working experiments, projects and real development notes. Campus is one featured
work, not the homepage’s sole visual or the brand definition. There is no basis
for invented study streaks, percentages, accomplishments or autobiographical posts.

## Plan and file scope

- New Home: personal introduction, a real-content learning preview, featured campus
  work alongside other implemented experiments, actual latest study entries, and
  source-backed website build records. No fake terminal or decorative starfield.
- New `/study/`: searchable/filterable collection index, clear tutorial status,
  actual reading/experiment links. Preserve `/knowledge/` and every article URL.
- Projects: YAML records plus a shared renderer; optional metadata and native
  disclosures accommodate different work, implemented/review/planned states.
- Shared brand and shell reflect Brook’s Digital Universe while keeping Atlas as
  the campus/project identity. Keep fourth-round tokens, all map functionality,
  the old blog and existing public links.
- Sustainable content: use existing Markdown notes, `_data/projects.yml` and
  `_data/universe.yml` / build records. Do not introduce a CMS or empty Growth page.
- Add `THIRD_PARTY_NOTICES.md` and `docs/iteration-5-compliance.md`; verify actual
  license sources and asset provenance, preserve required texts, and put recurring
  compliance checks in project instructions.

Edit: Home, Projects, shared layout/navigation, selected About copy, documentation
and review-only CI artifact naming. Create: Study, reusable includes/data, scoped
Universe styles/scripts/tests, notices. Delete: no routes or valuable functions.
No Pages source, deploy workflow, production branch, URL or baseurl modification.

## Acceptance

Build with Jekyll; check all internal links/assets and both root/project prefixes.
Run existing model/browser/real Python checks plus new Home/Study/project flows.
Actual Chromium desktop and phone renders, before/after comparison and one
screenshot-driven correction; Hallmark rendered sweep and independent review.
Verify search, category empty/reset, project disclosure, navigation, reduced motion,
keyboard/no-JS, optional light theme, all Explore functions and truthful status.
Record exact outcomes and limitations. Commit, push, and open a PR based on the
fourth-round branch; do not merge or deploy it.
