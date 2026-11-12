# Observatory curation and reading snapshots

The `/observatory/` page is a dated curated source directory and learning desk.
It does not fetch live news, score authority, run a model or copy article bodies.
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

Only an explicit toggle or starter action creates `brooks-universe.observatory.v1`.
The schema is `{version: 1, saved: [snapshot, ...]}`. Each snapshot preserves `id`,
title, HTTPS url, topic, item_type (`source` or `briefing`), version, checked_on,
question and caveat. These are public-material metadata, not typed personal answers.
The page does not write visit history, completion, scores or private user data.

Validation limits the list to 60 unique records and 256 KB of UTF-8 JSON, with
individual field bounds, strict shape/date checks and credential-free HTTPS URLs.
Past items no longer in the catalog remain usable/exportable, labelled historical.
Render strings as text and validate links; never render a stored title as HTML.

Blocked/corrupt/quota-limited storage and multi-tab changes preserve page memory
and export without claiming durable saving. Corrupt raw data stays untouched.
Button-adjacent text makes memory-only status visible where selection occurs.
Clearing needs native confirmation and removes only this key; theme, campus
favorites and the separate learning journal remain. There is no account or sync.

Export produces Markdown with the saved URLs, versions, check dates, original
reading questions/caveats and blank evidence/reflection prompts. It does not fill
in facts or answers. The export date uses Asia/Shanghai. A directory older than
30 days triggers an explicit check-the-original reminder when JavaScript is active;
invalid/future check dates do not become freshness claims. Without JavaScript,
source links, native disclosures, tutorials and the stated check date still read.
