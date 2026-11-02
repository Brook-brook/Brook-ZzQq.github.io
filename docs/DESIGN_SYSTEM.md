# Brook’s Atlas design system: Obsidian Glass

Iteration 4 builds on the lavender system. Hallmark 2.0.0 provides the audit,
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
