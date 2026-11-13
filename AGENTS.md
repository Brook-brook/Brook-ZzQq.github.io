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

- Read docs/OBSERVATORY_CONTENT.md for source curation. Curated directory/briefings
  remain dated. The separate automatic stream collects public metadata, never
  implies verified news, neutral truth, complete coverage or a full-text archive.
- Separate original materials, institutional analysis and reporting. Keep versions,
  evidence limits and actual check dates; date changes require real verification.
  Distinguish forecasts, statistics, policy proposals, enacted texts and outcomes.
- Use stable document URLs and new IDs for different documents/versions. Preserve
  historical saved snapshots even when sources leave the current catalog.
- Only explicit selection/import creates brooks-universe.observatory.v1. Optional
  typed reflections stay local. Do not collect reading history, mastery scores
  or upload notes/preferences. Keep it
  separate from the existing learning journal and campus favorites.
- Preserve blocked/corrupt/conflicting storage with memory-only feedback and export.
  Reset only this key with confirmation. Use safe text/HTTPS rendering; Markdown
  plans contain questions and only the learner's actual optional reflections,
  never fabricated answers.
- New reading-method notes are tutorials, with AI-assistance disclosure and real
  sources. Do not invent lab_url for reading-only material or bypass research
  publication checks. Run Observatory models/browser and real-build catalog tests.

## Continuous Observatory (Iteration 10)

- `_data/observatory_feeds.json` is the trusted source/host registry. Collector
  reads bounded RSS/Atom bibliographic fields only; keep allowlisted HTTPS,
  manual redirects, deadlines, size/item bounds, ETag/304 and Retry-After handling.
- `observatory-ops` runs collection; `observatory-data` retains public daily
  metadata, revisions and health only. Archive days and displayed dates use
  Asia/Shanghai. Do not put notes, secrets, article bodies or website deploys there.
- A native Actions cron on a non-default branch is inactive. Do not claim it is
  enabled. The confirmed recurring trigger uses a separate automation to update
  only ops `_data/observatory_trigger.json` with a current SHA. Check/maintain the
  real enabled task; avoid duplicate schedulers. Production remains unchanged.
- Frontend polls public status every five visible minutes, preserves old content
  on failures and waits for explicit apply before replacing an existing snapshot.
  Automatic titles stay needs_review, distinct from source_checked research.
- Physical reading key remains v1; schema v2 adds update snapshots and optional
  max-2,000-character reflections. Read v1 in memory without automatic rewrites.
  Keep max60/2MiB, strict validation, previewed import/local-note priority, safe
  text, original snapshots, blocked/quota/multi-tab recovery and usable exports.
- Run collector/stream models and browser suites with the prior regressions. Test
  actual data collection on Actions separately from deterministic HTTP fixtures;
  do not call fixture tests proof of public-source availability.

## Focused reading (Iteration 11)

- Native dialog enhances Observe; original anchors/desk and three public guides
  remain the no-JS/unsupported-dialog fallback. Keep published-method references
  checked in the real Jekyll hook, distinct from source/news verification.
- The reading room uses the existing controller's state, write guard and exports.
  Do not create another store/key/schema, record a visit or infer mastery. Opening
  an existing v1/v2 snapshot must not write or replace its original metadata.
- Guide insertion appends bounded prompts only, preserves earlier text and detects
  an existing outline marker. Never truncate a note or fabricate a learner answer.
- Local title/version/question/note retrieval and side-by-side evidence reading
  never fetch private text. Different domains do not establish independent evidence.
- Native focus trapping, Escape/close restoration, phone layout, reduced motion,
  modal-visible storage failure and real modal downloads require browser coverage.
  Keep the outside desk synchronized without rebuilding the invoker on dialog close.

## Public discovery (Iteration 12)

- Search generator runs after publication filtering and indexes public metadata
  only: notes, real learning routes/labs, truthful projects and curated page entries.
  Never index draft/unverified research, document bodies, dynamic news, private
  browser notes or legacy template-post bodies. Rebuild removes demoted entries.
- `/search/` remains a complete no-JS directory. Dialog index is lazy, size/time
  bounded and baseurl-scoped; render text safely, expose failure/retry and preserve
  native anchor fallback. Queries have no URL/storage/server history.
- Keep shortcuts out of editors and other dialogs; trap keyboard focus, restore
  the invoker, close on navigation and reveal same-page filtered project targets.
  Run search models, real publication builds and browser tests at both basepaths.
- Home route counts mean self-check questions, never completion. Project filters
  preserve available/review/planned states and never add controls to planned work.


## Search refinement (Iteration 13)

- Alternative spellings are explicit technical aliases, not inferred semantic
  relationships, typo correction or a source-verification claim. Keep AND matching,
  short Latin word boundaries and stable/literal-title priority covered by models.
