# Brook’s Digital Universe design system: Obsidian Glass

Iteration 5 keeps the fourth-round lavender system and broadens the product
into an open personal digital garden. `design.md` locks that direction. Home
uses a real tutorial notebook, selected work, reading index and factual build log;
Study and Projects use content-index layouts. Campus is one work, not the
umbrella identity.

Iteration 4 built on the lavender system. Hallmark 2.0.0 provides the audit,
redesign and render gates; the user’s supplied brand sets the visual material.
Explore is an application screen: show the real point atlas before supplementary
learning links. Do not reintroduce a large marketing hero or decorative orbit.

## Runtime practice (Iteration 21)

Agent runtime is an app screen, with a current action on one light-glass surface
and adjacent unboxed evidence. Draft parameters, proposal/dispatch/receipt counts,
explicit stopped states and native event details each have a distinct job. On
phone the evidence follows the action; a real anchor reaches it. No continuous
loop, status toast, new font or blur stack. Preserve the original Mote as a small
self-explanation invitation rather than a product mockup.

Controls precede supporting counters so the initial action fits the 1280×800
desktop fold. Errors use explicit language and weight, without a decorative
stripe. A finite 320ms evidence settle uses transform/opacity and cancels on a
live reduced-motion change. Native details hold source tables, complete JSON
and the optional local Python extension.

## Evidence selection (Iteration 22)

Retrieval is an app screen: unboxed candidates face one light-glass context
surface. Actual fragments, versions, local action feedback and source anchors
are the visual content. Compact task labels avoid duplicating the full applied
question; native details hold ranking rules and budgets. Metrics support the
fragments instead of becoming oversized achievement counters.

Search controls share52px at normal text, using em-aware height so larger text
grows them equally. Candidate buttons keep focus on selection. A context anchor
shares the action row on phone, and budget failure appears directly beneath it.
Whole evidence stays readable without animated scrolling; only a finite220ms
context settle uses opacity/transform and cancels under reduced motion. No new
palette, nested glass, font, idle effect or UI runtime.

## Article questions and code reading (Iteration 23)

Article footers lead with the actual first question and retain route links.
Native optional alternatives expose the other authored angles/focuses, with
existing lab destinations only. A labelled TOC jump focuses the same landmark;
one-question notes stay simple and unmapped notes get no invented control.
The short utility heading avoids an orphaned phone line. No card is added around
each question or generated recommendation, and no private state is read.

Code gets one surface and one keyboard scroll region. Scoped Rouge resets remove
inherited data-table borders, multiple pre paddings and inner tab stops; quiet
line numbers remain visible, with presentational table/gutter semantics. Numbered
layout tables live in a named scroll group, outside pre/code; the group avoids
many identically labelled region landmarks. Non-numbered pre/code stays native. Plain
data tables are untouched. Keep literal code, long-line scroll, both themes,
320px/large text and visible focus. A1px native-choice press cancels under live
reduced motion; no JS or animation runtime was added for this widget.

## A real project action (Iteration 24)

Keep the two foundation route lists and add one compact building section, reached
by a native opening jump. Original guides are reading pages, with genuine file
roles, commands and contract cases, not fake terminal windows or product cards.
A real note artifact belongs before its TOC, with a44px native download and the
actual Python/dependency/offline conditions. No artifact means no empty button.
Escape metadata and fail the build for nonexistent, excluded or unsafe targets.

Long shell commands use valid continuation lines where useful; keep one labelled
keyboard code-scroll group and full copyable syntax. Do not hide clipped command
arguments behind padding or suppress the design gate. Initial download discovery
was too late on phone and is now visible in the first viewport. Keep the shared
lavender tokens, native states, instant focus and reduced-motion press fallback.

## Source of truth

`assets/css/atlas-tokens.css` defines colors, font stacks, spacing, type, easing,
durations, depth and shared aliases. `obsidian.css` owns the common shell and
Explore. `campus.css` remains a compatibility import. Other labs retain their
existing layouts in `atlas.css`, with the same shared palette. The old blog uses
`atlas-legacy.css` aliases. No runtime UI or motion library was added.

