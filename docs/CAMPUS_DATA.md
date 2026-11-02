# Campus points: provenance and limits

The website previously had a globe and a Mercator learning demo, **not** a campus
map. The separate `Brook-brook/xxx-geospatial` repository was checked: at the time
it was an upstream Streamlit geospatial template, not verified campus data. No
personal project achievements are inferred from that repository.

Iteration 3 adds a small, locally served **point atlas** for Zijingang. The six
representative coordinates below were checked against public Mapcarta pages that
identify their OpenStreetMap source. This is source verification, not a field
survey, official campus GIS dataset, entrance location or live availability feed.
No description, hours, phone, photo or personal position was copied from those pages.

| Place | WGS84 longitude, latitude | OSM element | Readable source |
| --- | --- | --- | --- |
| 主图书馆 | 120.07561, 30.30534 | way/1208408934 | https://mapcarta.com/W1208408934 |
| 农医图书馆 | 120.08268, 30.29849 | way/448480118 | https://mapcarta.com/W448480118 |
| 北4教学楼 | 120.07166, 30.30766 | way/1112645053 | https://mapcarta.com/W1112645053 |
| 求是大讲堂 | 120.07473, 30.30430 | way/529029530 | https://mapcarta.com/W529029530 |
| 求是书院 | 120.07481, 30.30533 | node/11197016001 | https://mapcarta.com/N11197016001 |
| 湖心岛 | 120.08257, 30.30237 | way/445920824 | https://mapcarta.com/W445920824 |

Checked: 2026-11-02. Source names are geographic facts. Campus placement and
identity were cross-checked against the Zijingang context of the source pages;
a same-named 启真湖 in Xi'an was excluded because it is a different place.

Data © OpenStreetMap contributors, licensed under the Open Database Licence:
https://www.openstreetmap.org/copyright
https://opendatacommons.org/licenses/odbl/1-0/

The downloadable public JSON (`assets/data/campus.json`) is generated from
`_data/campus.yml`; each record retains its source and OSM ID. Dataset metadata
includes the license, checked date, CRS and limitations. This small curated extract
is openly distributed with those attribution/license terms; it is not a proprietary
campus dataset. Artwork/code remain under the repository license.

## Spatial semantics

Coordinates are mapped using the spherical Mercator formula and a uniform fit to
the view. This is appropriate for a small-area point visualization; no geodetic
distance/area measurement is offered. The screen grid is a visual reference grid,
not a surveyed cadastral or latitude/longitude graticule. No roads, lake outline,
building footprints, campus boundary or routes were invented. Moved callout icons
are visibly connected to the actual projected representative point by dotted lines.

Library points also appear under 学习空间; that does not claim particular rooms
or their availability. 食堂 and 宿舍区 deliberately have an explanatory empty state
until reliable points are added. All six source cards and the official map link
remain accessible when scripts/network/storage fail. No geolocation is requested.

Official campus map: https://map.zju.edu.cn/
Library identity reference: https://libweb.zju.edu.cn/39471/list.htm

## Updating

Add only verified records to `_data/campus.yml`, with unique stable ID, OSM ID,
source URL, WGS84 representative point and accurate categories. Do not derive
coordinates from an artistic map or silently mix GCJ-02/BD-09. Run model checks,
production build and campus browser tests. The runtime rejects invalid coordinates,
duplicate IDs and points outside the campus bounding box instead of guessing.
