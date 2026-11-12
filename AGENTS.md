# Brook's Atlas

- Product: Brook’s Digital Universe, an open personal digital garden for learning,
  projects, creative work and future interests. Brook’s Atlas is its campus work.
- Public identity is Brook. Never expose private contact details, precise personal
  location, finances, schedules, private biography or secrets. Do not invent skills,
  projects, experience, usage figures or learning achievements.
- Keep Jekyll + Markdown + native JavaScript + CSS/SVG. No framework migration
  without a concrete need. Atlas shell is `_layouts/atlas.html`; metadata/navigation
  are in `_data/atlas.yml`; notes are in `_atlas_notes/`.
- Visual language: Obsidian Glass / lavender cyberpunk / playful geek; purple-black canvas, lavender
  accents, cartographic lines, generous spacing and distinct section layouts.
  Use global tokens; no green theme. Explore is a map-first app screen, with three
  glass depths only on isolated floating tools. Keep opaque fallbacks and lighter
  blur on mobile. Read docs/DESIGN_SYSTEM.md before visual changes. Motion uses 300–700ms opacity/transform,
  meaningful feedback and reduced-motion/touch fallbacks. Campus coordinates
  require explicit provenance; do not invent roads, building footprints or POIs. Support light/dark themes, keyboard
  operation and reduced motion. No decorative particle engines or fake counters.
- Treat models as models: pure-strategy Nash equilibrium is not social optimum;
  shallow raw-pointer ownership is unsafe; spherical Mercator scale is local;
  simulated AI flows must be labelled. Never simulate defined C++ results after UB.
- Python uses pinned Pyodide in a lazy Worker. Keep load/run errors, stop, timeout,
  capped output and environment limitations. Do not add backend secrets or services.
- Existing Chirpy posts/theme remain under the legacy blog routes. New home is
  Atlas; legacy preview paths redirect. Do not delete valuable existing features.
- Use `relative_url` for internal URLs and test both root and project baseurl.
  Keep deployment disabled unless the user explicitly authorizes publication.
  Never merge or force-push without authorization. Push review branches and PRs.
- Run `npm run build`, `npm test`, `npm run test:atlas`,
  `bundle exec jekyll build`, and internal HTMLProofer. Serve `_site` and run
  `npm run test:atlas:browser`; do not equate lint with browser verification.
- Check 390, 768 and 1440 px, both themes, interaction semantics, internal links,
  missing assets, keyboard navigation and no page-level overflow. Run actual Python
  smoke tests when CDN access is available; report any limitations precisely.
- Do not format Liquid templates with a generic HTML formatter: it can corrupt
  conditional attributes. Use clear manual formatting. Code uses single quotes
  and semicolons. Keep private/scratch material in ignored `work/`, excluded by Jekyll.
- `docs/DESIGN_SYSTEM.md`, `docs/ROADMAP.md`, and `docs/ATLAS-ITERATION-2.md`
  record the design, current status, and validation. Keep them consistent with code.

## Personal space and recurring compliance (Iteration 5 onward)

- Brook’s Digital Universe is an open personal space; GIS/AI/code are current
  interests, not permanent priority categories. Atlas is a retained campus work.
- Add tutorials to `_atlas_notes/`; projects to `_data/projects.yml`; homepage
  previews/build records to `_data/universe.yml`. Never invent learning progress,
  life events, private biography or project completion. Preserve /knowledge/ URLs.
- Every iteration must review new/changed dependencies, copied code, fonts, icons,
  images, maps/data and their actual licenses/provenance. Do not copy resources of
  unclear origin. Preserve copyright and required full license text. Update
  THIRD_PARTY_NOTICES.md and docs/iteration-N-compliance.md, even with no additions.

## Study content (Iteration 6)

- Existing notes without kind remain tutorials. Research uses kind: research,
  review_status: source_checked, a full source_commit, HTTPS source_repo, dated
  analyzed_at/reviewed_at, titled HTTPS sources and explicit ai_assisted boolean.
- source_checked means evidence cross-checking, not human/owner publication approval.
  Never write reviewed_by: Brook to describe an automated source audit.
- The Jekyll post_read hook removes published:false, draft:true and unverified
  research from every collection consumer/direct output, even with --unpublished.
  Checked research with incomplete provenance fails the build. Do not bypass this
  by publishing raw source or using --safe (which disables custom plugins).
- Keep lab_url optional; render no empty or fake experiment link. New categories
  and content kinds must remain searchable in Study and the retained Knowledge.
- Run npm run test:study:build as well as the existing suites after content model
  changes. The local research lab never fetches URLs, stores pasted text or calls
  AI; edits invalidate exported results, and output remains needs_review.

## Learning ecosystem (Iteration 8)

- Routes in `_data/learning_paths.yml` connect public notes, actual labs and
  scientific self-check questions. `_plugins/learning-path-validation.rb` runs
  after note publication filtering; keep both hooks and their real-build tests.
- Path/step IDs are permanent browser-record identifiers. Do not rename/remove
  them without an explicit versioned data migration and recovery tests.
- `/study/paths/` records only explicit checks and optional notes. Reading or
  visiting an experiment must not imply completion, mastery or personal history.
- Journal data uses only `brooks-universe.learning.v1` in localStorage. Never
  send it to a server, include it in a URL/repository or mix it with pasted RSS.
  Keep plain-text/local-storage limits visible; no cloud/encryption claims.
- Backups require bounded validation, preview and explicit merge; local entries
  win conflicts. Preserve unreadable raw storage. Blocked/quota/conflicting tabs
  must show memory-only status and retain export. Reset only this key after
  confirmation. New features must preserve theme and campus favorites.
- Run learning models/browser coverage with the existing suites. Verify no-JS
  reading, both themes, phone controls and storage/import failure states.

## Observatory (Iteration 9)

- Read docs/OBSERVATORY_CONTENT.md for source curation. The page is a dated
  directory/reading desk, not a live crawler, neutral-truth oracle or news archive.
- Separate original materials, institutional analysis and reporting. Keep versions,
  evidence limits and actual check dates; date changes require real verification.
  Distinguish forecasts, statistics, policy proposals, enacted texts and outcomes.
- Use stable document URLs and new IDs for different documents/versions. Preserve
  historical saved snapshots even when sources leave the current catalog.
- Only explicit selection creates brooks-universe.observatory.v1. Do not collect
  reading history, private answers, mastery scores or upload preferences. Keep it
  separate from the existing learning journal and campus favorites.
- Preserve blocked/corrupt/conflicting storage with memory-only feedback and export.
  Reset only this key with confirmation. Use safe text/HTTPS rendering; Markdown
  plans contain questions and blank reflections, never fabricated answers.
- New reading-method notes are tutorials, with AI-assistance disclosure and real
  sources. Do not invent lab_url for reading-only material or bypass research
  publication checks. Run Observatory models/browser and real-build catalog tests.
