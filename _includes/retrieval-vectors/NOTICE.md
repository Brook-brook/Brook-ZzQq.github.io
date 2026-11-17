# Source and scope

Original AI-assisted Brook teaching code, fixed feature registry and fictional
manual corpus. MIT terms are in LICENSE.txt. No third-party algorithm source,
course text, font, logo, trained weight or package distribution is copied here.
The public corpus is the same original fixture used by the existing retrieval lab.

The transform uses raw count TF, smoothed natural-log IDF and L2 normalization.
The inspected official reference is scikit-learn main at
1a16a519abd16444af692c841e314d32a3b52a29 (2026-11-16):

- doc/modules/feature_extraction.rst, TF-IDF section;
- sklearn/feature_extraction/text.py, TfidfTransformer docstring and fit/transform;
- sklearn/metrics/pairwise.py, cosine_similarity definition and normalization.

Reference source: https://github.com/scikit-learn/scikit-learn/tree/1a16a519abd16444af692c841e314d32a3b52a29
Its actual COPYING is BSD-3-Clause, copyright2007–2026 scikit-learn developers.
The source is referenced, not repackaged or relicensed as this project's MIT code.

The fixed non-overlapping substring features are this project's own explicit
policy, not CountVectorizer's default analyzer or Chinese segmentation. Zero
norm gives undefined cosine/null here, whereas the inspected library convention
returns0. No general framework equivalence or semantic-retrieval claim is made.

Python3.11+ is required. The existing complete CPython3.11.18 license is retained
in licenses/CPython-LICENSE.txt; the interpreter is not included in this archive.
No library install, paid model service, remote host, private journal or user
credential is used by these scripts.