| Role | Dark | Light |
| --- | --- | --- |
| Base | `#080710` | `#F3EFF9` |
| Elevated | `#181225` | `#EAE2F3` |
| Surface | `#211A32` | `#E3DAEE` |
| Accent | `#A78BFA` | `#6941A5` |
| Soft accent | `#D8C9FF` | `#684096` |
| Primary text | `#F5F1FF` | `#241A35` |
| Secondary text | `#B8AECF` | `#61516F` |

Body and UI use the local system sans stack (Avenir Next / Segoe UI / system-ui).
Monospace is reserved for coordinates and code. No external font requests.
Labels are sentence case and untracked. Heads have one color, style and weight.
Spacing comes from the Hallmark scaffold’s 2/4/8/12/16/24/40/64px rhythm.
Three font weights at most. Data and coordinates use tabular figures.

## Glass is hierarchy

| Depth | Job | Desktop blur | Phone blur |
| --- | --- | --- | --- |
| Light | Navigation dock, map controls and layer toggles | 10px | 6px |
| Medium | Search, category filters and source list | 18px | 8px |
| Heavy | Selected place detail | 24px | 12px |

An opaque `--glass-solid` fallback comes first. Only `@supports` enables translucent
fills and blur, including Safari’s prefixed property. Phone panels lose large
shadows. Edge highlights, reflected light and fills vary by depth, but no filter
covers the moving map or an entire viewport. Never nest repeated bordered cards.
Do not add gradients behind headings or continuous ambient motion.

## Campus structure and honesty

The geographic reference grid and six verified WGS84 points are the visual stage.
Coordinates, point fitting and non-geographic callout offsets retain their existing
model. Lines lead back to the true representative point. No guessed roads,
footprints, building entrances or location tracking. Keep official-map and
ODbL/source links, the non-basemap explanation, and unverified-category empty states.

Desktop: compact heading, source list, map, selected detail in reserved map space.
Detail layout is synchronized before reprojecting, so navigation restores the view.
Phone/tablet: map first, then the searchable source list; detail becomes an inline
sheet below the map without covering controls. A source list is a navigation
landmark, its scrolled entries remain keyboard reachable. A closed source list
gets a visible map focus fallback when its detail closes.

## Motion

- Calm state feedback uses 120 / 220 / 420ms and `cubic-bezier(.22,1,.36,1)`.
- No scroll-triggered content reveals on the app screen. A finite 500ms grid settle
  remains; the grid is coordinate reference, never a particle background.
- Selected marker scales to 1.12 and rotates 6 degrees; labels and pressed states
  remain meaningful without motion. No continuous pulse.
- One magnetic primary CTA moves at most 4px per axis, with a local pointer-follow
  lavender fill. Mouse/fine pointers only; pointerleave/cancel reset it.
- Detail and list state changes use finite transform/opacity feedback. Global
  reduced-motion changes cancel running Web Animations and clear pointer offsets.
- Glass dock indicator moves using translate/scale, never animated width or layout.
  Hover/focus preview returns to the current route. Native links and cross-document
  View Transitions preserve browser history; unsupported browsers navigate normally.
- Focus outlines appear immediately, without animated outline/border geometry.
- No idle animation loop; `requestAnimationFrame` is scheduled only by interaction.

## Verification contract

Run the existing model, browser and Python suites. New Obsidian checks cover
320/390/768/1440/1920px, map-first visibility, unobstructed selected controls,
actual label visibility, detail closure under layer changes, focus restoration
with a collapsed list, and the opaque fallback with `@supports` blocks removed.
Hallmark render checks eight widths, and emits five screenshots. Always inspect
the actual images, run an independent finish review, fix concrete findings, and
record original warnings/waivers instead of claiming an unexecuted pass.


## Fifth-round content and interaction layers

`universe.css` scopes the personal Home and content indexes. Their 1280px reading
container overrides the same shared container token; the full map retains its
wider workspace. Breakpoints remain 60rem for layout, 40rem for phone type and
65.625rem for the shared menu. Do not create per-project color themes.

The notebook is a real four-panel tutorial excerpt selector with proper tab roles,
roving tabindex, Arrow/Home/End keys, article links and experiment links. It does
not claim to execute code. All excerpts remain readable without JavaScript.
Study categories derive from collection metadata; search/empty states reuse the
shared filtering code. Native project disclosures reveal record-specific details
and keep planned records free of false demo controls.

