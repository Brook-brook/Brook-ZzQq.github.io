# Study authoring and publication

Study remains a static collection, not a news reader or CMS. Add independent
writing to `_atlas_notes/`; existing `/knowledge/:name/` URLs are retained.

## Tutorial defaults

Old notes without `kind` remain laboratory tutorials. New tutorials may use
`kind: tutorial`. Keep title, summary, category, date and the atlas layout.
`lab_url` is optional: only a real destination earns an experiment link. Categories
come from actual public records in both Study and Knowledge; search also includes
Study tags and research repository names. Home latest notes use the same collection.

## Research metadata

See `_atlas_notes/bestblogs-research.md` for an actual source-based note. Required
fields for `kind: research` and `review_status: source_checked`:

| Field | Meaning |
| --- | --- |
| source_repo | Absolute HTTPS repository URL, no embedded credentials |
| source_commit | Full 40- or 64-character lowercase hexadecimal Git commit |
| analyzed_at | ISO date of the analyzed snapshot |
| reviewed_at | ISO date of evidence cross-checking, not earlier than analysis |
| sources | Nonempty list of title + absolute HTTPS url |
| ai_assisted | Explicit YAML true/false; disclose assistance without inventing authorship |

`source_checked` means the public evidence was cross-checked. It is **not** a claim
that Brook personally reviewed every conclusion, that upstream endorses the note,
or that publication has been authorized. Do not write `reviewed_by: Brook` for an
agent-assisted audit. Keep A/B/C/D evidence distinctions in prose, identify static
inferences, and link original files/lines at the actual fixed commit. Recheck
licenses before copying any implementation or assets; independent summary and
source links do not grant a repository-wide license.

## One publication boundary

`_plugins/atlas-note-publication.rb` runs at Jekyll `site:post_read`, before
indexes, sitemap, rendering and writing. It removes `published: false`,
`draft: true`, and research without `source_checked` from `atlas_notes.docs`.
This also applies with `--unpublished`; it is not enough to hide a card in Study.
A checked research note with missing/invalid provenance fails the build. Unknown
kind values and quoted strings masquerading as publication booleans are rejected.

Use real YAML booleans, not `"false"`. Draft material may remain in ignored work/
or as excluded collection records. The existing Actions build runs normal Jekyll;
`--safe` disables custom plugins and must not be used as an equivalent build.
Do not publish the raw repository checkout, which can expose source/drafts and
cannot compile Liquid/styles. This hook is a static publication safeguard, not an
identity/authorization system. An owner can edit source; PR approval and deployment
remain separate decisions. Existing workflows and Pages source are unchanged.

Real-build tests in `tests/study-publication.rb` verify direct output, all collection
consumers, generator access, `--unpublished`, metadata failures and cleanup when a
previously generated note is demoted. Run `npm run test:study:build` with the existing
Ruby/Jekyll environment, alongside normal build/link/browser checks.

## Local research experiment

`/playground/research/` accepts editable, bounded RSS 2.0 or standard Atom samples.
Only title and absolute HTTP(S) link are extracted. It does not implement full
feed specs, xml:base, relative link resolution, content extraction or semantic
article deduplication. Input is in page memory, never fetched, persisted or uploaded.

URL rules are visible: WHATWG host/default-port normalization, fragment removal,
and optional removal of utm_*, fbclid and gclid. Retained query bytes/order stay
intact. Some sources/signatures depend on query fields, so inspect source rules
and disable tracker removal where needed. URL equality is not content equality.

The exported JSON has null summary/score and `needs_review`; no AI was run.
Changing input/rules or encountering an error invalidates prior output/download.
The author must still check facts, permissions and suitability before turning a
record into public writing. The lab does not offer a fake approve/publish action.
