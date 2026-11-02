# Brook's Atlas roadmap

## Implemented in the review branch

- Home, Explore, Geo Lab, AI Lab, Code Lab, Projects, Knowledge, About.
- Responsive navigation, persistent dark/light mode, accessible no-JS reading.
- Four Markdown tutorials with metadata, TOC, code blocks and experiment links.
- Knowledge map, client-side search, category filtering and empty state.
- Prisoner/stag payoff labs and editable 2×2 pure-strategy Nash explorer.
- Four-step C++ shallow/deep copy visualization with valid lifetime semantics.
- Spherical Mercator local scale/area experiment and labelled GIS × AI workflow.
- Lazy Pyodide Worker with examples, real execution, errors, output cap,
  stop/reload and timeout. Runtime downloads only after the visitor requests it.
- Existing Chirpy blog/posts remain accessible; old Atlas preview routes redirect.
- Automated model and browser checks; build-only CI. No production deployment.

## Next useful increments

1. Public-goods game: explicit group size, contribution limits and social welfare.
2. C++ RAII/smart-pointer ownership examples; assignment and move semantics.
3. Map analysis with a verified dataset and CRS-aware distance/buffer operations.
4. Real GIS tool calling with permission boundaries, reproducible results and
   transparent execution logs. Current AI section is a concept demonstration.
5. Add verified personal projects after reviewing their actual source and state.

## Release preparation

Review the PR before merging. The default config targets the GitHub project URL
`https://brook-brook.github.io/Brook-ZzQq.github.io/`. For a different Pages path,
change `url`/`baseurl` and repeat the path tests. The nested starter Pages workflow
has not been activated; configure Pages only after explicit publication approval.

## Limits

No mixed-strategy solver, public-goods module, complete C++ course, real Agent,
backend storage or unverified external project is presented as completed. Pyodide
needs the pinned CDN at first load and is not a complete local Python environment.
Original theme demo posts remain labelled via the legacy blog entry; they are not
Brook's personal experience or newly authored learning notes.
