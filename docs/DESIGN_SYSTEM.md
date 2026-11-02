# Atlas design system · Iteration 3

## Direction

Lavender Cyberpunk × Playful Geek × Soft Futurism. Default to a purple-black
canvas, restrained lavender accents, editorial type and cartographic reference
lines. A small SVG character, Atlas Mote, introduces warmth in the Explore hero,
loading, empty states and the closing note. No continuous particles or glass UI.
The original Geo/AI/Code labs and legacy Chirpy blog remain functional.

## Shared tokens

`assets/css/atlas-tokens.css` is shared by Atlas and the retained blog. Atlas's
older short token names alias these values; campus components use the full names.

| Token | Dark default |
| --- | --- |
| `--bg-primary` | `#090711` |
| `--bg-secondary` | `#151024` |
| `--surface` | `#211A32` |
| `--lavender-primary` | `#C4B5FD` |
| `--lavender-accent` | `#A78BFA` |
| `--lavender-light` | `#E9D5FF` |
| `--text-primary` | `#F5F3FF` |
| `--text-secondary` | `#B8AECF` |
| `--border` | `rgba(196,181,253,0.16)` |

Retain an optional global light mode in the same purple family; explicit choice
persists across Atlas and legacy blog pages. Default is dark, independent of OS.
System sans for reading; Georgia for editorial emphasis; system monospace for
coordinates and labels. No new font/CDN/UI-framework dependency.

## Motion contract

- Enter: 560ms, stagger 0/65/130ms, opacity and 18px translation. Observer reveals
  only once; content is never permanently hidden while awaiting JavaScript.
- Hero grid/orb: 680–700ms once, different timing from headings.
- Spring feedback: 180–450ms, `cubic-bezier(.2,.9,.25,1.18)`; button press scales
  to .96. Map selection/favorite feedback is one-shot and meaningful.
- Magnetic primary links: mouse/fine-pointer only, maximum 4px per axis. Tilt:
  maximum 2° per axis, only designated non-map cards. Pointer-follow light is
  local to the hovered element. No idle requestAnimationFrame loop.
- Menu entry: 340ms soft transition, native expanded state, Escape to close.
- Navigation: native same-origin View Transitions (140ms exit / 340ms entry),
  progressive enhancement. No interception, SPA router, blocking exit timer or
  custom history. Unsupported browsers navigate normally.
- Reduced motion: suppress CSS motion, skip/cancel Web Animations and reset pointer
  transforms. Coarse pointers do not receive magnetic/tilt effects. Map pan/zoom
  remains direct input rather than decorative motion.

## Campus map UI

Use a source-backed local point atlas rather than invented roads/building geometry.
Map UI: rounded frame, compact toolbar, responsive search/list, independent layers,
readout, keyboard/zoom controls, details, favorite feedback and Mote empty states.
Controls never tilt with the map. Nearby marker callouts can move visually; dashed
leaders point to the unchanged geographic representative point. Marker screen
size stays constant during zoom. The map state survives navigation in sessionStorage;
favorites use localStorage with an in-page fallback if storage is unavailable.

Mobile: map above the scrollable list, visible controls, single-column paths,
page vertical scrolling preserved over the map. Plain navigation, source cards
and official-map links remain available without JavaScript.

## Assets and provenance

- `mote.svg`: original vector character, not a real person or animal.
- `globe.svg`: retained orthographic Natural Earth coastline artwork, recolored
  lavender; geometry unchanged. Natural Earth data is public domain.
- `social.png`: matching purple raster social preview, not a homepage download.
- `_data/campus.yml`: six public OSM representative points, accessed through their
  Mapcarta source pages. See `CAMPUS_DATA.md` for licensing and exact sources.

Use the shared palette for new components. Do not reintroduce green surfaces or
an unrelated theme, fake data, indefinite movement, or pointer effects on map drags.