- Highlight original strings with text nodes/mark only; preserve Unicode graphemes
  and literal markup. Keyword context must come from bounded public metadata.
  Keep inline text flow for marked links, visible-space and stable-sheet regressions.
- Type counts describe matches for the current query before type selection. More
  adds eight results locally and focuses the first new link; query/type changes
  reset the batch. Empty-state recovery must preserve the query unless explicitly
  cleared. Never put queries in a URL, storage, requests or a second index/store.
- During composition, defer result changes and preserve candidate navigation/Esc.
  Test DOM composition events separately from actual OS/phone IME claims. Keep
  no-JS directory, dialog fallback, rapid close and private-editor shortcuts intact.


## Evaluation workbench (Iteration 14)

- evaluation_samples.json is original synthetic teaching data, not model output,
  probability, campus data or real performance. Preserve its v1 identity; client
  and real-build checks require 20 unique samples and the declared class counts.
- Binary evaluation uses score >= threshold. Display absent denominators as null/
  undefined, distinct from zero; F1 uses 2TP/(2TP+FP+FN). A constant-negative
  baseline has no threshold or substituted source-score rows in its report.
- Lab parameters are memory-only. Export full public synthetic samples/parameters
  only after a click, never private notes/preferences. Tuning this fixture is not
  independent testing; preserve clear scope and reference links.
- Keep range keyboard operation, matrix/row filters, accessible horizontally
  scrollable sample tables, no-JS defaults and actual JSON downloads tested.

## Spatial validation workbench (Iteration 15)

- spatial_samples.json is the original 80-point planar v1 fixture, four blocks of
  20; synthetic-m is not geographic coordinates, a CRS or a real campus dataset.
  Client/real-build validation must keep bounded coordinates, IDs, labels and blocks.
- Uniform Euclidean kNN reads only query coordinates and training labels; scoring
  reads test labels after prediction. Distance ties use ASCII IDs. Vote share is
  not calibrated probability. Preserve the independent reference/label-isolation tests.
- Compare one seeded random holdout and one block holdout, both 60/20. Do not call
  this full cross-validation or universally rank methods. Show class composition,
  nearest-training coverage distance, undefined denominators and deployment limits.
- Parameter edits keep applied results visible, require explicit rerun and disable
  stale export. Export only complete public data/parameters/splits/neighbors on click.
  No private storage reads or uploads. Keep no-JS source and keyboard tables.
- New route IDs extend, never rename the original nine learning steps. Old v1
  backups must remain readable without automatic rewrite; no inferred completion.

## Self-explanation practice and recovery (Iteration 16)

- Paths and /study/practice/ render the same learning-workspace include, all 15
  permanent steps and the existing v1 controller/key. Never derive the allowed ID
  set from only visible/filtered steps or create another journal/preferences store.
- Practice pins the current worksheet while filtering/typing; only explicit select,
  next or public hash navigation changes the question. Explicit choices replace only
  the public step fragment, so lab/back/reload restores context without a new journal
  or visit history. Query stays in memory, IME
  composition defers filtering, and private note text never enters public search.
- Public hints/references/counterexamples are original, AI-assistance-disclosed,
  tied exactly to public route steps by a real Jekyll hook after publication/route
  validation. They never grade, infer mastery or auto-check a step. No-JS keeps all
  questions, references and true resources readable with unavailable controls hidden.
- The shared data-free learning:render event synchronizes the view, not another
  state/store. Initial render, hints and navigation must not rewrite old v1 data.
- Clear checks current raw storage before deletion. On conflict/get/remove errors,
  preserve in-memory drafts, original raw data and export. Unknown raw storage can
  be downloaded explicitly in a JSON-escaped diagnostic .txt envelope, separate
  from importable backups; preserve unpaired UTF-16. Never silently repair/upload.
- Keep original-nine and previous-twelve backup coverage, real paths/practice tab
  conflicts, failure recovery/downloads, literal text, keyboard focus, hash/back,
  reduced motion, small/short viewports and no-JS tests. Reference text is a method,
  not factual verification of current news, actual AI performance or a learner.

## Local Tool Calling (Iteration 17)

- `/playground/tool-calling/` uses a script proposal and fixed explanation template,
  with real native find/distance/radius execution on the existing sourced campus
  catalog. Never describe it as an LLM, autonomous Agent or MCP implementation.
- Keep exact bounded fields/types/allowlist, explicit validation/execution/return,
  call-ID/tool correlation and this small deterministic tool's recomputation guard.
  Editing invalidates downstream state and export. No arbitrary URL, command,
  private-storage read, permission escalation or text execution.
- A spherical mean-radius arc over WGS84 representative coordinates is not an
  ellipsoid geodesic, route or entrance distance. Radius uses raw inclusive values,
  excludes center ID only, and searches catalog coverage only. Preserve source
  date/ODbL; do not imply newly verified point data.
