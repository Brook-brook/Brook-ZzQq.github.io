# Publishing Brook's Atlas on GitHub Pages

## Required setting

Open the repository's **Settings → Pages → Build and deployment → Source**.
Select **GitHub Actions**, not **Deploy from a branch**.

The source is Jekyll + Liquid, not a built HTML directory. Selecting the source
branch and publishing its root as static files skips the layouts. A page starting
with `--- layout: atlas ... ---` is unbuilt source, even if the deployment reports
success. The old `.nojekyll` marker caused the branch-based pipeline to skip Jekyll.
Removing it alone is insufficient: the site also needs the Node-built theme assets
and the Ruby/Jekyll toolchain, which the custom workflow supplies.

## Pipeline

`.github/workflows/pages.yml` runs automatically when
`feat/atlas-iteration-2` is pushed. It installs locked Node dependencies, builds
frontend assets, runs model checks, reads Pages metadata, builds production Jekyll,
checks internal links, then verifies and uploads only `_site<base_path>`.
The generated artifact gets `.nojekyll`; raw source does not.

For this project the public URL is:
https://brook-brook.github.io/Brook-ZzQq.github.io/

The uploaded directory itself contains `index.html` and `assets/`; do not upload
an extra parent folder containing `Brook-ZzQq.github.io` or the raw repository.

## First activation / retry

After changing Source to GitHub Actions, open **Actions → Deploy Brook's Atlas**.
If the latest run started before that setting was changed and failed, open it and
choose **Re-run all jobs**. No merge to `master` is needed. The workflow's first
push also starts a run automatically.

A run must finish both **build** and **deploy** successfully. Build-only CI and
an upload-only Pages run do not establish that the correct site is deployed.
After deployment, check the homepage, navigation, CSS, globe and Playground. If
an old page is cached, reload after the new deployment completes.

Automatic deployment currently targets only the branch Brook selected. When a
future review moves the production source to `master`, deliberately update the
workflow's branch trigger. Do not enable both legacy branch publication and a
custom Pages deployment as competing publishing mechanisms.
