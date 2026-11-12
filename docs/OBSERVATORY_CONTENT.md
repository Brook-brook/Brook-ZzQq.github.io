# Observatory curation and reading snapshots

The `/observatory/` page combines a dated curated directory/briefings, a separate
automatic bibliography and a private local learning desk. It does not score
authority, run a model, verify news automatically or copy article bodies.
`_data/observatory.yml` owns its sources, four current briefings and starter lists.
New original reading-method tutorials live in the existing `_atlas_notes/` collection.

## Curation contract

Keep the current three topics (`ai`, `economy`, `politics`) and three source kinds
(`primary`, `analysis`, `reporting`) consistent with the client model and filters.
Primary materials establish what their publisher says; independent confirmation,
representativeness and causality require separate evidence. Corporate research,
preprints, forecasts, institutional positions and journalism need distinct caveats.
Do not replace this with invented trust scores or an approval badge.

Each source has a unique `id`, title, publisher, topic, kind, language, absolute
credential-free HTTPS URL, summary, reading focus, caveat and question. A briefing
has its own immutable ID, title, source_id, topic, exact document URL, visible
version/date, short independently written summary, caveat and question. It must
refer to a real source in the same topic. Starter lists reference actual source IDs.
The build hook rejects invalid dates/IDs/links/references before writing output.

When refreshing:

1. Open the primary destination and verify title, publisher, URL and visible version.
   A search snippet is a discovery clue, not proof of having read the document.
2. Prefer stable paper versions and dated documents. Keep dynamic collection URLs
   for source entries; identify their role as update entrances. Locate legal-text
   versions and amendments explicitly rather than claiming current legal advice.
3. Write original short reading hints and limitations. Do not reproduce full news,
   reports, abstracts, charts or proprietary material. Check licenses again before
   importing anything beyond links and independent commentary.
4. Update `checked_on` only after actual checks, using Asia/Shanghai's date. This is
   a directory check, not the publication date, event time or an owner approval.
   Record access restrictions and choose verified alternatives where possible.
5. Do not reuse an ID for a different document/version. New materials get new IDs;
   remove/replace featured items without mutating visitors' saved snapshots.
6. Run the real build/link/model/browser suites and update notices/compliance.

The first curation is dated 2026-11-12. Research used the connected web tool;
shell access is separately restricted by this environment and is not claimed as
an unrestricted crawler. BIS's old path failed; its current `/publications/qr`
was checked. AP uses `/world-news`. UN's JS-only portal was replaced with its
library research guide. IMF's dated public page was readable although the
particular eLibrary URL returned 403. Current sources are independently listed
in the YAML; access can later change by location, subscription or site revision.

## Persistence and privacy

Only an explicit toggle, starter or confirmed import creates `brooks-universe.observatory.v1`.
The physical storage key remains unchanged; schema v2 is
`{version: 2, saved: [snapshot, ...]}`. Each snapshot preserves `id`, title, HTTPS
url, topic, item_type (`source`, `briefing` or `update`), version, checked_on,
question, caveat and optional `reflection`. A v1 list is validated and migrated
in memory with blank reflections; only an explicit edit/import writes v2.
Automatic update snapshots retain the source-publication day and metadata revision
number; checked_on is labelled first collection day, never a manual source check.
Opening links or the page does not create reading history, completion or scores.

Validation limits the list to 60 unique records and 2 MiB of UTF-8 JSON, with
individual field bounds, strict shape/date checks and credential-free HTTPS URLs.
Past items no longer in the catalog remain usable/exportable, labelled historical.
Render strings as text and validate links; never render a stored title as HTML.

Blocked/corrupt/quota-limited storage and multi-tab changes preserve page memory
and export without claiming durable saving. Corrupt raw data stays untouched.
Button-adjacent text makes memory-only status visible where selection occurs.
Clearing needs native confirmation and removes only this key; theme, campus
favorites and the separate learning journal remain. Removing an item with a
nonempty reflection also requires confirmation. There is no account or sync.

Export produces Markdown with the saved URLs, versions, check dates, original
reading questions/caveats and only the learner's actual optional reflections,
with blank evidence prompts. It never fills in invented facts or answers. JSON
backup restores exact snapshots/notes through size/schema validation, preview and
explicit merge. Local nonempty notes win; identical URL/version may fill a local
blank. Reflections are plain text, max2,000 UTF-16 code units each; no private text
is sent in HTTP requests, events to the data collector, repository or URL.
The export date uses Asia/Shanghai. A directory older than
30 days triggers an explicit check-the-original reminder when JavaScript is active;
invalid/future check dates do not become freshness claims. Without JavaScript,
source links, native disclosures, tutorials and the stated check date still read.

