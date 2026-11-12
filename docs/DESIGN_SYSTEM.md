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