A single featured product image has local pointer light, driven by the existing
fine-pointer/reduced-motion-aware controller. No map or Python interpreter is
embedded on Home: its actual map capture is lazy-loaded. The social image is also
a real capture of the fifth-round Home, not a fabricated interface or stock photo.

Use `_data/projects.yml` optional fields and generic includes for new work rather
than writing rigid technology categories into navigation. Build records describe
real website changes, not inferred personal study progress or life events.


## Sixth-round research and data learning

Study adds separate native pressed-button groups for content type and category,
a keyword field, shareable query state and a reset action. Research provenance
uses typography and a native disclosure, with wrapping full commits and source
links. It is not another card grid or an approval badge. Tutorials retain the
same layout and only show experiment links when a real lab_url exists.

The new RSS/Atom lab is an app screen inside the existing shell. Source and JSON
use the code face, while controls and explanations use the body face. Row labels
explain retained/duplicate/invalid decisions in text; counts derive from actual
input. No new color tokens, blur stacks, idle motion or visualization libraries.
Errors identify/focus the XML field; edits clear stale output and disable export.
No-JS keeps the sample, limitations and reading paths accessible.

## Iteration 7: lavender garden

The latest user preference softens Obsidian into deep purple and milk-lavender.
Current tokens supersede the earlier color table: night #171127, elevated #231A39,
action #C3A5F5, soft accent #E3D4FF; light #F5EFFC, action #71439F. Text remains
high contrast; semi-transparent layers retain solid fallbacks. lavender.css adds
rounded actions and a quiet tonal canvas without changing page structures.
Reduced transparency removes backdrop filters; mobile keeps existing lower blur.
The existing Mote greets readers inside the working notebook, without idle motion.

## Iteration 8 learning routes

Learning paths retain the milk-lavender/deep-purple tokens and soft controls.
A compact Mote/resume panel reflects explicit local records, not an invented
achievement. Four native anchor links lead to ruled step lists; no locked modules,
streaks, fake grades or repetitive dashboard cards. Native disclosures keep journal
fields optional. Mobile navigation wraps and the desktop route index is sticky.
All questions and resources remain readable without JavaScript; record controls
appear only when the local client is ready. Storage failure and import conflicts
have text feedback, not color-only states. Keyboard, 16px journal fields and
reduced-motion support remain required.

## Iteration 9 reading observatory

Observe is a reading room in the same lavender garden. A typographic opening leads
to four ruled briefings, two method tutorials and a searchable source index. Avoid
company logos, stock imagery, trust scores and decorative live-status indicators.
One bounded sticky glass desk supports explicit collection and plan export; phone
layout follows the same DOM/focus order with no nested scrolling. Keep the main
download action above the list so it remains discoverable as the collection grows.
Metadata and disclosures explain source/version/limitations, rather than implying
that official, corporate or popular material is automatically verified truth.
Counts describe selected materials only. Native controls, text feedback and no-JS
reading remain usable with reduced motion and the existing opaque glass fallback.

## Iteration 10: living bibliography

The automatic stream precedes curated reading without adopting a news dashboard.
A single light-glass status strip explains actual attempts and partial failures;
ruled headline rows keep source, publication and first collection separate. A quiet
side ledger discloses publisher health and run receipts. Use existing lavender
tokens, type and 44px controls, with 16px editable/select fields. Phone filters
share two columns under the full-width search so content arrives sooner.

New data is a pending, explicit apply action, never an animated list replacement
while reading or typing. Native details expose source limits/revisions and optional
private reflections. No idle motion, infinite scrolling, new blur stacks, authority
scores, company logos or artificial urgency. Eight rows per batch; load-more sends
focus to the first added link. Reduced motion/solid glass fallbacks remain shared.

## Iteration 11: a room for understanding

A native dialog provides one heavy-glass reading sheet, with opaque header/footer
and a single scrolling body. Desktop separates the local library from the writing
area; phone/tablet collapse library tools under a native disclosure. Source identity,
saved version, actual reading question and optional evidence lens lead into the
editor. Comparison is a native disclosure, not a third dashboard column.