- Explicit exports contain every field needed to replay all three public tools,
  source provenance and honest script/template labels, never journal material.
  Parameters stay in page memory. Preserve the earlier fifteen permanent step IDs
  as the journal extends to eighteen, with a real legacy-15 resume/export test.

## Public knowledge connections (Iteration 18)

- `_data/knowledge_connections.yml` contains explicitly authored, AI-assistance-
  disclosed preparation/extension/comparison suggestions with reasons, not inferred
  semantic edges, strict prerequisites, mastery or personalized recommendations.
- The post_read hook runs after publication/route checks and derives public
  metadata only. Private/missing endpoints, duplicates, unsafe URLs and unbounded
  fields fail the real build. Do not include note bodies, browser records or new
  progress fields. Keep --unpublished and demotion/cleanup build cases.
- `/knowledge/` retains the complete note directory/filter and five original SVG
  destinations. Full connection directory and graph work without JS; invalid
  models leave the native fallback open. Keep diagram text at 14 effective pixels
  using a labelled keyboard-scrollable canvas on phone.
- New selection writes only a public note fragment, preserving history.state;
  no private storage reads/writes, visits or inferred completion. The older note
  directory's URL-backed filters remain distinct from global private-query search.
  Keep complete title links, explicit empty/type recovery, native select focus,
  actual note/lab/practice links and reduced-motion cancellation tested.

## Public-goods incentives and contextual return (Iteration 19)

- `/playground/public-goods/` is an original one-round linear points model, not
  real participants, empirical cooperation, money or policy prediction. Keep
  `u_i=w-c_i+(m/n)sum(c)` and sum objective `nw+(m-1)sum(c)` distinct from fairness.
- Classify integer multiplier tenths exactly: m<n/all-zero Nash, m=n/every pure
  profile Nash, m>n/all-full Nash. Independently, m<1/all-zero sum optimum,
  m=1/every profile sum optimal, m>1/all-full sum optimum. Do not confuse m=1
  with m=n. Test every player's deviation holding all others fixed.
- The optional 2×2 table is only P1/P2 endpoint actions with other contributions
  fixed. Never label it the full n-player game or infer all-player equilibrium
  from that slice. Export complete public parameters/assumptions/results only on
  click; no journal read, network service, private history or automatic saving.
- Keep adjacent contribution/payoff feedback, readable small-screen ledger,
  native ranges/selects, no-JS definitions and reduced-motion fallbacks. Reject
  malformed/sparse/out-of-bound parameters and pause export rather than coerce.
- Append the two new IDs after the prior eighteen; preserve legacy-18 raw backup
  on initial rendering and an explicit append/export roundtrip on both worksheets.
- Note-to-Knowledge fragments have real server-rendered row IDs without JS.
  Enhanced direct/hash navigation selects and focuses the relevant note; native
  selects keep focus and back-forward restoration remains the browser's job.
- Scope search-toggle SVG geometry so earlier article SVG rules cannot enlarge
  the icon, add figure margins or wrap the search label. Keep real header tests.

## AI / Agent foundations (Iteration 20)

- `/study/ai/` is a native curriculum using the two appended public routes and
  five original source-grounded notes. Optional step.focus is bounded nonempty
  public text (400 characters), escaped on output. Do not duplicate article
  summaries when the same article has different learning focuses.
- Preserve the twenty earlier IDs; the eight appended questions bring the same
  v1 journal to 28. No tracking, automatic prerequisites/completion, new private
  store or generated grading. Keep old20 raw opening/export/explicit extension
  on both paths/practice and no-JS curriculum reading.
- Explain LLM/token/context, API/SDK, schema and task correctness separately.
  RAG is not a universal truth guarantee or mandatory vector DB; source/title
  collection is not verification. Model turns, tool calls, token budgets and
  transport/end-to-end deadlines are different quantities.
- The downloadable Python example runs only in a reader's own local/server
  environment. Never add a public key field or execute credentials in Pages.
  Its verified interface is openai 3.50.0; test using the real SDK and a fake
  in-memory transport (`python tests/ai-request-offline.py` after installation).
  Never label those fixtures live model responses or schema/capability evidence.
- Keep official reference versions, actual licenses and AI-assistance disclosure.
  Do not copy course images/corpora, model-judge percentages or hidden reasoning.
  Review local/model-visible/persisted context and tracing boundaries explicitly.
- The header brand uses its native visible name and an sr-only home suffix;
  the compact text is accessible when displayed. Do not override visible text
  with a different aria-label. Test label-content-name-mismatch at all widths.
- Keep test imports from creating bytecode beside public Python downloads.
  Artifact validation must reject __pycache__, .venv and .pyc recursively while
  allowing intended .py examples. Never commit or publish a local test venv.
