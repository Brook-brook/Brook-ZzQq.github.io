fix

1. Broken labels layer — On desktop and phone, selecting “标签” marks the control pressed and adds `show-labels`, but every unselected label stays at computed opacity 0; raise the reveal rule above `html.has-js .pin-label` so the existing names actually appear.
2. Dismissed detail returns — After closing a selected place, changing a layer or clearing a filter can reopen that place’s detail without selecting a marker; keep detail state out of the `[data-place]` list-card selection so dismissal survives subsequent renders.
3. Finish / list discoverability — At 1280×800 the list exposes roughly one record and at 1440×900 only two, with little indication that more records continue inside the pane; retain the compact glass pane but make its existing vertical scroll affordance or a partial next record visible.

The stamp’s idea describes the page: the real, sourced six-point atlas is the first-screen subject and a working explorer, with a clear canvas/tool/detail hierarchy and restrained lavender glass. The largest gap is the nonfunctional labels layer, which prevents the map from explaining its own places when requested. No geography or proof has been fabricated. The selected panel remains legible at 1440 and becomes an in-flow panel at 375; the empty-category state truthfully explains missing coordinates. No hero or marketing-section rhythm gates apply to this app screen.

The old page did list scanning slightly better: its categories sat outside the sidebar, leaving room for about three visible place records at desktop size. The redesign makes the actual map and its controls substantially easier to reach, especially on a phone. The existing Geo/AI/Code destinations and factual source links remain present; the broad learning headings were already in the old content and do not justify requesting replacement copy.

Reviewed all five supplied after renders, the 1440 and 375 full before renders, and the running selected, empty-category and labels states at 1440 and 375. The 1440 full page was read in its first 900px and remaining lower screen. Runtime inspection confirmed all six label opacities remain 0 when the labels layer is pressed; selected-state inspection produced no page errors. The review did not edit product files.

Do not dilute the immediate, honest six-point atlas, restrained purple-black/lavender balance, readable selection detail, or the absence of invented roads and buildings while fixing.
