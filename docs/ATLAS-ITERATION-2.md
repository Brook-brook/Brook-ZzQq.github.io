# Brook's Atlas — iteration 2

## Recovery and audit (2026-11-02)

- Repository: `Brook-brook/Brook-ZzQq.github.io`; clean local `work` branch at
  `ae677a8`, matching remote `master`. Remote has only `master`.
- No `feat/brooks-atlas`, Atlas source, PRs, or Actions runs were found.
  `git fsck --no-reflogs --unreachable` found no recoverable objects. This is
  the Chirpy 7.6 template, not a recovered first iteration. Other inaccessible
  old workspaces cannot be ruled out.
- Read README, contribution documentation, configuration, layouts, JS build,
  existing workflows and test script. No AGENTS.md exists in this workspace.
- Existing blog, template posts, components and homepage are preserved.
  The new experience is an additive `/atlas/` preview, with a blog sidebar entry.
- Existing Pages starter workflow is nested under `.github/workflows/starter/`
  and is not an active workflow. Active CI builds assets and Jekyll; CD and
  Publish workflows belong to the upstream theme release process. No deployment
  configuration is activated by this change.
- Live Pages URL cannot be verified: executor network policy rejects the
  `brook-brook.github.io` host (CONNECT 403). This does not prove the site is down.
  GitHub repository metadata and empty Actions history do not establish deployment.

## Scope and product status

Implemented in this branch, pending merge/release:

- Explore, Playground, Projects and Knowledge preview pages with shared navigation.
- Configurable prisoner/stag matrices, strategy selection, live payoffs,
  exhaustive pure-strategy equilibrium marking and total-welfare comparison.
  Boundary parameters are explicitly described; mixed equilibria are not computed.
- Four-step shallow/deep copy visualization: construction, copy, mutation and
  destruction. Stops at dangling pointer; never simulates a defined result for UB.
- Spherical Mercator local scale and area distortion, with a deterministic
  GIS-to-AI validation workflow. No real model or GIS service is called.
- Mobile single-column labs, locally scrolling code/table regions, keyboard skip
  link, visible focus, semantic controls/status, reduced-motion support.
- No added external runtime dependencies, fonts, tiles, analytics or AI requests.
  Browser testing dependencies are development-only.

Not implemented: Python execution, public goods, mixed-strategy solver, the full
C++ curriculum, real AI tool calling. No claims about `xxx-geospatial` are made;
no unverified repository is promoted. Public identity in new content is Brook.

## Technical debt and release decisions

- First-round design/code remains unavailable; recover it before reconciling the
  preview with any separately retained design. This branch does not replace home.
- The original blog retains upstream template identity/demo content and external
  dependencies. Review those before publishing a personalized homepage.
- Choose the production entry URL, Pages source and baseurl before enabling Pages.
  This work does not merge, publish, dispatch or enable a deployment.
- Browser checks cover WCAG rule automation, not a complete manual accessibility
  audit or screen-reader certification. No Lighthouse or real-device profiling.
- Python next: lazy-loaded Pyodide Worker, loading/error state, execution timeout,
  stop/reset, capped output and explicit browser-Python limitations.

## Validation

See the final validation record below. Local intermediate logs/screenshots remain
in ignored `work/`; implementation and tests are committed.

## Recovery evidence supplied later by Brook

A prior delivery screenshot identifies local commits `ec356b1` on
`feat/brooks-atlas` and `3bfb029` on `feat/interactive-learning-lab`, plus
`/workspace/previews/Brooks-Atlas-Mac-Preview.zip`. It explicitly says neither
commit was pushed to GitHub and the archive was not downloaded to the Mac.
The uploaded first-round task brief is requirements text, not source code.

Rechecked both commit IDs with `git cat-file`: neither exists in this object
database. The named branches and preview directory are absent. No alternate Git
object store is configured and this is not a shallow clone. Current workspace,
shared downloads and temporary locations did not reveal the prior archive.
Current reflog contains baseline initialization/reset activity and this round's
branch creation. This does not establish what happened to a separate old runtime.

Second-round expansion is paused while original artifacts are being located.
The additive preview is a separate checkpoint, not a recovery or replacement of
the original implementation. Frontend build, JS/SCSS lint and five model tests
passed. Jekyll and browser verification remain incomplete; Ruby dependency setup
hit a restricted index host and temporary container storage limits. This checkpoint
is not ready for release. Nothing has been deployed or merged.