## Automatic metadata, separately labelled

`_data/observatory_feeds.json` registers seven public RSS/Atom feeds and their
allowed feed/article hosts, source identity and caveats. `tools/observatory/`
uses Python/Node standard libraries: HTTPS and bounded manual redirects, a
20-second fetch deadline, 2 MiB decoded XML, 3,000 parsed entries and 50 retained
entries per source/run. Only title, link and source dates are extracted. DTD,
entity declarations and UTF-16/32 are rejected; descriptions/bodies are ignored.
Known tracking parameters/fragments are removed without rewriting meaningful
query bytes. IDs are SHA-256 of canonical source URLs; source-supplied invalid,
timezone-free or >24-hour future publication dates remain explicitly unverified.

ETag/Last-Modified and 304 reduce repeat downloads. 429 Retry-After defers requests
(capped at 24h); access denials are recorded rather than bypassed. An empty readable
feed is distinct from failure. Partial success retains old records and per-source
last-success dates. All failures still write health, then fail the workflow.
The collector prevents duplicate fetches within an hour; it never silently clears
an unreadable/invalid archive and never edits curated `checked_on` dates.

`observatory-data` is an independent data-history branch, containing:

- `feed/status.json`: small polling receipt and SHA-256 of the parsed index JSON.
- `feed/index.json`: latest60 changed metadata, source health, day index, last8 runs.
- `feed/archive/YYYY-MM-DD.json`: all records first collected that Shanghai day.
- `feed/runs/YYYY-MM.json`: run receipts, additions/revisions and failed source IDs.

Each record retains source publication/first-seen/changed times, a revision count
and the latest10 previous metadata versions. Git commits preserve earlier public
snapshots. First-seen dates do not move on corrections. The initial backfill is
not presented as newly published news. There is no article/full-text archive,
coverage guarantee, generated summary or automatic source_checked promotion.
Source IDs/identity/host sets are archive contracts; changing or removing a source
requires an explicit archive migration, not deleting old records to pass checks.

The bundled `_data/observatory_stream.json` is from actual Actions collection,
not illustrative headlines. A real Jekyll build guard validates host/source/ID,
needs_review and date fields before no-JS links are rendered. The client validates
remote index/status/archives too, with 12-second requests and 8 MiB JSON limits.
Root/project preview uses `relative_url` for its bundled fallback. Remote public
JSON GETs omit credentials and referrers; no reading state accompanies them.

The page checks status every five minutes while visible/online (no automatic
polls with Save-Data), and on a due return to the tab. It keeps the existing list
until explicit apply, preserves selection/typed notes and reports a snapshot older
than six hours. Publisher timestamps and first collection are separately shown
in Asia/Shanghai. Archive queries validate date/count/path and retain old content
on failed HTTP, format or digest checks. Browser fixtures test these failure paths;
actual source availability is independently evidenced by Actions runs.

## Enabled operation without changing production

The trusted `.github/workflows/observatory-refresh.yml` is on `observatory-ops`.
It runs on a narrowly scoped push/manual dispatch and writes only `observatory-data`
through normal commits/pushes, with serialized concurrency and contents:write.
It has no Pages deployment permissions or private-note input.

GitHub only enables scheduled workflows from its default branch. This repository's
default branch was not changed or merged, so the included cron is a future fallback,
**not the currently active scheduler**. The enabled task **更新 Brook 前沿观察台**
uses connected GitHub tools approximately every two hours: check the public status
and ops run, read the current trigger blob SHA through the Git tree API, then update
only `_data/observatory_trigger.json` on `observatory-ops` with a real requested_at.
Skip an attempt/request under90min or an already active run. Trigger/workflow/all-
source failures require accurate owner notification; ordinary successes stay quiet.

The contents-tool trigger and collector were actually run. See the iteration report
for receipts. There is one enabled recurring task; maintenance can find/pause it by
title in ChatGPT Tasks. If later enabling native cron on the default branch, remove
the redundant task after verifying the native run. Do not auto-merge to enable it.
Workflow dispatch can be run from the ops branch for manual recovery; the one-hour
duplicate lease still applies. Website PR and production publishing are separate.