Keep 16px editable controls, 44px actions, high-contrast placeholder text and the
same Mote for an honest empty list. Source caveats stay discoverable without using
multiple duplicate introductory paragraphs. Opening has one finite transform/
opacity entry; reduced motion removes it. Native Escape/focus restoration and a
visible save-status footer take priority over close animations. No idle glow,
new blur stack, AI answer, authority score or inferred learning achievement.


## Iteration 12: follow a public thread

Search is a utility in the shared shell, outside the seven primary destinations.
A native heavy-glass sheet uses one scrolling result region; ruled rows label
notes/routes/labs/projects/pages. Types are pressed buttons; input is 16px and
controls are at least 44px. Empty states reuse Mote; failures offer retry and a
complete static directory. No new blur layer or idle motion. A finite 420ms entry
respects reduced motion. Narrow headers compact the wordmark, retaining the full
accessible name and existing 1051px menu boundary.

Home links the four real routes in a ruled list after the notebook, before featured
work, rather than repeating the notebook tabs or adding a dashboard. Counts mean
self-check questions only. Projects gets one quiet filter surface, retaining the
existing distinct project rows, native detail disclosures and truthful statuses.


## Iteration 13: finding the matching words

Search retains one heavy-glass sheet, ruled results and the milk/deep lavender
palette. Small numeric type counts reserve digit space. A single clear action
sits alongside the result count; the default state keeps its geometry and disables
it. Explicit alternative spellings appear as quiet explanatory text, not an AI
badge. Original matched words use a lavender mark with a fine lower edge; titles,
summaries and detail labels remain readable without highlights.

The dialog adds eight rows at a time without navigating away or fetching more.
Empty states offer another content type with the current query, or actual indexed
starter topics. No autocomplete overlay, new blur depth, idle motion or new theme.
Keep 44px actions, 16px inputs, visible focus and finite reduced-motion behavior.
The bounded sheet keeps its geometry across result counts; its body fills the
remaining space. A new query resets the batch and body scroll, while continuation
focuses the next result. Preserve ordinary inline text flow inside links so marks
do not collapse surrounding spaces; keep the real Range/geometry regressions.


## Iteration 14: inspect the denominator

Evaluation is a teaching workbench within the shared shell. A compact headline
leads to one light-glass parameter strip, then a real confusion matrix and a flat
metric ledger; avoid a dashboard card grid. Lavender marks distinguish filled
predictions; truth uses circle/square shapes and row labels, with a full text
sample table. No real geography or model-score branding.

Immediate TP/FP/FN/TN feedback sits by the threshold. Undefined metrics are an em
 dash with a visible denominator explanation. The sample region is focusable and
labelled for horizontal scrolling, while the page remains within the viewport.
Native range/select/button controls stay at least 44px; selects use 16px text.
SVG and tables have reading alternatives and no continuous animation. Mote is a
quiet next-question prompt, not a progress or mastery claim.

## Iteration 15 spatial validation

A single light-glass parameter strip precedes two comparable, unframed planar SVGs.
Circle/square encode train/test, fill encodes the true binary label, a diamond
identifies the inspected test point, and finite dashed lines connect its actual
training neighbors. Text/metrics/tables carry all evidence without color dependence.
No invented geographic basemap, point-drag claims or idle marker animation.
Native group/sample selectors and direct-to-evidence buttons keep the tiny chart
marks illustrative instead of pretending to be touch targets. On phones, plots
stack at readable scale, controls stay 16px/44px+, and original tables scroll in
named keyboard regions. Both themes reuse shared tokens; no extra blur layer.

## Iteration 16 one-question worksheet

The task is explaining one question, not monitoring a dashboard. A compact native
resume disclosure and a visible storage warning/backup link precede a single
light-glass question picker. Secondary route/note filtering is a native disclosure;
the worksheet stays visible while filters change. Question, optional explanation,
manual self-check, hints and counterexample have a deliberate reading order.
The public question directory takes full phone width when expanded; never squeeze
complete tutorial titles beside secondary links or replace them with clipped labels.

Only explicit question changes get one finite 320ms opacity/4px translation;
repeated changes cancel the previous effect, and a live reduced-motion change
cancels it. Typing, filtering and reference opening never trigger choreographed
motion. Use the shared rhythm tokens (composing existing steps where needed),
semantic colors, instant focus and 16px text fields. Data-matrix buttons may be
larger than ordinary controls to hold the outcome and auditable count.

