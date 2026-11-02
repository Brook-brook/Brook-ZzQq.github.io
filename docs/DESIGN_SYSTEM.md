# Atlas design system

## Direction

A living atlas: editorial composition, cartographic linework and functional
experiments. Homepage uses a two-column geographic hero, three connected fields,
a large matrix feature and a compact note list. Projects use editorial rows;
knowledge uses a linked SVG map and searchable list. Avoid repeating card grids.

## Tokens

| Token | Dark | Light |
| --- | --- | --- |
| Canvas | `#101b24` | `#f2f3ec` |
| Panel | `#172631` | `#e5e9e1` |
| Text | `#edf1ec` | `#182c32` |
| Secondary | `#b0c0c7` | `#4c6268` |
| Accent | `#b8dfb4` | `#27604c` |
| Warm accent | `#e0b77d` | `#83521c` |

System sans for reading; Georgia for editorial emphasis; system monospace for
labels, code and measurements. No external font request. Layout max-width is
1200–1240px; reading columns stay narrower. Most sections use 32–48px spacing.

## Interaction

- Standard links for navigation, buttons for actions; minimum 44px control height.
- A visible keyboard focus ring and a skip-to-content link on every Atlas page.
- Mobile menu uses an expanded state; Escape closes it and restores button focus.
  Without JavaScript, navigation and notes stay visible.
- Theme follows system preference initially, then remembers explicit choice where
  localStorage is available. Storage failure does not break the site.
- Motion is limited to short color transitions under `prefers-reduced-motion:
  no-preference`. No continuous animation, particles or GPU-heavy 3D.
- Tables/code can scroll within their own region. Scrollable code is focusable.
  Labs and editorial rows become single-column on smaller screens.

## Assets

`assets/img/atlas/globe.svg` is an orthographic globe centered on 90°E, 22°N.
Coastlines derive from Natural Earth's `ne_110m_land.geojson`, public domain:
https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson
Graticules and the globe mark are generated vector artwork. Dots are decorative
illustrations, not personal locations. Source data is not a GIS analysis service.

`social.png` is a 1200×630 raster social preview generated from the same local
vector globe and brand typography. It is metadata-only, not a homepage download.