Hallmark's bounded actual render/kept audit and fresh-context finish review are in
design-audit-iteration-16.md. This is a refinement of the locked material, with
no new theme, font, photo, dashboard shell or fabricated progress.

## Iteration 17 — proposal and receipt

The local Tool Calling page uses one light-glass editable proposal beside an
unboxed actual observation. On phone they follow the same DOM order. The active
stage, precise action label, local status and optional contract explain the state;
there is no simulated typing/thinking stream or idle loop. Native source details
retain attribution and a keyboard-scrollable table. Only an explicit computed
state change receives one cancellable 320ms/4px settle; reduced-motion changes
cancel it. Use the existing radius-card/radius-control tokens, never undefined
aliases. The AI entry retains its source-backed conceptual flow and Mercator link,
removes inert labels/italic fragment, and leads with the genuinely operable tool.

## Iteration 18 — a neighborhood of reasons

Knowledge uses the same Universe shell as Study, avoiding early Atlas global
header/article/details rules on the new layout. One light-glass selector leads
to an unboxed note and ruled reasons with actual destinations. The phone keeps
DOM order and a complete selected title; full article links may wrap to two lines.
Native details expose all connections and the retained foundation diagram. Its
600px conceptual canvas scrolls inside a labelled region, preserving 14px type
instead of scaling tiny labels. No physics layout, tracking or idle animation.

Explicit selection uses one 320ms/4px feedback and live reduced-motion cancellation.
Filters represent pressed states, not primary CTA fills. Keep closed native detail
children out of layout, and put the title/status count on separate lines so real
question punctuation is preserved. No-JS always exposes the complete directory.

## Iteration 19 — one ledger, two objectives

A compact title leads directly to group size/multiplier controls. One light-glass
contribution surface sits beside an unboxed payoff decomposition; on phone the
personal payoff and deviation gain sit immediately below the changed slider.
Other-player controls are native disclosure content, each with adjacent feedback.
The full player ledger and separate Nash/sum-optimal verdicts are textual; color
never substitutes for their meaning. Three comparison bars show real totals,
normalized only to those three profiles, with that changing scale disclosed.

Keep the same rounded controls, semantic tokens and instant focus. No idle glow,
particles, expensive blur layer or animated numerical counter. Bar changes use
finite transform transitions with reduced-motion fallback. A single original
Mote accompanies a genuine next question. Do not force a tall marketing hero.

Contextual article links use actual Knowledge row anchors as the no-JS fallback;
enhancement focuses the selected neighborhood for explicit incoming navigation.
Article search icons have scoped 20px geometry, zero figure margin/border, and a
non-wrapping label to avoid legacy SVG styling leaking into header controls.

## Iteration 20 — a task, then a learning path

AI learning is a native reading screen, not a progress dashboard. One compact
opening pairs the task with a light-glass local-start prompt. Two ruled routes
put their purpose next to an ordered sequence; phone stacks the same DOM. Each
step has its own authored focus even when reusing an article, plus genuine
experiment/self-explanation destinations and a native question disclosure.

Use balanced headings, spaced breadcrumbs, complete titles and shared tokens.
Keep the opening short enough to reach the first route without a tall hero.
One quiet Mote invites a real experiment; no fake mastery/counters, new fonts,
idle animation or extra blur surface. Native links get one-pixel press feedback,
removed with reduced motion. Closed disclosures leave no phantom content layout.

Let the header brand's visible text supply its accessible name, adding a hidden
home suffix. The compact visible name must remain accessible too. This avoids
responsive visible-label/aria-label mismatches rather than suppressing axe rules.

## Iteration 25 — a protocol you can run, a page you can read

Keep the native note layout and one early download with actual Python requirements.
The MCP lesson uses a short task title, an inspectable message path and a semantic
role table; code scrolls in one named keyboard group. Do not draw a fake connected
dashboard or add a browser model-Key field. A real stdio example is downloaded and
run locally. The initial long heading split a Chinese verb on desktop; shortening
it preserves the point and restores a clean title. No new blur, font or animation.
